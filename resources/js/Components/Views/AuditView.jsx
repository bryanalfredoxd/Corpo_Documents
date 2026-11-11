import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    History,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FilePlus2,
    FileEdit,
    Wallet,
    ArrowRightLeft,
    Ban,
    Trash2,
    RefreshCw,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useFeedback } from '../../Contexts/FeedbackContext';

export default function AuditView({
    initialLogs = {},
    initialSummary = {}
}) {
    const { notify } = useFeedback();
    const [logsData, setLogsData] = useState(initialLogs);
    const [summary, setSummary] = useState(initialSummary);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('todos');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        setLogsData(initialLogs);
        setSummary(initialSummary);
    }, [initialLogs, initialSummary]);

    const fetchAuditLogs = async (overrides = {}) => {
        setIsLoading(true);
        try {
            const params = {
                search: overrides.search !== undefined ? overrides.search : search,
                action: overrides.action !== undefined ? overrides.action : actionFilter,
                start_date: overrides.start_date !== undefined ? overrides.start_date : startDate,
                end_date: overrides.end_date !== undefined ? overrides.end_date : endDate,
                page: overrides.page !== undefined ? overrides.page : 1,
            };
            const response = await axios.get('/audit-logs', { params });
            setLogsData(response.data.logs);
            setSummary(response.data.summary);
        } catch {
            notify.error('No se pudo cargar el historial de actividad. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            fetchAuditLogs({ page: 1 });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, actionFilter, startDate, endDate]);

    const rows = Array.isArray(logsData) ? logsData : (logsData?.data || []);
    const currentPage = Number(logsData?.current_page || 1);
    const lastPage = Number(logsData?.last_page || 1);
    const total = Number(logsData?.total || rows.length);

    const actionMeta = (action) => {
        switch (action) {
            case 'created':
                return {
                    label: 'Creación',
                    badge: 'bg-blue-100 text-blue-900 border-blue-300',
                    icon: <FilePlus2 className="w-4 h-4 text-blue-700" />,
                };
            case 'updated':
                return {
                    label: 'Modificación',
                    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                    icon: <FileEdit className="w-4 h-4 text-indigo-700" />,
                };
            case 'status_changed':
                return {
                    label: 'Cambio Estado',
                    badge: 'bg-sky-100 text-sky-900 border-sky-300',
                    icon: <CheckCircle2 className="w-4 h-4 text-sky-700" />,
                };
            case 'converted':
                return {
                    label: 'Conversión',
                    badge: 'bg-purple-100 text-purple-900 border-purple-300',
                    icon: <ArrowRightLeft className="w-4 h-4 text-purple-700" />,
                };
            case 'payment_added':
                return {
                    label: 'Abono Registrado',
                    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    icon: <Wallet className="w-4 h-4 text-emerald-700" />,
                };
            case 'payment_deleted':
                return {
                    label: 'Abono Eliminado',
                    badge: 'bg-amber-100 text-amber-900 border-amber-300',
                    icon: <Wallet className="w-4 h-4 text-amber-700" />,
                };
            case 'annulled':
                return {
                    label: 'Anulación',
                    badge: 'bg-orange-100 text-orange-950 border-orange-400',
                    icon: <Ban className="w-4 h-4 text-orange-700" />,
                };
            case 'deleted':
                return {
                    label: 'Eliminación',
                    badge: 'bg-red-100 text-red-900 border-red-300',
                    icon: <Trash2 className="w-4 h-4 text-red-700" />,
                };
            default:
                return {
                    label: action,
                    badge: 'bg-slate-100 text-slate-900 border-slate-300',
                    icon: <History className="w-4 h-4 text-slate-700" />,
                };
        }
    };

    const formatTimestamp = (iso) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('es-VE', {
                timeZone: 'America/Caracas',
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-4">
            {/* Tarjetas de Resumen Rápido de Movimientos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                <div className="bg-white rounded-xl border-2 border-slate-300 p-3 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-slate-600 block">Total Movimientos</span>
                    <span className="text-xl font-mono font-black text-black mt-0.5 block">{summary?.total ?? 0}</span>
                </div>
                <div className="bg-white rounded-xl border-2 border-blue-200 p-3 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-blue-800 block">Documentos Creados</span>
                    <span className="text-xl font-mono font-black text-blue-900 mt-0.5 block">{summary?.created ?? 0}</span>
                </div>
                <div className="bg-white rounded-xl border-2 border-indigo-200 p-3 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-indigo-800 block">Ediciones & Estados</span>
                    <span className="text-xl font-mono font-black text-indigo-900 mt-0.5 block">{summary?.updated ?? 0}</span>
                </div>
                <div className="bg-white rounded-xl border-2 border-emerald-200 p-3 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-emerald-800 block">Movimientos de Pagos</span>
                    <span className="text-xl font-mono font-black text-emerald-900 mt-0.5 block">{summary?.payments ?? 0}</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-white rounded-xl border-2 border-red-200 p-3 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-red-800 block">Anulaciones / Bajas</span>
                    <span className="text-xl font-mono font-black text-red-900 mt-0.5 block">{summary?.annulled_deleted ?? 0}</span>
                </div>
            </div>

            {/* Cabecera & Barra de Filtros AJAX */}
            <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
                <div className="p-4 border-b-2 border-slate-300 bg-slate-100/70 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-slate-900 text-amber-400 rounded-xl shrink-0">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-black uppercase tracking-tight">
                                    Bitácora de Auditoría y Control Fiscal
                                </h2>
                                <p className="text-xs font-bold text-slate-600">
                                    Historial cronológico automático de emisiones, ediciones, pagos y anulaciones
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchAuditLogs({ page: currentPage })}
                            disabled={isLoading}
                            className="h-9 px-3 bg-white hover:bg-slate-200 border-2 border-slate-300 rounded-lg text-xs font-black text-black flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-700' : ''}`} />
                            <span>{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                        <div className="lg:col-span-5 relative">
                            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por correlativo (F-0001), descripción o responsable..."
                                className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg pl-9 pr-3 text-xs font-bold text-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>

                        <div className="lg:col-span-3 relative">
                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="h-9 w-full appearance-none bg-white border-2 border-slate-300 rounded-lg pl-3 pr-9 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                            >
                                <option value="todos">Todas las Acciones</option>
                                <option value="created">Creaciones de Documentos</option>
                                <option value="updated">Ediciones</option>
                                <option value="payments">Abonos y Pagos</option>
                                <option value="converted">Conversiones a Factura</option>
                                <option value="annulled_deleted">Anulaciones y Eliminaciones</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-600 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>

                        <div className="lg:col-span-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                title="Desde fecha"
                                className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                title="Hasta fecha"
                                className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                            />
                        </div>
                    </div>
                </div>

                {/* Lista / Timeline Responsivo sin Scroll Horizontal */}
                <div className="divide-y divide-slate-200">
                    {rows.length === 0 ? (
                        <div className="py-12 px-4 text-center space-y-2">
                            <History className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="text-xs font-black text-slate-700">
                                No se encontraron registros de actividad para los filtros seleccionados.
                            </p>
                        </div>
                    ) : (
                        rows.map((log) => {
                            const meta = actionMeta(log.action);
                            const m = log.metadata || {};
                            return (
                                <div key={log.id} className="p-3.5 sm:px-5 sm:py-3.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                                            {meta.icon}
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${meta.badge}`}>
                                                    {meta.label}
                                                </span>
                                                {log.correlative_number && (
                                                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-black text-[11px]">
                                                        {log.correlative_number}
                                                    </span>
                                                )}
                                                {m.total_usd !== undefined && (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono font-black text-[10px]">
                                                        ${Number(m.total_usd).toFixed(2)}
                                                    </span>
                                                )}
                                                {m.amount_usd !== undefined && (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono font-black text-[10px]">
                                                        Abono: ${Number(m.amount_usd).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 leading-snug">
                                                {log.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] shrink-0 pl-11 sm:pl-0">
                                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            {formatTimestamp(log.created_at)}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">
                                            Por: <strong className="text-slate-800">{log.user?.name || 'Sistema'}</strong>
                                            {log.ip_address ? ` • ${log.ip_address}` : ''}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Paginación AJAX */}
                <div className="p-3 sm:px-5 sm:py-3.5 border-t-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <span className="text-xs font-black text-slate-700">
                        {total} eventos registrados (Pág. {currentPage} / {lastPage})
                    </span>

                    {lastPage > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => fetchAuditLogs({ page: Math.max(1, currentPage - 1) })}
                                disabled={currentPage <= 1 || isLoading}
                                className="h-8 px-2.5 rounded-lg border-2 border-slate-300 text-xs font-black text-black bg-white hover:bg-slate-200 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Anterior</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fetchAuditLogs({ page: Math.min(lastPage, currentPage + 1) })}
                                disabled={currentPage >= lastPage || isLoading}
                                className="h-8 px-2.5 rounded-lg border-2 border-slate-300 text-xs font-black text-black bg-white hover:bg-slate-200 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                            >
                                <span>Siguiente</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

