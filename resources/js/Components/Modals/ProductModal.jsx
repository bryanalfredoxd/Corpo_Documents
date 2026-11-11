import React, { useState } from 'react';
import { Package, X, Save, Camera, CheckCircle2, Layers, Plus, Trash2, Sparkles, Boxes } from 'lucide-react';
import { defaultTechnicalSpecs } from '../../Utils/invoiceConstants';
import { compressImageToDataUrl } from '../../Utils/imageCompression';

export default function ProductModal({
    isOpen,
    onClose,
    editingProduct,
    productForm,
    setProductForm,
    onSubmit,
    isSavingProduct
}) {
    const [showTechSpecsSection, setShowTechSpecsSection] = useState(false);

    if (!isOpen) return null;

    const previewUrl = productForm.imagePreview || productForm.image_url;
    const specsObj = productForm.technical_specs || {};
    const specsList = Array.isArray(specsObj.specs) ? specsObj.specs : [];

    const handleAddSpecRow = () => {
        setProductForm(prev => ({
            ...prev,
            technical_specs: {
                ...(prev.technical_specs || {}),
                specs: [...(prev.technical_specs?.specs || []), { category: 'Especificaciones', name: '', value: '' }]
            }
        }));
    };

    const handleUpdateSpecRow = (idx, field, val) => {
        setProductForm(prev => {
            const list = [...(prev.technical_specs?.specs || [])];
            list[idx] = { ...list[idx], [field]: val };
            return {
                ...prev,
                technical_specs: { ...(prev.technical_specs || {}), specs: list }
            };
        });
    };

    const handleRemoveSpecRow = (idx) => {
        setProductForm(prev => ({
            ...prev,
            technical_specs: {
                ...(prev.technical_specs || {}),
                specs: (prev.technical_specs?.specs || []).filter((_, i) => i !== idx)
            }
        }));
    };

    const handleLoadSampleSpecs = () => {
        setProductForm(prev => ({
            ...prev,
            technical_specs: {
                equipment_year: prev.technical_specs?.equipment_year || '2021 / Reciente (Inspeccionado)',
                equipment_vin: prev.technical_specs?.equipment_vin || '',
                specs: defaultTechnicalSpecs.map(s => ({ ...s }))
            }
        }));
    };

    const handleImageFileChange = async (e) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        const { file, dataUrl } = await compressImageToDataUrl(rawFile);
        setProductForm(prev => ({
            ...prev,
            imageFile: file,
            imagePreview: dataUrl,
            remove_image: false
        }));
    };

    const handleRemoveImage = () => {
        setProductForm(prev => ({
            ...prev,
            imageFile: null,
            imagePreview: null,
            image_url: null,
            remove_image: true
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
            <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-700" />
                        <h3 className="text-sm font-black text-black uppercase">
                            {editingProduct ? 'Editar Producto del Catálogo' : 'Registrar Nuevo Producto en Catálogo'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nota informativa */}
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs flex items-start gap-2.5">
                    <Package className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                        <strong className="text-indigo-950 font-black">📦 Catálogo Reutilizable:</strong> Los productos guardados aquí se cargarán con un clic en tus Facturas, Proformas y Cotizaciones sin volver a escribir sus precios, detalles ni fotos.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-3.5">
                    <div>
                        <label className="text-xs font-black text-black block mb-1">
                            Nombre / Descripción del Producto *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Bicicleta Montañera Rin 29 / Excavadora CAT 320..."
                            value={productForm.name}
                            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                            className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Código / SKU (Opcional)
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: BIC-29 / PROD-001"
                                value={productForm.code || ''}
                                onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Categoría
                            </label>
                            <input
                                type="text"
                                list="product-categories-list"
                                placeholder="Ej: Bicicletas, Maquinaria..."
                                value={productForm.category || ''}
                                onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <datalist id="product-categories-list">
                                <option value="General" />
                                <option value="Bicicletas" />
                                <option value="Maquinaria" />
                                <option value="Repuestos" />
                                <option value="Ferretería" />
                                <option value="Electrónica" />
                                <option value="Servicios" />
                                <option value="Importación China" />
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-black block mb-1">
                            Detalles Técnicos / Especificaciones (Opcional)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Ej: Cuadro de aluminio ligero, cambios Shimano 21V, frenos de disco..."
                            value={productForm.details || ''}
                            onChange={(e) => setProductForm(prev => ({ ...prev, details: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-400 rounded-lg p-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Precio Unitario ($) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    placeholder="0.00"
                                    value={productForm.unit_price}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, unit_price: e.target.value }))}
                                    className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg pl-7 pr-3 text-xs font-black text-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-black block mb-1">
                                Unidad *
                            </label>
                            <select
                                value={productForm.unit}
                                onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                                className="h-9 w-full bg-white border-2 border-slate-400 rounded-lg px-2.5 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            >
                                <option value="unid">unid (Unidad)</option>
                                <option value="pza">pza (Pieza)</option>
                                <option value="caja">caja (Caja)</option>
                                <option value="kg">kg (Kilos)</option>
                                <option value="lt">lt (Litros)</option>
                                <option value="serv">serv (Servicio)</option>
                                <option value="m²">m² (Metro cuad.)</option>
                            </select>
                        </div>

                        <div className="h-9 flex items-center">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg border-2 border-slate-300 w-full select-none">
                                <input
                                    type="checkbox"
                                    checked={!!productForm.is_tax_exempt}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, is_tax_exempt: e.target.checked }))}
                                    className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                />
                                <span>Exento IVA</span>
                            </label>
                        </div>
                    </div>

                    {/* Foto / Imagen Opcional */}
                    <div>
                        <label className="text-xs font-black text-black block mb-1">
                            Foto del Producto (Opcional para PDF/Cotizaciones)
                        </label>
                        {previewUrl ? (
                            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border-2 border-slate-300">
                                <div className="w-14 h-14 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center shrink-0">
                                    <img
                                        src={previewUrl}
                                        alt="Vista previa producto"
                                        className="max-h-full max-w-full object-contain rounded"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Imagen lista</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">
                                        Se incluirá automáticamente al seleccionar este producto.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="text-xs font-black text-red-700 hover:text-red-900 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg border border-red-300 cursor-pointer shrink-0 transition-colors"
                                >
                                    Quitar
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-indigo-50/60 border-2 border-dashed border-slate-400 hover:border-indigo-500 rounded-xl text-xs font-black text-slate-700 cursor-pointer transition-colors">
                                <Camera className="w-4 h-4 text-indigo-700" />
                                <span>Subir Foto / Imagen del Producto (Opcional)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageFileChange}
                                />
                            </label>
                        )}
                    </div>

                    {/* Control Opcional de Inventario / Existencias */}
                    <div className="p-3 bg-emerald-50/70 rounded-xl border-2 border-emerald-200 space-y-2.5">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-950 select-none">
                            <input
                                type="checkbox"
                                checked={!!productForm.track_inventory}
                                onChange={(e) => setProductForm(prev => ({ ...prev, track_inventory: e.target.checked }))}
                                className="rounded border-emerald-400 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                            />
                            <Boxes className="w-4 h-4 text-emerald-700" />
                            <span>Controlar Existencias / Stock (Opcional)</span>
                        </label>
                        {productForm.track_inventory && (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="text-[11px] font-black text-black block mb-1">Stock Actual ({productForm.unit || 'unid'})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productForm.stock ?? 0}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                                        className="h-8 w-full bg-white border border-emerald-400 rounded-lg px-2.5 text-xs font-mono font-black text-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-black block mb-1">Alerta Stock Mínimo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={productForm.min_stock ?? 0}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, min_stock: e.target.value }))}
                                        className="h-8 w-full bg-white border border-emerald-400 rounded-lg px-2.5 text-xs font-mono font-black text-black"
                                    />
                                </div>
                                <p className="col-span-2 text-[10px] text-emerald-900 font-medium">
                                    El inventario se descontará automáticamente al emitir Facturas o Notas de Entrega (las cotizaciones/proformas no descuentan stock).
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Ficha Técnica Dinámica (Opcional para Formato 2 Industrial) */}
                    <div className="p-3 bg-amber-50/70 rounded-xl border-2 border-amber-200 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => setShowTechSpecsSection(prev => !prev)}
                                className="flex items-center gap-2 text-xs font-black text-amber-950 cursor-pointer"
                            >
                                <Layers className="w-4 h-4 text-amber-700" />
                                <span>Ficha Técnica Industrial ({specsList.length} filas) — Opcional</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowTechSpecsSection(prev => !prev)}
                                className="text-[10px] font-black text-amber-800 underline cursor-pointer"
                            >
                                {showTechSpecsSection || specsList.length > 0 ? 'Ocultar' : 'Configurar Ficha'}
                            </button>
                        </div>

                        {(showTechSpecsSection || specsList.length > 0) && (
                            <div className="space-y-2.5 pt-1 border-t border-amber-200">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-black text-black block mb-0.5">Año / Fabricación</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: 2024 / Nuevo"
                                            value={specsObj.equipment_year || ''}
                                            onChange={(e) => setProductForm(prev => ({
                                                ...prev,
                                                technical_specs: { ...(prev.technical_specs || {}), equipment_year: e.target.value }
                                            }))}
                                            className="h-7 w-full bg-white border border-slate-300 rounded px-2 text-[11px] font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-black block mb-0.5">Serie / Modelo / VIN</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: CAT0320..."
                                            value={specsObj.equipment_vin || ''}
                                            onChange={(e) => setProductForm(prev => ({
                                                ...prev,
                                                technical_specs: { ...(prev.technical_specs || {}), equipment_vin: e.target.value }
                                            }))}
                                            className="h-7 w-full bg-white border border-slate-300 rounded px-2 text-[11px] font-mono font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={handleLoadSampleSpecs}
                                        className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[10px] font-black text-amber-900 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        <span>Plantilla Maquinaria</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddSpecRow}
                                        className="px-2 py-1 bg-slate-900 hover:bg-black text-white rounded text-[10px] font-black flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3" />
                                        <span>Añadir Especificación</span>
                                    </button>
                                </div>

                                {specsList.length > 0 && (
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                        {specsList.map((spec, idx) => (
                                            <div key={idx} className="p-1.5 bg-white rounded border border-slate-300 space-y-1">
                                                <div className="flex gap-1 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Categoría (Motor, Dimensiones...)"
                                                        value={spec.category || ''}
                                                        onChange={(e) => handleUpdateSpecRow(idx, 'category', e.target.value)}
                                                        className="h-6 flex-1 bg-slate-50 border border-slate-200 rounded px-1.5 text-[10px] font-black uppercase"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSpecRow(idx)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-12 gap-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Parámetro"
                                                        value={spec.name || ''}
                                                        onChange={(e) => handleUpdateSpecRow(idx, 'name', e.target.value)}
                                                        className="col-span-5 h-6 bg-white border border-slate-300 rounded px-1.5 text-[10px] font-bold"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Valor"
                                                        value={spec.value || ''}
                                                        onChange={(e) => handleUpdateSpecRow(idx, 'value', e.target.value)}
                                                        className="col-span-7 h-6 bg-white border border-slate-300 rounded px-1.5 text-[10px]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl border-2 border-slate-400 bg-white hover:bg-slate-100 text-xs font-black text-black cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingProduct}
                            className="h-10 px-5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSavingProduct ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Guardar Producto')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

