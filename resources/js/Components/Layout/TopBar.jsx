import React from 'react';
import { Type, ChevronDown, Check, FilePlus2, LogOut } from 'lucide-react';
import { zoomOptions } from '../../Utils/invoiceConstants';

export default function TopBar({
    zoomLevel,
    isZoomOpen,
    setIsZoomOpen,
    handleZoomChange,
    handleNewInvoice,
    handleLogout
}) {
    const currentZoomOption = zoomOptions.find(o => o.value === zoomLevel) || zoomOptions[1];

    return (
        <header className="bg-white border-b-2 border-slate-300 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-40 shadow-xs no-print">
            {/* Logo & Marca del Sistema */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                <img
                    src="/images/corpoasia-square.png"
                    alt="Inversiones CorpoAsia C.A."
                    className="h-8 sm:h-9 w-auto object-contain shrink-0"
                />
                <div className="hidden xs:block h-6 w-px bg-slate-300"></div>
                <div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <h1 className="text-xs sm:text-sm font-black tracking-tight text-black uppercase leading-none">
                            Corpo<span className="text-blue-700">Documents</span>
                        </h1>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 hidden xs:block mt-0.5">
                        Facturación & Control Fiscal
                    </span>
                </div>
            </div>

            {/* Acciones de Cabecera: Zoom, Nueva Factura, Cerrar Sesión */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
                {/* Selector de escala de pantalla / Zoom (en md+) */}
                <div className="relative hidden md:block">
                    <button
                        type="button"
                        onClick={() => setIsZoomOpen(!isZoomOpen)}
                        className="h-9 flex items-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-300 text-black px-3 rounded-lg shadow-xs transition-colors font-black text-xs cursor-pointer"
                        title="Ajustar tamaño de letra y pantalla"
                    >
                        <Type className="w-4 h-4 text-slate-700 shrink-0" />
                        <span>Tamaño: <strong>{currentZoomOption.value}%</strong></span>
                        <ChevronDown className={`w-3.5 h-3.5 text-black transition-transform ${isZoomOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isZoomOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsZoomOpen(false)} />
                            <div className="absolute right-0 mt-1.5 w-60 bg-white border-2 border-black rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-200">
                                <div className="p-2.5 bg-slate-100 flex items-center justify-between border-b border-slate-300">
                                    <span className="text-[11px] font-black uppercase text-black">
                                        Tamaño de Pantalla
                                    </span>
                                    <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">
                                        Zoom
                                    </span>
                                </div>
                                <div className="p-1.5 space-y-1">
                                    {zoomOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                handleZoomChange(opt.value);
                                                setIsZoomOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs font-black transition-colors ${
                                                zoomLevel === opt.value
                                                    ? 'bg-black text-white'
                                                    : 'text-black hover:bg-slate-100'
                                            }`}
                                        >
                                            <div>
                                                <span className="block">{opt.label}</span>
                                                <span className={`block text-[10px] font-bold ${
                                                    zoomLevel === opt.value ? 'text-slate-300' : 'text-slate-700'
                                                }`}>
                                                    {opt.desc}
                                                </span>
                                            </div>
                                            {zoomLevel === opt.value && (
                                                <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={handleNewInvoice}
                    className="h-8 sm:h-9 bg-blue-700 hover:bg-blue-800 text-white text-[11px] sm:text-xs font-black px-2.5 sm:px-4 rounded-lg flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                >
                    <FilePlus2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">NUEVA FACTURA / PDF</span>
                    <span className="sm:hidden">Nueva</span>
                </button>

                <div className="h-5 sm:h-6 w-px bg-slate-300"></div>

                <button
                    onClick={handleLogout}
                    className="h-8 sm:h-9 bg-white hover:bg-red-50 border-2 border-slate-300 hover:border-red-500 text-black hover:text-red-900 px-2 sm:px-3 rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="Cerrar Sesión del Sistema"
                >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-700" />
                    <span className="hidden sm:inline">Salir</span>
                </button>
            </div>
        </header>
    );
}

