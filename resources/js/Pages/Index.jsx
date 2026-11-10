import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';

// Utilidades y Constantes
import { getCaracasDate } from '../Utils/dateUtils';
import {
    getEmptyInvoice,
    sprintfCorrelative,
    sprintfControl,
    defaultTechnicalSpecs
} from '../Utils/invoiceConstants';

// Componentes Modulares de Navegación y Estructura
import TopBar from '../Components/Layout/TopBar';
import SecondaryNav from '../Components/Layout/SecondaryNav';
import FlashBanner from '../Components/Layout/FlashBanner';
import MetricCards from '../Components/Metrics/MetricCards';

// Vistas Modulares Principales
import DocumentsView from '../Components/Views/DocumentsView';
import DirectoryView from '../Components/Views/DirectoryView';
import GeneratorView from '../Components/Views/GeneratorView';

// Modales Modulares
import CompanyModal from '../Components/Modals/CompanyModal';
import ClientModal from '../Components/Modals/ClientModal';

export default function Index({ companies = [], clients = [], invoices = [], stats = {} }) {
    const { flash = {} } = usePage().props;

    // Vistas principales: 'libro-fiscal' | 'directorio' | 'generador-pdf'
    const [currentView, setCurrentView] = useState('libro-fiscal');

    // Selector de Formato de Plantilla PDF: 'formato-1' (Fiscal) | 'formato-2' (Industrial Moaiven)
    const [selectedPdfFormat, setSelectedPdfFormat] = useState('formato-1');

    // Filtros de directorio
    const [directorySection, setDirectorySection] = useState('empresas-emisoras');
    const [directoryType, setDirectoryType] = useState('todos'); // todos | empresas | personas
    const [searchQuery, setSearchQuery] = useState('');

    // Paginación del Libro Fiscal (10 por página)
    const [invoicePage, setInvoicePage] = useState(1);
    const invoicePageSize = 10;

    useEffect(() => {
        setInvoicePage(1);
    }, [searchQuery]);

    // Modales de creación / edición
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

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

    // Cliente actualmente seleccionado
    const currentSelectedClient = invoiceForm.client_id
        ? clients.find(c => c.id === Number(invoiceForm.client_id)) || null
        : null;

    // Cálculos en tiempo real
    const itemsSubtotal = invoiceForm.items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
    const taxableBase = invoiceForm.items.filter(it => !it.is_tax_exempt).reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_price || 0)), 0);
    const taxAmount = (taxableBase * Number(invoiceForm.tax_percentage || 0)) / 100;
    const totalUsd = itemsSubtotal + Number(invoiceForm.shipping_cost || 0) - Number(invoiceForm.discount || 0) + taxAmount;
    const totalVes = totalUsd * Number(invoiceForm.bcv_exchange_rate || 1);

    // Correlativo y control proyectados
    const projectedCorrelative = sprintfCorrelative(activeCompany.invoice_prefix || 'F-', activeCompany.next_correlative || 1);
    const projectedControlNumber = sprintfControl(0, activeCompany.next_control_number || 1);

    // Manejadores de renglones / ítems
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

    // Cargar una factura en el visor y formulario
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
            show_bs_conversion: inv.show_bs_conversion !== undefined ? Boolean(inv.show_bs_conversion) : (inv.technical_specs?.show_bs_conversion !== undefined ? Boolean(inv.technical_specs.show_bs_conversion) : true),
            signature_stamp: inv.signature_stamp || inv.technical_specs?.signature_stamp || 'auto',
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

    // Función de impresión garantizada
    const handlePrintDocument = () => {
        setMobileEditorTab('preview');
        setTimeout(() => {
            window.print();
        }, 120);
    };

    // Estado para nueva empresa y edición
    const [editingCompany, setEditingCompany] = useState(null);
    const [newCompany, setNewCompany] = useState({
        name: '', trade_name: '', tax_id: '', phone: '', email: '',
        address: '', city: '', state: '', invoice_prefix: 'F-', default_terms: ''
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

    const handleLogout = () => {
        if (confirm('¿Desea cerrar la sesión del sistema?')) {
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
                invoicesCount={invoices.length}
                companiesCount={companies.length}
                clientsCount={clients.length}
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
                {currentView !== 'generador-pdf' && (
                    <MetricCards
                        stats={stats}
                        invoicesCount={invoices.length}
                        companiesCount={companies.length}
                        clientsCount={clients.length}
                        onOpenCreateCompany={handleOpenCreateCompany}
                        onOpenCreateClient={handleOpenCreateClient}
                    />
                )}

                {/* VISTA 1: LIBRO DE FACTURACIÓN Y ARCHIVO */}
                {currentView === 'libro-fiscal' && (
                    <DocumentsView
                        invoices={invoices}
                        searchQuery={searchQuery}
                        invoicePage={invoicePage}
                        setInvoicePage={setInvoicePage}
                        invoicePageSize={invoicePageSize}
                        handleNewInvoice={handleNewInvoice}
                        handleLoadInvoiceToEditor={handleLoadInvoiceToEditor}
                        handlePrintDocument={handlePrintDocument}
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

                {/* VISTA 3: TALLER DE EMISIÓN & PDF EN VIVO */}
                {currentView === 'generador-pdf' && (
                    <GeneratorView
                        companies={companies}
                        clients={clients}
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
                        setCurrentView={setCurrentView}
                        mobileEditorTab={mobileEditorTab}
                        setMobileEditorTab={setMobileEditorTab}
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
        </div>
    );
}
