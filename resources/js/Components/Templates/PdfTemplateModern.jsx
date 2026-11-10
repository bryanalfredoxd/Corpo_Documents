import React from 'react';
import { getDocumentTypeInfo, getSignatureStampUrl } from '../../Utils/invoiceConstants';

export default function PdfTemplateModern({
    activeCompany,
    invoiceForm,
    currentSelectedClient,
    projectedCorrelative,
    projectedControlNumber,
    taxAmount,
    totalUsd
}) {
    const stampUrl = getSignatureStampUrl(invoiceForm.signature_stamp, invoiceForm.document_type);
    return (
        <div className="text-slate-900 text-xs">
            {/* ---------- PÁGINA 1: FICHA TÉCNICA & DATOS DEL CLIENTE ---------- */}
            <div className="space-y-4">
                {/* Cabecera Moaiven / Industrial */}
                <div className="flex justify-between items-center gap-4 pb-2">
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
                            <p className="text-xs font-bold text-slate-800">
                                RIF: {activeCompany.tax_id}
                            </p>
                            <p className="text-xs text-slate-600 leading-tight">
                                {activeCompany.address}
                            </p>
                            <p className="text-xs text-slate-600">
                                Teléfono / WhatsApp: {activeCompany.phone}
                            </p>
                            {activeCompany.email && (
                                <p className="text-xs text-slate-600">
                                    Email: {activeCompany.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <h2 className="text-3xl font-black text-[#0E1C33] tracking-tight leading-none uppercase">
                            {getDocumentTypeInfo(invoiceForm.document_type).title}
                        </h2>
                        <p className="text-xs font-black text-[#C9A227] tracking-wider uppercase mt-1">
                            {invoiceForm.document_subtitle || getDocumentTypeInfo(invoiceForm.document_type).defaultSubtitle}
                        </p>
                        <div className="text-xs text-slate-800 space-y-1 mt-3">
                            <p>
                                <span className="font-medium text-slate-600">{getDocumentTypeInfo(invoiceForm.document_type).correlativeLabel}:</span>{' '}
                                <span className="font-mono font-black text-[#0E1C33]">{projectedCorrelative}</span>
                            </p>
                            <p>
                                <span className="font-medium text-slate-600">Fecha de emisión:</span>{' '}
                                <span className="font-mono font-bold">{invoiceForm.issue_date}</span>
                            </p>
                            <p>
                                <span className="font-medium text-slate-600">Validez de la oferta:</span>{' '}
                                <span className="font-bold">{invoiceForm.offer_validity_days || 8} días</span>
                            </p>
                            <p>
                                <span className="font-medium text-slate-600">{getDocumentTypeInfo(invoiceForm.document_type).controlLabel}:</span>{' '}
                                <span className="font-mono font-bold">{projectedControlNumber}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Franja Dorada Gruesa Distintiva Moaiven */}
                <div className="h-2.5 bg-[#C9A227] my-4 rounded-xs"></div>

                {/* Sección: DATOS DEL CLIENTE */}
                <div className="border border-slate-300 rounded-xs overflow-hidden mb-5">
                    <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                        DATOS DEL CLIENTE
                    </div>
                    <div className="p-3 text-xs space-y-1.5 bg-white">
                        <div className="grid grid-cols-12 gap-2">
                            <span className="col-span-4 font-bold text-slate-800">Nombre / Razón social</span>
                            <span className="col-span-8 font-black text-black uppercase border-b border-dotted border-slate-400 pb-0.5">
                                {currentSelectedClient?.name || '_____________________________________________________'}
                            </span>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                            <span className="col-span-4 font-bold text-slate-800">Cédula / RIF</span>
                            <span className="col-span-8 font-mono font-black text-black border-b border-dotted border-slate-400 pb-0.5">
                                {currentSelectedClient?.tax_id || '_____________________________________________________'}
                            </span>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                            <span className="col-span-4 font-bold text-slate-800">Teléfono</span>
                            <span className="col-span-8 text-black font-semibold border-b border-dotted border-slate-400 pb-0.5">
                                {currentSelectedClient?.phone || '_____________________________________________________'}
                            </span>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                            <span className="col-span-4 font-bold text-slate-800">Dirección de entrega</span>
                            <span className="col-span-8 text-black font-medium border-b border-dotted border-slate-400 pb-0.5">
                                {invoiceForm.delivery_address || currentSelectedClient?.address || '_____________________________________________________'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sección: FICHA TÉCNICA DEL EQUIPO */}
                <div className="border border-slate-300 rounded-xs overflow-hidden">
                    <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                        FICHA TÉCNICA DEL EQUIPO
                    </div>

                    {/* Título y Subtítulo del Equipo */}
                    <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-black text-[#0E1C33] uppercase">
                                {invoiceForm.items[0]?.description || 'CATERPILLAR 320C L'}
                                <span className="font-normal text-slate-600 text-xs lowercase ml-2">
                                    — {invoiceForm.items[0]?.details || 'Excavadora sobre orugas'}
                                </span>
                            </h3>
                        </div>
                        {invoiceForm.items[0]?.image_url && (
                            <div className="w-16 h-16 rounded-lg border border-slate-300 p-1 bg-white shrink-0 shadow-2xs flex items-center justify-center">
                                <img
                                    src={invoiceForm.items[0].image_url}
                                    alt={invoiceForm.items[0].description}
                                    className="max-h-full max-w-full object-contain rounded"
                                />
                            </div>
                        )}
                    </div>

                    {/* Tabla Dinámica de Especificaciones Técnicas con Zebra Striping */}
                    <div className="text-xs">
                        {Array.from(new Set((invoiceForm.technical_specs || []).map(s => s.category || 'Especificaciones'))).map((catName, catIdx) => {
                            const specsInCat = (invoiceForm.technical_specs || []).filter(s => (s.category || 'Especificaciones') === catName);
                            return (
                                <div key={catIdx}>
                                    <div className="bg-slate-100/90 px-3 py-1 font-black text-slate-900 border-b border-slate-200 uppercase text-[11px] tracking-wide">
                                        {catName}
                                    </div>
                                    {specsInCat.map((spec, sIdx) => (
                                        <div
                                            key={sIdx}
                                            className={`grid grid-cols-12 px-3 py-1.5 border-b border-slate-200 ${
                                                sIdx % 2 === 1 ? 'bg-[#F4F5F7]' : 'bg-white'
                                            }`}
                                        >
                                            <span className="col-span-5 font-medium text-slate-700">{spec.name}</span>
                                            <span className="col-span-7 font-bold text-slate-900">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                    Página 1 de 2 • {getDocumentTypeInfo(invoiceForm.document_type).title} {projectedCorrelative}
                </div>
            </div>

            {/* SALTO DE PÁGINA PARA IMPRESIÓN Y PDF */}
            <div className="print-page-break my-10 border-b-2 border-dashed border-slate-300 no-print py-2 text-center text-xs font-bold text-slate-400">
                --- Fin de Página 1 • Salto de Página A4 para Página 2 ---
            </div>

            {/* ---------- PÁGINA 2: DESGLOSE DE PRECIOS DDP, PAGOS & CONDICIONES DE ENVÍO ---------- */}
            <div className="space-y-5 pt-4">
                {/* Identificadores del equipo */}
                <div className="border border-slate-300 rounded-xs p-3 text-xs bg-white space-y-1.5">
                    <div className="grid grid-cols-12 gap-2">
                        <span className="col-span-4 font-bold text-slate-800">Año de fabricación</span>
                        <span className="col-span-8 font-mono font-bold text-slate-900 border-b border-dotted border-slate-300 pb-0.5">
                            {invoiceForm.equipment_year || '2021 / Reciente (Inspeccionado)'}
                        </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                        <span className="col-span-4 font-bold text-slate-800">N° de serie / VIN</span>
                        <span className="col-span-8 font-mono font-bold text-slate-900 border-b border-dotted border-slate-300 pb-0.5">
                            {invoiceForm.equipment_vin || (invoiceForm.payment_reference ? `CAT-${invoiceForm.payment_reference}` : 'CAT0320CL089124')}
                        </span>
                    </div>
                </div>

                {/* Sección: PRECIO — CONDICIÓN DDP (ENTREGADO EN DESTINO) */}
                <div className="border border-slate-300 rounded-xs overflow-hidden">
                    <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                        PRECIO — CONDICIÓN DDP (ENTREGADO EN DESTINO)
                    </div>
                    <div className="text-xs bg-white">
                        {invoiceForm.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center px-3 py-2 border-b border-slate-200">
                                <div className="flex items-center gap-2.5">
                                    {it.image_url && (
                                        <div className="w-8 h-8 rounded border border-slate-300 p-0.5 bg-white shrink-0 flex items-center justify-center">
                                            <img src={it.image_url} alt="" className="max-h-full max-w-full object-contain rounded" />
                                        </div>
                                    )}
                                    <span className="font-medium text-slate-800">
                                        {it.description || 'Equipo (FOB China)'} {it.quantity > 1 ? `(${it.quantity} ${it.unit})` : ''}
                                    </span>
                                </div>
                                <span className="font-mono font-bold text-slate-900">
                                    USD {Number(it.quantity * it.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                        {Number(invoiceForm.shipping_cost || 0) > 0 && (
                            <div className="flex justify-between px-3 py-2 border-b border-slate-200 bg-[#F4F5F7]">
                                <span className="font-medium text-slate-800">Flete y seguro internacional</span>
                                <span className="font-mono font-bold text-slate-900">
                                    USD {Number(invoiceForm.shipping_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between px-3 py-2 border-b border-slate-200">
                            <span className="font-medium text-slate-800">Nacionalización, aranceles y aduana en Venezuela</span>
                            <span className="font-mono font-bold text-slate-900">
                                {invoiceForm.customs_text || (taxAmount > 0 ? `USD ${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'INCLUIDO')}
                            </span>
                        </div>

                        {/* Fila Total DDP en Navy Blue */}
                        <div className="bg-[#0E1C33] text-white px-3 py-2.5 flex justify-between items-center font-black text-xs uppercase tracking-wide">
                            <span>TOTAL DDP — Puesto en destino, Venezuela</span>
                            <span className="font-mono text-base text-white">
                                USD {totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sección: CONDICIONES DE PAGO */}
                <div className="border border-slate-300 rounded-xs overflow-hidden">
                    <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                        CONDICIONES DE PAGO
                    </div>
                    <div className="text-xs">
                        <div className="grid grid-cols-12 px-3 py-2.5 border-b border-slate-200 bg-white items-center">
                            <div className="col-span-2 font-black text-sm text-[#0E1C33]">{invoiceForm.payment_milestone_1_pct || 70}%</div>
                            <div className="col-span-10 text-slate-800">
                                <span className="font-mono font-black text-black">
                                    USD {(totalUsd * (Number(invoiceForm.payment_milestone_1_pct || 70) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>{' '}
                                — {invoiceForm.payment_milestone_1_text || 'Al momento de firmar el contrato, para iniciar la verificación, compra del equipo y proceso de envío.'}
                            </div>
                        </div>
                        <div className="grid grid-cols-12 px-3 py-2.5 bg-[#F4F5F7] items-center">
                            <div className="col-span-2 font-black text-sm text-[#0E1C33]">{invoiceForm.payment_milestone_2_pct || 30}%</div>
                            <div className="col-span-10 text-slate-800">
                                <span className="font-mono font-black text-black">
                                    USD {(totalUsd * (Number(invoiceForm.payment_milestone_2_pct || 30) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>{' '}
                                — {invoiceForm.payment_milestone_2_text || '15 días antes de la llegada del equipo al puerto de destino en Venezuela.'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección: CONDICIONES DE ENVÍO */}
                <div className="border border-slate-300 rounded-xs overflow-hidden">
                    <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                        CONDICIONES DE ENVÍO
                    </div>
                    <div className="p-3 text-xs text-slate-700 leading-relaxed bg-white">
                        {invoiceForm.shipping_terms_notes || 'Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a la disponibilidad de espacio (booking) ofrecida por la naviera.'}
                    </div>
                </div>

                {/* Firmas de Aceptación */}
                <div className="grid grid-cols-2 gap-12 text-center text-xs pt-8">
                    <div className="flex flex-col items-center justify-end">
                        {stampUrl ? (
                            <div className="h-20 sm:h-24 w-full flex items-center justify-center relative mb-1">
                                <img
                                    src={stampUrl}
                                    alt="Firma autorizada"
                                    className="max-h-full max-w-[200px] object-contain drop-shadow-xs"
                                />
                            </div>
                        ) : (
                            <div className="h-20 sm:h-24 w-full"></div>
                        )}
                        <div className="w-full border-t border-slate-900 pt-2 mb-1"></div>
                        <span className="font-bold text-slate-900">
                            Firma autorizada — {activeCompany.name}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-end">
                        <div className="h-20 sm:h-24 w-full"></div>
                        <div className="w-full border-t border-slate-900 pt-2 mb-1"></div>
                        <span className="font-bold text-slate-900">
                            Firma / aceptación del cliente
                        </span>
                    </div>
                </div>

                {/* Pie de página 2 */}
                <div className="text-right text-[10px] text-slate-400 pt-4 border-t border-slate-200">
                    Página 2 de 2 • {getDocumentTypeInfo(invoiceForm.document_type).title} {projectedCorrelative}
                </div>
            </div>
        </div>
    );
}

