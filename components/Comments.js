import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/router';
import { auth } from '../firebase/firebase';
import moment from 'moment';
import {
  HeartIcon,
  EllipsisHorizontalIcon,
  FaceSmileIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

const Comments = ({ comments, sendComment, comment, setComment, loading, ownShow }) => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [likedComments, setLikedComments] = useState(new Set());
  const [showReplies, setShowReplies] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle emoji picker outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [comment]);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '❤️', '🔥', '💯', '🎉', '👏'];

  const handleLikeComment = (commentId) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleEmojiSelect = (emoji) => {
    setComment(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji) => {
    setComment(comment + emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim() && !loading) {
      sendComment(e);
      setReplyingTo(null);
    }
  };

  const handleReply = (username) => {
    setReplyingTo(username);
    setComment(`@${username} `);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : timestamp.toDate();
    return moment(date).fromNow();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      {/* Comments Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className={
        ownShow
          ? "h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          : "h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      }>
        {comments.length > 0 ? (
          <div className="p-4 space-y-4">
            {comments.map((commentDoc) => {
              const commentData = commentDoc.data();
              return (
                <motion.div
                  key={commentDoc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-3 group"
                >
                  {/* User Avatar */}
                  <img
                    src={commentData.profileImg || commentData.userImage || "/default-avatar.png"}
                    alt={commentData.username}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                  
                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {commentData.username}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(commentData.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                        {commentData.comment}
                      </p>
                    </div>
                    
                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4 mt-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLikeComment(commentDoc.id)}
                        className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {likedComments.has(commentDoc.id) ? (
                          <HeartSolid className="w-4 h-4 text-red-500" />
                        ) : (
                          <HeartIcon className="w-4 h-4" />
                        )}
                        <span>Like</span>
                      </motion.button>
                      
                      <button
                        onClick={() => setReplyingTo(replyingTo === commentDoc.id ? null : commentDoc.id)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        Reply
                      </button>
                      
                      {user && user.displayName === commentData.username && (
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                    
                    {/* Reply Input */}
                    <AnimatePresence>
                      {replyingTo === commentDoc.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 ml-4"
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={user?.photoURL || "/default-avatar.png"}
                              alt={user?.displayName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <input
                              type="text"
                              placeholder={`Reply to ${commentData.username}...`}
                              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                            <button className="text-blue-500 hover:text-blue-600 transition-colors">
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <FaceSmileIcon className="w-8 h-8 mb-2" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-white/20 p-4 pb-20 md:pb-4"
        >
          <form onSubmit={handleSubmit} className="flex items-end space-x-3">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt={user.displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
            />
            <div className="flex-1 flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={replyingTo ? `Replying to @${replyingTo}...` : "Add a comment..."}
                  rows={1}
                  className="w-full px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-white placeholder-white/60 resize-none min-h-[48px] max-h-32 touch-manipulation"
                  disabled={loading}
                  style={{
                    height: 'auto',
                    minHeight: '48px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
                
                {/* Emoji Picker Button */}
                <div className="absolute right-3 bottom-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 text-white/60 hover:text-white/80 transition-colors touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.button>
                  
                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        ref={emojiPickerRef}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-3 grid grid-cols-6 gap-2 shadow-xl z-10"
                      >
                        {emojis.map((emoji, index) => (
                          <motion.button
                            key={index}
                            type="button"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setComment(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-xl hover:bg-white/10 rounded-lg p-1 transition-colors touch-manipulation"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <motion.button
                type="submit"
                disabled={loading || !comment.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg min-w-[80px] flex items-center justify-center touch-manipulation"
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
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-white/20 p-4 pb-20 md:pb-4 text-center"
        >
          <p className="text-white/60 text-sm mb-3">Sign in to join the conversation</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/auth/signin')}
            className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors touch-manipulation"
          >
            Sign In
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default Comments;
