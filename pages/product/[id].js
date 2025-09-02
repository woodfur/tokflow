import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { 
  getProduct, 
  getStore,
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  createProductReview,
  getProductReviews
} from '../../firebase/storeOperations';
import { useCart } from '../../context/CartContext';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  HeartIcon,
  ShoppingCartIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BuildingStorefrontIcon,
  TagIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, loading, error] = useAuthState(auth);
  const { addToCart, cart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Check if product is in cart
  const cartItem = cart.items.find(item => item.productId === id);
  const isInCart = !!cartItem;
  
  useEffect(() => {
    const loadProductData = async () => {
      if (id) {
        try {
          setIsLoading(true);
          
          // Load product
          const productData = await getProduct(id);
          if (!productData) {
            alert('Product not found');
            router.push('/store');
            return;
          }
          setProduct(productData);
          
          // Load store
          const storeData = await getStore(productData.storeId);
          setStore(storeData);
          
          // Load reviews
          const reviewsData = await getProductReviews(id);
          setReviews(reviewsData);
          
          // Check wishlist status if user is logged in
          if (user) {
            const wishlist = await getUserWishlist(user.uid);
            setIsInWishlist(wishlist.includes(id));
          }
          
        } catch (error) {
          console.error('Error loading product:', error);
          alert('Failed to load product data.');
          router.push('/store');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProductData();
  }, [id, user, router]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (product.stock < quantity) {
      alert('Not enough stock available');
      return;
    }
    
    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.thumbnail || product.images[0],
        sellerId: product.sellerId,
        storeId: product.storeId,
        storeName: store?.name || 'Unknown Store'
      }, quantity);
      
      // Redirect to cart page instead of showing alert
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart.');
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      if (isInWishlist) {
        await removeFromWishlist(user.uid, id);
        setIsInWishlist(false);
      } else {
        await addToWishlist(user.uid, id);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Failed to update wishlist.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!reviewForm.comment.trim()) {
      alert('Please write a review comment.');
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      await createProductReview({
        productId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || null,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        createdAt: new Date()
      });
      
      // Reload reviews
      const updatedReviews = await getProductReviews(id);
      setReviews(updatedReviews);
      
      // Reset form
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
      
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getDiscountPercentage = () => {
    if (!product.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
    if (product.stock <= 5) return { text: `Only ${product.stock} left`, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Product Not Found
          </h2>
          <button
            onClick={() => router.push('/store')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const averageRating = calculateAverageRating();
  const discountPercentage = getDiscountPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="aspect-square bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden border border-neutral-200/50 dark:border-neutral-700/50">
              <img
                src={product.images[selectedImage] || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
            </div>
            
            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Store Info */}
            <div className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
              <BuildingStorefrontIcon className="w-6 h-6 text-primary-600" />
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Sold by</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{store.name}</p>
              </div>
            </div>

            {/* Product Title & Rating */}
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                {product.name}
              </h1>
              
              {reviews.length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(averageRating)
                            ? 'text-yellow-400'
                            : 'text-neutral-300 dark:text-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {averageRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-primary-600">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-neutral-500 dark:text-neutral-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-sm font-semibold">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}>
              {product.stock === 0 ? (
                <ExclamationTriangleIcon className="w-4 h-4" />
              ) : (
                <CheckBadgeIcon className="w-4 h-4" />
              )}
              <span>{stockStatus.text}</span>
            </div>

            {/* Condition */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Condition:</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                {product.condition}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Description
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  Key Features
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckBadgeIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm"
                    >
                      <TagIcon className="w-3 h-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              {product.stock > 0 && (
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Quantity:
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || (user && product.sellerId === user.uid)}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-neutral-400 disabled:to-neutral-500 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  <span>
                    {isInCart
                      ? `In Cart (${cartItem.quantity})`
                      : product.stock === 0
                      ? 'Out of Stock'
                      : user && product.sellerId === user.uid
                      ? 'Your Product'
                      : 'Add to Cart'
                    }
                  </span>
                </button>
                
                <button
                  onClick={handleWishlistToggle}
                  disabled={!user || (user && product.sellerId === user.uid)}
                  className="p-4 border-2 border-primary-200 dark:border-primary-700 hover:border-primary-300 dark:hover:border-primary-600 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInWishlist ? (
                    <HeartIconSolid className="w-6 h-6 text-red-500" />
                  ) : (
                    <HeartIcon className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <TruckIcon className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {product.shippingInfo?.freeShipping ? 'Free Shipping' : `Shipping: $${product.shippingInfo?.shippingCost || 0}`}
                  </p>
                  {product.shippingInfo?.processingTime && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Processing time: {product.shippingInfo.processingTime}
                    </p>
                  )}
                </div>
              </div>
              
              {product.allowReturns && (
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      Returns Accepted
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {product.returnPolicy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
              <span>Reviews ({reviews.length})</span>
            </h2>
            
            {user && user.uid !== product.sellerId && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Write Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleReviewSubmit}
              className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-700/50 rounded-2xl space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <StarIconSolid
                        className={`w-6 h-6 ${
                          star <= reviewForm.rating
                            ? 'text-yellow-400'
                            : 'text-neutral-300 dark:text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Review
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Share your experience with this product..."
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white px-6 py-2 rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-700 dark:text-neutral-300 px-6 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400">
                  No reviews yet. Be the first to review this product!
                </p>
              </div>
            ) : (
              reviews.map((review, index) => (
                <motion.div
                  key={review.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-neutral-200 dark:border-neutral-700 pb-6 last:border-b-0"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      {review.userPhoto ? (
                        <img
                          src={review.userPhoto}
                          alt={review.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {review.userName}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400'
                                  : 'text-neutral-300 dark:text-neutral-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {new Date(review.createdAt.toDate()).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;