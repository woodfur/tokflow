import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { onSnapshot, query, collection, orderBy } from "firebase/firestore";

import { motion } from "framer-motion";
import {
  UserPlusIcon,
  EyeIcon,
  EllipsisHorizontalIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  BookmarkIcon,
  HeartIcon
} from "@heroicons/react/24/outline";

import { firestore, auth } from "../firebase/firebase";
import CustomPosts from "./CustomPosts";

const UserProfile = () => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const { userId } = router.query;
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState([]);
  const [isShow, setIsShow] = useState(false);

  /*   console.log(posts); */

  useEffect(
    () =>
      onSnapshot(
        query(collection(firestore, "posts"), orderBy("timestamp", "desc")),
        (snapshot) => {
          setPosts(snapshot.docs);
        }
      ),
    [firestore]
  );

  const filterUserData = () => {
    try {
      posts.map((data) => {
        if (data.data().userId === userId) {
          setUserData(data.data());

          if (data.data().userId === user?.uid) {
            setIsShow(true);
          }
        }
      });
    } catch (error) {
      alert(error);
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
          Description about me goes here
        </motion.p>
      </div>

      {/* Content Tabs */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex justify-center gap-8 mb-6 border-b border-neutral-200/50 dark:border-neutral-700/50"
      >
        <button className="flex flex-col items-center pb-3 border-b-2 border-primary-500">
          <Squares2X2Icon className="w-6 h-6 text-primary-500 mb-1" />
          <span className="text-xs text-primary-500 font-medium">Posts</span>
        </button>
        <button className="flex flex-col items-center pb-3">
          <BookmarkIcon className="w-6 h-6 text-neutral-400 mb-1" />
          <span className="text-xs text-neutral-400">Saved</span>
        </button>
        <button className="flex flex-col items-center pb-3">
          <HeartIcon className="w-6 h-6 text-neutral-400 mb-1" />
          <span className="text-xs text-neutral-400">Liked</span>
        </button>
      </motion.div>

      {/* Posts Grid */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-3 gap-1"
      >
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden cursor-pointer group shadow-lg"
            onClick={() => router.push(`/post/${post.id}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={post.image}
              alt="Post"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-1 text-white text-xs">
                <HeartIcon className="w-3 h-3" />
                <span>0</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>


    </motion.div>
  );
};

export default UserProfile;
