import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, X, Download, Building2, Calendar, Filter } from 'lucide-react';
import { getCaracasDate } from '../../Utils/dateUtils';

export default function SalesBookExportModal({
    isOpen,
    onClose,
    companies = [],
    defaultCompanyId = 'all'
}) {
    const today = getCaracasDate();
    const currentMonth = today.slice(0, 7); // YYYY-MM

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [companyId, setCompanyId] = useState(defaultCompanyId ? String(defaultCompanyId) : 'all');
    const [startDate, setStartDate] = useState(`${currentMonth}-01`);
    const [endDate, setEndDate] = useState(today);
    const [scope, setScope] = useState('fiscal'); // 'fiscal' | 'all'
    const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'csv'
    const [includeAnnulled, setIncludeAnnulled] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setCompanyId(defaultCompanyId ? String(defaultCompanyId) : 'all');
        }
    }, [isOpen, defaultCompanyId]);

    if (!isOpen) return null;

    const handleMonthChange = (ym) => {
        setSelectedMonth(ym);
        if (ym && /^\d{4}-\d{2}$/.test(ym)) {
            const [y, m] = ym.split('-').map(Number);
            const lastDay = new Date(y, m, 0).getDate();
            setStartDate(`${ym}-01`);
            setEndDate(`${ym}-${String(lastDay).padStart(2, '0')}`);
        }
    };

    const handleDownload = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (companyId && companyId !== 'all') params.set('company_id', companyId);
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        params.set('scope', scope);
        params.set('format', format);
        params.set('include_annulled', includeAnnulled ? '1' : '0');

        window.location.assign(`/reports/sales-book?${params.toString()}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-black uppercase tracking-tight">
                                Exportar Libro de Ventas (Excel / CSV)
                            </h3>
                            <p className="text-[11px] font-bold text-slate-600">
                                Desglose fiscal SENIAT: Base Imponible, Exento, IVA 16%, USD y VES
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

                <form onSubmit={handleDownload} className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-black flex items-center gap-1.5 mb-1">
                            <Building2 className="w-3.5 h-3.5 text-blue-700" />
                            <span>Empresa Emisora</span>
                        </label>
                        <select
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                            className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        >
                            <option value="all">Todas las empresas emisoras consolidadas</option>
                            {companies.map(c => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name} — RIF: {c.tax_id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div>
                            <label className="text-xs font-black text-black flex items-center gap-1.5 mb-1">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Selección rápida por Mes Contable</span>
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="h-9 w-full bg-white border border-slate-300 rounded-lg px-3 text-xs font-mono font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-black text-slate-700 block mb-1">
                                    Fecha Desde
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-9 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-700 block mb-1">
                                    Fecha Hasta
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black flex items-center gap-1.5 mb-1">
                                <Filter className="w-3.5 h-3.5 text-indigo-700" />
                                <span>Alcance del Reporte</span>
                            </label>
                            <select
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                                <option value="fiscal">Solo Facturas Fiscales (SENIAT)</option>
                                <option value="all">Todos los Documentos Emitidos</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-black text-black flex items-center gap-1.5 mb-1">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Formato de Archivo</span>
                            </label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                                <option value="xlsx">Excel Nativo (.xlsx) — Recomendado</option>
                                <option value="csv">CSV Contable (UTF-8 .csv)</option>
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer text-xs font-bold text-amber-950 select-none">
                        <input
                            type="checkbox"
                            checked={includeAnnulled}
                            onChange={(e) => setIncludeAnnulled(e.target.checked)}
                            className="rounded border-amber-400 text-emerald-700 h-4 w-4"
                        />
                        <span>Incluir documentos ANULADOS en secuencia fiscal (con montos declarados en 0.00)</span>
                    </label>

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 bg-white border-2 border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-black text-black cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="h-9 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>{format === 'xlsx' ? 'Descargar Excel (.xlsx)' : 'Descargar Archivo (.csv)'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

