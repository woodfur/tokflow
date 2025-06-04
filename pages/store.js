import React, { useState } from "react";
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
  SparklesIcon
} from "@heroicons/react/24/outline";
import { 
  ShoppingBagIcon as ShoppingBagIconSolid,
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid
} from "@heroicons/react/24/solid";
import { useAuthState } from "react-firebase-hooks/auth";


import MobileNavigation from "../components/MobileNavigation";
import { auth } from "../firebase/firebase";

const Store = () => {
  const [user] = useAuthState(auth);
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [likedProducts, setLikedProducts] = useState(new Set());

  const categories = [
    { id: "trending", label: "Trending", icon: FireIcon, emoji: "🔥" },
    { id: "fashion", label: "Fashion", icon: SparklesIcon, emoji: "👗" },
    { id: "tech", label: "Tech", icon: ShoppingBagIcon, emoji: "📱" },
    { id: "beauty", label: "Beauty", icon: HeartIcon, emoji: "💄" },
    { id: "home", label: "Home", icon: StarIcon, emoji: "🏠" },
  ];

  const toggleLike = (productId) => {
    const newLiked = new Set(likedProducts);
    if (newLiked.has(productId)) {
      newLiked.delete(productId);
    } else {
      newLiked.add(productId);
    }
    setLikedProducts(newLiked);
  };

  const products = [
    {
      id: 1,
      name: "Wireless Earbuds Pro",
      price: "Le 129,990",
      originalPrice: "Le 199,990",
      rating: 4.8,
      reviews: 1234,
      image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=300&fit=crop",
      discount: "35% OFF",
      category: "tech"
    },
    {
      id: 2,
      name: "Cotton T-Shirt Collection",
      price: "Le 49,990",
      originalPrice: "Le 79,990",
      rating: 4.6,
      reviews: 892,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
      discount: "38% OFF",
      category: "fashion"
    },
    {
      id: 3,
      name: "LED Ring Light Kit",
      price: "Le 89,990",
      originalPrice: "Le 149,990",
      rating: 4.9,
      reviews: 2156,
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=300&fit=crop",
      discount: "40% OFF",
      category: "tech"
    },
    {
      id: 4,
      name: "Makeup Brush Set",
      price: "Le 79,990",
      originalPrice: "Le 120,000",
      rating: 4.7,
      reviews: 567,
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop",
      discount: "33% OFF",
      category: "beauty"
    },
    {
      id: 5,
      name: "Smart Home Speaker",
      price: "Le 199,990",
      originalPrice: "Le 299,990",
      rating: 4.5,
      reviews: 1890,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
      discount: "33% OFF",
      category: "home"
    },
    {
      id: 6,
      name: "Casual Sneakers",
      price: "Le 69,990",
      originalPrice: "Le 99,990",
      rating: 4.4,
      reviews: 445,
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop",
      discount: "30% OFF",
      category: "fashion"
    },
  ];

  const filteredProducts = selectedCategory === "trending" 
    ? products.filter(product => 
        searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products.filter(product => 
        product.category === selectedCategory && 
        (searchQuery === "" || 
         product.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <Head>
        <title>Store - TokFlo</title>
        <meta name="description" content="Shop trending products from your favorite creators on TokFlo" />
        <link
          rel="icon"
          href="https://th.bing.com/th/id/R.67bc88bb600a54112e8a669a30121273?rik=vsc22vMfmcSGfg&pid=ImgRaw&r=0"
        />
      </Head>
      
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
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl">
                  <ShoppingBagIconSolid className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    TokFlo Store
                  </h1>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Trending products from creators
                  </p>
                </div>
              </div>
              
              {/* View Mode Toggle - Desktop */}
              <div className="hidden sm:flex items-center space-x-2 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl p-1 border border-neutral-200/50 dark:border-neutral-700/50">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
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
            
            <div className={`${
              viewMode === "grid" 
                ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" 
                : "space-y-4"
            }`}>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -2, scale: viewMode === "grid" ? 1.02 : 1.01 }}
                  className={`bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  {/* Product Image */}
                  <div className={`relative overflow-hidden ${
                    viewMode === "list" ? "w-24 h-24 flex-shrink-0" : "aspect-square"
                  }`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Discount Badge */}
                    <div className={`absolute bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs font-bold ${
                      viewMode === "list" 
                        ? "top-1 left-1 px-2 py-0.5" 
                        : "top-2 left-2 px-2 py-1"
                    }`}>
                      {product.discount}
                    </div>
                    
                    {/* Wishlist Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleLike(product.id)}
                      className={`absolute bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 ${
                        viewMode === "list" 
                          ? "top-1 right-1 p-1" 
                          : "top-2 right-2 p-1.5"
                      }`}
                    >
                      {likedProducts.has(product.id) ? (
                        <HeartIconSolid className={`text-red-500 ${
                          viewMode === "list" ? "w-3 h-3" : "w-4 h-4"
                        }`} />
                      ) : (
                        <HeartIcon className={`text-neutral-600 dark:text-neutral-400 ${
                          viewMode === "list" ? "w-3 h-3" : "w-4 h-4"
                        }`} />
                      )}
                    </motion.button>
                  </div>
                  
                  {/* Product Info */}
                  <div className={`${
                    viewMode === "list" ? "flex-1 p-3" : "p-3"
                  }`}>
                    <h3 className={`font-semibold text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2 ${
                      viewMode === "list" ? "text-sm" : "text-sm sm:text-base"
                    }`}>
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1 mb-2">
                      <StarIconSolid className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {product.rating}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        ({product.reviews})
                      </span>
                    </div>
                    
                    {/* Price */}
                    <div className={`flex items-center space-x-2 ${
                      viewMode === "list" ? "mb-0" : "mb-3"
                    }`}>
                      <span className={`font-bold text-neutral-900 dark:text-neutral-100 ${
                        viewMode === "list" ? "text-sm" : "text-lg"
                      }`}>
                        {product.price}
                      </span>
                      <span className={`text-neutral-500 dark:text-neutral-400 line-through ${
                        viewMode === "list" ? "text-xs" : "text-sm"
                      }`}>
                        {product.originalPrice}
                      </span>
                    </div>
                    
                    {/* Add to Cart Button - Only show in grid view or as icon in list view */}
                    {viewMode === "grid" ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Add to Cart
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute bottom-2 right-2 p-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl shadow-lg"
                      >
                        <ShoppingBagIcon className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Empty state */}
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-full flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  No products found
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Try adjusting your search or filters
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Store;