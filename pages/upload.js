import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { CloudArrowUpIcon, VideoCameraIcon, XMarkIcon, PlayIcon, HashtagIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import MobileNavigation from "../components/MobileNavigation";
import { auth, firestore, storage } from "../firebase/firebase";

const Upload = () => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (user === false) {
      router.push("/signin");
    }
  }, [user, router]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }
    
    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      alert('File size too large. Please select a video under 100MB.');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !caption.trim()) {
      alert('Please select a video file and add a caption.');
      return;
    }

    if (!user) {
      alert('Please sign in to upload videos.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // Create post document in Firestore
      const docRef = await addDoc(collection(firestore, "posts"), {
        userId: user?.uid,
        username: user?.displayName || 'Anonymous',
        caption: caption.trim(),
        hashtags: hashtags.trim(),
        profileImage: user?.photoURL || '',
        company: user?.email || '',
        timestamp: serverTimestamp(),
      });

      // Upload video file to Firebase Storage
      const videoRef = ref(storage, `posts/${docRef.id}/video`);
      
      // Upload with progress tracking
      const uploadTask = await uploadBytes(videoRef, selectedFile);
      
      // Get download URL and update post document
      const downloadUrl = await getDownloadURL(videoRef);
      await updateDoc(doc(firestore, "posts", docRef.id), {
        video: downloadUrl,
      });

      setIsUploading(false);
      alert('Upload successful! Your video will appear in the feed shortly.');
      
      // Reset form
      setSelectedFile(null);
      setCaption('');
      setHashtags('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      
      // Handle specific error types
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please try again later.';
      } else if (error.code === 'storage/invalid-format') {
        errorMessage = 'Invalid file format. Please select a valid video file.';
      } else if (error.code === 'storage/object-not-found') {
        errorMessage = 'File not found. Please select the file again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please sign in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  if (user === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <Head>
        <title>Upload - TokFlo</title>
        <meta name="description" content="Upload your videos and photos to TokFlo" />
        <link
          rel="icon"
          href="https://th.bing.com/th/id/R.67bc88bb600a54112e8a669a30121273?rik=vsc22vMfmcSGfg&pid=ImgRaw&r=0"
        />
      </Head>
      
      <main className="pt-4 pb-24 md:pb-8 min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Upload Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8 md:mb-12 text-center"
          >
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="relative">
                <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-accent-500 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-bounce"></div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Create & Share
              </h1>
            </div>
            
            <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg md:text-xl font-medium px-4">
              Turn your moments into viral content ✨
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* File Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 transition-all duration-500 group ${
                  dragActive
                    ? "border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 scale-105"
                    : "border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gradient-to-br hover:from-neutral-50 hover:to-primary-50/30 dark:hover:from-neutral-800/50 dark:hover:to-primary-900/10"
                } bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl shadow-xl hover:shadow-2xl`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="text-center">
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <VideoCameraIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-accent-500 rounded-full flex items-center justify-center">
                        <CloudArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-3">
                    Drop your video here
                  </h3>
                  
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
                    or tap anywhere to browse
                  </p>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center space-x-2 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer text-sm sm:text-base"
                  >
                    <CloudArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Choose Video</span>
                  </motion.div>
                  
                  <div className="mt-4 sm:mt-6 flex items-center justify-center flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">MP4</span>
                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">MOV</span>
                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">AVI</span>
                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">WebM</span>
                  </div>
                  
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 sm:mt-4 px-2">
                    Max file size: 100MB • Best quality: 1080p
                  </p>
                </div>
              </div>

              {/* Selected File Preview */}
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                  className="bg-gradient-to-br from-white/90 to-primary-50/50 dark:from-neutral-800/90 dark:to-primary-900/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-primary-200/50 dark:border-primary-700/30 p-4 sm:p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-success-500 to-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-base sm:text-lg font-display font-bold text-neutral-900 dark:text-neutral-100">
                        Video Ready!
                      </h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeSelectedFile}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg sm:rounded-xl transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                      <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg relative overflow-hidden">
                        <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-sm sm:text-base md:text-lg">
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center flex-wrap gap-2 sm:gap-4 mt-2">
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <span className="px-2 py-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-xs font-medium rounded-full">
                          Ready to upload
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Caption and Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Caption Input */}
              <div className="bg-gradient-to-br from-white/90 to-neutral-50/50 dark:from-neutral-800/90 dark:to-neutral-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-neutral-200/30 dark:border-neutral-700/30 p-4 sm:p-6 shadow-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-accent-500 to-primary-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <label className="text-base sm:text-lg font-display font-bold text-neutral-900 dark:text-neutral-100">
                    Tell your story
                  </label>
                </div>
                
                <div className="relative">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What's happening? Share your moment with the world..."
                    rows={4}
                    maxLength={500}
                    className="w-full p-3 sm:p-4 bg-white/60 dark:bg-neutral-700/60 border border-neutral-200/50 dark:border-neutral-600/50 rounded-xl sm:rounded-2xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white dark:focus:bg-neutral-700 resize-none transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
                  />
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className={`text-sm font-medium transition-colors duration-200 ${
                    caption.length > 450 ? 'text-warning-500' : caption.length > 400 ? 'text-accent-500' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {caption.length}/500
                  </span>
                  
                  <div className="flex space-x-2">
                    {['😊', '🔥', '💯', '❤️', '✨', '🎉'].map((emoji, index) => (
                      <motion.span
                        key={index}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-2xl cursor-pointer transition-transform duration-200 hover:drop-shadow-lg"
                        onClick={() => setCaption(prev => prev + emoji)}
                      >
                        {emoji}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hashtags Input */}
              <div className="bg-gradient-to-br from-white/90 to-accent-50/30 dark:from-neutral-800/90 dark:to-accent-900/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-accent-200/30 dark:border-accent-700/20 p-4 sm:p-6 shadow-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <HashtagIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <label className="text-base sm:text-lg font-display font-bold text-neutral-900 dark:text-neutral-100">
                    Add hashtags
                  </label>
                </div>
                
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#trending #viral #fyp #creative"
                  className="w-full p-3 sm:p-4 bg-white/60 dark:bg-neutral-700/60 border border-neutral-200/50 dark:border-neutral-600/50 rounded-xl sm:rounded-2xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 focus:bg-white dark:focus:bg-neutral-700 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
                />
                
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                  {['#trending', '#viral', '#fyp', '#creative', '#art', '#music'].map((tag, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (!hashtags.includes(tag)) {
                          setHashtags(prev => prev ? `${prev} ${tag}` : tag);
                        }
                      }}
                      className="px-2.5 sm:px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs sm:text-sm font-medium rounded-full hover:bg-accent-200 dark:hover:bg-accent-800/40 transition-all duration-200"
                    >
                      {tag}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Upload Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className={`relative w-full py-3 sm:py-5 px-6 sm:px-8 rounded-2xl sm:rounded-3xl font-display font-bold text-base sm:text-lg transition-all duration-500 overflow-hidden group ${
                    !selectedFile || isUploading
                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 hover:from-primary-600 hover:via-accent-600 hover:to-primary-700 text-white shadow-2xl hover:shadow-primary-500/25'
                  }`}
                >
                  {/* Animated background */}
                  {!isUploading && selectedFile && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  )}
                  
                  <div className="relative flex items-center justify-center space-x-2 sm:space-x-3">
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sharing your moment...</span>
                      </>
                    ) : selectedFile ? (
                      <>
                        <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Share with the world</span>
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          🚀
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Select a video first</span>
                      </>
                    )}
                  </div>
                </motion.button>
                
                {/* Progress indicator */}
                {isUploading && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full origin-left"
                    style={{ width: '100%' }}
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Upload;