<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Company;
use App\Models\Consignment;
use App\Models\ConsignmentMovement;
use App\Models\Invoice;
use App\Models\InvoiceAuditLog;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Services\ImageOptimizerService;
use App\Services\PdfGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    /**
     * Validar los campos de entrada de un documento fiscal.
     */
    private function validateInvoiceData(Request $request): array
    {
        return $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'client_id' => ['required', 'exists:clients,id'],
            'document_type' => ['required', 'in:factura,proforma,cotizacion,nota_entrega'],
            'document_subtitle' => ['nullable', 'string', 'max:100'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'offer_validity_days' => ['nullable', 'integer'],
            'sale_condition' => ['required', 'string', 'max:100'],
            'sales_channel' => ['nullable', 'string', 'max:100'],
            'bcv_exchange_rate' => ['required', 'numeric', 'min:0.0001'],
            'show_bs_conversion' => ['nullable', 'boolean'],
            'signature_stamp' => ['nullable', 'string', 'in:auto,china,corpoasia,none'],
            'show_bank_accounts' => ['nullable', 'boolean'],
            'selected_bank_account_id' => ['nullable', 'string', 'max:50'],
            'currency' => ['required', 'in:USD,VES'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'delivery_address' => ['nullable', 'string'],
            'shipping_terms_notes' => ['nullable', 'string'],
            'payment_terms_notes' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
            'technical_specs' => ['nullable', 'array'],
            'equipment_year' => ['nullable', 'string', 'max:100'],
            'equipment_vin' => ['nullable', 'string', 'max:100'],
            'customs_text' => ['nullable', 'string', 'max:100'],
            'payment_milestone_1_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_milestone_1_text' => ['nullable', 'string'],
            'payment_milestone_2_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_milestone_2_text' => ['nullable', 'string'],
            'company_social_handle' => ['nullable', 'string', 'max:150'],
            'pdf_format' => ['nullable', 'in:formato-1,formato-2'],
            'show_item_images' => ['nullable', 'boolean'],
            'show_totals' => ['nullable', 'boolean'],
            'show_suggested_price' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:emitida,borrador,anulada,pagada'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.details' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.suggested_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.image_url' => ['nullable', 'string'],
            'items.*.is_tax_exempt' => ['nullable', 'boolean'],
            'items.*.show_image' => ['nullable', 'boolean'],
        ]);
    }

    /**
     * Calcula los totales fiscales y multimoneda de un conjunto de renglones.
     *
     * @return array{subtotal: float, tax_amount: float, total_usd: float, total_ves: float}
     */
    private function calculateInvoiceTotals(
        array $items,
        float $taxRate,
        float $shippingCost,
        float $discount,
        float $bcvRate
    ): array {
        $subtotal = 0.0;
        $taxableBase = 0.0;

        foreach ($items as $itemData) {
            $qty = (float) ($itemData['quantity'] ?? 0);
            $price = (float) ($itemData['unit_price'] ?? 0);
            $itemTotal = round($qty * $price, 2);
            $subtotal += $itemTotal;

            if (empty($itemData['is_tax_exempt'])) {
                $taxableBase += $itemTotal;
            }
        }

        // El descuento comercial rebaja la base gravada proporcionalmente antes de liquidar el IVA
        $netTaxableBase = max(0, round($taxableBase - ($taxableBase > 0 ? min($discount, $taxableBase) : 0), 2));
        $taxAmount = round(($netTaxableBase * $taxRate) / 100, 2);

        $totalUsd = max(0, round($subtotal + $shippingCost - $discount + $taxAmount, 2));
        $totalVes = round($totalUsd * $bcvRate, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'tax_amount' => $taxAmount,
            'total_usd' => $totalUsd,
            'total_ves' => $totalVes,
        ];
    }

    /**
     * Construye el array de atributos financieros y metadatos técnicos para crear/actualizar.
     */
    private function buildInvoiceAttributes(Request $request, array $validated, Company $company): array
    {
        $shippingCost = (float) ($validated['shipping_cost'] ?? 0);
        $discount = (float) ($validated['discount'] ?? 0);
        $taxRate = (float) $validated['tax_percentage'];
        $bcvRate = (float) $validated['bcv_exchange_rate'];

        $totals = $this->calculateInvoiceTotals($validated['items'], $taxRate, $shippingCost, $discount, $bcvRate);
        $subtotal = $totals['subtotal'];
        $taxAmount = $totals['tax_amount'];
        $totalUsd = $totals['total_usd'];
        $totalVes = $totals['total_ves'];

        $rawSpecs = $validated['technical_specs'] ?? [];
        $specsList = array_is_list($rawSpecs) ? $rawSpecs : ($rawSpecs['specs'] ?? []);

        $hiddenImageOrders = [];
        foreach ($validated['items'] as $idx => $it) {
            if (array_key_exists('show_image', $it) && ! $it['show_image']) {
                $hiddenImageOrders[] = $idx + 1;
            }
        }

        $isConsignment = (
            $validated['document_type'] === 'nota_entrega'
            || strcasecmp((string) ($validated['sale_condition'] ?? ''), 'Consignación') === 0
            || str_contains(strtolower((string) ($validated['sale_condition'] ?? '')), 'consign')
            || str_contains(strtolower((string) ($validated['payment_terms_notes'] ?? '')), 'consign')
        );
        $defaultShowTotals = ! $isConsignment;
        $defaultShowSuggested = $isConsignment;

        $technicalSpecs = [
            'specs' => $specsList,
            'pdf_format' => $validated['pdf_format'] ?? 'formato-1',
            'show_bs_conversion' => $request->boolean('show_bs_conversion', true),
            'show_totals' => $request->has('show_totals') ? $request->boolean('show_totals') : $defaultShowTotals,
            'show_suggested_price' => $request->has('show_suggested_price') ? $request->boolean('show_suggested_price') : $defaultShowSuggested,
            'show_item_images' => $request->boolean('show_item_images', true),
            'hidden_image_orders' => $hiddenImageOrders,
            'signature_stamp' => $validated['signature_stamp'] ?? 'auto',
            'equipment_year' => $validated['equipment_year'] ?? null,
            'equipment_vin' => $validated['equipment_vin'] ?? null,
            'customs_text' => $validated['customs_text'] ?? null,
            'payment_milestone_1_pct' => $validated['payment_milestone_1_pct'] ?? null,
            'payment_milestone_1_text' => $validated['payment_milestone_1_text'] ?? null,
            'payment_milestone_2_pct' => $validated['payment_milestone_2_pct'] ?? null,
            'payment_milestone_2_text' => $validated['payment_milestone_2_text'] ?? null,
            'company_social_handle' => $validated['company_social_handle'] ?? null,
        ];

        $data = [
            'company_id' => $company->id,
            'client_id' => $validated['client_id'],
            'document_type' => $validated['document_type'],
            'document_subtitle' => $validated['document_subtitle'] ?? null,
            'issue_date' => $validated['issue_date'],
            'due_date' => $validated['due_date'] ?? null,
            'offer_validity_days' => $validated['offer_validity_days'] ?? null,
            'sale_condition' => $validated['sale_condition'],
            'sales_channel' => $validated['sales_channel'] ?? 'Oficina',
            'bcv_exchange_rate' => $bcvRate,
            'currency' => $validated['currency'],
            'payment_method' => $validated['payment_method'] ?? 'PAGO MOVIL',
            'payment_reference' => $validated['payment_reference'] ?? null,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'discount' => $discount,
            'tax_percentage' => $taxRate,
            'tax_amount' => $taxAmount,
            'total_usd' => $totalUsd,
            'total_ves' => $totalVes,
            'delivery_address' => $validated['delivery_address'] ?? null,
            'shipping_terms_notes' => $validated['shipping_terms_notes'] ?? null,
            'payment_terms_notes' => $validated['payment_terms_notes'] ?? null,
            'terms_conditions' => $validated['terms_conditions'] ?? $company->default_terms,
            'technical_specs' => $technicalSpecs,
        ];

        if (Schema::hasColumn('invoices', 'show_bs_conversion')) {
            $data['show_bs_conversion'] = $request->boolean('show_bs_conversion', true);
        }

        return $data;
    }

    /**
     * Persiste los renglones de la factura procesando sus imágenes opcionales.
     */
    private function persistItems(Invoice $invoice, array $items): void
    {
        foreach ($items as $index => $itemData) {
            $itemTotal = round((float) $itemData['quantity'] * (float) $itemData['unit_price'], 2);

            $imageUrl = $itemData['image_url'] ?? null;
            if (is_string($imageUrl) && str_starts_with($imageUrl, 'data:image/')) {
                $optimized = app(\App\Services\ImageOptimizerService::class)->optimizeBase64Image($imageUrl, 'items');
                if ($optimized !== null) {
                    $imageUrl = $optimized;
                }
            }

            $itemDataToCreate = [
                'invoice_id' => $invoice->id,
                'item_order' => $index + 1,
                'description' => $itemData['description'],
                'details' => $itemData['details'] ?? null,
                'image_url' => $imageUrl,
                'quantity' => (float) $itemData['quantity'],
                'unit' => $itemData['unit'],
                'unit_price' => (float) $itemData['unit_price'],
                'total' => $itemTotal,
                'is_tax_exempt' => ! empty($itemData['is_tax_exempt']),
            ];

            if (Schema::hasColumn('invoice_items', 'suggested_price')) {
                $itemDataToCreate['suggested_price'] = isset($itemData['suggested_price']) && $itemData['suggested_price'] !== '' && $itemData['suggested_price'] !== null ? (float) $itemData['suggested_price'] : null;
            }

            if (Schema::hasColumn('invoice_items', 'product_id')) {
                $itemDataToCreate['product_id'] = ! empty($itemData['product_id']) ? (int) $itemData['product_id'] : null;
            }

            InvoiceItem::create($itemDataToCreate);
        }
    }

    /**
     * Determina si este documento y estado deben descontar/afectar existencias en inventario central.
     * Solo Facturas Fiscales y Notas de Entrega emitidas/pagadas descuentan stock (las cotizaciones/proformas no).
     * Si la factura es una venta de consignación previamente entregada, no vuelve a descontar.
     */
    private function shouldAffectInventory(string $documentType, string $status, array $specs = []): bool
    {
        if (! empty($specs['is_consignment_sale'])) {
            return false;
        }

        return in_array($documentType, ['factura', 'nota_entrega'], true)
            && in_array($status, ['emitida', 'pagada'], true);
    }

    /**
     * Ajusta el inventario de los productos vinculados ($direction = -1 descuenta, +1 restaura).
     */
    private function adjustInventoryForItems(iterable $items, int $direction): void
    {
        if (! Schema::hasTable('products') || ! Schema::hasColumn('products', 'track_inventory')) {
            return;
        }

        foreach ($items as $item) {
            $productId = is_array($item) ? ($item['product_id'] ?? null) : ($item->product_id ?? null);
            $qty = is_array($item) ? (float) ($item['quantity'] ?? 0) : (float) ($item->quantity ?? 0);

            if (! $productId || $qty <= 0) {
                continue;
            }

            $product = Product::lockForUpdate()->find($productId);
            if ($product && $product->track_inventory) {
                $product->stock = round((float) $product->stock + ($direction * $qty), 2);
                $product->save();
            }
        }
    }

    /**
     * Sincroniza la mercancía en custodia del cliente cuando se emite una Nota de Entrega a Consignación.
     */
    private function syncConsignmentForInvoice(Invoice $invoice, array $items): void
    {
        if (! Schema::hasTable('consignments')) {
            return;
        }

        $specs = is_array($invoice->technical_specs) ? $invoice->technical_specs : json_decode($invoice->technical_specs ?? '[]', true);
        $showSuggested = ! empty($specs['show_suggested_price']);
        $hideTotals = isset($specs['show_totals']) && ! $specs['show_totals'];

        $isConsignment = (
            strcasecmp((string) $invoice->sale_condition, 'Consignación') === 0
            || str_contains(strtolower((string) $invoice->sale_condition), 'consign')
            || str_contains(strtolower((string) ($invoice->payment_terms_notes ?? '')), 'consign')
            || ($showSuggested && $hideTotals)
            || ($invoice->document_type === 'nota_entrega' && $showSuggested)
        );

        if (! $isConsignment) {
            return;
        }

        foreach ($items as $item) {
            $qty = (float) ($item['quantity'] ?? 0);
            if ($qty <= 0) {
                continue;
            }

            $productId = ! empty($item['product_id']) ? (int) $item['product_id'] : null;
            $description = trim((string) ($item['description'] ?? 'Producto en Consignación'));
            $unit = trim((string) ($item['unit'] ?? 'unid')) ?: 'unid';
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $suggestedPrice = isset($item['suggested_price']) && $item['suggested_price'] !== '' ? (float) $item['suggested_price'] : null;

            $consignment = Consignment::where('company_id', $invoice->company_id)
                ->where('client_id', $invoice->client_id)
                ->where(function ($q) use ($productId, $description) {
                    if ($productId) {
                        $q->where('product_id', $productId);
                    } else {
                        $q->where('description', $description);
                    }
                })
                ->whereIn('status', ['activa', 'liquidada_parcial'])
                ->first();

            if ($consignment) {
                $oldQty = (float) $consignment->current_quantity;
                $newQty = round($oldQty + $qty, 2);
                $consignment->update([
                    'current_quantity' => $newQty,
                    'unit_price' => $unitPrice > 0 ? $unitPrice : $consignment->unit_price,
                    'suggested_price' => $suggestedPrice ?: $consignment->suggested_price,
                    'status' => 'activa',
                ]);

                ConsignmentMovement::create([
                    'consignment_id' => $consignment->id,
                    'movement_type' => 'reposicion',
                    'quantity' => $qty,
                    'previous_quantity' => $oldQty,
                    'new_quantity' => $newQty,
                    'unit_price' => $unitPrice,
                    'suggested_price' => $suggestedPrice,
                    'invoice_id' => $invoice->id,
                    'user_id' => $invoice->user_id,
                    'notes' => "Entrega registrada en Nota de Entrega {$invoice->correlative_number}",
                ]);
            } else {
                $consignment = Consignment::create([
                    'company_id' => $invoice->company_id,
                    'client_id' => $invoice->client_id,
                    'product_id' => $productId,
                    'description' => $description,
                    'unit' => $unit,
                    'current_quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'suggested_price' => $suggestedPrice,
                    'initial_delivery_invoice_id' => $invoice->id,
                    'status' => 'activa',
                    'notes' => "Consignación iniciada con Nota de Entrega {$invoice->correlative_number}",
                ]);

                ConsignmentMovement::create([
                    'consignment_id' => $consignment->id,
                    'movement_type' => 'entrega_inicial',
                    'quantity' => $qty,
                    'previous_quantity' => 0,
                    'new_quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'suggested_price' => $suggestedPrice,
                    'invoice_id' => $invoice->id,
                    'user_id' => $invoice->user_id,
                    'notes' => "Entrega inicial de mercancía en custodia con Nota de Entrega {$invoice->correlative_number}",
                ]);
            }
        }
    }

    /**
     * Genera el correlativo y número de control según el tipo de documento y avanza su contador independiente.
     */
    private function assignAndAdvanceSequence(Company $company, string $documentType): array
    {
        $seq = $company->getSequenceConfigForType($documentType);
        $correlativeNum = sprintf('%s%07d', $seq['prefix'], $seq['next']);
        $controlNum = $seq['uses_fiscal_control']
            ? sprintf('%02d-%06d', 0, $company->next_control_number)
            : sprintf('%02d-%06d', 0, $seq['next']);
        $orderNum = '#' . ($seq['uses_fiscal_control'] ? $company->next_control_number : $seq['next']);

        $company->increment($seq['counter_col']);
        if ($seq['uses_fiscal_control']) {
            $company->increment('next_control_number');
        }

        return [
            'correlative_number' => $correlativeNum,
            'control_number' => $controlNum,
            'order_number' => $orderNum,
        ];
    }

    /**
     * Crear y registrar una nueva factura, proforma, cotización, nota de entrega o borrador.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateInvoiceData($request);
        $user = $request->user();
        $status = $validated['status'] ?? 'emitida';

        DB::transaction(function () use ($validated, $request, $status, $user) {
            $company = Company::lockForUpdate()->findOrFail($validated['company_id']);
            $invoiceData = $this->buildInvoiceAttributes($request, $validated, $company);

            $invoiceData['user_id'] = $user?->id;
            $invoiceData['status'] = $status;

            if ($status === 'borrador') {
                $seq = $company->getSequenceConfigForType($validated['document_type']);
                $invoiceData['correlative_number'] = 'BORR-' . str_pad((string) $seq['next'], 6, '0', STR_PAD_LEFT);
                $invoiceData['control_number'] = null;
                $invoiceData['order_number'] = 'Borrador';
            } else {
                $seqData = $this->assignAndAdvanceSequence($company, $validated['document_type']);
                $invoiceData = array_merge($invoiceData, $seqData);
            }

            $invoice = Invoice::create($invoiceData);
            $this->persistItems($invoice, $validated['items']);

            if ($this->shouldAffectInventory($validated['document_type'], $status, $invoiceData['technical_specs'] ?? [])) {
                $this->adjustInventoryForItems($validated['items'], -1);
            }

            if ($status !== 'borrador') {
                $this->syncConsignmentForInvoice($invoice, $validated['items']);
            }

            InvoiceAuditLog::record(
                $invoice,
                $user?->id,
                'created',
                "Creó {$invoice->document_type} {$invoice->correlative_number} (Estado: {$status})",
                ['status' => $status, 'total_usd' => (float) $invoice->total_usd],
                $request->ip()
            );
        });

        $msg = $status === 'borrador'
            ? '¡Borrador guardado sin consumir correlativo!'
            : '¡Documento registrado exitosamente con su correlativo correspondiente!';

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Actualizar un documento existente (incluyendo promoción de borrador a emitido).
     */
    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $validated = $this->validateInvoiceData($request);
        $user = $request->user();
        $newStatus = $validated['status'] ?? $invoice->status;

        DB::transaction(function () use ($validated, $request, $invoice, $newStatus, $user) {
            $invoice->load('items');
            $oldStatus = $invoice->status;
            $company = Company::lockForUpdate()->findOrFail($validated['company_id']);

            if ($this->shouldAffectInventory($invoice->document_type, $invoice->status)) {
                $this->adjustInventoryForItems($invoice->items, +1);
            }

            $invoiceData = $this->buildInvoiceAttributes($request, $validated, $company);
            $invoiceData['status'] = $newStatus;

            $wasDraft = $invoice->status === 'borrador' || str_starts_with((string) $invoice->correlative_number, 'BORR-');
            if ($wasDraft && $newStatus !== 'borrador') {
                $seqData = $this->assignAndAdvanceSequence($company, $validated['document_type']);
                $invoiceData = array_merge($invoiceData, $seqData);
            }

            $invoice->update($invoiceData);
            $invoice->items()->delete();
            $this->persistItems($invoice, $validated['items']);

            if ($this->shouldAffectInventory($validated['document_type'], $newStatus)) {
                $this->adjustInventoryForItems($validated['items'], -1);
            }

            InvoiceAuditLog::record(
                $invoice,
                $user?->id,
                'updated',
                "Modificó {$invoice->document_type} {$invoice->correlative_number} ({$oldStatus} → {$newStatus})",
                ['old_status' => $oldStatus, 'new_status' => $newStatus, 'total_usd' => (float) $invoice->total_usd],
                $request->ip()
            );
        });

        return redirect()->back()->with('success', '¡Documento actualizado exitosamente!');
    }

    /**
     * Cambiar rápidamente el estado de un documento (emitida, pagada, anulada, borrador).
     */
    public function updateStatus(Request $request, Invoice $invoice): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:emitida,borrador,anulada,pagada'],
        ]);

        $user = $request->user();
        $newStatus = $validated['status'];

        DB::transaction(function () use ($request, $invoice, $newStatus, $user) {
            $invoice->load('items');
            $oldStatus = $invoice->status;
            $wasDeducted = $this->shouldAffectInventory($invoice->document_type, $invoice->status);
            $willDeduct = $this->shouldAffectInventory($invoice->document_type, $newStatus);

            if (! $wasDeducted && $willDeduct) {
                $this->adjustInventoryForItems($invoice->items, -1);
            } elseif ($wasDeducted && ! $willDeduct) {
                $this->adjustInventoryForItems($invoice->items, +1);
            }

            $updateData = ['status' => $newStatus];

            $wasDraft = $invoice->status === 'borrador' || str_starts_with((string) $invoice->correlative_number, 'BORR-');
            if ($wasDraft && in_array($newStatus, ['emitida', 'pagada'], true)) {
                $company = Company::lockForUpdate()->findOrFail($invoice->company_id);
                $seqData = $this->assignAndAdvanceSequence($company, $invoice->document_type);
                $updateData = array_merge($updateData, $seqData);
            }

            $invoice->update($updateData);

            $action = $newStatus === 'anulada' ? 'annulled' : 'status_changed';
            InvoiceAuditLog::record(
                $invoice,
                $user?->id,
                $action,
                $newStatus === 'anulada'
                    ? "Anuló {$invoice->document_type} {$invoice->correlative_number} conservando correlativo"
                    : "Cambió estado de {$invoice->correlative_number}: {$oldStatus} → {$newStatus}",
                ['old_status' => $oldStatus, 'new_status' => $newStatus],
                $request->ip()
            );
        });

        $labels = [
            'pagada' => '¡Documento marcado como PAGADO!',
            'emitida' => '¡Documento marcado como EMITIDO!',
            'anulada' => 'Documento ANULADO conservando su correlativo.',
            'borrador' => 'Documento pasado a estado Borrador.',
        ];

        return redirect()->back()->with('success', $labels[$newStatus] ?? 'Estado actualizado.');
    }

    /**
     * Convertir en 1 clic una Cotización, Proforma o Nota de Entrega en una Factura Fiscal oficial.
     */
    public function convertToInvoice(Request $request, Invoice $invoice): RedirectResponse
    {
        $newInvoice = DB::transaction(function () use ($request, $invoice) {
            $invoice->load('items');
            $company = Company::lockForUpdate()->findOrFail($invoice->company_id);
            $seqData = $this->assignAndAdvanceSequence($company, 'factura');

            $specs = is_array($invoice->technical_specs) ? $invoice->technical_specs : [];
            $specs['converted_from_id'] = $invoice->id;
            $specs['converted_from_correlative'] = $invoice->correlative_number;
            // Al convertir a Factura Fiscal oficial, se asegura sumatoria activa y sin PVP sugerido en PDF
            $specs['show_totals'] = true;
            $specs['show_suggested_price'] = false;

            $nowCaracas = now('America/Caracas');

            $newData = [
                'company_id' => $invoice->company_id,
                'client_id' => $invoice->client_id,
                'user_id' => $request->user()?->id ?? $invoice->user_id,
                'document_type' => 'factura',
                'document_subtitle' => $invoice->document_subtitle,
                'correlative_number' => $seqData['correlative_number'],
                'control_number' => $seqData['control_number'],
                'order_number' => $seqData['order_number'],
                'issue_date' => $nowCaracas->format('Y-m-d H:i:s'),
                'due_date' => $nowCaracas->copy()->addDays(8)->format('Y-m-d'),
                'offer_validity_days' => $invoice->offer_validity_days,
                'sale_condition' => $invoice->sale_condition,
                'sales_channel' => $invoice->sales_channel,
                'bcv_exchange_rate' => $invoice->bcv_exchange_rate,
                'currency' => $invoice->currency,
                'payment_method' => $invoice->payment_method,
                'payment_reference' => $invoice->payment_reference,
                'subtotal' => $invoice->subtotal,
                'shipping_cost' => $invoice->shipping_cost,
                'discount' => $invoice->discount,
                'tax_percentage' => $invoice->tax_percentage,
                'tax_amount' => $invoice->tax_amount,
                'total_usd' => $invoice->total_usd,
                'total_ves' => $invoice->total_ves,
                'delivery_address' => $invoice->delivery_address,
                'shipping_terms_notes' => $invoice->shipping_terms_notes,
                'payment_terms_notes' => $invoice->payment_terms_notes,
                'terms_conditions' => $company->default_terms ?: $invoice->terms_conditions,
                'technical_specs' => $specs,
                'status' => 'emitida',
            ];

            if (Schema::hasColumn('invoices', 'show_bs_conversion')) {
                $newData['show_bs_conversion'] = $invoice->show_bs_conversion;
            }
            if (Schema::hasColumn('invoices', 'parent_invoice_id')) {
                $newData['parent_invoice_id'] = $invoice->id;
            }

            $created = Invoice::create($newData);

            foreach ($invoice->items as $index => $origItem) {
                $itemAttrs = [
                    'invoice_id' => $created->id,
                    'item_order' => $origItem->item_order ?? ($index + 1),
                    'description' => $origItem->description,
                    'details' => $origItem->details,
                    'image_url' => $origItem->image_url,
                    'quantity' => $origItem->quantity,
                    'unit' => $origItem->unit,
                    'unit_price' => $origItem->unit_price,
                    'suggested_price' => $origItem->suggested_price,
                    'total' => $origItem->total,
                    'is_tax_exempt' => $origItem->is_tax_exempt,
                ];

                if (Schema::hasColumn('invoice_items', 'product_id')) {
                    $itemAttrs['product_id'] = $origItem->product_id;
                }

                InvoiceItem::create($itemAttrs);
            }

            // Si provenía de cotización/proforma (no había descontado stock aún), descontar existencias ahora
            if (! $this->shouldAffectInventory($invoice->document_type, $invoice->status)) {
                $this->adjustInventoryForItems($invoice->items, -1);
            }

            InvoiceAuditLog::record(
                $created,
                $request->user()?->id,
                'converted',
                "Convirtió {$invoice->correlative_number} en Factura Fiscal {$created->correlative_number}",
                ['source_invoice_id' => $invoice->id, 'source_correlative' => $invoice->correlative_number],
                $request->ip()
            );

            return $created;
        });

        return redirect()->back()->with('success', "¡{$invoice->correlative_number} convertida a Factura Fiscal {$newInvoice->correlative_number}!");
    }

    /**
     * Eliminar una factura o borrador (restaurando el inventario si aplica).
     */
    public function destroy(Request $request, Invoice $invoice): RedirectResponse
    {
        DB::transaction(function () use ($request, $invoice) {
            $invoice->load('items');
            if ($this->shouldAffectInventory($invoice->document_type, $invoice->status)) {
                $this->adjustInventoryForItems($invoice->items, +1);
            }

            $correlative = $invoice->correlative_number;
            $docType = $invoice->document_type;
            $totalUsd = (float) $invoice->total_usd;

            $invoice->delete();

            if (Schema::hasTable('invoice_audit_logs')) {
                InvoiceAuditLog::create([
                    'invoice_id' => null,
                    'user_id' => $request->user()?->id,
                    'action' => 'deleted',
                    'correlative_number' => $correlative,
                    'document_type' => $docType,
                    'description' => "Eliminó permanentemente {$docType} {$correlative} (\${$totalUsd})",
                    'metadata' => ['total_usd' => $totalUsd],
                    'ip_address' => $request->ip(),
                ]);
            }
        });

        return redirect()->back()->with('success', 'Documento eliminado del registro.');
    }

    /**
     * Consulta paginada y filtrada en SQL compartida entre la carga inicial y las consultas AJAX.
     */
    public static function queryPaginatedInvoices(Request $request): array
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = (string) $request->input('status', 'todos');
        $companyFilter = (string) $request->input('company_id', 'all');
        $docTypeFilter = (string) $request->input('document_type', 'all');
        $perPage = max(5, min(50, (int) $request->input('per_page', 10)));

        $scopedQuery = Invoice::query();

        if ($search !== '') {
            $like = '%' . $search . '%';
            $scopedQuery->where(function ($q) use ($like) {
                $q->where('correlative_number', 'like', $like)
                    ->orWhere('control_number', 'like', $like)
                    ->orWhere('order_number', 'like', $like)
                    ->orWhere('document_subtitle', 'like', $like)
                    ->orWhereHas('client', function ($cq) use ($like) {
                        $cq->where('name', 'like', $like)->orWhere('tax_id', 'like', $like);
                    })
                    ->orWhereHas('company', function ($compQ) use ($like) {
                        $compQ->where('name', 'like', $like)->orWhere('tax_id', 'like', $like);
                    });
            });
        }

        if ($companyFilter !== 'all' && is_numeric($companyFilter)) {
            $scopedQuery->where('company_id', (int) $companyFilter);
        }

        if (in_array($docTypeFilter, ['factura', 'proforma', 'cotizacion', 'nota_entrega'], true)) {
            $scopedQuery->where('document_type', $docTypeFilter);
        }

        $groupedStatuses = (clone $scopedQuery)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $statusCounts = [
            'todos' => (int) $groupedStatuses->sum(),
            'emitida' => (int) ($groupedStatuses['emitida'] ?? 0),
            'pagada' => (int) ($groupedStatuses['pagada'] ?? 0),
            'borrador' => (int) ($groupedStatuses['borrador'] ?? 0),
            'anulada' => (int) ($groupedStatuses['anulada'] ?? 0),
        ];

        $paginatedQuery = clone $scopedQuery;
        if (in_array($statusFilter, ['emitida', 'pagada', 'borrador', 'anulada'], true)) {
            $paginatedQuery->where('status', $statusFilter);
        }

        $invoiceRelations = ['company', 'client', 'items', 'user:id,name,email'];
        if (Schema::hasColumn('invoices', 'parent_invoice_id')) {
            $invoiceRelations[] = 'parentInvoice';
            $invoiceRelations[] = 'childInvoices';
        }
        if (Schema::hasTable('invoice_payments')) {
            $invoiceRelations[] = 'payments';
        }
        if (Schema::hasTable('invoice_audit_logs')) {
            $invoiceRelations[] = 'auditLogs.user:id,name';
        }

        $invoices = $paginatedQuery
            ->with($invoiceRelations)
            ->latest('issue_date')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'invoices' => $invoices,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'company_id' => $companyFilter,
                'document_type' => $docTypeFilter,
            ],
        ];
    }

    /**
     * Endpoint AJAX JSON para filtrar, buscar y paginar el Libro de Ventas sin recargar la página.
     */
    public function query(Request $request): JsonResponse
    {
        return response()->json(self::queryPaginatedInvoices($request));
    }

    /**
     * Consulta filtrada y paginada para la pantalla de Auditoría (inicial + AJAX).
     */
    public static function queryAuditLogs(Request $request): array
    {
        if (! Schema::hasTable('invoice_audit_logs')) {
            return [
                'logs' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                    'from' => 0,
                    'to' => 0,
                ],
                'summary' => [
                    'total' => 0,
                    'created' => 0,
                    'updated' => 0,
                    'payments' => 0,
                    'converted' => 0,
                    'annulled_deleted' => 0,
                ],
            ];
        }

        $search = trim((string) $request->input('search', ''));
        $action = (string) $request->input('action', 'todos');
        $startDate = (string) $request->input('start_date', '');
        $endDate = (string) $request->input('end_date', '');
        $perPage = max(10, min(50, (int) $request->input('per_page', 15)));

        $query = InvoiceAuditLog::with('user:id,name');

        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('correlative_number', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', $like));
            });
        }

        if ($action === 'payments') {
            $query->whereIn('action', ['payment_added', 'payment_deleted']);
        } elseif ($action === 'annulled_deleted') {
            $query->whereIn('action', ['annulled', 'deleted']);
        } elseif (in_array($action, ['created', 'updated', 'status_changed', 'converted', 'payment_added', 'payment_deleted', 'annulled', 'deleted'], true)) {
            $query->where('action', $action);
        }

        if ($startDate !== '') {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate !== '') {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $logs = $query->latest('id')->paginate($perPage);

        $actionCounts = InvoiceAuditLog::select('action', DB::raw('COUNT(*) as total'))
            ->groupBy('action')
            ->pluck('total', 'action');

        $summary = [
            'total' => (int) $actionCounts->sum(),
            'created' => (int) ($actionCounts['created'] ?? 0),
            'updated' => (int) (($actionCounts['updated'] ?? 0) + ($actionCounts['status_changed'] ?? 0)),
            'payments' => (int) (($actionCounts['payment_added'] ?? 0) + ($actionCounts['payment_deleted'] ?? 0)),
            'converted' => (int) ($actionCounts['converted'] ?? 0),
            'annulled_deleted' => (int) (($actionCounts['annulled'] ?? 0) + ($actionCounts['deleted'] ?? 0)),
        ];

        return [
            'logs' => $logs,
            'summary' => $summary,
        ];
    }

    /**
     * Endpoint AJAX JSON para filtrar la bitácora de auditoría sin recargar la página.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        return response()->json(self::queryAuditLogs($request));
    }

    /**
     * Genera y descarga un documento guardado oficial en PDF A4 desde el servidor mediante mPDF.
     */
    public function downloadPdf(Request $request, Invoice $invoice, PdfGeneratorService $pdfGenerator): Response
    {
        $invoice->load(['company', 'client', 'items']);
        $specsMeta = is_array($invoice->technical_specs) ? $invoice->technical_specs : [];

        return $this->renderInvoicePdfResponse(
            $invoice,
            $specsMeta,
            $request->input('format'),
            $pdfGenerator
        );
    }

    /**
     * Genera y descarga un PDF A4 directamente desde el taller de vista previa (borrador o edición en vivo).
     */
    public function previewPdf(Request $request, PdfGeneratorService $pdfGenerator): Response
    {
        $existingInvoice = $request->filled('invoice_id')
            ? Invoice::with(['company', 'client'])->find((int) $request->input('invoice_id'))
            : null;

        $company = $request->filled('company_id')
            ? Company::find((int) $request->input('company_id'))
            : ($existingInvoice?->company ?: Company::where('is_active', true)->first() ?: Company::first());

        if (! $company) {
            $company = new Company([
                'name' => 'Inversiones CorpoAsia C.A.',
                'tax_id' => 'J-00000000-0',
                'address' => '',
                'phone' => '',
            ]);
        }

        $client = $request->filled('client_id')
            ? Client::find((int) $request->input('client_id'))
            : $existingInvoice?->client;

        if (! $client) {
            $client = new Client([
                'name' => 'Cliente General / Por Asignar',
                'tax_id' => 'N/A',
                'phone' => 'N/A',
            ]);
        }

        $docType = (string) ($request->input('document_type') ?: ($existingInvoice?->document_type ?: 'factura'));
        $saleCondition = (string) ($request->input('sale_condition') ?: ($existingInvoice?->sale_condition ?: 'Venta de Contado'));
        $isConsignment = (
            $docType === 'nota_entrega'
            || strcasecmp($saleCondition, 'Consignación') === 0
            || str_contains(strtolower($saleCondition), 'consign')
        );

        $rawItems = is_array($request->input('items')) ? $request->input('items') : [];
        $hiddenImageOrders = [];
        $preparedItems = collect();

        foreach (array_values($rawItems) as $idx => $it) {
            if (! is_array($it)) {
                continue;
            }
            $qty = max(0, (float) ($it['quantity'] ?? 1));
            $unitPrice = max(0, (float) ($it['unit_price'] ?? 0));
            $lineTotal = round($qty * $unitPrice, 2);
            $showImage = array_key_exists('show_image', $it) ? (bool) $it['show_image'] : true;
            if (! $showImage) {
                $hiddenImageOrders[] = $idx + 1;
            }

            $itemObj = new InvoiceItem([
                'item_order' => $idx + 1,
                'description' => trim((string) ($it['description'] ?? 'Producto / Servicio')) ?: 'Producto / Servicio',
                'details' => $it['details'] ?? null,
                'quantity' => $qty,
                'unit' => trim((string) ($it['unit'] ?? 'unid')) ?: 'unid',
                'unit_price' => $unitPrice,
                'suggested_price' => isset($it['suggested_price']) && $it['suggested_price'] !== '' ? (float) $it['suggested_price'] : null,
                'total' => $lineTotal,
                'is_tax_exempt' => (bool) ($it['is_tax_exempt'] ?? false),
                'image_url' => $it['image_url'] ?? null,
            ]);
            $preparedItems->push($itemObj);
        }

        $taxRate = (float) ($request->input('tax_percentage') ?? ($docType === 'factura' ? 16 : 0));
        $shippingCost = (float) ($request->input('shipping_cost') ?? 0);
        $discount = (float) ($request->input('discount') ?? 0);
        $bcvRate = max(0.0001, (float) ($request->input('bcv_exchange_rate') ?? 1));

        $totals = $this->calculateInvoiceTotals($rawItems, $taxRate, $shippingCost, $discount, $bcvRate);

        $rawSpecs = $request->input('technical_specs', []);
        $specsList = array_is_list($rawSpecs) ? $rawSpecs : ($rawSpecs['specs'] ?? []);

        $specsMeta = [
            'specs' => $specsList,
            'pdf_format' => $request->input('format') ?: $request->input('pdf_format', 'formato-1'),
            'show_bs_conversion' => $request->has('show_bs_conversion') ? $request->boolean('show_bs_conversion') : true,
            'show_totals' => $request->has('show_totals') ? $request->boolean('show_totals') : ! $isConsignment,
            'show_suggested_price' => $request->has('show_suggested_price') ? $request->boolean('show_suggested_price') : $isConsignment,
            'show_item_images' => $request->has('show_item_images') ? $request->boolean('show_item_images') : true,
            'hidden_image_orders' => $hiddenImageOrders,
            'signature_stamp' => $request->input('signature_stamp', 'auto'),
            'equipment_year' => $request->input('equipment_year'),
            'equipment_vin' => $request->input('equipment_vin'),
            'customs_text' => $request->input('customs_text'),
            'payment_milestone_1_pct' => $request->input('payment_milestone_1_pct', 70),
            'payment_milestone_1_text' => $request->input('payment_milestone_1_text'),
            'payment_milestone_2_pct' => $request->input('payment_milestone_2_pct', 30),
            'payment_milestone_2_text' => $request->input('payment_milestone_2_text'),
            'company_social_handle' => $request->input('company_social_handle'),
        ];

        $virtualInvoice = new Invoice([
            'document_type' => $docType,
            'document_subtitle' => $request->input('document_subtitle'),
            'correlative_number' => $request->input('correlative_number') ?: ($existingInvoice?->correlative_number ?: 'VISTA-PREVIA'),
            'control_number' => $request->input('control_number') ?: ($existingInvoice?->control_number ?: 'BORRADOR'),
            'status' => $request->input('status') ?: ($existingInvoice?->status ?: 'emitida'),
            'issue_date' => $request->input('issue_date') ?: now('America/Caracas')->format('Y-m-d'),
            'due_date' => $request->input('due_date'),
            'offer_validity_days' => $request->input('offer_validity_days'),
            'sale_condition' => $saleCondition,
            'sales_channel' => $request->input('sales_channel', 'Oficina'),
            'bcv_exchange_rate' => $bcvRate,
            'show_bs_conversion' => $specsMeta['show_bs_conversion'],
            'currency' => $request->input('currency', 'USD'),
            'payment_method' => $request->input('payment_method', 'PAGO MOVIL'),
            'payment_reference' => $request->input('payment_reference'),
            'subtotal' => $totals['subtotal'],
            'shipping_cost' => $shippingCost,
            'discount' => $discount,
            'tax_percentage' => $taxRate,
            'tax_amount' => $totals['tax_amount'],
            'total_usd' => $totals['total_usd'],
            'total_ves' => $totals['total_ves'],
            'delivery_address' => $request->input('delivery_address'),
            'shipping_terms_notes' => $request->input('shipping_terms_notes'),
            'terms_conditions' => $request->input('terms_conditions'),
        ]);
        $virtualInvoice->id = $existingInvoice?->id ?? 0;
        $virtualInvoice->setRelation('company', $company);
        $virtualInvoice->setRelation('client', $client);
        $virtualInvoice->setRelation('items', $preparedItems);

        return $this->renderInvoicePdfResponse(
            $virtualInvoice,
            $specsMeta,
            $request->input('format') ?: $request->input('pdf_format'),
            $pdfGenerator
        );
    }

    /**
     * Ensambla la plantilla clásica/moderna de documento fiscal y retorna la descarga PDF mediante mPDF.
     */
    private function renderInvoicePdfResponse(
        Invoice $invoice,
        array $specsMeta,
        ?string $requestedFormat,
        PdfGeneratorService $pdfGenerator
    ): Response {
        $format = $requestedFormat ?: ($specsMeta['pdf_format'] ?? ($invoice->document_type === 'proforma' ? 'formato-2' : 'formato-1'));
        if (! in_array($format, ['formato-1', 'formato-2'], true)) {
            $format = 'formato-1';
        }

        $rawSpecs = array_is_list($specsMeta) ? $specsMeta : ($specsMeta['specs'] ?? []);

        $groupedSpecs = [];
        foreach ($rawSpecs as $spec) {
            if (! is_array($spec)) {
                continue;
            }
            $cat = trim((string) ($spec['category'] ?? 'Especificaciones')) ?: 'Especificaciones';
            $groupedSpecs[$cat][] = $spec;
        }

        $showBsConversion = $invoice->show_bs_conversion !== null
            ? (bool) $invoice->show_bs_conversion
            : (bool) ($specsMeta['show_bs_conversion'] ?? true);

        $isConsignment = (
            $invoice->document_type === 'nota_entrega'
            || strcasecmp((string) $invoice->sale_condition, 'Consignación') === 0
            || str_contains(strtolower((string) $invoice->sale_condition), 'consign')
        );

        $showTotals = isset($specsMeta['show_totals'])
            ? (bool) $specsMeta['show_totals']
            : ! $isConsignment;

        $showSuggestedPrice = isset($specsMeta['show_suggested_price'])
            ? (bool) $specsMeta['show_suggested_price']
            : $isConsignment;

        $showItemImages = (bool) ($specsMeta['show_item_images'] ?? true);
        $hiddenOrders = array_map('intval', is_array($specsMeta['hidden_image_orders'] ?? null) ? $specsMeta['hidden_image_orders'] : []);

        $signatureStamp = (string) ($specsMeta['signature_stamp'] ?? 'auto');
        $stampPath = match ($signatureStamp) {
            'none' => null,
            'china' => 'images/stamp-signature-china-clean.png',
            'corpoasia' => 'images/stamp-signature-corpoasia-clean.png',
            default => in_array($invoice->document_type, ['proforma', 'cotizacion'], true)
                ? 'images/stamp-signature-china-clean.png'
                : 'images/stamp-signature-corpoasia-clean.png',
        };

        $items = $invoice->items->values()->map(function ($it, int $idx) use ($showItemImages, $hiddenOrders) {
            $orderNum = (int) ($it->item_order ?: ($idx + 1));
            $canShowImg = $showItemImages && ! in_array($orderNum, $hiddenOrders, true);

            return [
                'description' => $it->description,
                'details' => $it->details,
                'quantity' => (float) $it->quantity,
                'unit' => $it->unit,
                'unit_price' => (float) $it->unit_price,
                'suggested_price' => $it->suggested_price !== null ? (float) $it->suggested_price : null,
                'total' => (float) $it->total,
                'is_tax_exempt' => (bool) $it->is_tax_exempt,
                'show_image' => $canShowImg,
                'image_uri' => $canShowImg ? $this->resolvePdfImageDataUri($it->image_url) : null,
            ];
        })->all();

        $docInfo = match ($invoice->document_type) {
            'proforma' => [
                'title' => 'PROFORMA',
                'correlativeLabel' => 'N° de Proforma',
                'controlLabel' => 'Control',
                'defaultSubtitle' => 'LÍNEA INDUSTRIAL / IMPORTACIÓN',
            ],
            'cotizacion' => [
                'title' => 'COTIZACIÓN',
                'correlativeLabel' => 'N° de Cotización',
                'controlLabel' => 'Control',
                'defaultSubtitle' => 'PRESUPUESTO / COTIZACIÓN COMERCIAL',
            ],
            'nota_entrega' => [
                'title' => 'NOTA DE ENTREGA',
                'correlativeLabel' => 'N° Nota de Entrega',
                'controlLabel' => 'Control de Despacho',
                'defaultSubtitle' => 'GUÍA / NOTA DE ENTREGA',
            ],
            default => [
                'title' => 'FACTURA FISCAL',
                'correlativeLabel' => 'N° de Factura',
                'controlLabel' => 'Control',
                'defaultSubtitle' => '',
            ],
        };

        $correlative = $invoice->correlative_number ?: sprintf('DOC-%06d', $invoice->id);
        $controlNumber = $invoice->control_number ?: 'BORRADOR';
        $issueDate = $invoice->issue_date
            ? (is_string($invoice->issue_date) ? substr($invoice->issue_date, 0, 10) : $invoice->issue_date->format('Y-m-d'))
            : '';
        $dueDate = $invoice->due_date
            ? (is_string($invoice->due_date) ? substr($invoice->due_date, 0, 10) : $invoice->due_date->format('Y-m-d'))
            : '';
        $termsText = $invoice->terms_conditions
            ?: ($invoice->company?->default_terms ?: 'Comprobante generado por el sistema. Para devoluciones o reclamos conserve este documento. Plazo máximo de reclamación: 3 días hábiles desde la fecha de emisión.');

        $viewName = $format === 'formato-2' ? 'pdf.modern' : 'pdf.classic';
        $safeName = Str::slug($correlative ?: ('documento-' . $invoice->id)) . '.pdf';

        $watermark = match ($invoice->status) {
            'anulada' => 'ANULADA',
            'borrador' => 'BORRADOR',
            default => null,
        };

        $margins = $format === 'formato-2'
            ? ['top' => 11, 'right' => 13, 'bottom' => 13, 'left' => 13]
            : ['top' => 12, 'right' => 14, 'bottom' => 14, 'left' => 14];

        return $pdfGenerator->makePdfResponse(
            $viewName,
            [
                'invoice' => $invoice,
                'docInfo' => $docInfo,
                'correlative' => $correlative,
                'controlNumber' => $controlNumber,
                'issueDate' => $issueDate,
                'dueDate' => $dueDate,
                'showBsConversion' => $showBsConversion,
                'showTotals' => $showTotals,
                'showSuggestedPrice' => $showSuggestedPrice,
                'companyLogoUri' => $this->resolvePdfImageDataUri('images/corpoasia-square.png'),
                'stampUri' => $stampPath ? $this->resolvePdfImageDataUri($stampPath) : null,
                'items' => $items,
                'groupedSpecs' => $groupedSpecs,
                'termsText' => $termsText,
                'equipmentYear' => $specsMeta['equipment_year'] ?? null,
                'equipmentVin' => $specsMeta['equipment_vin'] ?? null,
                'customsText' => $specsMeta['customs_text'] ?? null,
                'milestone1Pct' => (int) ($specsMeta['payment_milestone_1_pct'] ?? 70),
                'milestone1Text' => $specsMeta['payment_milestone_1_text'] ?? 'Al momento de firmar el contrato, para iniciar la verificación, compra del equipo y proceso de envío.',
                'milestone2Pct' => (int) ($specsMeta['payment_milestone_2_pct'] ?? 30),
                'milestone2Text' => $specsMeta['payment_milestone_2_text'] ?? '15 días antes de la llegada del equipo al puerto de destino en Venezuela.',
                'shippingTermsNotes' => $invoice->shipping_terms_notes ?: 'Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a la disponibilidad de espacio (booking) ofrecida por la naviera.',
                'companySocialHandle' => $specsMeta['company_social_handle'] ?? null,
            ],
            $safeName,
            [
                'paper' => 'A4',
                'margins' => $margins,
                'title' => "{$docInfo['title']} {$correlative}",
                'watermark' => $watermark,
                'default_font_size' => $format === 'formato-2' ? 9 : 9.5,
            ],
            'attachment'
        );
    }

    /**
     * Convierte una ruta local o Data URI en un URI Base64 seguro para renderizado determinístico en DomPDF.
     */
    private function resolvePdfImageDataUri(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'data:image/')) {
            return $path;
        }

        if (preg_match('#^https?://#i', $path)) {
            return null;
        }

        $clean = ltrim($path, '/');
        $candidates = [public_path($clean)];
        if (str_starts_with($clean, 'storage/')) {
            $candidates[] = storage_path('app/public/' . Str::after($clean, 'storage/'));
        }

        $optimizer = app(ImageOptimizerService::class);
        foreach ($candidates as $filePath) {
            $dataUri = $optimizer->toPdfDataUri($filePath);
            if ($dataUri !== null) {
                return $dataUri;
            }
        }

        return null;
    }
}
