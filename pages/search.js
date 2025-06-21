import { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon, ArrowTrendingUpIcon, UserIcon, HashtagIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

import MobileNavigation from "../components/MobileNavigation";
import { auth, firestore } from "../firebase/firebase";

const Search = () => {
  const [user] = useAuthState(auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], hashtags: [] });
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

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

  // Fallback suggested users for when Firebase data is not available
  const fallbackSuggestedUsers = [
    {
      id: "user1",
      username: "creator1",
      name: "Amazing Creator",
      profileImg: null,
      verified: true
    },
    {
      id: "user2",
      username: "dancer",
      name: "Dance Master",
      profileImg: null,
      verified: false
    },
    {
      id: "user3",
      username: "comedian",
      name: "Funny Person",
      profileImg: null,
      verified: true
    }
  ];

  // Fetch suggested users from Firebase
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        console.log("Fetching suggested users from Firebase...");
        const postsQuery = query(
          collection(firestore, "posts"),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        const postsSnapshot = await getDocs(postsQuery);
        console.log("Posts found:", postsSnapshot.docs.length);
        
        // Get unique users from recent posts
        const userMap = new Map();
        postsSnapshot.docs.forEach(doc => {
          const postData = doc.data();
          console.log("Post data:", postData);
          if (postData.userId && postData.userId !== user?.uid) {
            userMap.set(postData.userId, {
              id: postData.userId,
              username: postData.username || 'Unknown User',
              name: postData.name || postData.username || 'Unknown User',
              profileImg: postData.profileImg || null,
              verified: false // You can add verification logic later
            });
          }
        });
        
        const fetchedUsers = Array.from(userMap.values()).slice(0, 5);
        console.log("Fetched users:", fetchedUsers);
        
        // If no users found from posts, use fallback users
        if (fetchedUsers.length === 0) {
          console.log("No users found in posts, using fallback users");
          setSuggestedUsers(fallbackSuggestedUsers);
        } else {
          setSuggestedUsers(fetchedUsers);
        }
      } catch (error) {
        console.error("Error fetching suggested users:", error);
        // Use fallback users on error
        setSuggestedUsers(fallbackSuggestedUsers);
      }
    };

    if (user) {
      fetchSuggestedUsers();
    } else {
      // Show fallback users even when not logged in
      setSuggestedUsers(fallbackSuggestedUsers);
    }
  }, [user]);

  // Search functionality
  const performSearch = async (searchQuery) => {
    console.log("performSearch called with:", searchQuery);
    if (!searchQuery.trim()) {
      console.log("Empty search query, clearing results");
      setSearchResults({ users: [], posts: [], hashtags: [] });
      return;
    }

    setLoading(true);
    console.log("Starting search for:", searchQuery);
    
    try {
      const results = { users: [], posts: [], hashtags: [] };
      const searchTerm = searchQuery.toLowerCase();
      
      // Get all posts for searching
      const postsQuery = query(
        collection(firestore, "posts"),
        orderBy("timestamp", "desc"),
        limit(100) // Increased limit for better search results
      );
      const postsSnapshot = await getDocs(postsQuery);
      console.log("Total posts found for search:", postsSnapshot.docs.length);
      
      const userMap = new Map();
      const hashtagSet = new Set();
      
      postsSnapshot.docs.forEach(doc => {
        const postData = doc.data();
        const postId = doc.id;
        
        // Search in caption, topic, sound, and description
        const caption = (postData.caption || '').toLowerCase();
        const topic = (postData.topic || '').toLowerCase();
        const sound = (postData.sound || '').toLowerCase();
        const description = (postData.description || '').toLowerCase();
        const username = (postData.username || '').toLowerCase();
        const name = (postData.name || '').toLowerCase();
        
        // Check if post matches search (more comprehensive search)
        const postMatches = caption.includes(searchTerm) || 
                           topic.includes(searchTerm) || 
                           sound.includes(searchTerm) ||
                           description.includes(searchTerm);
        
        if (postMatches) {
          results.posts.push({
            id: postId,
            ...postData
          });
        }
        
        // Collect users (search by username and display name)
        const userMatches = username.includes(searchTerm) || name.includes(searchTerm);
        if (userMatches && postData.userId && postData.userId !== user?.uid) {
          userMap.set(postData.userId, {
            id: postData.userId,
            username: postData.username || 'Unknown User',
            name: postData.name || postData.username || 'Unknown User',
            profileImg: postData.profileImg || null,
            verified: postData.verified || false
          });
        }
        
        // Extract hashtags from caption, topic, and description
        const text = `${caption} ${topic} ${description}`;
        const hashtags = text.match(/#\w+/g) || [];
        hashtags.forEach(hashtag => {
          if (hashtag.toLowerCase().includes(searchTerm)) {
            hashtagSet.add(hashtag);
          }
        });
      });
      
      // Try to search for users directly if we have a users collection
      try {
        const usersQuery = query(
          collection(firestore, "users"),
          limit(20)
        );
        const usersSnapshot = await getDocs(usersQuery);
        console.log("Users collection found, searching users directly:", usersSnapshot.docs.length);
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          const userId = doc.id;
          const username = (userData.username || '').toLowerCase();
          const name = (userData.name || userData.displayName || '').toLowerCase();
          
          if ((username.includes(searchTerm) || name.includes(searchTerm)) && userId !== user?.uid) {
            userMap.set(userId, {
              id: userId,
              username: userData.username || 'Unknown User',
              name: userData.name || userData.displayName || userData.username || 'Unknown User',
              profileImg: userData.profileImg || userData.photoURL || null,
              verified: userData.verified || false
            });
          }
        });
      } catch (userError) {
        console.log("No users collection found or error accessing it:", userError.message);
      }
      
      results.users = Array.from(userMap.values());
      results.hashtags = Array.from(hashtagSet).map(tag => ({ 
        tag, 
        count: Math.floor(Math.random() * 1000) + 100 
      }));
      
      console.log("Search results:", {
        users: results.users.length,
        posts: results.posts.length,
        hashtags: results.hashtags.length
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error performing search:", error);
      // Set empty results on error
      setSearchResults({ users: [], posts: [], hashtags: [] });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    console.log("Search useEffect triggered with query:", searchQuery);
    const timeoutId = setTimeout(() => {
      console.log("Debounced search executing for:", searchQuery);
      performSearch(searchQuery);
    }, 300);

    return () => {
      console.log("Clearing timeout for:", searchQuery);
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

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
                onChange={(e) => {
                  console.log("Search input changed to:", e.target.value);
                  setSearchQuery(e.target.value);
                }}
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

          {/* Search Results */}
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              {/* Search Tabs */}
              <div className="flex space-x-1 mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                {[
                  { key: 'all', label: 'All', icon: MagnifyingGlassIcon },
                  { key: 'users', label: 'Users', icon: UserIcon },
                  { key: 'posts', label: 'Videos', icon: VideoCameraIcon },
                  { key: 'hashtags', label: 'Hashtags', icon: HashtagIcon }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === key
                        ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Users Results */}
                  {(activeTab === 'all' || activeTab === 'users') && searchResults.users.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                        Users
                      </h3>
                      <div className="space-y-3">
                        {searchResults.users.slice(0, activeTab === 'users' ? 20 : 3).map((searchUser, index) => (
                          <motion.div
                            key={searchUser.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-white/80 dark:hover:bg-neutral-800/80 transition-all duration-200 cursor-pointer"
                            onClick={() => router.push(`/user/${searchUser.id}`)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {searchUser.profileImg ? (
                                  <img
                                    src={searchUser.profileImg}
                                    alt={searchUser.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold">
                                    {searchUser.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {searchUser.verified && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white dark:border-neutral-800 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                  {searchUser.name}
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                                  @{searchUser.username}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts Results */}
                  {(activeTab === 'all' || activeTab === 'posts') && searchResults.posts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                        Videos
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {searchResults.posts.slice(0, activeTab === 'posts' ? 20 : 6).map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative aspect-[9/16] bg-neutral-200 dark:bg-neutral-700 rounded-xl overflow-hidden cursor-pointer group"
                            onClick={() => router.push(`/detail/${post.id}`)}
                          >
                            {post.video ? (
                              <video
                                src={post.video}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <VideoCameraIcon className="w-12 h-12 text-neutral-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-200" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-sm font-medium truncate">
                                {post.caption || 'No caption'}
                              </p>
                              <p className="text-white/70 text-xs truncate">
                                @{post.username}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hashtags Results */}
                  {(activeTab === 'all' || activeTab === 'hashtags') && searchResults.hashtags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                        Hashtags
                      </h3>
                      <div className="space-y-2">
                        {searchResults.hashtags.slice(0, activeTab === 'hashtags' ? 20 : 5).map((hashtag, index) => (
                          <motion.div
                            key={hashtag.tag}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-white/80 dark:hover:bg-neutral-800/80 transition-all duration-200 cursor-pointer"
                            onClick={() => setSearchQuery(hashtag.tag)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
                                <HashtagIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                  {hashtag.tag}
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {hashtag.count.toLocaleString()} videos
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!loading && searchQuery && 
                   searchResults.users.length === 0 && 
                   searchResults.posts.length === 0 && 
                   searchResults.hashtags.length === 0 && (
                    <div className="text-center py-8">
                      <MagnifyingGlassIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                        No results found for "{searchQuery}"
                      </p>
                      <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-2">
                        Try searching for something else
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Trending Section - Only show when not searching */}
          {!searchQuery && (
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
                    onClick={() => setSearchQuery(topic)}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-200 dark:border-primary-700 rounded-full text-primary-600 dark:text-primary-400 font-medium hover:from-primary-500/20 hover:to-accent-500/20 transition-all duration-200"
                  >
                    {topic}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Suggested Users - Only show when not searching */}
          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Suggested for you
              </h2>
              
              {suggestedUsers.length > 0 ? (
                <div className="space-y-3">
                  {suggestedUsers.map((suggestedUser, index) => (
                    <motion.div
                      key={suggestedUser.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-white/80 dark:hover:bg-neutral-800/80 transition-all duration-200"
                    >
                      <div 
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                        onClick={() => router.push(`/user/${suggestedUser.id}`)}
                      >
                        <div className="relative">
                          {suggestedUser.profileImg ? (
                            <img
                              src={suggestedUser.profileImg}
                              alt={suggestedUser.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold">
                              {suggestedUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}
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
                            @{suggestedUser.username}
                          </p>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors duration-200 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add follow functionality here
                          console.log('Follow user:', suggestedUser.id);
                        }}
                      >
                        Follow
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">
                    No suggested users available
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-2">
                    Check back later for new suggestions
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Search;