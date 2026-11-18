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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ConsignmentController extends Controller
{
    /**
     * Consulta y filtra las consignaciones activas e históricas por cliente.
     */
    public function index(Request $request): JsonResponse
    {
        $clientId = $request->input('client_id');
        $status = $request->input('status', 'todos');
        $search = trim((string) $request->input('search', ''));

        $query = Consignment::with([
            'client:id,name,tax_id,category,phone,email,address',
            'product:id,code,name,image_url,stock,unit',
            'company:id,name,tax_id',
            'initialDeliveryInvoice:id,correlative_number,issue_date',
            'movements.invoice:id,correlative_number,document_type',
            'movements.user:id,name',
        ]);

        if (! empty($clientId) && $clientId !== 'all') {
            $query->where('client_id', $clientId);
        }

        if ($status === 'activas') {
            $query->whereIn('status', ['activa', 'liquidada_parcial'])->where('current_quantity', '>', 0);
        } elseif ($status === 'liquidadas') {
            $query->where('status', 'liquidada_total');
        } elseif ($status === 'devueltas') {
            $query->where('status', 'devuelta');
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('description', 'like', $like)
                    ->orWhereHas('client', fn ($cq) => $cq->where('name', 'like', $like)->orWhere('tax_id', 'like', $like))
                    ->orWhereHas('product', fn ($pq) => $pq->where('name', 'like', $like)->orWhere('code', 'like', $like));
            });
        }

        $consignments = $query->latest('id')->get();

        $stats = [
            'total_items_in_custody' => (float) Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->sum('current_quantity'),
            'active_consignments_count' => Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->where('current_quantity', '>', 0)->count(),
            'active_clients_count' => Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->where('current_quantity', '>', 0)->distinct('client_id')->count('client_id'),
            'total_base_value' => (float) (Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->selectRaw('SUM(current_quantity * unit_price) as total')->value('total') ?? 0),
            'total_suggested_value' => (float) (Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->selectRaw('SUM(current_quantity * COALESCE(suggested_price, unit_price)) as total')->value('total') ?? 0),
        ];

        return response()->json([
            'consignments' => $consignments,
            'stats' => $stats,
        ]);
    }

    /**
     * Reportar que el cliente vendió una máquina en consignación:
     * - Genera la Factura Fiscal para cobrarla (sin descontar inventario del almacén nuevamente).
     * - Descuenta la cantidad en posesión del cliente.
     * - Registra el movimiento histórico.
     */
    public function sell(Request $request, Consignment $consignment): RedirectResponse
    {
        $maxQty = (float) $consignment->current_quantity;
        $validated = $request->validate([
            'quantity' => ['required', 'numeric', 'min:0.01', 'max:' . $maxQty],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'issue_invoice' => ['nullable', 'boolean'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $qtyToSell = (float) $validated['quantity'];
        $unitPrice = (float) $validated['unit_price'];
        $issueInvoice = $request->boolean('issue_invoice', true);
        $user = $request->user();

        $createdInvoice = null;

        DB::transaction(function () use ($consignment, $qtyToSell, $unitPrice, $issueInvoice, $validated, $user, &$createdInvoice, $request) {
            $oldQty = (float) $consignment->current_quantity;
            $newQty = max(0, round($oldQty - $qtyToSell, 2));

            // 1. Emitir la Factura Fiscal si está seleccionado
            if ($issueInvoice) {
                $company = Company::lockForUpdate()->findOrFail($consignment->company_id);
                $seq = $company->getSequenceConfigForType('factura');
                $correlativeNum = sprintf('%s%07d', $seq['prefix'], $seq['next']);
                $controlNum = sprintf('%02d-%06d', 0, $company->next_control_number);
                $orderNum = '#' . $company->next_control_number;

                $company->increment('next_correlative');
                $company->increment('next_control_number');

                $subtotal = round($qtyToSell * $unitPrice, 2);
                $taxRate = 16.00;
                $taxAmount = round(($subtotal * $taxRate) / 100, 2);
                $totalUsd = round($subtotal + $taxAmount, 2);
                $bcvRate = (float) ($company->bcv_exchange_rate ?: 876.80);
                $totalVes = round($totalUsd * $bcvRate, 2);

                $createdInvoice = Invoice::create([
                    'company_id' => $company->id,
                    'client_id' => $consignment->client_id,
                    'user_id' => $user?->id,
                    'parent_invoice_id' => $consignment->initial_delivery_invoice_id,
                    'document_type' => 'factura',
                    'document_subtitle' => 'VENTA DE MERCANCÍA PREVIAMENTE EN CONSIGNACIÓN',
                    'correlative_number' => $correlativeNum,
                    'control_number' => $controlNum,
                    'order_number' => $orderNum,
                    'issue_date' => now('America/Caracas')->format('Y-m-d H:i:s'),
                    'due_date' => now('America/Caracas')->addDays(8)->format('Y-m-d'),
                    'sale_condition' => 'Venta de Contado',
                    'sales_channel' => 'Consignación / Distribuidor',
                    'bcv_exchange_rate' => $bcvRate,
                    'currency' => 'USD',
                    'payment_method' => $validated['payment_method'] ?? 'PAGO MOVIL',
                    'payment_reference' => $validated['payment_reference'] ?? null,
                    'subtotal' => $subtotal,
                    'shipping_cost' => 0,
                    'discount' => 0,
                    'tax_percentage' => $taxRate,
                    'tax_amount' => $taxAmount,
                    'total_usd' => $totalUsd,
                    'total_ves' => $totalVes,
                    'terms_conditions' => $company->default_terms ?: 'Factura emitida por liquidación de producto entregado previamente en consignación.',
                    'technical_specs' => [
                        'specs' => [],
                        'show_bs_conversion' => true,
                        'show_totals' => true,
                        'show_suggested_price' => false,
                        'is_consignment_sale' => true, // Evita doble descuento de inventario
                        'consignment_id' => $consignment->id,
                    ],
                    'status' => 'emitida',
                ]);

                InvoiceItem::create([
                    'invoice_id' => $createdInvoice->id,
                    'product_id' => $consignment->product_id,
                    'item_order' => 1,
                    'description' => $consignment->description,
                    'details' => "Liquidación por venta de equipo previamente entregado a consignación.",
                    'quantity' => $qtyToSell,
                    'unit' => $consignment->unit,
                    'unit_price' => $unitPrice,
                    'suggested_price' => $consignment->suggested_price,
                    'total' => $subtotal,
                    'is_tax_exempt' => false,
                ]);

                InvoiceAuditLog::record(
                    $createdInvoice,
                    $user?->id,
                    'created',
                    "Facturó venta de {$qtyToSell} {$consignment->unit} en consignación (Factura: {$createdInvoice->correlative_number})",
                    ['consignment_id' => $consignment->id, 'qty_sold' => $qtyToSell, 'total_usd' => $totalUsd],
                    $request->ip()
                );
            }

            // 2. Actualizar el saldo en custodia de la consignación
            $newStatus = $newQty <= 0 ? 'liquidada_total' : 'liquidada_parcial';
            $consignment->update([
                'current_quantity' => $newQty,
                'status' => $newStatus,
            ]);

            // 3. Registrar el movimiento histórico
            ConsignmentMovement::create([
                'consignment_id' => $consignment->id,
                'movement_type' => 'venta_facturada',
                'quantity' => $qtyToSell,
                'previous_quantity' => $oldQty,
                'new_quantity' => $newQty,
                'unit_price' => $unitPrice,
                'suggested_price' => $consignment->suggested_price,
                'invoice_id' => $createdInvoice?->id,
                'user_id' => $user?->id,
                'notes' => $validated['notes'] ?: ($createdInvoice ? "Venta facturada oficialmente con {$createdInvoice->correlative_number}" : "Venta reportada por el cliente"),
            ]);
        });

        $msg = $createdInvoice
            ? "¡Venta de {$qtyToSell} {$consignment->unit} procesada y Factura Fiscal {$createdInvoice->correlative_number} generada exitosamente!"
            : "¡Venta de {$qtyToSell} {$consignment->unit} registrada con éxito!";

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Registrar la reposición de una máquina vendida (entregar un equipo nuevo al cliente para mantener su saldo):
     * - Descuenta 1 equipo nuevo del inventario del almacén central.
     * - Genera la Nota de Entrega de Reposición (opcional pero recomendada).
     * - Reintegra la cantidad en poder del cliente sin inflar cuentas.
     */
    public function restock(Request $request, Consignment $consignment): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'create_delivery_note' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $qtyToRestock = (float) $validated['quantity'];
        $createDeliveryNote = $request->boolean('create_delivery_note', true);
        $user = $request->user();

        $createdDeliveryNote = null;

        DB::transaction(function () use ($consignment, $qtyToRestock, $createDeliveryNote, $validated, $user, &$createdDeliveryNote, $request) {
            $oldQty = (float) $consignment->current_quantity;
            $newQty = round($oldQty + $qtyToRestock, 2);

            // 1. Descontar stock físico del almacén central (salió un equipo real de la bodega)
            if ($consignment->product_id) {
                $product = Product::lockForUpdate()->find($consignment->product_id);
                if ($product && $product->track_inventory) {
                    $product->stock = round((float) $product->stock - $qtyToRestock, 2);
                    $product->save();
                }
            }

            // 2. Generar la Nota de Entrega de Reposición si aplica
            if ($createDeliveryNote) {
                $company = Company::lockForUpdate()->findOrFail($consignment->company_id);
                $seq = $company->getSequenceConfigForType('nota_entrega');
                $correlativeNum = sprintf('%s%07d', $seq['prefix'], $seq['next']);
                $controlNum = sprintf('%02d-%06d', 0, $seq['next']);
                $orderNum = '#' . $seq['next'];

                $company->increment('next_delivery_note_correlative');

                $subtotal = round($qtyToRestock * (float) $consignment->unit_price, 2);

                $createdDeliveryNote = Invoice::create([
                    'company_id' => $company->id,
                    'client_id' => $consignment->client_id,
                    'user_id' => $user?->id,
                    'parent_invoice_id' => $consignment->initial_delivery_invoice_id,
                    'document_type' => 'nota_entrega',
                    'document_subtitle' => 'REPOSICIÓN DE MERCANCÍA EN CONSIGNACIÓN',
                    'correlative_number' => $correlativeNum,
                    'control_number' => $controlNum,
                    'order_number' => $orderNum,
                    'issue_date' => now('America/Caracas')->format('Y-m-d H:i:s'),
                    'sale_condition' => 'Consignación',
                    'sales_channel' => 'Oficina / Despacho',
                    'bcv_exchange_rate' => (float) ($company->bcv_exchange_rate ?: 876.80),
                    'currency' => 'USD',
                    'payment_method' => 'CONSIGNACION',
                    'subtotal' => $subtotal,
                    'shipping_cost' => 0,
                    'discount' => 0,
                    'tax_percentage' => 0,
                    'tax_amount' => 0,
                    'total_usd' => $subtotal,
                    'total_ves' => round($subtotal * (float) ($company->bcv_exchange_rate ?: 876.80), 2),
                    'terms_conditions' => 'Nota de entrega por reposición de mercancía en consignación para mantener el nivel de exhibición acordado.',
                    'technical_specs' => [
                        'specs' => [],
                        'show_bs_conversion' => false,
                        'show_totals' => false,
                        'show_suggested_price' => true,
                        'is_consignment_restock' => true,
                        'consignment_id' => $consignment->id,
                    ],
                    'status' => 'emitida',
                ]);

                InvoiceItem::create([
                    'invoice_id' => $createdDeliveryNote->id,
                    'product_id' => $consignment->product_id,
                    'item_order' => 1,
                    'description' => $consignment->description,
                    'details' => "Reposición física para mantener inventario en consignación.",
                    'quantity' => $qtyToRestock,
                    'unit' => $consignment->unit,
                    'unit_price' => $consignment->unit_price,
                    'suggested_price' => $consignment->suggested_price,
                    'total' => $subtotal,
                    'is_tax_exempt' => true,
                ]);

                InvoiceAuditLog::record(
                    $createdDeliveryNote,
                    $user?->id,
                    'created',
                    "Generó Nota de Reposición {$createdDeliveryNote->correlative_number} ({$qtyToRestock} {$consignment->unit})",
                    ['consignment_id' => $consignment->id, 'qty' => $qtyToRestock],
                    $request->ip()
                );
            }

            // 3. Actualizar la consignación
            $consignment->update([
                'current_quantity' => $newQty,
                'status' => 'activa',
            ]);

            // 4. Registrar movimiento
            ConsignmentMovement::create([
                'consignment_id' => $consignment->id,
                'movement_type' => 'reposicion',
                'quantity' => $qtyToRestock,
                'previous_quantity' => $oldQty,
                'new_quantity' => $newQty,
                'unit_price' => $consignment->unit_price,
                'suggested_price' => $consignment->suggested_price,
                'invoice_id' => $createdDeliveryNote?->id,
                'user_id' => $user?->id,
                'notes' => $validated['notes'] ?: ($createdDeliveryNote ? "Reposición entregada con Nota {$createdDeliveryNote->correlative_number}" : "Reposición física entregada al cliente"),
            ]);
        });

        $msg = $createdDeliveryNote
            ? "¡Reposición de {$qtyToRestock} {$consignment->unit} registrada y Nota {$createdDeliveryNote->correlative_number} generada! Saldo actual en custodia: {$consignment->current_quantity} {$consignment->unit}."
            : "¡Reposición de {$qtyToRestock} {$consignment->unit} registrada con éxito! Saldo actual: {$consignment->current_quantity} {$consignment->unit}.";

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Registrar la devolución de mercancía por parte del cliente al almacén central:
     * - Reintegra el stock al inventario central.
     * - Reduce la cantidad en poder del cliente.
     */
    public function returnStock(Request $request, Consignment $consignment): RedirectResponse
    {
        $maxQty = (float) $consignment->current_quantity;
        $validated = $request->validate([
            'quantity' => ['required', 'numeric', 'min:0.01', 'max:' . $maxQty],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $qtyToReturn = (float) $validated['quantity'];
        $user = $request->user();

        DB::transaction(function () use ($consignment, $qtyToReturn, $validated, $user, $request) {
            $oldQty = (float) $consignment->current_quantity;
            $newQty = max(0, round($oldQty - $qtyToReturn, 2));

            // 1. Reintegrar stock al inventario central
            if ($consignment->product_id) {
                $product = Product::lockForUpdate()->find($consignment->product_id);
                if ($product && $product->track_inventory) {
                    $product->stock = round((float) $product->stock + $qtyToReturn, 2);
                    $product->save();
                }
            }

            // 2. Actualizar consignación
            $newStatus = $newQty <= 0 ? 'devuelta' : 'liquidada_parcial';
            $consignment->update([
                'current_quantity' => $newQty,
                'status' => $newStatus,
            ]);

            // 3. Registrar movimiento
            ConsignmentMovement::create([
                'consignment_id' => $consignment->id,
                'movement_type' => 'devolucion',
                'quantity' => $qtyToReturn,
                'previous_quantity' => $oldQty,
                'new_quantity' => $newQty,
                'unit_price' => $consignment->unit_price,
                'suggested_price' => $consignment->suggested_price,
                'user_id' => $user?->id,
                'notes' => $validated['notes'] ?: "Mercancía devuelta por el cliente al almacén central.",
            ]);
        });

        return redirect()->back()->with('success', "¡Devolución de {$qtyToReturn} {$consignment->unit} registrada y reintegrada al almacén central!");
    }
}
