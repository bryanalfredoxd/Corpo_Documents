import React from 'react';
import { Building2, X, Save } from 'lucide-react';

export default function CompanyModal({
    isOpen,
    onClose,
    editingCompany,
    newCompany,
    setNewCompany,
    onSubmit,
    isSavingCompany
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
            <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-700" />
                        <h3 className="text-sm font-black text-black uppercase">
                            {editingCompany ? 'Editar Empresa Emisora' : 'Registrar Nueva Empresa Emisora'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nota explicativa de Empresa Emisora */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                        <strong className="text-blue-950 font-black">🏢 Empresa Emisora:</strong> Es la entidad jurídica oficial con su RIF y domicilio fiscal que emitirá facturas, proformas y notas de entrega. Todos los documentos emitidos utilizan automáticamente el membrete corporativo institucional.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-black block mb-1">Razón Social *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Agrosuministros Rodríguez C.A."
                            value={newCompany.name}
                            onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                            className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">RIF / ID Fiscal *</label>
                            <input
                                type="text"
                                required
                                placeholder="J-50493821-4"
                                value={newCompany.tax_id}
                                onChange={(e) => setNewCompany(prev => ({ ...prev, tax_id: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono uppercase"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-black block mb-1">Prefijo de Factura</label>
                            <input
                                type="text"
                                placeholder="F- o PROF-"
                                value={newCompany.invoice_prefix}
                                onChange={(e) => setNewCompany(prev => ({ ...prev, invoice_prefix: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">Teléfono / WhatsApp *</label>
                            <input
                                type="text"
                                required
                                placeholder="+58 412 9614615"
                                value={newCompany.phone}
                                onChange={(e) => setNewCompany(prev => ({ ...prev, phone: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-black block mb-1">Email (Opcional)</label>
                            <input
                                type="email"
                                placeholder="empresa@correo.com (Opcional)"
                                value={newCompany.email}
                                onChange={(e) => setNewCompany(prev => ({ ...prev, email: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-black block mb-1">Dirección Fiscal Completa *</label>
                        <textarea
                            required
                            rows="2"
                            placeholder="Ciudad, Estado, Dirección..."
                            value={newCompany.address}
                            onChange={(e) => setNewCompany(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-400 rounded-lg p-2.5 text-xs font-black text-black"
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5 pt-2 border-t-2 border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black text-black cursor-pointer w-full sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingCompany}
                            className="h-9 px-5 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                        >
                            <Save className="w-4 h-4 text-emerald-400" />
                            <span>{isSavingCompany ? 'Guardando...' : (editingCompany ? 'Actualizar Empresa' : 'Guardar Empresa')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

