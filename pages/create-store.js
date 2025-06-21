import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { createStore, getUserStore } from '../firebase/storeOperations';
import { motion } from 'framer-motion';
import useImageUpload from '../hooks/useImageUpload';
import {
  ArrowLeftIcon,
  PhotoIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const CreateStore = () => {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const {
    logoFile,
    bannerFile,
    logoPreview,
    bannerPreview,
    onSelectLogo,
    onSelectBanner,
    clearLogo,
    clearBanner
  } = useImageUpload();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    policies: {
      shipping: '',
      returns: '',
      privacy: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingStore, setHasExistingStore] = useState(false);

  const categories = [
    'Fashion & Apparel',
    'Electronics & Tech',
    'Home & Garden',
    'Beauty & Personal Care',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Food & Beverages',
    'Health & Wellness',
    'Art & Crafts',
    'Automotive',
    'Other'
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkExistingStore = async () => {
      if (user) {
        try {
          const existingStore = await getUserStore(user.uid);
          if (existingStore) {
            setHasExistingStore(true);
            // Redirect to manage store page
            router.push('/my-store');
          }
        } catch (error) {
          console.error('Error checking existing store:', error);
        }
      }
    };

    checkExistingStore();
  }, [user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const storeData = {
        ...formData,
        logo: logoPreview || '',
        banner: bannerPreview || '',
        logoFile: logoFile,
        bannerFile: bannerFile,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        ownerEmail: user.email,
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await createStore(storeData, user.uid);
      router.push('/my-store?created=true');
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Failed to create store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (hasExistingStore) {
    return null; // Will redirect to my-store
  }

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
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Create Your Store
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Start selling your products on TokFlo
            </p>
          </div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <BuildingStorefrontIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Basic Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Enter your store name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your store and what you sell"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <PhoneIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Contact Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <MapPinIcon className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Your business address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Your contact number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Store contact email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <GlobeAltIcon className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Store Images */}
            <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-4 md:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <PhotoIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Store Images
                </h2>
              </div>
              
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Store Logo
                  </label>
                  <div className="flex flex-col space-y-4">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="w-full max-w-xs mx-auto md:mx-0">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-2xl border-2 border-neutral-200 dark:border-neutral-600 mx-auto"
                          />
                          <button
                            type="button"
                            onClick={clearLogo}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-2">
                          {logoFile?.name}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onSelectLogo}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center justify-center w-full h-40 md:h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer bg-neutral-50/50 dark:bg-neutral-700/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-600/50"
                        >
                          <CloudArrowUpIcon className="w-8 h-8 md:w-10 md:h-10 text-neutral-400 dark:text-neutral-500 mb-2" />
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 text-center px-4">
                            Upload Store Logo
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-500 text-center px-4 mt-1">
                            Square format recommended • Max 5MB
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Store Banner
                  </label>
                  <div className="flex flex-col space-y-4">
                    {bannerPreview ? (
                      <div className="relative">
                        <div className="w-full">
                          <img
                            src={bannerPreview}
                            alt="Banner preview"
                            className="w-full h-32 md:h-40 object-cover rounded-2xl border-2 border-neutral-200 dark:border-neutral-600"
                          />
                          <button
                            type="button"
                            onClick={clearBanner}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-2">
                          {bannerFile?.name}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onSelectBanner}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          id="banner-upload"
                        />
                        <label
                          htmlFor="banner-upload"
                          className="flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer bg-neutral-50/50 dark:bg-neutral-700/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-600/50"
                        >
                          <CloudArrowUpIcon className="w-8 h-8 md:w-10 md:h-10 text-neutral-400 dark:text-neutral-500 mb-2" />
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 text-center px-4">
                            Upload Store Banner
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-500 text-center px-4 mt-1">
                            Wide format recommended • Max 10MB
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <CheckIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  Store Policies
                </h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Shipping Policy
                  </label>
                  <textarea
                    name="policies.shipping"
                    value={formData.policies.shipping}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your shipping policy"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Return Policy
                  </label>
                  <textarea
                    name="policies.returns"
                    value={formData.policies.returns}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your return policy"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Privacy Policy
                  </label>
                  <textarea
                    name="policies.privacy"
                    value={formData.policies.privacy}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your privacy policy"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-12 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Store...</span>
                  </>
                ) : (
                  <>
                    <BuildingStorefrontIcon className="w-5 h-5" />
                    <span>Create Store</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateStore;