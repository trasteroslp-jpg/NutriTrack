/**
 * Redondea un número a N decimales (por defecto 1).
 * Elimina el ".0" final para enteros.
 * Ej: 8.7999999 → "8.8", 23.0 → "23", 14.56 → "14.6"
 */
export const r = (value, decimals = 1) => {
    if (value == null || isNaN(value)) return '0';
    const num = parseFloat(Number(value).toFixed(decimals));
    return Number.isInteger(num) ? String(num) : num.toFixed(decimals);
};

/**
 * Igual pero devuelve un número (no string).
 */
export const rn = (value, decimals = 1) => {
    if (value == null || isNaN(value)) return 0;
    return parseFloat(Number(value).toFixed(decimals));
};
