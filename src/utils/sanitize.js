/**
 * Utilidad para sanitizar entradas de texto en el frontend.
 * Previene Inyecciones (XSS) y caracteres anómalos que puedan romper la UI o la Base de Datos.
 */

// Elimina etiquetas HTML y caracteres de control
export const sanitizeText = (text) => {
    if (!text) return '';
    return text
        .replace(/<[^>]*>?/gm, '') // Eliminar tags HTML
        .replace(/[^\w\s.,!¡¿?@#'\-áéíóúÁÉÍÓÚñÑüÜ]/gi, '') // Permitir solo alfanuméricos y puntuación común
        .trim();
};

// Sanitizar nombres propios (más restrictivo)
export const sanitizeName = (name) => {
    if (!name) return '';
    return name
        .replace(/<[^>]*>?/gm, '')
        .replace(/[^\w\s\-áéíóúÁÉÍÓÚñÑüÜ]/gi, '') // Solo letras, números, espacios y guiones
        .trim();
};

// Validar números flotantes o enteros
export const sanitizeNumber = (numStr) => {
    if (!numStr) return '';
    // Reemplaza comas por puntos y elimina todo lo que no sea dígito o punto
    const cleanStr = numStr.replace(',', '.').replace(/[^0-9.]/g, '');

    // Evitar múltiples puntos decimales
    const parts = cleanStr.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }

    return cleanStr;
};
