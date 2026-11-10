import React from 'react';
import {
    User,
    Users2,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
    Save
} from 'lucide-react';

export default function ClientModal({
    isOpen,
    onClose,
    editingClient,
    newClient,
    setNewClient,
    onSubmit,
    isSavingClient,
    isConsultingCne,
    handleConsultCne,
    cneAlert
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
            <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-700" />
                        <h3 className="text-sm font-black text-black uppercase">
                            {editingClient ? 'Editar Cliente / Adquiriente' : 'Registrar Nuevo Cliente / Adquiriente'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nota explicativa de Cliente / Adquiriente */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-start gap-2.5">
                    <Users2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                        <strong className="text-emerald-950 font-black">👥 Cliente / Adquiriente:</strong> Es la persona natural o jurídica que compra nuestros productos o servicios y a quien se le emitirá el documento de cobro.
                    </p>
                </div>

                {/* Alerta de resultado CNE */}
                {cneAlert && (
                    <div className={`p-3 rounded-lg border-2 text-xs font-black flex items-center gap-2 ${
                        cneAlert.type === 'success'
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                            : 'bg-red-100 border-red-500 text-red-950'
                    }`}>
                        {cneAlert.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                        )}
                        <span>{cneAlert.message}</span>
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* TIPO Y CONSULTA CNE */}
                    <div>
                        <label className="text-xs font-black text-black block mb-1">
                            Cédula / DNI del Cliente (Consulta CNE) *
                        </label>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                            <select
                                value={newClient.nacionalidad}
                                onChange={(e) => {
                                    const nac = e.target.value;
                                    setNewClient(prev => ({
                                        ...prev,
                                        nacionalidad: nac,
                                        tax_id: prev.cedulaNumber ? `${nac}-${prev.cedulaNumber}` : prev.tax_id
                                    }));
                                }}
                                className="h-9 w-20 bg-white border-2 border-slate-400 rounded-lg px-2 text-xs font-black text-black"
                            >
                                <option value="V">V -</option>
                                <option value="E">E -</option>
                                <option value="J">J -</option>
                                <option value="G">G -</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Ej: 29923421 (solo dígitos)"
                                value={newClient.cedulaNumber}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '');
                                    setNewClient(prev => ({
                                        ...prev,
                                        cedulaNumber: digits,
                                        tax_id: digits ? `${prev.nacionalidad}-${digits}` : ''
                                    }));
                                }}
                                className="h-9 flex-1 min-w-[130px] bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono placeholder:text-slate-500"
                            />

                            {/* BOTÓN CNE AUTOCOMPLETE */}
                            <button
                                type="button"
                                onClick={handleConsultCne}
                                disabled={isConsultingCne}
                                className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer w-full sm:w-auto shrink-0"
                                title="Consultar datos oficiales en CNE y autocompletar"
                            >
                                {isConsultingCne ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Buscando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-amber-300" />
                                        <span>CNE</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 block mt-1">
                            Presiona <strong>CNE</strong> para autocompletar el nombre completo y datos oficiales de la persona.
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">Tipo de Cliente</label>
                            <select
                                value={newClient.type}
                                onChange={(e) => setNewClient(prev => ({ ...prev, type: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black"
                            >
                                <option value="persona">Persona Natural</option>
                                <option value="empresa">Empresa / Jurídico</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-black text-black block mb-1">Identificación Fiscal / RIF *</label>
                            <input
                                type="text"
                                required
                                placeholder="V-29923421"
                                value={newClient.tax_id}
                                onChange={(e) => setNewClient(prev => ({ ...prev, tax_id: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono uppercase"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-black block mb-1">Nombre Completo o Razón Social *</label>
                        <input
                            type="text"
                            required
                            placeholder="Nombre completo (se autocompleta con CNE)"
                            value={newClient.name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                            className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">Teléfono / WhatsApp *</label>
                            <input
                                type="text"
                                required
                                placeholder="+58 424 2438916"
                                value={newClient.phone}
                                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-black block mb-1">Correo Electrónico (Opcional)</label>
                            <input
                                type="email"
                                placeholder="cliente@correo.com (Opcional)"
                                value={newClient.email}
                                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-black block mb-1">Dirección Fiscal / Entrega</label>
                        <textarea
                            rows="2"
                            placeholder="Dirección fiscal o de despacho..."
                            value={newClient.address}
                            onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
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
                            disabled={isSavingClient}
                            className="h-9 px-5 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                        >
                            <Save className="w-4 h-4 text-emerald-400" />
                            <span>{isSavingClient ? 'Guardando...' : (editingClient ? 'Actualizar Cliente' : 'Guardar Cliente')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

