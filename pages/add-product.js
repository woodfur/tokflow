import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { getUserStore, createProduct } from '../firebase/storeOperations';
import { useProductImageUpload } from '../hooks/useProductImageUpload';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  CloudArrowUpIcon
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

const AddProduct = () => {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [store, setStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Product image upload hook
  const {
    imageFiles,
    imagePreviews,
    selectImages,
    selectSingleImage,
    removeImage,
    clearAllImages
  } = useProductImageUpload();
  
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
    deliveryTime: '', // Local delivery time estimate
    isActive: true,
    allowReturns: true,
    returnPolicy: '30 days'
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [currentFeature, setCurrentFeature] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadStore = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const storeData = await getUserStore(user.uid);
          
          if (!storeData) {
            router.push('/create-store');
            return;
          }
          
          setStore(storeData);
        } catch (error) {
          console.error('Error loading store:', error);
          alert('Failed to load store information.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStore();
  }, [user, router]);

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

  const handleImageDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && imageFiles.length + files.length <= 10) {
      selectImages(files);
    }
  };

  const handleImageSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0 && imageFiles.length + files.length <= 10) {
      selectImages(files);
    }
  };

  const handleSingleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && imageFiles.length < 10) {
      selectSingleImage(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required';
    if (imagePreviews.length === 0) newErrors.images = 'At least one product image is required';
    
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
      const productData = {
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
        deliveryTime: formData.deliveryTime,
        images: imagePreviews,
        imageFiles: imageFiles,
        storeId: store.id,
        sellerId: user.uid,
        thumbnail: imagePreviews[0] || null
      };
      
      await createProduct(productData, store.id, user.uid);
      
      alert('Product added successfully!');
      router.push('/my-store');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please try again.');
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

  if (!store) {
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
              Add New Product
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Add a product to {store.name}
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
                
                {/* Image Upload Area */}
                {imagePreviews.length === 0 ? (
                  <div
                    onDrop={handleImageDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl p-8 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('product-images-input').click()}
                  >
                    <CloudArrowUpIcon className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Upload Product Images
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                      Drag and drop images here, or click to select files
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      Maximum 10 images, up to 10MB each
                    </p>
                    <input
                      id="product-images-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image Previews */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                            <img
                              src={preview}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-lg">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Add More Images */}
                    {imagePreviews.length < 10 && (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          onClick={() => document.getElementById('add-more-images-input').click()}
                          className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-600 dark:text-neutral-400 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <PlusIcon className="w-5 h-5" />
                          <span>Add More Images</span>
                        </button>
                        <input
                          id="add-more-images-input"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        
                        {imagePreviews.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllImages}
                            className="flex items-center justify-center space-x-2 px-4 py-3 border border-red-300 dark:border-red-600 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <XMarkIcon className="w-5 h-5" />
                            <span>Clear All</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {imagePreviews.length}/10 images uploaded. The first image will be used as the main product image.
                    </p>
                  </div>
                )}
                
                {errors.images && <p className="text-red-500 text-sm mt-4">{errors.images}</p>}
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

              {/* Delivery Information */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6"
              >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Delivery Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Delivery Time
                    </label>
                    <input
                      type="text"
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white/50 dark:bg-neutral-700/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., Same-day delivery, Within 3 hours, Next business day"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Specify estimated delivery time for local customers
                    </p>
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
                {isSubmitting ? 'Adding Product...' : 'Add Product'}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;