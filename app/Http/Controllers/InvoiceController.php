<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    /**
     * Crear y registrar una nueva factura o proforma fiscal.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.details' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.image_url' => ['nullable', 'string'],
            'items.*.is_tax_exempt' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $company = Company::lockForUpdate()->findOrFail($validated['company_id']);

            // Generar correlativo
            $prefix = $company->invoice_prefix ?: 'F-';
            $correlativeNum = sprintf('%s%07d', $prefix, $company->next_correlative);
            $controlNum = sprintf('%02d-%06d', 0, $company->next_control_number);

            // Calcular montos de ítems
            $subtotal = 0;
            $taxableBase = 0;

            foreach ($validated['items'] as $itemData) {
                $itemTotal = round((float) $itemData['quantity'] * (float) $itemData['unit_price'], 2);
                $subtotal += $itemTotal;

                $isExempt = ! empty($itemData['is_tax_exempt']);
                if (! $isExempt) {
                    $taxableBase += $itemTotal;
                }
            }

            $shippingCost = (float) ($validated['shipping_cost'] ?? 0);
            $discount = (float) ($validated['discount'] ?? 0);
            $taxRate = (float) $validated['tax_percentage'];
            $taxAmount = round(($taxableBase * $taxRate) / 100, 2);

            $totalUsd = round($subtotal + $shippingCost - $discount + $taxAmount, 2);
            $bcvRate = (float) $validated['bcv_exchange_rate'];
            $totalVes = round($totalUsd * $bcvRate, 2);

            // Crear factura
            $invoice = Invoice::create([
                'company_id' => $company->id,
                'client_id' => $validated['client_id'],
                'user_id' => $request->user()?->id,
                'document_type' => $validated['document_type'],
                'document_subtitle' => $validated['document_subtitle'] ?? null,
                'correlative_number' => $correlativeNum,
                'control_number' => $controlNum,
                'order_number' => '#' . $company->next_control_number,
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
                'payment_terms_notes' => $validated['payment_terms_notes'] ?? $company->default_payment_terms,
                'terms_conditions' => $validated['terms_conditions'] ?? $company->default_terms,
                'technical_specs' => $validated['technical_specs'] ?? null,
                'status' => 'emitida',
            ]);

            // Guardar ítems
            foreach ($validated['items'] as $index => $itemData) {
                $itemTotal = round((float) $itemData['quantity'] * (float) $itemData['unit_price'], 2);

                $imageUrl = $itemData['image_url'] ?? null;
                if ($imageUrl && str_starts_with($imageUrl, 'data:image/')) {
                    if (preg_match('/^data:image\/(\w+);base64,/', $imageUrl, $matches)) {
                        $ext = strtolower($matches[1]);
                        if ($ext === 'jpeg') {
                            $ext = 'jpg';
                        }
                        $base64Data = substr($imageUrl, strpos($imageUrl, ',') + 1);
                        $decoded = base64_decode($base64Data);
                        if ($decoded !== false) {
                            $filename = \Illuminate\Support\Str::random(40) . '.' . $ext;
                            \Illuminate\Support\Facades\Storage::disk('public')->put('items/' . $filename, $decoded);
                            $publicFolder = public_path('storage/items');
                            if (! file_exists($publicFolder)) {
                                @mkdir($publicFolder, 0755, true);
                            }
                            @file_put_contents($publicFolder . DIRECTORY_SEPARATOR . $filename, $decoded);
                            $imageUrl = '/storage/items/' . $filename;
                        }
                    }
                }

                InvoiceItem::create([
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
                ]);
            }

            // Incrementar correlativos de la empresa
            $company->increment('next_correlative');
            $company->increment('next_control_number');
        });

        return redirect()->back()->with('success', '¡Documento fiscal emitido y registrado exitosamente!');
    }

    /**
     * Anular o eliminar una factura.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        $invoice->delete();

        return redirect()->back()->with('success', 'Documento eliminado del registro.');
    }
}

