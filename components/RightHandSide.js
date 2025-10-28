import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "../firebase/firebase";
import Post from "./Post";

const RightHandSide = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(
    () => {
      const unsubscribe = onSnapshot(
        query(collection(firestore, "posts"), orderBy("timestamp", "desc")),
        (snapshot) => {
          setPosts(snapshot.docs);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching posts:", error);
          setLoading(false);
        }
      );
      
      return () => unsubscribe();
    },
    []
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading amazing content...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Posts Feed - TikTok Style Vertical Scrolling */}
      <AnimatePresence mode="popLayout">
        {posts.length > 0 ? (
          <>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 150
                }}
                className="w-full h-screen snap-start snap-always flex-shrink-0"
                layout
              >
                <Post
                  caption={post.data().caption}
                  company={post.data().company}
                  video={post.data().video}
                  profileImage={post.data().profileImage}
                  topic={post.data().topic}
                  timestamp={post.data().timestamp}
                  username={post.data().username}
                  userId={post.data().userId}
                  songName={post.data().songName}
                  id={post.id}
                />
              </motion.div>
            ))}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-screen snap-start flex items-center justify-center"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-glass border border-neutral-200/50 p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4 text-center">📱</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2 text-center">
                No posts yet
              </h3>
              <p className="text-neutral-600 mb-6 text-center">
                Be the first to share something amazing with the community!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create Post
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default RightHandSide;
