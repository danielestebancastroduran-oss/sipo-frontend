/**
 * Utility for formatting currency in Colombian Pesos (COP)
 * Ensures that null, undefined, or NaN values are treated as 0.
 */
export const formatCOP = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Ensures a value is a valid number, defaults to 0 if not.
 * Useful for calculations to avoid NaN.
 */
export const parseNum = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') {
    // Si tiene puntos y comas (ej: 1.200,50), quitamos puntos y cambiamos coma por punto
    if (value.includes('.') && value.includes(',')) {
      return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
    }
    // Si solo tiene puntos y son 3 cifras después (ej: 1.000), es probable que sea miles
    if (value.includes('.') && value.split('.').pop().length === 3) {
      return Number(value.replace(/\./g, '')) || 0;
    }
    // Caso estándar
    return Number(value.replace(',', '.')) || 0;
  }
  return Number(value) || 0;
};
