/**
 * Handle checkout session updates from webhooks
 * @param {Object} sessionData - Checkout session data from webhook
 */
async function handleCheckoutSessionUpdate(sessionData) {
  try {
    const { id: checkoutSessionId, status, metadata, line_items } = sessionData;
    const orderId = metadata?.orderId;

    if (!orderId) {
      console.error('Order ID not found in checkout session metadata');
      return;
    }

    // Get order from Firebase
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    const orderData = orderDoc.data();

    // Determine new order status based on session status
    let orderStatus = 'pending_payment';
    let paymentStatus = 'pending';
    
    switch (status) {
      case 'completed':
        orderStatus = 'paid';
        paymentStatus = 'completed';
        break;
      case 'expired':
        orderStatus = 'expired';
        paymentStatus = 'expired';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        paymentStatus = 'cancelled';
        break;
    }

    // Update order in Firebase
    const updateData = {
      status: orderStatus,
      paymentStatus,
      sessionStatus: status,
      checkoutSessionData: {
        sessionId: checkoutSessionId,
        status,
        lineItems: line_items,
        completedAt: sessionData.completed_at,
        expiresAt: sessionData.expires_at
      },
      updatedAt: serverTimestamp()
    };

    // Add processing timestamp for completed sessions
    if (status === 'completed') {
      updateData.paidAt = serverTimestamp();
      
      // TODO: Trigger order fulfillment process
      // This could include:
      // - Notifying sellers
      // - Creating payout records
      // - Sending confirmation emails
      // - Updating inventory
    }

    await updateDoc(doc(db, 'orders', orderId), updateData);

    console.log(`Order ${orderId} updated via checkout session webhook:`, {
      oldStatus: orderData.status,
      newStatus: orderStatus,
      sessionStatus: status,
      checkoutSessionId
    });

  } catch (error) {
    console.error('Checkout session update failed:', error);
    throw error;
  }
}

/**
 * API Route: Payment Webhook
 * Handles webhook notifications from Monime for payment status updates
 */

import { verifyWebhookSignature } from '../../../utils/monime';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported' 
    });
  }

  try {
    // Get webhook signature from headers
    const signature = req.headers['monime-signature'] || req.headers['x-monime-signature'];
    
    if (!signature) {
      console.error('Webhook signature missing');
      return res.status(400).json({
        error: 'Missing signature',
        message: 'Webhook signature is required'
      });
    }

    // Verify webhook signature
    const rawBody = JSON.stringify(req.body);
    const isValidSignature = verifyWebhookSignature(rawBody, signature);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Webhook signature verification failed'
      });
    }

    const webhookData = req.body;
    const { event, data } = webhookData;

    // Log webhook received
    console.log('Webhook received:', {
      event,
      sessionId: data?.id,
      paymentCodeId: data?.id,
      status: data?.status,
      timestamp: new Date().toISOString()
    });

    // Store webhook event for audit trail
    await addDoc(collection(db, 'webhook_events'), {
      event,
      data,
      signature,
      processedAt: serverTimestamp(),
      source: 'monime'
    });

    // Handle different webhook events
    switch (event) {
      case 'checkout_session.completed':
      case 'checkout_session.expired':
        await handleCheckoutSessionUpdate(data);
        break;
        
      case 'payment.completed':
      case 'payment.failed':
      case 'payment.cancelled':
      case 'payment.expired':
        await handlePaymentStatusUpdate(data);
        break;
      
      case 'payout.completed':
      case 'payout.failed':
        await handlePayoutStatusUpdate(data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Acknowledge webhook receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      event,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    // Return error but don't expose internal details
    res.status(500).json({
      error: 'Webhook processing failed',
      message: 'An error occurred while processing the webhook'
    });
  }
}

/**
 * Handle payment status updates from webhooks
 * @param {Object} paymentData - Payment data from webhook
 */
async function handlePaymentStatusUpdate(paymentData) {
  try {
    const { id: paymentCodeId, status, metadata } = paymentData;
    const orderId = metadata?.orderId;

    if (!orderId) {
      console.error('Order ID not found in payment metadata');
      return;
    }

    // Get order from Firebase
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    const orderData = orderDoc.data();

    // Determine new order status
    let orderStatus = 'pending_payment';
    switch (status) {
      case 'completed':
        orderStatus = 'paid';
        break;
      case 'failed':
        orderStatus = 'payment_failed';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        break;
      case 'expired':
        orderStatus = 'expired';
        break;
    }

    // Update order in Firebase
    const updateData = {
      status: orderStatus,
      paymentStatus: status,
      paymentDetails: {
        amount: paymentData.amount,
        currency: paymentData.currency,
        paidAt: paymentData.paid_at,
        method: paymentData.payment_method,
        reference: paymentData.reference
      },
      updatedAt: serverTimestamp()
    };

    // Add processing timestamp for completed payments
    if (status === 'completed') {
      updateData.paidAt = serverTimestamp();
      
      // TODO: Trigger order fulfillment process
      // This could include:
      // - Notifying sellers
      // - Creating payout records
      // - Sending confirmation emails
      // - Updating inventory
    }

    await updateDoc(doc(db, 'orders', orderId), updateData);

    console.log(`Order ${orderId} updated via webhook:`, {
      oldStatus: orderData.status,
      newStatus: orderStatus,
      paymentStatus: status
    });

  } catch (error) {
    console.error('Payment status update failed:', error);
    throw error;
  }
}

/**
 * Handle payout status updates from webhooks
 * @param {Object} payoutData - Payout data from webhook
 */
async function handlePayoutStatusUpdate(payoutData) {
  try {
    const { id: payoutId, status, metadata } = payoutData;
    const sellerId = metadata?.sellerId;

    if (!sellerId) {
      console.error('Seller ID not found in payout metadata');
      return;
    }

    // Update payout record in Firebase
    // This assumes you have a payouts collection
    const payoutRef = doc(db, 'payouts', payoutId);
    await updateDoc(payoutRef, {
      status,
      processedAt: payoutData.processed_at,
      updatedAt: serverTimestamp()
    });

    console.log(`Payout ${payoutId} updated via webhook:`, {
      sellerId,
      status,
      amount: payoutData.amount
    });

  } catch (error) {
    console.error('Payout status update failed:', error);
    throw error;
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}