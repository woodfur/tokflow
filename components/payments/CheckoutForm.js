/**
 * Checkout Form Component
 * Comprehensive checkout form with payment integration
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { useCart } from '../../context/CartContext';
import PaymentMethodSelector from './PaymentMethodSelector';
import PaymentStatus from './PaymentStatus';
import { formatLeones } from '../../utils/currency';
import { PAYMENT_METHODS } from '../../utils/monime';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CheckoutForm = () => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const { cart, clearCart } = useCart();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  
  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS.MOBILE_MONEY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      }));
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart.loading && cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle input blur
  const handleInputBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  // Handle payment status change
  const handlePaymentStatusChange = (status, data) => {
    setPaymentStatus(status);
    setSessionStatus(data?.sessionStatus);
    
    if (status === 'completed' || data?.sessionStatus === 'completed') {
      toast.success('Payment completed successfully!');
      clearCart();
      // Redirect to success page after a delay
      setTimeout(() => {
        router.push(`/payment/success?orderId=${orderId}`);
      }, 2000);
    } else if (status === 'failed' || data?.sessionStatus === 'failed') {
      toast.error('Payment failed. Please try again.');
    } else if (data?.sessionStatus === 'expired') {
      toast.error('Checkout session expired. Please try again.');
    }
  };

  // Submit checkout form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    if (!user) {
      toast.error('Please log in to continue');
      router.push('/login');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare checkout data
      const checkoutData = {
        cartItems: cart.items,
        totalAmount: cart.totalAmount,
        customerInfo: {
          userId: user.uid,
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        deliveryAddress: {
          address: formData.address,
          city: formData.city,
          notes: formData.notes
        },
        paymentMethod: selectedPaymentMethod
      };

      // Create payment checkout
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment');
      }

      // Store payment information
      setOrderId(data.orderId);
      setCheckoutSessionId(data.sessionId);
      setPaymentStatus('pending');
      setSessionStatus('pending');

      // Redirect to Monime checkout session
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Checkout URL not received');
      }

    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(error.message || 'Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show payment status if payment is in progress
  if (paymentStatus && orderId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <PaymentStatus
          orderId={orderId}
          checkoutSessionId={checkoutSessionId}
          status={paymentStatus}
          sessionStatus={sessionStatus}
          amount={cart.totalAmount}
          onStatusChange={handlePaymentStatusChange}
          autoRefresh={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Checkout
            </h2>
            <p className="text-gray-600">
              Complete your order information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onBlur={() => handleInputBlur('name')}
                    className={`
                      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.name && touched.name ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Enter your full name"
                  />
                  {errors.name && touched.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={() => handleInputBlur('phone')}
                    className={`
                      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.phone && touched.phone ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="+232 XX XXX XXXX"
                  />
                  {errors.phone && touched.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleInputBlur('email')}
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.email && touched.email ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="your@email.com"
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Delivery Address
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onBlur={() => handleInputBlur('address')}
                    className={`
                      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.address && touched.address ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Street address"
                  />
                  {errors.address && touched.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    onBlur={() => handleInputBlur('city')}
                    className={`
                      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.city && touched.city ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="City"
                  />
                  {errors.city && touched.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Special delivery instructions..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border p-6">
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod}
                onMethodSelect={handlePaymentMethodSelect}
                disabled={isProcessing}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isProcessing}
              whileHover={!isProcessing ? { scale: 1.02 } : {}}
              whileTap={!isProcessing ? { scale: 0.98 } : {}}
              className={`
                w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200
                ${isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Complete Payment • {formatLeones(cart.totalAmount)}
                </div>
              )}
            </motion.button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h3>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <Image
                    src={item.imageUrl || '/default-product.png'}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                    width={48}
                    height={48}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatLeones(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatLeones(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total</span>
                <span>{formatLeones(cart.totalAmount)}</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-green-50 rounded-lg">
              <div className="flex items-start">
                <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Secure Payment
                  </p>
                  <p className="text-sm text-green-700">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;