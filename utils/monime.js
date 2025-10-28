/**
 * Monime Payment Integration Utility
 * Handles API communication with Monime payment platform
 */

// Monime API Configuration
export const MONIME_CONFIG = {
  baseUrl: process.env.MONIME_API_BASE_URL || 'https://api.monime.io/v1',
  apiToken: process.env.MONIME_ENVIRONMENT === 'live' 
    ? process.env.MONIME_LIVE_API_TOKEN 
    : process.env.MONIME_TEST_API_TOKEN,
  spaceId: process.env.MONIME_SPACE_ID,
  environment: process.env.MONIME_ENVIRONMENT || 'test',
  currency: process.env.PAYMENT_CURRENCY || 'SLE',
  webhookSecret: process.env.MONIME_WEBHOOK_SECRET
};

// Payment Methods supported by Monime
export const PAYMENT_METHODS = {
  MOBILE_MONEY: 'mobile_money',
  CARD: 'card',
  BANK: 'bank',
  DIGITAL_WALLET: 'digital_wallet'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

/**
 * Create Monime API headers
 * @param {string} idempotencyKey - Unique key for idempotency
 * @returns {Object} Headers object
 */
export const createMonimeHeaders = (idempotencyKey = null) => {
  const headers = {
    'Authorization': `Bearer ${MONIME_CONFIG.apiToken}`,
    'Monime-Space-Id': MONIME_CONFIG.spaceId,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  return headers;
};

/**
 * Generate idempotency key based on order ID and operation
 * @param {string} orderId - Order identifier
 * @param {string} operation - Operation type (payment, payout, etc.)
 * @returns {string} Idempotency key
 */
export const generateIdempotencyKey = (orderId, operation = 'payment') => {
  return `${operation}_${orderId}_${Date.now()}`;
};

/**
 * Make API request to Monime
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
export const monimeApiRequest = async (endpoint, options = {}) => {
  const url = `${MONIME_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      ...options,
      headers: {
        ...createMonimeHeaders(options.idempotencyKey),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Monime API request failed:', error);
    throw error;
  }
};

/**
 * Create checkout session for e-commerce checkout
 * @param {Object} checkoutData - Checkout session information
 * @returns {Promise<Object>} Checkout session response
 */
export const createCheckoutSession = async (checkoutData) => {
  const {
    lineItems,
    orderId,
    orderNumber,
    customerEmail,
    customerPhone,
    customerName,
    description,
    metadata = {},
    successUrl,
    cancelUrl
  } = checkoutData;

  // Calculate total amount from line items
  const totalAmount = lineItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const payload = {
    line_items: lineItems.map(item => ({
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      image_url: item.imageUrl || null
    })),
    order_number: orderNumber || orderId,
    currency: MONIME_CONFIG.currency,
    description: description || `TokFlo Store - Order ${orderNumber || orderId}`,
    customer: {
      email: customerEmail,
      phone: customerPhone,
      name: customerName || ''
    },
    metadata: {
      orderId,
      orderNumber: orderNumber || orderId,
      source: 'tokflo_store',
      totalAmount,
      ...metadata
    },
    success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
    webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
    // Enable all payment methods for better conversion
    payment_methods: ['mobile_money', 'card', 'bank_transfer'],
    // Branding options for better user experience
    branding: {
      primary_color: '#3B82F6', // TokFlo blue
      logo_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tokflo-favicon.svg`
    }
  };

  return await monimeApiRequest('/checkout-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey: generateIdempotencyKey(orderId, 'checkout_session')
  });
};

/**
 * Get checkout session status
 * @param {string} sessionId - Checkout session ID
 * @returns {Promise<Object>} Checkout session status response
 */
export const getCheckoutSessionStatus = async (sessionId) => {
  return await monimeApiRequest(`/checkout-sessions/${sessionId}`);
};

/**
 * Legacy function for backward compatibility - now uses checkout sessions
 * @deprecated Use createCheckoutSession instead
 */
export const createPaymentCode = async (paymentData) => {
  console.warn('createPaymentCode is deprecated. Use createCheckoutSession instead.');
  
  // Convert old payment data format to checkout session format
  const {
    amount,
    orderId,
    customerEmail,
    customerPhone,
    description,
    metadata = {}
  } = paymentData;

  const lineItems = [{
    name: description || `Order ${orderId}`,
    description: description || `Payment for order ${orderId}`,
    price: parseFloat(amount),
    quantity: 1
  }];

  return await createCheckoutSession({
    lineItems,
    orderId,
    customerEmail,
    customerPhone,
    description,
    metadata
  });
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getCheckoutSessionStatus instead
 */
export const getPaymentStatus = async (sessionId) => {
  console.warn('getPaymentStatus is deprecated. Use getCheckoutSessionStatus instead.');
  return await getCheckoutSessionStatus(sessionId);
};

/**
 * Create payout for seller
 * @param {Object} payoutData - Payout information
 * @returns {Promise<Object>} Payout response
 */
export const createPayout = async (payoutData) => {
  const {
    amount,
    sellerId,
    sellerAccount,
    description,
    metadata = {}
  } = payoutData;

  const payload = {
    amount: parseFloat(amount),
    currency: MONIME_CONFIG.currency,
    destination: sellerAccount,
    description: description || `Payout for seller ${sellerId}`,
    metadata: {
      sellerId,
      source: 'tokflo_store',
      ...metadata
    }
  };

  return await monimeApiRequest('/payouts', {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey: generateIdempotencyKey(sellerId, 'payout')
  });
};

/**
 * Verify webhook signature
 * @param {string} payload - Webhook payload
 * @param {string} signature - Webhook signature
 * @returns {boolean} Verification result
 */
export const verifyWebhookSignature = (payload, signature) => {
  // Implementation depends on Monime's webhook signature method
  // This is a placeholder - update based on actual Monime documentation
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', MONIME_CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
};

/**
 * Format amount for display
 * @param {number} amount - Amount in base currency
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-SL', {
    style: 'currency',
    currency: MONIME_CONFIG.currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export default {
  MONIME_CONFIG,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  createCheckoutSession,
  getCheckoutSessionStatus,
  createPaymentCode, // Legacy support
  getPaymentStatus, // Legacy support
  createPayout,
  verifyWebhookSignature,
  formatAmount
};