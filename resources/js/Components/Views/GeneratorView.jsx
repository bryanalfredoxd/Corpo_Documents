import React from 'react';
import { FileText, Eye } from 'lucide-react';
import InvoiceForm from '../Generator/InvoiceForm';
import PdfPreview from '../Generator/PdfPreview';

export default function GeneratorView({
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
    setSelectedPdfFormat,
    currentSelectedClient,
    itemsSubtotal,
    taxAmount,
    totalUsd,
    totalVes,
    projectedCorrelative,
    projectedControlNumber,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleAddTechSpec,
    handleRemoveTechSpec,
    handleTechSpecChange,
    handleResetDefaultTechSpecs,
    handleSubmitInvoice,
    isSubmittingInvoice,
    handlePrintDocument,
    onOpenCreateClient,
    onOpenProductPicker,
    onQuickSaveToCatalog,
    setCurrentView,
    mobileEditorTab,
    setMobileEditorTab
}) {
    return (
        <div className="space-y-4 print:space-y-0">
            {/* SELECTOR MÓVIL ENTRE FORMULARIO Y VISTA PREVIA A4 (Pantallas < lg) */}
            <div className="lg:hidden sticky top-[53px] z-30 bg-[#F1F5F9] pb-2 pt-1 -mx-1 px-1 no-print">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border-2 border-slate-300 shadow-sm text-xs font-black">
                    <button
                        type="button"
                        onClick={() => setMobileEditorTab('formulario')}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            mobileEditorTab === 'formulario'
                                ? 'bg-blue-700 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>1. Formulario</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileEditorTab('preview')}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            mobileEditorTab === 'preview'
                                ? 'bg-blue-700 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <Eye className="w-4 h-4 shrink-0" />
                        <span>2. Hoja A4 en Vivo</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start print:block print:w-full print:m-0 print:p-0">
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <InvoiceForm
                    companies={companies}
                    clients={clients}
                    products={products}
                    activeCompany={activeCompany}
                    selectedCompanyId={selectedCompanyId}
                    setSelectedCompanyId={setSelectedCompanyId}
                    invoiceForm={invoiceForm}
                    setInvoiceForm={setInvoiceForm}
                    handleDocumentTypeChange={handleDocumentTypeChange}
                    selectedPdfFormat={selectedPdfFormat}
                    currentSelectedClient={currentSelectedClient}
                    itemsSubtotal={itemsSubtotal}
                    taxAmount={taxAmount}
                    totalUsd={totalUsd}
                    totalVes={totalVes}
                    handleAddItem={handleAddItem}
                    handleRemoveItem={handleRemoveItem}
                    handleItemChange={handleItemChange}
                    handleAddTechSpec={handleAddTechSpec}
                    handleRemoveTechSpec={handleRemoveTechSpec}
                    handleTechSpecChange={handleTechSpecChange}
                    handleResetDefaultTechSpecs={handleResetDefaultTechSpecs}
                    handleSubmitInvoice={handleSubmitInvoice}
                    isSubmittingInvoice={isSubmittingInvoice}
                    onOpenCreateClient={onOpenCreateClient}
                    onOpenProductPicker={onOpenProductPicker}
                    onQuickSaveToCatalog={onQuickSaveToCatalog}
                    setCurrentView={setCurrentView}
                    mobileEditorTab={mobileEditorTab}
                    setMobileEditorTab={setMobileEditorTab}
                />

                {/* COLUMNA DERECHA: VISTA PREVIA HOJA A4 */}
                <PdfPreview
                    mobileEditorTab={mobileEditorTab}
                    setMobileEditorTab={setMobileEditorTab}
                    selectedPdfFormat={selectedPdfFormat}
                    setSelectedPdfFormat={setSelectedPdfFormat}
                    handlePrintDocument={handlePrintDocument}
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
            </div>
        </div>
    );
}

