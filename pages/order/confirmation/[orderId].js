import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/firebase';
import { auth } from '../../../firebase/firebase';
import Head from 'next/head';
import Link from 'next/link';

const OrderConfirmation = () => {
  const router = useRouter();
  const { orderId } = router.query;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Order Confirmation - {order.orderNumber} | TokFlow</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-green-100 text-green-800 rounded-full p-3 inline-flex items-center justify-center mb-4">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Thank you for your order. We'll deliver it soon!</p>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">
                      {new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-green-600">
                      SLL {order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">Payment on Delivery</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Estimated Delivery:</span>
                    <p className="font-medium">
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Address:</span>
                    <p className="font-medium">
                      {order.deliveryAddress?.address}, {order.deliveryAddress?.city}
                    </p>
                  </div>
                  {order.deliveryAddress?.notes && (
                    <div>
                      <span className="text-gray-600">Delivery Notes:</span>
                      <p className="font-medium">{order.deliveryAddress.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Progress */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Progress</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`rounded-full p-2 ${order.deliveryStatus === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-500">We've received your order</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`rounded-full p-2 ${order.deliveryStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Processing</p>
                    <p className="text-sm text-gray-500">Preparing your order</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`rounded-full p-2 ${order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Delivered</p>
                    <p className="text-sm text-gray-500">Order delivered successfully</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 text-center">
              Continue Shopping
            </Link>
            <Link href={`/order/details/${order.id}`} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center">
              View Order Details
            </Link>
          </div>

          {/* Support Info */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@tokflow.com" className="text-blue-600 hover:underline">
                support@tokflow.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmation;