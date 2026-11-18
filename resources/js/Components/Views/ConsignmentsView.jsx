import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Boxes,
    Search,
    Users,
    DollarSign,
    Tag,
    ShoppingCart,
    Truck,
    RotateCcw,
    History,
    CheckCircle2,
    X,
    FileText,
    AlertCircle,
    Calendar,
    ArrowRight,
    Layers,
    Plus,
    User,
    Package
} from 'lucide-react';
import { useFeedback } from '../../Contexts/FeedbackContext';

export default function ConsignmentsView({
    consignments = [],
    consignmentStats = {},
    clients = [],
    onNewConsignmentDelivery
}) {
    const { notify, confirm } = useFeedback();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('activas'); // 'activas', 'todas', 'liquidadas', 'devueltas'
    const [selectedClientId, setSelectedClientId] = useState('all');

    // Modales de acción
    const [activeModal, setActiveModal] = useState(null); // 'sell', 'restock', 'return', 'history'
    const [selectedConsignment, setSelectedConsignment] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulario de Venta
    const [sellForm, setSellForm] = useState({
        quantity: 1,
        unit_price: 0,
        issue_invoice: true,
        payment_method: 'PAGO MOVIL',
        payment_reference: '',
        notes: ''
    });

    // Formulario de Reposición
    const [restockForm, setRestockForm] = useState({
        quantity: 1,
        create_delivery_note: true,
        notes: ''
    });

    // Formulario de Devolución
    const [returnForm, setReturnForm] = useState({
        quantity: 1,
        notes: ''
    });

    // Abrir Modal de Venta
    const handleOpenSellModal = (consignment) => {
        setSelectedConsignment(consignment);
        setSellForm({
            quantity: 1,
            unit_price: Number(consignment.unit_price || 0),
            issue_invoice: true,
            payment_method: 'PAGO MOVIL',
            payment_reference: '',
            notes: ''
        });
        setActiveModal('sell');
    };

    // Abrir Modal de Reposición
    const handleOpenRestockModal = (consignment) => {
        setSelectedConsignment(consignment);
        setRestockForm({
            quantity: 1,
            create_delivery_note: true,
            notes: ''
        });
        setActiveModal('restock');
    };

    // Abrir Modal de Devolución
    const handleOpenReturnModal = (consignment) => {
        setSelectedConsignment(consignment);
        setReturnForm({
            quantity: 1,
            notes: ''
        });
        setActiveModal('return');
    };

    // Abrir Modal de Historial
    const handleOpenHistoryModal = (consignment) => {
        setSelectedConsignment(consignment);
        setActiveModal('history');
    };

    // Cerrar cualquier modal
    const handleCloseModal = () => {
        setActiveModal(null);
        setSelectedConsignment(null);
        setIsSubmitting(false);
    };

    // Procesar Venta / Liquidación
    const handleSubmitSell = (e) => {
        e.preventDefault();
        if (!selectedConsignment) return;

        setIsSubmitting(true);
        router.post(`/consignments/${selectedConsignment.id}/sell`, sellForm, {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
                notify.success('Venta de consignación procesada exitosamente.');
            },
            onError: (err) => {
                setIsSubmitting(false);
                notify.error(Object.values(err).join(', ') || 'Error al procesar la venta.');
            }
        });
    };

    // Procesar Reposición
    const handleSubmitRestock = (e) => {
        e.preventDefault();
        if (!selectedConsignment) return;

        setIsSubmitting(true);
        router.post(`/consignments/${selectedConsignment.id}/restock`, restockForm, {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
                notify.success('Reposición registrada exitosamente.');
            },
            onError: (err) => {
                setIsSubmitting(false);
                notify.error(Object.values(err).join(', ') || 'Error al registrar la reposición.');
            }
        });
    };

    // Procesar Devolución
    const handleSubmitReturn = (e) => {
        e.preventDefault();
        if (!selectedConsignment) return;

        setIsSubmitting(true);
        router.post(`/consignments/${selectedConsignment.id}/return`, returnForm, {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
                notify.success('Devolución reintegrada al almacén central.');
            },
            onError: (err) => {
                setIsSubmitting(false);
                notify.error(Object.values(err).join(', ') || 'Error al registrar la devolución.');
            }
        });
    };

    // Filtrar consignaciones
    const filteredConsignments = consignments.filter(c => {
        // Filtro por cliente
        if (selectedClientId !== 'all' && String(c.client_id) !== String(selectedClientId)) {
            return false;
        }

        // Filtro por estado
        const qty = Number(c.current_quantity || 0);
        if (statusFilter === 'activas' && (c.status === 'devuelta' || (c.status === 'liquidada_total' && qty === 0))) {
            return false;
        }
        if (statusFilter === 'liquidadas' && c.status !== 'liquidada_total') {
            return false;
        }
        if (statusFilter === 'devueltas' && c.status !== 'devuelta') {
            return false;
        }

        // Búsqueda por texto
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const desc = (c.description || '').toLowerCase();
            const clientName = (c.client?.name || '').toLowerCase();
            const clientRif = (c.client?.tax_id || '').toLowerCase();
            const clientCat = (c.client?.category || '').toLowerCase();
            return desc.includes(q) || clientName.includes(q) || clientRif.includes(q) || clientCat.includes(q);
        }

        return true;
    });

    // Agrupar consignaciones filtradas por cliente
    const consignmentsByClient = filteredConsignments.reduce((acc, c) => {
        const cId = c.client_id;
        if (!acc[cId]) {
            acc[cId] = {
                client: c.client,
                items: [],
                totalUnits: 0,
                totalBaseValue: 0,
            };
        }
        acc[cId].items.push(c);
        acc[cId].totalUnits += Number(c.current_quantity || 0);
        acc[cId].totalBaseValue += Number(c.current_quantity || 0) * Number(c.unit_price || 0);
        return acc;
    }, {});

    const clientGroups = Object.values(consignmentsByClient);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* 1. MÉTRICAS GERENCIALES DE CONSIGNACIÓN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-slate-300 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                            Equipos en Custodia
                        </span>
                        <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 mt-0.5 block">
                            {Number(consignmentStats.total_items_in_custody || 0)} unid
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                            En vitrinas / tiendas aliadas
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                        <Boxes className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-slate-300 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                            Clientes con Consignación
                        </span>
                        <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 mt-0.5 block">
                            {Number(consignmentStats.active_clients_count || 0)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                            Aliados / Distribuidores activos
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-slate-300 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                            Valor Base en Custodia
                        </span>
                        <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 mt-0.5 block">
                            ${Number(consignmentStats.total_base_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                            Costo / Precio base entregado
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-slate-300 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                            Valor PVP Sugerido Total
                        </span>
                        <span className="text-xl sm:text-2xl font-mono font-black text-red-600 mt-0.5 block">
                            ${Number(consignmentStats.total_suggested_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                            Proyección de venta al público
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* 2. BARRA DE CONTROL, FILTROS Y ACCIÓN RÁPIDA */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-slate-300 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
                            <Boxes className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                                Control de Mercancía en Consignación y Custodia
                            </h2>
                            <p className="text-[11px] font-bold text-slate-600">
                                Administra máquinas entregadas a clientes, liquida ventas con factura y repón inventario sin duplicar cuentas.
                            </p>
                        </div>
                    </div>

                    {onNewConsignmentDelivery && (
                        <button
                            type="button"
                            onClick={onNewConsignmentDelivery}
                            className="h-9 px-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
                            title="Crear una nueva Nota de Entrega a Consignación"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ Nueva Entrega a Consignación</span>
                        </button>
                    )}
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 border-t border-slate-200">
                    <div className="sm:col-span-5 relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por producto, cliente, RIF o categoría..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                    </div>

                    <div className="sm:col-span-4">
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="h-9 w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        >
                            <option value="all">Todos los Clientes ({clients.length})</option>
                            {clients.map(cl => (
                                <option key={cl.id} value={cl.id}>
                                    {cl.name} ({cl.tax_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-300 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('activas')}
                            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-black cursor-pointer text-center transition-colors ${statusFilter === 'activas' ? 'bg-purple-700 text-white shadow-2xs' : 'text-slate-700 hover:text-black'
                                }`}
                        >
                            Activas
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('todas')}
                            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-black cursor-pointer text-center transition-colors ${statusFilter === 'todas' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-700 hover:text-black'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('liquidadas')}
                            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-black cursor-pointer text-center transition-colors ${statusFilter === 'liquidadas' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-700 hover:text-black'
                                }`}
                        >
                            Vendidas
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. LISTADO DE CLIENTES Y SUS MÁQUINAS EN CUSTODIA */}
            {clientGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto">
                        <Boxes className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 uppercase">
                        No hay mercancía en consignación registrada
                    </h3>
                    <p className="text-xs font-medium text-slate-600 max-w-md mx-auto">
                        Cuando emitas una <strong>Nota de Entrega</strong> con la condición <strong>"Consignación"</strong>, los equipos aparecerán aquí automáticamente para que puedas controlar las ventas, reposiciones y devoluciones de cada cliente.
                    </p>
                    {onNewConsignmentDelivery && (
                        <button
                            type="button"
                            onClick={onNewConsignmentDelivery}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Crear Primera Nota de Consignación</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {clientGroups.map(({ client, items, totalUnits, totalBaseValue }) => (
                        <div
                            key={client?.id || 'sin-cliente'}
                            className="bg-white rounded-xl border-2 border-slate-300 shadow-2xs overflow-hidden"
                        >
                            {/* Cabecera del Cliente */}
                            <div className="p-3.5 sm:p-4 bg-slate-50 border-b-2 border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-black text-slate-900 uppercase">
                                                {client?.name || 'Cliente Desconocido'}
                                            </h3>
                                            <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                                                {client?.tax_id || 'S/R'}
                                            </span>
                                            {client?.category && (
                                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded">
                                                    {client.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-2 flex-wrap">
                                            {client?.phone && <span>Tel: {client.phone}</span>}
                                            {client?.address && <span>• Dir: {client.address}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Total en Custodia</span>
                                        <span className="text-sm sm:text-base font-mono font-black text-purple-900 block">
                                            {totalUnits} unidades (${totalBaseValue.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                                        </span>
                                    </div>
                                    {client?.id && (
                                        <a
                                            href={`/consignments/clients/${client.id}/statement-pdf`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-8.5 px-3 rounded-lg border-2 border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50 text-purple-900 text-xs font-black flex items-center gap-1.5 transition-colors shadow-2xs"
                                            title="Descargar Acta de Arqueo y Conciliación de Consignación en PDF"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-purple-700" />
                                            <span>Acta PDF</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Productos Consignados a este cliente */}
                            <div className="divide-y divide-slate-200">
                                {items.map((consignment) => {
                                    const qty = Number(consignment.current_quantity || 0);
                                    const isLiquidated = consignment.status === 'liquidada_total' || qty === 0;

                                    return (
                                        <div
                                            key={consignment.id}
                                            className={`p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 transition-colors ${isLiquidated ? 'bg-slate-50/60 opacity-80' : 'hover:bg-purple-50/20'
                                                }`}
                                        >
                                            {/* Info del Producto */}
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                {consignment.product?.image_url ? (
                                                    <div className="w-12 h-12 rounded-lg border border-slate-300 bg-white p-0.5 flex items-center justify-center shrink-0">
                                                        <img
                                                            src={consignment.product.image_url}
                                                            alt=""
                                                            className="max-h-full max-w-full object-contain rounded"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                                        <Package className="w-6 h-6" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                                                            {consignment.description}
                                                        </h4>
                                                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${qty > 0
                                                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                                                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                                            }`}>
                                                            {qty > 0 ? `En Custodia: ${qty} ${consignment.unit}` : 'Liquidada / Vendida'}
                                                        </span>
                                                        {consignment.initialDeliveryInvoice && (
                                                            <span className="text-[10px] font-mono font-bold text-slate-500">
                                                                Nota: {consignment.initialDeliveryInvoice.correlative_number}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Precios: Base y PVP Sugerido */}
                                                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Precio Base:</span>
                                                            <span className="font-mono font-black text-slate-900">
                                                                ${Number(consignment.unit_price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        {consignment.suggested_price && Number(consignment.suggested_price) > 0 && (
                                                            <div className="flex items-baseline gap-1 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                                                <span className="text-[10px] font-bold text-red-700 uppercase">PVP Sugerido:</span>
                                                                <span className="font-mono font-black text-red-600">
                                                                    ${Number(consignment.suggested_price).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {consignment.notes && (
                                                        <p className="text-[11px] text-slate-500 italic mt-1">
                                                            {consignment.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Saldo y Botones de Acción */}
                                            <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto shrink-0">
                                                {qty > 0 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenSellModal(consignment)}
                                                            className="h-8 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                                                            title="Reportar que el cliente vendió una máquina y emitir la Factura Fiscal para cobrarla"
                                                        >
                                                            <ShoppingCart className="w-3.5 h-3.5" />
                                                            <span>Facturar Venta</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenRestockModal(consignment)}
                                                            className="h-8 px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                                                            title="Entregar una máquina nueva para reponer la vendida y mantener el saldo en tienda"
                                                        >
                                                            <Truck className="w-3.5 h-3.5" />
                                                            <span>Reponer</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReturnModal(consignment)}
                                                            className="h-8 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                                            title="Registrar devolución de equipo al almacén central"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                            <span>Devolución</span>
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenHistoryModal(consignment)}
                                                    className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                                    title="Ver historial de movimientos y documentos de esta consignación"
                                                >
                                                    <History className="w-3.5 h-3.5 text-slate-600" />
                                                    <span>Historial ({consignment.movements?.length || 0})</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL 1: FACTURAR VENTA DE CONSIGNACIÓN */}
            {activeModal === 'sell' && selectedConsignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
                    <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-black uppercase leading-tight">
                                        Facturar Venta de Consignación
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-600">
                                        Descarga la máquina vendida de la custodia del cliente y genera su Factura Fiscal.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Resumen del Producto y Cliente */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-500">Cliente:</span>
                                <strong className="text-slate-900 uppercase">{selectedConsignment.client?.name}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-500">Producto:</span>
                                <strong className="text-slate-900">{selectedConsignment.description}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-500">Saldo actual en custodia:</span>
                                <strong className="font-mono text-purple-900 bg-purple-100 px-1.5 rounded">
                                    {selectedConsignment.current_quantity} {selectedConsignment.unit}
                                </strong>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitSell} className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        Cantidad Vendida *
                                    </label>
                                    <div className="flex items-center border-2 border-slate-300 rounded-lg bg-white overflow-hidden h-9">
                                        <button
                                            type="button"
                                            onClick={() => setSellForm(prev => ({ ...prev, quantity: Math.max(1, Number(prev.quantity || 1) - 1) }))}
                                            className="px-2.5 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={Number(selectedConsignment.current_quantity)}
                                            required
                                            value={sellForm.quantity}
                                            onChange={(e) => setSellForm(prev => ({ ...prev, quantity: e.target.value }))}
                                            className="w-full text-center font-mono font-black text-xs py-1 border-0 focus:ring-0 p-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSellForm(prev => ({ ...prev, quantity: Math.min(Number(selectedConsignment.current_quantity), Number(prev.quantity || 0) + 1) }))}
                                            className="px-2.5 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">
                                        Máximo: {selectedConsignment.current_quantity} {selectedConsignment.unit}
                                    </span>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        Precio Unitario a Cobrar ($) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={sellForm.unit_price}
                                            onChange={(e) => setSellForm(prev => ({ ...prev, unit_price: e.target.value }))}
                                            className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg pl-6 pr-2.5 text-right font-mono font-black text-xs text-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                        />
                                    </div>
                                    {selectedConsignment.suggested_price && (
                                        <button
                                            type="button"
                                            onClick={() => setSellForm(prev => ({ ...prev, unit_price: Number(selectedConsignment.suggested_price) }))}
                                            className="text-[9px] font-bold text-red-600 underline cursor-pointer mt-0.5 block"
                                        >
                                            Usar PVP sugerido (${Number(selectedConsignment.suggested_price).toFixed(2)})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Total Liquidación */}
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-emerald-950 font-black block">Total Venta a Facturar:</span>
                                    <span className="text-[10px] text-emerald-800">Incluye IVA 16% fiscal automático</span>
                                </div>
                                <span className="font-mono font-black text-base text-emerald-700">
                                    ${((Number(sellForm.quantity || 0) * Number(sellForm.unit_price || 0)) * 1.16).toFixed(2)} USD
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        Medio de Pago Acordado
                                    </label>
                                    <select
                                        value={sellForm.payment_method}
                                        onChange={(e) => setSellForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                        className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-2 text-xs font-bold text-black"
                                    >
                                        <option value="PAGO MOVIL">PAGO MOVIL</option>
                                        <option value="TRANSFERENCIA BANCARIA">TRANSFERENCIA</option>
                                        <option value="ZELLE">ZELLE</option>
                                        <option value="EFECTIVO (USD)">EFECTIVO (USD)</option>
                                        <option value="DIVISAS">DIVISAS</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        N° Ref / Comprobante (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 1617728..."
                                        value={sellForm.payment_reference}
                                        onChange={(e) => setSellForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                                        className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-2 text-xs font-mono font-bold text-black"
                                    />
                                </div>
                            </div>

                            <label className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                                <input
                                    type="checkbox"
                                    checked={sellForm.issue_invoice}
                                    onChange={(e) => setSellForm(prev => ({ ...prev, issue_invoice: e.target.checked }))}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                                />
                                <span className="text-[11px] font-bold text-slate-700 leading-snug">
                                    Emitir Factura Fiscal oficial al cliente con su correlativo y control (sin descontar inventario del almacén de nuevo, ya que salió con la nota inicial).
                                </span>
                            </label>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="h-9 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{isSubmitting ? 'Procesando...' : '✓ Procesar Venta y Facturar'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: REPONER MERCANCÍA EN CONSIGNACIÓN */}
            {activeModal === 'restock' && selectedConsignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
                    <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-black uppercase leading-tight">
                                        Reponer Mercancía en Consignación
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-600">
                                        Lleva un equipo nuevo a la tienda para reponer la venta y mantener el saldo acordado.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nota explicativa de no acumulación */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-black text-blue-950">
                                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                                <span>Control Inteligente de Saldo:</span>
                            </div>
                            <p className="text-[11px] text-blue-900 leading-snug">
                                Tenía <strong>{selectedConsignment.current_quantity} {selectedConsignment.unit}</strong> en custodia. Al reponer <strong>{restockForm.quantity}</strong>, su nuevo saldo será de <strong>{Number(selectedConsignment.current_quantity) + Number(restockForm.quantity || 0)} {selectedConsignment.unit}</strong>. Se descontará 1 equipo del almacén central para reponer la vitrina del cliente.
                            </p>
                        </div>

                        <form onSubmit={handleSubmitRestock} className="space-y-3.5">
                            <div>
                                <label className="text-xs font-black text-black block mb-1">
                                    Cantidad a Reponer / Entregar *
                                </label>
                                <div className="flex items-center border-2 border-slate-300 rounded-lg bg-white overflow-hidden h-9 w-40">
                                    <button
                                        type="button"
                                        onClick={() => setRestockForm(prev => ({ ...prev, quantity: Math.max(1, Number(prev.quantity || 1) - 1) }))}
                                        className="px-2.5 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={restockForm.quantity}
                                        onChange={(e) => setRestockForm(prev => ({ ...prev, quantity: e.target.value }))}
                                        className="w-full text-center font-mono font-black text-xs py-1 border-0 focus:ring-0 p-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRestockForm(prev => ({ ...prev, quantity: Number(prev.quantity || 0) + 1 }))}
                                        className="px-2.5 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs">
                                <input
                                    type="checkbox"
                                    checked={restockForm.create_delivery_note}
                                    onChange={(e) => setRestockForm(prev => ({ ...prev, create_delivery_note: e.target.checked }))}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                                />
                                <span className="text-[11px] font-bold text-slate-700 leading-snug">
                                    Generar comprobante oficial de <strong>Nota de Entrega de Reposición (PDF)</strong> para que el cliente lo firme al recibir el equipo.
                                </span>
                            </label>

                            <div>
                                <label className="text-xs font-black text-black block mb-1">
                                    Observación / Nota interna (Opcional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Reposición por venta previa reportada ayer..."
                                    value={restockForm.notes}
                                    onChange={(e) => setRestockForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="h-9 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-9 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{isSubmitting ? 'Procesando...' : '✓ Registrar Reposición y Despacho'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: DEVOLUCIÓN DE MERCANCÍA AL ALMACÉN */}
            {activeModal === 'return' && selectedConsignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
                    <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                                    <RotateCcw className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-black uppercase leading-tight">
                                        Devolución de Mercancía a Almacén
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-600">
                                        Reintegra el equipo no vendido a tu inventario central y descuéntalo de la custodia del cliente.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReturn} className="space-y-3.5">
                            <div>
                                <label className="text-xs font-black text-black block mb-1">
                                    Cantidad a Devolver *
                                </label>
                                <div className="flex items-center border-2 border-slate-300 rounded-lg bg-white overflow-hidden h-9 w-40">
                                    <button
                                        type="button"
                                        onClick={() => setReturnForm(prev => ({ ...prev, quantity: Math.max(1, Number(prev.quantity || 1) - 1) }))}
                                        className="px-2.5 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={Number(selectedConsignment.current_quantity)}
                                        required
                                        value={returnForm.quantity}
                                        onChange={(e) => setReturnForm(prev => ({ ...prev, quantity: e.target.value }))}
                                        className="w-full text-center font-mono font-black text-xs py-1 border-0 focus:ring-0 p-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setReturnForm(prev => ({ ...prev, quantity: Math.min(Number(selectedConsignment.current_quantity), Number(prev.quantity || 0) + 1) }))}
                                        className="px-2.5 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                    Saldo en poder del cliente: {selectedConsignment.current_quantity} {selectedConsignment.unit}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-black text-black block mb-1">
                                    Motivo de Devolución / Nota (Opcional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Cliente solicitó retirar exhibición / cambio de modelo..."
                                    value={returnForm.notes}
                                    onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="h-9 w-full bg-white border-2 border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="h-9 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-9 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{isSubmitting ? 'Procesando...' : '✓ Reintegrar a Almacén'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: HISTORIAL DE MOVIMIENTOS DE LA CONSIGNACIÓN */}
            {activeModal === 'history' && selectedConsignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
                    <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-xl w-full p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 text-slate-800 rounded-lg">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-black uppercase leading-tight">
                                        Historial de Movimientos de Consignación
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-600">
                                        {selectedConsignment.description} • {selectedConsignment.client?.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="h-8 w-8 rounded-lg hover:bg-slate-200 text-black flex items-center justify-center cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Línea de tiempo */}
                        <div className="space-y-3">
                            {(!selectedConsignment.movements || selectedConsignment.movements.length === 0) ? (
                                <p className="text-xs text-slate-500 text-center py-4">
                                    No hay movimientos registrados para esta consignación.
                                </p>
                            ) : (
                                selectedConsignment.movements.map((mov) => {
                                    const isSale = mov.movement_type === 'venta_facturada';
                                    const isRestock = mov.movement_type === 'reposicion';
                                    const isReturn = mov.movement_type === 'devolucion';
                                    const isInitial = mov.movement_type === 'entrega_inicial';

                                    return (
                                        <div
                                            key={mov.id}
                                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                                        >
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isSale ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                                        isRestock ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                                            isReturn ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                                                'bg-purple-100 text-purple-900 border border-purple-300'
                                                        }`}>
                                                        {isSale ? '🛒 Venta Facturada' :
                                                            isRestock ? '🚚 Reposición' :
                                                                isReturn ? '↩️ Devolución' :
                                                                    '📦 Entrega Inicial'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {mov.created_at ? new Date(mov.created_at).toLocaleString('es-VE') : ''}
                                                    </span>
                                                </div>

                                                <p className="text-slate-800 font-bold text-xs">
                                                    {mov.notes}
                                                </p>

                                                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                                    <span>Saldo previo: <strong>{Number(mov.previous_quantity)}</strong></span>
                                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                                    <span>Nuevo saldo: <strong className="text-purple-900">{Number(mov.new_quantity)} {selectedConsignment.unit}</strong></span>
                                                </div>
                                            </div>

                                            {mov.invoice && (
                                                <div className="text-right shrink-0">
                                                    <a
                                                        href={`/invoices/${mov.invoice.id}/pdf`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] font-mono font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors"
                                                        title="Ver PDF oficial"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        <span>{mov.invoice.correlative_number}</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="h-9 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-black cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

