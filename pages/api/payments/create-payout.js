/**
 * API Route: Create Seller Payout
 * Creates payouts for sellers using Monime payout functionality
 */

import { createPayout } from '../../../utils/monime';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported' 
    });
  }

  try {
    const {
      sellerId,
      amount,
      payoutAccount,
      description,
      orderIds = []
    } = req.body;

    // Validate required fields
    if (!sellerId || !amount || !payoutAccount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sellerId, amount, and payoutAccount are required'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    // Get seller information
    const sellerDoc = await getDoc(doc(db, 'users', sellerId));
    if (!sellerDoc.exists()) {
      return res.status(404).json({
        error: 'Seller not found',
        message: `Seller with ID ${sellerId} does not exist`
      });
    }

    const sellerData = sellerDoc.data();

    // Validate seller has store
    if (!sellerData.hasStore) {
      return res.status(400).json({
        error: 'Invalid seller',
        message: 'User does not have an active store'
      });
    }

    // Calculate available balance for seller
    const availableBalance = await calculateSellerBalance(sellerId);
    
    if (amount > availableBalance) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `Requested amount (${amount}) exceeds available balance (${availableBalance})`
      });
    }

    // Generate unique payout ID
    const payoutId = `payout_${sellerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare payout data for Monime
    const payoutData = {
      amount,
      sellerId,
      sellerAccount: payoutAccount,
      description: description || `Payout for seller ${sellerData.displayName || sellerId}`,
      metadata: {
        sellerId,
        sellerName: sellerData.displayName,
        sellerEmail: sellerData.email,
        payoutId,
        orderIds: orderIds.length > 0 ? orderIds : null,
        source: 'tokflo_store'
      }
    };

    // Create payout with Monime
    const payoutResponse = await createPayout(payoutData);

    // Store payout record in Firebase
    const payoutRecord = {
      payoutId,
      monimePayoutId: payoutResponse.id,
      sellerId,
      sellerInfo: {
        name: sellerData.displayName,
        email: sellerData.email,
        phone: sellerData.phone
      },
      amount,
      currency: payoutResponse.currency,
      payoutAccount,
      description: payoutData.description,
      status: 'pending',
      orderIds,
      monimeResponse: payoutResponse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Save payout record
    await setDoc(doc(db, 'payouts', payoutId), payoutRecord);

    // Update seller's payout history
    const sellerPayoutRef = doc(db, 'seller_payouts', sellerId);
    const sellerPayoutDoc = await getDoc(sellerPayoutRef);
    
    if (sellerPayoutDoc.exists()) {
      const existingData = sellerPayoutDoc.data();
      await updateDoc(sellerPayoutRef, {
        totalPayouts: (existingData.totalPayouts || 0) + amount,
        payoutCount: (existingData.payoutCount || 0) + 1,
        lastPayoutAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(sellerPayoutRef, {
        sellerId,
        totalPayouts: amount,
        payoutCount: 1,
        lastPayoutAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Log successful payout creation
    console.log(`Payout created for seller: ${sellerId}`, {
      payoutId,
      monimePayoutId: payoutResponse.id,
      amount,
      account: payoutAccount
    });

    // Return payout information
    res.status(200).json({
      success: true,
      payoutId,
      monimePayoutId: payoutResponse.id,
      amount,
      currency: payoutResponse.currency,
      status: payoutResponse.status,
      estimatedArrival: payoutResponse.estimated_arrival,
      message: 'Payout created successfully'
    });

  } catch (error) {
    console.error('Payout creation failed:', error);
    
    // Return appropriate error response
    const statusCode = error.message.includes('validation') ? 400 : 500;
    res.status(statusCode).json({
      error: 'Payout creation failed',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Calculate available balance for seller
 * @param {string} sellerId - Seller ID
 * @returns {Promise<number>} Available balance
 */
async function calculateSellerBalance(sellerId) {
  try {
    // Get all completed orders for this seller
    const ordersQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'paid')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    let totalEarnings = 0;

    // Calculate earnings from orders
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      if (orderData.cartItems) {
        orderData.cartItems.forEach(item => {
          if (item.sellerId === sellerId) {
            // Calculate seller's share (assuming 90% after platform fee)
            const sellerShare = item.price * item.quantity * 0.9;
            totalEarnings += sellerShare;
          }
        });
      }
    });

    // Get total payouts already made
    const payoutsQuery = query(
      collection(db, 'payouts'),
      where('sellerId', '==', sellerId),
      where('status', 'in', ['pending', 'completed'])
    );
    
    const payoutsSnapshot = await getDocs(payoutsQuery);
    let totalPayouts = 0;

    payoutsSnapshot.forEach(doc => {
      const payoutData = doc.data();
      totalPayouts += payoutData.amount;
    });

    // Available balance = earnings - payouts
    return Math.max(0, totalEarnings - totalPayouts);

  } catch (error) {
    console.error('Balance calculation failed:', error);
    return 0;
  }
}