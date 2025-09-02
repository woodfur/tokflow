import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { getUserWishlist, removeFromWishlist } from '../firebase/storeOperations';
import { useCart } from '../context/CartContext';
import { formatLeones, calculateDiscountPercentage } from '../utils/currency';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  HeartIcon,
  ShoppingCartIcon,
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const Wishlist = () => {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const { addToCart, cart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const wishlistData = await getUserWishlist(user.uid);
      setWishlist(wishlistData);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(user.uid, productId);
      setWishlist(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      // Redirect to cart page after adding item
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const isInCart = (productId) => {
    return cart.items.some(item => item.productId === productId);
  };

  const getCartQuantity = (productId) => {
    const cartItem = cart.items.find(item => item.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };



  if (loading || isLoading) {
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
            <span>Back to Store</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center justify-center space-x-3">
              <HeartSolidIcon className="w-8 h-8 text-red-500" />
              <span>My Wishlist</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved for later
            </p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {wishlist.length === 0 ? (
          /* Empty Wishlist */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-12 max-w-md mx-auto">
              <HeartIcon className="w-16 h-16 text-neutral-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Your wishlist is empty
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Save items you love to your wishlist and shop them later.
              </p>
              <button
                onClick={() => router.push('/store')}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-8 rounded-2xl font-semibold transition-all duration-200"
              >
                Discover Products
              </button>
            </div>
          </motion.div>
        ) : (
          /* Wishlist Items */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product, index) => {
              const discountPercentage = calculateDiscountPercentage(product.originalPrice, product.price);
              const inCart = isInCart(product.id);
              const cartQuantity = getCartQuantity(product.id);
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => router.push(`/product/${product.id}`)}
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                    
                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                        -{discountPercentage}%
                      </div>
                    )}
                    
                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <HeartSolidIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Stock Status */}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-4">
                    <h3 
                      className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      by {product.storeName}
                    </p>
                    
                    {/* Rating */}
                    {product.averageRating > 0 && (
                      <div className="flex items-center space-x-1 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.averageRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-neutral-300 dark:text-neutral-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          ({product.reviewCount || 0})
                        </span>
                      </div>
                    )}
                    
                    {/* Price */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg font-bold text-primary-600">
                        {formatLeones(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-neutral-500 dark:text-neutral-400 line-through">
                          {formatLeones(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    
                    {/* Stock Info */}
                    {product.stock > 0 && product.stock <= 10 && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">
                        Only {product.stock} left in stock
                      </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {product.stock > 0 ? (
                        <>
                          {inCart ? (
                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                In Cart ({cartQuantity})
                              </span>
                              <ShoppingCartIcon className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                            >
                              <ShoppingCartIcon className="w-4 h-4" />
                              <span>Add to Cart</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 py-2 px-4 rounded-xl font-medium cursor-not-allowed"
                        >
                          Out of Stock
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRemoveFromWishlist(product.id)}
                        className="w-full border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;