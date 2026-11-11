<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\InvoiceAuditLog;
use App\Models\InvoicePayment;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoicePaymentController extends Controller
{
    /**
     * Registrar un nuevo abono o pago parcial contra un documento.
     */
    public function store(Request $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'anulada') {
            return redirect()->back()->withErrors([
                'amount_usd' => 'No se pueden registrar abonos en un documento anulado.',
            ]);
        }

        $validated = $request->validate([
            'payment_date' => ['required', 'date'],
            'amount_usd' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $markedPaid = false;

        DB::transaction(function () use ($validated, $request, $invoice, &$markedPaid) {
            InvoicePayment::create([
                'invoice_id' => $invoice->id,
                'user_id' => $request->user()?->id,
                'payment_date' => $validated['payment_date'],
                'amount_usd' => round((float) $validated['amount_usd'], 2),
                'payment_method' => strtoupper(trim($validated['payment_method'])),
                'reference' => ! empty($validated['reference']) ? trim($validated['reference']) : null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $totalPaid = round((float) $invoice->payments()->sum('amount_usd'), 2);
            if ($totalPaid >= (float) $invoice->total_usd && $invoice->status !== 'anulada') {
                $updateData = ['status' => 'pagada'];

                // Si era un borrador, asignarle correlativo y descontar stock antes de marcar como pagado
                $wasDraft = $invoice->status === 'borrador' || str_starts_with((string) $invoice->correlative_number, 'BORR-');
                if ($wasDraft) {
                    $company = Company::lockForUpdate()->findOrFail($invoice->company_id);
                    $seq = $company->getSequenceConfigForType($invoice->document_type);
                    $updateData['correlative_number'] = sprintf('%s%07d', $seq['prefix'], $seq['next']);
                    $updateData['control_number'] = $seq['uses_fiscal_control']
                        ? sprintf('%02d-%06d', 0, $company->next_control_number)
                        : sprintf('%02d-%06d', 0, $seq['next']);
                    $updateData['order_number'] = '#' . ($seq['uses_fiscal_control'] ? $company->next_control_number : $seq['next']);

                    $company->increment($seq['counter_col']);
                    if ($seq['uses_fiscal_control']) {
                        $company->increment('next_control_number');
                    }

                    if (in_array($invoice->document_type, ['factura', 'nota_entrega'], true)) {
                        foreach ($invoice->items()->whereNotNull('product_id')->get() as $item) {
                            $product = Product::lockForUpdate()->find($item->product_id);
                            if ($product && $product->track_inventory) {
                                $product->stock = round((float) $product->stock - (float) $item->quantity, 2);
                                $product->save();
                            }
                        }
                    }
                }

                $invoice->update($updateData);
                $markedPaid = true;
            }

            $amountFormatted = number_format((float) $validated['amount_usd'], 2, '.', '');
            $methodClean = strtoupper(trim($validated['payment_method']));
            InvoiceAuditLog::record(
                $invoice->fresh(),
                $request->user()?->id,
                'payment_added',
                "Registró abono de \${$amountFormatted} ({$methodClean}) en {$invoice->correlative_number}" . ($markedPaid ? ' — Saldada 100%' : ''),
                ['amount_usd' => (float) $validated['amount_usd'], 'payment_method' => $methodClean, 'marked_paid' => $markedPaid],
                $request->ip()
            );
        });

        $msg = $markedPaid
            ? '¡Abono registrado y factura saldada automáticamente (100% PAGADA)!'
            : '¡Abono registrado exitosamente!';

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Eliminar un abono registrado y recalcular el saldo/estado de la factura.
     */
    public function destroy(Request $request, InvoicePayment $payment): RedirectResponse
    {
        DB::transaction(function () use ($request, $payment) {
            $invoice = $payment->invoice;
            $amount = (float) $payment->amount_usd;
            $method = $payment->payment_method;
            $payment->delete();

            if ($invoice) {
                $totalPaid = round((float) $invoice->payments()->sum('amount_usd'), 2);
                if ($invoice->status === 'pagada' && $totalPaid < (float) $invoice->total_usd) {
                    $invoice->update(['status' => 'emitida']);
                }

                InvoiceAuditLog::record(
                    $invoice->fresh(),
                    $request->user()?->id,
                    'payment_deleted',
                    "Eliminó abono de \${$amount} ({$method}) en {$invoice->correlative_number}",
                    ['amount_usd' => $amount, 'payment_method' => $method],
                    $request->ip()
                );
            }
        });

        return redirect()->back()->with('success', 'Abono eliminado y saldo recalculado.');
    }
}
