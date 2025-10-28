import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function PaymentCancel() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Clear any payment-related data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('checkoutSessionId');
      localStorage.removeItem('pendingOrder');
    }
  }, []);

  const handleReturnToCart = () => {
    router.push('/cart');
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              {/* Cancel Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Payment Cancelled
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                Your payment was cancelled. No charges were made to your account.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleReturnToCart}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Cart
                </button>
                
                <button
                  onClick={handleContinueShopping}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue Shopping
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>Need help? Contact our support team.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}