import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { onSnapshot, query, collection, orderBy, doc, updateDoc, where, getDocs } from "firebase/firestore";
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
  CameraIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { firestore, auth, storage } from "../firebase/firebase";
import CustomPosts from "./CustomPosts";

const UserProfile = () => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const { userId } = router.query;
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState([]);
  const [isShow, setIsShow] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ username: '', bio: '', profileImage: null });
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);

  /*   console.log(posts); */

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(firestore, "posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [userId]);

  // Fetch liked posts
  useEffect(() => {
    if (!user || !userId) return;

    const fetchLikedPosts = async () => {
      try {
        const likedQuery = query(
          collection(firestore, "posts"),
          where("likes", "array-contains", user.uid)
        );
        const likedSnapshot = await getDocs(likedQuery);
        const likedPostsData = likedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLikedPosts(likedPostsData);
      } catch (error) {
        console.error("Error fetching liked posts:", error);
      }
    };

    fetchLikedPosts();
  }, [user, userId]);

  // Fetch saved posts
  useEffect(() => {
    if (!user || !userId) return;

    const fetchSavedPosts = async () => {
      try {
        const savedQuery = query(
          collection(firestore, "posts"),
          where("bookmarks", "array-contains", user.uid)
        );
        const savedSnapshot = await getDocs(savedQuery);
        const savedPostsData = savedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSavedPosts(savedPostsData);
      } catch (error) {
        console.error("Error fetching saved posts:", error);
      }
    };

    fetchSavedPosts();
  }, [user, userId]);

  const filterUserData = () => {
    try {
      posts.map((data) => {
        if (data.userId === userId) {
          setUserData(data);

          if (data.userId === user?.uid) {
            setIsShow(true);
          }
        }
      });
    } catch (error) {
      alert(error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let profileImageUrl = userData.profileImage;
      
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData({ ...editData, profileImage: file });
    }
  };

  const getCurrentPosts = () => {
    switch (activeTab) {
      case 'liked':
        return likedPosts;
      case 'saved':
        return savedPosts;
      default:
        return posts.filter((post) => post.userId === userId);
    }
  };

  useEffect(() => {
    filterUserData();
  }, [posts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative max-w-2xl mx-auto px-4 pt-4 pb-20"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {!isShow && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg"
          >
            <UserPlusIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </motion.button>
        )}

        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
            {userData.username}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </div>

        <div className="flex gap-2">
          {!isShow && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg"
              >
                <EyeIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg"
              >
                <EllipsisHorizontalIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-4"
        >
          <div
            className="w-24 h-24 bg-cover bg-center bg-no-repeat rounded-full border-4 border-white dark:border-neutral-700 shadow-xl"
            style={{
              backgroundImage: `url(${userData.profileImage})`,
            }}
          ></div>
        </motion.div>
        
        <motion.span 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-neutral-600 dark:text-neutral-400 mb-4"
        >
          {userData.company}
        </motion.span>

        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-8 text-center mb-6"
        >
          <div className="flex flex-col">
            <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">0</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Following</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">0</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Followers</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">0</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Likes</span>
          </div>
        </motion.div>

        {isShow && (
          <motion.button 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditData({
                username: userData.username || '',
                bio: userData.bio || 'Description about me goes here',
                profileImage: null
              });
              setShowEditModal(true);
            }}
            className="mb-4 px-8 py-3 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl font-semibold text-neutral-700 dark:text-neutral-300 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Edit profile
          </motion.button>
        )}

        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-neutral-700 dark:text-neutral-300 px-4"
        >
          {userData.bio || 'Description about me goes here'}
        </motion.p>
      </div>

      {/* Content Tabs */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex justify-center gap-8 mb-6 border-b border-neutral-200/50 dark:border-neutral-700/50"
      >
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex flex-col items-center pb-3 border-b-2 ${
            activeTab === 'posts' ? 'border-primary-500' : 'border-transparent'
          }`}
        >
          <Squares2X2Icon className={`w-6 h-6 mb-1 ${
            activeTab === 'posts' ? 'text-primary-500' : 'text-neutral-400'
          }`} />
          <span className={`text-xs ${
            activeTab === 'posts' ? 'text-primary-500 font-medium' : 'text-neutral-400'
          }`}>Posts</span>
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center pb-3 border-b-2 ${
            activeTab === 'saved' ? 'border-primary-500' : 'border-transparent'
          }`}
        >
          <BookmarkIcon className={`w-6 h-6 mb-1 ${
            activeTab === 'saved' ? 'text-primary-500' : 'text-neutral-400'
          }`} />
          <span className={`text-xs ${
            activeTab === 'saved' ? 'text-primary-500 font-medium' : 'text-neutral-400'
          }`}>Saved</span>
        </button>
        <button 
          onClick={() => setActiveTab('liked')}
          className={`flex flex-col items-center pb-3 border-b-2 ${
            activeTab === 'liked' ? 'border-primary-500' : 'border-transparent'
          }`}
        >
          <HeartIcon className={`w-6 h-6 mb-1 ${
            activeTab === 'liked' ? 'text-primary-500' : 'text-neutral-400'
          }`} />
          <span className={`text-xs ${
            activeTab === 'liked' ? 'text-primary-500 font-medium' : 'text-neutral-400'
          }`}>Liked</span>
        </button>
      </motion.div>

      {/* Posts Grid */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-3 gap-1"
      >
        {activeTab === 'posts' && posts.filter((post) => post.userId === userId).map((post, index) => (
          <CustomPosts
            key={post.id}
            post={post}
            index={index}
          />
        ))}
        {activeTab === 'liked' && likedPosts.map((post, index) => (
          <CustomPosts
            key={post.id}
            post={post}
            index={index}
          />
        ))}
        {activeTab === 'saved' && savedPosts.map((post, index) => (
          <CustomPosts
            key={post.id}
            post={post}
            index={index}
          />
        ))}
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Profile Image */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <img
                    src={editData.profileImage ? URL.createObjectURL(editData.profileImage) : userData.profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <label className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors">
                    <CameraIcon className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Username */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserProfile;
