import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore as db } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import Head from 'next/head';
import Link from 'next/link';

const OrdersPage = () => {
  const [user, loading] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoadingOrders(true);
        const ordersQuery = query(
          collection(db, 'orders'),
          where('customerInfo.userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setOrders(ordersData);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view your orders.</p>
          <Link href="/auth/signin" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders | TokFlow</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">View your order history and track current orders</p>
          </div>

          {loadingOrders ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Orders</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
              <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`
                          rounded-full p-2 ${
                            order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.deliveryStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.deliveryStatus === 'delivered' ? '✓' :
                           order.deliveryStatus === 'processing' ? '🔄' : '📦'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <p className="font-medium text-green-600">
                            SLL {order.totalAmount?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className={`font-medium ${
                            order.deliveryStatus === 'delivered' ? 'text-green-600' :
                            order.deliveryStatus === 'processing' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {order.deliveryStatus?.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Payment:</span>
                          <p className="font-medium">
                            {order.paymentMethod?.replace(/_/g, ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6">
                      <Link 
                        href={`/order/details/${order.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 block text-center"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
                    <div className="flex space-x-2 overflow-x-auto">
                      {order.cartItems?.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-xs">📦</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {order.cartItems?.length > 5 && (
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-600 text-sm">+{order.cartItems.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersPage;