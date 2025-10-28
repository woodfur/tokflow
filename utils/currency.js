/**
 * Format currency values for display
 * Handles Sierra Leone Leones (SLE) formatting
 */

/**
 * Format amount in Sierra Leone Leones
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatLeones = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Le 0.00';
  }
  
  return new Intl.NumberFormat('en-SL', {
    style: 'currency',
    currency: 'SLE',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parse currency string back to number
 * @param {string} currencyString - The currency string to parse
 * @returns {number} Parsed amount
 */
export const parseLeones = (currencyString) => {
  if (typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove currency symbols and spaces, then parse
  const cleanString = currencyString.replace(/[^\d.-]/g, '');
  const amount = parseFloat(cleanString);
  
  return isNaN(amount) ? 0 : amount;
};

/**
 * Format amount with custom currency symbol
 * @param {number} amount - The amount to format
 * @param {string} symbol - Currency symbol (default: 'Le')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, symbol = 'Le') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${symbol} 0.00`;
  }
  
  return `${symbol} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Calculate percentage of amount
 * @param {number} amount - Base amount
 * @param {number} percentage - Percentage to calculate
 * @returns {number} Calculated percentage amount
 */
export const calculatePercentage = (amount, percentage) => {
  if (typeof amount !== 'number' || typeof percentage !== 'number') {
    return 0;
  }
  
  return (amount * percentage) / 100;
};

/**
 * Calculate discount percentage between original and current price
 * @param {number} originalPrice - Original price
 * @param {number} currentPrice - Current/sale price
 * @returns {number} Discount percentage (0-100)
 */
export const calculateDiscountPercentage = (originalPrice, currentPrice) => {
  if (typeof originalPrice !== 'number' || typeof currentPrice !== 'number' || 
      originalPrice <= 0 || currentPrice < 0 || currentPrice >= originalPrice) {
    return 0;
  }
  
  const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
  return Math.round(discount);
};

/**
 * Round amount to 2 decimal places
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export const roundAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  
  return Math.round(amount * 100) / 100;
};