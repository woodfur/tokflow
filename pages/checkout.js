/**
 * Checkout Page
 * Main checkout page for TokFlo store with Monime payment integration
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { useCart } from '../context/CartContext';
import Layout from '../components/Layout';
import CheckoutForm from '../components/payments/CheckoutForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { ShoppingBagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const CheckoutPage = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { cart } = useCart();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, loading, router]);

  // Redirect to cart if empty
  useEffect(() => {
    if (!cart.loading && cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  // Show loading while checking authentication
  if (loading || cart.loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  // Show loading if user is not authenticated (will redirect)
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  // Show message if cart is empty (will redirect)
  if (cart.items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some items to your cart before checking out
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Checkout
                </h1>
                <p className="text-gray-600 mt-1">
                  Complete your purchase securely
                </p>
              </div>
              
              <Link
                href="/cart"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Cart
              </Link>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    Cart
                  </span>
                </div>
                
                <div className="w-16 h-0.5 bg-blue-600"></div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium text-blue-600">
                    Checkout
                  </span>
                </div>
                
                <div className="w-16 h-0.5 bg-gray-300"></div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    Payment
                  </span>
                </div>
                
                <div className="w-16 h-0.5 bg-gray-300"></div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    Complete
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CheckoutForm />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;