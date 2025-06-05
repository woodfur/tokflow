import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore as db, storage } from "../firebase/firebase";
import toast from "react-hot-toast";

// Icons
import { 
  HeartIcon as HeartOutline, 
  HeartIcon,
  ChatBubbleOvalLeftIcon, 
  ShareIcon,
  BookmarkIcon as BookmarkOutline,
  BookmarkIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  EllipsisHorizontalIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";

const Post = ({
  caption,
  company,
  video,
  profileImage,
  topic,
  timestamp,
  username,
  userId,
  songName,
  id,
}) => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const videoRef = useRef(null);
  
  // State management
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  // Fetch likes
  useEffect(() => {
    if (id) {
      const unsubscribe = onSnapshot(
        collection(db, "posts", id, "likes"),
        (snapshot) => setLikes(snapshot.docs)
      );
      return unsubscribe;
    }
  }, [id]);

  // Check if user has liked
  useEffect(() => {
    setHasLiked(
      likes.findIndex((like) => like.id === user?.uid) !== -1
    );
  }, [likes, user]);

  // Fetch comments
  useEffect(() => {
    if (id) {
      const unsubscribe = onSnapshot(
        collection(db, "posts", id, "comments"),
        (snapshot) => setComments(snapshot.docs)
      );
      return unsubscribe;
    }
  }, [id]);

  // Auto-play video when component mounts and handle visibility
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const videoContainer = video.parentElement;
      
      // Create intersection observer to handle autoplay on scroll
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              // Video is more than 50% visible, start playing
              const playPromise = video.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setPlaying(true);
                  })
                  .catch((error) => {
                    console.log("Auto-play prevented:", error);
                    setPlaying(false);
                  });
              }
            } else {
              // Video is not visible enough, pause it
              video.pause();
              setPlaying(false);
            }
          });
        },
        {
          threshold: [0.5], // Trigger when 50% of video is visible
          rootMargin: '0px'
        }
      );
      
      // Start observing the video container
      if (videoContainer) {
        observer.observe(videoContainer);
      }
      
      // Cleanup observer on unmount
      return () => {
        if (videoContainer) {
          observer.unobserve(videoContainer);
        }
        observer.disconnect();
      };
    }
  }, [video]); // Re-run when video source changes

  // Video event handlers
  const handleVideoClick = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
        setPlaying(false);
      } else {
        videoRef.current.play();
        setPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  // Like functionality
  const likePost = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    
    try {
      if (hasLiked) {
        await deleteDoc(doc(db, "posts", id, "likes", user.uid));
      } else {
        await setDoc(doc(db, "posts", id, "likes", user.uid), {
          username: user.displayName,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      toast.error("Error updating like");
    }
  };

  // Comment functionality
  const addComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    if (!comment.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "posts", id, "comments"), {
        comment: comment.trim(),
        username: user.displayName,
        profileImg: user.photoURL,
        timestamp: serverTimestamp(),
      });
      setComment("");
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Error adding comment");
    }
    setLoading(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: `${username}'s post`,
        text: caption,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const deletePost = async () => {
    if (!user || user.uid !== userId) {
      toast.error("You can only delete your own posts");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      // Delete video from Firebase Storage
      if (video) {
        const videoRef = ref(storage, video);
        await deleteObject(videoRef).catch((error) => {
          console.log("Video file may not exist:", error);
        });
      }

      // Delete all subcollections (likes and comments)
      const likesSnapshot = await getDocs(collection(db, "posts", id, "likes"));
      const commentsSnapshot = await getDocs(collection(db, "posts", id, "comments"));
      
      const deletePromises = [
        ...likesSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      ];
      
      await Promise.all(deletePromises);

      // Delete the main post document
      await deleteDoc(doc(db, "posts", id));

      toast.success("Post deleted successfully!");
      router.push("/"); // Redirect to home page
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-screen overflow-hidden bg-black"
    >
      {/* Full Screen Video */}
      <motion.div
        className="absolute inset-0"
        onMouseEnter={() => !playing && setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={video}
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleVideoClick}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setPlaying(false)}
          loop
          muted={muted}
          playsInline
          autoPlay
        />
          
        {/* Play/Pause Button - Only show when paused */}
        <AnimatePresence>
          {!playing && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={handleVideoClick}
              className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                <PlayIcon className="w-8 h-8 text-neutral-800 ml-1" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Video Controls */}
        <AnimatePresence>
          {showControls && duration > 0 && !playing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-2xl p-3"
            >
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-white/30 rounded-full h-1">
                  <div 
                    className="bg-white h-1 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* Controls Row */}
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {muted ? (
                      <SpeakerXMarkIcon className="w-5 h-5" />
                    ) : (
                      <SpeakerWaveIcon className="w-5 h-5" />
                    )}
                  </motion.button>
                  <span className="font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Overlaid Post Details - TikTok Style */}
      {/* Right Side Action Buttons - Positioned above navigation bar */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6">
        {/* Like Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={likePost}
          className="flex flex-col items-center space-y-1"
        >
          <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm">
            {hasLiked ? (
              <HeartSolid className="w-7 h-7 text-red-500" />
            ) : (
              <HeartOutline className="w-7 h-7 text-white" />
            )}
          </div>
          <span className="text-xs font-medium text-white">
            {formatCount(likes.length)}
          </span>
        </motion.button>

        {/* Comment Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center space-y-1"
        >
          <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm">
            <ChatBubbleOvalLeftIcon className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-medium text-white">
            {formatCount(comments.length)}
          </span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={sharePost}
          className="flex flex-col items-center space-y-1"
        >
          <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm">
            <ShareIcon className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-medium text-white">Share</span>
        </motion.button>

        {/* Bookmark Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setBookmarked(!bookmarked)}
          className="p-3 rounded-full bg-black/30 backdrop-blur-sm"
        >
          {bookmarked ? (
            <BookmarkSolid className="w-7 h-7 text-white" />
          ) : (
            <BookmarkOutline className="w-7 h-7 text-white" />
          )}
        </motion.button>

        {/* Delete Menu - Only show for post owner */}
        {user && user.uid === userId && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDeleteMenu(!showDeleteMenu)}
              className="p-3 rounded-full bg-black/30 backdrop-blur-sm"
            >
              <EllipsisHorizontalIcon className="w-7 h-7 text-white" />
            </motion.button>

            <AnimatePresence>
              {showDeleteMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  className="absolute right-0 bottom-full mb-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg py-2 min-w-[120px]"
                >
                  <button
                    onClick={deletePost}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete Post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Left Post Info - Positioned above navigation bar */}
      <div className="absolute bottom-24 left-4 right-20">
        {/* User Info */}
        <motion.div 
          className="flex items-center space-x-3 mb-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={() => router.push(`/profile/${username}`)}
        >
          <div className="relative">
            <img
              src={profileImage || "/default-avatar.png"}
              alt={username}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-white text-lg">
                {username}
              </h3>
              {company && <CheckBadgeIcon className="w-5 h-5 text-green-500" />}
            </div>
            <p className="text-sm text-white/80">
              {timestamp?.toDate().toLocaleDateString()}
            </p>
          </div>
        </motion.div>

        {/* Caption */}
        {caption && (
          <div className="mb-2">
            <p className="text-white text-sm leading-relaxed">
              {caption}
            </p>
            {topic && (
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                  #{topic}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Song Name */}
        {songName && (
          <div className="flex items-center space-x-2">
            <span className="text-white/80 text-sm">🎵</span>
            <p className="text-white/80 text-sm">
              {songName}
            </p>
          </div>
        )}
      </div>



      {/* Comments Section - Modal Overlay */}
      <AnimatePresence>
        {showComments && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
              onClick={() => setShowComments(false)}
            />
            
            {/* Comments Modal */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
              className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col rounded-t-3xl max-h-[70vh] md:max-h-[80vh]"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-white/30 rounded-full"></div>
            </div>
            
            {/* Comments Header - Mobile Optimized */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-black/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowComments(false)}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm touch-manipulation"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <h4 className="font-semibold text-white text-lg">
                  Comments
                </h4>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-sm font-medium">{comments.length}</span>
              </div>
            </div>
            
            {/* Comments List - Mobile Optimized */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {comments.length > 0 ? (
                <div className="p-4 space-y-4 pb-6">
                  {comments.map((commentDoc, index) => {
                    const commentData = commentDoc.data();
                    return (
                      <motion.div
                        key={commentDoc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start space-x-3 group"
                      >
                        <img
                          src={commentData.profileImg || commentData.userImage || "/default-avatar.png"}
                          alt={commentData.username}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm text-white truncate">
                                {commentData.username}
                              </p>
                              <p className="text-xs text-white/60 ml-2 flex-shrink-0">
                                {moment(commentData.timestamp?.toDate()).fromNow()}
                              </p>
                            </div>
                            <p className="text-white/90 text-sm leading-relaxed break-words">
                              {commentData.comment}
                            </p>
                          </div>
                          
                          {/* Mobile Comment Actions */}
                          <div className="flex items-center space-x-4 mt-2 ml-4">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center space-x-1 text-xs text-white/60 hover:text-red-400 transition-colors touch-manipulation"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>Like</span>
                            </motion.button>
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              className="text-xs text-white/60 hover:text-blue-400 transition-colors touch-manipulation"
                            >
                              Reply
                            </motion.button>
                            
                            {user && user.displayName === commentData.username && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                              >
                                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium text-lg mb-2">No comments yet</h3>
                  <p className="text-white/60 text-sm">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
            
            {/* Mobile Comment Input - Above Navigation Bar */}
            {user ? (
              <div className="bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border-t border-gray-700/50 p-6 pb-20 md:pb-6">
                <form onSubmit={addComment} className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-600/50 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                  
                  <div className="flex-1 flex items-end space-x-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={1}
                        className="w-full px-2 py-3 bg-transparent border-0 border-b-2 border-gray-600/40 focus:outline-none focus:border-blue-500 transition-all duration-300 text-white placeholder-gray-400 resize-none min-h-[40px] max-h-32 touch-manipulation"
                        disabled={loading}
                        style={{
                          height: 'auto',
                          minHeight: '40px'
                        }}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                        }}
                      />
                      
                      {/* Emoji Button */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-2 bottom-3 p-1 text-gray-400 hover:text-yellow-400 transition-colors duration-200 touch-manipulation"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </motion.button>
                    </div>
                    
                    <motion.button
                      type="submit"
                      disabled={loading || !comment.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                        className="h-[52px] px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl touch-manipulation min-w-[60px] flex items-center justify-center border border-blue-500/20"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border-t border-gray-700/50 p-6 pb-20 md:pb-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center border border-gray-600/30">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Join the conversation</h3>
                    <p className="text-gray-400 text-sm mb-4">Sign in to share your thoughts and connect with others</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/auth/signin')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl border border-blue-500/20"
                  >
                    Sign In
                  </motion.button>
                </div>
              </div>
            )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export default Post;
