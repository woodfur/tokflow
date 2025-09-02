/**
 * Currency formatting utilities for Sierra Leonean Leones
 */

/**
 * Format a number as Sierra Leonean Leones currency
 * @param {number} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted currency string
 */
export const formatLeones = (amount, showDecimals = true) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Le 0.00';
  }
  
  const formattedAmount = showDecimals 
    ? amount.toFixed(2)
    : Math.round(amount).toString();
  
  // Add thousand separators
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `Le ${parts.join('.')}`;
};

/**
 * Format a number as Sierra Leonean Leones currency without decimals
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string without decimals
 */
export const formatLeonesWhole = (amount) => {
  return formatLeones(amount, false);
};

/**
 * Parse a Leones currency string back to a number
 * @param {string} currencyString - The currency string to parse (e.g., "Le 1,234.56")
 * @returns {number} The parsed number
 */
export const parseLeonesString = (currencyString) => {
  if (typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove 'Le' prefix and commas, then parse
  const cleanString = currencyString.replace(/Le\s?/, '').replace(/,/g, '');
  const parsed = parseFloat(cleanString);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate discount percentage between original and sale price
 * @param {number} originalPrice - The original price
 * @param {number} salePrice - The sale price
 * @returns {number} The discount percentage (0-100)
 */
export const calculateDiscountPercentage = (originalPrice, salePrice) => {
  if (!originalPrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Format shipping cost - shows "Free" for 0, otherwise formats as Leones
 * @param {number} shippingCost - The shipping cost
 * @returns {string} Formatted shipping cost
 */
export const formatShipping = (shippingCost) => {
  return shippingCost === 0 ? 'Free' : formatLeones(shippingCost);
};