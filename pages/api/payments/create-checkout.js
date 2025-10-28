/**
 * API Route: Create Checkout Session
 * Creates a checkout session with Monime for processing customer payments
 */

import { createCheckoutSession } from '../../../utils/monime';
import { auth } from '../../../firebase/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported' 
    });
  }

  try {
    const {
      cartItems,
      totalAmount,
      customerInfo,
      deliveryAddress,
      paymentMethod
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
    const orderNumber = `TF-${Date.now().toString().slice(-8)}`;

    // Prepare line items for Checkout Session
    const lineItems = cartItems.map(item => ({
      name: item.name || item.title,
      description: item.description || `${item.name} - ${item.category || 'Product'}`,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      imageUrl: item.imageUrl || item.image || null
    }));

    // Prepare checkout session data for Monime
    const checkoutData = {
      lineItems,
      orderId,
      orderNumber,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      customerName: customerInfo.name || '',
      description: `TokFlo Store - Order ${orderNumber} (${cartItems.length} items)`,
      metadata: {
        orderId,
        orderNumber,
        customerName: customerInfo.name,
        customerId: customerInfo.userId,
        itemCount: cartItems.length,
        paymentMethod: paymentMethod || 'mobile_money',
        deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
        cartItems: JSON.stringify(cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sellerId: item.sellerId,
          category: item.category
        })))
      },
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel?order_id=${orderId}`
    };

    // Create checkout session with Monime
    const checkoutResponse = await createCheckoutSession(checkoutData);

    // Store order in Firebase with checkout session data
    const orderData = {
      orderId,
      orderNumber,
      customerId: customerInfo.userId || null,
      customerInfo,
      cartItems,
      lineItems, // Store formatted line items
      totalAmount,
      deliveryAddress,
      paymentMethod: paymentMethod || 'mobile_money',
      checkoutSessionId: checkoutResponse.id,
      checkoutUrl: checkoutResponse.url,
      paymentStatus: 'pending',
      orderStatus: 'pending_payment',
      expiresAt: checkoutResponse.expires_at,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Save to Firebase
    await setDoc(doc(db, 'orders', orderId), orderData);

    // Log successful checkout session creation
    console.log(`Checkout session created for order: ${orderId}`, {
      sessionId: checkoutResponse.id,
      orderNumber,
      amount: totalAmount,
      customer: customerInfo.email,
      itemCount: cartItems.length
    });

    // Return checkout session information to frontend
    res.status(200).json({
      success: true,
      orderId,
      orderNumber,
      sessionId: checkoutResponse.id,
      checkoutUrl: checkoutResponse.url,
      amount: totalAmount,
      currency: checkoutResponse.currency || 'SLE',
      expiresAt: checkoutResponse.expires_at,
      lineItems: lineItems,
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    console.error('Checkout session creation failed:', error);
    
    // Return appropriate error response
    const statusCode = error.message.includes('validation') ? 400 : 500;
    res.status(statusCode).json({
      error: 'Checkout session creation failed',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}