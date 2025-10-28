/**
 * Payment Failed Page
 * Displays payment failure information and retry options
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { formatLeones } from '../../utils/currency';
import {
  XCircleIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const PaymentFailedPage = () => {
  const router = useRouter();
  const { orderId, reason, amount } = router.query;
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Common failure reasons and their user-friendly messages
  const getFailureMessage = (reason) => {
    const messages = {
      'insufficient_funds': 'Insufficient funds in your account',
      'card_declined': 'Your card was declined by the bank',
      'expired_card': 'Your card has expired',
      'invalid_card': 'Invalid card information provided',
      'network_error': 'Network connection error occurred',
      'timeout': 'Payment request timed out',
      'cancelled': 'Payment was cancelled',
      'authentication_failed': 'Payment authentication failed',
      'limit_exceeded': 'Transaction limit exceeded',
      'blocked_transaction': 'Transaction was blocked by your bank',
      'default': 'Payment could not be processed'
    };

    return messages[reason] || messages.default;
  };

  // Get suggested actions based on failure reason
  const getSuggestedActions = (reason) => {
    const actions = {
      'insufficient_funds': [
        'Check your account balance',
        'Try a different payment method',
        'Contact your bank for assistance'
      ],
      'card_declined': [
        'Verify your card details are correct',
        'Contact your bank to authorize the transaction',
        'Try a different card'
      ],
      'expired_card': [
        'Use a valid, non-expired card',
        'Update your payment information',
        'Try a different payment method'
      ],
      'network_error': [
        'Check your internet connection',
        'Try again in a few minutes',
        'Use a different device or browser'
      ],
      'timeout': [
        'Try the payment again',
        'Check your internet connection',
        'Use a different payment method'
      ],
      'default': [
        'Verify your payment information',
        'Try a different payment method',
        'Contact customer support if the issue persists'
      ]
    };

    return actions[reason] || actions.default;
  };

  // Handle retry payment
  const handleRetryPayment = () => {
    if (orderId) {
      // Redirect back to checkout with the same order
      router.push(`/checkout?retry=${orderId}`);
    } else {
      // Redirect to cart to start over
      router.push('/cart');
    }
    setRetryAttempts(prev => prev + 1);
  };

  // Handle contact support
  const handleContactSupport = () => {
    // You can implement this to open a support chat, email, or phone
    window.location.href = 'mailto:support@tokflo.com?subject=Payment Failed - Order ' + orderId;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Failure Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600">
              We couldn't process your payment. Please try again.
            </p>
          </motion.div>

          {/* Failure Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <div className="flex items-start space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  What went wrong?
                </h2>
                <p className="text-gray-700">
                  {getFailureMessage(reason)}
                </p>
              </div>
            </div>

            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono text-sm font-medium text-gray-900">{orderId}</p>
                  </div>
                  {amount && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium text-gray-900">{formatLeones(parseInt(amount))}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                What you can do:
              </h3>
              <ul className="space-y-2">
                {getSuggestedActions(reason).map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Primary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleRetryPayment}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Try Again
              </button>
              
              <Link
                href="/cart"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <ShoppingCartIcon className="w-5 h-5 mr-2" />
                Back to Cart
              </Link>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={handleContactSupport}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Contact Support
              </button>
              
              <Link
                href="tel:+23276123456"
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <PhoneIcon className="w-4 h-4 mr-2" />
                Call Us
              </Link>
              
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Home
              </Link>
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-blue-50 rounded-lg p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-3">
              Need Help?
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Our customer support team is available 24/7</p>
              <p>• Email: support@tokflo.com</p>
              <p>• Phone: +232 76 123 456</p>
              <p>• Live chat available on our website</p>
            </div>
          </motion.div>

          {/* Retry Counter (for debugging/analytics) */}
          {retryAttempts > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-sm text-gray-500"
            >
              Retry attempts: {retryAttempts}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentFailedPage;