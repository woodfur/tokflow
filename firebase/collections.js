/**
 * Firebase Collections Configuration
 * Defines collection names and schema for TokFlo store with Monime payment integration
 */

// Collection Names
export const COLLECTIONS = {
  // Existing collections
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  
  // New payment-related collections
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  PAYOUTS: 'payouts',
  PAYMENT_METHODS: 'paymentMethods',
  TRANSACTIONS: 'transactions',
  WEBHOOKS: 'webhooks',
  
  // Store configuration
  STORE_CONFIG: 'storeConfig',
  SELLER_PROFILES: 'sellerProfiles'
};

// Order Schema
export const ORDER_SCHEMA = {
  id: 'string', // Auto-generated order ID
  orderId: 'string', // Unique order identifier
  orderNumber: 'string', // Human-readable order number (e.g., TF-12345678)
  userId: 'string', // Customer user ID
  customerId: 'string', // Customer user ID (alias for userId)
  status: 'string', // 'pending', 'processing_payment', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'
  orderStatus: 'string', // Order processing status
  
  // Order details
  items: [
    {
      productId: 'string',
      name: 'string',
      price: 'number',
      quantity: 'number',
      imageUrl: 'string',
      sellerId: 'string',
      category: 'string'
    }
  ],
  cartItems: 'array', // Raw cart items from frontend
  lineItems: [
    {
      name: 'string',
      description: 'string',
      price: 'number',
      quantity: 'number',
      imageUrl: 'string'
    }
  ], // Formatted line items for Checkout Session
  
  // Pricing
  subtotal: 'number',
  shipping: 'number',
  tax: 'number',
  totalAmount: 'number',
  currency: 'string', // 'SLE'
  
  // Customer information
  customerInfo: {
    userId: 'string',
    name: 'string',
    email: 'string',
    phone: 'string'
  },
  
  // Delivery address (updated from shippingAddress)
  deliveryAddress: {
    address: 'string',
    city: 'string',
    notes: 'string'
  },
  
  // Payment information - Updated for Checkout Sessions
  paymentMethod: 'string', // 'mobile_money', 'card', 'bank_transfer', 'digital_wallet'
  paymentStatus: 'string', // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  // Checkout Session fields (replaces Payment Code fields)
  checkoutSessionId: 'string', // Monime checkout session ID
  checkoutUrl: 'string', // Monime checkout URL
  sessionStatus: 'string', // Checkout session status
  
  // Legacy Payment Code fields (for backward compatibility)
  paymentCodeId: 'string', // Monime payment code ID (deprecated)
  paymentUrl: 'string', // Monime payment URL (deprecated)
  paymentReference: 'string', // Monime payment reference
  
  // Session expiration
  expiresAt: 'timestamp', // When checkout session expires
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  paidAt: 'timestamp',
  shippedAt: 'timestamp',
  deliveredAt: 'timestamp'
};

// Payment Schema
export const PAYMENT_SCHEMA = {
  id: 'string', // Auto-generated payment ID
  orderId: 'string', // Reference to order
  userId: 'string', // Customer user ID
  
  // Checkout Session details (primary)
  checkoutSessionId: 'string', // Monime checkout session ID
  sessionUrl: 'string', // Monime checkout session URL
  sessionStatus: 'string', // Checkout session status
  
  // Legacy Payment Code details (for backward compatibility)
  paymentCodeId: 'string', // Monime payment code ID (deprecated)
  paymentReference: 'string', // Monime payment reference
  checkoutUrl: 'string', // Monime checkout URL (legacy)
  
  // Payment information
  amount: 'number',
  currency: 'string', // 'SLE'
  paymentMethod: 'string',
  status: 'string', // 'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'
  
  // Line items (for Checkout Sessions)
  lineItems: [
    {
      name: 'string',
      description: 'string',
      price: 'number',
      quantity: 'number',
      imageUrl: 'string'
    }
  ],
  
  // Monime response data
  monimeResponse: 'object', // Store full Monime API response
  
  // Metadata
  metadata: {
    customerName: 'string',
    customerEmail: 'string',
    customerPhone: 'string',
    orderItems: 'array',
    orderNumber: 'string'
  },
  
  // URLs
  successUrl: 'string', // Success redirect URL
  cancelUrl: 'string', // Cancel redirect URL
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  completedAt: 'timestamp',
  expiresAt: 'timestamp'
};

// Payout Schema
export const PAYOUT_SCHEMA = {
  id: 'string', // Auto-generated payout ID
  sellerId: 'string', // Seller user ID
  
  // Payout details
  amount: 'number',
  currency: 'string', // 'SLE'
  status: 'string', // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  // Monime payout details
  monimePayoutId: 'string', // Monime payout ID
  monimeReference: 'string', // Monime payout reference
  
  // Destination details
  destination: {
    type: 'string', // 'mobile_money', 'bank_account'
    accountNumber: 'string',
    accountName: 'string',
    provider: 'string' // 'orange', 'africell', 'qmoney', etc.
  },
  
  // Related orders
  orderIds: ['string'], // Array of order IDs included in this payout
  
  // Monime response data
  monimeResponse: 'object',
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  completedAt: 'timestamp'
};

// Transaction Schema (for audit trail)
export const TRANSACTION_SCHEMA = {
  id: 'string', // Auto-generated transaction ID
  type: 'string', // 'payment', 'payout', 'refund'
  
  // References
  orderId: 'string',
  paymentId: 'string',
  payoutId: 'string',
  userId: 'string',
  
  // Transaction details
  amount: 'number',
  currency: 'string',
  status: 'string',
  description: 'string',
  
  // Monime details
  monimeId: 'string', // Monime transaction ID
  monimeReference: 'string',
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Webhook Schema (for logging webhook events)
export const WEBHOOK_SCHEMA = {
  id: 'string', // Auto-generated webhook ID
  
  // Webhook details
  event: 'string', // 'checkout_session.completed', 'checkout_session.expired', 'payment.completed', 'payment.failed', 'payout.completed', etc.
  source: 'string', // 'monime'
  
  // Payload
  payload: 'object', // Full webhook payload
  signature: 'string', // Webhook signature for verification
  
  // Processing status
  processed: 'boolean',
  processedAt: 'timestamp',
  error: 'string', // Error message if processing failed
  
  // References
  orderId: 'string',
  paymentId: 'string',
  payoutId: 'string',
  checkoutSessionId: 'string', // Checkout session ID for session-based webhooks
  
  // Timestamps
  receivedAt: 'timestamp',
  createdAt: 'timestamp'
};

// Store Configuration Schema
export const STORE_CONFIG_SCHEMA = {
  id: 'string', // 'main' or store identifier
  
  // Payment settings
  paymentSettings: {
    enabledMethods: ['string'], // Array of enabled payment methods
    currency: 'string', // 'SLE'
    taxRate: 'number', // Tax percentage
    shippingRates: {
      freeShippingThreshold: 'number',
      standardRate: 'number',
      expressRate: 'number'
    }
  },
  
  // Monime configuration
  monimeConfig: {
    environment: 'string', // 'test' or 'live'
    spaceId: 'string',
    webhookUrl: 'string',
    supportedMethods: ['string']
  },
  
  // Business information
  businessInfo: {
    name: 'string',
    email: 'string',
    phone: 'string',
    address: 'string',
    taxId: 'string'
  },
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Seller Profile Schema
export const SELLER_PROFILE_SCHEMA = {
  id: 'string', // User ID
  
  // Seller information
  businessName: 'string',
  businessType: 'string',
  taxId: 'string',
  
  // Payout settings
  payoutSettings: {
    method: 'string', // 'mobile_money', 'bank_account'
    accountNumber: 'string',
    accountName: 'string',
    provider: 'string',
    minimumPayout: 'number'
  },
  
  // Statistics
  stats: {
    totalSales: 'number',
    totalOrders: 'number',
    totalPayouts: 'number',
    pendingBalance: 'number',
    availableBalance: 'number'
  },
  
  // Status
  status: 'string', // 'active', 'suspended', 'pending_verification'
  verificationStatus: 'string', // 'pending', 'verified', 'rejected'
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  verifiedAt: 'timestamp'
};

// Helper functions for collection operations
export const getCollectionPath = (collection, ...segments) => {
  return [collection, ...segments].join('/');
};

// Status constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING_PAYMENT: 'processing_payment',
  PAID: 'paid',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export const PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const TRANSACTION_TYPE = {
  PAYMENT: 'payment',
  PAYOUT: 'payout',
  REFUND: 'refund'
};