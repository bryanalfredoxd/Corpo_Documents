import React from 'react';
import { getDocumentTypeInfo, getSignatureStampUrl } from '../../Utils/invoiceConstants';

export default function PdfTemplateClassic({
    activeCompany,
    invoiceForm,
    currentSelectedClient,
    projectedCorrelative,
    projectedControlNumber,
    itemsSubtotal,
    taxAmount,
    totalUsd,
    totalVes
}) {
    const stampUrl = getSignatureStampUrl(invoiceForm.signature_stamp, invoiceForm.document_type);

    return (
        <div className="printable-a4-page text-slate-900 text-xs relative">
            {/* Marca de agua para Documentos Anulados o Borradores */}
            {(invoiceForm.status === 'anulada' || invoiceForm.status === 'borrador') && (
                <div className="pointer-events-none select-none fixed sm:absolute inset-0 flex items-center justify-center z-10 opacity-15">
                    <span className={`text-6xl sm:text-7xl font-black uppercase tracking-widest -rotate-35 border-8 px-6 py-2 rounded-2xl ${
                        invoiceForm.status === 'anulada' ? 'text-red-700 border-red-700' : 'text-amber-600 border-amber-600'
                    }`}>
                        {invoiceForm.status === 'anulada' ? 'ANULADA' : 'BORRADOR'}
                    </span>
                </div>
            )}

            <div>
                {/* 1. CABECERA / MEMBRETE INSTITUCIONAL */}
            <div className="flex justify-between items-center gap-4 pb-4">
                {/* Lado Izquierdo: Logo Oficial CorpoAsia y Datos de la Empresa Emisora (Centrados y Simétricos) */}
                <div className="flex items-center gap-4 max-w-[430px]">
                    <img
                        src="/images/corpoasia-square.png"
                        alt="Inversiones CorpoAsia C.A."
                        className="h-22 sm:h-26 w-auto max-w-[115px] object-contain shrink-0"
                    />

                    <div className="space-y-0.5 min-w-0">
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">
                            {activeCompany.name}
                        </h1>
                        <p className="text-xs font-bold text-slate-900">
                            RIF: {activeCompany.tax_id}
                        </p>
                        <p className="text-xs text-slate-700 leading-tight">
                            {activeCompany.address}
                        </p>
                        <p className="text-xs text-slate-700">
                            Teléfono / WhatsApp: {activeCompany.phone}
                        </p>
                        {activeCompany.email && (
                            <p className="text-xs text-slate-700">
                                Email: {activeCompany.email}
                            </p>
                        )}
                        {activeCompany.website && (
                            <p className="text-xs text-slate-700">
                                Web / Red: {activeCompany.website}
                            </p>
                        )}
                    </div>
                </div>

                {/* Lado Derecho: Título de Factura, Correlativo, Fecha y Control */}
                <div className="text-right shrink-0">
                    <h2 className="text-2xl font-black text-slate-950 uppercase tracking-wide leading-none">
                        {getDocumentTypeInfo(invoiceForm.document_type).title}
                    </h2>
                    {invoiceForm.document_subtitle && (
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 mt-0.5">
                            {invoiceForm.document_subtitle}
                        </p>
                    )}
                    <p className="text-base font-mono font-black text-slate-900 mt-1.5 leading-none">
                        N° {projectedCorrelative}
                    </p>
                    <p className="text-xs text-slate-800 mt-2">
                        <span className="font-bold">Fecha:</span> {invoiceForm.issue_date}
                    </p>
                    <p className="text-xs text-slate-800 mt-0.5">
                        <span className="font-bold">{getDocumentTypeInfo(invoiceForm.document_type).controlLabel}:</span> {projectedControlNumber}
                    </p>
                </div>
            </div>

            {/* Línea Divisoria Sólida Superior */}
            <div className="border-b-2 border-slate-950 mb-5"></div>

            {/* 2. DATOS DEL CLIENTE Y CONDICIONES DE LA VENTA (2 COLUMNAS 1:1) */}
            <div className="grid grid-cols-2 gap-8 text-xs pb-4 mb-4 border-b border-slate-300">
                {/* Columna Izquierda: Datos del Adquiriente */}
                <div>
                    <h3 className="font-black uppercase text-slate-950 text-xs mb-2 tracking-wide">
                        DATOS DEL ADQUIRIENTE / CLIENTE
                    </h3>
                    {currentSelectedClient ? (
                        <div className="space-y-1">
                            <div className="grid grid-cols-12 gap-1">
                                <span className="col-span-4 text-slate-600 font-bold">Cliente:</span>
                                <span className="col-span-8 font-bold text-slate-950 uppercase">{currentSelectedClient.name}</span>
                            </div>
                            <div className="grid grid-cols-12 gap-1">
                                <span className="col-span-4 text-slate-600 font-bold">Cédula / RIF:</span>
                                <span className="col-span-8 font-mono font-bold text-slate-950">{currentSelectedClient.tax_id}</span>
                            </div>
                            <div className="grid grid-cols-12 gap-1">
                                <span className="col-span-4 text-slate-600 font-bold">Teléfono:</span>
                                <span className="col-span-8 text-slate-900">{currentSelectedClient.phone || 'N/A'}</span>
                            </div>
                            {currentSelectedClient.email && (
                                <div className="grid grid-cols-12 gap-1">
                                    <span className="col-span-4 text-slate-600 font-bold">Email:</span>
                                    <span className="col-span-8 text-slate-800 truncate">{currentSelectedClient.email}</span>
                                </div>
                            )}
                            {currentSelectedClient.address && (
                                <div className="grid grid-cols-12 gap-1">
                                    <span className="col-span-4 text-slate-600 font-bold">Dirección:</span>
                                    <span className="col-span-8 text-slate-800">{currentSelectedClient.address}</span>
                                </div>
                            )}
                            {invoiceForm.delivery_address && invoiceForm.delivery_address !== currentSelectedClient.address && (
                                <div className="grid grid-cols-12 gap-1">
                                    <span className="col-span-4 text-slate-600 font-bold">Entrega:</span>
                                    <span className="col-span-8 text-slate-900 font-semibold">{invoiceForm.delivery_address}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-1 text-slate-500 italic">
                            [ Cliente no seleccionado en el formulario ]
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Condiciones de la Venta */}
                <div>
                    <h3 className="font-black uppercase text-slate-950 text-xs mb-2 tracking-wide">
                        CONDICIONES DE LA VENTA
                    </h3>
                    <div className="space-y-1">
                        <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-slate-600 font-bold">Condición:</span>
                            <span className="col-span-8 font-bold text-slate-950">{invoiceForm.sale_condition}</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                            <span className="col-span-4 text-slate-600 font-bold">Canal:</span>
                            <span className="col-span-8 font-bold text-slate-950">{invoiceForm.sales_channel || 'Oficina / Presencial'}</span>
                        </div>
                        {invoiceForm.show_bs_conversion !== false && (
                            <div className="grid grid-cols-12 gap-1">
                                <span className="col-span-4 text-slate-600 font-bold">Tasa BS:</span>
                                <span className="col-span-8 font-mono font-bold text-slate-950">
                                    Bs. {Number(invoiceForm.bcv_exchange_rate || 876.80).toFixed(2)} / USD
                                </span>
                            </div>
                        )}
                        {(invoiceForm.document_type === 'proforma' || invoiceForm.document_type === 'cotizacion') ? (
                            <div className="grid grid-cols-12 gap-1">
                                <span className="col-span-4 text-slate-600 font-bold">Validez:</span>
                                <span className="col-span-8 font-bold text-blue-900">
                                    {invoiceForm.offer_validity_days || 8} días continuos
                                </span>
                            </div>
                        ) : invoiceForm.due_date ? (
                            <div className="grid grid-cols-12 gap-1">
                                <span className="col-span-4 text-slate-600 font-bold">Vencimiento:</span>
                                <span className="col-span-8 font-mono font-bold text-slate-900">
                                    {invoiceForm.due_date}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* 3. TABLA DE RENGLONES Y PRODUCTOS */}
            <div className="mb-6">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-t-2 border-b-2 border-slate-950 uppercase font-black text-slate-950 text-xs">
                        <tr>
                            <th className="py-2.5 px-2 w-8 text-center">#</th>
                            <th className="py-2.5 px-3">DESCRIPCIÓN DEL PRODUCTO</th>
                            <th className="py-2.5 px-3 text-center w-24">CANT.</th>
                            <th className="py-2.5 px-3 text-right w-28">PRECIO UNIT. ($)</th>
                            <th className="py-2.5 px-3 text-right w-28">TOTAL ($)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {invoiceForm.items.map((it, idx) => (
                            <tr key={idx}>
                                <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">{idx + 1}</td>
                                <td className="py-3 px-3">
                                    <div className="flex items-start gap-3">
                                        {invoiceForm.show_item_images !== false && it.show_image !== false && it.image_url && (
                                            <div className="shrink-0 w-14 h-14 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center shadow-2xs">
                                                <img
                                                    src={it.image_url}
                                                    alt={it.description}
                                                    className="max-h-full max-w-full object-contain rounded"
                                                />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <span className="font-bold text-slate-950 block">
                                                {it.description || '[ Renglón pendiente por describir ]'}
                                            </span>
                                            {it.details && (
                                                <span className="text-[11px] text-slate-600 block mt-0.5 whitespace-pre-line">
                                                    {it.details}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                                    {it.quantity} {it.unit}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                    ${Number(it.unit_price || 0).toFixed(2)} {it.unit && <span className="text-[10px] text-slate-500 font-normal">/{it.unit}</span>}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-black text-slate-950">
                                    ${(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}
                                    {it.is_tax_exempt && (
                                        <span className="text-[10px] text-blue-900 font-black ml-1">(E)</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="border-b border-slate-300"></div>
            </div>

            {/* 4. FORMA DE PAGO Y LIQUIDACIÓN DE TOTALES */}
            <div className="grid grid-cols-2 gap-8 text-xs mb-8 items-start">
                <div>
                    <h3 className="font-black uppercase text-slate-950 text-xs mb-2 tracking-wide">
                        FORMA DE PAGO
                    </h3>
                    <p className="text-slate-800">
                        <span className="text-slate-600 font-bold">Medio:</span>{' '}
                        <span className="font-black text-slate-950 uppercase">{invoiceForm.payment_method || 'PAGO MOVIL'}</span>
                    </p>
                    {invoiceForm.payment_reference && (
                        <p className="text-slate-800 mt-1">
                            <span className="text-slate-600 font-bold">Ref:</span>{' '}
                            <span className="font-mono font-bold text-slate-950">{invoiceForm.payment_reference}</span>
                        </p>
                    )}

                    {invoiceForm.show_bs_conversion !== false && (
                        <div className="border-l-2 border-slate-400 pl-2.5 mt-3 py-0.5 text-[10px] text-slate-600 italic leading-snug">
                            Monto en Bolívares (VES) calculado según la Tasa BS indicada a la fecha de la transacción.
                        </div>
                    )}
                </div>

                <div className="space-y-1.5 font-mono text-right text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="font-sans font-bold text-slate-700">Subtotal:</span>
                        <span className="font-bold text-slate-900">${itemsSubtotal.toFixed(2)}</span>
                    </div>
                    {Number(invoiceForm.shipping_cost || 0) > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="font-sans font-bold text-slate-700">Flete / Delivery:</span>
                            <span className="font-bold text-slate-900">${Number(invoiceForm.shipping_cost).toFixed(2)}</span>
                        </div>
                    )}
                    {Number(invoiceForm.discount || 0) > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-800">
                            <span className="font-sans font-bold">Descuento:</span>
                            <span className="font-bold">-${Number(invoiceForm.discount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-1 border-b-2 border-slate-950">
                        <span className="font-sans font-bold text-slate-700">
                            {Number(invoiceForm.tax_percentage) === 0 ? 'IVA (0% Exento / Neto):' : `IVA (${Number(invoiceForm.tax_percentage)}%):`}
                        </span>
                        <span className="font-bold text-slate-900">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-black">
                        <span className="font-sans">TOTAL USD:</span>
                        <span className="text-slate-950">${totalUsd.toFixed(2)}</span>
                    </div>
                    {invoiceForm.show_bs_conversion !== false && (
                        <div className="flex justify-between text-xs font-bold text-blue-900 pt-0.5">
                            <span className="font-sans font-bold text-slate-700">TOTAL VES:</span>
                            <span>Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* 5. TÉRMINOS Y CONDICIONES DE ENTREGA & FIRMAS */}
            <div className="mt-auto pt-6 border-t border-slate-300 text-xs break-inside-avoid">
                <div className="grid grid-cols-2 gap-8 items-end">
                    <div>
                        <h3 className="font-black uppercase text-slate-950 text-xs mb-1 tracking-wide">
                            TÉRMINOS Y CONDICIONES DE ENTREGA
                        </h3>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                            {invoiceForm.terms_conditions || activeCompany.default_terms || 'Comprobante generado por el sistema. Para devoluciones o reclamos conserve este documento. Plazo máximo de reclamación: 3 días hábiles desde la fecha de emisión.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center text-[10px] font-black uppercase text-slate-900">
                        <div className="flex flex-col items-center justify-end">
                            {stampUrl ? (
                                <div className="h-20 sm:h-24 w-full flex items-center justify-center relative mb-1">
                                    <img
                                        src={stampUrl}
                                        alt="Firma y Sello Emisor"
                                        className="max-h-full max-w-[190px] object-contain drop-shadow-xs"
                                    />
                                </div>
                            ) : (
                                <div className="h-20 sm:h-24 w-full"></div>
                            )}
                            <div className="w-full border-t border-dashed border-slate-400 pt-1.5 mb-1"></div>
                            <span>FIRMA Y SELLO EMISOR</span>
                        </div>

                        <div className="flex flex-col items-center justify-end">
                            <div className="h-20 sm:h-24 w-full"></div>
                            <div className="w-full border-t border-dashed border-slate-400 pt-1.5 mb-1"></div>
                            <span>RECIBIDO CONFORME</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

