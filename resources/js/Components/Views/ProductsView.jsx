import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Package,
    Plus,
    Edit3,
    Trash2,
    FilePlus2,
    Image as ImageIcon,
    Tag,
    Boxes,
    AlertTriangle,
    Layers,
    TrendingUp
} from 'lucide-react';
import { useFeedback } from '../../Contexts/FeedbackContext';

export default function ProductsView({
    products = [],
    searchQuery = '',
    onOpenCreateProduct,
    onOpenEditProduct,
    onInvoiceWithProduct
}) {
    const { confirm, notify } = useFeedback();
    const [selectedCategory, setSelectedCategory] = useState('todos');

    const categories = ['todos', ...Array.from(new Set(products.map(p => p.category || 'General')))];

    const filteredProducts = products.filter(p => {
        const matchesCat = selectedCategory === 'todos' || (p.category || 'General') === selectedCategory;
        if (!matchesCat) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.code && p.code.toLowerCase().includes(q)) ||
            (p.details && p.details.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
        );
    });

    const handleDeleteProduct = async (product) => {
        const ok = await confirm({
            title: 'Eliminar Producto del Catálogo',
            message: `¿Deseas eliminar "${product.name}" del catálogo? Las facturas existentes que lo incluyen conservarán su historial.`,
            confirmLabel: 'Eliminar Producto',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(`/products/${product.id}`, {
            preserveScroll: true,
            onSuccess: () => notify.success('Producto eliminado del catálogo.'),
            onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo eliminar el producto.'),
        });
    };

    return (
        <div className="space-y-4">
            {/* Barra de Acciones y Filtros de Categoría */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border-2 border-slate-300 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-black text-black leading-tight">
                            Catálogo de Productos & Servicios ({products.length})
                        </h2>
                        <p className="text-[11px] font-bold text-slate-600">
                            Registra productos una sola vez y añádelos con un clic a cualquier Factura, Proforma o Cotización.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`h-8 px-3 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
                                    selectedCategory === cat
                                        ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                }`}
                            >
                                {cat === 'todos' ? 'Todos' : cat}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onOpenCreateProduct}
                        className="h-9 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Producto</span>
                    </button>
                </div>
            </div>

            {/* Grid de Productos */}
            {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-10 text-center space-y-3 shadow-xs">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto">
                        <Package className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-black">
                            {products.length === 0
                                ? 'Tu catálogo de productos está vacío'
                                : 'No hay productos que coincidan con tu búsqueda'}
                        </h3>
                        <p className="text-xs font-medium text-slate-600 max-w-md mx-auto">
                            {products.length === 0
                                ? 'Registra tus productos frecuentes con su descripción, precio, unidad e imagen opcional para facturar mucho más rápido.'
                                : 'Intenta cambiar el término de búsqueda o selecciona otra categoría.'}
                        </p>
                    </div>
                    {products.length === 0 && (
                        <button
                            type="button"
                            onClick={onOpenCreateProduct}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Registrar Primer Producto</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(prod => (
                        <div
                            key={prod.id}
                            className="bg-white rounded-xl border-2 border-slate-300 hover:border-indigo-500 p-4 flex flex-col justify-between gap-3 shadow-xs transition-all"
                        >
                            <div className="space-y-3">
                                {/* Header de Card: Imagen + Info principal */}
                                <div className="flex items-start gap-3">
                                    {prod.image_url ? (
                                        <div className="w-16 h-16 rounded-xl border-2 border-slate-200 bg-white p-1 flex items-center justify-center shrink-0">
                                            <img
                                                src={prod.image_url}
                                                alt={prod.name}
                                                className="max-h-full max-w-full object-contain rounded"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                            {prod.code && (
                                                <span className="text-[10px] font-mono font-black bg-slate-900 text-white px-1.5 py-0.5 rounded">
                                                    {prod.code}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1">
                                                <Tag className="w-2.5 h-2.5" />
                                                {prod.category || 'General'}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-black text-black leading-snug line-clamp-2">
                                            {prod.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Detalles Técnicos */}
                                {prod.details && (
                                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 line-clamp-2">
                                        {prod.details}
                                    </p>
                                )}

                                {/* Stock, Ficha Técnica y Métricas */}
                                {(prod.track_inventory || prod.technical_specs?.specs?.length > 0 || prod.sold_units > 0 || prod.quoted_units > 0) && (
                                    <div className="flex flex-wrap gap-1.5 text-[10px] font-black">
                                        {prod.track_inventory && (
                                            Number(prod.stock) <= Number(prod.min_stock) ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-300">
                                                    <AlertTriangle className="w-3 h-3 text-red-700" />
                                                    Stock Bajo: {Number(prod.stock)} {prod.unit}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                                                    <Boxes className="w-3 h-3 text-emerald-700" />
                                                    Stock: {Number(prod.stock)} {prod.unit}
                                                </span>
                                            )
                                        )}
                                        {prod.technical_specs?.specs?.length > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                                <Layers className="w-3 h-3 text-amber-700" />
                                                Ficha Técnica ({prod.technical_specs.specs.length})
                                            </span>
                                        )}
                                        {(prod.sold_units > 0 || prod.quoted_units > 0) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                                                <TrendingUp className="w-3 h-3 text-blue-700" />
                                                {prod.sold_units > 0 ? `Vendidos: ${prod.sold_units}` : `Cotiz: ${prod.quoted_units}`}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Precio y Unidad */}
                                <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-500 block">
                                            Precio Unitario
                                        </span>
                                        <span className="text-lg font-mono font-black text-emerald-700">
                                            ${Number(prod.unit_price).toFixed(2)}
                                        </span>
                                        <span className="text-xs font-bold text-slate-600 ml-1">
                                            / {prod.unit}
                                        </span>
                                    </div>
                                    {prod.is_tax_exempt ? (
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                                            Exento IVA (E)
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                            Gravable IVA
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => onInvoiceWithProduct(prod)}
                                    className="flex-1 h-8 px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                                    title="Agregar este producto a un documento nuevo / actual"
                                >
                                    <FilePlus2 className="w-3.5 h-3.5" />
                                    <span>Cotizar / Facturar</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onOpenEditProduct(prod)}
                                    className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Editar producto"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prod)}
                                    className="h-8 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Eliminar producto del catálogo"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

