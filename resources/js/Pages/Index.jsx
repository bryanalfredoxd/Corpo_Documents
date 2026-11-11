import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';

// Utilidades y Constantes
import { getCaracasDate } from '../Utils/dateUtils';
import {
    getEmptyInvoice,
    getProjectedCorrelativeForType,
    getProjectedControlForType,
    defaultTechnicalSpecs
} from '../Utils/invoiceConstants';

// Componentes Modulares de Navegación y Estructura
import TopBar from '../Components/Layout/TopBar';
import SecondaryNav from '../Components/Layout/SecondaryNav';
import FlashBanner from '../Components/Layout/FlashBanner';
import MetricCards from '../Components/Metrics/MetricCards';
import ExecutiveCharts from '../Components/Metrics/ExecutiveCharts';

// Vistas Modulares Principales
import DocumentsView from '../Components/Views/DocumentsView';
import DirectoryView from '../Components/Views/DirectoryView';
import ProductsView from '../Components/Views/ProductsView';
import GeneratorView from '../Components/Views/GeneratorView';
import AuditView from '../Components/Views/AuditView';
import { FeedbackProvider, useFeedback } from '../Contexts/FeedbackContext';

// Modales Modulares
import CompanyModal from '../Components/Modals/CompanyModal';
import ClientModal from '../Components/Modals/ClientModal';
import ProductModal from '../Components/Modals/ProductModal';
import ProductPickerModal from '../Components/Modals/ProductPickerModal';
import InvoicePaymentsModal from '../Components/Modals/InvoicePaymentsModal';
import SalesBookExportModal from '../Components/Modals/SalesBookExportModal';
import InvoiceAuditModal from '../Components/Modals/InvoiceAuditModal';

function IndexContent({
    companies = [],
    clients = [],
    invoices = [],
    products = [],
    stats = {},
    chartData = {},
    statusCounts = {},
    filters = {},
    auditLogs = {},
    auditSummary = {}
}) {
    const { flash = {} } = usePage().props;
    const { notify, confirm } = useFeedback();

    // Estado AJAX local para la tabla de Libro de Ventas (sin recargas de página)
    const [ajaxInvoices, setAjaxInvoices] = useState(invoices);
    const [ajaxStatusCounts, setAjaxStatusCounts] = useState(statusCounts);
    const [ajaxFilters, setAjaxFilters] = useState(filters);
    const [isLoadingTable, setIsLoadingTable] = useState(false);

    useEffect(() => {
        setAjaxInvoices(invoices);
    }, [invoices]);

    useEffect(() => {
        setAjaxStatusCounts(statusCounts);
    }, [statusCounts]);

    useEffect(() => {
        setAjaxFilters(filters);
    }, [filters]);

    const invoiceList = Array.isArray(ajaxInvoices) ? ajaxInvoices : (ajaxInvoices?.data || []);
    const totalInvoicesCount = stats?.invoices_count ?? (!Array.isArray(ajaxInvoices) && ajaxInvoices?.total !== undefined ? ajaxInvoices.total : invoiceList.length);

    // Vistas principales: 'libro-fiscal' | 'directorio' | 'catalogo' | 'generador-pdf' | 'auditoria'
    const [currentView, setCurrentView] = useState('libro-fiscal');

    // Selector de Formato de Plantilla PDF: 'formato-1' (Fiscal) | 'formato-2' (Industrial Moaiven)
    const [selectedPdfFormat, setSelectedPdfFormat] = useState('formato-1');

    // Filtros de directorio y búsqueda sincronizada
    const [directorySection, setDirectorySection] = useState('empresas-emisoras');
    const [directoryType, setDirectoryType] = useState('todos'); // todos | empresas | personas
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const isFirstSearchRender = useRef(true);

    // Filtrado y paginación AJAX vía Axios (sin recargar la página)
    const fetchInvoicesAjax = async (overrides = {}) => {
        const nextParams = {
            search: overrides.search !== undefined ? overrides.search : searchQuery,
            status: overrides.status !== undefined ? overrides.status : (ajaxFilters?.status || 'todos'),
            company_id: overrides.company_id !== undefined ? overrides.company_id : (ajaxFilters?.company_id || 'all'),
            document_type: overrides.document_type !== undefined ? overrides.document_type : (ajaxFilters?.document_type || 'all'),
            page: overrides.page !== undefined ? overrides.page : 1,
        };

        setIsLoadingTable(true);
        try {
            const response = await axios.get('/invoices/query', { params: nextParams });
            setAjaxInvoices(response.data.invoices);
            setAjaxStatusCounts(response.data.statusCounts);
            setAjaxFilters(response.data.filters);
        } catch (err) {
            notify.error('No se pudieron cargar los documentos. Intenta nuevamente.');
        } finally {
            setIsLoadingTable(false);
        }
    };

    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }
        if (currentView !== 'libro-fiscal') return;

        const timer = setTimeout(() => {
            if ((searchQuery || '') !== (ajaxFilters?.search || '')) {
                fetchInvoicesAjax({ search: searchQuery, page: 1 });
            }
        }, 280);

        return () => clearTimeout(timer);
    }, [searchQuery, currentView]);

    // Modales de creación / edición / reportes / auditoría
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [auditModalInvoiceId, setAuditModalInvoiceId] = useState(null);

    // Empresa activa seleccionada para facturación (multi-empresa con logos)
    const [selectedCompanyId, setSelectedCompanyId] = useState(
        companies.length > 0 ? companies[0].id : null
    );

    // Detección responsive para dispositivos móviles y tablets
    const [isMobile, setIsMobile] = useState(false);
    const [mobileEditorTab, setMobileEditorTab] = useState('formulario'); // 'formulario' | 'preview'

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Control de tamaño / zoom para accesibilidad (+15%, +25%, +35%, +45%)
    const [zoomLevel, setZoomLevel] = useState('115');
    const [isZoomOpen, setIsZoomOpen] = useState(false);

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

    // Estado del formulario de factura (Sincronizado en tiempo real con la hoja A4)
    const [invoiceForm, setInvoiceForm] = useState(getEmptyInvoice(activeCompany, companies));

    // Cambio inteligente de tipo de documento (Factura, Proforma, Cotización, Nota Entrega)
    const handleDocumentTypeChange = (newType) => {
        setInvoiceForm(prev => {
            let newValidity = prev.offer_validity_days || 8;
            let newTerms = prev.terms_conditions;
            let newTaxPercentage = prev.tax_percentage;
            let newSaleCondition = prev.sale_condition;

            if (newType === 'proforma') {
                newValidity = 8;
                newTaxPercentage = 0; // Boss: precio neto en China sin impuestos
                newTerms = 'Oferta proforma con validez máxima de ocho (8) días continuos a partir de su emisión. Transcurrido este plazo, los precios, fletes y disponibilidad de los equipos o mercancía quedan sujetos a reconfirmación.';
            } else if (newType === 'cotizacion') {
                newValidity = 8;
                newTaxPercentage = 0;
                newTerms = 'Cotización comercial con validez de ocho (8) días continuos a partir de la fecha de emisión.';
            } else if (newType === 'nota_entrega') {
                newTaxPercentage = 0;
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

    // Iniciar una nueva factura limpia
    const handleNewInvoice = () => {
        setInvoiceForm(getEmptyInvoice(activeCompany, companies));
        setCurrentView('generador-pdf');
    };

    // Actualizar company_id y términos por defecto solo cuando es documento nuevo (sin sobrescribir documentos cargados)
    useEffect(() => {
        if (activeCompany) {
            setInvoiceForm(prev => {
                if (prev.id) {
                    return { ...prev, company_id: activeCompany.id };
                }
                return {
                    ...prev,
                    company_id: activeCompany.id,
                    terms_conditions: activeCompany.default_terms || prev.terms_conditions,
                    order_number: '#' + (activeCompany.next_control_number || 1)
                };
            });
        }
    }, [activeCompany?.id]);

    // Cliente actualmente seleccionado
    const currentSelectedClient = invoiceForm.client_id
        ? clients.find(c => c.id === Number(invoiceForm.client_id)) || null
        : null;

    // Cálculos en tiempo real
    const itemsSubtotal = invoiceForm.items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
    const taxableBase = invoiceForm.items.filter(it => !it.is_tax_exempt).reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
    const taxAmount = (taxableBase * Number(invoiceForm.tax_percentage || 0)) / 100;
    const totalUsd = Math.max(0, itemsSubtotal + Number(invoiceForm.shipping_cost || 0) - Number(invoiceForm.discount || 0) + taxAmount);
    const totalVes = totalUsd * Number(invoiceForm.bcv_exchange_rate || 1);

    // Correlativo y control proyectados según tipo de documento (o reales del documento cargado)
    const projectedCorrelative = invoiceForm.id && invoiceForm.correlative_number
        ? invoiceForm.correlative_number
        : getProjectedCorrelativeForType(activeCompany, invoiceForm.document_type);
    const projectedControlNumber = invoiceForm.id && invoiceForm.control_number
        ? invoiceForm.control_number
        : getProjectedControlForType(activeCompany, invoiceForm.document_type);

    // Manejadores de renglones / ítems
    const handleAddItem = () => {
        setInvoiceForm(prev => ({
            ...prev,
            items: [...prev.items, { product_id: null, description: '', details: '', quantity: 1, unit: 'unid', unit_price: 0, is_tax_exempt: false, image_url: null, show_image: true }]
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

    // Manejadores de Ficha Técnica para Formato 2
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

    // Envío del formulario de factura a Laravel (Crear, Actualizar o Guardar Borrador)
    const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
    const handleSubmitInvoice = (e, forcedStatus = null) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!invoiceForm.client_id) {
            notify.warning('Por favor seleccione un cliente antes de guardar el documento, o regístrelo mediante "+ Nuevo Cliente".');
            return;
        }
        setIsSubmittingInvoice(true);

        const targetStatus = forcedStatus || (invoiceForm.status === 'borrador' ? 'emitida' : (invoiceForm.status || 'emitida'));
        const payload = {
            ...invoiceForm,
            pdf_format: selectedPdfFormat,
            status: targetStatus,
        };

        const callbacks = {
            onSuccess: () => {
                setIsSubmittingInvoice(false);
                notify.success(invoiceForm.id ? 'Documento actualizado correctamente.' : 'Documento emitido y guardado correctamente.');
                setCurrentView('libro-fiscal');
            },
            onError: (err) => {
                setIsSubmittingInvoice(false);
                notify.error('Verifica los campos obligatorios: ' + Object.values(err).join(', '));
            }
        };

        if (invoiceForm.id) {
            router.put(`/invoices/${invoiceForm.id}`, payload, callbacks);
        } else {
            router.post('/invoices', payload, callbacks);
        }
    };

    // Cargar una factura en el visor y formulario
    const handleLoadInvoiceToEditor = (inv) => {
        setSelectedCompanyId(inv.company_id);

        const rawSpecs = inv.technical_specs;
        let parsedSpecs;
        if (Array.isArray(rawSpecs)) {
            parsedSpecs = rawSpecs;
        } else if (Array.isArray(rawSpecs?.specs)) {
            parsedSpecs = rawSpecs.specs;
        } else if (rawSpecs && typeof rawSpecs === 'object') {
            const numericKeys = Object.keys(rawSpecs).filter(k => !isNaN(Number(k)));
            parsedSpecs = numericKeys.length > 0
                ? numericKeys.sort((a, b) => Number(a) - Number(b)).map(k => rawSpecs[k])
                : defaultTechnicalSpecs.map(s => ({ ...s }));
        } else {
            parsedSpecs = defaultTechnicalSpecs.map(s => ({ ...s }));
        }

        setInvoiceForm({
            id: inv.id,
            correlative_number: inv.correlative_number,
            control_number: inv.control_number,
            status: inv.status || 'emitida',
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
            show_bs_conversion: inv.show_bs_conversion !== undefined ? Boolean(inv.show_bs_conversion) : (inv.technical_specs?.show_bs_conversion !== undefined ? Boolean(inv.technical_specs.show_bs_conversion) : true),
            show_item_images: inv.technical_specs?.show_item_images !== undefined ? Boolean(inv.technical_specs.show_item_images) : true,
            signature_stamp: inv.signature_stamp || inv.technical_specs?.signature_stamp || 'auto',
            currency: inv.currency || 'USD',
            payment_method: inv.payment_method || 'PAGO MOVIL',
            payment_reference: inv.payment_reference || '',
            payment_terms_notes: '',
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
            technical_specs: parsedSpecs,
            items: (inv.items && inv.items.length > 0)
                ? inv.items.map((it, idx) => {
                    const hiddenOrders = Array.isArray(inv.technical_specs?.hidden_image_orders) ? inv.technical_specs.hidden_image_orders : [];
                    const orderNum = it.item_order || (idx + 1);
                    return {
                        product_id: it.product_id || null,
                        description: it.description,
                        details: it.details || '',
                        quantity: Number(it.quantity),
                        unit: it.unit,
                        unit_price: Number(it.unit_price),
                        is_tax_exempt: !!it.is_tax_exempt,
                        image_url: it.image_url || null,
                        show_image: !hiddenOrders.includes(orderNum)
                    };
                })
                : [{ product_id: null, description: 'Servicio general', details: '', quantity: 1, unit: 'unid', unit_price: 100, is_tax_exempt: false, image_url: null, show_image: true }]
        });
        setSelectedPdfFormat(inv.technical_specs?.pdf_format || (inv.document_type === 'proforma' ? 'formato-2' : 'formato-1'));
        setCurrentView('generador-pdf');
    };

    // Función de impresión garantizada
    const handlePrintDocument = () => {
        setMobileEditorTab('preview');
        setTimeout(() => {
            window.print();
        }, 120);
    };

    const emptyCompanyState = {
        name: '', trade_name: '', tax_id: '', phone: '', email: '',
        address: '', city: '', state: '', website: '', invoice_prefix: 'F-',
        next_correlative: 1, next_control_number: 1,
        proforma_prefix: 'PROF-', next_proforma_correlative: 1,
        quote_prefix: 'COT-', next_quote_correlative: 1,
        delivery_note_prefix: 'NE-', next_delivery_note_correlative: 1,
        default_terms: '', default_payment_terms: ''
    };

    // Estado para nueva empresa y edición
    const [editingCompany, setEditingCompany] = useState(null);
    const [newCompany, setNewCompany] = useState(emptyCompanyState);
    const [isSavingCompany, setIsSavingCompany] = useState(false);

    const handleOpenCreateCompany = () => {
        setEditingCompany(null);
        setNewCompany(emptyCompanyState);
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
            website: comp.website || '',
            invoice_prefix: comp.invoice_prefix || 'F-',
            next_correlative: comp.next_correlative || 1,
            next_control_number: comp.next_control_number || 1,
            proforma_prefix: comp.proforma_prefix || 'PROF-',
            next_proforma_correlative: comp.next_proforma_correlative || 1,
            quote_prefix: comp.quote_prefix || 'COT-',
            next_quote_correlative: comp.next_quote_correlative || 1,
            delivery_note_prefix: comp.delivery_note_prefix || 'NE-',
            next_delivery_note_correlative: comp.next_delivery_note_correlative || 1,
            default_terms: comp.default_terms || '',
            default_payment_terms: comp.default_payment_terms || ''
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
                    notify.success('Empresa actualizada correctamente.');
                },
                onError: (err) => {
                    setIsSavingCompany(false);
                    notify.error(Object.values(err).join(', ') || 'No se pudo actualizar la empresa.');
                }
            });
        } else {
            router.post('/companies', payload, {
                onSuccess: () => {
                    setIsSavingCompany(false);
                    setIsCompanyModalOpen(false);
                    setNewCompany(emptyCompanyState);
                    notify.success('Empresa registrada exitosamente.');
                },
                onError: (err) => {
                    setIsSavingCompany(false);
                    notify.error(Object.values(err).join(', ') || 'No se pudo registrar la empresa.');
                }
            });
        }
    };

    // Estado para nuevo cliente y edición
    const [editingClient, setEditingClient] = useState(null);
    const [newClient, setNewClient] = useState({
        type: 'persona', nacionalidad: 'V', cedulaNumber: '', tax_id: '',
        name: '', phone: '', phone_secondary: '', email: '', address: '',
        contact_person: '', notes: ''
    });
    const [isSavingClient, setIsSavingClient] = useState(false);
    const [isConsultingCne, setIsConsultingCne] = useState(false);
    const [cneAlert, setCneAlert] = useState(null);

    const handleOpenCreateClient = () => {
        setEditingClient(null);
        setCneAlert(null);
        setNewClient({
            type: 'persona', nacionalidad: 'V', cedulaNumber: '', tax_id: '',
            name: '', phone: '', phone_secondary: '', email: '', address: '',
            contact_person: '', notes: ''
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

    const handleSubmitClient = (e) => {
        e.preventDefault();
        setIsSavingClient(true);

        const payload = {
            type: newClient.type,
            name: newClient.name,
            tax_id: newClient.tax_id,
            phone: newClient.phone,
            phone_secondary: newClient.phone_secondary || null,
            email: newClient.email ? newClient.email.trim() : null,
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
                        type: 'persona', nacionalidad: 'V', cedulaNumber: '', tax_id: '',
                        name: '', phone: '', phone_secondary: '', email: '', address: '',
                        contact_person: '', notes: ''
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

    // Estado para Catálogo de Productos, Abonos y Modal Selector
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [paymentModalInvoiceId, setPaymentModalInvoiceId] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        code: '', name: '', details: '', category: 'General',
        unit: 'unid', unit_price: '', is_tax_exempt: false,
        track_inventory: false, stock: 0, min_stock: 0, technical_specs: null,
        image_url: null, imageFile: null, imagePreview: null, remove_image: false
    });
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    const handleOpenCreateProduct = () => {
        setEditingProduct(null);
        setProductForm({
            code: '', name: '', details: '', category: 'General',
            unit: 'unid', unit_price: '', is_tax_exempt: false,
            track_inventory: false, stock: 0, min_stock: 0, technical_specs: null,
            image_url: null, imageFile: null, imagePreview: null, remove_image: false
        });
        setIsProductModalOpen(true);
    };

    const handleOpenEditProduct = (prod) => {
        setEditingProduct(prod);
        setProductForm({
            code: prod.code || '',
            name: prod.name || '',
            details: prod.details || '',
            category: prod.category || 'General',
            unit: prod.unit || 'unid',
            unit_price: prod.unit_price !== undefined ? prod.unit_price : '',
            is_tax_exempt: !!prod.is_tax_exempt,
            track_inventory: !!prod.track_inventory,
            stock: prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 0,
            min_stock: prod.min_stock !== undefined && prod.min_stock !== null ? Number(prod.min_stock) : 0,
            technical_specs: prod.technical_specs || null,
            image_url: prod.image_url || null,
            imageFile: null,
            imagePreview: null,
            remove_image: false
        });
        setIsProductModalOpen(true);
    };

    const handleSubmitProduct = (e) => {
        e.preventDefault();
        setIsSavingProduct(true);

        const specsObj = productForm.technical_specs;
        const hasSpecs = specsObj && (
            (Array.isArray(specsObj.specs) && specsObj.specs.length > 0) ||
            Boolean(specsObj.equipment_year) ||
            Boolean(specsObj.equipment_vin)
        );

        const payload = {
            code: productForm.code || null,
            name: productForm.name,
            details: productForm.details || null,
            category: productForm.category || 'General',
            unit: productForm.unit || 'unid',
            unit_price: Number(productForm.unit_price || 0),
            is_tax_exempt: productForm.is_tax_exempt ? 1 : 0,
            track_inventory: productForm.track_inventory ? 1 : 0,
            stock: Number(productForm.stock || 0),
            min_stock: Number(productForm.min_stock || 0),
            technical_specs: hasSpecs ? JSON.stringify(specsObj) : '',
            remove_image: productForm.remove_image ? 1 : 0,
        };

        if (productForm.imageFile) {
            payload.image = productForm.imageFile;
        }

        if (editingProduct) {
            router.post(`/products/${editingProduct.id}`, { _method: 'put', ...payload }, {
                forceFormData: true,
                onSuccess: () => {
                    setIsSavingProduct(false);
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                    notify.success('Producto actualizado en el catálogo.');
                },
                onError: (err) => {
                    setIsSavingProduct(false);
                    notify.error('Error al actualizar producto: ' + Object.values(err).join(', '));
                }
            });
        } else {
            router.post('/products', payload, {
                forceFormData: true,
                onSuccess: () => {
                    setIsSavingProduct(false);
                    setIsProductModalOpen(false);
                    notify.success('Producto registrado en el catálogo.');
                },
                onError: (err) => {
                    setIsSavingProduct(false);
                    notify.error('Error al registrar producto: ' + Object.values(err).join(', '));
                }
            });
        }
    };

    // Insertar producto del catálogo dentro de los renglones de la factura/proforma actual
    const handleSelectProductForInvoice = (product) => {
        const newItem = {
            product_id: product.id,
            description: product.name,
            details: product.details || '',
            quantity: 1,
            unit: product.unit || 'unid',
            unit_price: Number(product.unit_price || 0),
            is_tax_exempt: !!product.is_tax_exempt,
            image_url: product.image_url || null,
            show_image: true
        };

        // Cargar ficha técnica dinámica del producto si tiene configurada (Formato 2 Industrial)
        const prodSpecs = product.technical_specs;
        const specUpdates = {};
        if (Array.isArray(prodSpecs) && prodSpecs.length > 0) {
            specUpdates.technical_specs = prodSpecs.map(s => ({ ...s }));
        } else if (prodSpecs && typeof prodSpecs === 'object') {
            if (Array.isArray(prodSpecs.specs) && prodSpecs.specs.length > 0) {
                specUpdates.technical_specs = prodSpecs.specs.map(s => ({ ...s }));
            }
            if (prodSpecs.equipment_year) {
                specUpdates.equipment_year = prodSpecs.equipment_year;
            }
            if (prodSpecs.equipment_vin) {
                specUpdates.equipment_vin = prodSpecs.equipment_vin;
            }
        }

        setInvoiceForm(prev => {
            const first = prev.items[0];
            const isFirstBlank = prev.items.length === 1 && !first.description && (first.unit_price === '' || first.unit_price === null || Number(first.unit_price) === 0);
            if (isFirstBlank) {
                return { ...prev, ...specUpdates, items: [newItem] };
            }
            return { ...prev, ...specUpdates, items: [...prev.items, newItem] };
        });
    };

    const handleInvoiceWithProduct = (product) => {
        handleSelectProductForInvoice(product);
        setCurrentView('generador-pdf');
    };

    const handleQuickSaveToCatalog = (item) => {
        if (!item.description || item.unit_price === '') return;

        const payload = {
            name: item.description,
            details: item.details || null,
            category: 'General',
            unit: item.unit || 'unid',
            unit_price: Number(item.unit_price || 0),
            is_tax_exempt: item.is_tax_exempt ? 1 : 0,
            image_url: item.image_url || null,
        };

        if (selectedPdfFormat === 'formato-2' && Array.isArray(invoiceForm.technical_specs) && invoiceForm.technical_specs.length > 0) {
            payload.technical_specs = {
                equipment_year: invoiceForm.equipment_year || '',
                equipment_vin: invoiceForm.equipment_vin || '',
                specs: invoiceForm.technical_specs,
            };
        }

        router.post('/products', payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => notify.success(`"${item.description}" guardado en el catálogo.`),
            onError: (err) => {
                notify.error('No se pudo guardar en el catálogo: ' + Object.values(err).join(', '));
            }
        });
    };

    const handleLogout = async () => {
        const ok = await confirm({
            title: 'Cerrar Sesión',
            message: '¿Deseas cerrar tu sesión actual en Corpo Documents?',
            confirmLabel: 'Cerrar Sesión',
            variant: 'warning',
        });
        if (ok) {
            router.post('/logout');
        }
    };

    return (
        <div
            className="min-h-screen bg-[#F1F5F9] print:bg-white print:min-h-0 text-black flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white"
            style={{ zoom: isMobile ? '100%' : `${zoomLevel}%` }}
        >
            <Head title="Corpo Documents | Sistema de Facturación y Registro Multi-Empresa" />

            {/* 1. TOP BAR */}
            <TopBar
                zoomLevel={zoomLevel}
                isZoomOpen={isZoomOpen}
                setIsZoomOpen={setIsZoomOpen}
                handleZoomChange={handleZoomChange}
                handleNewInvoice={handleNewInvoice}
                handleLogout={handleLogout}
            />

            {/* 2. BARRA DE NAVEGACIÓN SECUNDARIA */}
            <SecondaryNav
                currentView={currentView}
                setCurrentView={setCurrentView}
                invoicesCount={totalInvoicesCount}
                companiesCount={companies.length}
                clientsCount={clients.length}
                productsCount={products.length}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                invoiceForm={invoiceForm}
                projectedCorrelative={projectedCorrelative}
            />

            {/* 3. BANNER FLASH */}
            <FlashBanner message={flash?.success} />

            {/* 4. CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0 print:bg-white">

                {/* MÉTRICAS CONTABLES */}
                {currentView !== 'generador-pdf' && currentView !== 'auditoria' && (
                    <MetricCards
                        stats={stats}
                        invoicesCount={totalInvoicesCount}
                        companiesCount={companies.length}
                        clientsCount={clients.length}
                        onOpenCreateCompany={handleOpenCreateCompany}
                        onOpenCreateClient={handleOpenCreateClient}
                    />
                )}

                {currentView === 'libro-fiscal' && (
                    <ExecutiveCharts chartData={chartData} />
                )}

                {/* VISTA 1: LIBRO DE FACTURACIÓN Y ARCHIVO */}
                {currentView === 'libro-fiscal' && (
                    <DocumentsView
                        invoices={ajaxInvoices}
                        companies={companies}
                        filters={ajaxFilters}
                        statusCounts={ajaxStatusCounts}
                        searchQuery={searchQuery}
                        isLoadingTable={isLoadingTable}
                        onFilterChange={(partial) => fetchInvoicesAjax({ ...partial, page: 1 })}
                        onPageChange={(page) => fetchInvoicesAjax({ page })}
                        handleNewInvoice={handleNewInvoice}
                        handleLoadInvoiceToEditor={handleLoadInvoiceToEditor}
                        handlePrintDocument={handlePrintDocument}
                        onOpenPaymentsModal={(inv) => setPaymentModalInvoiceId(inv.id)}
                        onOpenExportModal={() => setIsExportModalOpen(true)}
                        onOpenAuditModal={(inv) => setAuditModalInvoiceId(inv.id)}
                    />
                )}

                {/* VISTA 2: DIRECTORIO COMPLETO */}
                {currentView === 'directorio' && (
                    <DirectoryView
                        companies={companies}
                        clients={clients}
                        searchQuery={searchQuery}
                        directorySection={directorySection}
                        setDirectorySection={setDirectorySection}
                        directoryType={directoryType}
                        setDirectoryType={setDirectoryType}
                        activeCompany={activeCompany}
                        setSelectedCompanyId={setSelectedCompanyId}
                        setInvoiceForm={setInvoiceForm}
                        setCurrentView={setCurrentView}
                        onOpenCreateCompany={handleOpenCreateCompany}
                        onOpenEditCompany={handleOpenEditCompany}
                        onOpenCreateClient={handleOpenCreateClient}
                        onOpenEditClient={handleOpenEditClient}
                    />
                )}

                {/* VISTA 3: CATÁLOGO DE PRODUCTOS */}
                {currentView === 'catalogo' && (
                    <ProductsView
                        products={products}
                        searchQuery={searchQuery}
                        onOpenCreateProduct={handleOpenCreateProduct}
                        onOpenEditProduct={handleOpenEditProduct}
                        onInvoiceWithProduct={handleInvoiceWithProduct}
                    />
                )}

                {/* VISTA 4: TALLER DE EMISIÓN & PDF EN VIVO */}
                {currentView === 'generador-pdf' && (
                    <GeneratorView
                        companies={companies}
                        clients={clients}
                        products={products}
                        activeCompany={activeCompany}
                        selectedCompanyId={selectedCompanyId}
                        setSelectedCompanyId={setSelectedCompanyId}
                        invoiceForm={invoiceForm}
                        setInvoiceForm={setInvoiceForm}
                        handleDocumentTypeChange={handleDocumentTypeChange}
                        selectedPdfFormat={selectedPdfFormat}
                        setSelectedPdfFormat={setSelectedPdfFormat}
                        currentSelectedClient={currentSelectedClient}
                        itemsSubtotal={itemsSubtotal}
                        taxAmount={taxAmount}
                        totalUsd={totalUsd}
                        totalVes={totalVes}
                        projectedCorrelative={projectedCorrelative}
                        projectedControlNumber={projectedControlNumber}
                        handleAddItem={handleAddItem}
                        handleRemoveItem={handleRemoveItem}
                        handleItemChange={handleItemChange}
                        handleAddTechSpec={handleAddTechSpec}
                        handleRemoveTechSpec={handleRemoveTechSpec}
                        handleTechSpecChange={handleTechSpecChange}
                        handleResetDefaultTechSpecs={handleResetDefaultTechSpecs}
                        handleSubmitInvoice={handleSubmitInvoice}
                        isSubmittingInvoice={isSubmittingInvoice}
                        handlePrintDocument={handlePrintDocument}
                        onOpenCreateClient={handleOpenCreateClient}
                        onOpenProductPicker={() => setIsProductPickerOpen(true)}
                        onQuickSaveToCatalog={handleQuickSaveToCatalog}
                        setCurrentView={setCurrentView}
                        mobileEditorTab={mobileEditorTab}
                        setMobileEditorTab={setMobileEditorTab}
                    />
                )}

                {/* VISTA 5: BITÁCORA DE AUDITORÍA Y ACTIVIDAD */}
                {currentView === 'auditoria' && (
                    <AuditView
                        initialLogs={auditLogs}
                        initialSummary={auditSummary}
                    />
                )}
            </main>

            {/* MODAL 1: REGISTRAR / EDITAR EMPRESA EMISORA */}
            <CompanyModal
                isOpen={isCompanyModalOpen}
                onClose={() => setIsCompanyModalOpen(false)}
                editingCompany={editingCompany}
                newCompany={newCompany}
                setNewCompany={setNewCompany}
                onSubmit={handleSubmitCompany}
                isSavingCompany={isSavingCompany}
            />

            {/* MODAL 2: REGISTRAR / EDITAR CLIENTE (CNE) */}
            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => {
                    setIsClientModalOpen(false);
                    setCneAlert(null);
                }}
                editingClient={editingClient}
                newClient={newClient}
                setNewClient={setNewClient}
                onSubmit={handleSubmitClient}
                isSavingClient={isSavingClient}
                isConsultingCne={isConsultingCne}
                handleConsultCne={handleConsultCne}
                cneAlert={cneAlert}
            />

            {/* MODAL 3: REGISTRAR / EDITAR PRODUCTO */}
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                editingProduct={editingProduct}
                productForm={productForm}
                setProductForm={setProductForm}
                onSubmit={handleSubmitProduct}
                isSavingProduct={isSavingProduct}
            />

            {/* MODAL 4: SELECTOR RÁPIDO DEL CATÁLOGO PARA FACTURAS */}
            <ProductPickerModal
                isOpen={isProductPickerOpen}
                onClose={() => setIsProductPickerOpen(false)}
                products={products}
                onSelectProduct={handleSelectProductForInvoice}
                onOpenCreateProduct={handleOpenCreateProduct}
            />

            {/* MODAL 5: CONTROL DE ABONOS / PAGOS PARCIALES */}
            <InvoicePaymentsModal
                isOpen={Boolean(paymentModalInvoiceId)}
                onClose={() => setPaymentModalInvoiceId(null)}
                invoice={invoiceList.find(i => i.id === paymentModalInvoiceId) || null}
            />

            {/* MODAL 7: EXPORTAR LIBRO DE VENTAS (CSV / EXCEL SENIAT) */}
            <SalesBookExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                companies={companies}
                defaultCompanyId={ajaxFilters?.company_id || 'all'}
            />

            {/* MODAL 8: HISTORIAL DE AUDITORÍA DEL DOCUMENTO */}
            <InvoiceAuditModal
                isOpen={Boolean(auditModalInvoiceId)}
                onClose={() => setAuditModalInvoiceId(null)}
                invoice={invoiceList.find(i => i.id === auditModalInvoiceId) || null}
            />
        </div>
    );
}

export default function Index(props) {
    return (
        <FeedbackProvider>
            <IndexContent {...props} />
        </FeedbackProvider>
    );
}
