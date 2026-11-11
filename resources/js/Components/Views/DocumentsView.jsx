import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Printer,
    Plus,
    CheckCircle2,
    Eye,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    FileEdit,
    Ban,
    Trash2,
    DollarSign,
    Send,
    ArrowRightLeft,
    Wallet,
    FileSpreadsheet,
    History,
    MoreVertical,
    Loader2
} from 'lucide-react';
import { getDocumentTypeInfo } from '../../Utils/invoiceConstants';
import { formatCaracasDate } from '../../Utils/dateUtils';
import { useFeedback } from '../../Contexts/FeedbackContext';

export default function DocumentsView({
    invoices = [],
    companies = [],
    filters = {},
    statusCounts = {},
    searchQuery = '',
    isLoadingTable = false,
    onFilterChange,
    onPageChange,
    handleNewInvoice,
    handleLoadInvoiceToEditor,
    handlePrintDocument,
    onOpenPaymentsModal,
    onOpenExportModal,
    onOpenAuditModal
}) {
    const { confirm, notify } = useFeedback();
    const [openMenuInvoiceId, setOpenMenuInvoiceId] = useState(null);

    const isPaginator = !Array.isArray(invoices) && invoices && Array.isArray(invoices.data);
    const invoiceRows = isPaginator ? invoices.data : (Array.isArray(invoices) ? invoices : []);
    const currentPage = isPaginator ? Number(invoices.current_page || 1) : 1;
    const lastPage = isPaginator ? Number(invoices.last_page || 1) : 1;
    const totalRecords = isPaginator ? Number(invoices.total || 0) : invoiceRows.length;
    const fromRecord = isPaginator ? (invoices.from || 0) : (invoiceRows.length > 0 ? 1 : 0);
    const toRecord = isPaginator ? (invoices.to || 0) : invoiceRows.length;

    const activeStatus = filters?.status || 'todos';
    const activeCompanyFilter = filters?.company_id || 'all';
    const activeDocTypeFilter = filters?.document_type || 'all';

    const handleChangeStatus = async (inv, newStatus) => {
        setOpenMenuInvoiceId(null);
        const config = {
            anulada: {
                title: 'Anular Documento Fiscal',
                message: `¿Deseas ANULAR el documento ${inv.correlative_number}?\n\nConservará su correlativo fiscal, restaurará inventario si aplica y no sumará a ingresos.`,
                confirmLabel: 'Sí, Anular Documento',
                variant: 'warning',
            },
            emitida: {
                title: 'Emitir Borrador Oficial',
                message: `¿Deseas EMITIR formalmente el borrador ${inv.correlative_number}? Se le asignará un correlativo fiscal oficial.`,
                confirmLabel: 'Emitir Ahora',
                variant: 'primary',
            },
            pagada: {
                title: 'Marcar como Pagada',
                message: `¿Confirmas marcar el documento ${inv.correlative_number} como PAGADO al 100%?`,
                confirmLabel: 'Marcar Pagada',
                variant: 'primary',
            },
        }[newStatus];

        if (config) {
            const ok = await confirm(config);
            if (!ok) return;
        }

        router.patch(`/invoices/${inv.id}/status`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => notify.success('Estado del documento actualizado.'),
            onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo actualizar el estado.'),
        });
    };

    const handleDeleteInvoice = async (inv) => {
        setOpenMenuInvoiceId(null);
        const ok = await confirm({
            title: 'Eliminar Documento Permanentemente',
            message: `¿Estás seguro de ELIMINAR de forma permanente el registro ${inv.correlative_number}?\n\nSi es una factura fiscal emitida, es recomendable Anularla para no dejar huecos en la numeración.`,
            confirmLabel: 'Eliminar Permanente',
            variant: 'danger',
        });
        if (!ok) return;

        router.delete(`/invoices/${inv.id}`, {
            preserveScroll: true,
            onSuccess: () => notify.info(`Documento ${inv.correlative_number} eliminado.`),
            onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo eliminar el documento.'),
        });
    };

    const handleConvertToInvoice = async (inv) => {
        setOpenMenuInvoiceId(null);
        const ok = await confirm({
            title: 'Convertir a Factura Fiscal',
            message: `¿Deseas convertir "${inv.correlative_number}" en una Factura Fiscal oficial?\n\nSe clonarán los productos, cliente y montos generando un nuevo número de factura.`,
            confirmLabel: 'Convertir a Factura',
            variant: 'primary',
        });
        if (!ok) return;

        router.post(`/invoices/${inv.id}/convert-to-invoice`, {}, {
            preserveScroll: true,
            onSuccess: () => notify.success(`Factura Fiscal generada a partir de ${inv.correlative_number}.`),
            onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo convertir el documento.'),
        });
    };

    const getVisiblePages = () => {
        if (lastPage <= 7) {
            return Array.from({ length: lastPage }, (_, i) => i + 1);
        }
        const pages = new Set([1, lastPage, currentPage, currentPage - 1, currentPage + 1]);
        return Array.from(pages)
            .filter(p => p >= 1 && p <= lastPage)
            .sort((a, b) => a - b);
    };

    const statusBadge = (status) => {
        switch (status) {
            case 'pagada':
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-500 uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Pagada
                    </span>
                );
            case 'borrador':
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-400 uppercase">
                        <FileEdit className="w-3 h-3 text-amber-700" />
                        Borrador
                    </span>
                );
            case 'anulada':
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-950 border border-red-400 uppercase">
                        <Ban className="w-3 h-3 text-red-700" />
                        Anulada
                    </span>
                );
            case 'emitida':
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-950 border border-blue-400 uppercase">
                        <Send className="w-3 h-3 text-blue-700" />
                        Emitida
                    </span>
                );
        }
    };

    const typeBadgeClass = (type) => {
        if (type === 'factura') return 'bg-blue-100 text-blue-900 border-blue-300';
        if (type === 'proforma') return 'bg-amber-100 text-amber-900 border-amber-300';
        if (type === 'cotizacion') return 'bg-purple-100 text-purple-900 border-purple-300';
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    };

    return (
        <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-visible">
            {/* Cabecera y Botones Principales */}
            <div className="p-3.5 sm:p-5 border-b-2 border-slate-300 space-y-3.5 bg-slate-100/70 rounded-t-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-tight">
                                Libro de Ventas & Historial de Documentos
                            </h2>
                            {isLoadingTable && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Actualizando...
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">
                            Facturas, proformas, cotizaciones, abonos y reportes contables por empresa emisora
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {onOpenExportModal && (
                            <button
                                type="button"
                                onClick={onOpenExportModal}
                                className="h-9 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                title="Exportar Libro de Ventas mensual o por fechas a Excel / CSV"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Exportar Libro (Excel)</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="h-9 px-3.5 bg-white border-2 border-slate-300 hover:bg-slate-200 text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                            <Printer className="w-4 h-4 text-black" />
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleNewInvoice}
                            className="h-9 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span>Emitir Factura</span>
                        </button>
                    </div>
                </div>

                {/* Barra Unificada de Filtros AJAX (Etiquetas + Selectores bien espaciados) */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[
                            { id: 'todos', label: `Todos (${statusCounts.todos ?? totalRecords})` },
                            { id: 'emitida', label: `Emitidas (${statusCounts.emitida ?? 0})` },
                            { id: 'pagada', label: `Pagadas (${statusCounts.pagada ?? 0})` },
                            { id: 'borrador', label: `Borradores (${statusCounts.borrador ?? 0})` },
                            { id: 'anulada', label: `Anuladas (${statusCounts.anulada ?? 0})` },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onFilterChange?.({ status: tab.id })}
                                className={`h-8 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                                    activeStatus === tab.id
                                        ? 'bg-black text-white border-black shadow-2xs'
                                        : 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Selectores con flecha custom (sin solapamiento de texto) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full xl:w-auto shrink-0">
                        <div className="relative w-full sm:w-56">
                            <select
                                value={activeCompanyFilter}
                                onChange={(e) => onFilterChange?.({ company_id: e.target.value })}
                                className="h-9 w-full appearance-none bg-white border-2 border-slate-300 rounded-lg pl-3 pr-9 text-xs font-black text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                title="Filtrar por Empresa Emisora"
                            >
                                <option value="all">Todas las Empresas</option>
                                {companies.map(c => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-600 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>

                        <div className="relative w-full sm:w-44">
                            <select
                                value={activeDocTypeFilter}
                                onChange={(e) => onFilterChange?.({ document_type: e.target.value })}
                                className="h-9 w-full appearance-none bg-white border-2 border-slate-300 rounded-lg pl-3 pr-9 text-xs font-black text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                title="Filtrar por Tipo de Documento"
                            >
                                <option value="all">Todos los Tipos</option>
                                <option value="factura">Facturas</option>
                                <option value="proforma">Proformas</option>
                                <option value="cotizacion">Cotizaciones</option>
                                <option value="nota_entrega">Notas de Entrega</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-600 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* VISTA MÓVIL (< md): Tarjetas verticales limpias sin scroll horizontal */}
            <div className="md:hidden divide-y divide-slate-200">
                {invoiceRows.length === 0 ? (
                    <div className="px-4 py-12 text-center text-slate-500 font-bold text-xs">
                        No se encontraron documentos registrados{searchQuery && ` para "${searchQuery}"`}.
                    </div>
                ) : (
                    invoiceRows.map(inv => {
                        const isAnnulled = inv.status === 'anulada';
                        const isSoloUsd = inv.show_bs_conversion === false || inv.technical_specs?.show_bs_conversion === false;
                        return (
                            <div key={inv.id} className={`p-4 space-y-3 ${isAnnulled ? 'bg-red-50/40 opacity-80' : ''}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`font-mono font-black text-sm text-blue-900 ${isAnnulled ? 'line-through text-red-800' : ''}`}>
                                                {inv.correlative_number}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase ${typeBadgeClass(inv.document_type)}`}>
                                                {getDocumentTypeInfo(inv.document_type).badgeText}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-600 block mt-0.5">
                                            Ctrl: {inv.control_number || 'N/A'} • {formatCaracasDate(inv.issue_date)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        {statusBadge(inv.status)}
                                        <div className={`font-mono font-black text-sm text-black mt-1 ${isAnnulled ? 'line-through text-slate-500' : ''}`}>
                                            ${Number(inv.total_usd).toFixed(2)}
                                        </div>
                                        {!isSoloUsd && (
                                            <div className="text-[10px] font-mono font-bold text-slate-600">
                                                Bs. {Number(inv.total_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                                    <div className="font-black text-black truncate">
                                        Cliente: {inv.client?.name} <span className="font-mono text-slate-600">({inv.client?.tax_id})</span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 truncate">
                                        Emisora: {inv.company?.name}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleLoadInvoiceToEditor(inv)}
                                        className="h-8 px-2.5 rounded-lg bg-slate-100 border border-slate-300 text-black font-black text-xs flex items-center gap-1 cursor-pointer"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Ver</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const fmt = inv.technical_specs?.pdf_format || ((inv.document_type === 'proforma') ? 'formato-2' : 'formato-1');
                                            window.location.assign(`/invoices/${inv.id}/pdf?format=${fmt}`);
                                        }}
                                        className="h-8 px-2.5 rounded-lg bg-blue-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>PDF</span>
                                    </button>
                                    {inv.status !== 'anulada' && onOpenPaymentsModal && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenPaymentsModal(inv)}
                                            className="h-8 px-2.5 rounded-lg bg-emerald-50 border border-emerald-400 text-emerald-900 font-black text-xs flex items-center gap-1 cursor-pointer"
                                        >
                                            <Wallet className="w-3.5 h-3.5" />
                                            <span>Abonos{(inv.payments?.length || 0) > 0 ? ` (${inv.payments.length})` : ''}</span>
                                        </button>
                                    )}
                                    {inv.document_type !== 'factura' && inv.status !== 'anulada' && inv.status !== 'borrador' && (
                                        <button
                                            type="button"
                                            onClick={() => handleConvertToInvoice(inv)}
                                            className="h-8 px-2.5 rounded-lg bg-purple-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                                        >
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                            <span>→ Factura</span>
                                        </button>
                                    )}
                                    {(inv.status === 'emitida' || inv.status === 'borrador') && (
                                        <button
                                            type="button"
                                            onClick={() => handleChangeStatus(inv, 'pagada')}
                                            className="h-8 px-2.5 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                                        >
                                            <DollarSign className="w-3.5 h-3.5" />
                                            <span>Pagada</span>
                                        </button>
                                    )}
                                    {inv.status !== 'anulada' && inv.status !== 'borrador' && (
                                        <button
                                            type="button"
                                            onClick={() => handleChangeStatus(inv, 'anulada')}
                                            className="h-8 px-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-black text-xs flex items-center gap-1 cursor-pointer"
                                        >
                                            <Ban className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteInvoice(inv)}
                                        className="h-8 px-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 font-black text-xs flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* VISTA ESCRITORIO (>= md): 5 columnas compactas SIN scroll horizontal */}
            <div className="hidden md:block w-full">
                {openMenuInvoiceId && (
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => setOpenMenuInvoiceId(null)}
                    />
                )}
                <table className="w-full text-left text-xs border-collapse table-fixed">
                    <thead className="bg-slate-200 text-black uppercase text-[11px] font-black tracking-wider border-b-2 border-slate-400">
                        <tr>
                            <th className="px-4 py-3 w-[22%]">Documento & Fecha</th>
                            <th className="px-4 py-3 w-[28%]">Cliente & Emisor</th>
                            <th className="px-4 py-3 w-[19%] text-right">Montos & Cobro</th>
                            <th className="px-4 py-3 w-[11%] text-center">Estado</th>
                            <th className="px-4 py-3 w-[20%] text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                        {invoiceRows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-slate-500 font-bold text-xs">
                                    No se encontraron documentos registrados{searchQuery && ` para "${searchQuery}"`}.
                                </td>
                            </tr>
                        ) : (
                            invoiceRows.map((inv, rowIdx) => {
                                const isAnnulled = inv.status === 'anulada';
                                const isSoloUsd = inv.show_bs_conversion === false || inv.technical_specs?.show_bs_conversion === false;
                                const isMenuOpen = openMenuInvoiceId === inv.id;
                                const openUpward = rowIdx >= invoiceRows.length - 2 && invoiceRows.length > 3;

                                return (
                                    <tr key={inv.id} className={`hover:bg-amber-50/40 transition-colors ${isAnnulled ? 'bg-red-50/30 opacity-80' : ''}`}>
                                        {/* Columna 1: Documento & Fecha */}
                                        <td className="px-4 py-3.5 align-top">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`font-mono font-black text-sm text-blue-900 ${isAnnulled ? 'line-through text-red-800' : ''}`}>
                                                    {inv.correlative_number}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase ${typeBadgeClass(inv.document_type)}`}>
                                                    {getDocumentTypeInfo(inv.document_type).badgeText}
                                                </span>
                                            </div>
                                            <div className="text-[11px] font-mono font-bold text-slate-600 mt-0.5">
                                                Ctrl: {inv.control_number || 'N/A'} • {formatCaracasDate(inv.issue_date)}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(inv.parent_invoice?.correlative_number || inv.technical_specs?.converted_from_correlative) && (
                                                    <span className="text-[9px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded">
                                                        De: {inv.parent_invoice?.correlative_number || inv.technical_specs?.converted_from_correlative}
                                                    </span>
                                                )}
                                                {inv.child_invoices && inv.child_invoices.length > 0 && (
                                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">
                                                        Facturada → {inv.child_invoices[0].correlative_number}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Columna 2: Cliente & Emisor */}
                                        <td className="px-4 py-3.5 align-top">
                                            <div className="font-black text-black text-xs truncate" title={inv.client?.name}>
                                                {inv.client?.name}
                                            </div>
                                            <div className="text-[10px] font-mono font-bold text-slate-700">
                                                {inv.client?.tax_id}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
                                                {inv.company?.logo_url && (
                                                    <img
                                                        src={inv.company.logo_url}
                                                        alt=""
                                                        className="h-4 w-4 object-contain rounded shrink-0 border border-slate-200 bg-white"
                                                    />
                                                )}
                                                <span className="truncate font-bold" title={inv.company?.name}>
                                                    {inv.company?.name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Columna 3: Montos & Cobranza */}
                                        <td className="px-4 py-3.5 align-top text-right font-mono">
                                            <div className={`font-black text-sm text-black ${isAnnulled ? 'line-through text-slate-500' : ''}`}>
                                                ${Number(inv.total_usd).toFixed(2)}
                                            </div>
                                            {isSoloUsd ? (
                                                <span className="inline-block mt-0.5 text-[10px] font-sans font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    Solo USD
                                                </span>
                                            ) : (
                                                <div className={`text-[11px] font-bold text-slate-700 ${isAnnulled ? 'line-through text-slate-400' : ''}`}>
                                                    Bs. {Number(inv.total_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                    <span className="block text-[9px] text-slate-500 font-normal">
                                                        Tasa Bs. {Number(inv.bcv_exchange_rate).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            {!isAnnulled && Number(inv.paid_amount_usd) > 0 && Number(inv.balance_due_usd) > 0 && (
                                                <div className="mt-1 text-[10px] font-sans leading-tight space-y-0.5">
                                                    <span className="block text-emerald-700 font-black">Abono: ${Number(inv.paid_amount_usd).toFixed(2)}</span>
                                                    <span className="block text-amber-700 font-black">Resta: ${Number(inv.balance_due_usd).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Columna 4: Estado */}
                                        <td className="px-4 py-3.5 align-top text-center">
                                            {statusBadge(inv.status)}
                                            {(inv.payments?.length || 0) > 0 && (
                                                <span className="block mt-1 text-[10px] font-bold text-emerald-800">
                                                    {inv.payments.length} {inv.payments.length === 1 ? 'abono' : 'abonos'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Columna 5: Acciones Compactas + Menú Desplegable */}
                                        <td className="px-4 py-3.5 align-top text-right relative">
                                            <div className="inline-flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleLoadInvoiceToEditor(inv)}
                                                    className="h-8 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-black border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                                                    title="Ver o Editar Documento en Visor A4"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Ver</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const fmt = inv.technical_specs?.pdf_format || ((inv.document_type === 'proforma') ? 'formato-2' : 'formato-1');
                                                        window.location.assign(`/invoices/${inv.id}/pdf?format=${fmt}`);
                                                    }}
                                                    className="h-8 px-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black flex items-center gap-1 transition-colors cursor-pointer"
                                                    title="Descargar PDF oficial"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                    <span>PDF</span>
                                                </button>
                                                {inv.status !== 'anulada' && onOpenPaymentsModal && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenPaymentsModal(inv)}
                                                        className={`h-8 px-2 rounded-lg font-black flex items-center gap-1 transition-colors cursor-pointer border ${
                                                            (inv.payments?.length || 0) > 0
                                                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-400 text-emerald-900'
                                                                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                                                        }`}
                                                        title="Registrar abonos o pagos parciales"
                                                    >
                                                        <Wallet className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {/* Menú React de Acciones Secundarias */}
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuInvoiceId(isMenuOpen ? null : inv.id)}
                                                        className={`h-8 w-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                                                            isMenuOpen
                                                                ? 'bg-black text-white border-black'
                                                                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                                                        }`}
                                                        title="Más acciones del documento"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {isMenuOpen && (
                                                        <div
                                                            className={`absolute right-0 z-30 w-52 bg-white border-2 border-black rounded-xl shadow-2xl py-1.5 text-left text-xs font-bold divide-y divide-slate-100 ${
                                                                openUpward ? 'bottom-full mb-1.5' : 'mt-1.5'
                                                            }`}
                                                        >
                                                            <div className="py-1">
                                                                {inv.document_type !== 'factura' && inv.status !== 'anulada' && inv.status !== 'borrador' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleConvertToInvoice(inv)}
                                                                        className="w-full px-3 py-2 hover:bg-purple-50 text-purple-900 flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <ArrowRightLeft className="w-3.5 h-3.5 text-purple-700" />
                                                                        <span>Convertir a Factura Fiscal</span>
                                                                    </button>
                                                                )}
                                                                {inv.status === 'borrador' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleChangeStatus(inv, 'emitida')}
                                                                        className="w-full px-3 py-2 hover:bg-indigo-50 text-indigo-900 flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <Send className="w-3.5 h-3.5 text-indigo-700" />
                                                                        <span>Emitir Borrador Oficial</span>
                                                                    </button>
                                                                )}
                                                                {(inv.status === 'emitida' || inv.status === 'borrador') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleChangeStatus(inv, 'pagada')}
                                                                        className="w-full px-3 py-2 hover:bg-emerald-50 text-emerald-900 flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                                                                        <span>Marcar como Pagada</span>
                                                                    </button>
                                                                )}
                                                                {onOpenAuditModal && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenMenuInvoiceId(null);
                                                                            onOpenAuditModal(inv);
                                                                        }}
                                                                        className="w-full px-3 py-2 hover:bg-slate-100 text-slate-900 flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <History className="w-3.5 h-3.5 text-slate-700" />
                                                                        <span>Ver Auditoría y Cambios</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="py-1">
                                                                {inv.status !== 'anulada' && inv.status !== 'borrador' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleChangeStatus(inv, 'anulada')}
                                                                        className="w-full px-3 py-2 hover:bg-amber-50 text-amber-900 flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <Ban className="w-3.5 h-3.5 text-amber-700" />
                                                                        <span>Anular Documento</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteInvoice(inv)}
                                                                    className="w-full px-3 py-2 hover:bg-red-50 text-red-700 flex items-center gap-2 cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 text-red-700" />
                                                                    <span>Eliminar Permanente</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Barra de Paginación AJAX */}
            <div className="p-3 sm:px-5 sm:py-3.5 border-t-2 border-slate-300 bg-slate-50 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                <div className="text-xs font-black text-slate-700 text-center sm:text-left">
                    {totalRecords === 0 ? (
                        <span>0 documentos encontrados</span>
                    ) : (
                        <span>
                            Mostrando <strong className="text-black">{fromRecord}</strong> a{' '}
                            <strong className="text-black">{toRecord}</strong> de{' '}
                            <strong className="text-black">{totalRecords}</strong> documentos (Pág. {currentPage}/{lastPage})
                        </span>
                    )}
                </div>

                {lastPage > 1 && (
                    <div className="flex items-center space-x-1.5 flex-wrap justify-center">
                        <button
                            type="button"
                            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1 || isLoadingTable}
                            className="h-8 px-2.5 rounded-lg border-2 border-slate-300 text-xs font-black text-black bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Anterior</span>
                        </button>

                        <div className="flex sm:hidden items-center px-2 font-mono font-bold text-xs text-black">
                            {currentPage} / {lastPage}
                        </div>

                        <div className="hidden sm:flex items-center space-x-1.5">
                            {getVisiblePages().map((pageNumber, idx, arr) => {
                                const prev = arr[idx - 1];
                                const showGap = prev && pageNumber - prev > 1;
                                return (
                                    <React.Fragment key={pageNumber}>
                                        {showGap && <span className="px-1 text-slate-500 font-black">…</span>}
                                        <button
                                            type="button"
                                            onClick={() => onPageChange?.(pageNumber)}
                                            disabled={isLoadingTable}
                                            className={`h-8 w-8 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                                                currentPage === pageNumber
                                                    ? 'bg-blue-700 text-white shadow-xs'
                                                    : 'bg-white border-2 border-slate-300 text-black hover:bg-slate-200'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => onPageChange?.(Math.min(lastPage, currentPage + 1))}
                            disabled={currentPage >= lastPage || isLoadingTable}
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
