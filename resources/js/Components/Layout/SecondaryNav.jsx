import React from 'react';
import { Receipt, Users2, Package, FileText, Search, History } from 'lucide-react';
import { getDocumentTypeInfo } from '../../Utils/invoiceConstants';

export default function SecondaryNav({
    currentView,
    setCurrentView,
    invoicesCount = 0,
    companiesCount = 0,
    clientsCount = 0,
    productsCount = 0,
    searchQuery,
    setSearchQuery,
    invoiceForm,
    projectedCorrelative
}) {
    return (
        <div className="bg-white border-b-2 border-slate-300 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 no-print">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 w-full sm:w-auto">
                <button
                    onClick={() => setCurrentView('libro-fiscal')}
                    className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'libro-fiscal'
                        ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                        : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                        }`}
                >
                    <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                    <span className="hidden md:inline">1. LIBRO FISCAL</span>
                    <span className="md:hidden">1. Facturas</span>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold ${currentView === 'libro-fiscal' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                        }`}>
                        {invoicesCount}
                    </span>
                </button>

                <button
                    onClick={() => setCurrentView('directorio')}
                    className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'directorio'
                        ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                        : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                        }`}
                >
                    <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                    <span className="hidden md:inline">2. DIRECTORIO</span>
                    <span className="md:hidden">2. Directorio</span>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold ${currentView === 'directorio' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                        }`}>
                        {companiesCount} Emp · {clientsCount} Clie
                    </span>
                </button>

                <button
                    onClick={() => setCurrentView('catalogo')}
                    className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'catalogo'
                        ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                        : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                        }`}
                >
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
                    <span className="hidden md:inline">3. CATÁLOGO</span>
                    <span className="md:hidden">3. Productos</span>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold ${currentView === 'catalogo' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                        }`}>
                        {productsCount}
                    </span>
                </button>

                <button
                    onClick={() => setCurrentView('generador-pdf')}
                    className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'generador-pdf'
                        ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                        : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                        }`}
                >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <span className="hidden md:inline">4. EMISIÓN & PDF</span>
                    <span className="md:hidden">4. Taller PDF</span>
                </button>

                <button
                    onClick={() => setCurrentView('auditoria')}
                    className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'auditoria'
                        ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                        : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                        }`}
                >
                    <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <span className="hidden md:inline">5. AUDITORÍA & ACTIVIDAD</span>
                    <span className="md:hidden">5. Auditoría</span>
                </button>
            </div>

            {/* Búsqueda o chip de documento activo */}
            {currentView !== 'generador-pdf' && currentView !== 'auditoria' ? (
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-800 absolute left-3 top-1/2 -translate-y-1/2 font-bold" />
                    <input
                        type="text"
                        placeholder={
                            currentView === 'catalogo'
                                ? 'Buscar producto, código o categoría...'
                                : currentView === 'libro-fiscal'
                                    ? 'Buscar factura, control, cliente o RIF...'
                                    : 'Buscar RIF, Cédula o Nombre...'
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 sm:h-9 bg-white border-2 border-slate-400 text-xs font-bold rounded-lg pl-9 pr-3 w-full text-black placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                </div>
            ) : currentView === 'generador-pdf' ? (
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs shrink-0">
                    <span className="text-xs font-bold text-slate-700 hidden sm:inline">Activo:</span>
                    <span className="text-xs font-mono font-black text-blue-900 bg-blue-50 border border-blue-300 px-2 sm:px-2.5 py-1 rounded-md uppercase text-[11px] truncate">
                        {getDocumentTypeInfo(invoiceForm?.document_type).badgeText} • N° {projectedCorrelative}
                    </span>
                </div>
            ) : null}
        </div>
    );
}

