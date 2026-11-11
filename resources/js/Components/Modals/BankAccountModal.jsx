import React from 'react';
import { Landmark, X, Save } from 'lucide-react';

export default function BankAccountModal({
    isOpen,
    onClose,
    targetCompany,
    editingBankAccount,
    bankAccountForm,
    setBankAccountForm,
    onSubmit,
    isSavingBankAccount
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
            <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3">
                    <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-emerald-700" />
                        <div>
                            <h3 className="text-sm font-black text-black uppercase leading-tight">
                                {editingBankAccount ? 'Editar Cuenta Bancaria' : 'Registrar Cuenta Bancaria / Pago'}
                            </h3>
                            {targetCompany && (
                                <p className="text-[11px] font-bold text-slate-600 truncate max-w-[340px]">
                                    Empresa: {targetCompany.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Chips rápidos de Banco / Método */}
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { label: 'Banco de Venezuela', bank: 'Banco de Venezuela', type: 'Corriente' },
                        { label: 'Banesco', bank: 'Banesco', type: 'Corriente' },
                        { label: 'Mercantil', bank: 'Mercantil', type: 'Corriente' },
                        { label: 'Pago Móvil', bank: 'Pago Móvil (Venezuela)', type: 'Pago Móvil' },
                        { label: 'Zelle', bank: 'Zelle (USD)', type: 'Zelle' },
                        { label: 'Binance / USDT', bank: 'Binance Pay', type: 'Binance / Cripto' },
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => setBankAccountForm(prev => ({
                                ...prev,
                                bank_name: preset.bank,
                                account_type: preset.type
                            }))}
                            className="px-2 py-1 rounded-md text-[10px] font-black bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-300 cursor-pointer transition-colors"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={onSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Banco o Plataforma *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: Banesco, Pago Móvil, Zelle..."
                                value={bankAccountForm.bank_name}
                                onChange={(e) => setBankAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Tipo de Cuenta / Medio *
                            </label>
                            <select
                                required
                                value={bankAccountForm.account_type}
                                onChange={(e) => setBankAccountForm(prev => ({ ...prev, account_type: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-2.5 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            >
                                <option value="Corriente">Cuenta Corriente</option>
                                <option value="Ahorro">Cuenta de Ahorro</option>
                                <option value="Pago Móvil">Pago Móvil</option>
                                <option value="Zelle">Zelle (USD)</option>
                                <option value="Cuenta USD / Nacional">Cuenta Custodia / USD</option>
                                <option value="Transferencia Internacional">Wire / Internacional</option>
                                <option value="Binance / Cripto">Binance Pay / USDT</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-black block mb-1">
                            Número de Cuenta (20 dígitos o identificador)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: 0134-0012-91-0003849102 (opcional para Pago Móvil/Zelle)"
                            value={bankAccountForm.account_number || ''}
                            onChange={(e) => setBankAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                            className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Titular de la Cuenta *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Nombre o Razón Social"
                                value={bankAccountForm.holder_name}
                                onChange={(e) => setBankAccountForm(prev => ({ ...prev, holder_name: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                RIF / Cédula del Titular *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: J-40530413-8"
                                value={bankAccountForm.holder_tax_id}
                                onChange={(e) => setBankAccountForm(prev => ({ ...prev, holder_tax_id: e.target.value.toUpperCase() }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Teléfono (Pago Móvil)
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: 0412-9614615"
                                value={bankAccountForm.phone || ''}
                                onChange={(e) => setBankAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Correo Electrónico (Zelle / Binance)
                            </label>
                            <input
                                type="email"
                                placeholder="pagos@empresa.com"
                                value={bankAccountForm.email || ''}
                                onChange={(e) => setBankAccountForm(prev => ({ ...prev, email: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t-2 border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-black text-black cursor-pointer w-full sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingBankAccount}
                            className="h-9 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto shadow-xs"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSavingBankAccount ? 'Guardando...' : (editingBankAccount ? 'Actualizar Cuenta' : 'Guardar Cuenta')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

