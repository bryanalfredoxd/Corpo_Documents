import React from 'react';
import {
    Printer,
    Plus,
    ArrowUpDown,
    CheckCircle2,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { getDocumentTypeInfo } from '../../Utils/invoiceConstants';
import { formatCaracasDate } from '../../Utils/dateUtils';

export default function DocumentsView({
    invoices = [],
    searchQuery = '',
    invoicePage = 1,
    setInvoicePage,
    invoicePageSize = 10,
    handleNewInvoice,
    handleLoadInvoiceToEditor,
    handlePrintDocument
}) {
    // Filtrar facturas del Libro Fiscal
    const filteredInvoices = invoices.filter(inv => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (inv.correlative_number && inv.correlative_number.toLowerCase().includes(q)) ||
            (inv.control_number && inv.control_number.toLowerCase().includes(q)) ||
            (inv.client?.name && inv.client.name.toLowerCase().includes(q)) ||
            (inv.client?.tax_id && inv.client.tax_id.toLowerCase().includes(q)) ||
            (inv.company?.name && inv.company.name.toLowerCase().includes(q))
        );
    });

    const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / invoicePageSize));
    const paginatedInvoices = filteredInvoices.slice(
        (invoicePage - 1) * invoicePageSize,
        invoicePage * invoicePageSize
    );

    return (
        <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
            {/* Cabecera de la tabla */}
            <div className="p-3.5 sm:p-5 border-b-2 border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-100/70">
                <div>
                    <h2 className="text-sm font-black text-black uppercase tracking-tight">
                        Libro de Ventas & Registro Histórico de Facturas (Base de Datos)
                    </h2>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                        Facturas y proformas registradas con sus empresas emisoras, clientes y montos
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => window.print()}
                        className="h-8 sm:h-9 px-3 sm:px-3.5 bg-white border-2 border-slate-400 hover:bg-slate-200 text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial"
                    >
                        <Printer className="w-4 h-4 text-black" />
                        <span>Imprimir Libro</span>
                    </button>
                    <button
                        onClick={handleNewInvoice}
                        className="h-8 sm:h-9 px-3.5 sm:px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial"
                    >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Emitir Factura</span>
                    </button>
                </div>
            </div>

            {/* Indicador de desplazamiento horizontal para móviles */}
            <div className="md:hidden px-3.5 py-1.5 bg-blue-50 text-blue-900 border-b border-blue-200 text-[11px] font-bold flex items-center justify-between">
                <span>↔ Desliza la tabla para ver todos los datos</span>
                <ArrowUpDown className="w-3.5 h-3.5 rotate-90 text-blue-700" />
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                    <thead className="bg-slate-200 text-black uppercase text-xs font-black tracking-wider border-b-2 border-slate-400">
                        <tr>
                            <th className="px-5 py-3.5">Correlativo</th>
                            <th className="px-4 py-3.5">Empresa Emisora</th>
                            <th className="px-4 py-3.5">Cliente / Receptor</th>
                            <th className="px-4 py-3.5">Tipo</th>
                            <th className="px-4 py-3.5">Fecha</th>
                            <th className="px-4 py-3.5">Tasa BS</th>
                            <th className="px-4 py-3.5">Total USD</th>
                            <th className="px-4 py-3.5">Total VES</th>
                            <th className="px-4 py-3.5">Estado</th>
                            <th className="px-5 py-3.5 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-200 font-medium">
                        {paginatedInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-5 py-12 text-center text-slate-500 font-bold text-xs">
                                    No se encontraron documentos fiscales registrados
                                    {searchQuery && ` para la búsqueda "${searchQuery}"`}.
                                </td>
                            </tr>
                        ) : (
                            paginatedInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-amber-50/50 transition-colors">
                                    <td className="px-5 py-4 font-mono font-black text-blue-900 text-sm">
                                        {inv.correlative_number}
                                        <span className="block text-[10px] font-bold text-slate-800">
                                            Control: {inv.control_number || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2.5">
                                            {inv.company?.logo_url && (
                                                <img
                                                    src={inv.company.logo_url}
                                                    alt=""
                                                    className="h-7 w-7 object-contain rounded-md shrink-0 bg-white border border-slate-300 p-0.5 shadow-xs"
                                                />
                                            )}
                                            <div>
                                                <span className="font-black text-black block text-xs">
                                                    {inv.company?.name}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-800 font-bold">
                                                    {inv.company?.tax_id}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 max-w-[200px]">
                                        <span className="font-black text-black block text-xs">
                                            {inv.client?.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-800 font-bold">
                                            {inv.client?.tax_id}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 uppercase font-bold text-xs">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                            inv.document_type === 'factura'
                                                ? 'bg-blue-100 text-blue-900 border border-blue-400'
                                                : inv.document_type === 'proforma'
                                                ? 'bg-amber-100 text-amber-900 border border-amber-400'
                                                : inv.document_type === 'cotizacion'
                                                ? 'bg-purple-100 text-purple-900 border border-purple-400'
                                                : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                                        }`}>
                                            {getDocumentTypeInfo(inv.document_type).badgeText}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 font-mono font-bold text-slate-900">
                                        {formatCaracasDate(inv.issue_date)}
                                    </td>
                                    <td className="px-4 py-4 font-mono text-xs font-bold text-slate-900">
                                        {inv.show_bs_conversion === false || inv.technical_specs?.show_bs_conversion === false ? (
                                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                Solo USD
                                            </span>
                                        ) : (
                                            `Bs. ${Number(inv.bcv_exchange_rate).toFixed(2)}`
                                        )}
                                    </td>
                                    <td className="px-4 py-4 font-mono font-black text-black text-sm">
                                        ${Number(inv.total_usd).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4 font-mono font-bold text-slate-900 text-xs">
                                        {inv.show_bs_conversion === false || inv.technical_specs?.show_bs_conversion === false ? (
                                            <span className="text-slate-400 font-normal">—</span>
                                        ) : (
                                            `Bs. ${Number(inv.total_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-500">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleLoadInvoiceToEditor(inv)}
                                                className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-300 text-black font-black border-2 border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Cargar y Ver en Visor A4"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Ver</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleLoadInvoiceToEditor(inv);
                                                    setTimeout(() => handlePrintDocument(), 350);
                                                }}
                                                className="h-8 px-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Imprimir / Descargar PDF"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>PDF</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Barra de Paginación */}
            <div className="p-3 sm:px-5 sm:py-3.5 border-t-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                <div className="text-xs font-black text-slate-700 text-center sm:text-left">
                    {filteredInvoices.length === 0 ? (
                        <span>0 documentos encontrados</span>
                    ) : (
                        <span>
                            Mostrando <strong className="text-black">{(invoicePage - 1) * invoicePageSize + 1}</strong> a{' '}
                            <strong className="text-black">{Math.min(invoicePage * invoicePageSize, filteredInvoices.length)}</strong> de{' '}
                            <strong className="text-black">{filteredInvoices.length}</strong> facturas (Pág. {invoicePage}/{totalInvoicePages})
                        </span>
                    )}
                </div>

                {totalInvoicePages > 1 && (
                    <div className="flex items-center space-x-1.5 flex-wrap justify-center">
                        <button
                            type="button"
                            onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                            disabled={invoicePage === 1}
                            className="h-8 px-2.5 rounded-lg border-2 border-slate-300 text-xs font-black text-black bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Anterior</span>
                        </button>

                        <div className="flex sm:hidden items-center px-2 font-mono font-bold text-xs text-black">
                            {invoicePage} / {totalInvoicePages}
                        </div>

                        <div className="hidden sm:flex items-center space-x-1.5">
                            {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).map(pageNumber => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    onClick={() => setInvoicePage(pageNumber)}
                                    className={`h-8 w-8 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                                        invoicePage === pageNumber
                                            ? 'bg-blue-700 text-white shadow-xs'
                                            : 'bg-white border-2 border-slate-300 text-black hover:bg-slate-200'
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                            disabled={invoicePage === totalInvoicePages}
                            className="h-8 px-2.5 rounded-lg border-2 border-slate-300 text-xs font-black text-black bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <span className="hidden xs:inline">Siguiente</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

