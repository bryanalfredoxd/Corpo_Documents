import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Receipt, Users2, Package, FileText, Search, History, Boxes, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDocumentTypeInfo } from '../../Utils/invoiceConstants';

export default function SecondaryNav({
    currentView,
    setCurrentView,
    invoicesCount = 0,
    companiesCount = 0,
    clientsCount = 0,
    productsCount = 0,
    consignmentsCount = 0,
    searchQuery,
    setSearchQuery,
    invoiceForm,
    projectedCorrelative
}) {
    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const updateScrollArrows = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const hasOverflow = el.scrollWidth > el.clientWidth;
        setShowLeftArrow(hasOverflow && el.scrollLeft > 10);
        setShowRightArrow(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        updateScrollArrows();
        el.addEventListener('scroll', updateScrollArrows, { passive: true });
        window.addEventListener('resize', updateScrollArrows);
        return () => {
            el.removeEventListener('scroll', updateScrollArrows);
            window.removeEventListener('resize', updateScrollArrows);
        };
    }, [updateScrollArrows, invoicesCount, companiesCount, clientsCount, productsCount, consignmentsCount]);

    const scrollHorizontally = (direction) => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const offset = direction === 'left' ? -240 : 240;
        el.scrollBy({ left: offset, behavior: 'smooth' });
    };

    const handleWheel = (e) => {
        const el = scrollContainerRef.current;
        if (!el) return;
        if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
            el.scrollLeft += e.deltaY;
        }
    };

    return (
        <div className="bg-white border-b-2 border-slate-300 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 no-print">
            <div className="relative flex-1 min-w-0 flex items-center gap-1">
                {showLeftArrow && (
                    <button
                        type="button"
                        onClick={() => scrollHorizontally('left')}
                        className="hidden sm:flex items-center justify-center h-8 w-6 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-xs text-slate-700 shrink-0 cursor-pointer z-10 transition-colors"
                        title="Desplazar a la izquierda"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                )}

                <div
                    ref={scrollContainerRef}
                    onWheel={handleWheel}
                    className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 pt-0.5 w-full scroll-smooth"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9',
                    }}
                >
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
                        onClick={() => setCurrentView('consignaciones')}
                        className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'consignaciones'
                            ? 'bg-black text-white shadow-xs ring-2 ring-purple-600'
                            : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                            }`}
                    >
                        <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
                        <span className="hidden md:inline">5. CONSIGNACIONES</span>
                        <span className="md:hidden">5. Consignaciones</span>
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold ${currentView === 'consignaciones' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                            }`}>
                            {consignmentsCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setCurrentView('auditoria')}
                        className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'auditoria'
                            ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                            : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                            }`}
                    >
                        <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                        <span className="hidden md:inline">6. AUDITORÍA & ACTIVIDAD</span>
                        <span className="md:hidden">6. Auditoría</span>
                    </button>
                </div>

                {showRightArrow && (
                    <button
                        type="button"
                        onClick={() => scrollHorizontally('right')}
                        className="hidden sm:flex items-center justify-center h-8 w-6 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-xs text-slate-700 shrink-0 cursor-pointer z-10 transition-colors"
                        title="Desplazar a la derecha"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Búsqueda o chip de documento activo */}
            {currentView !== 'generador-pdf' && currentView !== 'auditoria' ? (
                <div className="relative w-full md:w-72 shrink-0">
                    <Search className="w-4 h-4 text-slate-800 absolute left-3 top-1/2 -translate-y-1/2 font-bold" />
                    <input
                        type="text"
                        placeholder={
                            currentView === 'catalogo'
                                ? 'Buscar producto, código o categoría...'
                                : currentView === 'consignaciones'
                                    ? 'Buscar cliente, máquina o consignación...'
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

