import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { 
  getUserStore, 
  getStoreProducts, 
  updateStore,
  deleteProduct,
  updateProduct
} from '../firebase/storeOperations';
import { formatLeones } from '../utils/currency';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  CogIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  StarIcon,
  CurrencyDollarIcon,
  EyeSlashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const MyStore = () => {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadStoreData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const storeData = await getUserStore(user.uid);
          
          if (!storeData) {
            // No store found, redirect to create store
            router.push('/create-store');
            return;
          }
          
          setStore(storeData);
          console.log('Store data loaded:', storeData);
          
          // Load store products
          console.log('Loading products for store ID:', storeData.id);
          const storeProducts = await getStoreProducts(storeData.id);
          console.log('Store products loaded:', storeProducts);
          setProducts(storeProducts);
        } catch (error) {
          console.error('Error loading store data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStoreData();
  }, [user, router]);

  // Reload products when the page becomes visible (for when returning from add-product)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && store) {
        try {
          const storeProducts = await getStoreProducts(store.id);
          setProducts(storeProducts);
        } catch (error) {
          console.error('Error reloading products:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [store]);

  const handleDeleteProduct = async (productId) => {
    setIsDeleting(true);
    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await updateProduct(productId, { isActive: !currentStatus });
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isActive: !currentStatus } : p
      ));
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status.');
    }
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const totalRevenue = products.reduce((sum, p) => sum + (p.totalSales || 0) * p.price, 0);
    const averageRating = products.length > 0 
      ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length 
      : 0;
    
    return {
      totalProducts,
      activeProducts,
      totalRevenue,
      averageRating
    };
  };

  const stats = calculateStats();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!store) {
    return null; // Will redirect to create-store
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 475px) {
          .xs\:inline {
            display: inline;
          }
        }
      `}</style>
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex-shrink-0">
            <button
              onClick={() => router.push('/store')}
              className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="hidden xs:inline">Back to Store</span>
            </button>
          </div>
          
          <div className="text-center flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 sm:mb-2 truncate">
              {store.name}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 hidden sm:block">
              Manage your store and products
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={() => router.push('/add-product')}
              className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-3 sm:px-4 py-2 rounded-2xl transition-all duration-200"
              title="Add Product"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </div>

        {/* Store Banner */}
        {store.banner && (
          <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-8">
            <img
              src={store.banner}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center space-x-4">
              {store.logo && (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{store.name}</h2>
                <p className="text-white/80">{store.category}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-3 sm:p-6"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl sm:rounded-2xl">
                <ShoppingBagIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {stats.totalProducts}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-3 sm:p-6"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-xl sm:rounded-2xl">
                <EyeIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">Active Products</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {stats.activeProducts}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-3 sm:p-6"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl sm:rounded-2xl">
                <CurrencyDollarIcon className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">Total Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {formatLeones(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-3 sm:p-6"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl sm:rounded-2xl">
                <StarIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">Avg Rating</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 mb-8">
          <div className="flex overflow-x-auto border-b border-neutral-200/50 dark:border-neutral-700/50 scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'products', label: 'Products', icon: ShoppingBagIcon },
              { id: 'settings', label: 'Settings', icon: CogIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6">
                  Store Overview
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Store Information
                    </h4>
                    <div className="space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      <p><span className="font-medium">Category:</span> {store.category}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          store.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {store.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                      <p><span className="font-medium">Verified:</span> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          store.isVerified 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {store.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </p>
                      <p><span className="font-medium">Created:</span> {new Date(store.createdAt?.toDate()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Description
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {store.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Your Products ({products.length})
                  </h3>
                  <button
                    onClick={() => router.push('/add-product')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 py-2 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Add Product</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📦</div>
                    <h4 className="text-base sm:text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      No products yet
                    </h4>
                    <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mb-4 px-4">
                      Start by adding your first product to your store
                    </p>
                    <button
                      onClick={() => router.push('/add-product')}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-200 text-sm sm:text-base"
                    >
                      Add Your First Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/50 dark:bg-neutral-700/50 rounded-xl sm:rounded-2xl border border-neutral-200/50 dark:border-neutral-600/50 overflow-hidden"
                      >
                        <div className="relative aspect-square">
                          <img
                            src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 flex space-x-1">
                            <button
                              onClick={() => router.push(`/edit-product/${product.id}`)}
                              className="p-1.5 sm:p-2 rounded-full backdrop-blur-sm bg-blue-500/90 text-white"
                              title="Edit Product"
                            >
                              <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => toggleProductStatus(product.id, product.isActive)}
                              className={`p-1.5 sm:p-2 rounded-full backdrop-blur-sm ${
                                product.isActive
                                  ? 'bg-green-500/90 text-white'
                                  : 'bg-red-500/90 text-white'
                              }`}
                              title={product.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3 sm:p-4">
                          <h4 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
                            {product.name}
                          </h4>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <StarSolidIcon
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(product.rating || 0)
                                      ? "text-yellow-400"
                                      : "text-neutral-300 dark:text-neutral-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                              ({product.totalReviews || 0})
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                              {formatLeones(product.price || 0)}
                            </span>
                            <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                              product.isInStock
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {product.isInStock ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/edit-product/${product.id}`)}
                              className="flex-1 flex items-center justify-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-colors min-h-[36px] sm:min-h-[40px]"
                            >
                              <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setProductToDelete(product);
                                setShowDeleteModal(true);
                              }}
                              className="flex-1 flex items-center justify-center space-x-1 bg-red-500 hover:bg-red-600 text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-colors min-h-[36px] sm:min-h-[40px]"
                            >
                              <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Delete</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6">
                  Store Settings
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Store Settings
                    </h4>
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                      Store settings management will be available in a future update. 
                      For now, you can contact support to modify your store information.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-2 sm:mx-0"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Delete Product
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6 leading-relaxed">
                Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg sm:rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(productToDelete.id)}
                  disabled={isDeleting}
                  className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyStore;