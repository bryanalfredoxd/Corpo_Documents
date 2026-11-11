import React from 'react';
import { router } from '@inertiajs/react';
import {
    Building2,
    Users2,
    Plus,
    Info,
    Check,
    CheckCircle2,
    Mail,
    Phone,
    MapPin,
    Edit3,
    Receipt,
    User,
    Archive
} from 'lucide-react';
import { sprintfCorrelative, sprintfControl, getEmptyInvoice } from '../../Utils/invoiceConstants';
import { useFeedback } from '../../Contexts/FeedbackContext';

export default function DirectoryView({
    companies = [],
    clients = [],
    searchQuery = '',
    directorySection = 'empresas-emisoras',
    setDirectorySection,
    directoryType = 'todos',
    setDirectoryType,
    activeCompany,
    setSelectedCompanyId,
    setInvoiceForm,
    setCurrentView,
    onOpenCreateCompany,
    onOpenEditCompany,
    onOpenCreateClient,
    onOpenEditClient
}) {
    const { confirm, notify } = useFeedback();

    const handleArchiveCompany = async (comp) => {
        const ok = await confirm({
            title: 'Archivar Empresa Emisora',
            message: `¿Deseas archivar "${comp.name}" del directorio?\n\nTodas sus facturas y documentos históricos se conservarán intactos en el Libro de Ventas.`,
            confirmLabel: 'Archivar Empresa',
            variant: 'danger',
        });
        if (!ok) return;

        router.delete(`/companies/${comp.id}`, {
            preserveScroll: true,
            onSuccess: () => notify.info(`Empresa "${comp.name}" archivada correctamente.`),
            onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo archivar la empresa.'),
        });
    };

    const handleArchiveClient = async (client) => {
        const ok = await confirm({
            title: 'Archivar Cliente',
            message: `¿Deseas archivar al cliente "${client.name}"?\n\nSus facturas históricas se conservarán intactas.`,
            confirmLabel: 'Archivar Cliente',
            variant: 'danger',
        });
        if (!ok) return;

        router.delete(`/clients/${client.id}`, {
            preserveScroll: true,
            onSuccess: () => notify.info(`Cliente "${client.name}" archivado correctamente.`),
            onError: (err) => notify.error(Object.values(err).join(', ') || 'No se pudo archivar el cliente.'),
        });
    };
    // Filtrar empresas emisoras
    const filteredCompanies = companies.filter(comp => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (comp.name && comp.name.toLowerCase().includes(q)) ||
            (comp.trade_name && comp.trade_name.toLowerCase().includes(q)) ||
            (comp.tax_id && comp.tax_id.toLowerCase().includes(q)) ||
            (comp.email && comp.email.toLowerCase().includes(q)) ||
            (comp.phone && comp.phone.toLowerCase().includes(q)) ||
            (comp.address && comp.address.toLowerCase().includes(q))
        );
    });

    // Filtrar clientes receptores
    const filteredClients = clients.filter(c => {
        const matchesSearch = searchQuery === '' ||
            (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.tax_id && c.tax_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;
        if (directoryType === 'empresas') return c.type === 'empresa';
        if (directoryType === 'personas') return c.type === 'persona';
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Barra de Navegación del Directorio: Separación entre Empresas Emisoras y Clientes */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border-2 border-slate-300 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
                    {/* Botón Pestaña 1: Empresas Emisoras */}
                    <button
                        type="button"
                        onClick={() => setDirectorySection('empresas-emisoras')}
                        className={`h-9 px-2.5 sm:px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                            directorySection === 'empresas-emisoras'
                                ? 'bg-blue-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
                        }`}
                    >
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">🏢 Emisoras ({companies.length})</span>
                    </button>

                    {/* Botón Pestaña 2: Clientes Receptores */}
                    <button
                        type="button"
                        onClick={() => setDirectorySection('clientes')}
                        className={`h-9 px-2.5 sm:px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                            directorySection === 'clientes'
                                ? 'bg-blue-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
                        }`}
                    >
                        <Users2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">👥 Clientes ({clients.length})</span>
                    </button>
                </div>

                {/* Acciones y Subfiltros contextuales */}
                {directorySection === 'empresas-emisoras' ? (
                    <button
                        type="button"
                        onClick={onOpenCreateCompany}
                        className="h-9 w-full lg:w-auto bg-black hover:bg-slate-800 text-white text-xs font-black px-4 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>+ Registrar Nueva Empresa Emisora</span>
                    </button>
                ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                        <div className="grid grid-cols-3 bg-slate-200 p-1 rounded-lg border-2 border-slate-300 text-xs w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setDirectoryType('todos')}
                                className={`h-8 px-2 rounded-md font-black text-center transition-all cursor-pointer truncate ${
                                    directoryType === 'todos' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-300'
                                }`}
                            >
                                Todos ({clients.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setDirectoryType('empresas')}
                                className={`h-8 px-2 rounded-md font-black text-center transition-all cursor-pointer truncate ${
                                    directoryType === 'empresas' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-300'
                                }`}
                            >
                                Empresas ({clients.filter(c => c.type === 'empresa').length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setDirectoryType('personas')}
                                className={`h-8 px-2 rounded-md font-black text-center transition-all cursor-pointer truncate ${
                                    directoryType === 'personas' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-300'
                                }`}
                            >
                                Personas ({clients.filter(c => c.type === 'persona').length})
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onOpenCreateClient}
                            className="h-9 w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white text-xs font-black px-4 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span>+ Registrar Cliente (CNE)</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Banner Informativo Explicativo */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs">
                <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                {directorySection === 'empresas-emisoras' ? (
                    <div>
                        <strong className="text-blue-950 font-black block text-sm">
                            Directorio de Empresas Emisoras Oficiales (Nuestras Compañías Facturadoras)
                        </strong>
                        <p className="text-slate-700 font-medium mt-0.5">
                            Aquí se encuentran registradas las empresas que emiten las facturas, proformas y notas de entrega. Cada empresa cuenta con su propio logotipo oficial, RIF, membrete fiscal, prefijo correlativo (ej. <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200">F-</code> o <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200">PROF-</code>) y control de numeración secuencial.
                        </p>
                    </div>
                ) : (
                    <div>
                        <strong className="text-blue-950 font-black block text-sm">
                            Directorio de Clientes y Adquirentes (Compradores y Receptores)
                        </strong>
                        <p className="text-slate-700 font-medium mt-0.5">
                            Registro de personas naturales y jurídicas a quienes les vendemos y emitimos documentos fiscales. Puedes registrar nuevos clientes rápidamente con validación y autocompletado oficial mediante CNE / SENIAT.
                        </p>
                    </div>
                )}
            </div>

            {/* PESTAÑA: EMPRESAS EMISORAS */}
            {directorySection === 'empresas-emisoras' && (
                <div>
                    {filteredCompanies.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-slate-300 p-12 text-center space-y-3">
                            <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
                            <h4 className="text-sm font-black text-slate-900 uppercase">No se encontraron empresas emisoras</h4>
                            <p className="text-xs text-slate-600 max-w-md mx-auto">
                                {searchQuery ? `No hay empresas que coincidan con "${searchQuery}".` : 'No hay empresas emisoras registradas aún.'}
                            </p>
                            <button
                                type="button"
                                onClick={onOpenCreateCompany}
                                className="inline-flex items-center gap-2 h-9 px-4 bg-black text-white text-xs font-black rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                <Plus className="w-4 h-4 text-emerald-400" />
                                <span>Registrar Primera Empresa Emisora</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredCompanies.map((comp) => {
                                const isCurrentActive = comp.id === activeCompany.id;
                                return (
                                    <div
                                        key={comp.id}
                                        className={`bg-white rounded-2xl border-2 shadow-xs p-5 flex flex-col justify-between transition-all ${
                                            isCurrentActive ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        <div>
                                            {/* Cabecera de la Tarjeta */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center space-x-3 min-w-0">
                                                    {comp.logo_url ? (
                                                        <div className="h-12 w-12 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-xs">
                                                            <img
                                                                src={comp.logo_url}
                                                                alt={comp.name}
                                                                className="max-h-10 max-w-full object-contain"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                                                            {comp.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[10px] font-black uppercase text-blue-900 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded">
                                                                Empresa Emisora
                                                            </span>
                                                            {isCurrentActive && (
                                                                <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-100 border border-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                    <Check className="w-2.5 h-2.5" />
                                                                    Activa
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-sm font-black text-black leading-tight mt-1 truncate" title={comp.name}>
                                                            {comp.name}
                                                        </h3>
                                                        {comp.trade_name && (
                                                            <p className="text-[11px] font-bold text-slate-600 truncate">{comp.trade_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIF */}
                                            <div className="mt-4 flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200 font-mono text-xs">
                                                <span className="text-slate-700 font-black text-xs">RIF FISCAL:</span>
                                                <strong className="text-black text-sm font-black">{comp.tax_id}</strong>
                                            </div>

                                            {/* Contactos */}
                                            <div className="mt-3.5 space-y-1.5 text-xs font-bold text-black">
                                                {comp.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                                        <span className="truncate text-slate-800">{comp.email}</span>
                                                    </div>
                                                )}
                                                {comp.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                                        <span className="text-slate-800">{comp.phone}</span>
                                                    </div>
                                                )}
                                                {comp.address && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                                                        <span className="text-slate-800 line-clamp-2">{comp.address}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Secuencias y Correlativos Independientes */}
                                            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-2 font-mono">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-slate-600 block text-[10px] font-sans font-bold">Próx. Factura:</span>
                                                        <strong className="text-blue-900 font-black">
                                                            {sprintfCorrelative(comp.invoice_prefix || 'F-', comp.next_correlative || 1)}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600 block text-[10px] font-sans font-bold">Control Fiscal:</span>
                                                        <strong className="text-slate-900 font-black">
                                                            {sprintfControl(0, comp.next_control_number || 1)}
                                                        </strong>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-200 text-[10px]">
                                                    <div className="truncate">
                                                        <span className="text-slate-500 font-sans block text-[9px]">Proforma</span>
                                                        <strong className="text-amber-900">{comp.proforma_prefix || 'PROF-'}{comp.next_proforma_correlative || 1}</strong>
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="text-slate-500 font-sans block text-[9px]">Cotiz.</span>
                                                        <strong className="text-purple-900">{comp.quote_prefix || 'COT-'}{comp.next_quote_correlative || 1}</strong>
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="text-slate-500 font-sans block text-[9px]">Nota Ent.</span>
                                                        <strong className="text-emerald-900">{comp.delivery_note_prefix || 'NE-'}{comp.next_delivery_note_correlative || 1}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                {!isCurrentActive ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCompanyId(comp.id);
                                                            setInvoiceForm(prev => ({ ...prev, company_id: comp.id }));
                                                        }}
                                                        className="h-8 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-black text-xs font-black cursor-pointer transition-colors"
                                                    >
                                                        Seleccionar
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Activa
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenEditCompany(comp)}
                                                    className="h-8 px-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                    title="Editar datos de esta empresa"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                                                    <span>Editar</span>
                                                </button>
                                                {companies.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleArchiveCompany(comp)}
                                                        className="h-8 px-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                        title="Archivar empresa sin perder su historial de facturas"
                                                    >
                                                        <Archive className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCompanyId(comp.id);
                                                    setInvoiceForm(getEmptyInvoice(comp, companies));
                                                    setCurrentView('generador-pdf');
                                                }}
                                                className="h-8 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-2xs"
                                            >
                                                <Receipt className="w-3.5 h-3.5 text-sky-200" />
                                                <span>Emitir Factura</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* PESTAÑA: CLIENTES RECEPTORES */}
            {directorySection === 'clientes' && (
                <div>
                    {filteredClients.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-slate-300 p-12 text-center space-y-3">
                            <Users2 className="w-12 h-12 text-slate-400 mx-auto" />
                            <h4 className="text-sm font-black text-slate-900 uppercase">No se encontraron clientes</h4>
                            <p className="text-xs text-slate-600 max-w-md mx-auto">
                                {searchQuery ? `No hay clientes que coincidan con "${searchQuery}".` : 'No hay clientes registrados en esta categoría.'}
                            </p>
                            <button
                                type="button"
                                onClick={onOpenCreateClient}
                                className="inline-flex items-center gap-2 h-9 px-4 bg-blue-700 text-white text-xs font-black rounded-lg hover:bg-blue-800 cursor-pointer"
                            >
                                <Plus className="w-4 h-4 text-white" />
                                <span>Registrar Primer Cliente</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs p-5 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all"
                                >
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-3 rounded-xl border ${
                                                    client.type === 'empresa'
                                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                }`}>
                                                    {client.type === 'empresa' ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <span className="text-[11px] font-black uppercase text-slate-600 block">
                                                        {client.type === 'empresa' ? 'Cliente Jurídico' : 'Cliente Natural'}
                                                    </span>
                                                    <h3 className="text-sm font-black text-black leading-tight mt-0.5">
                                                        {client.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200 font-mono text-xs">
                                            <span className="text-slate-700 font-black text-xs">CÉDULA / RIF:</span>
                                            <strong className="text-black text-sm font-black">{client.tax_id}</strong>
                                        </div>

                                        <div className="mt-4 space-y-2 text-xs font-bold text-black">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                                <span className="truncate">{client.email || 'Sin correo registrado'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                                <span>{client.phone}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                                                <span className="text-slate-800">{client.address || 'Sin dirección fiscal'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onOpenEditClient(client)}
                                                className="h-8 px-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                title="Editar datos del cliente"
                                            >
                                                <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                                                <span>Editar</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleArchiveClient(client)}
                                                className="h-8 px-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                title="Archivar cliente sin perder historial de facturas"
                                            >
                                                <Archive className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[110px]" title={client.notes || 'Cliente Registrado'}>
                                                {client.notes || 'Cliente Registrado'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInvoiceForm({
                                                    ...getEmptyInvoice(activeCompany, companies),
                                                    client_id: client.id,
                                                });
                                                setCurrentView('generador-pdf');
                                            }}
                                            className="h-8 px-3.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-2xs shrink-0"
                                        >
                                            <Receipt className="w-4 h-4 text-sky-200" />
                                            <span>Facturar</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

