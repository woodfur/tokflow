import React, { useState, useRef } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { CloudArrowUpIcon, VideoCameraIcon, XMarkIcon, PlayIcon } from "@heroicons/react/24/outline";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

import MobileNavigation from "../components/MobileNavigation";
import { auth } from "../firebase/firebase";

const Upload = () => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
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
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid video file.');
    }
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

    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      alert('Upload successful!');
      setSelectedFile(null);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 3000);
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
      
      <main className="pt-4 pb-20 md:pb-0 min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Upload Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <CloudArrowUpIcon className="w-8 h-8 text-accent-500" />
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                Upload Content
              </h1>
            </div>
            
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              Share your creativity with the world
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 ${
                  dragActive
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-500"
                } bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm`}
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
                  <div className="flex justify-center mb-4">
                    <VideoCameraIcon className="w-12 h-12 text-primary-500" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Drag and drop your video here
                  </h3>
                  
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    or click to browse
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Select Video
                  </motion.button>
                  
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
                    Supports: MP4, MOV, AVI, WebM
                  </p>
                </div>
              </div>

              {/* Selected File Preview */}
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Selected File
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeSelectedFile}
                      className="p-2 text-neutral-500 hover:text-red-500 transition-colors duration-200"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
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
              className="space-y-6"
            >
              {/* Caption Input */}
              <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6">
                <label className="block text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Caption
                </label>
                
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  rows={6}
                  className="w-full p-4 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-2xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {caption.length}/500 characters
                  </span>
                  
                  <div className="flex space-x-2">
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform duration-200">😊</span>
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform duration-200">🔥</span>
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform duration-200">💯</span>
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform duration-200">❤️</span>
                  </div>
                </div>
              </div>

              {/* Upload Settings */}
              <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Privacy Settings
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      defaultChecked
                      className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-neutral-700 dark:text-neutral-300">Public - Anyone can see</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="friends"
                      className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-neutral-700 dark:text-neutral-300">Friends only</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-neutral-700 dark:text-neutral-300">Private - Only you</span>
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                disabled={!selectedFile || !caption.trim() || isUploading}
                className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 ${
                  !selectedFile || !caption.trim() || isUploading
                    ? "bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-xl"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  "Upload Content"
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Upload;