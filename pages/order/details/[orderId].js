import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/firebase';
import Head from 'next/head';
import Link from 'next/link';

const OrderDetails = () => {
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
        <title>Order Details - {order.orderNumber} | TokFlow</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
            <Link href="/orders" className="text-blue-600 hover:text-blue-800">
              ← Back to Orders
            </Link>
          </div>

          {/* Order Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                <p className="text-gray-600">
                  {order.orderStatus?.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Placed on</p>
                <p className="font-medium">
                  {new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Delivery Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Delivery Progress</span>
                <span className="text-sm text-gray-600">
                  {order.deliveryStatus === 'pending' && 'Order Received'}
                  {order.deliveryStatus === 'processing' && 'Processing'}
                  {order.deliveryStatus === 'delivered' && 'Delivered'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    order.deliveryStatus === 'pending' ? 'bg-blue-600 w-1/3' :
                    order.deliveryStatus === 'processing' ? 'bg-yellow-600 w-2/3' :
                    'bg-green-600 w-full'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Ordered</span>
                <span>Processing</span>
                <span>Delivered</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.cartItems?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">
                        Price: SLL {item.price?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        SLL {(item.price * item.quantity)?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>SLL {order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Info */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">{order.customerInfo?.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium">{order.customerInfo?.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <p className="font-medium">{order.customerInfo?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Address:</span>
                    <p className="font-medium">
                      {order.deliveryAddress?.address}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">City:</span>
                    <p className="font-medium">{order.deliveryAddress?.city}</p>
                  </div>
                  {order.deliveryAddress?.notes && (
                    <div>
                      <span className="text-sm text-gray-600">Notes:</span>
                      <p className="font-medium">{order.deliveryAddress.notes}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-600">Estimated Delivery:</span>
                    <p className="font-medium">
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">Payment on Delivery</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`font-medium ${
                      order.paymentStatus === 'completed' ? 'text-green-600' :
                      order.paymentStatus === 'pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {order.paymentStatus?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-green-600">
                      SLL {order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, please contact our support team.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="mailto:support@tokflow.com" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Contact Support
              </a>
              <a 
                href="tel:+232000000000" 
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetails;