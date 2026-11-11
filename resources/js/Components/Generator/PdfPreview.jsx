import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileText, Layers, Printer, Download } from 'lucide-react';
import PdfTemplateClassic from '../Templates/PdfTemplateClassic';
import PdfTemplateModern from '../Templates/PdfTemplateModern';

export default function PdfPreview({
    mobileEditorTab,
    setMobileEditorTab,
    selectedPdfFormat,
    setSelectedPdfFormat,
    handlePrintDocument,
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
    const printSheetRef = useRef(null);

    const handleReactPrint = useReactToPrint({
        contentRef: printSheetRef,
        documentTitle: projectedCorrelative || 'Documento',
    });

    const handlePrintAction = () => {
        setMobileEditorTab?.('preview');
        setTimeout(() => {
            if (typeof handleReactPrint === 'function') {
                handleReactPrint();
            } else {
                handlePrintDocument?.();
            }
        }, 80);
    };

    const handleDownloadPdf = () => {
        if (invoiceForm?.id) {
            window.location.assign(`/invoices/${invoiceForm.id}/pdf?format=${encodeURIComponent(selectedPdfFormat || 'formato-1')}`);
            return;
        }
        handlePrintAction();
    };
    return (
        <div className={`lg:col-span-7 space-y-4 print:space-y-0 print:!w-full print:!m-0 print:!p-0 print:!block ${
            mobileEditorTab === 'preview' ? 'block' : 'hidden lg:block'
        }`}>
            {/* Botón Móvil para Regresar al Formulario */}
            <div className="lg:hidden flex items-center justify-between pb-1 no-print">
                <button
                    type="button"
                    onClick={() => setMobileEditorTab('formulario')}
                    className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs"
                >
                    <span>← Volver al Formulario</span>
                </button>
                <span className="text-[11px] font-bold text-slate-500">
                    Vista Hoja A4
                </span>
            </div>

            {/* BARRA SUPERIOR DE CONTROL CON SELECTOR DE FORMATO 1 / FORMATO 2 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print bg-white p-3 rounded-xl border border-slate-300 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase tracking-wider">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Plantilla:</span>
                    </div>

                    {/* Selector de Formato 1 / Formato 2 */}
                    <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs font-black">
                        <button
                            type="button"
                            onClick={() => setSelectedPdfFormat('formato-1')}
                            className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                selectedPdfFormat === 'formato-1'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-800 hover:text-black hover:bg-slate-200'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Formato 1: Fiscal</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedPdfFormat('formato-2')}
                            className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                selectedPdfFormat === 'formato-2'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-800 hover:text-black hover:bg-slate-200'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                            <span>Formato 2: Industrial</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={handlePrintAction}
                        className="h-8 sm:h-9 px-3.5 bg-white border-2 border-slate-400 hover:bg-slate-200 text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors flex-1 sm:flex-initial"
                    >
                        <Printer className="w-4 h-4 text-black" />
                        <span>Imprimir</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        title={invoiceForm?.id ? 'Descargar PDF directo generado por el servidor' : 'Guardar vista previa como PDF'}
                        className="h-8 sm:h-9 px-3.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors flex-1 sm:flex-initial"
                    >
                        <Download className="w-4 h-4 text-white" />
                        <span>{invoiceForm?.id ? 'Descargar PDF' : 'Guardar PDF'}</span>
                    </button>
                </div>
            </div>

            {/* CONTENEDOR DE HOJA FÍSICA A4 EN VIVO */}
            <div className="overflow-x-auto -mx-2 sm:mx-0 p-1 sm:p-0 print:overflow-visible print:!m-0 print:!p-0 print:!w-full">
                <div
                    ref={printSheetRef}
                    className="min-w-[620px] lg:min-w-0 bg-white rounded-lg shadow-sm p-4 sm:p-8 md:p-10 text-slate-900 text-xs font-sans relative printable-sheet border border-slate-200 print:min-w-0 print:!w-full print:!m-0 print:!p-0 print:!border-none print:!shadow-none print:!rounded-none print:!bg-white"
                >
                    {selectedPdfFormat === 'formato-1' ? (
                        <PdfTemplateClassic
                            activeCompany={activeCompany}
                            invoiceForm={invoiceForm}
                            currentSelectedClient={currentSelectedClient}
                            projectedCorrelative={projectedCorrelative}
                            projectedControlNumber={projectedControlNumber}
                            itemsSubtotal={itemsSubtotal}
                            taxAmount={taxAmount}
                            totalUsd={totalUsd}
                            totalVes={totalVes}
                        />
                    ) : (
                        <PdfTemplateModern
                            activeCompany={activeCompany}
                            invoiceForm={invoiceForm}
                            currentSelectedClient={currentSelectedClient}
                            projectedCorrelative={projectedCorrelative}
                            projectedControlNumber={projectedControlNumber}
                            taxAmount={taxAmount}
                            totalUsd={totalUsd}
                            totalVes={totalVes}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

