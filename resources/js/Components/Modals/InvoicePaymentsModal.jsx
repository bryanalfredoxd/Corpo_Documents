import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Wallet, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { getCaracasDate, formatCaracasDate } from '../../Utils/dateUtils';
import { useFeedback } from '../../Contexts/FeedbackContext';

export default function InvoicePaymentsModal({
    isOpen,
    onClose,
    invoice
}) {
    const { notify, confirm } = useFeedback();
    const [paymentForm, setPaymentForm] = useState({
        payment_date: getCaracasDate(),
        amount_usd: '',
        payment_method: 'ZELLE',
        reference: '',
        notes: ''
    });
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    useEffect(() => {
        if (isOpen && invoice) {
            const pending = Number(invoice.balance_due_usd ?? Math.max(0, Number(invoice.total_usd || 0) - Number(invoice.paid_amount_usd || 0)));
            setPaymentForm({
                payment_date: getCaracasDate(),
                amount_usd: pending > 0 ? pending.toFixed(2) : '',
                payment_method: invoice.payment_method || 'ZELLE',
                reference: '',
                notes: ''
            });
        }
    }, [isOpen, invoice?.id, invoice?.balance_due_usd]);

    if (!isOpen || !invoice) return null;

    const totalUsd = Number(invoice.total_usd || 0);
    const paidUsd = Number(invoice.paid_amount_usd || 0);
    const balanceDue = Number(invoice.balance_due_usd !== undefined ? invoice.balance_due_usd : Math.max(0, totalUsd - paidUsd));
    const progressPct = totalUsd > 0 ? Math.min(100, Math.round((paidUsd / totalUsd) * 100)) : 0;
    const payments = invoice.payments || [];

    const milestone1Pct = Number(invoice.technical_specs?.payment_milestone_1_pct || 70);
    const milestone2Pct = Number(invoice.technical_specs?.payment_milestone_2_pct || 30);

    const handleSubmitPayment = (e) => {
        e.preventDefault();
        if (!paymentForm.amount_usd || Number(paymentForm.amount_usd) <= 0) {
            notify.warning('Ingrese un monto de abono válido mayor a $0.');
            return;
        }
        setIsSavingPayment(true);
        router.post(`/invoices/${invoice.id}/payments`, paymentForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingPayment(false);
                setPaymentForm(prev => ({ ...prev, reference: '', notes: '' }));
                notify.success('Abono registrado correctamente.');
            },
            onError: (err) => {
                setIsSavingPayment(false);
                notify.error(Object.values(err).join(', ') || 'Error al registrar el abono.');
            }
        });
    };

    const handleDeletePayment = async (paymentId) => {
        const ok = await confirm({
            title: 'Eliminar Registro de Abono',
            message: '¿Deseas eliminar este abono? El saldo pendiente y estado del documento se recalcularán automáticamente.',
            confirmLabel: 'Eliminar Abono',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(`/invoice-payments/${paymentId}`, {
            preserveScroll: true,
            onSuccess: () => notify.info('Abono eliminado y saldo actualizado.'),
            onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo eliminar el abono.'),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
            <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                {/* Cabecera */}
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-700" />
                        <div>
                            <h3 className="text-sm font-black text-black uppercase leading-tight">
                                Control de Abonos & Saldo Pendiente
                            </h3>
                            <p className="text-[11px] font-bold text-slate-600">
                                {invoice.correlative_number} • {invoice.client?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Resumen Financiero + Barra de Progreso */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2.5 shadow-sm">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Doc.</span>
                            <span className="text-sm font-mono font-black text-white">${totalUsd.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Abonado</span>
                            <span className="text-sm font-mono font-black text-emerald-400">${paidUsd.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pendiente</span>
                            <span className={`text-sm font-mono font-black ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                ${balanceDue.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-300">
                            <span>Progreso de Pago</span>
                            <span>{progressPct}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${progressPct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Formulario Nuevo Abono (si queda saldo pendiente o se desea registrar otro) */}
                {balanceDue > 0 && invoice.status !== 'anulada' ? (
                    <form onSubmit={handleSubmitPayment} className="p-3.5 bg-emerald-50/70 rounded-xl border-2 border-emerald-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-black text-emerald-950 uppercase">
                                + Registrar Nuevo Abono / Pago
                            </span>
                            <div className="flex flex-wrap gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPaymentForm(prev => ({ ...prev, amount_usd: balanceDue.toFixed(2) }))}
                                    className="px-2 py-0.5 bg-white hover:bg-emerald-100 border border-emerald-300 rounded text-[10px] font-black text-emerald-900 cursor-pointer"
                                >
                                    Saldo 100% (${balanceDue.toFixed(2)})
                                </button>
                                {(invoice.document_type === 'proforma' || invoice.document_type === 'cotizacion') && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentForm(prev => ({ ...prev, amount_usd: (totalUsd * milestone1Pct / 100).toFixed(2) }))}
                                            className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[10px] font-black text-amber-900 cursor-pointer"
                                        >
                                            {milestone1Pct}% (${(totalUsd * milestone1Pct / 100).toFixed(2)})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentForm(prev => ({ ...prev, amount_usd: (totalUsd * milestone2Pct / 100).toFixed(2) }))}
                                            className="px-2 py-0.5 bg-white hover:bg-blue-100 border border-blue-300 rounded text-[10px] font-black text-blue-900 cursor-pointer"
                                        >
                                            {milestone2Pct}% (${(totalUsd * milestone2Pct / 100).toFixed(2)})
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                                <label className="text-[11px] font-black text-black block mb-1">Fecha *</label>
                                <input
                                    type="date"
                                    required
                                    value={paymentForm.payment_date}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2 text-xs font-black text-black"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-black block mb-1">Monto USD ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={paymentForm.amount_usd}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_usd: e.target.value }))}
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-black text-black"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-black block mb-1">Método de Pago *</label>
                                <input
                                    type="text"
                                    list="payment-methods-modal"
                                    required
                                    value={paymentForm.payment_method}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value.toUpperCase() }))}
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-black text-black uppercase"
                                />
                                <datalist id="payment-methods-modal">
                                    <option value="ZELLE" />
                                    <option value="PAGO MOVIL" />
                                    <option value="TRANSFERENCIA BANCARIA" />
                                    <option value="EFECTIVO (USD)" />
                                    <option value="BINANCE / USDT" />
                                </datalist>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                                <label className="text-[11px] font-black text-black block mb-1">N° Referencia (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 18293049..."
                                    value={paymentForm.reference}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-black block mb-1">Nota (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 1er anticipo contrato 70%..."
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-medium text-black"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingPayment}
                            className="h-9 w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{isSavingPayment ? 'Registrando...' : 'Registrar Abono'}</span>
                        </button>
                    </form>
                ) : (
                    <div className="p-3 bg-emerald-100 border border-emerald-400 rounded-xl flex items-center gap-2 text-xs font-black text-emerald-950">
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span>
                            {invoice.status === 'anulada'
                                ? 'Documento anulado — no admite nuevos abonos.'
                                : '¡Documento saldado al 100%! Estado actualizado a PAGADA.'}
                        </span>
                    </div>
                )}

                {/* Historial de Abonos */}
                <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wide">
                        Historial de Abonos Registrados ({payments.length})
                    </h4>

                    {payments.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                            No hay abonos parciales registrados aún para este documento.
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {payments.map((pay) => (
                                <div key={pay.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-300 flex items-center justify-between gap-2 text-xs">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-black text-emerald-800 text-sm">
                                                +${Number(pay.amount_usd).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] font-black bg-white border border-slate-300 px-1.5 py-0.5 rounded uppercase text-slate-900">
                                                {pay.payment_method}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-slate-600">
                                                {formatCaracasDate(pay.payment_date)}
                                            </span>
                                        </div>
                                        {(pay.reference || pay.notes) && (
                                            <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                                                {pay.reference ? `Ref: ${pay.reference}` : ''}{pay.reference && pay.notes ? ' • ' : ''}{pay.notes || ''}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeletePayment(pay.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer transition-colors shrink-0"
                                        title="Eliminar abono"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

