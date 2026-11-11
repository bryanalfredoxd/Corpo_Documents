import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Combobox,
    ComboboxInput,
    ComboboxButton,
    ComboboxOptions,
    ComboboxOption
} from '@headlessui/react';
import {
    FileText,
    Plus,
    Trash2,
    CheckCircle2,
    Camera,
    Layers,
    Sparkles,
    Save,
    Eye,
    Package,
    BookmarkPlus,
    Copy,
    FileEdit,
    ArrowRightLeft,
    ChevronDown,
    Search,
    X
} from 'lucide-react';
import { getDocumentTypeInfo } from '../../Utils/invoiceConstants';
import { compressImageToDataUrl } from '../../Utils/imageCompression';
import { useFeedback } from '../../Contexts/FeedbackContext';

export default function InvoiceForm({
    companies = [],
    clients = [],
    products = [],
    activeCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    invoiceForm,
    setInvoiceForm,
    handleDocumentTypeChange,
    selectedPdfFormat,
    currentSelectedClient,
    itemsSubtotal,
    taxAmount,
    totalUsd,
    totalVes,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleAddTechSpec,
    handleRemoveTechSpec,
    handleTechSpecChange,
    handleResetDefaultTechSpecs,
    handleSubmitInvoice,
    isSubmittingInvoice,
    onOpenCreateClient,
    onOpenProductPicker,
    onQuickSaveToCatalog,
    setCurrentView,
    mobileEditorTab,
    setMobileEditorTab
}) {
    const { confirm, notify } = useFeedback();
    const [clientQuery, setClientQuery] = useState('');

    const selectedClientOption = clients.find((cl) => String(cl.id) === String(invoiceForm.client_id)) || null;
    const filteredClients = clientQuery.trim() === ''
        ? clients
        : clients.filter((cl) =>
            `${cl.name || ''} ${cl.tax_id || ''} ${cl.phone || ''}`
                .toLowerCase()
                .includes(clientQuery.trim().toLowerCase())
        );

    return (
        <form
            onSubmit={(e) => handleSubmitInvoice(e)}
            className={`lg:col-span-5 bg-white rounded-xl border-2 border-slate-300 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5 no-print ${
                mobileEditorTab === 'formulario' ? 'block' : 'hidden lg:block'
            }`}
        >
            {/* Banner si se está editando un documento guardado */}
            {invoiceForm.id && (
                <div className="p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                        <span className="font-black text-amber-950 block leading-tight">
                            ✏️ Editando: {invoiceForm.correlative_number}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 block">
                            Los cambios actualizarán este documento sin duplicar su correlativo.
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {invoiceForm.document_type !== 'factura' && invoiceForm.status !== 'anulada' && invoiceForm.status !== 'borrador' && (
                            <button
                                type="button"
                                onClick={async () => {
                                    const ok = await confirm({
                                        title: 'Convertir a Factura Fiscal',
                                        message: `¿Convertir "${invoiceForm.correlative_number}" en una Factura Fiscal oficial con un nuevo correlativo?\n\nSe clonarán los productos, cliente y montos.`,
                                        confirmLabel: 'Convertir a Factura',
                                        variant: 'primary',
                                    });
                                    if (!ok) return;
                                    router.post(`/invoices/${invoiceForm.id}/convert-to-invoice`, {}, {
                                        onSuccess: () => {
                                            notify.success('Documento convertido a Factura Fiscal exitosamente.');
                                            setCurrentView('libro-fiscal');
                                        },
                                        onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo convertir el documento.'),
                                    });
                                }}
                                className="h-7 px-2.5 bg-purple-700 hover:bg-purple-800 rounded-lg text-[10px] font-black text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Generar Factura Fiscal oficial a partir de este documento"
                            >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>→ Factura</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({
                                ...prev,
                                id: null,
                                correlative_number: null,
                                control_number: null,
                                status: 'emitida'
                            }))}
                            className="h-7 px-2.5 bg-white hover:bg-amber-100 border border-amber-400 rounded-lg text-[10px] font-black text-amber-950 flex items-center gap-1 cursor-pointer"
                            title="Desvincular para generar una nueva factura con estos datos"
                        >
                            <Copy className="w-3 h-3" />
                            <span>Clonar como Nuevo</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Cabecera del Formulario con Selector Segmentado de Tipo de Documento */}
            <div className="border-b-2 border-slate-200 pb-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-black uppercase tracking-tight">
                                Generar Factura o Proforma
                            </h3>
                            <p className="text-[11px] font-bold text-slate-600">
                                Edición en vivo sincronizada con la hoja física A4
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-mono font-black bg-blue-100 text-blue-900 border border-blue-400 px-2 py-0.5 rounded uppercase">
                        {getDocumentTypeInfo(invoiceForm.document_type).badgeText}
                    </span>
                </div>

                {/* Selector Segmentado de Tipo de Documento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-300 text-xs font-black">
                    {[
                        { id: 'factura', label: 'Factura' },
                        { id: 'proforma', label: 'Proforma' },
                        { id: 'cotizacion', label: 'Cotización' },
                        { id: 'nota_entrega', label: 'Nota Entrega' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => handleDocumentTypeChange(t.id)}
                            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer font-black text-xs ${
                                invoiceForm.document_type === t.id
                                    ? 'bg-blue-700 text-white shadow-xs'
                                    : 'text-slate-800 hover:text-black hover:bg-slate-200'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 1: EMPRESA EMISORA & CLIENTE */}
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-300">
                {/* Empresa Emisora */}
                <div>
                    <label className="text-xs font-black text-black block mb-1">
                        Empresa Emisora (Logo y Membrete Oficial) *
                    </label>
                    <select
                        value={invoiceForm.company_id}
                        onChange={(e) => {
                            const cid = Number(e.target.value);
                            setSelectedCompanyId(cid);
                            setInvoiceForm(prev => ({ ...prev, company_id: cid }));
                        }}
                        className="h-9 w-full bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} — RIF: {c.tax_id}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cliente Receptor */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-black text-black">
                            Cliente / Adquiriente *
                        </label>
                        <button
                            type="button"
                            onClick={onOpenCreateClient}
                            className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nuevo Cliente (CNE)</span>
                        </button>
                    </div>
                    <Combobox
                        immediate
                        value={selectedClientOption}
                        onChange={(cl) => setInvoiceForm(prev => ({ ...prev, client_id: cl ? Number(cl.id) : '' }))}
                        onClose={() => setClientQuery('')}
                    >
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
                            <ComboboxInput
                                displayValue={(cl) => (cl ? `${cl.name} (${cl.tax_id})` : '')}
                                onChange={(e) => setClientQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && filteredClients.length === 0) {
                                        e.preventDefault();
                                    }
                                }}
                                placeholder="Buscar cliente por nombre, cédula o RIF..."
                                className="h-9 w-full bg-white border border-slate-300 rounded-lg pl-8 pr-14 text-xs font-black text-black placeholder:font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            {selectedClientOption && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInvoiceForm(prev => ({ ...prev, client_id: '' }));
                                        setClientQuery('');
                                    }}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-600 cursor-pointer"
                                    title="Quitar cliente seleccionado"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-black cursor-pointer">
                                <ChevronDown className="w-4 h-4" />
                            </ComboboxButton>

                            <ComboboxOptions className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white border-2 border-slate-900 shadow-2xl py-1 text-xs">
                                {filteredClients.length === 0 ? (
                                    <div className="px-3 py-2.5 text-slate-500 font-bold italic">
                                        Sin coincidencias para "{clientQuery}"
                                    </div>
                                ) : (
                                    filteredClients.map((cl) => (
                                        <ComboboxOption
                                            key={cl.id}
                                            value={cl}
                                            className={({ focus, selected }) =>
                                                `px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${
                                                    focus
                                                        ? 'bg-blue-700 text-white'
                                                        : selected
                                                        ? 'bg-blue-50 text-blue-950 font-black'
                                                        : 'text-slate-900 font-bold'
                                                }`
                                            }
                                        >
                                            {({ focus }) => (
                                                <>
                                                    <span className="truncate uppercase">{cl.name}</span>
                                                    <span className={`font-mono text-[11px] shrink-0 ${focus ? 'text-blue-100' : 'text-slate-500'}`}>
                                                        {cl.tax_id}
                                                    </span>
                                                </>
                                            )}
                                        </ComboboxOption>
                                    ))
                                )}
                            </ComboboxOptions>
                        </div>
                    </Combobox>

                    {/* Chip resumen del cliente seleccionado */}
                    {currentSelectedClient ? (
                        <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-2 truncate">
                                <span className="font-mono font-black text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                                    {currentSelectedClient.tax_id}
                                </span>
                                <span className="font-bold text-slate-700 truncate text-[11px]">
                                    {currentSelectedClient.address || currentSelectedClient.phone || 'Cliente Registrado'}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0 uppercase">
                                {currentSelectedClient.type === 'empresa' ? 'Jurídico' : 'Natural'}
                            </span>
                        </div>
                    ) : (
                        <div className="mt-2 p-2 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 flex items-center justify-between">
                            <span className="text-[11px] font-bold italic">Sin cliente seleccionado para esta factura.</span>
                            <button
                                type="button"
                                onClick={() => setCurrentView('directorio')}
                                className="text-[11px] font-black text-blue-700 hover:text-blue-900 cursor-pointer"
                            >
                                Abrir Directorio →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN 2: CONDICIONES COMERCIALES & TASA BS */}
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-300">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                    Condiciones Comerciales & Tasa BS
                </span>

                {/* Régimen Monetario: Dólares + Bolívares o Solo Dólares */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-300 space-y-1.5 shadow-2xs">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">
                        Régimen de Moneda en el Documento (PDF):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, show_bs_conversion: true }))}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                invoiceForm.show_bs_conversion !== false
                                    ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                        >
                            <span>💵 Dólares + Bolívares (USD + BS)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, show_bs_conversion: false }))}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                invoiceForm.show_bs_conversion === false
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                        >
                            <span>💲 Solo Dólares (USD)</span>
                        </button>
                    </div>
                    {invoiceForm.show_bs_conversion === false && (
                        <p className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            ✓ Modo Solo Dólares activo: el PDF final no mostrará conversión en bolívares ni TOTAL VES.
                        </p>
                    )}
                </div>

                {/* Fecha y Tasa BS */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                        <label className="text-xs font-black text-black block mb-1 truncate">
                            Fecha de Emisión
                        </label>
                        <input
                            type="date"
                            value={invoiceForm.issue_date}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, issue_date: e.target.value }))}
                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-black text-black block truncate">
                                Tasa BS {invoiceForm.show_bs_conversion !== false && '*'}
                            </label>
                            {invoiceForm.show_bs_conversion === false && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                    Oculta en PDF
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 select-none">
                                Bs.
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                disabled={invoiceForm.show_bs_conversion === false}
                                value={invoiceForm.bcv_exchange_rate}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, bcv_exchange_rate: e.target.value === '' ? '' : Number(e.target.value) }))}
                                className={`h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg pl-8 pr-3 text-xs font-black text-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                                    invoiceForm.show_bs_conversion === false ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {/* Condición de Venta y Canal de Venta */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-black text-black block truncate">
                                Condición de Venta *
                            </label>
                        </div>
                        <input
                            type="text"
                            list="condiciones-list"
                            value={invoiceForm.sale_condition}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, sale_condition: e.target.value }))}
                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="Consignación / Contado..."
                        />
                        <datalist id="condiciones-list">
                            <option value="Consignación" />
                            <option value="A Consignación" />
                            <option value="Venta de Contado" />
                            <option value="Crédito 7 días" />
                            <option value="Crédito 15 días" />
                            <option value="Crédito 30 días" />
                            <option value="Contra Entrega" />
                            <option value="Anticipo 50%" />
                        </datalist>

                        {/* Chips rápidos de Condición de Venta */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {[
                                { label: 'Consignación', val: 'Consignación' },
                                { label: 'Contado', val: 'Venta de Contado' },
                                { label: 'Crédito 15d', val: 'Crédito 15 días' },
                                { label: 'Contra Entrega', val: 'Contra Entrega' },
                            ].map(pill => (
                                <button
                                    key={pill.val}
                                    type="button"
                                    onClick={() => setInvoiceForm(prev => ({ ...prev, sale_condition: pill.val }))}
                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                        invoiceForm.sale_condition === pill.val
                                            ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                                            : 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300'
                                    }`}
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="min-w-0">
                        <label className="text-xs font-black text-black block mb-1 truncate">
                            Canal de Venta
                        </label>
                        <input
                            type="text"
                            list="canales-list"
                            value={invoiceForm.sales_channel}
                            placeholder="Oficina / Presencial"
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, sales_channel: e.target.value }))}
                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <datalist id="canales-list">
                            <option value="Oficina / Presencial" />
                            <option value="Tienda en Línea" />
                            <option value="WhatsApp / Directo" />
                            <option value="Distribuidor" />
                            <option value="Mercado Libre" />
                            <option value="Venta Telefónica" />
                        </datalist>
                    </div>
                </div>

                {/* Medio de Pago y Referencia */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                        <label className="text-xs font-black text-black block mb-1 truncate">
                            Medio de Pago
                        </label>
                        <input
                            type="text"
                            list="medios-pago-list"
                            value={invoiceForm.payment_method}
                            placeholder="PAGO MOVIL, ZELLE, ETC."
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_method: e.target.value.toUpperCase() }))}
                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <datalist id="medios-pago-list">
                            <option value="PAGO MOVIL" />
                            <option value="TRANSFERENCIA BANCARIA" />
                            <option value="ZELLE" />
                            <option value="EFECTIVO (USD)" />
                            <option value="EFECTIVO (BS)" />
                            <option value="PUNTO DE VENTA" />
                            <option value="DIVISAS" />
                            <option value="MIXTO" />
                        </datalist>
                    </div>

                    <div className="min-w-0">
                        <label className="text-xs font-black text-black block mb-1 truncate">
                            N° Ref. de Pago (Opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: 161773827..."
                            value={invoiceForm.payment_reference || ''}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                </div>

                {/* Cuentas bancarias omitidas por diseño */}

                {/* Sello y Firma Emisor */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-300 space-y-1.5 shadow-2xs">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">
                            Firma y Sello Oficial Emisor:
                        </label>
                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {(!invoiceForm.signature_stamp || invoiceForm.signature_stamp === 'auto')
                                ? ((invoiceForm.document_type === 'proforma' || invoiceForm.document_type === 'cotizacion') ? 'Auto: Sello China' : 'Auto: Sello CorpoAsia')
                                : invoiceForm.signature_stamp === 'china' ? 'Sello China' : invoiceForm.signature_stamp === 'corpoasia' ? 'Sello CorpoAsia' : 'Sin Sello'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, signature_stamp: 'auto' }))}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                                (!invoiceForm.signature_stamp || invoiceForm.signature_stamp === 'auto')
                                    ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                            title="Selecciona automáticamente el sello de China para Proformas/Cotizaciones, y CorpoAsia para Facturas"
                        >
                            ⚡ Automático
                        </button>
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, signature_stamp: 'china' }))}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                                invoiceForm.signature_stamp === 'china'
                                    ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                            title="Sello Hongkong Maoyi para proformas y cotizaciones de importación China"
                        >
                            🇨🇳 Sello China
                        </button>
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, signature_stamp: 'corpoasia' }))}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                                invoiceForm.signature_stamp === 'corpoasia'
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                            title="Sello Inv. CorpoAsia C.A. para facturas y ventas nacionales"
                        >
                            🏢 Sello CorpoAsia
                        </button>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[10px]">
                        <span className="text-slate-500 italic">
                            {(!invoiceForm.signature_stamp || invoiceForm.signature_stamp === 'auto')
                                ? (invoiceForm.document_type === 'proforma' || invoiceForm.document_type === 'cotizacion'
                                    ? 'Aplicando sello Hongkong Maoyi (China) para cotizaciones.'
                                    : 'Aplicando sello Inv. CorpoAsia C.A. para ventas y facturación.')
                                : invoiceForm.signature_stamp === 'china'
                                ? 'Forzado: Sello Hongkong Maoyi (China).'
                                : invoiceForm.signature_stamp === 'corpoasia'
                                ? 'Forzado: Sello Inv. CorpoAsia C.A.'
                                : 'Sin sello estampado.'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, signature_stamp: prev.signature_stamp === 'none' ? 'auto' : 'none' }))}
                            className="text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
                        >
                            {invoiceForm.signature_stamp === 'none' ? 'Restaurar sello' : 'Ocultar sello (firma manual)'}
                        </button>
                    </div>
                </div>

                {/* Subtítulo / Línea del Documento */}
                <div>
                    <label className="text-xs font-black text-black block mb-1 truncate">
                        Subtítulo / Línea del Documento (Opcional)
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: LÍNEA MÁQUINAS, REPUESTOS, SERVICIOS..."
                        value={invoiceForm.document_subtitle}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, document_subtitle: e.target.value }))}
                        className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                </div>

                {/* Vencimiento, Dirección de Entrega y Notas de Pago (visibles en el PDF) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                        <label className="text-xs font-black text-black block mb-1 truncate">
                            Fecha Vencimiento (Opcional)
                        </label>
                        <input
                            type="date"
                            value={invoiceForm.due_date || ''}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                    <div className="min-w-0">
                        <label className="text-xs font-black text-black block mb-1 truncate">
                            Dirección de Entrega (Si difiere)
                        </label>
                        <input
                            type="text"
                            placeholder="Opcional: dirección distinta a la fiscal"
                            value={invoiceForm.delivery_address || ''}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: RENGLONES / ÍTEMS DINÁMICOS */}
            <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <label className="text-xs font-black text-black">
                            Renglones a Facturar
                        </label>
                        <span className="text-[11px] font-mono font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                            {invoiceForm.items.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={onOpenProductPicker}
                            className="h-8 px-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                            title="Elegir productos ya guardados en el catálogo"
                        >
                            <Package className="w-3.5 h-3.5" />
                            <span>Del Catálogo ({products.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="h-8 px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                            title="Añadir un renglón vacío manualmente"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Manual</span>
                        </button>
                    </div>
                </div>

                {/* Control Maestro para Mostrar u Ocultar Imágenes de Productos en este PDF */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-300">
                    <div className="flex items-center gap-2 min-w-0">
                        <Camera className="w-4 h-4 text-blue-700 shrink-0" />
                        <span className="text-[11px] font-black text-slate-800 truncate">
                            Imágenes de productos en el PDF
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setInvoiceForm(prev => ({ ...prev, show_item_images: prev.show_item_images === false }))}
                        className={`h-7 px-3 rounded-lg text-[11px] font-black transition-all cursor-pointer border shrink-0 ${
                            invoiceForm.show_item_images !== false
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                                : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                    >
                        {invoiceForm.show_item_images !== false ? '✓ Mostrar imágenes' : '✕ Ocultas en PDF'}
                    </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {invoiceForm.items.map((it, idx) => {
                        const alreadyInCatalog = products.some(
                            p => p.name.trim().toLowerCase() === (it.description || '').trim().toLowerCase()
                        );
                        return (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-xs space-y-2.5 shadow-2xs hover:border-slate-400 transition-colors">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                <span className="font-black text-black text-xs flex items-center gap-1.5">
                                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[11px]">
                                        {idx + 1}
                                    </span>
                                    <span>Renglón #{idx + 1}</span>
                                    {it.product_id && (
                                        <span
                                            className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded text-[10px] font-black"
                                            title="Vinculado al catálogo para control de inventario y estadísticas"
                                        >
                                            📦 Catálogo
                                        </span>
                                    )}
                                </span>
                                <div className="flex items-center gap-2">
                                    {!it.product_id && !alreadyInCatalog && it.description && it.unit_price !== '' && (
                                        <button
                                            type="button"
                                            onClick={() => onQuickSaveToCatalog(it)}
                                            className="h-6 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 rounded text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Guardar este producto en el catálogo para futuras facturas"
                                        >
                                            <BookmarkPlus className="w-3 h-3" />
                                            <span>Guardar en Catálogo</span>
                                        </button>
                                    )}
                                    <label className="inline-flex items-center gap-1 cursor-pointer text-[11px] font-bold text-slate-700 select-none">
                                        <input
                                            type="checkbox"
                                            checked={!!it.is_tax_exempt}
                                            onChange={(e) => handleItemChange(idx, 'is_tax_exempt', e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                        />
                                        <span>Exento IVA</span>
                                    </label>
                                    {invoiceForm.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(idx)}
                                            className="h-6 px-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 rounded text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Eliminar este renglón"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Quitar</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    placeholder="Descripción del producto o servicio *"
                                    required
                                    value={it.description}
                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black placeholder:text-slate-500"
                                />
                            </div>

                            <div>
                                <input
                                    type="text"
                                    placeholder="Detalles técnicos / especificaciones (opcional)..."
                                    value={it.details || ''}
                                    onChange={(e) => handleItemChange(idx, 'details', e.target.value)}
                                    className="h-7 w-full bg-white border border-slate-200 rounded-md px-2.5 text-[11px] font-bold text-slate-800 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Foto / Imagen Opcional del Producto */}
                            <div className="pt-0.5">
                                {it.image_url ? (
                                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                                        <div className="w-12 h-12 rounded-md border border-slate-300 bg-slate-50 p-0.5 flex items-center justify-center shrink-0">
                                            <img
                                                src={it.image_url}
                                                alt="Foto del producto"
                                                className="max-h-full max-w-full object-contain rounded"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-800">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>Foto disponible</span>
                                            </div>
                                            {invoiceForm.show_item_images === false ? (
                                                <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                                                    Oculta por configuración general de este documento.
                                                </p>
                                            ) : (
                                                <label className="inline-flex items-center gap-1.5 mt-1 cursor-pointer text-[11px] font-bold text-slate-700 select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={it.show_image !== false}
                                                        onChange={(e) => handleItemChange(idx, 'show_image', e.target.checked)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                                    />
                                                    <span>Mostrar esta foto en el PDF</span>
                                                </label>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleItemChange(idx, 'image_url', null)}
                                            className="text-[11px] font-black text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer shrink-0 transition-colors"
                                            title="Eliminar foto de este producto"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                                            <Camera className="w-3.5 h-3.5 text-blue-700" />
                                            <span>Añadir foto del producto (Opcional)</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const { dataUrl } = await compressImageToDataUrl(file);
                                                    handleItemChange(idx, 'image_url', dataUrl);
                                                }}
                                            />
                                        </label>
                                        <span className="text-[10px] text-slate-500 italic hidden sm:inline">
                                            Ej: bicicleta, generador, ventilador, maquinaria...
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                                <div>
                                    <span className="text-black block mb-0.5 text-[11px]">Cant.</span>
                                    <div className="flex items-center border border-slate-300 rounded-md bg-white overflow-hidden h-8">
                                        <button
                                            type="button"
                                            onClick={() => handleItemChange(idx, 'quantity', Math.max(1, Number(it.quantity || 1) - 1))}
                                            className="px-2 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={it.quantity}
                                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                            className="w-full text-center font-mono font-black text-xs py-1 text-black border-0 focus:ring-0 p-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleItemChange(idx, 'quantity', Number(it.quantity || 0) + 1)}
                                            className="px-2 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-black block mb-0.5 text-[11px]">Unidad</span>
                                    <input
                                        type="text"
                                        value={it.unit}
                                        placeholder="unid"
                                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                        className="h-8 w-full bg-white border border-slate-300 rounded-md px-2 text-center font-mono font-black text-xs"
                                    />
                                </div>

                                <div>
                                    <span className="text-black block mb-0.5 text-[11px]">P. Unit ($)</span>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={it.unit_price}
                                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                                            className="h-8 w-full bg-white border border-slate-300 rounded-md pl-5 pr-2 text-right font-mono font-black text-xs text-black"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <span className="text-black block mb-0.5 text-[11px]">Total ($)</span>
                                    <div className="h-8 flex items-center justify-end px-2 bg-blue-50 border border-blue-200 rounded-md font-mono font-black text-blue-900 text-xs">
                                        ${(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>

            {/* SECCIÓN 4: PARÁMETROS ESPECÍFICOS DE PROFORMA INDUSTRIAL (FORMATO 2) */}
            {selectedPdfFormat === 'formato-2' && (
                <div className="space-y-4 p-4 bg-amber-50/40 rounded-xl border-2 border-amber-300">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                Ficha Técnica & Condiciones DDP (Formato 2)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetDefaultTechSpecs}
                            className="text-[11px] font-black text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                            title="Restaurar valores de prueba Moaiven CAT 320C L"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>Restaurar Ficha Moaiven</span>
                        </button>
                    </div>

                    {/* Identificadores y Logística */}
                    <div className="space-y-2.5 pt-1">
                        <span className="text-[11px] font-black text-slate-700 block uppercase">
                            1. Identificadores del Equipo y Entrega
                        </span>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="text-[11px] font-black text-black block mb-0.5">
                                    Año de Fabricación
                                </label>
                                <input
                                    type="text"
                                    value={invoiceForm.equipment_year || ''}
                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, equipment_year: e.target.value }))}
                                    placeholder="2021 / Reciente..."
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-black block mb-0.5">
                                    N° de Serie / VIN
                                </label>
                                <input
                                    type="text"
                                    value={invoiceForm.equipment_vin || ''}
                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, equipment_vin: e.target.value }))}
                                    placeholder="CAT0320CL089124..."
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="text-[11px] font-black text-black block mb-0.5">
                                    Validez de Oferta (Días)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={invoiceForm.offer_validity_days || 15}
                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, offer_validity_days: Number(e.target.value) }))}
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-black block mb-0.5">
                                    Aduana y Nacionalización
                                </label>
                                <input
                                    type="text"
                                    value={invoiceForm.customs_text || ''}
                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, customs_text: e.target.value }))}
                                    placeholder="INCLUIDO o monto..."
                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-black text-black block mb-0.5">
                                Dirección de Entrega en Destino (DDP)
                            </label>
                            <input
                                type="text"
                                value={invoiceForm.delivery_address || ''}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                                placeholder="Ej: Puerto Cabello / Barinas (dejar vacío para usar la del cliente)"
                                className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-black text-black block mb-0.5">
                                Usuario Redes / TikTok de la Empresa
                            </label>
                            <input
                                type="text"
                                value={invoiceForm.company_social_handle || ''}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, company_social_handle: e.target.value }))}
                                placeholder="Ej: @moaiven.logistic"
                                className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                            />
                        </div>
                    </div>

                    {/* Condiciones de Pago DDP */}
                    <div className="space-y-2.5 pt-2 border-t border-amber-200">
                        <span className="text-[11px] font-black text-slate-700 block uppercase">
                            2. Condiciones de Pago (Hitos 70% / 30% o Personalizado)
                        </span>

                        {/* Hito 1 */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-300 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-black text-black">Hito 1 (Anticipo):</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={invoiceForm.payment_milestone_1_pct ?? 70}
                                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_1_pct: Number(e.target.value) }))}
                                        className="h-7 w-16 text-center font-mono font-black border border-slate-300 rounded px-1 text-xs"
                                    />
                                    <span className="font-bold text-slate-700">%</span>
                                    <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] ml-1">
                                        USD ${(totalUsd * (Number(invoiceForm.payment_milestone_1_pct || 70) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={invoiceForm.payment_milestone_1_text || ''}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_1_text: e.target.value }))}
                                placeholder="Descripción del hito 1..."
                                className="h-7 w-full bg-slate-50 border border-slate-200 rounded px-2 text-[11px] font-medium text-slate-800"
                            />
                        </div>

                        {/* Hito 2 */}
                        <div className="p-2.5 bg-white rounded-lg border border-slate-300 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-black text-black">Hito 2 (Saldo):</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={invoiceForm.payment_milestone_2_pct ?? 30}
                                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_2_pct: Number(e.target.value) }))}
                                        className="h-7 w-16 text-center font-mono font-black border border-slate-300 rounded px-1 text-xs"
                                    />
                                    <span className="font-bold text-slate-700">%</span>
                                    <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] ml-1">
                                        USD ${(totalUsd * (Number(invoiceForm.payment_milestone_2_pct || 30) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={invoiceForm.payment_milestone_2_text || ''}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_2_text: e.target.value }))}
                                placeholder="Descripción del hito 2..."
                                className="h-7 w-full bg-slate-50 border border-slate-200 rounded px-2 text-[11px] font-medium text-slate-800"
                            />
                        </div>
                    </div>

                    {/* Condiciones de Carga y Envío */}
                    <div className="space-y-1.5 pt-2 border-t border-amber-200">
                        <label className="text-[11px] font-black text-slate-700 block uppercase">
                            3. Condiciones de Carga y Envío (Marítimo / Origen)
                        </label>
                        <textarea
                            rows={3}
                            value={invoiceForm.shipping_terms_notes || ''}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, shipping_terms_notes: e.target.value }))}
                            placeholder="Cláusula de tiempo de carga en puerto, booking, etc."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Ficha Técnica Dinámica */}
                    <div className="space-y-2 pt-2 border-t border-amber-200">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-700 uppercase">
                                4. Ficha Técnica del Equipo ({invoiceForm.technical_specs?.length || 0} filas)
                            </span>
                            <button
                                type="button"
                                onClick={handleAddTechSpec}
                                className="h-7 px-2.5 bg-slate-900 hover:bg-black text-white rounded-md text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Añadir Fila</span>
                            </button>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {(invoiceForm.technical_specs || []).map((spec, idx) => (
                                <div key={idx} className="p-2 bg-white rounded-lg border border-slate-300 space-y-1 shadow-2xs">
                                    <div className="flex justify-between items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Categoría (Ej: Motor, Operativas, Dimensiones...)"
                                            value={spec.category || ''}
                                            onChange={(e) => handleTechSpecChange(idx, 'category', e.target.value)}
                                            className="h-6 w-full bg-slate-100 border border-slate-200 rounded px-2 text-[10px] font-black text-slate-800 uppercase"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTechSpec(idx)}
                                            className="h-6 px-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                                            title="Eliminar especificación"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-12 gap-1.5">
                                        <input
                                            type="text"
                                            placeholder="Parámetro (Ej: Marca y modelo)"
                                            value={spec.name || ''}
                                            onChange={(e) => handleTechSpecChange(idx, 'name', e.target.value)}
                                            className="col-span-5 h-6 bg-white border border-slate-300 rounded px-1.5 text-[11px] font-bold text-black"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Detalle (Ej: Mitsubishi 3066 TAA)"
                                            value={spec.value || ''}
                                            onChange={(e) => handleTechSpecChange(idx, 'value', e.target.value)}
                                            className="col-span-7 h-6 bg-white border border-slate-300 rounded px-1.5 text-[11px] font-medium text-slate-900"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN 5: DESGLOSE FISCAL & LIQUIDACIÓN */}
            <div className="border-t-2 border-slate-200 pt-3 space-y-2 text-xs font-mono font-black">
                <div className="flex justify-between items-center text-black">
                    <span>Subtotal Renglones:</span>
                    <span>${itemsSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-black">
                    <span>Flete / Delivery ($):</span>
                    <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={invoiceForm.shipping_cost}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, shipping_cost: Math.max(0, Number(e.target.value)) }))}
                            className="h-8 w-full bg-white border border-slate-300 rounded-md pl-6 pr-2 text-right font-mono font-black text-xs text-black"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center text-emerald-900">
                    <span>Descuento Comercial (-$):</span>
                    <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">-$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={invoiceForm.discount}
                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, discount: Math.max(0, Number(e.target.value)) }))}
                            className="h-8 w-full bg-white border border-emerald-300 rounded-md pl-7 pr-2 text-right font-mono font-black text-xs text-emerald-900"
                        />
                    </div>
                </div>

                {/* Alícuota IVA con toggle rápido de 0% Neto y 16% Fiscal */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <div className="flex justify-between items-center text-black">
                        <div className="flex items-center gap-1.5">
                            <span>Alícuota IVA:</span>
                            {Number(invoiceForm.tax_percentage) === 0 ? (
                                <span className="text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                    0% NETO
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono font-black bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded border border-blue-300">
                                    {Number(invoiceForm.tax_percentage)}% IVA
                                </span>
                            )}
                        </div>
                        <div className="relative w-20">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={invoiceForm.tax_percentage}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, tax_percentage: Number(e.target.value) }))}
                                className="h-8 w-full bg-white border border-slate-300 rounded-md pr-6 pl-2 text-right font-mono font-black text-xs text-black"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">%</span>
                        </div>
                    </div>

                    {/* Botones de acción rápida: 0% NETO / 16% IVA FISCAL */}
                    <div className="grid grid-cols-2 gap-1.5 font-sans">
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, tax_percentage: 0 }))}
                            className={`py-1 px-2 rounded-lg text-center text-[11px] font-black transition-all cursor-pointer border ${
                                Number(invoiceForm.tax_percentage) === 0
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                        >
                            0% Neto (Sin IVA)
                        </button>
                        <button
                            type="button"
                            onClick={() => setInvoiceForm(prev => ({ ...prev, tax_percentage: 16.00 }))}
                            className={`py-1 px-2 rounded-lg text-center text-[11px] font-black transition-all cursor-pointer border ${
                                Number(invoiceForm.tax_percentage) === 16
                                    ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                        >
                            16% IVA Fiscal
                        </button>
                    </div>
                </div>

                {/* Banner de Gran Total */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1.5 shadow-sm">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                            TOTAL FACTURA (USD)
                        </span>
                        <span className="text-2xl font-mono font-black text-emerald-400">
                            ${totalUsd.toFixed(2)}
                        </span>
                    </div>
                    {invoiceForm.show_bs_conversion !== false ? (
                        <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-700 text-xs">
                            <span className="font-bold text-slate-300">Total en Bolívares (VES):</span>
                            <span className="font-mono font-black text-white text-base">
                                Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ) : (
                        <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-700 text-xs">
                            <span className="font-bold text-slate-400">Régimen:</span>
                            <span className="font-mono font-black text-emerald-400 text-xs uppercase tracking-wide">
                                SOLO DÓLARES (USD)
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Términos y Condiciones de Entrega (Pie del PDF) */}
            <div className="space-y-1.5 pt-1">
                <label className="text-xs font-black text-black block">
                    Términos y Condiciones de Entrega (Pie del PDF)
                </label>
                <textarea
                    rows={2}
                    placeholder="Cláusulas legales, garantía, devoluciones o notas de entrega..."
                    value={invoiceForm.terms_conditions || ''}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, terms_conditions: e.target.value }))}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
            </div>

            {/* Botón Móvil para Ver la Hoja A4 directamente */}
            <div className="lg:hidden pt-1">
                <button
                    type="button"
                    onClick={() => setMobileEditorTab('preview')}
                    className="w-full h-11 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                    <Eye className="w-4 h-4 text-sky-400" />
                    <span>Ver Vista Previa de la Hoja A4 →</span>
                </button>
            </div>

            <div className="space-y-2 pt-1">
                <button
                    type="submit"
                    disabled={isSubmittingInvoice}
                    className="h-12 w-full bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                    <Save className="w-4 h-4 text-emerald-300" />
                    <span>
                        {isSubmittingInvoice
                            ? 'Guardando...'
                            : invoiceForm.id
                            ? (invoiceForm.status === 'borrador' ? 'EMITIR Y ASIGNAR CORRELATIVO OFICIAL' : 'ACTUALIZAR DOCUMENTO EXISTENTE')
                            : 'GUARDAR DOCUMENTO'}
                    </span>
                </button>

                <button
                    type="button"
                    disabled={isSubmittingInvoice}
                    onClick={(e) => handleSubmitInvoice(e, 'borrador')}
                    className="h-10 w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    title="Guarda el documento sin consumir números de correlativo fiscal"
                >
                    <FileEdit className="w-4 h-4 text-amber-700" />
                    <span>
                        {invoiceForm.id && invoiceForm.status === 'borrador'
                            ? 'Actualizar Borrador (Sin emitir)'
                            : 'Guardar como Borrador (Sin consumir correlativo)'}
                    </span>
                </button>
            </div>
        </form>
    );
}

