// Firebase Firestore Schema Definitions for Store Feature
// This file defines the data structure for stores, products, carts, and orders

export const COLLECTIONS = {
  STORES: 'stores',
  PRODUCTS: 'products',
  CARTS: 'carts',
  ORDERS: 'orders',
  USERS: 'users'
};

// User Schema
export const UserSchema = {
  uid: 'string', // Firebase Auth user ID
  email: 'string', // User email
  displayName: 'string', // User display name
  photoURL: 'string', // Profile image URL
  bio: 'string', // User bio/description
  location: 'string', // User location
  website: 'string', // User website
  phoneNumber: 'string', // User phone number
  // Social media links
  socialLinks: {
    twitter: 'string',
    instagram: 'string',
    linkedin: 'string',
    youtube: 'string'
  },
  // User preferences
  preferences: {
    emailNotifications: 'boolean',
    pushNotifications: 'boolean',
    marketingEmails: 'boolean',
    theme: 'string' // 'light' or 'dark'
  },
  // Store-related fields
  hasStore: 'boolean',
  storeId: 'string', // Reference to store document
  // Activity tracking
  totalPosts: 'number',
  totalLikes: 'number',
  totalFollowers: 'number',
  totalFollowing: 'number',
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  lastLoginAt: 'timestamp'
};

// Store Schema
export const StoreSchema = {
  id: 'string', // Auto-generated document ID
  ownerId: 'string', // User ID of store owner
  name: 'string',
  description: 'string',
  logo: 'string', // URL to store logo image
  banner: 'string', // URL to store banner image
  category: 'string', // Store category (fashion, tech, beauty, etc.)
  isActive: 'boolean',
  rating: 'number', // Average rating
  totalReviews: 'number',
  totalProducts: 'number',
  totalSales: 'number',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  // Contact information
  contact: {
    email: 'string',
    phone: 'string',
    address: {
      street: 'string',
      city: 'string',
      state: 'string',
      zipCode: 'string',
      country: 'string'
    }
  },
  // Store settings
  settings: {
    allowReviews: 'boolean',
    autoApproveProducts: 'boolean',
    shippingOptions: 'array' // Array of shipping methods
  }
};

// Product Schema
export const ProductSchema = {
  id: 'string', // Auto-generated document ID
  storeId: 'string', // Reference to store
  ownerId: 'string', // User ID of product owner
  name: 'string',
  description: 'string',
  category: 'string',
  subcategory: 'string',
  price: 'number',
  originalPrice: 'number', // For discount calculations
  currency: 'string', // Default: 'USD'
  images: 'array', // Array of image URLs
  thumbnail: 'string', // Main product image URL
  // Inventory
  stock: 'number',
  sku: 'string', // Stock Keeping Unit
  isInStock: 'boolean',
  lowStockThreshold: 'number',
  // Product details
  specifications: 'object', // Key-value pairs for product specs
  tags: 'array', // Array of tags for search
  weight: 'number', // For shipping calculations
  dimensions: {
    length: 'number',
    width: 'number',
    height: 'number'
  },
  // Status and metrics
  isActive: 'boolean',
  isFeatured: 'boolean',
  rating: 'number', // Average rating
  totalReviews: 'number',
  totalSales: 'number',
  views: 'number',
  likes: 'number',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  // SEO
  seoTitle: 'string',
  seoDescription: 'string',
  seoKeywords: 'array'
};

// Cart Schema
export const CartSchema = {
  id: 'string', // User ID (one cart per user)
  userId: 'string',
  items: 'array', // Array of cart items
  totalItems: 'number',
  totalAmount: 'number',
  currency: 'string',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Cart Item Schema (nested in cart)
export const CartItemSchema = {
  productId: 'string',
  storeId: 'string',
  name: 'string',
  price: 'number',
  quantity: 'number',
  thumbnail: 'string',
  selectedVariant: 'object', // For products with variants
  addedAt: 'timestamp'
};

// Order Schema
export const OrderSchema = {
  id: 'string', // Auto-generated document ID
  orderNumber: 'string', // Human-readable order number
  userId: 'string', // Buyer ID
  storeId: 'string', // Store ID
  sellerId: 'string', // Store owner ID
  // Order items
  items: 'array', // Array of ordered items
  // Pricing
  subtotal: 'number',
  tax: 'number',
  shipping: 'number',
  discount: 'number',
  total: 'number',
  currency: 'string',
  // Status
  status: 'string', // pending, confirmed, shipped, delivered, cancelled, refunded
  paymentStatus: 'string', // pending, paid, failed, refunded
  // Shipping information
  shippingAddress: {
    name: 'string',
    street: 'string',
    city: 'string',
    state: 'string',
    zipCode: 'string',
    country: 'string',
    phone: 'string'
  },
  // Tracking
  trackingNumber: 'string',
  estimatedDelivery: 'timestamp',
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  shippedAt: 'timestamp',
  deliveredAt: 'timestamp'
};

// Order Item Schema (nested in order)
export const OrderItemSchema = {
  productId: 'string',
  name: 'string',
  price: 'number',
  quantity: 'number',
  thumbnail: 'string',
  selectedVariant: 'object'
};

// User Profile Extension for Store Feature
export const UserStoreProfileSchema = {
  // Existing user fields...
  // Store-related fields
  hasStore: 'boolean',
  storeId: 'string', // Reference to user's store
  // Shopping preferences
  wishlist: 'array', // Array of product IDs
  recentlyViewed: 'array', // Array of product IDs
  // Seller metrics (if user has a store)
  sellerRating: 'number',
  totalSales: 'number',
  totalOrders: 'number'
};

// Product Review Schema (subcollection of products)
export const ProductReviewSchema = {
  id: 'string',
  productId: 'string',
  userId: 'string',
  userName: 'string',
  userAvatar: 'string',
  rating: 'number', // 1-5 stars
  title: 'string',
  comment: 'string',
  images: 'array', // Review images
  isVerifiedPurchase: 'boolean',
  helpfulCount: 'number',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Store Review Schema (subcollection of stores)
export const StoreReviewSchema = {
  id: 'string',
  storeId: 'string',
  userId: 'string',
  userName: 'string',
  userAvatar: 'string',
  rating: 'number', // 1-5 stars
  title: 'string',
  comment: 'string',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Firestore Collection Structure:
// /stores/{storeId}
// /stores/{storeId}/reviews/{reviewId}
// /products/{productId}
// /products/{productId}/reviews/{reviewId}
// /carts/{userId}
// /orders/{orderId}
// /users/{userId}