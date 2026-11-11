import imageCompression from 'browser-image-compression';

const DEFAULT_OPTIONS = {
    maxSizeMB: 0.55,
    maxWidthOrHeight: 1000,
    useWebWorker: true,
};

/**
 * Comprime una imagen raster en el navegador manteniendo nitidez para catálogo y PDF.
 */
export async function compressImageFile(file, customOptions = {}) {
    if (!file || !file.type?.startsWith('image/')) {
        return file;
    }

    // No recomprimir SVGs ni GIFs animados
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return file;
    }

    try {
        const compressed = await imageCompression(file, {
            ...DEFAULT_OPTIONS,
            ...customOptions,
        });
        // Conservar nombre de archivo original si la librería devuelve Blob sin nombre
        if (compressed instanceof File) {
            return compressed;
        }
        return new File([compressed], file.name || 'image.jpg', {
            type: compressed.type || file.type,
            lastModified: Date.now(),
        });
    } catch {
        return file;
    }
}

/**
 * Convierte un File en Data URI Base64 luego de comprimirlo automáticamente.
 */
export async function compressImageToDataUrl(file, customOptions = {}) {
    const processed = await compressImageFile(file, customOptions);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ file: processed, dataUrl: ev.target?.result });
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(processed);
    });
}

