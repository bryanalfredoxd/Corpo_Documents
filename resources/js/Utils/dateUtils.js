/**
 * Helpers para el manejo de fechas con zona horaria oficial de Caracas / Venezuela (America/Caracas, UTC-4)
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD según la hora de Caracas.
 * Permite sumar o restar días mediante el parámetro daysOffset.
 */
export const getCaracasDate = (daysOffset = 0) => {
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

/**
 * Formatea una fecha en formato legible DD/MM/YYYY respetando la hora de Caracas,
 * evitando desfases de medianoche por diferencia con UTC.
 */
export const formatCaracasDate = (dateStr) => {
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

