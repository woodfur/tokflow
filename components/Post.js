import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore as db } from "../firebase/firebase";
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



      {/* Comments Section - Full Screen Overlay */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col"
          >
            {/* Comments Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h4 className="font-semibold text-white text-lg">
                Comments ({comments.length})
              </h4>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowComments(false)}
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <img
                    src={comment.data().profileImg || "/default-avatar.png"}
                    alt={comment.data().username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                  />
                  <div className="flex-1">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                      <p className="font-medium text-sm text-white mb-1">
                        {comment.data().username}
                      </p>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {comment.data().comment}
                      </p>
                    </div>
                    <p className="text-xs text-white/60 mt-2 ml-4">
                      {comment.data().timestamp?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Comment Input */}
            {user && (
              <div className="p-4 border-t border-white/20">
                <form onSubmit={addComment} className="flex items-center space-x-3">
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                  />
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-white placeholder-white/60"
                      disabled={loading}
                    />
                    <motion.button
                      type="submit"
                      disabled={loading || !comment.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? "..." : "Post"}
                    </motion.button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export default Post;
