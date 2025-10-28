/**
 * Firebase Payment Operations
 * Helper functions for managing payment-related data in Firestore
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { firestore } from './firebase';
import { 
  COLLECTIONS, 
  ORDER_STATUS, 
  PAYMENT_STATUS, 
  PAYOUT_STATUS,
  TRANSACTION_TYPE 
} from './collections';

// Order Operations
export const createOrder = async (orderData) => {
  try {
    const orderRef = await addDoc(collection(firestore, COLLECTIONS.ORDERS), {
      ...orderData,
      status: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

export const getOrder = async (orderId) => {
  try {
    const orderDoc = await getDoc(doc(firestore, COLLECTIONS.ORDERS, orderId));
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    return {
      id: orderDoc.id,
      ...orderDoc.data()
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  try {
    const orderRef = doc(firestore, COLLECTIONS.ORDERS, orderId);
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData
    };
    
    // Add timestamp for specific status changes
    if (status === ORDER_STATUS.PAID) {
      updateData.paidAt = serverTimestamp();
    } else if (status === ORDER_STATUS.SHIPPED) {
      updateData.shippedAt = serverTimestamp();
    } else if (status === ORDER_STATUS.DELIVERED) {
      updateData.deliveredAt = serverTimestamp();
    }
    
    await updateDoc(orderRef, updateData);
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
};

export const updateOrderPaymentStatus = async (orderId, paymentStatus, paymentData = {}) => {
  try {
    const orderRef = doc(firestore, COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, {
      paymentStatus,
      ...paymentData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating order payment status:', error);
    throw new Error('Failed to update order payment status');
  }
};

export const getUserOrders = async (userId, limitCount = 10) => {
  try {
    const ordersQuery = query(
      collection(firestore, COLLECTIONS.ORDERS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw new Error('Failed to fetch user orders');
  }
};

// Payment Operations
export const createPayment = async (paymentData) => {
  try {
    const paymentRef = await addDoc(collection(firestore, COLLECTIONS.PAYMENTS), {
      ...paymentData,
      status: PAYMENT_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return paymentRef.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw new Error('Failed to create payment record');
  }
};

export const getPayment = async (paymentId) => {
  try {
    const paymentDoc = await getDoc(doc(firestore, COLLECTIONS.PAYMENTS, paymentId));
    
    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }
    
    return {
      id: paymentDoc.id,
      ...paymentDoc.data()
    };
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

export const getPaymentByOrderId = async (orderId) => {
  try {
    const paymentsQuery = query(
      collection(firestore, COLLECTIONS.PAYMENTS),
      where('orderId', '==', orderId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(paymentsQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const paymentDoc = querySnapshot.docs[0];
    return {
      id: paymentDoc.id,
      ...paymentDoc.data()
    };
  } catch (error) {
    console.error('Error fetching payment by order ID:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId, status, additionalData = {}) => {
  try {
    const paymentRef = doc(firestore, COLLECTIONS.PAYMENTS, paymentId);
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData
    };
    
    if (status === PAYMENT_STATUS.COMPLETED) {
      updateData.completedAt = serverTimestamp();
    }
    
    await updateDoc(paymentRef, updateData);
    
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
};

// Payout Operations
export const createPayout = async (payoutData) => {
  try {
    const payoutRef = await addDoc(collection(firestore, COLLECTIONS.PAYOUTS), {
      ...payoutData,
      status: PAYOUT_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return payoutRef.id;
  } catch (error) {
    console.error('Error creating payout:', error);
    throw new Error('Failed to create payout record');
  }
};

export const updatePayoutStatus = async (payoutId, status, additionalData = {}) => {
  try {
    const payoutRef = doc(firestore, COLLECTIONS.PAYOUTS, payoutId);
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData
    };
    
    if (status === PAYOUT_STATUS.COMPLETED) {
      updateData.completedAt = serverTimestamp();
    }
    
    await updateDoc(payoutRef, updateData);
    
    return true;
  } catch (error) {
    console.error('Error updating payout status:', error);
    throw new Error('Failed to update payout status');
  }
};

export const getSellerPayouts = async (sellerId, limitCount = 10) => {
  try {
    const payoutsQuery = query(
      collection(firestore, COLLECTIONS.PAYOUTS),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(payoutsQuery);
    const payouts = [];
    
    querySnapshot.forEach((doc) => {
      payouts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return payouts;
  } catch (error) {
    console.error('Error fetching seller payouts:', error);
    throw new Error('Failed to fetch seller payouts');
  }
};

// Transaction Operations (for audit trail)
export const createTransaction = async (transactionData) => {
  try {
    const transactionRef = await addDoc(collection(firestore, COLLECTIONS.TRANSACTIONS), {
      ...transactionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return transactionRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction record');
  }
};

// Webhook Operations
export const logWebhook = async (webhookData) => {
  try {
    const webhookRef = await addDoc(collection(firestore, COLLECTIONS.WEBHOOKS), {
      ...webhookData,
      processed: false,
      receivedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    return webhookRef.id;
  } catch (error) {
    console.error('Error logging webhook:', error);
    throw new Error('Failed to log webhook');
  }
};

export const markWebhookProcessed = async (webhookId, success = true, error = null) => {
  try {
    const webhookRef = doc(firestore, COLLECTIONS.WEBHOOKS, webhookId);
    await updateDoc(webhookRef, {
      processed: success,
      processedAt: serverTimestamp(),
      error: error || null
    });
    
    return true;
  } catch (error) {
    console.error('Error marking webhook as processed:', error);
    throw new Error('Failed to update webhook status');
  }
};

// Seller Profile Operations
export const getSellerProfile = async (sellerId) => {
  try {
    const sellerDoc = await getDoc(doc(firestore, COLLECTIONS.SELLER_PROFILES, sellerId));
    
    if (!sellerDoc.exists()) {
      return null;
    }
    
    return {
      id: sellerDoc.id,
      ...sellerDoc.data()
    };
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    throw error;
  }
};

export const updateSellerBalance = async (sellerId, amount, type = 'add') => {
  try {
    return await runTransaction(firestore, async (transaction) => {
      const sellerRef = doc(firestore, COLLECTIONS.SELLER_PROFILES, sellerId);
      const sellerDoc = await transaction.get(sellerRef);
      
      if (!sellerDoc.exists()) {
        throw new Error('Seller profile not found');
      }
      
      const currentStats = sellerDoc.data().stats || {};
      const currentBalance = currentStats.availableBalance || 0;
      
      let newBalance;
      if (type === 'add') {
        newBalance = currentBalance + amount;
      } else if (type === 'subtract') {
        newBalance = Math.max(0, currentBalance - amount);
      } else {
        throw new Error('Invalid balance update type');
      }
      
      transaction.update(sellerRef, {
        'stats.availableBalance': newBalance,
        updatedAt: serverTimestamp()
      });
      
      return newBalance;
    });
  } catch (error) {
    console.error('Error updating seller balance:', error);
    throw new Error('Failed to update seller balance');
  }
};

// Store Configuration Operations
export const getStoreConfig = async () => {
  try {
    const configDoc = await getDoc(doc(firestore, COLLECTIONS.STORE_CONFIG, 'main'));
    
    if (!configDoc.exists()) {
      // Return default configuration
      return {
        paymentSettings: {
          enabledMethods: ['mobile_money', 'card'],
          currency: 'SLE',
          taxRate: 0.15,
          shippingRates: {
            freeShippingThreshold: 100,
            standardRate: 10,
            expressRate: 20
          }
        }
      };
    }
    
    return configDoc.data();
  } catch (error) {
    console.error('Error fetching store config:', error);
    throw new Error('Failed to fetch store configuration');
  }
};

// Utility functions
export const calculateOrderTotal = (items, shippingRate = 0, taxRate = 0.15) => {
  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  const tax = subtotal * taxRate;
  const total = subtotal + shippingRate + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shippingRate * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

export const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
};