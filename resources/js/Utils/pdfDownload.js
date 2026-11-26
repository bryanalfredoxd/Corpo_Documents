import axios from 'axios';

/**
 * Extrae el nombre de archivo sugerido desde la cabecera Content-Disposition.
 */
function extractFilenameFromHeader(disposition, fallback = 'documento.pdf') {
    if (!disposition || typeof disposition !== 'string') {
        return fallback;
    }

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1].trim());
        } catch {
            // Continuar con coincidencia simple
        }
    }

    const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
    if (plainMatch?.[1]) {
        return plainMatch[1].trim();
    }

    return fallback;
}

/**
 * Descarga directamente un archivo PDF binario vía Axios (Blob) validando su cabecera %PDF-.
 */
export async function downloadPdfRequest({
    url,
    method = 'get',
    data = null,
    params = null,
    fallbackFilename = 'documento.pdf',
}) {
    const response = await axios({
        url,
        method,
        data,
        params,
        responseType: 'blob',
        headers: {
            Accept: 'application/pdf',
        },
    });

    const contentType = String(response.headers?.['content-type'] || '').toLowerCase();
    const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' });

    if (!contentType.includes('application/pdf')) {
        const signature = await blob.slice(0, 5).text();
        if (!signature.startsWith('%PDF-')) {
            let errorMessage = 'No se pudo generar el documento PDF en el servidor.';
            try {
                const rawText = await blob.text();
                const parsed = JSON.parse(rawText);
                if (parsed?.message) {
                    errorMessage = parsed.message;
                }
            } catch {
                // Conservar mensaje predeterminado si el servidor devolvió HTML de error
            }
            throw new Error(errorMessage);
        }
    }

    const pdfBlob = blob.type === 'application/pdf'
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

    const filename = extractFilenameFromHeader(
        response.headers?.['content-disposition'],
        fallbackFilename
    );

    const objectUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
    }, 1500);

    return filename;
}
