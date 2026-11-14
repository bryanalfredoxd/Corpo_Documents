import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Tag,
    X,
    Plus,
    Edit3,
    Trash2,
    Save,
    Check,
    Layers,
    Info,
    Sparkles
} from 'lucide-react';
import { CATEGORY_COLOR_PALETTES } from '../../Utils/invoiceConstants';
import { useFeedback } from '../../Contexts/FeedbackContext';

const PRESET_EMOJIS = [
    '🚜', '🌱', '🩺', '🚢', '🏢', '⚙️', '🔧', '📦', '🧪', '🛒', '✈️', '🏭', '⚡', '🌾', '🏥', '💼', '🏷️'
];

export default function ClientCategoryModal({
    isOpen,
    onClose,
    clientCategories = [],
    clients = []
}) {
    if (!isOpen) return null;

    const { confirm, notify } = useFeedback();

    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '🏷️',
        color: 'blue'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleStartCreate = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            icon: '🏷️',
            color: 'blue'
        });
    };

    const handleStartEdit = (cat) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            description: cat.description || '',
            icon: cat.icon || '🏷️',
            color: cat.color || 'blue'
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            notify.error('Por favor escribe el nombre de la sección.');
            return;
        }

        setIsSaving(true);
        const payload = {
            name: trimmedName,
            description: formData.description ? formData.description.trim() : null,
            icon: formData.icon || '🏷️',
            color: formData.color || 'blue'
        };

        if (editingCategory) {
            router.put(`/client-categories/${editingCategory.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    notify.info(`Sección "${trimmedName}" actualizada correctamente.`);
                    handleStartCreate();
                },
                onError: (err) => {
                    setIsSaving(false);
                    notify.error(Object.values(err).join(', ') || 'No se pudo actualizar la sección.');
                }
            });
        } else {
            router.post('/client-categories', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    notify.info(`¡Nueva sección "${trimmedName}" agregada con éxito!`);
                    handleStartCreate();
                },
                onError: (err) => {
                    setIsSaving(false);
                    notify.error(Object.values(err).join(', ') || 'No se pudo registrar la sección.');
                }
            });
        }
    };

    const handleDelete = async (cat) => {
        const clientCount = clients.filter(c => (c.category || '').toLowerCase() === cat.name.toLowerCase()).length;
        const msg = clientCount > 0
            ? `¿Deseas eliminar la sección "${cat.name}"?\n\nTiene ${clientCount} cliente(s) vinculado(s) que serán reasignados automáticamente a "Comercial General" para no perder sus datos ni facturas.`
            : `¿Deseas eliminar la sección "${cat.name}"?`;

        const ok = await confirm({
            title: 'Eliminar Sección de Clientes',
            message: msg,
            confirmLabel: 'Eliminar Sección',
            variant: 'danger'
        });

        if (!ok) return;

        router.delete(`/client-categories/${cat.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                notify.info(`Sección "${cat.name}" eliminada.`);
                if (editingCategory?.id === cat.id) handleStartCreate();
            },
            onError: (err) => {
                notify.error(Object.values(err).join(', ') || 'No se pudo eliminar la sección.');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
            <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                {/* Cabecera */}
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3">
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-blue-700" />
                        <div>
                            <h3 className="text-sm font-black text-black uppercase">
                                Gestionar Secciones y Rubros de Clientes
                            </h3>
                            <p className="text-[11px] font-bold text-slate-500">
                                Configura tus propias secciones para organizar clientes en facturación y directorio.
                            </p>
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

                {/* Formulario de Crear / Editar Sección */}
                <form onSubmit={handleSubmit} className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black flex items-center gap-1.5">
                            {editingCategory ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
                            <span>{editingCategory ? `Modificar Sección: "${editingCategory.name}"` : 'Crear Nueva Sección de Clientes'}</span>
                        </span>
                        {editingCategory && (
                            <button
                                type="button"
                                onClick={handleStartCreate}
                                className="text-[11px] font-black text-blue-700 hover:text-blue-900 cursor-pointer"
                            >
                                + Nueva Sección
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-[11px] font-black text-black block mb-1">
                                Nombre de la Sección o Rubro *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: Repuestos Marinos, Ferretería Industrial, etc."
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-black text-black block mb-1">
                                Icono / Emoji
                            </label>
                            <input
                                type="text"
                                maxLength="10"
                                value={formData.icon}
                                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-3 text-center text-base font-black text-black focus:outline-none focus:border-blue-600"
                            />
                        </div>
                    </div>

                    {/* Selector rápido de emojis */}
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">
                            Elige un emoji sugerido para identificar la sección:
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {PRESET_EMOJIS.map(em => (
                                <button
                                    key={em}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, icon: em }))}
                                    className={`h-7 w-7 rounded-lg text-sm flex items-center justify-center border transition-transform cursor-pointer ${
                                        formData.icon === em ? 'bg-blue-100 border-blue-600 scale-110' : 'bg-white hover:bg-slate-200 border-slate-200'
                                    }`}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Paleta de Color */}
                    <div>
                        <span className="text-[11px] font-black text-black block mb-1.5">
                            Color del Distintivo (Etiqueta):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.values(CATEGORY_COLOR_PALETTES).map(palette => {
                                const isSelected = formData.color === palette.id;
                                return (
                                    <button
                                        key={palette.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, color: palette.id }))}
                                        className={`h-8 px-2 rounded-lg border-2 text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                                            isSelected ? 'border-black ring-2 ring-black/20 shadow-xs' : 'border-slate-200 hover:border-slate-400 bg-white'
                                        }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full shrink-0 ${palette.dot}`} />
                                        <span className="truncate">{palette.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Descripción opcional */}
                    <div>
                        <label className="text-[11px] font-black text-black block mb-1">
                            Descripción / Detalles del Rubro (Opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="Breve nota sobre los tipos de clientes o productos de este rubro..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-800"
                        />
                    </div>

                    {/* Botones de acción del formulario */}
                    <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-200">
                        {editingCategory && (
                            <button
                                type="button"
                                onClick={handleStartCreate}
                                className="h-8 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black cursor-pointer"
                            >
                                Cancelar Edición
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="h-8 px-4 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                            <Save className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isSaving ? 'Guardando...' : (editingCategory ? 'Guardar Cambios' : '+ Agregar Sección')}</span>
                        </button>
                    </div>
                </form>

                {/* Lista de Secciones Existentes */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black uppercase">
                            Secciones Registradas ({clientCategories.length})
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                            Puedes renombrar o editar cada una cuando quieras
                        </span>
                    </div>

                    <div className="divide-y divide-slate-200 border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                        {clientCategories.length === 0 ? (
                            <div className="p-6 text-center text-xs font-bold text-slate-500 italic">
                                No hay secciones registradas aún. ¡Crea tu primera sección arriba!
                            </div>
                        ) : (
                            clientCategories.map(cat => {
                                const clientCount = clients.filter(c => (c.category || '').toLowerCase().trim() === cat.name.toLowerCase().trim()).length;
                                const palette = CATEGORY_COLOR_PALETTES[cat.color] || CATEGORY_COLOR_PALETTES.blue;
                                const isCurrentEditing = editingCategory?.id === cat.id;

                                return (
                                    <div
                                        key={cat.id}
                                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                                            isCurrentEditing ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xl shrink-0 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                                {cat.icon || '🏷️'}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <strong className="text-xs font-black text-black">
                                                        {cat.name}
                                                    </strong>
                                                    <span className={`text-[10px] font-black px-2 py-0.2 rounded border ${palette.badge}`}>
                                                        {clientCount} cliente{clientCount === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                                {cat.description && (
                                                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                                        {cat.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(cat)}
                                                className="h-7 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-800 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                title="Editar nombre, icono o color"
                                            >
                                                <Edit3 className="w-3 h-3 text-blue-700" />
                                                <span>Editar</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(cat)}
                                                className="h-7 w-7 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 flex items-center justify-center cursor-pointer transition-colors"
                                                title="Eliminar sección"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Pie de modal */}
                <div className="flex justify-end pt-2 border-t-2 border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-5 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs"
                    >
                        Listo / Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

