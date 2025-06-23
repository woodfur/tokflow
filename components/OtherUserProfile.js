import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { onSnapshot, query, collection, orderBy, doc, where, getDocs, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlusIcon,
  EyeIcon,
  ArrowLeftIcon,
  Squares2X2Icon,
  HeartIcon,
  CheckIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { firestore, auth } from "../firebase/firebase";
import CustomPosts from "./CustomPosts";

const OtherUserProfile = () => {
  const router = useRouter();
  const { id: profileUserId } = router.query;
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch profile user's data
  useEffect(() => {
    if (!profileUserId) return;

    const userRef = doc(firestore, "users", profileUserId);
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const profileData = { id: docSnapshot.id, ...docSnapshot.data() };
        setUserData(profileData);
        setFollowersCount(profileData.totalFollowers || 0);
        setFollowingCount(profileData.totalFollowing || 0);
        setLikesCount(profileData.totalLikes || 0);
      } else {
        setUserData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to user profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileUserId]);

  // Fetch profile user's posts
  useEffect(() => {
    if (!profileUserId) return;

    const q = query(
      collection(firestore, "posts"), 
      where("userId", "==", profileUserId),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [profileUserId]);

  // Check if current user is following this profile
  useEffect(() => {
    if (!user || !profileUserId || user.uid === profileUserId) return;

    const checkFollowStatus = async () => {
      try {
        const followDoc = await getDoc(doc(firestore, "users", user.uid, "following", profileUserId));
        setIsFollowing(followDoc.exists());
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkFollowStatus();
  }, [user, profileUserId]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!user || !profileUserId || user.uid === profileUserId) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(doc(firestore, "users", user.uid, "following", profileUserId));
        await deleteDoc(doc(firestore, "users", profileUserId, "followers", user.uid));
        
        // Update follower count for target user
        await updateDoc(doc(firestore, "users", profileUserId), {
          totalFollowers: increment(-1)
        });
        
        // Update following count for current user
        await updateDoc(doc(firestore, "users", user.uid), {
          totalFollowing: increment(-1)
        });
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await setDoc(doc(firestore, "users", user.uid, "following", profileUserId), {
          timestamp: new Date(),
          userId: profileUserId
        });
        await setDoc(doc(firestore, "users", profileUserId, "followers", user.uid), {
          timestamp: new Date(),
          userId: user.uid
        });
        
        // Update follower count for target user
        await updateDoc(doc(firestore, "users", profileUserId), {
          totalFollowers: increment(1)
        });
        
        // Update following count for current user
        await updateDoc(doc(firestore, "users", user.uid), {
          totalFollowing: increment(1)
        });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">User not found</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">This user doesn't exist or has been removed.</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {userData.displayName || userData.username || 'User Profile'}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="px-4 pt-6 pb-24">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            {userData.photoURL || userData.profileImg ? (
              <img
                src={userData.photoURL || userData.profileImg}
                alt={userData.displayName || userData.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-neutral-800 shadow-lg">
                {(userData.displayName || userData.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            {userData.displayName || userData.username || 'Anonymous User'}
          </h2>
          
          {userData.username && (
            <p className="text-neutral-600 dark:text-neutral-400 mb-2">@{userData.username}</p>
          )}
          
          {userData.bio && (
            <p className="text-neutral-700 dark:text-neutral-300 mb-4 max-w-sm mx-auto">
              {userData.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-center space-x-8 mb-6">
            <div className="text-center">
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{posts.length}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{followersCount}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{followingCount}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Following</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{likesCount}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Likes</p>
            </div>
          </div>

          {/* Follow Button - Only show if not viewing own profile */}
          {user && user.uid !== profileUserId && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2 mx-auto ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {followLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isFollowing ? (
                <>
                  <CheckIcon className="w-5 h-5" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5" />
                  <span>Follow</span>
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Content Tabs */}
        <div className="mb-6">
          <div className="flex justify-center space-x-8 border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center space-x-2 pb-3 border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
              <span className="font-medium">Posts</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'posts' && (
            <div>
              {posts.length > 0 ? (
                <CustomPosts posts={posts} />
              ) : (
                <div className="text-center py-12">
                  <Squares2X2Icon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-2">
                    No posts yet
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-500">
                    This user hasn't shared any posts
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherUserProfile;