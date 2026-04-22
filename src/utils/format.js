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
  return Number(value) || 0;
};
