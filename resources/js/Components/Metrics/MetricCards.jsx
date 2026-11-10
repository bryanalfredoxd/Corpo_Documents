import React from 'react';
import { DollarSign, Receipt, Plus } from 'lucide-react';

export default function MetricCards({
    stats = {},
    invoicesCount = 0,
    companiesCount = 0,
    clientsCount = 0,
    onOpenCreateCompany,
    onOpenCreateClient
}) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 no-print">
            {/* Tarjeta 1: Total Facturado */}
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                <div>
                    <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                            Total Facturado (DB)
                        </span>
                        <div className="p-1 sm:p-2 bg-emerald-50 text-emerald-700 rounded-md sm:rounded-xl border border-emerald-200 shrink-0">
                            <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <span
                        className="text-base sm:text-2xl font-black text-black font-mono block truncate"
                        title={`$${Number(stats.total_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    >
                        ${Number(stats.total_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="font-bold text-slate-600 hidden sm:inline">Acumulado en BD</span>
                    <span className="font-mono font-black text-emerald-800 bg-emerald-100/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                        USD ($)
                    </span>
                </div>
            </div>

            {/* Tarjeta 2: Documentos Emitidos */}
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                <div>
                    <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                            Documentos Emitidos
                        </span>
                        <div className="p-1 sm:p-2 bg-blue-50 text-blue-700 rounded-md sm:rounded-xl border border-blue-200 shrink-0">
                            <Receipt className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <span className="text-base sm:text-2xl font-black text-blue-900 font-mono block truncate">
                        {stats.invoices_count || invoicesCount}
                    </span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="font-bold text-slate-600 hidden sm:inline">Comprobantes válidos</span>
                    <span className="font-mono font-black text-blue-900 bg-blue-100/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                        Registros
                    </span>
                </div>
            </div>

            {/* Tarjeta 3: Empresas Emisoras */}
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                <div>
                    <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                            Empresas Emisoras
                        </span>
                        <button
                            onClick={onOpenCreateCompany}
                            className="h-6 sm:h-7 px-1.5 sm:px-2.5 bg-black hover:bg-slate-800 text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0"
                            title="Añadir nueva empresa emisora"
                        >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Empresa</span>
                        </button>
                    </div>
                    <span className="text-base sm:text-2xl font-black text-black font-mono block truncate">
                        {stats.companies_count || companiesCount}
                    </span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="font-bold text-slate-600 hidden sm:inline">Emisores en BD</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                        Activas
                    </span>
                </div>
            </div>

            {/* Tarjeta 4: Clientes Registrados */}
            <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                <div>
                    <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                            Clientes Registrados
                        </span>
                        <button
                            onClick={onOpenCreateClient}
                            className="h-6 sm:h-7 px-1.5 sm:px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0"
                            title="Añadir nuevo cliente"
                        >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Cliente</span>
                        </button>
                    </div>
                    <span className="text-base sm:text-2xl font-black text-black font-mono block truncate">
                        {stats.clients_count || clientsCount}
                    </span>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="font-bold text-slate-600 hidden sm:inline">Directorio en BD</span>
                    <span className="font-mono font-black text-emerald-900 bg-emerald-100/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                        Activos
                    </span>
                </div>
            </div>
        </div>
    );
}

