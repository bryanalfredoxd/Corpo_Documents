import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    Building2,
    User,
    FileText,
    Receipt,
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Printer,
    CheckCircle2,
    Clock,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    QrCode,
    Settings,
    Layers,
    Calendar,
    DollarSign,
    SlidersHorizontal,
    MoreVertical,
    Mail,
    Phone,
    MapPin,
    Copy,
    Hash,
    BadgeCheck,
    ChevronDown,
    FileSpreadsheet,
    Check,
    FilePlus2,
    BookOpen,
    Users2,
    Building,
    CreditCard,
    ArrowUpDown,
    AlertCircle,
    Info,
    Trash2,
    Save,
    ZoomIn,
    Type
} from 'lucide-react';

export default function Index() {
    // Vistas principales: 'libro-fiscal' | 'directorio' | 'generador-pdf'
    const [currentView, setCurrentView] = useState('libro-fiscal');
    
    // Filtros de directorio
    const [directoryType, setDirectoryType] = useState('todos'); // todos | empresas | personas
    
    // Búsqueda
    const [searchQuery, setSearchQuery] = useState('');

    // Control de tamaño / zoom para accesibilidad y alta legibilidad (+15%, +25%, +35%, +45%)
    const [zoomLevel, setZoomLevel] = useState('115'); // 100, 115, 125, 135, 145

    useEffect(() => {
        const savedZoom = localStorage.getItem('corpo_zoom_setting');
        if (savedZoom) {
            setZoomLevel(savedZoom);
        }
    }, []);

    const handleZoomChange = (level) => {
        setZoomLevel(level);
        localStorage.setItem('corpo_zoom_setting', level);
    };

    // Datos simulados de la empresa emisora
    const issuerCompany = {
        name: 'CORPO ASIA SYSTEMS, C.A.',
        taxId: 'J-50123998-0',
        fiscalAddress: 'Av. Francisco de Miranda, Torre Empresarial, Piso 12, Ofic. 12-A, Caracas',
        phone: '+58 (212) 999-8888',
        email: 'facturacion@corpoasia.com',
        correlativeCurrent: 'F-003891',
        controlNumber: '00-089123'
    };

    // Datos maestros de empresas y personas registradas (Textos de alto contraste)
    const directoryData = [
        {
            id: 'DIR-01',
            type: 'empresa',
            name: 'Inversiones & Logística Corpo Asia, C.A.',
            tradeName: 'Corpo Asia Logística',
            taxId: 'J-50192834-1',
            email: 'administracion@corpoasia.com',
            phone: '+58 (212) 740-9100',
            address: 'Av. Libertador, Edif. Torre Financiera, Piso 14, Chacao, Miranda',
            taxCategory: 'Contribuyente Especial',
            representative: 'Carlos Eduardo Mendoza',
            invoicesCount: 42,
            totalBilled: '$52,400.00',
            lastInvoiceDate: '04/11/2026'
        },
        {
            id: 'DIR-02',
            type: 'empresa',
            name: 'Distribuidora Agroindustrial El Roble, S.A.',
            tradeName: 'Agro El Roble',
            taxId: 'J-31294819-0',
            email: 'pagos@elrobleagro.com',
            phone: '+58 (241) 823-4411',
            address: 'Zona Industrial Sur II, Parcela 45, Valencia, Carabobo',
            taxCategory: 'Contribuyente Ordinario',
            representative: 'Ing. Roberto Gómez',
            invoicesCount: 16,
            totalBilled: '$19,850.00',
            lastInvoiceDate: '02/11/2026'
        },
        {
            id: 'DIR-03',
            type: 'persona',
            name: 'Dra. Mariana Valenzuela Castro',
            tradeName: 'Servicios Médicos Ocupacionales',
            taxId: 'V-18.904.321',
            email: 'm.valenzuela@asesoriasalud.com',
            phone: '+58 (414) 332-1189',
            address: 'Av. Principal Las Mercedes, Centro Profesional, Ofic. 4-A, Caracas',
            taxCategory: 'Profesional Independiente',
            representative: 'Titular Directo',
            invoicesCount: 9,
            totalBilled: '$8,400.00',
            lastInvoiceDate: '03/11/2026'
        },
        {
            id: 'DIR-04',
            type: 'empresa',
            name: 'Servicios Tecnológicos Soluciones Web, C.A.',
            tradeName: 'Soluciones Web Latam',
            taxId: 'J-41289102-8',
            email: 'contacto@solucionesweb.net',
            phone: '+58 (212) 902-1144',
            address: 'Av. Francisco Solano, Edif. Centro Solano, Piso 5, Sabana Grande',
            taxCategory: 'Contribuyente Ordinario',
            representative: 'Lic. Fernando Rojas',
            invoicesCount: 24,
            totalBilled: '$34,120.00',
            lastInvoiceDate: '01/11/2026'
        },
        {
            id: 'DIR-05',
            type: 'persona',
            name: 'Ing. Alejandro Morales Mendoza',
            tradeName: 'Consultoría Estructural & Obras',
            taxId: 'V-14.892.301',
            email: 'morales.ingenieria@gmail.com',
            phone: '+58 (412) 289-9943',
            address: 'Calle Real de Sabana Grande, Residencias La Floresta, Apto. 8-B',
            taxCategory: 'Honorarios Profesionales',
            representative: 'Titular Directo',
            invoicesCount: 7,
            totalBilled: '$6,200.00',
            lastInvoiceDate: '28/10/2026'
        }
    ];

    // Registro de facturas y documentos emitidos (Alto contraste)
    const invoicesLedger = [
        {
            correlative: 'F-003891',
            controlNumber: '00-089123',
            client: 'Inversiones & Logística Corpo Asia, C.A.',
            taxId: 'J-50192834-1',
            date: '04/11/2026',
            dueDate: '19/11/2026',
            concept: 'Servicios de Auditoría & Consultoría Fiscal Corporativa Q4',
            taxBase: '$3,850.00',
            vat: '$616.00',
            total: '$4,466.00',
            status: 'Emitida',
            currency: 'USD'
        },
        {
            correlative: 'F-003890',
            controlNumber: '00-089122',
            client: 'Dra. Mariana Valenzuela Castro',
            taxId: 'V-18.904.321',
            date: '03/11/2026',
            dueDate: '10/11/2026',
            concept: 'Servicios de Asesoría en Salud y Bioseguridad Laboral',
            taxBase: '$1,200.00',
            vat: '$192.00',
            total: '$1,392.00',
            status: 'Emitida',
            currency: 'USD'
        },
        {
            correlative: 'F-003889',
            controlNumber: '00-089121',
            client: 'Distribuidora Agroindustrial El Roble, S.A.',
            taxId: 'J-31294819-0',
            date: '02/11/2026',
            dueDate: '17/11/2026',
            concept: 'Suministro de Componentes y Licenciamiento Operativo',
            taxBase: '$5,400.00',
            vat: '$864.00',
            total: '$6,264.00',
            status: 'Emitida',
            currency: 'USD'
        },
        {
            correlative: 'F-003888',
            controlNumber: '00-089120',
            client: 'Servicios Tecnológicos Soluciones Web, C.A.',
            taxId: 'J-41289102-8',
            date: '01/11/2026',
            dueDate: '15/11/2026',
            concept: 'Mantenimiento Preventivo Servidores y Red Troncal',
            taxBase: '$2,150.00',
            vat: '$344.00',
            total: '$2,494.00',
            status: 'Emitida',
            currency: 'USD'
        },
        {
            correlative: 'BORR-0041',
            controlNumber: 'Pendiente',
            client: 'Ing. Alejandro Morales Mendoza',
            taxId: 'V-14.892.301',
            date: '04/11/2026',
            dueDate: '18/11/2026',
            concept: 'Cálculo y Elaboración de Planos Estructurales Fase II',
            taxBase: '$1,800.00',
            vat: '$288.00',
            total: '$2,088.00',
            status: 'Borrador',
            currency: 'USD'
        }
    ];

    const filteredDirectory = directoryData.filter(item => {
        if (directoryType === 'empresas') return item.type === 'empresa';
        if (directoryType === 'personas') return item.type === 'persona';
        return true;
    });

    return (
        <div
            className="min-h-screen bg-[#F1F5F9] text-black flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white"
            style={{ zoom: `${zoomLevel}%` }}
        >
            <Head title="Corpo Documents | Sistema de Facturación y Registro" />

            {/* TOP BAR CON ACCESIBILIDAD Y CONTROL DE ZOOM */}
            <div className="bg-white border-b-2 border-slate-300 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-sm">
                
                {/* Logo & Emisor */}
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center text-white shadow-sm">
                        <BookOpen className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black tracking-tight text-black uppercase">
                                Corpo<span className="text-blue-700">Documents</span>
                            </h1>
                            <span className="bg-black text-white text-xs font-mono font-bold px-2 py-0.5 rounded">
                                SISTEMA FISCAL
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                            Emisor: <span className="text-black">{issuerCompany.name}</span> • RIF: <span className="text-black font-mono font-black">{issuerCompany.taxId}</span>
                        </p>
                    </div>
                </div>

                {/* SELECTOR DE TAMAÑO DE LETRA / ZOOM (SUPER VISIBLE PARA EL JEFE) */}
                <div className="flex items-center gap-2 bg-amber-100/80 border-2 border-amber-400 px-3.5 py-1.5 rounded-xl shadow-xs">
                    <div className="flex items-center gap-1.5 text-black font-black text-xs uppercase tracking-tight">
                        <Type className="w-4 h-4 text-amber-900" />
                        <span>Tamaño de Pantalla:</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-amber-300">
                        {[
                            { label: 'Normal', value: '100' },
                            { label: '+15%', value: '115' },
                            { label: '+25%', value: '125' },
                            { label: '+35%', value: '135' },
                            { label: '+45%', value: '145' },
                        ].map((btn) => (
                            <button
                                key={btn.value}
                                onClick={() => handleZoomChange(btn.value)}
                                className={`px-2.5 py-1 rounded text-xs font-black transition-all ${
                                    zoomLevel === btn.value
                                        ? 'bg-black text-white shadow-xs scale-105'
                                        : 'text-black hover:bg-slate-100'
                                }`}
                                title={`Ajustar tamaño a ${btn.label}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Botón de Emisión Principal */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setCurrentView('generador-pdf')}
                        className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-black px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                    >
                        <FilePlus2 className="w-4 h-4" />
                        <span>NUEVA FACTURA / PDF</span>
                    </button>

                    <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>

                    <div className="hidden sm:flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                            AD
                        </div>
                        <div className="text-left">
                            <span className="block font-black text-black text-xs leading-tight">Admin Fiscal</span>
                            <span className="block text-[11px] font-bold text-slate-800">Sesión Activa</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEGUNDA BARRA: PESTAÑAS DE TRABAJO (TEXTOS NEGROS DE ALTO CONTRASTE) */}
            <div className="bg-white border-b-2 border-slate-300 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setCurrentView('libro-fiscal')}
                        className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
                            currentView === 'libro-fiscal'
                                ? 'bg-black text-white shadow-sm ring-2 ring-blue-600'
                                : 'text-black hover:bg-slate-200 border border-slate-300'
                        }`}
                    >
                        <Receipt className="w-4 h-4 text-blue-400" />
                        <span>1. LIBRO FISCAL & FACTURAS</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                            currentView === 'libro-fiscal' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                        }`}>
                            1,420
                        </span>
                    </button>

                    <button
                        onClick={() => setCurrentView('directorio')}
                        className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
                            currentView === 'directorio'
                                ? 'bg-black text-white shadow-sm ring-2 ring-blue-600'
                                : 'text-black hover:bg-slate-200 border border-slate-300'
                        }`}
                    >
                        <Users2 className="w-4 h-4 text-emerald-400" />
                        <span>2. DIRECTORIO (EMPRESAS & PERSONAS)</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                            currentView === 'directorio' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                        }`}>
                            184
                        </span>
                    </button>

                    <button
                        onClick={() => setCurrentView('generador-pdf')}
                        className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${
                            currentView === 'generador-pdf'
                                ? 'bg-black text-white shadow-sm ring-2 ring-blue-600'
                                : 'text-black hover:bg-slate-200 border border-slate-300'
                        }`}
                    >
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>3. EMISOR DE FACTURA & PLANTILLA PDF</span>
                    </button>
                </div>

                {/* Búsqueda clara */}
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-800 absolute left-3 top-1/2 -translate-y-1/2 font-bold" />
                    <input
                        type="text"
                        placeholder="Buscar por RIF, Cédula o Nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border-2 border-slate-400 text-xs font-bold rounded-lg pl-9 pr-3 py-1.5 w-72 text-black placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

                {/* 4 TARJETAS DE RESUMEN CONTABLE (TEXTO NEGRO GRUESO) */}
                <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x-2 divide-slate-200">
                    <div className="px-4 py-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                            TOTAL FACTURADO
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-black font-mono">$184,920.00</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 block mt-1">Moneda base USD / Referencia</span>
                    </div>

                    <div className="px-4 py-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                            FACTURAS EMITIDAS
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-blue-900 font-mono">1,420</span>
                            <span className="text-xs font-black bg-blue-100 text-blue-950 px-2 py-0.5 rounded border border-blue-400">
                                Serie A
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 block mt-1">Comprobantes válidos</span>
                    </div>

                    <div className="px-4 py-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                            EMPRESAS / JURÍDICOS
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-black font-mono">128</span>
                            <span className="text-xs font-black bg-slate-200 text-black px-2 py-0.5 rounded">
                                RIF J-
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 block mt-1">Contribuyentes activos</span>
                    </div>

                    <div className="px-4 py-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                            PERSONAS NATURALES
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-black font-mono">56</span>
                            <span className="text-xs font-black bg-slate-200 text-black px-2 py-0.5 rounded">
                                C.I. V-/E-
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 block mt-1">Profesionales registrados</span>
                    </div>
                </div>

                {/* VISTA 1: LIBRO DE FACTURACIÓN Y ARCHIVO */}
                {currentView === 'libro-fiscal' && (
                    <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
                        
                        {/* Cabecera de la tabla */}
                        <div className="p-5 border-b-2 border-slate-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-100/70">
                            <div>
                                <h2 className="text-sm font-black text-black uppercase tracking-tight">
                                    Libro de Ventas & Registro Histórico de Facturas
                                </h2>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                    Secuencia legal correlativa de todos los documentos y facturas generadas
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="px-3.5 py-2 bg-white border-2 border-slate-400 hover:bg-slate-200 text-black text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-colors">
                                    <Download className="w-4 h-4 text-black" />
                                    Descargar Libro Excel
                                </button>
                                <button
                                    onClick={() => setCurrentView('generador-pdf')}
                                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                                >
                                    <Plus className="w-4 h-4 text-white" />
                                    Emitir Factura
                                </button>
                            </div>
                        </div>

                        {/* Tabla con Textos Negros y Bordes Gruesos */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-200 text-black uppercase text-xs font-black tracking-wider border-b-2 border-slate-400">
                                    <tr>
                                        <th className="px-5 py-3.5">Correlativo</th>
                                        <th className="px-4 py-3.5">N° Control</th>
                                        <th className="px-4 py-3.5">Receptor / Razón Social</th>
                                        <th className="px-4 py-3.5">RIF / C.I.</th>
                                        <th className="px-4 py-3.5">Fecha</th>
                                        <th className="px-4 py-3.5">Base Imponible</th>
                                        <th className="px-4 py-3.5">IVA (16%)</th>
                                        <th className="px-4 py-3.5">Total Factura</th>
                                        <th className="px-4 py-3.5">Estado</th>
                                        <th className="px-5 py-3.5 text-right">Acción PDF</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-200 font-medium">
                                    {invoicesLedger.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                                            <td className="px-5 py-4 font-mono font-black text-blue-900 text-sm">
                                                {row.correlative}
                                            </td>
                                            <td className="px-4 py-4 font-mono font-bold text-slate-900">
                                                {row.controlNumber}
                                            </td>
                                            <td className="px-4 py-4 max-w-[240px]">
                                                <span className="font-black text-black block text-xs">
                                                    {row.client}
                                                </span>
                                                <span className="block text-[11px] font-bold text-slate-800 truncate">
                                                    {row.concept}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-mono text-black font-black">
                                                {row.taxId}
                                            </td>
                                            <td className="px-4 py-4 font-mono font-bold text-slate-900">
                                                {row.date}
                                            </td>
                                            <td className="px-4 py-4 font-mono text-black font-bold text-xs">
                                                {row.taxBase}
                                            </td>
                                            <td className="px-4 py-4 font-mono text-black font-bold text-xs">
                                                {row.vat}
                                            </td>
                                            <td className="px-4 py-4 font-mono font-black text-black text-sm">
                                                {row.total}
                                            </td>
                                            <td className="px-4 py-4">
                                                {row.status === 'Emitida' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-500">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                                                        Emitida
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded bg-amber-100 text-amber-950 border border-amber-500">
                                                        <Clock className="w-3.5 h-3.5 text-amber-800" />
                                                        Borrador
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => setCurrentView('generador-pdf')}
                                                        className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-300 text-black font-black border border-slate-400 flex items-center gap-1 transition-colors"
                                                        title="Ver PDF Oficial"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Ver</span>
                                                    </button>
                                                    <button
                                                        className="p-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white transition-colors"
                                                        title="Descargar PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 rounded-md bg-white hover:bg-slate-200 text-black border border-slate-400 transition-colors"
                                                        title="Imprimir"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pie de tabla con datos claros */}
                        <div className="p-4 border-t-2 border-slate-300 flex items-center justify-between text-xs font-bold text-black bg-slate-100">
                            <span>Mostrando 5 de 1,420 registros fiscales emitidos</span>
                            <div className="flex items-center space-x-2">
                                <button className="px-3 py-1.5 bg-white border-2 border-slate-400 rounded-md text-black font-black hover:bg-slate-200">
                                    Anterior
                                </button>
                                <span className="px-3 py-1 font-black text-black">Página 1 de 284</span>
                                <button className="px-3 py-1.5 bg-white border-2 border-slate-400 rounded-md text-black font-black hover:bg-slate-200">
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA 2: DIRECTORIO MAESTRO DE EMPRESAS Y PERSONAS */}
                {currentView === 'directorio' && (
                    <div className="space-y-4">
                        {/* Filtros del directorio */}
                        <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-xs font-black uppercase text-black">Filtrar Contribuyentes:</span>
                                <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-400 text-xs">
                                    <button
                                        onClick={() => setDirectoryType('todos')}
                                        className={`px-3.5 py-1.5 rounded font-black transition-all ${
                                            directoryType === 'todos' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-300'
                                        }`}
                                    >
                                        Todos (184)
                                    </button>
                                    <button
                                        onClick={() => setDirectoryType('empresas')}
                                        className={`px-3.5 py-1.5 rounded font-black transition-all ${
                                            directoryType === 'empresas' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-300'
                                        }`}
                                    >
                                        Empresas / Jurídicos (128)
                                    </button>
                                    <button
                                        onClick={() => setDirectoryType('personas')}
                                        className={`px-3.5 py-1.5 rounded font-black transition-all ${
                                            directoryType === 'personas' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-300'
                                        }`}
                                    >
                                        Personas Naturales (56)
                                    </button>
                                </div>
                            </div>

                            <button className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-black px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors">
                                <Plus className="w-4 h-4 text-white" />
                                Registrar Nueva Empresa o Persona
                            </button>
                        </div>

                        {/* Cuadrícula de Fichas Fiscales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredDirectory.map((card) => (
                                <div
                                    key={card.id}
                                    className="bg-white rounded-xl border-2 border-slate-300 shadow-sm p-5 flex flex-col justify-between hover:border-black transition-all"
                                >
                                    <div>
                                        {/* Cabecera de la ficha */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-3 rounded-lg border-2 ${
                                                    card.type === 'empresa'
                                                        ? 'bg-blue-100 text-blue-900 border-blue-400'
                                                        : 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                                }`}>
                                                    {card.type === 'empresa' ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-black uppercase text-slate-800 block">
                                                        {card.type === 'empresa' ? 'Persona Jurídica' : 'Persona Natural'}
                                                    </span>
                                                    <h3 className="text-sm font-black text-black leading-tight mt-0.5">
                                                        {card.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIF o Cédula bien visible */}
                                        <div className="mt-4 flex items-center justify-between bg-amber-50 p-2.5 rounded-lg border-2 border-amber-300 font-mono text-xs">
                                            <span className="text-black font-black text-xs">ID FISCAL / RIF:</span>
                                            <strong className="text-black text-sm font-black">{card.taxId}</strong>
                                        </div>

                                        {/* Datos de contacto con texto negro */}
                                        <div className="mt-4 space-y-2 text-xs font-bold text-black">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                                                <span className="truncate">{card.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-blue-700 shrink-0" />
                                                <span>{card.phone}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                                                <span className="text-slate-900">{card.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pie de la ficha */}
                                    <div className="mt-5 pt-3 border-t-2 border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 block">Total Facturado</span>
                                            <span className="font-mono font-black text-black text-sm">{card.totalBilled}</span>
                                        </div>
                                        <button
                                            onClick={() => setCurrentView('generador-pdf')}
                                            className="px-3.5 py-2 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 transition-colors"
                                        >
                                            <Receipt className="w-4 h-4 text-sky-400" />
                                            Facturar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VISTA 3: EMISOR DE FACTURA & GENERADOR PDF */}
                {currentView === 'generador-pdf' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LADO IZQUIERDO (5 cols): FORMULARIO DE CARGA */}
                        <div className="lg:col-span-5 bg-white rounded-xl border-2 border-slate-300 shadow-sm p-6 space-y-5">
                            <div className="border-b-2 border-slate-300 pb-3">
                                <h3 className="text-sm font-black text-black uppercase">
                                    Datos de la Factura a Emitir
                                </h3>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                    Selecciona el receptor y agrega los conceptos a facturar
                                </p>
                            </div>

                            {/* Receptor */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-black block">
                                    Empresa o Persona Receptora
                                </label>
                                <select className="w-full bg-white border-2 border-slate-400 rounded-lg px-3 py-2 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600">
                                    <option value="1">Inversiones & Logística Corpo Asia, C.A. (J-50192834-1)</option>
                                    <option value="2">Distribuidora Agroindustrial El Roble, S.A. (J-31294819-0)</option>
                                    <option value="3">Dra. Mariana Valenzuela Castro (V-18.904.321)</option>
                                    <option value="4">Servicios Tecnológicos Soluciones Web, C.A. (J-41289102-8)</option>
                                    <option value="5">Ing. Alejandro Morales Mendoza (V-14.892.301)</option>
                                </select>
                            </div>

                            {/* Correlativo y Control */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        N° Correlativo Fiscal
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value="F-003891"
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-blue-900 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        N° Control Tributario
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value="00-089123"
                                        className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-black text-black cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        Fecha de Emisión
                                    </label>
                                    <input
                                        type="date"
                                        defaultValue="2026-11-04"
                                        className="w-full bg-white border-2 border-slate-400 rounded-lg px-3 py-1.5 text-xs font-black text-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        Condición de Pago
                                    </label>
                                    <select className="w-full bg-white border-2 border-slate-400 rounded-lg px-3 py-1.5 text-xs font-black text-black">
                                        <option>Contado / Transferencia</option>
                                        <option>Crédito 15 Días</option>
                                        <option>Crédito 30 Días</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conceptos */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-black">
                                        Conceptos e Ítems a Facturar
                                    </label>
                                    <button className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Añadir Ítem
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3.5 bg-slate-100 rounded-lg border-2 border-slate-300 text-xs space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-black text-xs">Ítem 01</span>
                                            <button className="text-slate-600 hover:text-red-700 font-black">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            defaultValue="Auditoría y Consultoría Fiscal Corporativa Q4"
                                            className="w-full bg-white border-2 border-slate-400 rounded px-3 py-1.5 text-xs font-black text-black"
                                        />
                                        <div className="grid grid-cols-3 gap-2 text-xs font-black">
                                            <div>
                                                <span className="text-black block mb-0.5">Cant.</span>
                                                <input type="number" defaultValue="1" className="w-full bg-white border-2 border-slate-400 rounded px-2 py-1 text-center font-mono font-black" />
                                            </div>
                                            <div>
                                                <span className="text-black block mb-0.5">P. Unit ($)</span>
                                                <input type="text" defaultValue="2500.00" className="w-full bg-white border-2 border-slate-400 rounded px-2 py-1 text-right font-mono font-black" />
                                            </div>
                                            <div>
                                                <span className="text-black block mb-0.5">Total ($)</span>
                                                <input type="text" disabled defaultValue="2500.00" className="w-full bg-slate-200 border-2 border-slate-300 rounded px-2 py-1 text-right font-mono font-black text-blue-900" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-slate-100 rounded-lg border-2 border-slate-300 text-xs space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-black text-xs">Ítem 02</span>
                                            <button className="text-slate-600 hover:text-red-700 font-black">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            defaultValue="Licenciamiento de Software y Timbrado Digital"
                                            className="w-full bg-white border-2 border-slate-400 rounded px-3 py-1.5 text-xs font-black text-black"
                                        />
                                        <div className="grid grid-cols-3 gap-2 text-xs font-black">
                                            <div>
                                                <span className="text-black block mb-0.5">Cant.</span>
                                                <input type="number" defaultValue="1" className="w-full bg-white border-2 border-slate-400 rounded px-2 py-1 text-center font-mono font-black" />
                                            </div>
                                            <div>
                                                <span className="text-black block mb-0.5">P. Unit ($)</span>
                                                <input type="text" defaultValue="1350.00" className="w-full bg-white border-2 border-slate-400 rounded px-2 py-1 text-right font-mono font-black" />
                                            </div>
                                            <div>
                                                <span className="text-black block mb-0.5">Total ($)</span>
                                                <input type="text" disabled defaultValue="1350.00" className="w-full bg-slate-200 border-2 border-slate-300 rounded px-2 py-1 text-right font-mono font-black text-blue-900" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resumen de liquidación */}
                            <div className="border-t-2 border-slate-300 pt-3 space-y-2 text-xs font-mono font-black">
                                <div className="flex justify-between text-black">
                                    <span>Subtotal Base Imponible:</span>
                                    <span>$3,850.00</span>
                                </div>
                                <div className="flex justify-between text-black">
                                    <span>Alícuota I.V.A. (16%):</span>
                                    <span>$616.00</span>
                                </div>
                                <div className="flex justify-between text-black border-t-2 border-black pt-2 text-base font-black">
                                    <span>TOTAL FACTURA:</span>
                                    <span className="text-blue-900 text-lg">$4,466.00</span>
                                </div>
                            </div>

                            <button className="w-full bg-black hover:bg-slate-900 text-white font-black py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98">
                                <Save className="w-4 h-4 text-emerald-400" />
                                Guardar en Libro & Generar PDF Oficial
                            </button>
                        </div>

                        {/* LADO DERECHO (7 cols): HOJA PDF REALISTA A4 EN ALTO CONTRASTE */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-wider">
                                    <Eye className="w-4 h-4 text-blue-700" />
                                    <span>Vista Previa • Hoja Física A4</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="px-3.5 py-1.5 bg-white border-2 border-slate-400 hover:bg-slate-200 text-black text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs">
                                        <Printer className="w-4 h-4 text-black" />
                                        Imprimir
                                    </button>
                                    <button className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs">
                                        <Download className="w-4 h-4 text-white" />
                                        Descargar PDF
                                    </button>
                                </div>
                            </div>

                            {/* HOJA IMPRESA FISCAL */}
                            <div className="bg-white rounded-xl border-2 border-black shadow-lg p-8 text-black text-xs font-sans relative">

                                {/* Membrete */}
                                <div className="border-b-4 border-black pb-5 mb-5 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <div className="h-8 w-8 rounded bg-black text-white flex items-center justify-center font-black text-sm">
                                                CA
                                            </div>
                                            <h2 className="text-base font-black text-black tracking-tight">
                                                CORPO ASIA SYSTEMS, C.A.
                                            </h2>
                                        </div>
                                        <p className="text-xs font-black text-black">R.I.F. J-50123998-0 • Nit: 900.281.912</p>
                                        <p className="text-xs font-bold text-slate-900">Av. Francisco de Miranda, Torre Empresarial, Piso 12, Ofic. 12-A</p>
                                        <p className="text-xs font-bold text-slate-900">contacto@corpoasia.com • Tel: +58 (212) 999-8888</p>
                                    </div>

                                    <div className="border-4 border-black rounded-lg p-3 text-center bg-slate-50 min-w-[160px]">
                                        <span className="text-xs font-black uppercase text-black tracking-wider block">
                                            FACTURA FISCAL
                                        </span>
                                        <span className="text-lg font-mono font-black text-blue-900 block my-0.5">
                                            N° F-003891
                                        </span>
                                        <span className="text-xs font-black text-black block">
                                            Control: <strong>00-089123</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Receptor */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 rounded-lg border-2 border-slate-300 mb-5 text-xs">
                                    <div>
                                        <span className="text-xs font-black uppercase text-black block mb-1">
                                            DATOS DEL RECEPTOR (CLIENTE)
                                        </span>
                                        <p className="font-black text-black text-sm">Inversiones & Logística Corpo Asia, C.A.</p>
                                        <p className="text-black font-mono font-black text-xs mt-0.5">RIF: J-50192834-1</p>
                                        <p className="text-slate-900 font-bold text-xs mt-1">Av. Libertador, Edif. Torre Financiera, Piso 14, Chacao</p>
                                    </div>
                                    <div className="border-l-2 border-slate-300 pl-4 space-y-1 text-xs font-bold text-black">
                                        <div className="flex justify-between">
                                            <span>Fecha de Emisión:</span>
                                            <span className="font-mono font-black">04/11/2026</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Fecha de Vencimiento:</span>
                                            <span className="font-mono font-black">19/11/2026</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Condición de Pago:</span>
                                            <span className="font-black">Crédito 15 Días</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla de Ítems */}
                                <div className="border-2 border-black rounded-lg overflow-hidden mb-5">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-200 text-black uppercase font-black text-xs border-b-2 border-black">
                                            <tr>
                                                <th className="p-3 w-10 text-center">N°</th>
                                                <th className="p-3">Descripción del Concepto</th>
                                                <th className="p-3 text-center w-16">Cant.</th>
                                                <th className="p-3 text-right w-28">P. Unitario</th>
                                                <th className="p-3 text-right w-28">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-slate-200 text-xs font-medium">
                                            <tr>
                                                <td className="p-3 text-center font-mono font-black">01</td>
                                                <td className="p-3 font-black text-black">
                                                    Auditoría y Consultoría Fiscal Corporativa Q4
                                                    <span className="block font-bold text-slate-800 text-[11px]">
                                                        Revisión contable general y cierre tributario
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center font-mono font-black">1.00</td>
                                                <td className="p-3 text-right font-mono font-bold">$2,500.00</td>
                                                <td className="p-3 text-right font-mono font-black">$2,500.00</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 text-center font-mono font-black">02</td>
                                                <td className="p-3 font-black text-black">
                                                    Licenciamiento de Software y Timbrado Digital
                                                    <span className="block font-bold text-slate-800 text-[11px]">
                                                        Módulo corporativo para 1,000 emisiones
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center font-mono font-black">1.00</td>
                                                <td className="p-3 text-right font-mono font-bold">$1,350.00</td>
                                                <td className="p-3 text-right font-mono font-black">$1,350.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* QR y Totales */}
                                <div className="grid grid-cols-12 gap-4 pt-1">
                                    <div className="col-span-5 flex items-center gap-3 p-3 bg-slate-100 rounded-lg border-2 border-slate-300">
                                        <QrCode className="w-14 h-14 text-black shrink-0" />
                                        <div className="text-xs text-black font-bold leading-tight">
                                            <p className="font-black text-black">TIMBRE FISCAL DIGITAL</p>
                                            <p className="text-[11px]">Comprobante oficial válido con verificación QR legal.</p>
                                        </div>
                                    </div>

                                    <div className="col-span-7 space-y-1.5 text-xs font-mono font-black text-right">
                                        <div className="flex justify-between text-black">
                                            <span>Subtotal Base Imponible:</span>
                                            <span>$3,850.00</span>
                                        </div>
                                        <div className="flex justify-between text-black">
                                            <span>I.V.A. Débito Fiscal (16%):</span>
                                            <span>$616.00</span>
                                        </div>
                                        <div className="border-t-4 border-black pt-2 flex justify-between text-black font-black text-sm">
                                            <span>TOTAL A PAGAR:</span>
                                            <span className="font-black text-blue-900 text-base">$4,466.00</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-3 border-t-2 border-slate-300 text-center text-xs font-bold text-slate-900">
                                    Documento generado legalmente por el Sistema Corpo_Documents • Todos los derechos reservados © 2026
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </main>

            {/* PIE INSTITUCIONAL */}
            <footer className="bg-white border-t-2 border-slate-300 py-4 px-6 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-black gap-2">
                    <div className="flex items-center space-x-2">
                        <strong className="text-black font-black">Corpo Documents ERP</strong>
                        <span>·</span>
                        <span>Corpo Asia Systems, C.A.</span>
                        <span>·</span>
                        <span>Sistema de Gestión y Facturación Fiscal</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                        Modo Accesibilidad & Alto Contraste Activo • Zoom {zoomLevel}%
                    </div>
                </div>
            </footer>
        </div>
    );
}
