import React from 'react';
import { History, X, User, ShieldCheck } from 'lucide-react';

export default function InvoiceAuditModal({
    isOpen,
    onClose,
    invoice
}) {
    if (!isOpen || !invoice) return null;

    const logs = invoice.audit_logs || [];

    const actionStyle = (action) => {
        switch (action) {
            case 'created':
                return 'bg-blue-100 text-blue-900 border-blue-300';
            case 'annulled':
            case 'deleted':
                return 'bg-red-100 text-red-900 border-red-300';
            case 'payment_added':
                return 'bg-emerald-100 text-emerald-900 border-emerald-300';
            case 'payment_deleted':
                return 'bg-amber-100 text-amber-900 border-amber-300';
            case 'converted':
                return 'bg-purple-100 text-purple-900 border-purple-300';
            default:
                return 'bg-slate-100 text-slate-900 border-slate-300';
        }
    };

    const actionLabel = (action) => {
        const labels = {
            created: 'Creación',
            updated: 'Edición',
            status_changed: 'Cambio de Estado',
            annulled: 'Anulación',
            converted: 'Conversión a Factura',
            payment_added: 'Abono Registrado',
            payment_deleted: 'Abono Eliminado',
            deleted: 'Eliminación',
        };
        return labels[action] || action;
    };

    const formatTimestamp = (iso) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('es-VE', {
                timeZone: 'America/Caracas',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-900 text-white rounded-xl">
                            <History className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-black uppercase tracking-tight">
                                Auditoría • {invoice.correlative_number}
                            </h3>
                            <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                <span>Creado originalmente por: <strong>{invoice.user?.name || 'Sistema'}</strong></span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {logs.length === 0 ? (
                        <div className="py-10 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                            No hay eventos detallados posteriores a la migración para este documento.
                            <div className="text-[11px] mt-1 text-slate-600">
                                Emisor registrado: {invoice.user?.name || 'Administrador'}
                            </div>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${actionStyle(log.action)}`}>
                                        {actionLabel(log.action)}
                                    </span>
                                    <span className="font-mono text-[11px] font-bold text-slate-600">
                                        {formatTimestamp(log.created_at)}
                                    </span>
                                </div>
                                <p className="font-black text-black">
                                    {log.description}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/70">
                                    <span className="inline-flex items-center gap-1 font-bold">
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                                        {log.user?.name || 'Sistema'} {log.user?.role ? `(${log.user.role})` : ''}
                                    </span>
                                    {log.ip_address && (
                                        <span className="font-mono text-[10px] text-slate-500">
                                            IP: {log.ip_address}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-black cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

