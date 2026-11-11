import React, { useState } from 'react';
import { Package, Search, X, Plus, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export default function ProductPickerModal({
    isOpen,
    onClose,
    products = [],
    onSelectProduct,
    onOpenCreateProduct
}) {
    const [pickerSearch, setPickerSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const [addedIds, setAddedIds] = useState([]);

    if (!isOpen) return null;

    const categories = ['todos', ...Array.from(new Set(products.map(p => p.category || 'General')))];

    const filteredProducts = products.filter(p => {
        const matchesCat = selectedCategory === 'todos' || (p.category || 'General') === selectedCategory;
        if (!matchesCat) return false;

        if (!pickerSearch.trim()) return true;
        const q = pickerSearch.toLowerCase();
        return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.code && p.code.toLowerCase().includes(q)) ||
            (p.details && p.details.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
        );
    });

    const handlePick = (product) => {
        onSelectProduct(product);
        setAddedIds(prev => [...prev, product.id]);
    };

    const handleCloseModal = () => {
        setPickerSearch('');
        setSelectedCategory('todos');
        setAddedIds([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
            <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-2xl w-full p-4 sm:p-5 space-y-3.5 max-h-[90vh] flex flex-col">
                {/* Cabecera */}
                <div className="flex justify-between items-center border-b-2 border-slate-300 pb-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-700" />
                        <div>
                            <h3 className="text-sm font-black text-black uppercase leading-tight">
                                Seleccionar Productos del Catálogo
                            </h3>
                            <p className="text-[11px] font-bold text-slate-600">
                                Haz clic en "+ Agregar" para incluir uno o varios productos en tu documento.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Buscador y Botón Nuevo */}
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Buscar por nombre, código SKU o descripción..."
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                            className="h-9 w-full bg-slate-50 border-2 border-slate-400 rounded-lg pl-9 pr-3 text-xs font-black text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                        />
                    </div>
                    {onOpenCreateProduct && (
                        <button
                            type="button"
                            onClick={() => {
                                handleCloseModal();
                                onOpenCreateProduct();
                            }}
                            className="h-9 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Producto</span>
                        </button>
                    )}
                </div>

                {/* Pills de Categoría */}
                {categories.length > 2 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer whitespace-nowrap border ${
                                    selectedCategory === cat
                                        ? 'bg-indigo-700 text-white border-indigo-800 shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                }`}
                            >
                                {cat === 'todos' ? `Todos (${products.length})` : cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Listado de Productos */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                    {filteredProducts.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 space-y-2">
                            <Package className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs font-black text-slate-700">
                                {products.length === 0
                                    ? 'Aún no hay productos registrados en el catálogo.'
                                    : 'No se encontraron productos para tu búsqueda.'}
                            </p>
                            {onOpenCreateProduct && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleCloseModal();
                                        onOpenCreateProduct();
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-black cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Registrar Primer Producto</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredProducts.map(prod => {
                            const addedCount = addedIds.filter(id => id === prod.id).length;
                            return (
                                <div
                                    key={prod.id}
                                    className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 transition-all ${
                                        addedCount > 0
                                            ? 'bg-emerald-50/70 border-emerald-400'
                                            : 'bg-white border-slate-300 hover:border-indigo-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {prod.image_url ? (
                                            <div className="w-12 h-12 rounded-lg border border-slate-300 bg-white p-0.5 flex items-center justify-center shrink-0">
                                                <img
                                                    src={prod.image_url}
                                                    alt={prod.name}
                                                    className="max-h-full max-w-full object-contain rounded"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {prod.code && (
                                                    <span className="text-[10px] font-mono font-black bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded">
                                                        {prod.code}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-black bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
                                                    {prod.category || 'General'}
                                                </span>
                                                {prod.is_tax_exempt && (
                                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                                        Exento IVA
                                                    </span>
                                                )}
                                                {prod.track_inventory && (
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                                        Number(prod.stock) <= Number(prod.min_stock)
                                                            ? 'bg-red-100 text-red-900 border-red-300'
                                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    }`}>
                                                        Stock: {Number(prod.stock)}
                                                    </span>
                                                )}
                                                {prod.technical_specs?.specs?.length > 0 && (
                                                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                                        Ficha Técnica
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-black text-black text-xs mt-0.5 truncate">
                                                {prod.name}
                                            </h4>
                                            {prod.details && (
                                                <p className="text-[11px] text-slate-600 truncate">
                                                    {prod.details}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <span className="font-mono font-black text-sm text-black block">
                                                ${Number(prod.unit_price).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500">
                                                /{prod.unit}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handlePick(prod)}
                                            className={`h-8 px-3 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-2xs ${
                                                addedCount > 0
                                                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                                    : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                                            }`}
                                        >
                                            {addedCount > 0 ? (
                                                <>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>+{addedCount} Agregado</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Agregar</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t-2 border-slate-200 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-slate-700">
                        {addedIds.length > 0
                            ? `✓ ${addedIds.length} producto(s) añadido(s) a los renglones`
                            : 'Haz clic en "+ Agregar" sobre los productos que deseas facturar'}
                    </span>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="h-9 px-5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black cursor-pointer"
                    >
                        Listo / Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

