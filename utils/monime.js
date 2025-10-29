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
    'Monime-Version': 'caph.2025-08-23', // Required API version header
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  return headers;
};

/**
 * Test API credentials and connection
 * @returns {Promise<Object>} API status response
 */
export const testMonimeConnection = async () => {
  try {
    const response = await fetch('https://api.monime.io', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MONIME_CONFIG.apiToken}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    console.log('=== MONIME CONNECTION TEST ===');
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return data;
  } catch (error) {
    console.error('Monime connection test failed:', error);
    throw error;
  }
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
  
  console.log('=== MONIME API REQUEST DEBUG ===');
  console.log('URL:', url);
  console.log('Method:', options.method || 'GET');
  console.log('Headers:', {
    ...createMonimeHeaders(options.idempotencyKey),
    ...options.headers
  });
  console.log('Body:', options.body);
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      ...options,
      headers: {
        ...createMonimeHeaders(options.idempotencyKey),
        ...options.headers
      }
    });

    const data = await response.json();
    
    console.log('=== MONIME API RESPONSE DEBUG ===');
    console.log('Status:', response.status);
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('=== MONIME API ERROR ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error data:', data);
      
      // Enhanced error handling with specific Monime error details
      const errorMessage = data.error?.message || data.message?.message || data.message || data.error || `HTTP error! status: ${response.status}`;
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        details: data.details || data.error?.details || null,
        code: data.code || data.error?.code || data.message?.code || null,
        type: data.type || null,
        param: data.param || null,
        requestId: data.request_id || response.headers.get('x-request-id') || null,
        fullResponse: data // Include full response for debugging
      };
      
      console.error('Enhanced error details:', errorDetails);
      
      // Create a more informative error
      const error = new Error(`Monime API Error: ${errorMessage}`);
      error.monimeError = errorDetails;
      error.status = response.status;
      
      throw error;
    }

    return data;
  } catch (error) {
    console.error('=== MONIME API REQUEST FAILED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.monimeError) {
      console.error('Monime-specific error details:', error.monimeError);
    }
    
    // Network or other fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - check internet connection and API URL');
    }
    
    throw error;
  }
};

/**
 * Create checkout session for e-commerce checkout
 * @param {Object} checkoutData - Checkout session information
 * @returns {Promise<Object>} Checkout session response
 */
export const createCheckoutSession = async (checkoutData) => {
  console.log('=== CREATE CHECKOUT SESSION DEBUG ===');
  console.log('Input checkoutData:', checkoutData);
  
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
    cancelUrl,
    callbackState
  } = checkoutData;

  // Helper function to convert SLE to minor units (cents)
  const toMinorUnits = (amountSLE) => {
    return Math.round(amountSLE * 100);
  };

  // Build the payload according to Monime documentation
  const payload = {
    name: description || `TokFlo Store - Order ${orderNumber || orderId}`,
    successUrl: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel?order_id=${orderId}`,
    lineItems: lineItems.map(item => ({
      type: 'custom',
      name: item.name,
      price: {
        currency: MONIME_CONFIG.currency,
        value: toMinorUnits(parseFloat(item.price)) // Convert to minor units
      },
      quantity: parseInt(item.quantity),
      description: item.description || undefined, // Optional field
      reference: item.id || item.name.toLowerCase().replace(/\s+/g, '_') || undefined // Optional field
    })),
    metadata: {
      orderId,
      orderNumber: orderNumber || orderId,
      source: 'tokflo_store',
      customerEmail,
      customerPhone,
      customerName: customerName || '',
      ...metadata
    },
    callbackState: callbackState || `order_${orderId}` // Optional field for correlation
  };

  console.log('=== CHECKOUT SESSION PAYLOAD (CORRECTED) ===');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('MONIME_CONFIG:', MONIME_CONFIG);

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
  formatAmount,
  testMonimeConnection
};