/**
 * API Route: Create Payment-on-Delivery Order
 * Creates an order with payment-on-delivery status
 */

import { auth } from '../../../firebase/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/firebase';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../../firebase/collections';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported' 
    });
  }

  try {
    console.log('=== CREATE DELIVERY ORDER API CALLED ===');
    console.log('Request body:', req.body);

    const {
      cartItems,
      totalAmount,
      customerInfo,
      deliveryAddress,
      paymentMethod = 'payment_on_delivery'
    } = req.body;

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'cartItems array is required and cannot be empty'
      });
    }

    if (!customerInfo || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({
        error: 'Invalid customer info',
        message: 'Customer email and phone are required'
      });
    }

    // Generate unique order ID and order number
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderNumber = `TF-D-${Date.now().toString().slice(-8)}`;

    // Prepare order data for Firebase
    const orderData = {
      orderId,
      orderNumber,
      customerId: customerInfo.userId || null,
      customerInfo,
      cartItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
      paymentType: 'delivery',
      requiresPaymentOnDelivery: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      deliveryStatus: 'pending'
    };

    console.log('Creating delivery order:', orderData);

    // Save to Firebase
    await setDoc(doc(db, 'orders', orderId), orderData);

    console.log(`Delivery order created successfully: ${orderId}`);

    // Return order information to frontend
    res.status(200).json({
      success: true,
      orderId,
      orderNumber,
      amount: totalAmount,
      currency: 'SLE',
      message: 'Order created successfully. Payment will be collected on delivery.',
      orderData: {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delivery order creation failed:', error);
    
    res.status(500).json({
      error: 'Order creation failed',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}