import React, { useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { auth, firestore as db, storage } from "../firebase/firebase";
import toast from "react-hot-toast";
import {
  HeartIcon,
  EllipsisHorizontalIcon,
  PlayIcon
} from "@heroicons/react/24/outline";
import { rewriteToCDN } from "../utils/cdn";

const CustomPosts = ({ post, index }) => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePost = async (e) => {
    e.stopPropagation();
    
    if (!user || user.uid !== post.userId) {
      toast.error("You can only delete your own posts");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // Delete video from Firebase Storage
      if (post.video) {
        const videoRef = ref(storage, post.video);
        await deleteObject(videoRef).catch((error) => {
          console.log("Video file may not exist:", error);
        });
      }

      // Delete all subcollections (likes and comments)
      const likesSnapshot = await getDocs(collection(db, "posts", post.id, "likes"));
      const commentsSnapshot = await getDocs(collection(db, "posts", post.id, "comments"));
      
      const deletePromises = [
        ...likesSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      ];
      
      await Promise.all(deletePromises);

      // Delete the main post document
      await deleteDoc(doc(db, "posts", post.id));

      toast.success("Post deleted successfully!");
      setShowDeleteMenu(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden cursor-pointer group shadow-lg"
      onClick={() => router.push(`/detail/${post.id}`)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <video
        src={rewriteToCDN(post.video)}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        muted
        loop
        playsInline
      />
      
      {/* Play Icon Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
          <PlayIcon className="w-6 h-6 text-neutral-800" />
        </div>
      </div>
      
      {/* Post Stats */}
      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1 text-white text-xs">
          <HeartIcon className="w-3 h-3" />
          <span>0</span>
        </div>
      </div>

      {/* Topic Badge */}
      {post.topic && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-block px-2 py-1 bg-black/50 backdrop-blur-sm text-white rounded-full text-xs font-medium">
            #{post.topic}
          </span>
        </div>
      )}

      {/* Delete Menu - Only show for post owner */}
      {user && user.uid === post.userId && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteMenu(!showDeleteMenu);
              }}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <EllipsisHorizontalIcon className="w-4 h-4 text-white" />
            </motion.button>

            <AnimatePresence>
              {showDeleteMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg py-1 min-w-[100px] z-10"
                >
                  <button
                    onClick={deletePost}
                    disabled={isDeleting}
                    className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CustomPosts;
