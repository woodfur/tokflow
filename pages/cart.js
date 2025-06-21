import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Cart = () => {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = async (productId) => {
    await removeFromCart(productId);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    // Simple shipping calculation - free shipping over $50, otherwise $5.99
    const subtotal = calculateSubtotal();
    return subtotal >= 50 ? 0 : 5.99;
  };

  const calculateTax = () => {
    // Simple tax calculation - 8.5%
    return calculateSubtotal() * 0.085;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };

  const handleCheckout = () => {
    // For now, just show an alert. In a real app, this would integrate with a payment processor
    alert('Checkout functionality would be implemented here with a payment processor like Stripe.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/store')}
            className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Continue Shopping</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center justify-center space-x-3">
              <ShoppingCartIcon className="w-8 h-8" />
              <span>Shopping Cart</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>
          
          {cart.items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.items.length === 0 ? (
          /* Empty Cart */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-12 max-w-md mx-auto">
              <ShoppingCartIcon className="w-16 h-16 text-neutral-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Your cart is empty
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <button
                onClick={() => router.push('/store')}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-8 rounded-2xl font-semibold transition-all duration-200"
              >
                Start Shopping
              </button>
            </div>
          </motion.div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6"
                >
                  <div className="flex items-center space-x-6">
                    {/* Product Image */}
                    <div 
                      className="w-24 h-24 bg-neutral-100 dark:bg-neutral-700 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => router.push(`/product/${item.productId}`)}
                    >
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 
                        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1 cursor-pointer hover:text-primary-600 transition-colors"
                        onClick={() => router.push(`/product/${item.productId}`)}
                      >
                        {item.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        Sold by {item.storeName}
                      </p>
                      <p className="text-xl font-bold text-primary-600">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        className="p-2 rounded-xl border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      
                      <span className="w-12 text-center font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        className="p-2 rounded-xl border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 sticky top-8"
              >
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      ${calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Shipping</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {calculateShipping() === 0 ? 'Free' : `$${calculateShipping().toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Tax</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      ${calculateTax().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Total</span>
                      <span className="text-lg font-bold text-primary-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Shipping Info */}
                <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-2xl p-4 mb-6 space-y-3">
                  <div className="flex items-center space-x-3">
                    <TruckIcon className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {calculateShipping() === 0 ? 'Free Shipping' : 'Standard Shipping'}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {calculateShipping() === 0 
                          ? 'On orders over $50' 
                          : '5-7 business days'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        Secure Checkout
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Your payment info is protected
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <CreditCardIcon className="w-5 h-5" />
                  <span>Proceed to Checkout</span>
                </button>
                
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-4">
                  By proceeding to checkout, you agree to our Terms of Service and Privacy Policy.
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;