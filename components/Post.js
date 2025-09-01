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
  getDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore as db, storage } from "../firebase/firebase";
import toast from "react-hot-toast";
import { rewriteToCDN } from "../utils/cdn";

// Icons
import { 
  HeartIcon as HeartOutline, 
  HeartIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  EllipsisHorizontalIcon,
  CheckBadgeIcon,
  MicrophoneIcon,
  StopIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid, ChatBubbleOvalLeftIcon, ShareIcon, PlusIcon } from "@heroicons/react/24/solid";

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
  const [muted, setMuted] = useState(false);
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [parentUsername, setParentUsername] = useState("");
  const [replies, setReplies] = useState({});
  const [showCommentMenu, setShowCommentMenu] = useState(null);
  const [showReplyMenu, setShowReplyMenu] = useState(null);
  const [commentLikes, setCommentLikes] = useState({});
  const [userCommentLikes, setUserCommentLikes] = useState({});
  const [replyLikes, setReplyLikes] = useState({});
  const [userReplyLikes, setUserReplyLikes] = useState({});
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Seeking state
  const [isDragging, setIsDragging] = useState(false);
  
  // Video session tracking for restart behavior
  const [lastViewTime, setLastViewTime] = useState(0);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const viewStartTimeRef = useRef(null);
  const shouldRestartRef = useRef(false);
  
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
  const replyRecordingTimerRef = useRef({});

  // Check if current user is following the post's author
  useEffect(() => {
    if (!user || !userId || user.uid === userId) return;
    const checkFollowStatus = async () => {
      try {
        const followDoc = await getDoc(doc(db, "users", user.uid, "following", userId));
        setIsFollowing(followDoc.exists());
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };
    checkFollowStatus();
  }, [user, userId]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!user || !userId || user.uid === userId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(doc(db, "users", user.uid, "following", userId));
        await deleteDoc(doc(db, "users", userId, "followers", user.uid));
        setIsFollowing(false);
      } else {
        // Follow
        await setDoc(doc(db, "users", user.uid, "following", userId), {
          timestamp: new Date(),
          userId: userId
        });
        await setDoc(doc(db, "users", userId, "followers", user.uid), {
          timestamp: new Date(),
          userId: user.uid
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
    } finally {
      setFollowLoading(false);
    }
  };

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

  // Fetch share count
  useEffect(() => {
    if (id) {
      const unsubscribe = onSnapshot(
        collection(db, "posts", id, "shares"),
        (snapshot) => setShareCount(snapshot.size)
      );
      return unsubscribe;
    }
  }, [id]);

  // Cleanup voice recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Cleanup reply recording timers
      Object.values(replyRecordingTimerRef.current).forEach(timer => {
        if (timer) clearInterval(timer);
      });
    };
  }, []);

  // Check if user has liked
  useEffect(() => {
    setHasLiked(
      likes.findIndex((like) => like.id === user?.uid) !== -1
    );
  }, [likes, user]);

  // Calculate total comment count including replies
  const getTotalCommentCount = () => {
    let totalCount = comments.length;
    Object.values(replies).forEach(replyArray => {
      totalCount += replyArray.length;
    });
    return totalCount;
  };

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside menu containers
      const isMenuClick = event.target.closest('[data-menu="comment-menu"]') || 
                         event.target.closest('[data-menu="reply-menu"]') ||
                         event.target.closest('[data-menu-trigger="comment"]') ||
                         event.target.closest('[data-menu-trigger="reply"]');
      
      if (!isMenuClick) {
        setShowCommentMenu(null);
        setShowReplyMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch replies for each comment
  useEffect(() => {
    if (id && comments.length > 0) {
      const unsubscribes = [];
      
      comments.forEach((commentDoc) => {
        const unsubscribe = onSnapshot(
          collection(db, "posts", id, "comments", commentDoc.id, "replies"),
          (snapshot) => {
            setReplies(prev => ({
              ...prev,
              [commentDoc.id]: snapshot.docs
            }));
          }
        );
        unsubscribes.push(unsubscribe);
      });
      
      return () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
      };
    }
  }, [id, comments]);

  // Fetch comment likes
  useEffect(() => {
    if (!id || comments.length === 0) return;

    const unsubscribeCommentLikes = [];

    comments.forEach((commentDoc) => {
      const likesRef = collection(db, "posts", id, "comments", commentDoc.id, "likes");
      
      const unsubscribe = onSnapshot(likesRef, (snapshot) => {
        const likesData = snapshot.docs;
        setCommentLikes(prev => ({
          ...prev,
          [commentDoc.id]: likesData
        }));
        
        // Check if current user has liked this comment
        if (user) {
          const hasLiked = likesData.some(like => like.id === user.uid);
          setUserCommentLikes(prev => ({
            ...prev,
            [commentDoc.id]: hasLiked
          }));
        }
      });
      
      unsubscribeCommentLikes.push(unsubscribe);
    });

    return () => {
      unsubscribeCommentLikes.forEach(unsubscribe => unsubscribe());
    };
  }, [id, comments, user]);

  // Fetch reply likes
  useEffect(() => {
    if (!id || Object.keys(replies).length === 0) return;

    const unsubscribeReplyLikes = [];

    Object.entries(replies).forEach(([commentId, replyArray]) => {
      replyArray.forEach((replyDoc) => {
        const likesRef = collection(db, "posts", id, "comments", commentId, "replies", replyDoc.id, "likes");
        
        const unsubscribe = onSnapshot(likesRef, (snapshot) => {
          const likesData = snapshot.docs;
          setReplyLikes(prev => ({
            ...prev,
            [`${commentId}_${replyDoc.id}`]: likesData
          }));
          
          // Check if current user has liked this reply
          if (user) {
            const hasLiked = likesData.some(like => like.id === user.uid);
            setUserReplyLikes(prev => ({
              ...prev,
              [`${commentId}_${replyDoc.id}`]: hasLiked
            }));
          }
        });
        
        unsubscribeReplyLikes.push(unsubscribe);
      });
    });

    return () => {
      unsubscribeReplyLikes.forEach(unsubscribe => unsubscribe());
    };
  }, [id, replies, user]);

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
              viewStartTimeRef.current = Date.now();
              
              // Check if video should restart from beginning
              if (shouldRestartRef.current && hasBeenViewed) {
                video.currentTime = 0;
                setCurrentTime(0);
                setProgress(0);
                shouldRestartRef.current = false;
              }
              
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
              if (viewStartTimeRef.current) {
                const viewDuration = Date.now() - viewStartTimeRef.current;
                setLastViewTime(viewDuration);
                setHasBeenViewed(true);
                
                // If user spent more than 2.5 seconds on another video,
                // mark this video to restart from beginning when they return
                if (viewDuration > 2500) {
                  shouldRestartRef.current = true;
                }
                
                viewStartTimeRef.current = null;
              }
              
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
  }, [video, hasBeenViewed]); // Re-run when video source changes or view state changes

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
  const addComment = async (e, voiceData = null) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    
    // Check if it's a voice message or text comment
    if (voiceData) {
      if (!voiceData.audioData) return;
    } else {
      if (!comment.trim()) return;
    }

    setLoading(true);
    try {
      const commentData = {
        username: user.displayName,
        profileImg: user.photoURL,
        timestamp: serverTimestamp(),
      };
      
      if (voiceData) {
        // Voice message
        commentData.type = 'voice';
        commentData.audioData = voiceData.audioData;
        commentData.duration = voiceData.duration;
      } else {
        // Text comment
        commentData.comment = comment.trim();
        commentData.type = 'text';
      }
      
      await addDoc(collection(db, "posts", id, "comments"), commentData);
      
      if (!voiceData) {
        setComment("");
      }
      toast.success(voiceData ? "Voice message sent!" : "Comment added!");
    } catch (error) {
      toast.error("Error adding comment");
    }
    setLoading(false);
  };

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
      toast.error('Unable to access microphone. Please check your permissions.');
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
        setAudioCurrentTime(audio.currentTime);
        setAudioProgress((audio.currentTime / audio.duration) * 100);
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
        // Call addComment with voice message data
        addComment(null, {
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
    // Don't clear comment text when canceling, user might want to type instead
  };

  // Reply voice recording functions
  const startReplyRecording = async (commentId) => {
    // Clear reply text when starting voice recording
    setReplyText('');
    
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
      toast.error('Unable to access microphone. Please check your permissions.');
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

  const sendReplyVoiceMessage = (commentId) => {
    const audioBlob = replyAudioBlob[commentId];
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        addReplyWithVoice(commentId, {
          type: 'voice',
          audioData: base64Audio,
          duration: (replyRecordingTime[commentId] || 0) + 1
        });
        // Reset reply voice recording state
        setReplyAudioBlob(prev => {
          const newState = { ...prev };
          delete newState[commentId];
          return newState;
        });
        setReplyRecordingTime(prev => {
          const newState = { ...prev };
          delete newState[commentId];
          return newState;
        });
        setReplyText('');
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const cancelReplyVoiceMessage = (commentId) => {
    setReplyAudioBlob(prev => {
      const newState = { ...prev };
      delete newState[commentId];
      return newState;
    });
    setReplyRecordingTime(prev => {
      const newState = { ...prev };
      delete newState[commentId];
      return newState;
    });
  };

  // Add reply with voice message support
  const addReplyWithVoice = async (commentId, voiceData = null) => {
    if (!user) {
      toast.error("Please sign in to reply");
      return;
    }
    
    // Check if it's a voice message or text reply
    if (voiceData) {
      if (!voiceData.audioData) return;
    } else {
      if (!replyText.trim()) return;
    }

    setLoadingReply(true);
    try {
      const replyData = {
        username: user.displayName,
        profileImg: user.photoURL,
        timestamp: serverTimestamp(),
      };
      
      if (voiceData) {
        // Voice message
        replyData.type = 'voice';
        replyData.audioData = voiceData.audioData;
        replyData.duration = voiceData.duration;
      } else {
        // Text reply
        replyData.reply = replyText.trim();
        replyData.type = 'text';
      }
      
      await addDoc(collection(db, "posts", id, "comments", commentId, "replies"), replyData);
      
      if (!voiceData) {
        setReplyText("");
      }
      setReplyingTo(null);
      toast.success(voiceData ? "Voice reply sent!" : "Reply added!");
    } catch (error) {
      toast.error("Error adding reply");
    }
    setLoadingReply(false);
  };

  // Reply functionality
  const addReply = async (commentId) => {
    if (!user) {
      toast.error("Please sign in to reply");
      return;
    }
    if (!replyText.trim()) return;

    setLoadingReply(true);
    try {
      await addDoc(collection(db, "posts", id, "comments", commentId, "replies"), {
        reply: replyText.trim(),
        username: user.displayName,
        profileImg: user.photoURL,
        timestamp: serverTimestamp(),
      });
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply added!");
    } catch (error) {
      toast.error("Error adding reply");
    }
    setLoadingReply(false);
  };

  const handleReplyClick = (commentId, username) => {
    setReplyingTo(commentId);
    setParentUsername(username);
    setReplyText(`@${username} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
    setParentUsername("");
  };

  // Like comment functionality
  const likeComment = async (commentId) => {
    if (!user) {
      toast.error("Please sign in to like comments");
      return;
    }
    
    try {
      const commentLikeRef = doc(db, "posts", id, "comments", commentId, "likes", user.uid);
      
      if (userCommentLikes[commentId]) {
        await deleteDoc(commentLikeRef);
      } else {
        await setDoc(commentLikeRef, {
          username: user.displayName,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      toast.error("Error updating comment like");
    }
  };

  // Like reply functionality
  const likeReply = async (commentId, replyId) => {
    if (!user) {
      toast.error("Please sign in to like replies");
      return;
    }
    
    try {
      const replyLikeRef = doc(db, "posts", id, "comments", commentId, "replies", replyId, "likes", user.uid);
      const replyKey = `${commentId}_${replyId}`;
      
      if (userReplyLikes[replyKey]) {
        await deleteDoc(replyLikeRef);
      } else {
        await setDoc(replyLikeRef, {
          username: user.displayName,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      toast.error("Error updating reply like");
    }
  };

  // Delete comment functionality
  const deleteComment = async (commentId) => {
    if (!user) {
      toast.error("Please sign in to delete comments");
      return;
    }
    
    try {
      await deleteDoc(doc(db, "posts", id, "comments", commentId));
      toast.success("Comment deleted!");
      setShowCommentMenu(null);
    } catch (error) {
      toast.error("Error deleting comment");
    }
  };

  // Delete reply functionality
  const deleteReply = async (commentId, replyId) => {
    if (!user) {
      toast.error("Please sign in to delete replies");
      return;
    }
    
    try {
      await deleteDoc(doc(db, "posts", id, "comments", commentId, "replies", replyId));
      toast.success("Reply deleted!");
      setShowReplyMenu(null);
    } catch (error) {
      toast.error("Error deleting reply");
    }
  };

  // Copy comment functionality
  const copyComment = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Comment copied to clipboard!");
      setShowCommentMenu(null);
    }).catch(() => {
      toast.error("Failed to copy comment");
    });
  };

  // Copy reply functionality
  const copyReply = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Reply copied to clipboard!");
      setShowReplyMenu(null);
    }).catch(() => {
      toast.error("Failed to copy reply");
    });
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

  // Hide counters under threshold for viewers (owners always see)
  const COUNTER_VISIBILITY_THRESHOLD = 5;
  const isOwner = user && user.uid === userId;
  const shouldShowCounter = (count) => isOwner || (typeof count === 'number' && count >= COUNTER_VISIBILITY_THRESHOLD);

  // Video seeking functions
  const handleProgressBarClick = (e) => {
    if (!videoRef.current || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  };

  const handleProgressBarMouseDown = (e) => {
    setIsDragging(true);
    handleProgressBarClick(e);
  };

  const handleProgressBarMouseMove = (e) => {
    if (!isDragging || !videoRef.current || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min((clickX / rect.width) * duration, duration));
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  };

  const handleProgressBarMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleProgressBarTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const newTime = (touchX / rect.width) * duration;
    
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress((newTime / duration) * 100);
    }
  };

  const handleProgressBarTouchMove = (e) => {
    if (!isDragging || !videoRef.current || duration === 0) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const newTime = Math.max(0, Math.min((touchX / rect.width) * duration, duration));
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  };

  const handleProgressBarTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar && videoRef.current && duration > 0) {
          const rect = progressBar.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const newTime = Math.max(0, Math.min((mouseX / rect.width) * duration, duration));
          
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
          setProgress((newTime / duration) * 100);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalMouseMove);
      document.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalMouseMove);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, duration]);

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: `${username}&apos;s post`,
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
      transition={{ duration: 0.3 }}
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
          src={rewriteToCDN(video)}
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
              transition={{ duration: 0.15 }}
              onClick={handleVideoClick}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <div className="bg-white/90 rounded-full p-4 shadow-lg">
                <PlayIcon className="w-8 h-8 text-neutral-800 ml-1" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>


      </motion.div>

      {/* Overlaid Post Details - TikTok Style */}
      {/* Right Side Action Buttons - Positioned above navigation bar */}
      <div className="absolute right-4 bottom-16 flex flex-col items-center space-y-4">
        {/* Mobile: Profile Image with Overlapping Follow Button */}
        <div className="block sm:hidden flex flex-col items-center mb-4">
          <div className="relative">
            <img
              src={rewriteToCDN(profileImage) || "/default-avatar.png"}
              alt={username}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
            />
            {user && user.uid !== userId && !isFollowing && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-6 h-6 rounded-full bg-white border border-white shadow-md flex items-center justify-center"
                aria-label="Follow"
                title="Follow"
              >
                <PlusIcon className="w-4 h-4 text-primary-600" />
              </button>
            )}
          </div>
        </div>
        {/* Like Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={likePost}
          className="flex flex-col items-center space-y-1"
        >
          {hasLiked ? (
              <HeartSolid className="w-7 h-7 text-red-500" />
            ) : (
              <HeartSolid className="w-7 h-7 text-white" />
            )}
          <span className={`text-xs font-medium text-white h-4 leading-4 ${shouldShowCounter(likes.length) ? "opacity-100" : "opacity-0"}`}>
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
          <ChatBubbleOvalLeftIcon className="w-7 h-7 text-white" />
          <span className={`text-xs font-medium text-white h-4 leading-4 ${shouldShowCounter(getTotalCommentCount()) ? "opacity-100" : "opacity-0"}`}>
            {formatCount(getTotalCommentCount())}
          </span>
        </motion.button>

        {/* Bookmark Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setBookmarked(!bookmarked)}
          className="flex flex-col items-center space-y-1"
        >
          {bookmarked ? (
            <BookmarkSolid className="w-7 h-7 text-green-500" />
          ) : (
            <BookmarkSolid className="w-7 h-7 text-white" />
          )}
          <span className="h-4 leading-4 text-xs font-medium text-white opacity-0">0</span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={sharePost}
          className="flex flex-col items-center space-y-1"
        >
          <ShareIcon className="w-7 h-7 text-white" />
          <span className={`text-xs font-medium text-white h-4 leading-4 ${shouldShowCounter(shareCount) ? "opacity-100" : "opacity-0"}`}>{formatCount(shareCount)}</span>
        </motion.button>

        {/* Delete Menu - Only show for post owner */}
        {user && user.uid === userId && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDeleteMenu(!showDeleteMenu)}
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
      <div className="absolute bottom-16 left-4 right-20">
        {/* User Info */}
        <motion.div 
          className="flex items-center space-x-3 mb-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={() => router.push(`/user/${userId}`)}
        >
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-white text-lg">
                {username}
              </h3>
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
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-white/80 text-sm">🎵</span>
            <p className="text-white/80 text-sm">
              {songName}
            </p>
          </div>
        )}

        {/* Video Controls - Inline with content */}
        <AnimatePresence>
          {duration > 0 && !playing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-black/50 rounded-2xl p-3 mb-2"
            >
              {/* Progress Bar */}
              <div className="mb-3">
                <div 
                  className="progress-bar w-full bg-white/30 rounded-full h-2 cursor-pointer relative group"
                  onClick={handleProgressBarClick}
                  onMouseDown={handleProgressBarMouseDown}
                  onTouchStart={handleProgressBarTouchStart}
                  onTouchMove={handleProgressBarTouchMove}
                  onTouchEnd={handleProgressBarTouchEnd}
                >
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-100 relative"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Seek handle - visible on hover/drag */}
                    <div 
                      className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-opacity duration-200 ${
                        isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      style={{ right: '-8px' }}
                    />
                  </div>
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
              transition={{ duration: 0.15, type: "spring", damping: 35, stiffness: 200 }}
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
                <span className="text-white text-sm font-medium">{getTotalCommentCount()}</span>
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
                          src={rewriteToCDN(commentData.profileImg || commentData.userImage) || "/default-avatar.png"}
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
                            {commentData.type === 'voice' ? (
                              <div className="flex items-center space-x-3 py-2">
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => playAudio(commentData.audioData, commentDoc.id)}
                                  className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
                                >
                                  {playingAudio === commentDoc.id ? (
                                    <PauseIcon className="w-4 h-4" />
                                  ) : (
                                    <PlayIcon className="w-4 h-4 ml-0.5" />
                                  )}
                                </motion.button>
                                <div className="flex-1">
                                  <div 
                                    className="bg-white/20 rounded-full h-2 overflow-hidden cursor-pointer"
                                    onClick={(e) => {
                                      if (audioRef.current && playingAudio === commentDoc.id) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const newTime = (clickX / rect.width) * audioRef.current.duration;
                                        audioRef.current.currentTime = newTime;
                                      }
                                    }}
                                  >
                                    <div 
                                      className="bg-blue-400 h-full rounded-full transition-all duration-100" 
                                      style={{ width: playingAudio === commentDoc.id ? `${audioProgress}%` : '0%' }}
                                    ></div>
                                  </div>
                                </div>
                                <span className="text-xs text-white/70">
                                  {playingAudio === commentDoc.id && audioDuration > 0 && isFinite(audioDuration) && isFinite(audioCurrentTime) && !isNaN(audioDuration) && !isNaN(audioCurrentTime)
                                    ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s`
                                    : `${commentData.duration || 0}s`
                                  }
                                </span>
                              </div>
                            ) : (
                              <p className="text-white/90 text-sm leading-relaxed break-words">
                                {commentData.comment}
                              </p>
                            )}
                          </div>
                          
                          {/* Mobile Comment Actions */}
                          <div className="flex items-center space-x-4 mt-2 ml-4">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => likeComment(commentDoc.id)}
                              className={`flex items-center space-x-1 text-xs transition-colors touch-manipulation ${
                                userCommentLikes[commentDoc.id] 
                                  ? 'text-red-400' 
                                  : 'text-white/60 hover:text-red-400'
                              }`}
                            >
                              <svg 
                                className="w-4 h-4" 
                                fill={userCommentLikes[commentDoc.id] ? "currentColor" : "none"} 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>
                                {commentLikes[commentDoc.id]?.length > 0 
                                  ? commentLikes[commentDoc.id].length 
                                  : 'Like'
                                }
                              </span>
                            </motion.button>
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReplyClick(commentDoc.id, commentData.username)}
                              className="text-xs text-white/60 hover:text-blue-400 transition-colors touch-manipulation"
                            >
                              Reply
                            </motion.button>
                            
                            <div className="relative">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                                data-menu-trigger="comment"
                                onClick={() => setShowCommentMenu(showCommentMenu === commentDoc.id ? null : commentDoc.id)}
                                onTouchStart={(e) => {
                                  const timer = setTimeout(() => {
                                    setShowCommentMenu(commentDoc.id);
                                  }, 500);
                                  e.target.timer = timer;
                                }}
                                onTouchEnd={(e) => {
                                  if (e.target.timer) {
                                    clearTimeout(e.target.timer);
                                  }
                                }}
                              >
                                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </motion.button>
                              
o looks like we hab                              {showCommentMenu === commentDoc.id && (
                                     <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-[70] min-w-[110px]" data-menu="comment-menu">
                                      {commentData.type !== 'voice' && (
                                        <button
                                          onClick={() => copyComment(commentData.comment)}
                                          className="w-full px-3 py-1.5 text-left text-white text-xs hover:bg-gray-700 transition-colors"
                                        >
                                          Copy
                                        </button>
                                      )}
                                      {user && user.displayName === commentData.username && (
                                        <button
                                          onClick={() => deleteComment(commentDoc.id)}
                                          className="w-full px-3 py-1.5 text-left text-red-400 text-xs hover:bg-gray-700 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  )}
                            </div>
                          </div>
                          
                          {/* Replies Section */}
                          {replies[commentDoc.id] && replies[commentDoc.id].length > 0 && (
                            <div className="mt-3 ml-4 space-y-3">
                              {replies[commentDoc.id].map((replyDoc, replyIndex) => {
                                const replyData = replyDoc.data();
                                return (
                                  <motion.div
                                    key={replyDoc.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: replyIndex * 0.05 }}
                                    className="flex items-start space-x-2"
                                  >
                                    <img
                                      src={rewriteToCDN(replyData.profileImg) || "/default-avatar.png"}
                                      alt={replyData.username}
                                      className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="font-medium text-xs text-white truncate">
                                            {replyData.username}
                                          </p>
                                          <p className="text-xs text-white/50 ml-2 flex-shrink-0">
                                            {moment(replyData.timestamp?.toDate()).fromNow()}
                                          </p>
                                        </div>
                                        {/* Audio Reply */}
                                        {replyData.audioData ? (
                                          <div className="flex items-center space-x-2">
                                            <motion.button
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() => playAudio(replyData.audioData, `reply-${replyDoc.id}`)}
                                              className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors flex-shrink-0"
                                            >
                                              {playingAudio === `reply-${replyDoc.id}` ? (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                                                </svg>
                                              ) : (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M8 5v14l11-7z" />
                                                </svg>
                                              )}
                                            </motion.button>
                                            <div className="flex-1 min-w-0">
                                              <div 
                                                className="w-full h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                                                onClick={(e) => {
                                                  if (audioRef.current && playingAudio === `reply-${replyDoc.id}`) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const clickX = e.clientX - rect.left;
                                                    const percentage = clickX / rect.width;
                                                    const newTime = percentage * audioDuration;
                                                    audioRef.current.currentTime = newTime;
                                                  }
                                                }}
                                              >
                                                <div 
                                                  className="bg-blue-400 h-full rounded-full transition-all duration-100" 
                                                  style={{ width: playingAudio === `reply-${replyDoc.id}` ? `${audioProgress}%` : '0%' }}
                                                ></div>
                                              </div>
                                            </div>
                                            <span className="text-xs text-white/70 flex-shrink-0">
                                              {playingAudio === `reply-${replyDoc.id}` && audioDuration > 0 && isFinite(audioDuration) && isFinite(audioCurrentTime) && !isNaN(audioDuration) && !isNaN(audioCurrentTime)
                                                ? `${Math.floor(audioCurrentTime)}s / ${Math.floor(audioDuration)}s`
                                                : `${replyData.duration || 0}s`
                                              }
                                            </span>
                                          </div>
                                        ) : (
                                          <p className="text-white/80 text-xs leading-relaxed break-words">
                                            {replyData.reply}
                                          </p>
                                        )}
                                      </div>
                                      {/* Reply Actions */}
                                      <div className="flex items-center justify-between mt-2 px-1">
                                        <div className="flex items-center space-x-3">
                                          <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => likeReply(commentDoc.id, replyDoc.id)}
                                            className="flex items-center space-x-1 text-white/60 hover:text-red-400 transition-colors"
                                          >
                                            <svg 
                                              className="w-3 h-3" 
                                              fill={userReplyLikes[`${commentDoc.id}_${replyDoc.id}`] ? "currentColor" : "none"} 
                                              stroke="currentColor" 
                                              viewBox="0 0 24 24"
                                            >
                                              <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                                              />
                                            </svg>
                                            {replyLikes[`${commentDoc.id}_${replyDoc.id}`]?.length > 0 && (
                                              <span className="text-xs">
                                                {replyLikes[`${commentDoc.id}_${replyDoc.id}`].length}
                                              </span>
                                            )}
                                          </motion.button>
                                          <button 
                                             onClick={() => handleReplyClick(commentDoc.id, replyData.username)}
                                             className="text-xs text-white/60 hover:text-white transition-colors"
                                           >
                                             Reply
                                           </button>
                                        </div>
                                        
                                        <div className="relative">
                                          <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                                            data-menu-trigger="reply"
                                            onClick={() => setShowReplyMenu(showReplyMenu === replyDoc.id ? null : replyDoc.id)}
                                            onTouchStart={(e) => {
                                              const timer = setTimeout(() => {
                                                setShowReplyMenu(replyDoc.id);
                                              }, 500);
                                              e.target.timer = timer;
                                            }}
                                            onTouchEnd={(e) => {
                                              if (e.target.timer) {
                                                clearTimeout(e.target.timer);
                                              }
                                            }}
                                          >
                                            <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                          </motion.button>
                                          
                                          {showReplyMenu === replyDoc.id && (
                                                 <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-[70] min-w-[110px]" data-menu="reply-menu">
                                                  {!replyData.audioData && (
                                                    <button
                                                      onClick={() => copyReply(replyData.reply)}
                                                      className="w-full px-3 py-1.5 text-left text-white text-xs hover:bg-gray-700 transition-colors"
                                                    >
                                                      Copy
                                                    </button>
                                                  )}
                                                  {user && user.displayName === replyData.username && (
                                                    <button
                                                      onClick={() => deleteReply(commentDoc.id, replyDoc.id)}
                                                      className="w-full px-3 py-1.5 text-left text-red-400 text-xs hover:bg-gray-700 transition-colors"
                                                    >
                                                      Delete
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Reply Input */}
                          {replyingTo === commentDoc.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 ml-4"
                            >
                              <div className="flex items-start space-x-2">
                                <img
                                  src={rewriteToCDN(user?.photoURL) || "/default-avatar.png"}
                                  alt={user?.displayName}
                                  className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
                                />
                                <div className="flex-1 flex items-end space-x-2">
                                  {/* Voice Recording Preview */}
                                  {replyAudioBlob[commentDoc.id] && (
                                    <div className="flex-1 flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-red-400 text-sm font-medium">
                                          Voice Reply ({replyRecordingTime[commentDoc.id] || 0}s)
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Recording Indicator */}
                                  {replyRecording[commentDoc.id] && (
                                    <div className="flex-1 flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-red-400 text-sm font-medium">
                                          Recording... {replyRecordingTime[commentDoc.id] || 0}s / 10s
                                        </span>
                                      </div>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => stopReplyRecording(commentDoc.id)}
                                        className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200"
                                      >
                                        <StopIcon className="w-4 h-4" />
                                      </motion.button>
                                    </div>
                                  )}
                                  
                                  {/* Text Input */}
                                  {!replyRecording[commentDoc.id] && !replyAudioBlob[commentDoc.id] && (
                                    <textarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Write a reply..."
                                      rows={1}
                                      className="flex-1 px-3 py-2 bg-transparent border-0 border-b border-gray-600/40 focus:outline-none focus:border-blue-500 transition-all duration-300 text-white placeholder-gray-400 resize-none min-h-[32px] max-h-20 text-sm"
                                      disabled={loadingReply}
                                      onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                                      }}
                                    />
                                  )}
                                  <div className="flex space-x-2">
                                    {/* Voice Recording Buttons */}
                                    {replyAudioBlob[commentDoc.id] ? (
                                      <>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => sendReplyVoiceMessage(commentDoc.id)}
                                          disabled={loadingReply}
                                          className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                          {loadingReply ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                          )}
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => cancelReplyVoiceMessage(commentDoc.id)}
                                          className="flex items-center justify-center w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all duration-200"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </motion.button>
                                      </>
                                    ) : replyText.trim() ? (
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => addReplyWithVoice(commentDoc.id)}
                                        disabled={loadingReply}
                                        className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                                      >
                                        {loadingReply ? (
                                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                          </svg>
                                        )}
                                      </motion.button>
                                    ) : !replyRecording[commentDoc.id] ? (
                                       <motion.button
                                         whileHover={{ scale: 1.05 }}
                                         whileTap={{ scale: 0.95 }}
                                         onClick={() => startReplyRecording(commentDoc.id)}
                                         className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                                       >
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                         </svg>
                                       </motion.button>
                                     ) : null}
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={cancelReply}
                                      className="flex items-center justify-center w-8 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all duration-200"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
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
                      src={rewriteToCDN(user.photoURL)}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-600/50 shadow-lg"
                    />

                  </div>
                  
                  <div className="flex-1 flex items-end space-x-3">
                    {/* Hide text input and emoji when recording or has audio blob */}
                    {!isRecording && !audioBlob && (
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
                        

                      </div>
                    )}
                    
                    {/* Voice Recording Preview - Inline with profile */}
                    {audioBlob && (
                      <div className="flex-1 flex items-center space-x-3 bg-blue-500/20 rounded-xl p-3 border border-blue-500/30">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => playAudio(URL.createObjectURL(audioBlob), 'preview')}
                          className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
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
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={cancelVoiceMessage}
                          className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
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
                    
                    {/* Dynamic Send/Record Button */}
                    {audioBlob ? (
                      <motion.button
                        type="button"
                        onClick={sendVoiceMessage}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="h-[52px] w-[52px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl touch-manipulation flex items-center justify-center border border-blue-500/20"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </motion.button>
                    ) : comment.trim() ? (
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="h-[52px] w-[52px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl touch-manipulation flex items-center justify-center border border-blue-500/20"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </motion.button>
                    ) : isRecording ? (
                      <motion.button
                        type="button"
                        onClick={stopRecording}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="h-[52px] w-[52px] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl touch-manipulation flex items-center justify-center border border-red-500/20"
                      >
                        <StopIcon className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={startRecording}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="h-[52px] w-[52px] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl touch-manipulation flex items-center justify-center border border-green-500/20"
                      >
                        <MicrophoneIcon className="w-5 h-5" />
                      </motion.button>
                    )}
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
