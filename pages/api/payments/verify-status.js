/**
 * API Route: Verify Payment Status
 * Checks payment status with Monime and updates order accordingly
 */

import { getPaymentStatus, getCheckoutSessionStatus } from '../../../utils/monime';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported' 
    });
  }

  try {
    const { orderId, paymentCodeId, checkoutSessionId } = req.query;

    // Validate required parameters
    if (!orderId && !paymentCodeId && !checkoutSessionId) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Either orderId, paymentCodeId, or checkoutSessionId is required'
      });
    }

    let orderDoc = null;
    let orderData = null;

    // Get order from Firebase if orderId provided
    if (orderId) {
      orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        return res.status(404).json({
          error: 'Order not found',
          message: `Order with ID ${orderId} does not exist`
        });
      }
      orderData = orderDoc.data();
    }

    // Determine which API to use and get status
    let paymentStatus;
    let sessionId = null;
    let codeId = null;

    if (checkoutSessionId || orderData?.checkoutSessionId) {
      // Use Checkout Session API
      sessionId = checkoutSessionId || orderData?.checkoutSessionId;
      if (!sessionId) {
        return res.status(400).json({
          error: 'Checkout session ID not found',
          message: 'Unable to determine checkout session ID'
        });
      }
      
      paymentStatus = await getCheckoutSessionStatus(sessionId);
    } else {
      // Use legacy Payment Code API
      codeId = paymentCodeId || orderData?.paymentCodeId;
      if (!codeId) {
        return res.status(400).json({
          error: 'Payment code ID not found',
          message: 'Unable to determine payment code ID'
        });
      }
      
      paymentStatus = await getPaymentStatus(codeId);
    }

    // Determine order status based on payment status
    let orderStatus = 'pending_payment';
    let statusMessage = 'Payment is pending';

    switch (paymentStatus.status) {
      case 'completed':
        orderStatus = 'paid';
        statusMessage = 'Payment completed successfully';
        break;
      case 'processing':
        orderStatus = 'processing_payment';
        statusMessage = 'Payment is being processed';
        break;
      case 'failed':
        orderStatus = 'payment_failed';
        statusMessage = 'Payment failed';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        statusMessage = 'Payment was cancelled';
        break;
      case 'expired':
        orderStatus = 'expired';
        statusMessage = 'Payment link has expired';
        break;
      default:
        orderStatus = 'pending_payment';
        statusMessage = 'Payment is pending';
    }

    // Update order status in Firebase if order exists
    if (orderDoc && orderData) {
      const updateData = {
        status: orderStatus,
        paymentStatus: paymentStatus.status,
        updatedAt: serverTimestamp()
      };

      // Add session-specific fields for Checkout Sessions
      if (sessionId) {
        updateData.sessionStatus = paymentStatus.status;
        updateData.checkoutSessionId = sessionId;
        updateData.paymentDetails = {
          amount: paymentStatus.amount_total,
          currency: paymentStatus.currency,
          paidAt: paymentStatus.paid_at,
          method: paymentStatus.payment_method_types?.[0],
          reference: paymentStatus.payment_intent,
          lineItems: paymentStatus.line_items
        };
      } else {
        // Legacy Payment Code fields
        updateData.paymentDetails = {
          amount: paymentStatus.amount,
          currency: paymentStatus.currency,
          paidAt: paymentStatus.paid_at,
          method: paymentStatus.payment_method,
          reference: paymentStatus.reference
        };
      }

      // Add processing timestamp for completed payments
      if (paymentStatus.status === 'completed') {
        updateData.paidAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);

      console.log(`Order ${orderId} status updated to: ${orderStatus}`, {
        paymentStatus: paymentStatus.status,
        sessionId,
        codeId,
        amount: sessionId ? paymentStatus.amount_total : paymentStatus.amount
      });
    }

    // Return payment status information
    const responseData = {
      success: true,
      orderId: orderId || orderData?.orderId,
      paymentStatus: paymentStatus.status,
      orderStatus,
      statusMessage,
      metadata: paymentStatus.metadata
    };

    // Add session-specific fields for Checkout Sessions
    if (sessionId) {
      responseData.checkoutSessionId = sessionId;
      responseData.sessionStatus = paymentStatus.status;
      responseData.paymentDetails = {
        amount: paymentStatus.amount_total,
        currency: paymentStatus.currency,
        paidAt: paymentStatus.paid_at,
        method: paymentStatus.payment_method_types?.[0],
        reference: paymentStatus.payment_intent,
        expiresAt: paymentStatus.expires_at,
        lineItems: paymentStatus.line_items
      };
    } else {
      // Legacy Payment Code fields
      responseData.paymentCodeId = codeId;
      responseData.paymentDetails = {
        amount: paymentStatus.amount,
        currency: paymentStatus.currency,
        paidAt: paymentStatus.paid_at,
        method: paymentStatus.payment_method,
        reference: paymentStatus.reference,
        expiresAt: paymentStatus.expires_at
      };
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Payment status verification failed:', error);
    
    // Return appropriate error response
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      error: 'Status verification failed',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}