import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { 
  getProduct, 
  updateProduct, 
  getUserStore 
} from '../../firebase/storeOperations';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing & Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Health & Beauty',
  'Books & Media',
  'Toys & Games',
  'Food & Beverages',
  'Automotive',
  'Art & Crafts',
  'Jewelry & Accessories',
  'Pet Supplies',
  'Office Supplies',
  'Musical Instruments',
  'Other'
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

const EditProduct = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, loading, error] = useAuthState(auth);
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    condition: 'new',
    stock: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    images: [],
    tags: [],
    features: [],
    specifications: {},
    shippingInfo: {
      freeShipping: false,
      shippingCost: '',
      processingTime: '',
      shippingMethods: []
    },
    isActive: true,
    allowReturns: true,
    returnPolicy: '30 days'
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [currentFeature, setCurrentFeature] = useState('');
  const [imageUrls, setImageUrls] = useState(['']);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadProductData = async () => {
      if (user && id) {
        try {
          setIsLoading(true);
          
          // Load product
          const productData = await getProduct(id);
          if (!productData) {
            alert('Product not found');
            router.push('/my-store');
            return;
          }
          
          // Check if user owns this product
          if (productData.sellerId !== user.uid) {
            alert('You do not have permission to edit this product');
            router.push('/my-store');
            return;
          }
          
          setProduct(productData);
          
          // Load store
          const storeData = await getUserStore(user.uid);
          if (!storeData) {
            router.push('/create-store');
            return;
          }
          setStore(storeData);
          
          // Populate form with product data
          setFormData({
            name: productData.name || '',
            description: productData.description || '',
            price: productData.price?.toString() || '',
            originalPrice: productData.originalPrice?.toString() || '',
            category: productData.category || '',
            condition: productData.condition || 'new',
            stock: productData.stock?.toString() || '',
            sku: productData.sku || '',
            weight: productData.weight?.toString() || '',
            dimensions: {
              length: productData.dimensions?.length?.toString() || '',
              width: productData.dimensions?.width?.toString() || '',
              height: productData.dimensions?.height?.toString() || ''
            },
            images: productData.images || [],
            tags: productData.tags || [],
            features: productData.features || [],
            specifications: productData.specifications || {},
            shippingInfo: {
              freeShipping: productData.shippingInfo?.freeShipping || false,
              shippingCost: productData.shippingInfo?.shippingCost?.toString() || '',
              processingTime: productData.shippingInfo?.processingTime || '',
              shippingMethods: productData.shippingInfo?.shippingMethods || []
            },
            isActive: productData.isActive !== undefined ? productData.isActive : true,
            allowReturns: productData.allowReturns !== undefined ? productData.allowReturns : true,
            returnPolicy: productData.returnPolicy || '30 days'
          });
          
          // Set image URLs for editing
          const urls = productData.images || [];
          setImageUrls(urls.length > 0 ? [...urls, ''] : ['']);
          
        } catch (error) {
          console.error('Error loading product:', error);
          alert('Failed to load product data.');
          router.push('/my-store');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProductData();
  }, [user, id, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addFeature = () => {
    if (currentFeature.trim() && !formData.features.includes(currentFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, currentFeature.trim()]
      }));
      setCurrentFeature('');
    }
  };

  const removeFeature = (featureToRemove) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }));
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    
    // Update formData with valid URLs
    const validUrls = newUrls.filter(url => url.trim() !== '');
    setFormData(prev => ({ ...prev, images: validUrls }));
  };

  const addImageUrl = () => {
    if (imageUrls.length < 10) {
      setImageUrls([...imageUrls, '']);
    }
  };

  const removeImageUrl = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    
    const validUrls = newUrls.filter(url => url.trim() !== '');
    setFormData(prev => ({ ...prev, images: validUrls }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required';
    if (formData.images.length === 0) newErrors.images = 'At least one product image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stock: parseInt(formData.stock),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null
        },
        shippingInfo: {
          ...formData.shippingInfo,
          shippingCost: formData.shippingInfo.shippingCost ? parseFloat(formData.shippingInfo.shippingCost) : 0
        },
        thumbnail: formData.images[0] || null,
        updatedAt: new Date()
      };
      
      await updateProduct(id, updateData);
      
      alert('Product updated successfully!');
      router.push('/my-store');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!store || !product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/my-store')}
            className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to My Store</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Edit Product
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Update {product.name}
            </p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8"
              >
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center space-x-2">
                  <ClipboardDocumentListIcon className="w-6 h-6" />
                  <span>Basic Information</span>
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-2xl border ${errors.name ? 'border-red-300' : 'border-neutral-300'} dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      placeholder="Enter product name"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-2xl border ${errors.description ? 'border-red-300' : 'border-neutral-300'} dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none`}
                      placeholder="Describe your product"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-2xl border ${errors.category ? 'border-red-300' : 'border-neutral-300'} dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      >
                        <option value="">Select a category</option>
                        {PRODUCT_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Condition
                      </label>
                      <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        {CONDITIONS.map(condition => (
                          <option key={condition.value} value={condition.value}>
                            {condition.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Pricing & Inventory */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8"
              >
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center space-x-2">
                  <CurrencyDollarIcon className="w-6 h-6" />
                  <span>Pricing & Inventory</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Price (Le) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 rounded-2xl border ${errors.price ? 'border-red-300' : 'border-neutral-300'} dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Original Price (Le)
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full px-4 py-3 rounded-2xl border ${errors.stock ? 'border-red-300' : 'border-neutral-300'} dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      placeholder="0"
                    />
                    {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Product SKU"
                  />
                </div>
              </motion.div>

              {/* Product Images */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8"
              >
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center space-x-2">
                  <PhotoIcon className="w-6 h-6" />
                  <span>Product Images *</span>
                </h2>
                
                <div className="space-y-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Enter image URL"
                      />
                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {imageUrls.length < 10 && (
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Add another image</span>
                    </button>
                  )}
                  
                  {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
                </div>
              </motion.div>

              {/* Tags & Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8"
              >
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center space-x-2">
                  <TagIcon className="w-6 h-6" />
                  <span>Tags & Features</span>
                </h2>
                
                <div className="space-y-6">
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Tags
                    </label>
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Add a tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Key Features
                    </label>
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="text"
                        value={currentFeature}
                        onChange={(e) => setCurrentFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        className="flex-1 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Add a feature"
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700/50 px-4 py-2 rounded-xl"
                        >
                          <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Product Settings */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6"
              >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Product Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Active
                    </label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Allow Returns
                    </label>
                    <input
                      type="checkbox"
                      name="allowReturns"
                      checked={formData.allowReturns}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Return Policy
                    </label>
                    <input
                      type="text"
                      name="returnPolicy"
                      value={formData.returnPolicy}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., 30 days"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Shipping Information */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6"
              >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Shipping
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Free Shipping
                    </label>
                    <input
                      type="checkbox"
                      name="shippingInfo.freeShipping"
                      checked={formData.shippingInfo.freeShipping}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                    />
                  </div>
                  
                  {!formData.shippingInfo.freeShipping && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Shipping Cost
                      </label>
                      <input
                        type="number"
                        name="shippingInfo.shippingCost"
                        value={formData.shippingInfo.shippingCost}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Processing Time
                    </label>
                    <input
                      type="text"
                      name="shippingInfo.processingTime"
                      value={formData.shippingInfo.processingTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., 1-2 business days"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-neutral-400 disabled:to-neutral-500 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating Product...' : 'Update Product'}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;