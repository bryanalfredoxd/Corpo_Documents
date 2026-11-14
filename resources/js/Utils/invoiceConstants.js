import { getCaracasDate } from './dateUtils';

/**
 * Ficha técnica base para proformas industriales (Moaiven CAT 320C L o maquinaria pesada)
 */
export const defaultTechnicalSpecs = [
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

/**
 * Opciones de escala / zoom de interfaz para alta legibilidad
 */
export const zoomOptions = [
    { value: '100', label: 'Normal (100%)', desc: 'Tamaño estándar del sistema' },
    { value: '115', label: 'Grande (+15%)', desc: 'Recomendado para lectura cómoda' },
    { value: '125', label: 'Muy Grande (+25%)', desc: 'Mayor tamaño y visibilidad' },
    { value: '135', label: 'Extra Grande (+35%)', desc: 'Textos y botones ampliados' },
    { value: '145', label: 'Máximo (+45%)', desc: 'Máxima escala visual' },
];

/**
 * Obtiene la configuración visual y títulos según el tipo de documento emitido
 */
export const getDocumentTypeInfo = (type) => {
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

/**
 * Formatea un correlativo con su prefijo (ej: F-0000001)
 */
export function sprintfCorrelative(prefix, num) {
    return `${prefix || 'F-'}${String(num || 1).padStart(7, '0')}`;
}

/**
 * Formatea un número de control (ej: 00-000001)
 */
export function sprintfControl(series, num) {
    return `${String(series || 0).padStart(2, '0')}-${String(num || 1).padStart(6, '0')}`;
}

/**
 * Obtiene el correlativo proyectado independiente según el tipo de documento y empresa
 */
export function getProjectedCorrelativeForType(company, documentType) {
    if (!company) return sprintfCorrelative('F-', 1);
    switch (documentType) {
        case 'proforma':
            return sprintfCorrelative(company.proforma_prefix || 'PROF-', company.next_proforma_correlative || 1);
        case 'cotizacion':
            return sprintfCorrelative(company.quote_prefix || 'COT-', company.next_quote_correlative || 1);
        case 'nota_entrega':
            return sprintfCorrelative(company.delivery_note_prefix || 'NE-', company.next_delivery_note_correlative || 1);
        case 'factura':
        default:
            return sprintfCorrelative(company.invoice_prefix || 'F-', company.next_correlative || 1);
    }
}

/**
 * Obtiene el número de control proyectado según el tipo de documento y empresa
 */
export function getProjectedControlForType(company, documentType) {
    if (!company) return sprintfControl(0, 1);
    switch (documentType) {
        case 'proforma':
            return sprintfControl(0, company.next_proforma_correlative || 1);
        case 'cotizacion':
            return sprintfControl(0, company.next_quote_correlative || 1);
        case 'nota_entrega':
            return sprintfControl(0, company.next_delivery_note_correlative || 1);
        case 'factura':
        default:
            return sprintfControl(0, company.next_control_number || 1);
    }
}

/**
 * Obtiene la ruta del sello y firma oficial según la configuración y tipo de documento
 */
export function getSignatureStampUrl(signatureStamp, documentType) {
    if (signatureStamp === 'none') return null;
    if (signatureStamp === 'china') return '/images/stamp-signature-china-clean.png';
    if (signatureStamp === 'corpoasia') return '/images/stamp-signature-corpoasia-clean.png';
    // 'auto' o por defecto:
    if (documentType === 'proforma' || documentType === 'cotizacion') {
        return '/images/stamp-signature-china-clean.png';
    }
    return '/images/stamp-signature-corpoasia-clean.png';
}

/**
 * Filtra las cuentas bancarias activas de la empresa para imprimir en el PDF
 */
export function getCompanyBankAccountsForPdf(activeCompany, invoiceForm) {
    if (invoiceForm?.show_bank_accounts === false) return [];
    const accounts = (activeCompany?.bank_accounts || []).filter(a => a.is_active !== false);
    if (accounts.length === 0) return [];
    if (invoiceForm?.selected_bank_account_id && invoiceForm.selected_bank_account_id !== 'all') {
        const selected = accounts.filter(a => String(a.id) === String(invoiceForm.selected_bank_account_id));
        if (selected.length > 0) return selected;
    }
    return accounts;
}

/**
 * Genera la estructura inicial de una factura vacía lista para llenar
 */
export const getEmptyInvoice = (company, companies = []) => ({
    id: null,
    correlative_number: null,
    control_number: null,
    status: 'emitida',
    company_id: company?.id || (companies.length > 0 ? companies[0].id : ''),
    client_id: '',
    document_type: 'factura',
    document_subtitle: '',
    signature_stamp: 'auto',
    show_bank_accounts: true,
    selected_bank_account_id: 'all',
    order_number: '#' + (company?.next_control_number || 1),
    issue_date: getCaracasDate(),
    due_date: getCaracasDate(8),
    offer_validity_days: 8,
    delivery_address: '',
    sale_condition: 'Venta de Contado',
    sales_channel: 'Oficina / Presencial',
    bcv_exchange_rate: 876.80,
    show_bs_conversion: true,
    show_item_images: true,
    currency: 'USD',
    payment_method: 'PAGO MOVIL',
    payment_reference: '',
    payment_terms_notes: '',
    shipping_cost: 0,
    discount: 0,
    tax_percentage: 16.00,
    terms_conditions: company?.default_terms || '',
    // Campos específicos para Formato 2: Proforma Industrial / Moaiven
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
        { product_id: null, description: '', details: '', quantity: 1, unit: 'unid', unit_price: '', is_tax_exempt: false, image_url: null, show_image: true }
    ]
});

/**
 * Categorías / Secciones de Clientes según los rubros y servicios del negocio
 */
export const CLIENT_CATEGORIES = [
    { id: 'Maquinaria Agrícola', label: 'Maquinaria Agrícola', shortLabel: 'Maquinaria', icon: '🚜', desc: 'Tractores, excavadoras, repuestos pesados' },
    { id: 'Insumos Agrícolas / Semilleros', label: 'Insumos / Semilleros', shortLabel: 'Insumos/Semilleros', icon: '🌱', desc: 'Bandejas semillero, agropecuarias, insumos' },
    { id: 'Equipos Médicos', label: 'Equipos Médicos', shortLabel: 'Médicos/Salud', icon: '🩺', desc: 'Estetoscopios, instrumental médico, clínicas' },
    { id: 'Servicios de Importación', label: 'Servicios de Importación China', shortLabel: 'Importación China', icon: '🚢', desc: 'Servicios de compras, agenciamiento y fletes China' },
    { id: 'General', label: 'Comercial General', shortLabel: 'General', icon: '🏢', desc: 'Otros clientes o servicios comerciales' },
];

/**
 * Paleta de colores preconfigurados para nuevas secciones/rubros
 */
export const CATEGORY_COLOR_PALETTES = {
    blue: { id: 'blue', label: 'Azul Corporativo', badge: 'bg-blue-100 text-blue-950 border-blue-300', pillActive: 'bg-blue-700 text-white border-blue-900', dot: 'bg-blue-500' },
    emerald: { id: 'emerald', label: 'Verde Esmeralda', badge: 'bg-emerald-100 text-emerald-950 border-emerald-300', pillActive: 'bg-emerald-700 text-white border-emerald-900', dot: 'bg-emerald-500' },
    amber: { id: 'amber', label: 'Ámbar / Naranja', badge: 'bg-amber-100 text-amber-950 border-amber-300', pillActive: 'bg-amber-700 text-white border-amber-900', dot: 'bg-amber-500' },
    sky: { id: 'sky', label: 'Celeste / Médico', badge: 'bg-sky-100 text-sky-950 border-sky-300', pillActive: 'bg-sky-700 text-white border-sky-900', dot: 'bg-sky-500' },
    indigo: { id: 'indigo', label: 'Índigo / Naviero', badge: 'bg-indigo-100 text-indigo-950 border-indigo-300', pillActive: 'bg-indigo-700 text-white border-indigo-900', dot: 'bg-indigo-500' },
    purple: { id: 'purple', label: 'Púrpura / Especial', badge: 'bg-purple-100 text-purple-950 border-purple-300', pillActive: 'bg-purple-700 text-white border-purple-900', dot: 'bg-purple-500' },
    rose: { id: 'rose', label: 'Rosa / Ferretería', badge: 'bg-rose-100 text-rose-950 border-rose-300', pillActive: 'bg-rose-700 text-white border-rose-900', dot: 'bg-rose-500' },
    slate: { id: 'slate', label: 'Gris Neutro', badge: 'bg-slate-100 text-slate-800 border-slate-300', pillActive: 'bg-slate-800 text-white border-slate-950', dot: 'bg-slate-500' },
};

/**
 * Obtiene el estilo visual (badge, colores e icono) para una categoría de cliente.
 * Soporta categorías personalizadas de la base de datos o heurística de respaldo.
 */
export const getClientCategoryBadge = (category, customCategories = []) => {
    const name = category || 'Comercial General';
    const catLower = name.toLowerCase().trim();

    // 1. Buscar coincidencia exacta en las categorías configurables de la BD
    if (Array.isArray(customCategories) && customCategories.length > 0) {
        const found = customCategories.find(c => c.name && c.name.toLowerCase().trim() === catLower);
        if (found) {
            const palette = CATEGORY_COLOR_PALETTES[found.color] || CATEGORY_COLOR_PALETTES.blue;
            return {
                badge: palette.badge,
                pillActive: palette.pillActive,
                icon: found.icon || '🏷️',
                label: found.name,
                shortLabel: found.name,
                description: found.description || ''
            };
        }
    }

    // 2. Heurística inteligente por palabras clave de respaldo
    if (catLower.includes('maquinaria') || (catLower.includes('agrícola') && catLower.includes('maquin'))) {
        return {
            badge: CATEGORY_COLOR_PALETTES.amber.badge,
            pillActive: CATEGORY_COLOR_PALETTES.amber.pillActive,
            icon: '🚜',
            label: name,
            shortLabel: 'Maquinaria'
        };
    }
    if (catLower.includes('semillero') || catLower.includes('insumo') || catLower.includes('bandeja')) {
        return {
            badge: CATEGORY_COLOR_PALETTES.emerald.badge,
            pillActive: CATEGORY_COLOR_PALETTES.emerald.pillActive,
            icon: '🌱',
            label: name,
            shortLabel: 'Insumos/Semilleros'
        };
    }
    if (catLower.includes('médic') || catLower.includes('estetoscop') || catLower.includes('salud') || catLower.includes('hospital') || catLower.includes('clínic')) {
        return {
            badge: CATEGORY_COLOR_PALETTES.sky.badge,
            pillActive: CATEGORY_COLOR_PALETTES.sky.pillActive,
            icon: '🩺',
            label: name,
            shortLabel: 'Equipos Médicos'
        };
    }
    if (catLower.includes('importa') || catLower.includes('china') || catLower.includes('logístic') || catLower.includes('flete')) {
        return {
            badge: CATEGORY_COLOR_PALETTES.indigo.badge,
            pillActive: CATEGORY_COLOR_PALETTES.indigo.pillActive,
            icon: '🚢',
            label: name,
            shortLabel: 'Importación China'
        };
    }

    return {
        badge: CATEGORY_COLOR_PALETTES.slate.badge,
        pillActive: CATEGORY_COLOR_PALETTES.slate.pillActive,
        icon: '🏢',
        label: name,
        shortLabel: name
    };
};

