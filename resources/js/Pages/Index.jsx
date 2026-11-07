import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
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
    ChevronLeft,
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
    Type,
    Image,
    Globe,
    LogOut,
    X,
    Loader2,
    Sparkles,
    Edit3,
    Camera
} from 'lucide-react';

export default function Index({ companies = [], clients = [], invoices = [], stats = {} }) {
    const { flash = {} } = usePage().props;

    // Vistas principales: 'libro-fiscal' | 'directorio' | 'generador-pdf'
    const [currentView, setCurrentView] = useState('libro-fiscal');

    // Selector de Formato de Plantilla PDF:
    // 'formato-1': Factura Fiscal Estándar (Estructura Agrosuministros Rodríguez)
    // 'formato-2': Proforma Industrial / Maquinarias & Importación (Estructura Moaiven Group)
    const [selectedPdfFormat, setSelectedPdfFormat] = useState('formato-1');

    // Filtros de directorio
    // directorySection: 'empresas-emisoras' (nuestras empresas con logo) | 'clientes' (compradores/receptores)
    const [directorySection, setDirectorySection] = useState('empresas-emisoras');
    const [directoryType, setDirectoryType] = useState('todos'); // todos | empresas | personas
    const [searchQuery, setSearchQuery] = useState('');

    // Paginación del Libro Fiscal (10 por página)
    const [invoicePage, setInvoicePage] = useState(1);
    const invoicePageSize = 10;

    // Resetear a la página 1 cuando se realiza una búsqueda
    useEffect(() => {
        setInvoicePage(1);
    }, [searchQuery]);

    // Diccionario de información visual según el tipo de documento (Factura, Proforma, Cotización, Nota Entrega)
    const getDocumentTypeInfo = (type) => {
        switch (type) {
            case 'proforma':
                return {
                    title: 'PROFORMA',
                    badgeText: 'PROFORMA',
                    correlativeLabel: 'N° de Proforma',
                    controlLabel: 'Control',
                    defaultSubtitle: 'LÍNEA INDUSTRIAL / IMPORTACIÓN'
                };
            case 'cotizacion':
                return {
                    title: 'COTIZACIÓN',
                    badgeText: 'COTIZACIÓN',
                    correlativeLabel: 'N° de Cotización',
                    controlLabel: 'Control',
                    defaultSubtitle: 'PRESUPUESTO / COTIZACIÓN COMERCIAL'
                };
            case 'nota_entrega':
                return {
                    title: 'NOTA DE ENTREGA',
                    badgeText: 'NOTA DE ENTREGA',
                    correlativeLabel: 'N° Nota de Entrega',
                    controlLabel: 'Control de Despacho',
                    defaultSubtitle: 'GUÍA / NOTA DE ENTREGA'
                };
            case 'factura':
            default:
                return {
                    title: 'FACTURA FISCAL',
                    badgeText: 'FACTURA',
                    correlativeLabel: 'N° de Factura',
                    controlLabel: 'Control',
                    defaultSubtitle: ''
                };
        }
    };

    // Modales de creación
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    // Empresa activa seleccionada para facturación (multi-empresa con logos)
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        companies.length > 0 ? companies[0].id : null
    );

    // Detección responsive para dispositivos móviles y tablets
    const [isMobile, setIsMobile] = useState(false);
    // Pestaña activa en pantalla móvil para el Taller de Emisión: 'formulario' | 'preview'
    const [mobileEditorTab, setMobileEditorTab] = useState('formulario');

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Control de tamaño / zoom para accesibilidad y alta legibilidad (+15%, +25%, +35%, +45%)
    const [zoomLevel, setZoomLevel] = useState('115');
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    const zoomOptions = [
        { value: '100', label: 'Normal (100%)', desc: 'Tamaño estándar del sistema' },
        { value: '115', label: 'Grande (+15%)', desc: 'Recomendado para lectura cómoda' },
        { value: '125', label: 'Muy Grande (+25%)', desc: 'Mayor tamaño y visibilidad' },
        { value: '135', label: 'Extra Grande (+35%)', desc: 'Textos y botones ampliados' },
        { value: '145', label: 'Máximo (+45%)', desc: 'Máxima escala visual' },
    ];

    const currentZoomOption = zoomOptions.find(o => o.value === zoomLevel) || zoomOptions[1];

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

    // Obtener la empresa actualmente activa
    const activeCompany = companies.find(c => c.id === Number(selectedCompanyId)) || companies[0] || {
        id: 1,
        name: 'CORPO ASIA SYSTEMS, C.A.',
        tax_id: 'J-50123998-0',
        phone: '+58 212 999 8888',
        email: 'facturacion@corpoasia.com',
        address: 'Caracas, Venezuela',
        logo_url: null,
        invoice_prefix: 'F-',
        next_correlative: 1,
        next_control_number: 1,
        default_terms: 'Comprobante fiscal válido. Conserve este documento para efectos legales y de garantía.'
    };

    // Ficha técnica base para proformas industriales (Moaiven CAT 320C L o maquinaria pesada)
    const defaultTechnicalSpecs = [
        { category: 'Especificaciones del motor', name: 'Marca y modelo de motor', value: 'Mitsubishi 3066 TAA, diésel turboalimentado' },
        { category: 'Especificaciones del motor', name: 'Potencia neta', value: '103 kW (138 HP)' },
        { category: 'Especificaciones operativas', name: 'Peso operativo total', value: '20,800 kg (20.8 toneladas)' },
        { category: 'Especificaciones operativas', name: 'Capacidad de cucharón', value: '1.2 m³' },
        { category: 'Especificaciones operativas', name: 'Profundidad máxima de excavación', value: '6.11 m' },
        { category: 'Especificaciones operativas', name: 'Motor de giro (swing motor)', value: 'Kawasaki M5X130CHB-11A (N° parte CAT 158-8986)' },
        { category: 'Especificaciones operativas', name: 'Bomba hidráulica principal', value: 'Kawasaki AP12S (N° parte CAT 173-3381)' },
        { category: 'Dimensiones', name: 'Dimensiones de transporte (L×A×A)', value: '9.42 × 2.98 × 3.01 m' },
        { category: 'Dimensiones', name: 'Ancho de oruga', value: '600 mm' },
        { category: 'Extras', name: 'Emisiones', value: 'Cumple Tier 1 a nivel mundial' },
        { category: 'Extras', name: 'País de origen', value: 'Made in Japan (Shin Caterpillar Mitsubishi)' },
    ];

    // Helper: Obtener fecha en formato YYYY-MM-DD en zona horaria de Caracas / Venezuela (America/Caracas)
    const getCaracasDate = (daysOffset = 0) => {
        const d = new Date();
        if (daysOffset) {
            d.setDate(d.getDate() + daysOffset);
        }
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Caracas',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(d);
    };

    // Helper: Formatear fecha para presentación (DD/MM/YYYY) respetando zona horaria de Caracas
    const formatCaracasDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const clean = String(dateStr).split('T')[0].split(' ')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
                const [y, m, d] = clean.split('-');
                return `${d}/${m}/${y}`;
            }
            return new Date(dateStr).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' });
        } catch {
            return String(dateStr);
        }
    };

    // Plantilla de factura completamente limpia a la espera de ser llenada
    const getEmptyInvoice = (company) => ({
        company_id: company?.id || (companies.length > 0 ? companies[0].id : ''),
        client_id: '',
        document_type: 'factura',
        document_subtitle: '',
        order_number: '#' + (company?.next_control_number || 1),
        issue_date: getCaracasDate(),
        due_date: getCaracasDate(8),
        offer_validity_days: 8,
        delivery_address: '',
        sale_condition: 'Venta de Contado',
        sales_channel: 'Oficina / Presencial',
        bcv_exchange_rate: 876.80,
        currency: 'USD',
        payment_method: 'PAGO MOVIL',
        payment_reference: '',
        shipping_cost: 0,
        discount: 0,
        tax_percentage: 16.00,
        terms_conditions: company?.default_terms || '',
        // Campos específicos sincronizados para Formato 2: Proforma Industrial / Moaiven
        equipment_year: '2021 / Reciente (Inspeccionado)',
        equipment_vin: 'CAT0320CL089124',
        customs_text: 'INCLUIDO',
        payment_milestone_1_pct: 70,
        payment_milestone_1_text: 'Al momento de firmar el contrato, para iniciar la verificación, compra del equipo y proceso de envío.',
        payment_milestone_2_pct: 30,
        payment_milestone_2_text: '15 días antes de la llegada del equipo al puerto de destino en Venezuela.',
        shipping_terms_notes: 'Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a la disponibilidad de espacio (booking) ofrecida por la naviera.',
        company_social_handle: '',
        technical_specs: defaultTechnicalSpecs.map(s => ({ ...s })),
        items: [
            { description: '', details: '', quantity: 1, unit: 'unid', unit_price: '', is_tax_exempt: false, image_url: null }
        ]
    });

    // Estado del formulario de factura (SINCRONIZADO EN TIEMPO REAL CON LA VISTA PREVIA)
    const [invoiceForm, setInvoiceForm] = useState(getEmptyInvoice(activeCompany));

    // Cambio inteligente de tipo de documento (Factura, Proforma, Cotización, Nota Entrega)
    const handleDocumentTypeChange = (newType) => {
        setInvoiceForm(prev => {
            let newValidity = prev.offer_validity_days || 8;
            let newTerms = prev.terms_conditions;
            let newTaxPercentage = prev.tax_percentage;
            let newSaleCondition = prev.sale_condition;

            if (newType === 'proforma') {
                newValidity = 8;
                newTaxPercentage = 0; // Boss: "es el precio en China en la cotización de agregar nada de impuesto... precio neto"
                newTerms = 'Oferta proforma con validez máxima de ocho (8) días continuos a partir de su emisión. Transcurrido este plazo, los precios, fletes y disponibilidad de los equipos o mercancía quedan sujetos a reconfirmación.';
            } else if (newType === 'cotizacion') {
                newValidity = 8;
                newTaxPercentage = 0; // Neto
                newTerms = 'Cotización comercial con validez de ocho (8) días continuos a partir de la fecha de emisión.';
            } else if (newType === 'nota_entrega') {
                newTaxPercentage = 0; // Boss: "estamos trabajando es con una nota de entrega... sin el impuesto"
                if (!newSaleCondition || newSaleCondition === 'Venta de Contado') {
                    newSaleCondition = 'Consignación';
                }
                newTerms = 'Nota de entrega de mercancía / equipos recibidos conforme y a entera satisfacción. Control y despacho sin efecto de facturación fiscal.';
            } else if (newType === 'factura') {
                newTaxPercentage = 16.00;
                newTerms = activeCompany?.default_terms || 'Comprobante fiscal oficial generado por el sistema. Para devoluciones o reclamos conserve este documento. Plazo máximo de reclamación: 3 días hábiles desde la fecha de emisión.';
            }

            return {
                ...prev,
                document_type: newType,
                offer_validity_days: newValidity,
                terms_conditions: newTerms,
                tax_percentage: newTaxPercentage,
                sale_condition: newSaleCondition,
            };
        });
    };

    // Acción para iniciar una nueva factura limpia
    const handleNewInvoice = () => {
        setInvoiceForm(getEmptyInvoice(activeCompany));
        setCurrentView('generador-pdf');
    };

    // Actualizar company_id y términos cuando cambia activeCompany
    useEffect(() => {
        if (activeCompany) {
            setInvoiceForm(prev => ({
                ...prev,
                company_id: activeCompany.id,
                terms_conditions: activeCompany.default_terms || prev.terms_conditions,
                order_number: '#' + (activeCompany.next_control_number || 1)
            }));
        }
    }, [activeCompany?.id]);

    // Cliente actualmente seleccionado en el formulario (null si no se ha seleccionado ninguno)
    const currentSelectedClient = invoiceForm.client_id
        ? clients.find(c => c.id === Number(invoiceForm.client_id)) || null
        : null;

    // Cálculos en tiempo real de la factura
    const itemsSubtotal = invoiceForm.items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
    const taxableBase = invoiceForm.items.filter(it => !it.is_tax_exempt).reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
    const taxAmount = (taxableBase * Number(invoiceForm.tax_percentage || 0)) / 100;
    const totalUsd = itemsSubtotal + Number(invoiceForm.shipping_cost || 0) - Number(invoiceForm.discount || 0) + taxAmount;
    const totalVes = totalUsd * Number(invoiceForm.bcv_exchange_rate || 1);

    // Correlativo proyectado en tiempo real
    const projectedCorrelative = sprintfCorrelative(activeCompany.invoice_prefix || 'F-', activeCompany.next_correlative || 1);
    const projectedControlNumber = sprintfControl(0, activeCompany.next_control_number || 1);

    function sprintfCorrelative(prefix, num) {
        return `${prefix}${String(num).padStart(7, '0')}`;
    }
    function sprintfControl(series, num) {
        return `${String(series).padStart(2, '0')}-${String(num).padStart(6, '0')}`;
    }

    // Manejar ítems dinámicos
    const handleAddItem = () => {
        setInvoiceForm(prev => ({
            ...prev,
            items: [...prev.items, { description: '', details: '', quantity: 1, unit: 'unid', unit_price: 0, is_tax_exempt: false, image_url: null }]
        }));
    };

    const handleRemoveItem = (index) => {
        if (invoiceForm.items.length === 1) return;
        setInvoiceForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        setInvoiceForm(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    // Manejadores para la Ficha Técnica y Parámetros del Formato 2 (Moaiven / Proforma Industrial)
    const handleAddTechSpec = () => {
        setInvoiceForm(prev => ({
            ...prev,
            technical_specs: [
                ...(prev.technical_specs || []),
                { category: 'Especificaciones Generales', name: 'Nueva Característica', value: 'Valor' }
            ]
        }));
    };

    const handleRemoveTechSpec = (index) => {
        setInvoiceForm(prev => ({
            ...prev,
            technical_specs: (prev.technical_specs || []).filter((_, i) => i !== index)
        }));
    };

    const handleTechSpecChange = (index, field, val) => {
        setInvoiceForm(prev => {
            const list = [...(prev.technical_specs || [])];
            list[index] = { ...list[index], [field]: val };
            return { ...prev, technical_specs: list };
        });
    };

    const handleResetDefaultTechSpecs = () => {
        setInvoiceForm(prev => ({
            ...prev,
            technical_specs: defaultTechnicalSpecs.map(s => ({ ...s })),
            equipment_year: '2021 / Reciente (Inspeccionado)',
            equipment_vin: 'CAT0320CL089124',
            customs_text: 'INCLUIDO',
            payment_milestone_1_pct: 70,
            payment_milestone_1_text: 'Al momento de firmar el contrato, para iniciar la verificación, compra del equipo y proceso de envío.',
            payment_milestone_2_pct: 30,
            payment_milestone_2_text: '15 días antes de la llegada del equipo al puerto de destino en Venezuela.',
            shipping_terms_notes: 'Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a la disponibilidad de espacio (booking) ofrecida por la naviera.'
        }));
    };

    // Envío del formulario de factura a Laravel
    const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
    const handleSubmitInvoice = (e) => {
        e.preventDefault();
        if (!invoiceForm.client_id) {
            alert('Por favor seleccione un cliente antes de guardar la factura, o regístrelo mediante el botón "+ Nuevo Cliente".');
            return;
        }
        setIsSubmittingInvoice(true);
        router.post('/invoices', invoiceForm, {
            onSuccess: () => {
                setIsSubmittingInvoice(false);
                setCurrentView('libro-fiscal');
            },
            onError: (err) => {
                setIsSubmittingInvoice(false);
                alert('Por favor verifica los campos obligatorios: ' + Object.values(err).join(', '));
            }
        });
    };

    // Cargar una factura pasada en el formulario y sincronizarla en tiempo real
    const handleLoadInvoiceToEditor = (inv) => {
        setSelectedCompanyId(inv.company_id);
        setInvoiceForm({
            company_id: inv.company_id,
            client_id: inv.client_id,
            document_type: inv.document_type || 'factura',
            document_subtitle: inv.document_subtitle || '',
            order_number: inv.order_number || '',
            issue_date: inv.issue_date ? inv.issue_date.split('T')[0].split(' ')[0] : getCaracasDate(),
            due_date: inv.due_date ? inv.due_date.split('T')[0].split(' ')[0] : '',
            offer_validity_days: inv.offer_validity_days || 15,
            delivery_address: inv.delivery_address || '',
            sale_condition: inv.sale_condition || 'Venta de Contado',
            sales_channel: inv.sales_channel || 'Oficina',
            bcv_exchange_rate: Number(inv.bcv_exchange_rate || 876.80),
            currency: inv.currency || 'USD',
            payment_method: inv.payment_method || 'PAGO MOVIL',
            payment_reference: inv.payment_reference || '',
            shipping_cost: Number(inv.shipping_cost || 0),
            discount: Number(inv.discount || 0),
            tax_percentage: Number(inv.tax_percentage || 16),
            terms_conditions: inv.terms_conditions || '',
            shipping_terms_notes: inv.shipping_terms_notes || 'Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a la disponibilidad de espacio (booking) ofrecida por la naviera.',
            equipment_year: inv.technical_specs?.equipment_year || '2021 / Reciente (Inspeccionado)',
            equipment_vin: inv.technical_specs?.equipment_vin || 'CAT0320CL089124',
            customs_text: inv.technical_specs?.customs_text || 'INCLUIDO',
            payment_milestone_1_pct: inv.technical_specs?.payment_milestone_1_pct || 70,
            payment_milestone_1_text: inv.technical_specs?.payment_milestone_1_text || 'Al momento de firmar el contrato, para iniciar la verificación, compra del equipo y proceso de envío.',
            payment_milestone_2_pct: inv.technical_specs?.payment_milestone_2_pct || 30,
            payment_milestone_2_text: inv.technical_specs?.payment_milestone_2_text || '15 días antes de la llegada del equipo al puerto de destino en Venezuela.',
            company_social_handle: inv.technical_specs?.company_social_handle || '',
            technical_specs: Array.isArray(inv.technical_specs) ? inv.technical_specs : (Array.isArray(inv.technical_specs?.specs) ? inv.technical_specs.specs : defaultTechnicalSpecs.map(s => ({ ...s }))),
            items: (inv.items && inv.items.length > 0)
                ? inv.items.map(it => ({
                    description: it.description,
                    details: it.details || '',
                    quantity: Number(it.quantity),
                    unit: it.unit,
                    unit_price: Number(it.unit_price),
                    is_tax_exempt: !!it.is_tax_exempt,
                    image_url: it.image_url || null
                }))
                : [{ description: 'Servicio general', details: '', quantity: 1, unit: 'unid', unit_price: 100, is_tax_exempt: false, image_url: null }]
        });
        setCurrentView('generador-pdf');
    };

    // Función de impresión y exportación a PDF garantizada
    const handlePrintDocument = () => {
        setMobileEditorTab('preview');
        setTimeout(() => {
            window.print();
        }, 120);
    };

    // Estado para nueva empresa y edición
    const [editingCompany, setEditingCompany] = useState(null);
    const [newCompany, setNewCompany] = useState({
        name: '',
        trade_name: '',
        tax_id: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        invoice_prefix: 'F-',
        default_terms: ''
    });
    const [isSavingCompany, setIsSavingCompany] = useState(false);

    const handleOpenCreateCompany = () => {
        setEditingCompany(null);
        setNewCompany({
            name: '', trade_name: '', tax_id: '', phone: '', email: '',
            address: '', city: '', state: '', invoice_prefix: 'F-', default_terms: ''
        });
        setIsCompanyModalOpen(true);
    };

    const handleOpenEditCompany = (comp) => {
        setEditingCompany(comp);
        setNewCompany({
            name: comp.name || '',
            trade_name: comp.trade_name || '',
            tax_id: comp.tax_id || '',
            phone: comp.phone || '',
            email: comp.email || '',
            address: comp.address || '',
            city: comp.city || '',
            state: comp.state || '',
            invoice_prefix: comp.invoice_prefix || 'F-',
            default_terms: comp.default_terms || ''
        });
        setIsCompanyModalOpen(true);
    };

    const handleSubmitCompany = (e) => {
        e.preventDefault();
        setIsSavingCompany(true);

        const payload = {
            ...newCompany,
            email: newCompany.email ? newCompany.email.trim() : null
        };

        if (editingCompany) {
            router.put(`/companies/${editingCompany.id}`, payload, {
                onSuccess: () => {
                    setIsSavingCompany(false);
                    setIsCompanyModalOpen(false);
                    setEditingCompany(null);
                },
                onError: () => setIsSavingCompany(false)
            });
        } else {
            router.post('/companies', payload, {
                onSuccess: () => {
                    setIsSavingCompany(false);
                    setIsCompanyModalOpen(false);
                    setNewCompany({
                        name: '', trade_name: '', tax_id: '', phone: '', email: '',
                        address: '', city: '', state: '', invoice_prefix: 'F-', default_terms: ''
                    });
                },
                onError: () => setIsSavingCompany(false)
            });
        }
    };

    // Estado para nuevo cliente y edición
    const [editingClient, setEditingClient] = useState(null);
    const [newClient, setNewClient] = useState({
        type: 'persona',
        nacionalidad: 'V',
        cedulaNumber: '',
        tax_id: '',
        name: '',
        phone: '',
        phone_secondary: '',
        email: '',
        address: '',
        contact_person: '',
        notes: ''
    });
    const [isSavingClient, setIsSavingClient] = useState(false);
    const [isConsultingCne, setIsConsultingCne] = useState(false);
    const [cneAlert, setCneAlert] = useState(null); // { type: 'success' | 'error', message: string }

    const handleOpenCreateClient = () => {
        setEditingClient(null);
        setCneAlert(null);
        setNewClient({
            type: 'persona',
            nacionalidad: 'V',
            cedulaNumber: '',
            tax_id: '',
            name: '',
            phone: '',
            phone_secondary: '',
            email: '',
            address: '',
            contact_person: '',
            notes: ''
        });
        setIsClientModalOpen(true);
    };

    const handleOpenEditClient = (client) => {
        setEditingClient(client);
        setCneAlert(null);
        let nac = 'V';
        let num = client.tax_id || '';
        if (client.tax_id && client.tax_id.includes('-')) {
            const parts = client.tax_id.split('-');
            nac = parts[0];
            num = parts.slice(1).join('');
        }
        setNewClient({
            type: client.type || 'persona',
            nacionalidad: nac,
            cedulaNumber: num,
            tax_id: client.tax_id || '',
            name: client.name || '',
            phone: client.phone || '',
            phone_secondary: client.phone_secondary || '',
            email: client.email || '',
            address: client.address || '',
            contact_person: client.contact_person || '',
            notes: client.notes || ''
        });
        setIsClientModalOpen(true);
    };

    // Función para consultar API CNE
    const handleConsultCne = async () => {
        const cedula = newClient.cedulaNumber.trim().replace(/\D/g, '');
        if (!cedula) {
            setCneAlert({ type: 'error', message: 'Por favor ingrese el número de cédula para consultar.' });
            return;
        }

        setIsConsultingCne(true);
        setCneAlert(null);

        try {
            const response = await axios.post('/clients/consult-cne', {
                nacionalidad: newClient.nacionalidad || 'V',
                cedula: cedula
            });

            if (response.data.success) {
                const fullName = response.data.full_name;
                const formattedId = response.data.rif || `${newClient.nacionalidad}-${cedula}`;
                const autoAddress = response.data.address || '';

                setNewClient(prev => ({
                    ...prev,
                    name: fullName || prev.name,
                    tax_id: formattedId,
                    address: autoAddress ? `${autoAddress}` : prev.address
                }));

                setCneAlert({
                    type: 'success',
                    message: `¡CNE Verificado! Nombre: ${fullName}`
                });
            } else {
                setCneAlert({
                    type: 'error',
                    message: response.data.message || 'Cédula no encontrada en el registro electoral.'
                });
            }
        } catch (err) {
            setCneAlert({
                type: 'error',
                message: err.response?.data?.message || 'Error de conexión al consultar el CNE.'
            });
        } finally {
            setIsConsultingCne(false);
        }
    };

    // Guardar o actualizar cliente en la base de datos
    const handleSubmitClient = (e) => {
        e.preventDefault();
        setIsSavingClient(true);

        const payload = {
            type: newClient.type,
            name: newClient.name,
            tax_id: newClient.tax_id,
            phone: newClient.phone,
            phone_secondary: newClient.phone_secondary || null,
            email: newClient.email,
            address: newClient.address,
            contact_person: newClient.contact_person || null,
            notes: newClient.notes
        };

        if (editingClient) {
            router.put(`/clients/${editingClient.id}`, payload, {
                onSuccess: () => {
                    setIsSavingClient(false);
                    setIsClientModalOpen(false);
                    setEditingClient(null);
                    setCneAlert(null);
                },
                onError: (err) => {
                    setIsSavingClient(false);
                    setCneAlert({
                        type: 'error',
                        message: 'Error al actualizar cliente: ' + Object.values(err).join(', ')
                    });
                }
            });
        } else {
            router.post('/clients', payload, {
                onSuccess: () => {
                    setIsSavingClient(false);
                    setIsClientModalOpen(false);
                    setCneAlert(null);
                    setNewClient({
                        type: 'persona',
                        nacionalidad: 'V',
                        cedulaNumber: '',
                        tax_id: '',
                        name: '',
                        phone: '',
                        phone_secondary: '',
                        email: '',
                        address: '',
                        contact_person: '',
                        notes: ''
                    });
                },
                onError: (err) => {
                    setIsSavingClient(false);
                    setCneAlert({
                        type: 'error',
                        message: 'Error al registrar cliente: ' + Object.values(err).join(', ')
                    });
                }
            });
        }
    };

    // Cerrar sesión
    const handleLogout = () => {
        if (confirm('¿Desea cerrar la sesión del sistema?')) {
            router.post('/logout');
        }
    };

    // Filtrar empresas emisoras registradas
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

    // Filtrar facturas del Libro Fiscal
    const filteredInvoices = invoices.filter(inv => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (inv.correlative_number && inv.correlative_number.toLowerCase().includes(q)) ||
            (inv.control_number && inv.control_number.toLowerCase().includes(q)) ||
            (inv.client?.name && inv.client.name.toLowerCase().includes(q)) ||
            (inv.client?.tax_id && inv.client.tax_id.toLowerCase().includes(q)) ||
            (inv.company?.name && inv.company.name.toLowerCase().includes(q))
        );
    });

    // Paginación de facturas (10 por página)
    const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / invoicePageSize));
    const paginatedInvoices = filteredInvoices.slice(
        (invoicePage - 1) * invoicePageSize,
        invoicePage * invoicePageSize
    );

    return (
        <div
            className="min-h-screen bg-[#F1F5F9] print:bg-white print:min-h-0 text-black flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white"
            style={{ zoom: isMobile ? '100%' : `${zoomLevel}%` }}
        >
            <Head title="Corpo Documents | Sistema de Facturación y Registro Multi-Empresa" />

            {/* TOP BAR CON ALINEACIÓN SIMÉTRICA Y PERFECTO ESPACIADO RESPONSIVE */}
            <header className="bg-white border-b-2 border-slate-300 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-40 shadow-xs no-print">

                {/* Logo & Marca del Sistema */}
                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                    <img
                        src="/images/corpoasia-square.png"
                        alt="Inversiones CorpoAsia C.A."
                        className="h-8 sm:h-9 w-auto object-contain shrink-0"
                    />
                    <div className="hidden xs:block h-6 w-px bg-slate-300"></div>
                    <div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <h1 className="text-xs sm:text-sm font-black tracking-tight text-black uppercase leading-none">
                                Corpo<span className="text-blue-700">Documents</span>
                            </h1>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 hidden xs:block mt-0.5">
                            Facturación & Control Fiscal
                        </span>
                    </div>
                </div>

                {/* Acciones de la Cabecera & Cerrar Sesión (Simétricos) */}
                <div className="flex items-center space-x-1.5 sm:space-x-3">
                    {/* SELECTOR DE TAMAÑO DE PANTALLA (Visible en pantallas medianas y grandes) */}
                    <div className="relative hidden md:block">
                        <button
                            type="button"
                            onClick={() => setIsZoomOpen(!isZoomOpen)}
                            className="h-9 flex items-center gap-2 bg-white hover:bg-slate-100 border-2 border-slate-300 text-black px-3 rounded-lg shadow-xs transition-colors font-black text-xs cursor-pointer"
                            title="Ajustar tamaño de letra y pantalla"
                        >
                            <Type className="w-4 h-4 text-slate-700 shrink-0" />
                            <span>Tamaño: <strong>{currentZoomOption.value}%</strong></span>
                            <ChevronDown className={`w-3.5 h-3.5 text-black transition-transform ${isZoomOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isZoomOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsZoomOpen(false)} />
                                <div className="absolute right-0 mt-1.5 w-60 bg-white border-2 border-black rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-200">
                                    <div className="p-2.5 bg-slate-100 flex items-center justify-between border-b border-slate-300">
                                        <span className="text-[11px] font-black uppercase text-black">
                                            Tamaño de Pantalla
                                        </span>
                                        <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">
                                            Zoom
                                        </span>
                                    </div>
                                    <div className="p-1.5 space-y-1">
                                        {zoomOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => {
                                                    handleZoomChange(opt.value);
                                                    setIsZoomOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs font-black transition-colors ${zoomLevel === opt.value
                                                    ? 'bg-black text-white'
                                                    : 'text-black hover:bg-slate-100'
                                                    }`}
                                            >
                                                <div>
                                                    <span className="block">{opt.label}</span>
                                                    <span className={`block text-[10px] font-bold ${zoomLevel === opt.value ? 'text-slate-300' : 'text-slate-700'
                                                        }`}>
                                                        {opt.desc}
                                                    </span>
                                                </div>
                                                {zoomLevel === opt.value && (
                                                    <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleNewInvoice}
                        className="h-8 sm:h-9 bg-blue-700 hover:bg-blue-800 text-white text-[11px] sm:text-xs font-black px-2.5 sm:px-4 rounded-lg flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                    >
                        <FilePlus2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">NUEVA FACTURA / PDF</span>
                        <span className="sm:hidden">Nueva</span>
                    </button>

                    <div className="h-5 sm:h-6 w-px bg-slate-300"></div>

                    <button
                        onClick={handleLogout}
                        className="h-8 sm:h-9 bg-white hover:bg-red-50 border-2 border-slate-300 hover:border-red-500 text-black hover:text-red-900 px-2 sm:px-3 rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Cerrar Sesión del Sistema"
                    >
                        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-700" />
                        <span className="hidden sm:inline">Salir</span>
                    </button>
                </div>
            </header>

            {/* BARRA DE NAVEGACIÓN SECUNDARIA RESPONSIVE */}
            <div className="bg-white border-b-2 border-slate-300 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 no-print">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 w-full sm:w-auto">
                    <button
                        onClick={() => setCurrentView('libro-fiscal')}
                        className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'libro-fiscal'
                            ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                            : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                            }`}
                    >
                        <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                        <span className="hidden md:inline">1. LIBRO FISCAL & FACTURAS</span>
                        <span className="md:hidden">1. Facturas</span>
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold ${currentView === 'libro-fiscal' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                            }`}>
                            {invoices.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setCurrentView('directorio')}
                        className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'directorio'
                            ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                            : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                            }`}
                    >
                        <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                        <span className="hidden md:inline">2. DIRECTORIO (EMPRESAS & CLIENTES)</span>
                        <span className="md:hidden">2. Directorio</span>
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold ${currentView === 'directorio' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-black'
                            }`}>
                            {companies.length} Emp · {clients.length} Clie
                        </span>
                    </button>

                    <button
                        onClick={() => setCurrentView('generador-pdf')}
                        className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${currentView === 'generador-pdf'
                            ? 'bg-black text-white shadow-xs ring-2 ring-blue-600'
                            : 'text-black hover:bg-slate-200 border-2 border-slate-300'
                            }`}
                    >
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                        <span className="hidden md:inline">3. TALLER DE EMISIÓN & PDF EN VIVO</span>
                        <span className="md:hidden">3. Taller PDF</span>
                    </button>
                </div>

                {/* Búsqueda solo cuando esté en libro-fiscal o directorio */}
                {currentView !== 'generador-pdf' ? (
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-800 absolute left-3 top-1/2 -translate-y-1/2 font-bold" />
                        <input
                            type="text"
                            placeholder="Buscar RIF, Cédula o Nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 sm:h-9 bg-white border-2 border-slate-400 text-xs font-bold rounded-lg pl-9 pr-3 w-full text-black placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs shrink-0">
                        <span className="text-xs font-bold text-slate-700 hidden sm:inline">Activo:</span>
                        <span className="text-xs font-mono font-black text-blue-900 bg-blue-50 border border-blue-300 px-2 sm:px-2.5 py-1 rounded-md uppercase text-[11px] truncate">
                            {getDocumentTypeInfo(invoiceForm.document_type).badgeText} • N° {projectedCorrelative}
                        </span>
                    </div>
                )}
            </div>

            {/* BANNER DE NOTIFICACIÓN FLASH */}
            {flash?.success && (
                <div className="bg-emerald-100 border-b-2 border-emerald-500 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-black text-emerald-950 no-print">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>{flash.success}</span>
                    </div>
                </div>
            )}

            {/* CONTENIDO PRINCIPAL RESPONSIVE */}
            <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0 print:bg-white">

                {/* MÉTRICAS CONTABLES: EN DISPOSITIVOS MÓVILES SE MUESTRAN EN CUADRÍCULA 2x2 CÓMODA */}
                {currentView !== 'generador-pdf' && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 no-print">
                        {/* Tarjeta 1: Total Facturado */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                                        Total Facturado (DB)
                                    </span>
                                    <div className="p-1 sm:p-2 bg-emerald-50 text-emerald-700 rounded-md sm:rounded-xl border border-emerald-200 shrink-0">
                                        <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                    </div>
                                </div>
                                <span className="text-base sm:text-2xl font-black text-black font-mono block truncate" title={`$${Number(stats.total_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}>
                                    ${Number(stats.total_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                                <span className="font-bold text-slate-600 hidden sm:inline">Acumulado en BD</span>
                                <span className="font-mono font-black text-emerald-800 bg-emerald-100/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                                    USD ($)
                                </span>
                            </div>
                        </div>

                        {/* Tarjeta 2: Documentos Emitidos */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                                        Documentos Emitidos
                                    </span>
                                    <div className="p-1 sm:p-2 bg-blue-50 text-blue-700 rounded-md sm:rounded-xl border border-blue-200 shrink-0">
                                        <Receipt className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                    </div>
                                </div>
                                <span className="text-base sm:text-2xl font-black text-blue-900 font-mono block truncate">
                                    {stats.invoices_count || invoices.length}
                                </span>
                            </div>
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                                <span className="font-bold text-slate-600 hidden sm:inline">Comprobantes válidos</span>
                                <span className="font-mono font-black text-blue-900 bg-blue-100/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                                    Registros
                                </span>
                            </div>
                        </div>

                        {/* Tarjeta 3: Empresas Emisoras */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                                        Empresas Emisoras
                                    </span>
                                    <button
                                        onClick={handleOpenCreateCompany}
                                        className="h-6 sm:h-7 px-1.5 sm:px-2.5 bg-black hover:bg-slate-800 text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0"
                                        title="Añadir nueva empresa emisora"
                                    >
                                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span className="hidden sm:inline">Empresa</span>
                                    </button>
                                </div>
                                <span className="text-base sm:text-2xl font-black text-black font-mono block truncate">
                                    {stats.companies_count || companies.length}
                                </span>
                            </div>
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                                <span className="font-bold text-slate-600 hidden sm:inline">Emisores en BD</span>
                                <span className="font-bold text-slate-800 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                                    Activas
                                </span>
                            </div>
                        </div>

                        {/* Tarjeta 4: Clientes Registrados */}
                        <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 p-2.5 sm:p-5 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all flex flex-col justify-between min-w-0 overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between gap-1.5 min-w-0 mb-1">
                                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 truncate min-w-0 flex-1">
                                        Clientes Registrados
                                    </span>
                                    <button
                                        onClick={handleOpenCreateClient}
                                        className="h-6 sm:h-7 px-1.5 sm:px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0"
                                        title="Añadir nuevo cliente"
                                    >
                                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span className="hidden sm:inline">Cliente</span>
                                    </button>
                                </div>
                                <span className="text-base sm:text-2xl font-black text-black font-mono block truncate">
                                    {stats.clients_count || clients.length}
                                </span>
                            </div>
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                                <span className="font-bold text-slate-600 hidden sm:inline">Directorio en BD</span>
                                <span className="font-mono font-black text-emerald-900 bg-emerald-100/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                                    Activos
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA 1: LIBRO DE FACTURACIÓN Y ARCHIVO */}
                {currentView === 'libro-fiscal' && (
                    <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">

                        {/* Cabecera de la tabla */}
                        <div className="p-3.5 sm:p-5 border-b-2 border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-100/70">
                            <div>
                                <h2 className="text-sm font-black text-black uppercase tracking-tight">
                                    Libro de Ventas & Registro Histórico de Facturas (Base de Datos)
                                </h2>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                    Facturas y proformas registradas con sus empresas emisoras, clientes y montos
                                </p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => window.print()}
                                    className="h-8 sm:h-9 px-3 sm:px-3.5 bg-white border-2 border-slate-400 hover:bg-slate-200 text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial"
                                >
                                    <Printer className="w-4 h-4 text-black" />
                                    <span>Imprimir Libro</span>
                                </button>
                                <button
                                    onClick={handleNewInvoice}
                                    className="h-8 sm:h-9 px-3.5 sm:px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-1 sm:flex-initial"
                                >
                                    <Plus className="w-4 h-4 text-white" />
                                    <span>Emitir Factura</span>
                                </button>
                            </div>
                        </div>

                        {/* Indicador de desplazamiento horizontal para móviles */}
                        <div className="md:hidden px-3.5 py-1.5 bg-blue-50 text-blue-900 border-b border-blue-200 text-[11px] font-bold flex items-center justify-between">
                            <span>↔ Desliza la tabla para ver todos los datos</span>
                            <ArrowUpDown className="w-3.5 h-3.5 rotate-90 text-blue-700" />
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                                <thead className="bg-slate-200 text-black uppercase text-xs font-black tracking-wider border-b-2 border-slate-400">
                                    <tr>
                                        <th className="px-5 py-3.5">Correlativo</th>
                                        <th className="px-4 py-3.5">Empresa Emisora</th>
                                        <th className="px-4 py-3.5">Cliente / Receptor</th>
                                        <th className="px-4 py-3.5">Tipo</th>
                                        <th className="px-4 py-3.5">Fecha</th>
                                        <th className="px-4 py-3.5">Tasa BS</th>
                                        <th className="px-4 py-3.5">Total USD</th>
                                        <th className="px-4 py-3.5">Total VES</th>
                                        <th className="px-4 py-3.5">Estado</th>
                                        <th className="px-5 py-3.5 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-200 font-medium">
                                    {paginatedInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-5 py-12 text-center text-slate-500 font-bold text-xs">
                                                No se encontraron documentos fiscales registrados
                                                {searchQuery && ` para la búsqueda "${searchQuery}"`}.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedInvoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-amber-50/50 transition-colors">
                                                <td className="px-5 py-4 font-mono font-black text-blue-900 text-sm">
                                                    {inv.correlative_number}
                                                    <span className="block text-[10px] font-bold text-slate-800">
                                                        Control: {inv.control_number || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        {inv.company?.logo_url && (
                                                            <img
                                                                src={inv.company.logo_url}
                                                                alt=""
                                                                className="h-7 w-7 object-contain rounded-md shrink-0 bg-white border border-slate-300 p-0.5 shadow-xs"
                                                            />
                                                        )}
                                                        <div>
                                                            <span className="font-black text-black block text-xs">
                                                                {inv.company?.name}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-800 font-bold">
                                                                {inv.company?.tax_id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 max-w-[200px]">
                                                    <span className="font-black text-black block text-xs">
                                                        {inv.client?.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-800 font-bold">
                                                        {inv.client?.tax_id}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 uppercase font-bold text-xs">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                                        inv.document_type === 'factura'
                                                            ? 'bg-blue-100 text-blue-900 border border-blue-400'
                                                            : inv.document_type === 'proforma'
                                                            ? 'bg-amber-100 text-amber-900 border border-amber-400'
                                                            : inv.document_type === 'cotizacion'
                                                            ? 'bg-purple-100 text-purple-900 border border-purple-400'
                                                            : 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                                                    }`}>
                                                        {getDocumentTypeInfo(inv.document_type).badgeText}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 font-mono font-bold text-slate-900">
                                                    {formatCaracasDate(inv.issue_date)}
                                                </td>
                                                <td className="px-4 py-4 font-mono text-xs font-bold text-slate-900">
                                                    Bs. {Number(inv.bcv_exchange_rate).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 font-mono font-black text-black text-sm">
                                                    ${Number(inv.total_usd).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 font-mono font-bold text-slate-900 text-xs">
                                                    Bs. {Number(inv.total_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-500">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleLoadInvoiceToEditor(inv)}
                                                            className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-300 text-black font-black border-2 border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                                                            title="Cargar y Ver en Visor A4"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>Ver</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleLoadInvoiceToEditor(inv);
                                                                setTimeout(() => handlePrintDocument(), 350);
                                                            }}
                                                            className="h-8 px-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black flex items-center gap-1 transition-colors cursor-pointer"
                                                            title="Imprimir / Descargar PDF"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span>PDF</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Barra de Paginación de 10 Filas por Página */}
                        <div className="p-3 sm:px-5 sm:py-3.5 border-t-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                            <div className="text-xs font-black text-slate-700 text-center sm:text-left">
                                {filteredInvoices.length === 0 ? (
                                    <span>0 documentos encontrados</span>
                                ) : (
                                    <span>
                                        Mostrando <strong className="text-black">{(invoicePage - 1) * invoicePageSize + 1}</strong> a{' '}
                                        <strong className="text-black">{Math.min(invoicePage * invoicePageSize, filteredInvoices.length)}</strong> de{' '}
                                        <strong className="text-black">{filteredInvoices.length}</strong> facturas (Pág. {invoicePage}/{totalInvoicePages})
                                    </span>
                                )}
                            </div>

                            {totalInvoicePages > 1 && (
                                <div className="flex items-center space-x-1.5 flex-wrap justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                                        disabled={invoicePage === 1}
                                        className="h-8 px-2.5 rounded-lg border-2 border-slate-300 text-xs font-black text-black bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        <span className="hidden xs:inline">Anterior</span>
                                    </button>

                                    {/* En pantallas móviles se muestra indicador numérico compacto */}
                                    <div className="flex sm:hidden items-center px-2 font-mono font-bold text-xs text-black">
                                        {invoicePage} / {totalInvoicePages}
                                    </div>

                                    {/* En pantallas sm y mayores se muestran todos los botones numéricos */}
                                    <div className="hidden sm:flex items-center space-x-1.5">
                                        {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).map(pageNumber => (
                                            <button
                                                key={pageNumber}
                                                type="button"
                                                onClick={() => setInvoicePage(pageNumber)}
                                                className={`h-8 w-8 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                                                    invoicePage === pageNumber
                                                        ? 'bg-blue-700 text-white shadow-xs'
                                                        : 'bg-white border-2 border-slate-300 text-black hover:bg-slate-200'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                                        disabled={invoicePage === totalInvoicePages}
                                        className="h-8 px-2.5 rounded-lg border-2 border-slate-300 text-xs font-black text-black bg-white hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        <span className="hidden xs:inline">Siguiente</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VISTA 2: DIRECTORIO COMPLETO (EMPRESAS EMISORAS & CLIENTES RECEPTORES) */}
                {currentView === 'directorio' && (
                    <div className="space-y-4">
                        {/* Barra de Navegación del Directorio: Separación clara entre Empresas Emisoras y Clientes */}
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

                            {/* Acciones y Subfiltros contextuales según la pestaña activa */}
                            {directorySection === 'empresas-emisoras' ? (
                                <button
                                    type="button"
                                    onClick={handleOpenCreateCompany}
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
                                        onClick={handleOpenCreateClient}
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
                                        Base de datos de personas naturales y jurídicas a quienes les vendemos y emitimos documentos fiscales. Puedes registrar nuevos clientes rápidamente con validación y autocompletado oficial mediante CNE / SENIAT.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* CONTENIDO SEGÚN LA PESTAÑA: EMPRESAS EMISORAS */}
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
                                            onClick={handleOpenCreateCompany}
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
                                                        {/* Cabecera de la Tarjeta de Empresa */}
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

                                                        {/* Cuadro de Secuencia y Correlativos */}
                                                        <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] grid grid-cols-2 gap-2 font-mono">
                                                            <div>
                                                                <span className="text-slate-600 block text-[10px] font-sans font-bold">Prefijo / Próx:</span>
                                                                <strong className="text-blue-900 font-black">
                                                                    {sprintfCorrelative(comp.invoice_prefix || 'F-', comp.next_correlative || 1)}
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600 block text-[10px] font-sans font-bold">Control:</span>
                                                                <strong className="text-slate-900 font-black">
                                                                    {sprintfControl(0, comp.next_control_number || 1)}
                                                                </strong>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Botones de acción */}
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
                                                                onClick={() => handleOpenEditCompany(comp)}
                                                                className="h-8 px-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                                title="Editar datos de esta empresa"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                                                                <span>Editar</span>
                                                            </button>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedCompanyId(comp.id);
                                                                setInvoiceForm(getEmptyInvoice(comp));
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

                        {/* CONTENIDO SEGÚN LA PESTAÑA: CLIENTES RECEPTORES */}
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
                                            onClick={handleOpenCreateClient}
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
                                                            <div className={`p-3 rounded-xl border ${client.type === 'empresa'
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
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditClient(client)}
                                                            className="h-8 px-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                            title="Editar datos del cliente"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                                                            <span>Editar</span>
                                                        </button>
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[130px]" title={client.notes || 'Cliente Registrado'}>
                                                            {client.notes || 'Cliente Registrado'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setInvoiceForm({
                                                                ...getEmptyInvoice(activeCompany),
                                                                client_id: client.id
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
                )}

                {/* VISTA 3: TALLER DE EMISIÓN 100% SINCRONIZADO EN TIEMPO REAL CON LA HOJA A4 */}
                {currentView === 'generador-pdf' && (
                    <div className="space-y-4 print:space-y-0">
                        {/* SELECTOR MÓVIL ENTRE FORMULARIO Y VISTA PREVIA A4 (Visible solo en pantallas < lg) */}
                        <div className="lg:hidden sticky top-[53px] z-30 bg-[#F1F5F9] pb-2 pt-1 -mx-1 px-1 no-print">
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border-2 border-slate-300 shadow-sm text-xs font-black">
                                <button
                                    type="button"
                                    onClick={() => setMobileEditorTab('formulario')}
                                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        mobileEditorTab === 'formulario'
                                            ? 'bg-blue-700 text-white shadow-xs'
                                            : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <FileText className="w-4 h-4 shrink-0" />
                                    <span>1. Formulario</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMobileEditorTab('preview')}
                                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        mobileEditorTab === 'preview'
                                            ? 'bg-blue-700 text-white shadow-xs'
                                            : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <Eye className="w-4 h-4 shrink-0" />
                                    <span>2. Hoja A4 en Vivo</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start print:block print:w-full print:m-0 print:p-0">

                            {/* COLUMNA IZQUIERDA (5 cols): FORMULARIO DE CARGA */}
                            <form onSubmit={handleSubmitInvoice} className={`lg:col-span-5 bg-white rounded-xl border-2 border-slate-300 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5 no-print ${mobileEditorTab === 'formulario' ? 'block' : 'hidden lg:block'}`}>
                                {/* Cabecera del Formulario con Selector Segmentado de Tipo de Documento */}
                                <div className="border-b-2 border-slate-200 pb-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-black uppercase tracking-tight">
                                                    Generar Factura o Proforma
                                                </h3>
                                                <p className="text-[11px] font-bold text-slate-600">
                                                    Edición en vivo sincronizada con la hoja física A4
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono font-black bg-blue-100 text-blue-900 border border-blue-400 px-2 py-0.5 rounded uppercase">
                                            {getDocumentTypeInfo(invoiceForm.document_type).badgeText}
                                        </span>
                                    </div>

                                    {/* Selector Segmentado de Tipo de Documento (2x2 en móviles, 1x4 en desktop) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-300 text-xs font-black">
                                    {[
                                        { id: 'factura', label: 'Factura' },
                                        { id: 'proforma', label: 'Proforma' },
                                        { id: 'cotizacion', label: 'Cotización' },
                                        { id: 'nota_entrega', label: 'Nota Entrega' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => handleDocumentTypeChange(t.id)}
                                            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer font-black text-xs ${invoiceForm.document_type === t.id
                                                ? 'bg-blue-700 text-white shadow-xs'
                                                : 'text-slate-800 hover:text-black hover:bg-slate-200'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SECCIÓN 1: EMPRESA EMISORA & CLIENTE */}
                            <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-300">
                                {/* Empresa Emisora */}
                                <div>
                                    <label className="text-xs font-black text-black block mb-1">
                                        Empresa Emisora (Logo y Membrete Oficial) *
                                    </label>
                                    <select
                                        value={invoiceForm.company_id}
                                        onChange={(e) => {
                                            const cid = Number(e.target.value);
                                            setSelectedCompanyId(cid);
                                            setInvoiceForm(prev => ({ ...prev, company_id: cid }));
                                        }}
                                        className="h-9 w-full bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} — RIF: {c.tax_id}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cliente Receptor */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-black text-black">
                                            Cliente / Adquiriente *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleOpenCreateClient}
                                            className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Nuevo Cliente (CNE)</span>
                                        </button>
                                    </div>
                                    <select
                                        value={invoiceForm.client_id || ''}
                                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, client_id: e.target.value ? Number(e.target.value) : '' }))}
                                        className="h-9 w-full bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        <option value="">-- Seleccionar Cliente Registrado --</option>
                                        {clients.map(cl => (
                                            <option key={cl.id} value={cl.id}>
                                                {cl.name} ({cl.tax_id})
                                            </option>
                                        ))}
                                    </select>

                                    {/* Chip resumen del cliente seleccionado o aviso si está vacío */}
                                    {currentSelectedClient ? (
                                        <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-2xs">
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="font-mono font-black text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                                                    {currentSelectedClient.tax_id}
                                                </span>
                                                <span className="font-bold text-slate-700 truncate text-[11px]">
                                                    {currentSelectedClient.address || currentSelectedClient.phone || 'Cliente Registrado'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0 uppercase">
                                                {currentSelectedClient.type === 'empresa' ? 'Jurídico' : 'Natural'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-2 bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 flex items-center justify-between">
                                            <span className="text-[11px] font-bold italic">Sin cliente seleccionado para esta factura.</span>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentView('directorio')}
                                                className="text-[11px] font-black text-blue-700 hover:text-blue-900 cursor-pointer"
                                            >
                                                Abrir Directorio →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECCIÓN 2: CONDICIONES COMERCIALES & TASA BS */}
                            <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-300">
                                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                                    Condiciones Comerciales & Tasa BS
                                </span>

                                {/* Fila 1: Fecha de Emisión y Tasa BS */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="min-w-0">
                                        <label className="text-xs font-black text-black block mb-1 truncate">
                                            Fecha de Emisión
                                        </label>
                                        <input
                                            type="date"
                                            value={invoiceForm.issue_date}
                                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, issue_date: e.target.value }))}
                                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label className="text-xs font-black text-black block mb-1 truncate">
                                            Tasa BS *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 select-none">
                                                Bs.
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={invoiceForm.bcv_exchange_rate}
                                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, bcv_exchange_rate: e.target.value === '' ? '' : Number(e.target.value) }))}
                                                className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg pl-8 pr-3 text-xs font-black text-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Fila 2: Condición de Venta y Canal de Venta */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-black text-black block truncate">
                                                Condición de Venta *
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            list="condiciones-list"
                                            value={invoiceForm.sale_condition}
                                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, sale_condition: e.target.value }))}
                                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            placeholder="Consignación / Contado..."
                                        />
                                        <datalist id="condiciones-list">
                                            <option value="Consignación" />
                                            <option value="A Consignación" />
                                            <option value="Venta de Contado" />
                                            <option value="Crédito 7 días" />
                                            <option value="Crédito 15 días" />
                                            <option value="Crédito 30 días" />
                                            <option value="Contra Entrega" />
                                            <option value="Anticipo 50%" />
                                        </datalist>

                                        {/* Chips de selección rápida de Condición de Venta */}
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {[
                                                { label: 'Consignación', val: 'Consignación' },
                                                { label: 'Contado', val: 'Venta de Contado' },
                                                { label: 'Crédito 15d', val: 'Crédito 15 días' },
                                                { label: 'Contra Entrega', val: 'Contra Entrega' },
                                            ].map(pill => (
                                                <button
                                                    key={pill.val}
                                                    type="button"
                                                    onClick={() => setInvoiceForm(prev => ({ ...prev, sale_condition: pill.val }))}
                                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                                        invoiceForm.sale_condition === pill.val
                                                            ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                                                            : 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300'
                                                    }`}
                                                >
                                                    {pill.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <label className="text-xs font-black text-black block mb-1 truncate">
                                            Canal de Venta
                                        </label>
                                        <input
                                            type="text"
                                            list="canales-list"
                                            value={invoiceForm.sales_channel}
                                            placeholder="Oficina / Presencial"
                                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, sales_channel: e.target.value }))}
                                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                        <datalist id="canales-list">
                                            <option value="Oficina / Presencial" />
                                            <option value="Tienda en Línea" />
                                            <option value="WhatsApp / Directo" />
                                            <option value="Distribuidor" />
                                            <option value="Mercado Libre" />
                                            <option value="Venta Telefónica" />
                                        </datalist>
                                    </div>
                                </div>

                                {/* Fila 3: Medio de Pago y N° Ref. de Pago */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="min-w-0">
                                        <label className="text-xs font-black text-black block mb-1 truncate">
                                            Medio de Pago
                                        </label>
                                        <input
                                            type="text"
                                            list="medios-pago-list"
                                            value={invoiceForm.payment_method}
                                            placeholder="PAGO MOVIL, ZELLE, ETC."
                                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_method: e.target.value.toUpperCase() }))}
                                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                        <datalist id="medios-pago-list">
                                            <option value="PAGO MOVIL" />
                                            <option value="TRANSFERENCIA BANCARIA" />
                                            <option value="ZELLE" />
                                            <option value="EFECTIVO (USD)" />
                                            <option value="EFECTIVO (BS)" />
                                            <option value="PUNTO DE VENTA" />
                                            <option value="DIVISAS" />
                                            <option value="MIXTO" />
                                        </datalist>
                                    </div>

                                    <div className="min-w-0">
                                        <label className="text-xs font-black text-black block mb-1 truncate">
                                            N° Ref. de Pago (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: 161773827..."
                                            value={invoiceForm.payment_reference || ''}
                                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                                            className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Fila 4: Subtítulo / Línea del Documento */}
                                <div>
                                    <label className="text-xs font-black text-black block mb-1 truncate">
                                        Subtítulo / Línea del Documento (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: LÍNEA MÁQUINAS, REPUESTOS, SERVICIOS..."
                                        value={invoiceForm.document_subtitle}
                                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, document_subtitle: e.target.value }))}
                                        className="h-9 w-full min-w-0 bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                </div>
                            </div>

                            {/* SECCIÓN 3: RENGLONES / ÍTEMS DINÁMICOS */}
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs font-black text-black">
                                            Renglones a Facturar
                                        </label>
                                        <span className="text-[11px] font-mono font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                                            {invoiceForm.items.length}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="h-8 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Añadir Renglón</span>
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                    {invoiceForm.items.map((it, idx) => (
                                        <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-xs space-y-2.5 shadow-2xs hover:border-slate-400 transition-colors">
                                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                <span className="font-black text-black text-xs flex items-center gap-1.5">
                                                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[11px]">
                                                        {idx + 1}
                                                    </span>
                                                    <span>Renglón #{idx + 1}</span>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <label className="inline-flex items-center gap-1 cursor-pointer text-[11px] font-bold text-slate-700 select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!it.is_tax_exempt}
                                                            onChange={(e) => handleItemChange(idx, 'is_tax_exempt', e.target.checked)}
                                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                                        />
                                                        <span>Exento IVA</span>
                                                    </label>
                                                    {invoiceForm.items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="h-6 px-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 rounded text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                                                            title="Eliminar este renglón"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            <span>Quitar</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Descripción del producto o servicio *"
                                                    required
                                                    value={it.description}
                                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-3 text-xs font-black text-black placeholder:text-slate-500"
                                                />
                                            </div>

                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Detalles técnicos / especificaciones (opcional)..."
                                                    value={it.details || ''}
                                                    onChange={(e) => handleItemChange(idx, 'details', e.target.value)}
                                                    className="h-7 w-full bg-white border border-slate-200 rounded-md px-2.5 text-[11px] font-bold text-slate-800 placeholder:text-slate-400"
                                                />
                                            </div>

                                            {/* Foto / Imagen del Producto (Opcional según solicitud del cliente) */}
                                            <div className="pt-0.5">
                                                {it.image_url ? (
                                                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                                                        <div className="w-12 h-12 rounded-md border border-slate-300 bg-slate-50 p-0.5 flex items-center justify-center shrink-0">
                                                            <img
                                                                src={it.image_url}
                                                                alt="Foto del producto"
                                                                className="max-h-full max-w-full object-contain rounded"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-800">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                <span>Foto cargada para el PDF</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 truncate">
                                                                Se mostrará junto a la descripción del renglón en la cotización/proforma.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleItemChange(idx, 'image_url', null)}
                                                            className="text-[11px] font-black text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer shrink-0 transition-colors"
                                                            title="Eliminar foto de este producto"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                                                            <Camera className="w-3.5 h-3.5 text-blue-700" />
                                                            <span>Añadir foto del producto (Opcional)</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onload = (ev) => {
                                                                            handleItemChange(idx, 'image_url', ev.target.result);
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                        <span className="text-[10px] text-slate-500 italic hidden sm:inline">
                                                            Ej: bicicleta, generador, ventilador, maquinaria...
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                                                <div>
                                                    <span className="text-black block mb-0.5 text-[11px]">Cant.</span>
                                                    <div className="flex items-center border border-slate-300 rounded-md bg-white overflow-hidden h-8">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleItemChange(idx, 'quantity', Math.max(1, Number(it.quantity || 1) - 1))}
                                                            className="px-2 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={it.quantity}
                                                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                            className="w-full text-center font-mono font-black text-xs py-1 text-black border-0 focus:ring-0 p-0"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleItemChange(idx, 'quantity', Number(it.quantity || 0) + 1)}
                                                            className="px-2 h-full text-slate-700 hover:bg-slate-200 text-xs font-black cursor-pointer select-none"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-black block mb-0.5 text-[11px]">Unidad</span>
                                                    <input
                                                        type="text"
                                                        value={it.unit}
                                                        placeholder="unid"
                                                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                                        className="h-8 w-full bg-white border border-slate-300 rounded-md px-2 text-center font-mono font-black text-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <span className="text-black block mb-0.5 text-[11px]">P. Unit ($)</span>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={it.unit_price}
                                                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                                                            className="h-8 w-full bg-white border border-slate-300 rounded-md pl-5 pr-2 text-right font-mono font-black text-xs text-black"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-black block mb-0.5 text-[11px]">Total ($)</span>
                                                    <div className="h-8 flex items-center justify-end px-2 bg-blue-50 border border-blue-200 rounded-md font-mono font-black text-blue-900 text-xs">
                                                        ${(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECCIÓN 4: PARÁMETROS ESPECÍFICOS DE PROFORMA INDUSTRIAL (FORMATO 2) */}
                            {selectedPdfFormat === 'formato-2' && (
                                <div className="space-y-4 p-4 bg-amber-50/40 rounded-xl border-2 border-amber-300">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="w-4 h-4 text-amber-600" />
                                            <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                                Ficha Técnica & Condiciones DDP (Formato 2)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleResetDefaultTechSpecs}
                                            className="text-[11px] font-black text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                                            title="Restaurar valores de prueba Moaiven CAT 320C L"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Restaurar Ficha Moaiven</span>
                                        </button>
                                    </div>

                                    {/* Subsección 1: Identificadores y Logística */}
                                    <div className="space-y-2.5 pt-1">
                                        <span className="text-[11px] font-black text-slate-700 block uppercase">
                                            1. Identificadores del Equipo y Entrega
                                        </span>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="text-[11px] font-black text-black block mb-0.5">
                                                    Año de Fabricación
                                                </label>
                                                <input
                                                    type="text"
                                                    value={invoiceForm.equipment_year || ''}
                                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, equipment_year: e.target.value }))}
                                                    placeholder="2021 / Reciente..."
                                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-black block mb-0.5">
                                                    N° de Serie / VIN
                                                </label>
                                                <input
                                                    type="text"
                                                    value={invoiceForm.equipment_vin || ''}
                                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, equipment_vin: e.target.value }))}
                                                    placeholder="CAT0320CL089124..."
                                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="text-[11px] font-black text-black block mb-0.5">
                                                    Validez de Oferta (Días)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={invoiceForm.offer_validity_days || 15}
                                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, offer_validity_days: Number(e.target.value) }))}
                                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-mono font-bold text-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-black block mb-0.5">
                                                    Aduana y Nacionalización
                                                </label>
                                                <input
                                                    type="text"
                                                    value={invoiceForm.customs_text || ''}
                                                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, customs_text: e.target.value }))}
                                                    placeholder="INCLUIDO o monto..."
                                                    className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-black block mb-0.5">
                                                Dirección de Entrega en Destino (DDP)
                                            </label>
                                            <input
                                                type="text"
                                                value={invoiceForm.delivery_address || ''}
                                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                                                placeholder="Ej: Puerto Cabello / Barinas (dejar vacío para usar la del cliente)"
                                                className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-black block mb-0.5">
                                                Usuario Redes / TikTok de la Empresa
                                            </label>
                                            <input
                                                type="text"
                                                value={invoiceForm.company_social_handle || ''}
                                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, company_social_handle: e.target.value }))}
                                                placeholder="Ej: @moaiven.logistic"
                                                className="h-8 w-full bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-black"
                                            />
                                        </div>
                                    </div>

                                    {/* Subsección 2: Condiciones de Pago DDP */}
                                    <div className="space-y-2.5 pt-2 border-t border-amber-200">
                                        <span className="text-[11px] font-black text-slate-700 block uppercase">
                                            2. Condiciones de Pago (Hitos 70% / 30% o Personalizado)
                                        </span>
                                        
                                        {/* Hito 1 */}
                                        <div className="p-2.5 bg-white rounded-lg border border-slate-300 space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-black text-black">Hito 1 (Anticipo):</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={invoiceForm.payment_milestone_1_pct ?? 70}
                                                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_1_pct: Number(e.target.value) }))}
                                                        className="h-7 w-16 text-center font-mono font-black border border-slate-300 rounded px-1 text-xs"
                                                    />
                                                    <span className="font-bold text-slate-700">%</span>
                                                    <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] ml-1">
                                                        USD ${(totalUsd * (Number(invoiceForm.payment_milestone_1_pct || 70) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={invoiceForm.payment_milestone_1_text || ''}
                                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_1_text: e.target.value }))}
                                                placeholder="Descripción del hito 1..."
                                                className="h-7 w-full bg-slate-50 border border-slate-200 rounded px-2 text-[11px] font-medium text-slate-800"
                                            />
                                        </div>

                                        {/* Hito 2 */}
                                        <div className="p-2.5 bg-white rounded-lg border border-slate-300 space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-black text-black">Hito 2 (Saldo):</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={invoiceForm.payment_milestone_2_pct ?? 30}
                                                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_2_pct: Number(e.target.value) }))}
                                                        className="h-7 w-16 text-center font-mono font-black border border-slate-300 rounded px-1 text-xs"
                                                    />
                                                    <span className="font-bold text-slate-700">%</span>
                                                    <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] ml-1">
                                                        USD ${(totalUsd * (Number(invoiceForm.payment_milestone_2_pct || 30) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={invoiceForm.payment_milestone_2_text || ''}
                                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_milestone_2_text: e.target.value }))}
                                                placeholder="Descripción del hito 2..."
                                                className="h-7 w-full bg-slate-50 border border-slate-200 rounded px-2 text-[11px] font-medium text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    {/* Subsección 3: Condiciones de Carga y Envío */}
                                    <div className="space-y-1.5 pt-2 border-t border-amber-200">
                                        <label className="text-[11px] font-black text-slate-700 block uppercase">
                                            3. Condiciones de Carga y Envío (Marítimo / Origen)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={invoiceForm.shipping_terms_notes || ''}
                                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, shipping_terms_notes: e.target.value }))}
                                            placeholder="Cláusula de tiempo de carga en puerto, booking, etc."
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>

                                    {/* Subsección 4: Ficha Técnica Dinámica del Equipo */}
                                    <div className="space-y-2 pt-2 border-t border-amber-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-slate-700 uppercase">
                                                4. Ficha Técnica del Equipo ({invoiceForm.technical_specs?.length || 0} filas)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleAddTechSpec}
                                                className="h-7 px-2.5 bg-slate-900 hover:bg-black text-white rounded-md text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Añadir Fila</span>
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {(invoiceForm.technical_specs || []).map((spec, idx) => (
                                                <div key={idx} className="p-2 bg-white rounded-lg border border-slate-300 space-y-1 shadow-2xs">
                                                    <div className="flex justify-between items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Categoría (Ej: Motor, Operativas, Dimensiones...)"
                                                            value={spec.category || ''}
                                                            onChange={(e) => handleTechSpecChange(idx, 'category', e.target.value)}
                                                            className="h-6 w-full bg-slate-100 border border-slate-200 rounded px-2 text-[10px] font-black text-slate-800 uppercase"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTechSpec(idx)}
                                                            className="h-6 px-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                                                            title="Eliminar especificación"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="Parámetro (Ej: Marca y modelo)"
                                                            value={spec.name || ''}
                                                            onChange={(e) => handleTechSpecChange(idx, 'name', e.target.value)}
                                                            className="col-span-5 h-6 bg-white border border-slate-300 rounded px-1.5 text-[11px] font-bold text-black"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Detalle (Ej: Mitsubishi 3066 TAA)"
                                                            value={spec.value || ''}
                                                            onChange={(e) => handleTechSpecChange(idx, 'value', e.target.value)}
                                                            className="col-span-7 h-6 bg-white border border-slate-300 rounded px-1.5 text-[11px] font-medium text-slate-900"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN 5: DESGLOSE FISCAL & LIQUIDACIÓN */}
                            <div className="border-t-2 border-slate-200 pt-3 space-y-2 text-xs font-mono font-black">
                                <div className="flex justify-between items-center text-black">
                                    <span>Subtotal Renglones:</span>
                                    <span>${itemsSubtotal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-black">
                                    <span>Flete / Delivery ($):</span>
                                    <div className="relative w-28">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={invoiceForm.shipping_cost}
                                            onChange={(e) => setInvoiceForm(prev => ({ ...prev, shipping_cost: Number(e.target.value) }))}
                                            className="h-8 w-full bg-white border border-slate-300 rounded-md pl-6 pr-2 text-right font-mono font-black text-xs text-black"
                                        />
                                    </div>
                                </div>

                                {/* Alícuota IVA con toggle rápido de 0% Neto y 16% Fiscal */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                    <div className="flex justify-between items-center text-black">
                                        <div className="flex items-center gap-1.5">
                                            <span>Alícuota IVA:</span>
                                            {Number(invoiceForm.tax_percentage) === 0 ? (
                                                <span className="text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                                    0% NETO
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-mono font-black bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded border border-blue-300">
                                                    {Number(invoiceForm.tax_percentage)}% IVA
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative w-20">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={invoiceForm.tax_percentage}
                                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, tax_percentage: Number(e.target.value) }))}
                                                className="h-8 w-full bg-white border border-slate-300 rounded-md pr-6 pl-2 text-right font-mono font-black text-xs text-black"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">%</span>
                                        </div>
                                    </div>

                                    {/* Botones de acción rápida: 0% NETO (Sin IVA) / 16% IVA FISCAL */}
                                    <div className="grid grid-cols-2 gap-1.5 font-sans">
                                        <button
                                            type="button"
                                            onClick={() => setInvoiceForm(prev => ({ ...prev, tax_percentage: 0 }))}
                                            className={`py-1 px-2 rounded-lg text-center text-[11px] font-black transition-all cursor-pointer border ${
                                                Number(invoiceForm.tax_percentage) === 0
                                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                                                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                                            }`}
                                        >
                                            0% Neto (Sin IVA)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInvoiceForm(prev => ({ ...prev, tax_percentage: 16.00 }))}
                                            className={`py-1 px-2 rounded-lg text-center text-[11px] font-black transition-all cursor-pointer border ${
                                                Number(invoiceForm.tax_percentage) === 16
                                                    ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                                                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                                            }`}
                                        >
                                            16% IVA Fiscal
                                        </button>
                                    </div>
                                </div>

                                {/* Banner de Gran Total */}
                                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1.5 shadow-sm">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                                            TOTAL FACTURA (USD)
                                        </span>
                                        <span className="text-2xl font-mono font-black text-emerald-400">
                                            ${totalUsd.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-700 text-xs">
                                        <span className="font-bold text-slate-300">Total en Bolívares (VES):</span>
                                        <span className="font-mono font-black text-white text-base">
                                            Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón Móvil para Ver la Hoja A4 directamente */}
                            <div className="lg:hidden pt-1">
                                <button
                                    type="button"
                                    onClick={() => setMobileEditorTab('preview')}
                                    className="w-full h-11 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <Eye className="w-4 h-4 text-sky-400" />
                                    <span>Ver Vista Previa de la Hoja A4 →</span>
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingInvoice}
                                className="h-12 w-full bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 text-emerald-300" />
                                <span>{isSubmittingInvoice ? 'Guardando en BD...' : 'GUARDAR FACTURA EN BASE DE DATOS'}</span>
                            </button>
                        </form>

                        {/* COLUMNA DERECHA (7 cols): HOJA FÍSICA A4 100% SINCRONIZADA EN TIEMPO REAL */}
                        <div className={`lg:col-span-7 space-y-4 print:space-y-0 print:!w-full print:!m-0 print:!p-0 print:!block ${mobileEditorTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                            {/* Botón Móvil para Regresar al Formulario */}
                            <div className="lg:hidden flex items-center justify-between pb-1 no-print">
                                <button
                                    type="button"
                                    onClick={() => setMobileEditorTab('formulario')}
                                    className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs"
                                >
                                    <span>← Volver al Formulario</span>
                                </button>
                                <span className="text-[11px] font-bold text-slate-500">
                                    Vista Hoja A4
                                </span>
                            </div>

                            {/* BARRA SUPERIOR DE CONTROL CON SELECTOR DE FORMATO 1 / FORMATO 2 */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print bg-white p-3 rounded-xl border border-slate-300 shadow-2xs">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase tracking-wider">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>Plantilla:</span>
                                    </div>
                                    
                                    {/* Selector de Formato 1 (Fiscal Agrosuministros) / Formato 2 (Industrial Moaiven) */}
                                    <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs font-black">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPdfFormat('formato-1')}
                                            className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                selectedPdfFormat === 'formato-1'
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'text-slate-800 hover:text-black hover:bg-slate-200'
                                            }`}
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Formato 1: Fiscal</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPdfFormat('formato-2')}
                                            className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                selectedPdfFormat === 'formato-2'
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'text-slate-800 hover:text-black hover:bg-slate-200'
                                            }`}
                                        >
                                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Formato 2: Industrial</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handlePrintDocument}
                                        className="h-8 sm:h-9 px-3.5 bg-white border-2 border-slate-400 hover:bg-slate-200 text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors flex-1 sm:flex-initial"
                                    >
                                        <Printer className="w-4 h-4 text-black" />
                                        <span>Imprimir</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePrintDocument}
                                        className="h-8 sm:h-9 px-3.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors flex-1 sm:flex-initial"
                                    >
                                        <Download className="w-4 h-4 text-white" />
                                        <span>Guardar PDF</span>
                                    </button>
                                </div>
                            </div>

                            {/* CONTENEDOR DE HOJA FÍSICA A4 EN VIVO (CON SCROLL HORIZONTAL FLUIDO EN SMARTPHONES) */}
                            <div className="overflow-x-auto -mx-2 sm:mx-0 p-1 sm:p-0 print:overflow-visible print:!m-0 print:!p-0 print:!w-full">
                                <div className="min-w-[620px] lg:min-w-0 bg-white rounded-lg shadow-sm p-4 sm:p-8 md:p-10 text-slate-900 text-xs font-sans relative printable-sheet border border-slate-200 print:min-w-0 print:!w-full print:!m-0 print:!p-0 print:!border-none print:!shadow-none print:!rounded-none print:!bg-white">

                                {selectedPdfFormat === 'formato-1' ? (
                                    /* ========================================================================= */
                                    /* FORMATO 1: FISCAL ESTÁNDAR (ESTRUCTURA 1:1 AGROSUMINISTROS RODRÍGUEZ)     */
                                    /* ========================================================================= */
                                    <div>
                                        {/* 1. CABECERA / MEMBRETE INSTITUCIONAL */}
                                        <div className="flex justify-between items-center gap-4 pb-4">
                                            {/* Lado Izquierdo: Logo Oficial CorpoAsia y Datos de la Empresa Emisora (Centrados y Simétricos) */}
                                            <div className="flex items-center gap-4 max-w-[430px]">
                                                <img
                                                    src="/images/corpoasia-square.png"
                                                    alt="Inversiones CorpoAsia C.A."
                                                    className="h-22 sm:h-26 w-auto max-w-[115px] object-contain shrink-0"
                                                />

                                                <div className="space-y-0.5 min-w-0">
                                                    <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">
                                                        {activeCompany.name}
                                                    </h1>
                                                    <p className="text-xs font-bold text-slate-900">
                                                        RIF: {activeCompany.tax_id}
                                                    </p>
                                                    <p className="text-xs text-slate-700 leading-tight">
                                                        {activeCompany.address}
                                                    </p>
                                                    <p className="text-xs text-slate-700">
                                                        Teléfono / WhatsApp: {activeCompany.phone}
                                                    </p>
                                                    {activeCompany.email && (
                                                        <p className="text-xs text-slate-700">
                                                            Email: {activeCompany.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Lado Derecho: Título de Factura, Correlativo, Fecha y Control */}
                                            <div className="text-right shrink-0">
                                                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-wide leading-none">
                                                    {getDocumentTypeInfo(invoiceForm.document_type).title}
                                                </h2>
                                                {invoiceForm.document_subtitle && (
                                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 mt-0.5">
                                                        {invoiceForm.document_subtitle}
                                                    </p>
                                                )}
                                                <p className="text-base font-mono font-black text-slate-900 mt-1.5 leading-none">
                                                    N° {projectedCorrelative}
                                                </p>
                                                <p className="text-xs text-slate-800 mt-2">
                                                    <span className="font-bold">Fecha:</span> {invoiceForm.issue_date}
                                                </p>
                                                <p className="text-xs text-slate-800 mt-0.5">
                                                    <span className="font-bold">{getDocumentTypeInfo(invoiceForm.document_type).controlLabel}:</span> {projectedControlNumber}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Línea Divisoria Sólida Superior */}
                                        <div className="border-b-2 border-slate-950 mb-5"></div>

                                        {/* 2. DATOS DEL CLIENTE Y CONDICIONES DE LA VENTA (2 COLUMNAS 1:1) */}
                                        <div className="grid grid-cols-2 gap-8 text-xs pb-4 mb-4 border-b border-slate-300">
                                            {/* Columna Izquierda: Datos del Adquiriente */}
                                            <div>
                                                <h3 className="font-black uppercase text-slate-950 text-xs mb-2 tracking-wide">
                                                    DATOS DEL ADQUIRIENTE / CLIENTE
                                                </h3>
                                                {currentSelectedClient ? (
                                                    <div className="space-y-1">
                                                        <div className="grid grid-cols-12 gap-1">
                                                            <span className="col-span-4 text-slate-600 font-bold">Cliente:</span>
                                                            <span className="col-span-8 font-bold text-slate-950 uppercase">{currentSelectedClient.name}</span>
                                                        </div>
                                                        <div className="grid grid-cols-12 gap-1">
                                                            <span className="col-span-4 text-slate-600 font-bold">Cédula / RIF:</span>
                                                            <span className="col-span-8 font-mono font-bold text-slate-950">{currentSelectedClient.tax_id}</span>
                                                        </div>
                                                        <div className="grid grid-cols-12 gap-1">
                                                            <span className="col-span-4 text-slate-600 font-bold">Teléfono:</span>
                                                            <span className="col-span-8 text-slate-900">{currentSelectedClient.phone || 'N/A'}</span>
                                                        </div>
                                                        {currentSelectedClient.address && (
                                                            <div className="grid grid-cols-12 gap-1">
                                                                <span className="col-span-4 text-slate-600 font-bold">Dirección:</span>
                                                                <span className="col-span-8 text-slate-800">{currentSelectedClient.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="py-1 text-slate-500 italic">
                                                        [ Cliente no seleccionado en el formulario ]
                                                    </div>
                                                )}
                                            </div>

                                            {/* Columna Derecha: Condiciones de la Venta */}
                                            <div>
                                                <h3 className="font-black uppercase text-slate-950 text-xs mb-2 tracking-wide">
                                                    CONDICIONES DE LA VENTA
                                                </h3>
                                                <div className="space-y-1">
                                                    <div className="grid grid-cols-12 gap-1">
                                                        <span className="col-span-4 text-slate-600 font-bold">Condición:</span>
                                                        <span className="col-span-8 font-bold text-slate-950">{invoiceForm.sale_condition}</span>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-1">
                                                        <span className="col-span-4 text-slate-600 font-bold">Canal:</span>
                                                        <span className="col-span-8 font-bold text-slate-950">{invoiceForm.sales_channel || 'Oficina / Presencial'}</span>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-1">
                                                        <span className="col-span-4 text-slate-600 font-bold">Tasa BS:</span>
                                                        <span className="col-span-8 font-mono font-bold text-slate-950">
                                                            Bs. {Number(invoiceForm.bcv_exchange_rate || 876.80).toFixed(2)} / USD
                                                        </span>
                                                    </div>
                                                    {(invoiceForm.document_type === 'proforma' || invoiceForm.document_type === 'cotizacion') && (
                                                        <div className="grid grid-cols-12 gap-1">
                                                            <span className="col-span-4 text-slate-600 font-bold">Validez:</span>
                                                            <span className="col-span-8 font-bold text-blue-900">
                                                                {invoiceForm.offer_validity_days || 8} días continuos
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. TABLA DE RENGLONES Y PRODUCTOS */}
                                        <div className="mb-6">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="border-t-2 border-b-2 border-slate-950 uppercase font-black text-slate-950 text-xs">
                                                    <tr>
                                                        <th className="py-2.5 px-2 w-8 text-center">#</th>
                                                        <th className="py-2.5 px-3">DESCRIPCIÓN DEL PRODUCTO</th>
                                                        <th className="py-2.5 px-3 text-center w-24">CANT.</th>
                                                        <th className="py-2.5 px-3 text-right w-28">PRECIO UNIT. ($)</th>
                                                        <th className="py-2.5 px-3 text-right w-28">TOTAL ($)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {invoiceForm.items.map((it, idx) => (
                                                        <tr key={idx}>
                                                            <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">{idx + 1}</td>
                                                            <td className="py-3 px-3">
                                                                <div className="flex items-start gap-3">
                                                                    {it.image_url && (
                                                                        <div className="shrink-0 w-14 h-14 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center shadow-2xs">
                                                                            <img
                                                                                src={it.image_url}
                                                                                alt={it.description}
                                                                                className="max-h-full max-w-full object-contain rounded"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                        <span className="font-bold text-slate-950 block">
                                                                            {it.description || '[ Renglón pendiente por describir ]'}
                                                                        </span>
                                                                        {it.details && (
                                                                            <span className="text-[11px] text-slate-600 block mt-0.5 whitespace-pre-line">
                                                                                {it.details}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                                                                {it.quantity} {it.unit}
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                                                ${Number(it.unit_price || 0).toFixed(2)} {it.unit && <span className="text-[10px] text-slate-500 font-normal">/{it.unit}</span>}
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-mono font-black text-slate-950">
                                                                ${(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}
                                                                {it.is_tax_exempt && (
                                                                    <span className="text-[10px] text-blue-900 font-black ml-1">(E)</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="border-b border-slate-300"></div>
                                        </div>

                                        {/* 4. FORMA DE PAGO Y LIQUIDACIÓN DE TOTALES */}
                                        <div className="grid grid-cols-2 gap-8 text-xs mb-8 items-start">
                                            <div>
                                                <h3 className="font-black uppercase text-slate-950 text-xs mb-2 tracking-wide">
                                                    FORMA DE PAGO
                                                </h3>
                                                <p className="text-slate-800">
                                                    <span className="text-slate-600 font-bold">Medio:</span>{' '}
                                                    <span className="font-black text-slate-950 uppercase">{invoiceForm.payment_method || 'PAGO MOVIL'}</span>
                                                </p>
                                                {invoiceForm.payment_reference && (
                                                    <p className="text-slate-800 mt-1">
                                                        <span className="text-slate-600 font-bold">Ref:</span>{' '}
                                                        <span className="font-mono font-bold text-slate-950">{invoiceForm.payment_reference}</span>
                                                    </p>
                                                )}
                                                <div className="border-l-2 border-slate-400 pl-2.5 mt-3 py-0.5 text-[10px] text-slate-600 italic leading-snug">
                                                    Monto en Bolívares (VES) calculado según la Tasa BS indicada a la fecha de la transacción.
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 font-mono text-right text-xs">
                                                <div className="flex justify-between py-1 border-b border-slate-200">
                                                    <span className="font-sans font-bold text-slate-700">Subtotal:</span>
                                                    <span className="font-bold text-slate-900">${itemsSubtotal.toFixed(2)}</span>
                                                </div>
                                                {Number(invoiceForm.shipping_cost || 0) > 0 && (
                                                    <div className="flex justify-between py-1 border-b border-slate-200">
                                                        <span className="font-sans font-bold text-slate-700">Flete / Delivery:</span>
                                                        <span className="font-bold text-slate-900">${Number(invoiceForm.shipping_cost).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between py-1 border-b-2 border-slate-950">
                                                    <span className="font-sans font-bold text-slate-700">
                                                        {Number(invoiceForm.tax_percentage) === 0 ? 'IVA (0% Exento / Neto):' : `IVA (${Number(invoiceForm.tax_percentage)}%):`}
                                                    </span>
                                                    <span className="font-bold text-slate-900">${taxAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 text-sm font-black">
                                                    <span className="font-sans">TOTAL USD:</span>
                                                    <span className="text-slate-950">${totalUsd.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold text-blue-900 pt-0.5">
                                                    <span className="font-sans font-bold text-slate-700">TOTAL VES:</span>
                                                    <span>Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. TÉRMINOS Y CONDICIONES DE ENTREGA & FIRMAS */}
                                        <div className="pt-4 border-t border-slate-300 text-xs">
                                            <div className="grid grid-cols-2 gap-8 items-end">
                                                <div>
                                                    <h3 className="font-black uppercase text-slate-950 text-xs mb-1 tracking-wide">
                                                        TÉRMINOS Y CONDICIONES DE ENTREGA
                                                    </h3>
                                                    <p className="text-[10px] text-slate-600 leading-relaxed">
                                                        {invoiceForm.terms_conditions || activeCompany.default_terms || 'Comprobante generado por el sistema. Para devoluciones o reclamos conserve este documento. Plazo máximo de reclamación: 3 días hábiles desde la fecha de emisión.'}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-center text-[10px] font-black uppercase text-slate-900">
                                                    <div>
                                                        <div className="border-t border-dashed border-slate-400 pt-2 mb-1"></div>
                                                        <span>FIRMA Y SELLO EMISOR</span>
                                                    </div>
                                                    <div>
                                                        <div className="border-t border-dashed border-slate-400 pt-2 mb-1"></div>
                                                        <span>RECIBIDO CONFORME</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* ========================================================================= */
                                    /* FORMATO 2: PROFORMA INDUSTRIAL / IMPORTACIÓN (ESTRUCTURA 1:1 MOAIVEN)     */
                                    /* ========================================================================= */
                                    <div className="text-slate-900 text-xs">

                                        {/* ---------- PÁGINA 1: FICHA TÉCNICA & DATOS DEL CLIENTE ---------- */}
                                        <div className="space-y-4">
                                            {/* Cabecera Moaiven / Industrial */}
                                            <div className="flex justify-between items-center gap-4 pb-2">
                                                {/* Lado Izquierdo: Logo Oficial CorpoAsia y Datos de la Empresa Emisora (Centrados y Simétricos) */}
                                                <div className="flex items-center gap-4 max-w-[430px]">
                                                    <img
                                                        src="/images/corpoasia-square.png"
                                                        alt="Inversiones CorpoAsia C.A."
                                                        className="h-22 sm:h-26 w-auto max-w-[115px] object-contain shrink-0"
                                                    />
                                                    <div className="space-y-0.5 min-w-0">
                                                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">
                                                            {activeCompany.name}
                                                        </h1>
                                                        <p className="text-xs font-bold text-slate-800">
                                                            RIF: {activeCompany.tax_id}
                                                        </p>
                                                        <p className="text-xs text-slate-600 leading-tight">
                                                            {activeCompany.address}
                                                        </p>
                                                        <p className="text-xs text-slate-600">
                                                            Teléfono / WhatsApp: {activeCompany.phone}
                                                        </p>
                                                        {activeCompany.email && (
                                                            <p className="text-xs text-slate-600">
                                                                Email: {activeCompany.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <h2 className="text-3xl font-black text-[#0E1C33] tracking-tight leading-none uppercase">
                                                        {getDocumentTypeInfo(invoiceForm.document_type).title}
                                                    </h2>
                                                    <p className="text-xs font-black text-[#C9A227] tracking-wider uppercase mt-1">
                                                        {invoiceForm.document_subtitle || getDocumentTypeInfo(invoiceForm.document_type).defaultSubtitle}
                                                    </p>
                                                    <div className="text-xs text-slate-800 space-y-1 mt-3">
                                                        <p>
                                                            <span className="font-medium text-slate-600">{getDocumentTypeInfo(invoiceForm.document_type).correlativeLabel}:</span>{' '}
                                                            <span className="font-mono font-black text-[#0E1C33]">{projectedCorrelative}</span>
                                                        </p>
                                                        <p>
                                                            <span className="font-medium text-slate-600">Fecha de emisión:</span>{' '}
                                                            <span className="font-mono font-bold">{invoiceForm.issue_date}</span>
                                                        </p>
                                                        <p>
                                                            <span className="font-medium text-slate-600">Validez de la oferta:</span>{' '}
                                                            <span className="font-bold">{invoiceForm.offer_validity_days || 8} días</span>
                                                        </p>
                                                        <p>
                                                            <span className="font-medium text-slate-600">{getDocumentTypeInfo(invoiceForm.document_type).controlLabel}:</span>{' '}
                                                            <span className="font-mono font-bold">{projectedControlNumber}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Franja Dorada Gruesa Distintiva Moaiven */}
                                            <div className="h-2.5 bg-[#C9A227] my-4 rounded-xs"></div>

                                            {/* Sección: DATOS DEL CLIENTE */}
                                            <div className="border border-slate-300 rounded-xs overflow-hidden mb-5">
                                                <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                                                    DATOS DEL CLIENTE
                                                </div>
                                                <div className="p-3 text-xs space-y-1.5 bg-white">
                                                    <div className="grid grid-cols-12 gap-2">
                                                        <span className="col-span-4 font-bold text-slate-800">Nombre / Razón social</span>
                                                        <span className="col-span-8 font-black text-black uppercase border-b border-dotted border-slate-400 pb-0.5">
                                                            {currentSelectedClient?.name || '_____________________________________________________'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-2">
                                                        <span className="col-span-4 font-bold text-slate-800">Cédula / RIF</span>
                                                        <span className="col-span-8 font-mono font-black text-black border-b border-dotted border-slate-400 pb-0.5">
                                                            {currentSelectedClient?.tax_id || '_____________________________________________________'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-2">
                                                        <span className="col-span-4 font-bold text-slate-800">Teléfono</span>
                                                        <span className="col-span-8 text-black font-semibold border-b border-dotted border-slate-400 pb-0.5">
                                                            {currentSelectedClient?.phone || '_____________________________________________________'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-2">
                                                        <span className="col-span-4 font-bold text-slate-800">Dirección de entrega</span>
                                                        <span className="col-span-8 text-black font-medium border-b border-dotted border-slate-400 pb-0.5">
                                                            {invoiceForm.delivery_address || currentSelectedClient?.address || '_____________________________________________________'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sección: FICHA TÉCNICA DEL EQUIPO */}
                                            <div className="border border-slate-300 rounded-xs overflow-hidden">
                                                <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                                                    FICHA TÉCNICA DEL EQUIPO
                                                </div>
                                                
                                                {/* Título y Subtítulo del Equipo */}
                                                <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-sm font-black text-[#0E1C33] uppercase">
                                                            {invoiceForm.items[0]?.description || 'CATERPILLAR 320C L'}
                                                            <span className="font-normal text-slate-600 text-xs lowercase ml-2">
                                                                — {invoiceForm.items[0]?.details || 'Excavadora sobre orugas'}
                                                            </span>
                                                        </h3>
                                                    </div>
                                                    {invoiceForm.items[0]?.image_url && (
                                                        <div className="w-16 h-16 rounded-lg border border-slate-300 p-1 bg-white shrink-0 shadow-2xs flex items-center justify-center">
                                                            <img
                                                                src={invoiceForm.items[0].image_url}
                                                                alt={invoiceForm.items[0].description}
                                                                className="max-h-full max-w-full object-contain rounded"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabla Dinámica de Especificaciones Técnicas con Zebra Striping */}
                                                <div className="text-xs">
                                                    {Array.from(new Set((invoiceForm.technical_specs || []).map(s => s.category || 'Especificaciones'))).map((catName, catIdx) => {
                                                        const specsInCat = (invoiceForm.technical_specs || []).filter(s => (s.category || 'Especificaciones') === catName);
                                                        return (
                                                            <div key={catIdx}>
                                                                <div className="bg-slate-100/90 px-3 py-1 font-black text-slate-900 border-b border-slate-200 uppercase text-[11px] tracking-wide">
                                                                    {catName}
                                                                </div>
                                                                {specsInCat.map((spec, sIdx) => (
                                                                    <div
                                                                        key={sIdx}
                                                                        className={`grid grid-cols-12 px-3 py-1.5 border-b border-slate-200 ${
                                                                            sIdx % 2 === 1 ? 'bg-[#F4F5F7]' : 'bg-white'
                                                                        }`}
                                                                    >
                                                                        <span className="col-span-5 font-medium text-slate-700">{spec.name}</span>
                                                                        <span className="col-span-7 font-bold text-slate-900">{spec.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="text-right text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                                Página 1 de 2 • {getDocumentTypeInfo(invoiceForm.document_type).title} {projectedCorrelative}
                                            </div>
                                        </div>

                                        {/* SALTO DE PÁGINA PARA IMPRESIÓN Y PDF */}
                                        <div className="print-page-break my-10 border-b-2 border-dashed border-slate-300 no-print py-2 text-center text-xs font-bold text-slate-400">
                                            --- Fin de Página 1 • Salto de Página A4 para Página 2 ---
                                        </div>

                                        {/* ---------- PÁGINA 2: DESGLOSE DE PRECIOS DDP, PAGOS & CONDICIONES DE ENVÍO ---------- */}
                                        <div className="space-y-5 pt-4">
                                            {/* Identificadores del equipo */}
                                            <div className="border border-slate-300 rounded-xs p-3 text-xs bg-white space-y-1.5">
                                                <div className="grid grid-cols-12 gap-2">
                                                    <span className="col-span-4 font-bold text-slate-800">Año de fabricación</span>
                                                    <span className="col-span-8 font-mono font-bold text-slate-900 border-b border-dotted border-slate-300 pb-0.5">
                                                        {invoiceForm.equipment_year || '2021 / Reciente (Inspeccionado)'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-12 gap-2">
                                                    <span className="col-span-4 font-bold text-slate-800">N° de serie / VIN</span>
                                                    <span className="col-span-8 font-mono font-bold text-slate-900 border-b border-dotted border-slate-300 pb-0.5">
                                                        {invoiceForm.equipment_vin || (invoiceForm.payment_reference ? `CAT-${invoiceForm.payment_reference}` : 'CAT0320CL089124')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Sección: PRECIO — CONDICIÓN DDP (ENTREGADO EN DESTINO) */}
                                            <div className="border border-slate-300 rounded-xs overflow-hidden">
                                                <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                                                    PRECIO — CONDICIÓN DDP (ENTREGADO EN DESTINO)
                                                </div>
                                                <div className="text-xs bg-white">
                                                    {invoiceForm.items.map((it, idx) => (
                                                        <div key={idx} className="flex justify-between items-center px-3 py-2 border-b border-slate-200">
                                                            <div className="flex items-center gap-2.5">
                                                                {it.image_url && (
                                                                    <div className="w-8 h-8 rounded border border-slate-300 p-0.5 bg-white shrink-0 flex items-center justify-center">
                                                                        <img src={it.image_url} alt="" className="max-h-full max-w-full object-contain rounded" />
                                                                    </div>
                                                                )}
                                                                <span className="font-medium text-slate-800">
                                                                    {it.description || 'Equipo (FOB China)'} {it.quantity > 1 ? `(${it.quantity} ${it.unit})` : ''}
                                                                </span>
                                                            </div>
                                                            <span className="font-mono font-bold text-slate-900">
                                                                USD {Number(it.quantity * it.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {Number(invoiceForm.shipping_cost || 0) > 0 && (
                                                        <div className="flex justify-between px-3 py-2 border-b border-slate-200 bg-[#F4F5F7]">
                                                            <span className="font-medium text-slate-800">Flete y seguro internacional</span>
                                                            <span className="font-mono font-bold text-slate-900">
                                                                USD {Number(invoiceForm.shipping_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between px-3 py-2 border-b border-slate-200">
                                                        <span className="font-medium text-slate-800">Nacionalización, aranceles y aduana en Venezuela</span>
                                                        <span className="font-mono font-bold text-slate-900">
                                                            {invoiceForm.customs_text || (taxAmount > 0 ? `USD ${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'INCLUIDO')}
                                                        </span>
                                                    </div>

                                                    {/* Fila Total DDP en Navy Blue */}
                                                    <div className="bg-[#0E1C33] text-white px-3 py-2.5 flex justify-between items-center font-black text-xs uppercase tracking-wide">
                                                        <span>TOTAL DDP — Puesto en destino, Venezuela</span>
                                                        <span className="font-mono text-base text-white">
                                                            USD {totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sección: CONDICIONES DE PAGO */}
                                            <div className="border border-slate-300 rounded-xs overflow-hidden">
                                                <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                                                    CONDICIONES DE PAGO
                                                </div>
                                                <div className="text-xs">
                                                    <div className="grid grid-cols-12 px-3 py-2.5 border-b border-slate-200 bg-white items-center">
                                                        <div className="col-span-2 font-black text-sm text-[#0E1C33]">{invoiceForm.payment_milestone_1_pct || 70}%</div>
                                                        <div className="col-span-10 text-slate-800">
                                                            <span className="font-mono font-black text-black">
                                                                USD {(totalUsd * (Number(invoiceForm.payment_milestone_1_pct || 70) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </span>{' '}
                                                            — {invoiceForm.payment_milestone_1_text || 'Al momento de firmar el contrato, para iniciar la verificación, compra del equipo y proceso de envío.'}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-12 px-3 py-2.5 bg-[#F4F5F7] items-center">
                                                        <div className="col-span-2 font-black text-sm text-[#0E1C33]">{invoiceForm.payment_milestone_2_pct || 30}%</div>
                                                        <div className="col-span-10 text-slate-800">
                                                            <span className="font-mono font-black text-black">
                                                                USD {(totalUsd * (Number(invoiceForm.payment_milestone_2_pct || 30) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </span>{' '}
                                                            — {invoiceForm.payment_milestone_2_text || '15 días antes de la llegada del equipo al puerto de destino en Venezuela.'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sección: CONDICIONES DE ENVÍO */}
                                            <div className="border border-slate-300 rounded-xs overflow-hidden">
                                                <div className="bg-[#0E1C33] text-white font-black text-xs uppercase px-3 py-1.5 tracking-wider">
                                                    CONDICIONES DE ENVÍO
                                                </div>
                                                <div className="p-3 text-xs text-slate-700 leading-relaxed bg-white">
                                                    {invoiceForm.shipping_terms_notes || 'Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a la disponibilidad de espacio (booking) ofrecida por la naviera.'}
                                                </div>
                                            </div>

                                            {/* Firmas de Aceptación */}
                                            <div className="grid grid-cols-2 gap-12 text-center text-xs pt-8">
                                                <div>
                                                    <div className="border-t border-slate-900 pt-2 mb-1"></div>
                                                    <span className="font-bold text-slate-900">
                                                        Firma autorizada — {activeCompany.name}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="border-t border-slate-900 pt-2 mb-1"></div>
                                                    <span className="font-bold text-slate-900">
                                                        Firma / aceptación del cliente
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Pie de página 2 */}
                                            <div className="text-right text-[10px] text-slate-400 pt-4 border-t border-slate-200">
                                                Página 2 de 2 • {getDocumentTypeInfo(invoiceForm.document_type).title} {projectedCorrelative}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

            </main>

            {/* MODAL 1: REGISTRAR EMPRESA EMISORA */}
            {isCompanyModalOpen && (
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
                                onClick={() => setIsCompanyModalOpen(false)}
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

                        <form onSubmit={handleSubmitCompany} className="space-y-4">
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
                                    onClick={() => setIsCompanyModalOpen(false)}
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
            )}

            {/* MODAL 2: REGISTRAR CLIENTE CON BOTÓN CNE AUTOCOMPLETE */}
            {isClientModalOpen && (
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
                                onClick={() => {
                                    setIsClientModalOpen(false);
                                    setCneAlert(null);
                                }}
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
                            <div className={`p-3 rounded-lg border-2 text-xs font-black flex items-center gap-2 ${cneAlert.type === 'success'
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

                        <form onSubmit={handleSubmitClient} className="space-y-4">
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

                                    {/* BOTÓN CNE SOLICITADO */}
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
                                    <label className="text-xs font-black text-black block mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="cliente@correo.com"
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
                                    onClick={() => {
                                        setIsClientModalOpen(false);
                                        setCneAlert(null);
                                    }}
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
            )}
        </div>
    );
}
