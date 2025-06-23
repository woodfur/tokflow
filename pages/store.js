import React, { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { 
  ShoppingBagIcon, 
  StarIcon, 
  HeartIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FireIcon,
  SparklesIcon,
  PlusIcon,
  ShoppingCartIcon,
  EyeIcon,
  BuildingStorefrontIcon
} from "@heroicons/react/24/outline";
import { 
  ShoppingBagIcon as ShoppingBagIconSolid,
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid
} from "@heroicons/react/24/solid";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

import MobileNavigation from "../components/MobileNavigation";
import { auth } from "../firebase/firebase";
import { useCart } from "../context/CartContext";
import {
  getActiveProducts,
  searchProducts,
  addToWishlist,
  removeFromWishlist,
  getUserStore
} from "../firebase/storeOperations";

const Store = () => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const { cart, addItemToCart, isInCart, getItemQuantity } = useCart();
  
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStore, setUserStore] = useState(null);
  const [wishlist, setWishlist] = useState(new Set());

  const categories = [
    { id: "trending", label: "Trending", icon: FireIcon, emoji: "🔥" },
    { id: "fashion", label: "Fashion", icon: SparklesIcon, emoji: "👗" },
    { id: "tech", label: "Tech", icon: ShoppingBagIcon, emoji: "📱" },
    { id: "beauty", label: "Beauty", icon: HeartIcon, emoji: "💄" },
    { id: "home", label: "Home", icon: StarIcon, emoji: "🏠" },
  ];

  // Load products and user data
  useEffect(() => {
    loadProducts();
    if (user) {
      loadUserStore();
      loadUserWishlist();
    }
  }, [user, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let fetchedProducts;
      
      if (searchQuery.trim()) {
        fetchedProducts = await searchProducts(
          searchQuery,
          selectedCategory === 'trending' ? null : selectedCategory,
          50
        );
      } else {
        fetchedProducts = await getActiveProducts(
          50,
          selectedCategory === 'trending' ? null : selectedCategory
        );
      }
      
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStore = async () => {
    try {
      const store = await getUserStore(user.uid);
      setUserStore(store);
    } catch (error) {
      console.error('Error loading user store:', error);
    }
  };

  const loadUserWishlist = async () => {
    // This would typically come from user profile
    // For now, we'll use local state
    setWishlist(new Set());
  };

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || selectedCategory !== 'trending') {
        loadProducts();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleLike = async (productId) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      if (wishlist.has(productId)) {
        await removeFromWishlist(user.uid, productId);
        setWishlist(prev => {
          const newWishlist = new Set(prev);
          newWishlist.delete(productId);
          return newWishlist;
        });
      } else {
        await addToWishlist(user.uid, productId);
        setWishlist(prev => new Set([...prev, productId]));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      await addItemToCart(productId, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const navigateToCreateStore = () => {
    router.push('/create-store');
  };

  const navigateToMyStore = () => {
    if (userStore) {
      router.push('/my-store');
    }
  };



  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 relative">
      <Head>
        <title>Store - TokFlo</title>
        <meta name="description" content="Shop trending products from your favorite creators on TokFlo" />
        <link
          rel="icon"
          href="https://th.bing.com/th/id/R.67bc88bb600a54112e8a669a30121273?rik=vsc22vMfmcSGfg&pid=ImgRaw&r=0"
        />
      </Head>
      
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center px-6 py-8 max-w-md mx-auto"
        >
          {/* Store Icon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center shadow-lg">
              <BuildingStorefrontIcon className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          {/* Coming Soon Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Coming Soon
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">
              TokFlo Store
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              We&apos;re working hard to bring you an amazing shopping experience
            </p>
          </motion.div>
          
          {/* Sparkle Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-12 h-12 mx-auto"
            >
              <SparklesIcon className="w-full h-full text-primary-500" />
            </motion.div>
          </motion.div>
          
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Go Back</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      
      <main className="pt-4 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
          {/* Store Header - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex-shrink-0">
                  <ShoppingBagIconSolid className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    TokFlo Store
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">
                    Trending products from creators
                  </p>
                </div>
              </div>
              
              {/* Top Right Icon Navigation */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {/* Cart Icon with Badge */}
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/cart")}
                    className="relative p-2 sm:p-3 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl hover:bg-white dark:hover:bg-neutral-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Shopping Cart"
                  >
                    <ShoppingCartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 dark:text-neutral-300" />
                    {cart.items && cart.items.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                        {cart.items.reduce((total, item) => total + item.quantity, 0)}
                      </span>
                    )}
                  </motion.button>
                )}
                
                {/* Wishlist Icon */}
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/wishlist")}
                    className="p-2 sm:p-3 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl hover:bg-white dark:hover:bg-neutral-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Wishlist"
                  >
                    <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 dark:text-neutral-300" />
                  </motion.button>
                )}
                
                {/* Create/My Store Icon */}
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={userStore ? navigateToMyStore : navigateToCreateStore}
                    className={`p-2 sm:p-3 backdrop-blur-sm border rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                      userStore 
                        ? "bg-primary-500/90 border-primary-400/50 hover:bg-primary-500 text-white"
                        : "bg-green-500/90 border-green-400/50 hover:bg-green-500 text-white"
                    }`}
                    title={userStore ? "My Store" : "Create Store"}
                  >
                    {userStore ? (
                      <BuildingStorefrontIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </motion.button>
                )}
                
                {/* View Mode Toggle - Desktop Only */}
                <div className="hidden lg:flex items-center space-x-1 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-1 border border-neutral-200/50 dark:border-neutral-700/50">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                    title="Grid View"
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                    title="List View"
                  >
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Search Bar - Mobile First */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <FunnelIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200" />
              </button>
            </div>
          </motion.div>

          {/* Category Filter - TikTok Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`relative flex flex-col items-center justify-center min-w-[80px] h-20 rounded-2xl font-medium transition-all duration-300 whitespace-nowrap group ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 text-white shadow-xl shadow-primary-500/25"
                        : "bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-white/90 dark:hover:bg-neutral-800/90 border border-neutral-200/50 dark:border-neutral-700/50 hover:shadow-lg"
                    }`}
                  >
                    {/* Background glow effect for active category */}
                    {selectedCategory === category.id && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl blur-xl opacity-30 -z-10 scale-110" />
                    )}
                    
                    {/* Icon */}
                    <div className={`mb-1 transition-all duration-300 ${
                      selectedCategory === category.id ? "scale-110" : "group-hover:scale-105"
                    }`}>
                      {selectedCategory === category.id ? (
                        <span className="text-xl">{category.emoji}</span>
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <span className={`text-xs font-semibold transition-all duration-300 ${
                      selectedCategory === category.id ? "text-white" : "text-neutral-600 dark:text-neutral-400"
                    }`}>
                      {category.label}
                    </span>
                    
                    {/* Active indicator */}
                    {selectedCategory === category.id && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute -bottom-1 w-8 h-1 bg-white rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Products Grid - Enhanced Mobile Design */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {filteredProducts.length} products found
              </p>
              {/* Mobile view toggle */}
              <div className="flex sm:hidden items-center space-x-2 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-1 border border-neutral-200/50 dark:border-neutral-700/50">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary-500 text-white"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-500 text-white"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Loading State */}
            {loading ? (
              <div className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 animate-pulse">
                    <div className="aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-2xl mb-4"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-3 w-3/4"></div>
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded mb-4 w-1/2"></div>
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-2xl"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  No products found
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {products.length === 0 ? 'No products available yet. Be the first to list a product!' : 'Try adjusting your search or category filters'}
                </p>
              </div>
            ) : (
              <div className={`grid ${
                viewMode === "grid" 
                  ? "gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "gap-6 grid-cols-1"
              }`}>
                {filteredProducts.map((product, index) => {
                  const discount = product.originalPrice && product.originalPrice > product.price 
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : null;
                  
                  const isLiked = wishlist.has(product.id);
                  const inCart = isInCart(product.id);
                  const cartQuantity = getItemQuantity(product.id);
                  
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                        viewMode === "list" ? "flex items-center space-x-6 p-6" : "p-3 sm:p-6"
                      }`}
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      {/* Product Image */}
                      <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl ${
                        viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "aspect-square mb-2 sm:mb-4"
                      }`}>
                        <img
                          src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';
                          }}
                        />
                        
                        {/* Discount Badge */}
                        {discount && (
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                            {discount}% OFF
                          </div>
                        )}
                        
                        {/* Stock Status */}
                        {!product.isInStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold">Out of Stock</span>
                          </div>
                        )}
                        
                        {/* Wishlist Button */}
                        <button
                          onClick={() => toggleLike(product.id)}
                          className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-110"
                        >
                          {isLiked ? (
                            <HeartIconSolid className="w-5 h-5 text-red-500" />
                          ) : (
                            <HeartIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          )}
                        </button>
                      </div>
                      
                      {/* Product Info */}
                      <div className={viewMode === "list" ? "flex-1" : ""}>
                        <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1 sm:mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        
                        {/* Description for list view */}
                        {viewMode === "list" && product.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        {/* Rating */}
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-2 sm:mb-3">
                          <div className="flex items-center space-x-0.5 sm:space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid
                                key={i}
                                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                  i < Math.floor(product.rating || 0)
                                    ? "text-yellow-400"
                                    : "text-neutral-300 dark:text-neutral-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                            ({product.totalReviews || 0})
                          </span>
                          {product.stock <= 5 && product.stock > 0 && (
                            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium hidden sm:inline">
                              Only {product.stock} left
                            </span>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-3 sm:mb-4">
                          <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            ${product.price?.toFixed(2) || '0.00'}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Add to Cart Button */}
                        <button 
                          onClick={() => handleAddToCart(product.id)}
                          disabled={!product.isInStock}
                          className={`w-full text-xs sm:text-sm font-medium py-2 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 group/btn ${
                            !product.isInStock
                              ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                              : inCart
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                              : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white hover:shadow-lg hover:shadow-primary-500/25'
                          }`}
                        >
                          <ShoppingBagIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:scale-110 transition-transform" />
                          <span>
                            {!product.isInStock 
                              ? 'Out of Stock'
                              : inCart 
                              ? `In Cart (${cartQuantity})`
                              : 'Add to Cart'
                            }
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Store;