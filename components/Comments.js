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
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { rewriteToCDN } from "../utils/cdn";

const Comments = ({ comments, sendComment, comment, setComment, loading, ownShow }) => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [likedComments, setLikedComments] = useState(new Set());
  const [showReplies, setShowReplies] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const recordingTimerRef = useRef(null);
  const audioRef = useRef(null);
  
  // Reply voice recording states
  const [replyRecording, setReplyRecording] = useState({});
  const [replyRecordingTime, setReplyRecordingTime] = useState({});
  const [replyAudioBlob, setReplyAudioBlob] = useState({});
  const [replyMediaRecorder, setReplyMediaRecorder] = useState({});
  const [replyText, setReplyText] = useState({});
  const replyRecordingTimerRef = useRef({});

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

  // Voice recording functions
  const startRecording = async () => {
    // Clear comment text when starting voice recording
    setComment('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer with auto-stop at 10 seconds
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 10) { // Stop at 10 seconds
            // Use setTimeout to avoid calling stopRecording within setState
            setTimeout(() => {
              if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                setIsRecording(false);
                if (recordingTimerRef.current) {
                  clearInterval(recordingTimerRef.current);
                }
              }
            }, 0);
            return 10;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  // Reply voice recording functions
  const startReplyRecording = async (commentId) => {
    // Clear reply text when starting voice recording
    setReplyText(prev => ({ ...prev, [commentId]: '' }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setReplyAudioBlob(prev => ({ ...prev, [commentId]: audioBlob }));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setReplyMediaRecorder(prev => ({ ...prev, [commentId]: recorder }));
      setReplyRecording(prev => ({ ...prev, [commentId]: true }));
      setReplyRecordingTime(prev => ({ ...prev, [commentId]: 0 }));

      // Start timer with auto-stop at 10 seconds
      replyRecordingTimerRef.current[commentId] = setInterval(() => {
        setReplyRecordingTime(prev => {
          const currentTime = prev[commentId] || 0;
          const newTime = currentTime + 1;
          if (newTime >= 10) { // Stop at 10 seconds
            setTimeout(() => {
              const currentRecorder = replyMediaRecorder[commentId];
              if (currentRecorder && currentRecorder.state === 'recording') {
                currentRecorder.stop();
                setReplyRecording(prev => ({ ...prev, [commentId]: false }));
                if (replyRecordingTimerRef.current[commentId]) {
                  clearInterval(replyRecordingTimerRef.current[commentId]);
                }
              }
            }, 0);
            return { ...prev, [commentId]: 10 };
          }
          return { ...prev, [commentId]: newTime };
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopReplyRecording = (commentId) => {
    const recorder = replyMediaRecorder[commentId];
    if (recorder && replyRecording[commentId]) {
      recorder.stop();
      setReplyRecording(prev => ({ ...prev, [commentId]: false }));
      if (replyRecordingTimerRef.current[commentId]) {
        clearInterval(replyRecordingTimerRef.current[commentId]);
      }
    }
  };

  const sendReplyVoiceMessage = (commentId, parentUsername) => {
    const audioBlob = replyAudioBlob[commentId];
    if (audioBlob) {
      // Convert blob to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        // Call sendComment with voice message data and reply info
        sendComment(null, {
          type: 'voice',
          audioData: base64Audio,
          duration: (replyRecordingTime[commentId] || 0) + 1,
          replyTo: parentUsername
        });
        // Reset reply voice recording state
        setReplyAudioBlob(prev => ({ ...prev, [commentId]: null }));
        setReplyRecordingTime(prev => ({ ...prev, [commentId]: 0 }));
        setReplyingTo(null);
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const cancelReplyVoiceMessage = (commentId) => {
    setReplyAudioBlob(prev => ({ ...prev, [commentId]: null }));
    setReplyRecordingTime(prev => ({ ...prev, [commentId]: 0 }));
  };

  const handleReplySubmit = (e, commentId, parentUsername) => {
    e.preventDefault();
    const text = replyText[commentId];
    if (text && text.trim()) {
      // Send text reply
      sendComment(null, {
        type: 'text',
        comment: text.trim(),
        replyTo: parentUsername
      });
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const playAudio = (audioUrl, commentId) => {
    if (playingAudio === commentId) {
      // Pause if already playing
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingAudio(null);
      }
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners for progress tracking
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
      
      audio.ontimeupdate = () => {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        setAudioCurrentTime(currentTime);
        if (duration > 0) {
          setAudioProgress((currentTime / duration) * 100);
        }
      };
      
      audio.onended = () => {
        setPlayingAudio(null);
        setAudioProgress(0);
        setAudioCurrentTime(0);
      };
      
      audio.onpause = () => {
        setPlayingAudio(null);
      };
      
      audio.play();
      setPlayingAudio(commentId);
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      // Convert blob to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        // Call sendComment with voice message data
        sendComment(null, {
          type: 'voice',
          audioData: base64Audio,
          duration: recordingTime + 1
        });
        // Reset voice recording state and clear comment text
        setAudioBlob(null);
        setRecordingTime(0);
        setComment('');
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const cancelVoiceMessage = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      // Cleanup reply recording timers
      Object.values(replyRecordingTimerRef.current).forEach(timer => {
        if (timer) clearInterval(timer);
      });
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

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
                    src={rewriteToCDN(commentData.profileImg || commentData.userImage) || "/default-avatar.png"}
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
                      
                      {/* Voice Message */}
                      {commentData.type === 'voice' ? (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 max-w-xs">
                          <div className="flex items-center space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => playAudio(commentData.audioData, commentData.id)}
                              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                            >
                              {playingAudio === commentData.id ? (
                                <PauseIcon className="w-5 h-5" />
                              ) : (
                                <PlayIcon className="w-5 h-5 ml-0.5" />
                              )}
                            </motion.button>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                                  onClick={(e) => {
                                    if (audioRef.current && playingAudio === commentData.id) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const clickX = e.clientX - rect.left;
                                      const width = rect.width;
                                      const clickProgress = (clickX / width) * 100;
                                      const newTime = (clickProgress / 100) * audioRef.current.duration;
                                      audioRef.current.currentTime = newTime;
                                    }
                                  }}
                                >
                                  <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-100" 
                                    style={{ width: playingAudio === commentData.id ? `${audioProgress}%` : '0%' }}
                                  ></div>
                                </div>
                                <span className="text-white/80 text-xs font-mono">
                                  {playingAudio === commentData.id && audioDuration > 0 && isFinite(audioDuration) && isFinite(audioCurrentTime) && !isNaN(audioDuration) && !isNaN(audioCurrentTime)
                                    ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s`
                                    : `${commentData.duration || 0}s`
                                  }
                                </span>
                              </div>
                              <p className="text-white/60 text-xs mt-1">Voice message</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                          {commentData.comment}
                        </p>
                      )}
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
                          <form onSubmit={(e) => handleReplySubmit(e, commentDoc.id, commentData.username)} className="flex items-end space-x-2">
                            <img
                              src={rewriteToCDN(user?.photoURL) || "/default-avatar.png"}
                              alt={user?.displayName}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                            
                            <div className="flex-1 flex items-end space-x-2">
                              {/* Hide text input when recording or has audio blob */}
                              {!replyRecording[commentDoc.id] && !replyAudioBlob[commentDoc.id] && (
                                <input
                                  type="text"
                                  value={replyText[commentDoc.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [commentDoc.id]: e.target.value }))}
                                  placeholder={`Reply to ${commentData.username}...`}
                                  className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                              )}
                              
                              {/* Voice Recording Preview */}
                              {replyAudioBlob[commentDoc.id] && (
                                <div className="flex-1 flex items-center space-x-2 bg-blue-500/20 rounded-xl p-2 border border-blue-500/30">
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => playAudio(URL.createObjectURL(replyAudioBlob[commentDoc.id]), `reply-preview-${commentDoc.id}`)}
                                    className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                                  >
                                    {playingAudio === `reply-preview-${commentDoc.id}` ? (
                                      <PauseIcon className="w-3 h-3" />
                                    ) : (
                                      <PlayIcon className="w-3 h-3 ml-0.5" />
                                    )}
                                  </motion.button>
                                  <div className="flex-1">
                                    <div className="bg-white/20 rounded-full h-1 overflow-hidden">
                                      <div className="bg-blue-400 h-full rounded-full transition-all duration-300" style={{ width: playingAudio === `reply-preview-${commentDoc.id}` ? `${audioProgress}%` : '0%' }}></div>
                                    </div>
                                    <span className="text-xs text-white/70 font-mono">
                                      {playingAudio === `reply-preview-${commentDoc.id}` && isFinite(audioDuration) && isFinite(audioCurrentTime) && !isNaN(audioDuration) && !isNaN(audioCurrentTime) && audioDuration > 0
                                        ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s` 
                                        : `${replyRecordingTime[commentDoc.id] || 0}s`}
                                    </span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => cancelReplyVoiceMessage(commentDoc.id)}
                                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                                    >
                                      Cancel
                                    </motion.button>
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => sendReplyVoiceMessage(commentDoc.id, commentData.username)}
                                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                    >
                                      Send
                                    </motion.button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Recording Indicator */}
                              {replyRecording[commentDoc.id] && (
                                <div className="flex-1 flex items-center space-x-2 bg-red-500/20 rounded-xl p-2 border border-red-500/30">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-white text-xs font-medium">Recording...</span>
                                      <span className="text-xs text-white/70 font-mono">{replyRecordingTime[commentDoc.id] || 0}/10s</span>
                                    </div>
                                    <div className="mt-1">
                                      <div className="bg-white/20 rounded-full h-1 overflow-hidden">
                                        <div className="bg-red-400 h-full rounded-full transition-all duration-300" style={{ width: `${((replyRecordingTime[commentDoc.id] || 0) / 10) * 100}%` }}></div>
                                      </div>
                                    </div>
                                  </div>
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => stopReplyRecording(commentDoc.id)}
                                    className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                  >
                                    <StopIcon className="w-3 h-3" />
                                  </motion.button>
                                </div>
                              )}
                              
                              {/* Send/Record Button */}
                              {!replyRecording[commentDoc.id] && !replyAudioBlob[commentDoc.id] && (
                                (replyText[commentDoc.id] || '').trim() ? (
                                  <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                                  >
                                    <PaperAirplaneIcon className="w-3 h-3" />
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    type="button"
                                    onClick={() => startReplyRecording(commentDoc.id)}
                                    disabled={replyRecording[commentDoc.id]}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <MicrophoneIcon className="w-3 h-3" />
                                  </motion.button>
                                )
                              )}
                            </div>
                          </form>
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
              src={rewriteToCDN(user.photoURL) || "/default-avatar.png"}
              alt={user.displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
            />
            <div className="flex-1 flex items-end space-x-2">
              {/* Hide text input and emoji when recording or has audio blob */}
              {!isRecording && !audioBlob && (
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
              )}
              
              {/* Voice Recording Preview - Inline with profile */}
              {audioBlob && (
                <div className="flex-1 flex items-center space-x-3 bg-blue-500/20 rounded-xl p-3 border border-blue-500/30">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => playAudio(URL.createObjectURL(audioBlob), 'preview')}
                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                  >
                    {playingAudio === 'preview' ? (
                      <PauseIcon className="w-5 h-5" />
                    ) : (
                      <PlayIcon className="w-5 h-5 ml-0.5" />
                    )}
                  </motion.button>
                  <div className="flex-1">
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden cursor-pointer" onClick={(e) => {
                      if (audioRef.current && playingAudio === 'preview') {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const newTime = (clickX / rect.width) * audioRef.current.duration;
                        audioRef.current.currentTime = newTime;
                      }
                    }}>
                      <div className="bg-blue-400 h-full rounded-full transition-all duration-300" style={{ width: playingAudio === 'preview' ? `${audioProgress}%` : '0%' }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-white/60">Voice message</span>
                      <span className="text-xs text-white/70 font-mono">
                        {playingAudio === 'preview' && isFinite(audioDuration) && isFinite(audioCurrentTime) && !isNaN(audioDuration) && !isNaN(audioCurrentTime) && audioDuration > 0
                          ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s` 
                          : `${recordingTime}s`}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={cancelVoiceMessage}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={sendVoiceMessage}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      Send
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Recording Indicator - Inline with profile */}
              {isRecording && (
                <div className="flex-1 flex items-center space-x-3 bg-red-500/20 rounded-xl p-3 border border-red-500/30">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">Recording...</span>
                      <span className="text-xs text-white/70 font-mono">{recordingTime}/10s</span>
                    </div>
                    <div className="mt-2">
                      <div className="bg-white/20 rounded-full h-1 overflow-hidden">
                        <div className="bg-red-400 h-full rounded-full transition-all duration-300" style={{ width: `${(recordingTime / 10) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Send/Record Button */}
              {comment.trim() ? (
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-[52px] w-[52px] bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center touch-manipulation"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  disabled={loading || isRecording}
                  onClick={startRecording}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-[52px] w-[52px] bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl font-medium hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center touch-manipulation"
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </motion.button>
              )}
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
