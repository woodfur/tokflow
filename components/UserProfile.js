import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { onSnapshot, query, collection, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateProfile } from "firebase/auth";

import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlusIcon,
  EyeIcon,
  EllipsisHorizontalIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  BookmarkIcon,
  HeartIcon,
  XMarkIcon,
  CameraIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { firestore, auth, storage } from "../firebase/firebase";
import { getUserProfile, updateUserProfile } from "../utils/userProfile";
import CustomPosts from "./CustomPosts";
import ImageCropper from "./ImageCropper";

const UserProfile = () => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState([]);
  const [isShow, setIsShow] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editData, setEditData] = useState({ username: '', bio: '', profileImage: null });
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  /*   console.log(posts); */

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(firestore, "posts"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort client-side by timestamp desc to avoid composite index requirement
        postsData.sort((a, b) => {
          const aTs = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const bTs = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return bTs - aTs;
        });
        setPosts(postsData);
      },
      (error) => {
        console.error("Error fetching user posts:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch liked posts
  useEffect(() => {
    if (!user?.uid) return;

    const fetchLikedPosts = async () => {
      try {
        // Get all posts first
        const postsQuery = query(collection(firestore, "posts"), orderBy("timestamp", "desc"));
        const postsSnapshot = await getDocs(postsQuery);
        
        const likedPostsData = [];
        
        // Check each post to see if user has liked it
        for (const postDoc of postsSnapshot.docs) {
          const likeDoc = await getDocs(collection(firestore, "posts", postDoc.id, "likes"));
          const hasLiked = likeDoc.docs.some(like => like.id === user.uid);
          
          if (hasLiked) {
            likedPostsData.push({
              id: postDoc.id,
              ...postDoc.data(),
            });
          }
        }
        
        setLikedPosts(likedPostsData);
      } catch (error) {
        console.error("Error fetching liked posts:", error);
      }
    };

    fetchLikedPosts();
  }, [user]);

  // Fetch saved posts
  useEffect(() => {
    if (!user?.uid) return;

    const fetchSavedPosts = async () => {
      try {
        // Get all posts first
        const postsQuery = query(collection(firestore, "posts"), orderBy("timestamp", "desc"));
        const postsSnapshot = await getDocs(postsQuery);
        
        const savedPostsData = [];
        
        // Check each post to see if user has saved it
        for (const postDoc of postsSnapshot.docs) {
          const bookmarkDoc = await getDocs(collection(firestore, "posts", postDoc.id, "bookmarks"));
          const hasSaved = bookmarkDoc.docs.some(bookmark => bookmark.id === user.uid);
          
          if (hasSaved) {
            savedPostsData.push({
              id: postDoc.id,
              ...postDoc.data(),
            });
          }
        }
        
        setSavedPosts(savedPostsData);
      } catch (error) {
        console.error("Error fetching saved posts:", error);
      }
    };

    fetchSavedPosts();
  }, [user]);

  // Real-time listener for current user's profile updates
  useEffect(() => {
    if (!user?.uid) return;

    // Set up real-time listener for current user's profile
    const userRef = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const profileData = { id: docSnapshot.id, ...docSnapshot.data() };
        setUserData(profileData);
        // Update follower/following counts from real-time data
        setFollowersCount(profileData.totalFollowers || 0);
        setFollowingCount(profileData.totalFollowing || 0);
        setLikesCount(profileData.totalLikes || 0);
      } else {
        // Fallback to auth user data if no profile exists
        setUserData({
          displayName: user.displayName || 'Anonymous User',
          email: user.email,
          photoURL: user.photoURL,
          bio: 'No bio available'
        });
        // Reset counts for fallback
        setFollowersCount(0);
        setFollowingCount(0);
        setLikesCount(0);
      }
    }, (error) => {
      console.error("Error listening to user profile:", error);
      // Error fallback to auth user data
      setUserData({
        displayName: user.displayName || 'Anonymous User',
        email: user.email,
        photoURL: user.photoURL,
        bio: 'No bio available'
      });
      // Reset counts for error fallback
      setFollowersCount(0);
      setFollowingCount(0);
      setLikesCount(0);
    });

    return () => unsubscribe();
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let profileImageUrl = userData.photoURL || userData.profileImage;
      
      // Upload new profile image if selected
      if (editData.profileImage) {
        const imageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(imageRef, editData.profileImage);
        profileImageUrl = await getDownloadURL(imageRef);
      }
      
      // Update user profile in Firebase Auth
      await updateProfile(user, {
        displayName: editData.username,
        photoURL: profileImageUrl
      });
      
      // Update user profile in Firestore
      await updateUserProfile(user.uid, {
        displayName: editData.username,
        photoURL: profileImageUrl,
        bio: editData.bio
      });
      
      // Update all user's posts with new profile data
      const userPostsQuery = query(
        collection(firestore, "posts"),
        where("userId", "==", user.uid)
      );
      const userPostsSnapshot = await getDocs(userPostsQuery);
      
      const updatePromises = userPostsSnapshot.docs.map((postDoc) => {
        const postRef = doc(firestore, "posts", postDoc.id);
        return updateDoc(postRef, {
          username: editData.username,
          profileImage: profileImageUrl,
          bio: editData.bio
        });
      });
      
      await Promise.all(updatePromises);
      
      toast.success("Profile updated successfully!");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully!");
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  // Calculate user stats
  useEffect(() => {
    if (!user?.uid) return;
    const userPosts = posts.filter(post => post.userId === user.uid);
    const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    setLikesCount(totalLikes);
    // TODO: Implement followers/following count from database
  }, [posts, user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size too large. Please select an image under 5MB.');
        return;
      }
      
      // Create preview URL and show crop modal
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setEditData({ ...editData, profileImage: croppedFile });
    setShowCropModal(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    toast.success('Image cropped successfully!');
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const getCurrentPosts = () => {
    switch (activeTab) {
      case 'liked':
        return likedPosts;
      case 'saved':
        return savedPosts;
      default:
        return posts.filter((post) => post.userId === user?.uid);
    }
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative max-w-2xl mx-auto px-2 sm:px-4 pt-4 pb-20 min-h-screen"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        {!isShow && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg border border-neutral-200/50 dark:border-neutral-700/50"
          >
            <UserPlusIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </motion.button>
        )}

        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="font-bold text-xl sm:text-2xl text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] sm:max-w-none">
            {userData.username}
          </span>
        </div>

        <div className="flex gap-2">

          {user && (
            <div className="relative dropdown-container">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="p-3 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg border border-neutral-200/50 dark:border-neutral-700/50"
              >
                <Cog6ToothIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </motion.button>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-48 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 py-2 z-50"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setEditData({
                          username: userData.displayName || userData.username || '',
                          bio: userData.bio || 'Description about me goes here',
                          profileImage: null
                        });
                        setShowEditModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 flex items-center gap-3"
                    >
                      <AdjustmentsHorizontalIcon className="w-4 h-4" />
                      Edit Profile
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // TODO: Implement settings functionality
                        toast('Settings feature coming soon!');
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 flex items-center gap-3"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      Settings
                    </motion.button>
                    
                    <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 my-1"></div>
                    
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center gap-3"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Logout
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center mb-8 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-6"
        >
          <div
            className="w-28 h-28 sm:w-32 sm:h-32 bg-cover bg-center bg-no-repeat rounded-full border-4 border-white dark:border-neutral-700 shadow-xl"
            style={{
              backgroundImage: `url(${userData.photoURL || userData.profileImage || '/default-avatar.svg'})`,
            }}
          ></div>
          {isShow && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setEditData({
                  username: userData.displayName || userData.username || '',
                  bio: userData.bio || 'Description about me goes here',
                  profileImage: null
                });
                setShowEditModal(true);
              }}
              className="absolute bottom-1 right-1 bg-primary-500 p-2 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
            >
              <CameraIcon className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            {userData.displayName || userData.username || 'Anonymous User'}
          </h2>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 sm:gap-8 mb-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {followersCount}
              </div>
              <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                Followers
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {followingCount}
              </div>
              <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                Following
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {likesCount}
              </div>
              <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                Likes
              </div>
            </div>
          </div>
          
          <p className="text-sm text-neutral-700 dark:text-neutral-300 max-w-xs mx-auto leading-relaxed">
            {userData.bio || 'No bio available'}
          </p>
        </motion.div>
      </div>

      {/* Content Tabs */}
      <div className="mb-6">
        <div className="flex justify-center border-b border-neutral-200 dark:border-neutral-700">
          {[
            { id: 'posts', label: 'Posts', icon: Squares2X2Icon },
            { id: 'saved', label: 'Saved', icon: BookmarkIcon },
            { id: 'liked', label: 'Liked', icon: HeartIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Posts Grid */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-3 gap-1 sm:gap-2"
      >
        {getCurrentPosts().length > 0 ? (
          getCurrentPosts().map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <CustomPosts post={post} />
            </motion.div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <div className="text-neutral-400 dark:text-neutral-600 text-lg mb-2">
              No {activeTab} yet
            </div>
            <div className="text-neutral-500 dark:text-neutral-500 text-sm">
              {activeTab === 'posts' ? 'Share your first post!' : `No ${activeTab} posts to show`}
            </div>
          </div>
        )}
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/20 dark:border-neutral-700/30 rounded-3xl p-8 w-full max-w-lg mx-auto shadow-2xl shadow-black/10 dark:shadow-black/30"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Edit Profile
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditModal(false)}
                  className="p-3 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 transition-all duration-200 backdrop-blur-sm"
                >
                  <XMarkIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                </motion.button>
              </div>

              {/* Profile Image Section */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 tracking-wide">
                  Profile Image
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div
                      className="w-20 h-20 bg-cover bg-center bg-no-repeat rounded-2xl border-2 border-neutral-200/50 dark:border-neutral-600/50 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
                      style={{
                        backgroundImage: editData.profileImage 
                          ? `url(${URL.createObjectURL(editData.profileImage)})` 
                          : `url(${userData.profileImage})`,
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="profile-image-input"
                  />
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    htmlFor="profile-image-input"
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 cursor-pointer text-sm font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm"
                  >
                    Change Photo
                  </motion.label>
                </div>
              </div>

              {/* Username */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200/60 dark:border-neutral-600/60 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white dark:focus:bg-neutral-800 transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  placeholder="Enter username"
                />
              </div>

              {/* Bio */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 tracking-wide">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-200/60 dark:border-neutral-600/60 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-white dark:focus:bg-neutral-800 transition-all duration-200 resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-neutral-200/60 dark:border-neutral-600/60 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-50/80 dark:hover:bg-neutral-700/50 transition-all duration-200 font-semibold backdrop-blur-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary-500 disabled:hover:to-primary-600 transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl backdrop-blur-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {showCropModal && selectedImage && (
          <ImageCropper
            imageSrc={selectedImage}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </AnimatePresence>


    </motion.div>
  );
};

export default UserProfile;
