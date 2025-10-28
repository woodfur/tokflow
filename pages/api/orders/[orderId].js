/**
 * API Route: Get Order Details
 * Fetches order information by order ID
 */

import { firestore as db } from '../../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const { orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required'
    });
  }

  try {
    // Fetch order from Firebase
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderData = orderSnap.data();

    // Return order details
    res.status(200).json({
      success: true,
      id: orderId,
      ...orderData,
      // Ensure sensitive payment info is not exposed
      paymentDetails: {
        method: orderData.paymentMethod,
        status: orderData.paymentStatus,
        // Don't expose payment tokens or sensitive data
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
}