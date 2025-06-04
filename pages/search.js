import React, { useState } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { useAuthState } from "react-firebase-hooks/auth";


import MobileNavigation from "../components/MobileNavigation";
import { auth } from "../firebase/firebase";

const Search = () => {
  const [user] = useAuthState(auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const trendingTopics = [
    "#fyp",
    "#viral",
    "#dance",
    "#comedy",
    "#music",
    "#trending",
    "#challenge",
    "#duet",
  ];

  const suggestedUsers = [
    { id: 1, username: "@creator1", name: "Amazing Creator", followers: "1.2M", verified: true },
    { id: 2, username: "@dancer", name: "Dance Master", followers: "890K", verified: false },
    { id: 3, username: "@comedian", name: "Funny Person", followers: "2.1M", verified: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <Head>
        <title>Search - TokFlo</title>
        <meta name="description" content="Search for creators, videos, and trending content on TokFlo" />
        <link
          rel="icon"
          href="https://th.bing.com/th/id/R.67bc88bb600a54112e8a669a30121273?rik=vsc22vMfmcSGfg&pid=ImgRaw&r=0"
        />
      </Head>
      
      <main className="pt-4 pb-20 md:pb-0 min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Search Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              Discover
            </h1>
            
            {/* Enhanced Search Bar */}
            <motion.div
              animate={{
                scale: searchFocused ? 1.02 : 1,
                boxShadow: searchFocused 
                  ? "0 8px 32px rgba(0, 0, 0, 0.12)" 
                  : "0 4px 16px rgba(0, 0, 0, 0.08)"
              }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50"
            >
              <input
                type="text"
                placeholder="Search accounts, videos, sounds, and hashtags"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full h-14 pl-6 pr-14 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none font-medium text-lg"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Trending Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-2 mb-4">
              <ArrowTrendingUpIcon className="w-5 h-5 text-accent-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Trending Hashtags
              </h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic, index) => (
                <motion.button
                  key={topic}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-200 dark:border-primary-700 rounded-full text-primary-600 dark:text-primary-400 font-medium hover:from-primary-500/20 hover:to-accent-500/20 transition-all duration-200"
                >
                  {topic}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Suggested Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Suggested for you
            </h2>
            
            <div className="space-y-3">
              {suggestedUsers.map((suggestedUser, index) => (
                <motion.div
                  key={suggestedUser.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-white/80 dark:hover:bg-neutral-800/80 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {suggestedUser.name.charAt(0)}
                      </div>
                      {suggestedUser.verified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white dark:border-neutral-800 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {suggestedUser.name}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {suggestedUser.username} • {suggestedUser.followers} followers
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors duration-200 flex-shrink-0"
                  >
                    Follow
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Search;