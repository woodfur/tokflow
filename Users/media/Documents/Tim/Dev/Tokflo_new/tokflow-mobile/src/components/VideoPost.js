import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Image,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/firebase';
import moment from 'moment';
import Toast from 'react-native-toast-message';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoPost({ post, isActive, onPress }) {
  const [user] = useAuthState(auth);
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [muted, setMuted] = useState(false);
  
  const likeAnimation = useRef(new Animated.Value(1)).current;
  const heartAnimation = useRef(new Animated.Value(0)).current;

  const postData = post.data();
  const {
    caption,
    company,
    video,
    profileImage,
    topic,
    timestamp,
    username,
    userId,
    songName,
  } = postData;

  // Load likes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'posts', post.id, 'likes'),
      (snapshot) => {
        setLikes(snapshot.docs);
        setHasLiked(
          snapshot.docs.findIndex((like) => like.id === user?.uid) !== -1
        );
      }
    );
    return unsubscribe;
  }, [post.id, user?.uid]);

  // Load comments
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'posts', post.id, 'comments'),
      (snapshot) => {
        setComments(snapshot.docs);
      }
    );
    return unsubscribe;
  }, [post.id]);

  // Video playback control
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.playAsync();
    } else if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isActive]);

  const handleLike = async () => {
    if (!user) return;

    const likeRef = doc(firestore, 'posts', post.id, 'likes', user.uid);

    if (hasLiked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, {
        username: user.displayName || user.email,
        timestamp: serverTimestamp(),
      });
      
      // Animate like
      Animated.sequence([
        Animated.timing(likeAnimation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Show heart animation
      Animated.sequence([
        Animated.timing(heartAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    const bookmarkRef = doc(firestore, 'users', user.uid, 'bookmarks', post.id);

    if (bookmarked) {
      await deleteDoc(bookmarkRef);
      setBookmarked(false);
      Toast.show({
        type: 'info',
        text1: 'Removed from bookmarks',
      });
    } else {
      await setDoc(bookmarkRef, {
        postId: post.id,
        timestamp: serverTimestamp(),
      });
      setBookmarked(true);
      Toast.show({
        type: 'success',
        text1: 'Added to bookmarks',
      });
    }
  };

  const handleShare = () => {
    // Implement share functionality
    Toast.show({
      type: 'info',
      text1: 'Share functionality coming soon!',
    });
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
    setTimeout(() => setShowControls(false), 3000);
  };

  const handleDoubleTap = () => {
    if (!hasLiked) {
      handleLike();
    }
  };

  return (
    <View style={styles.container}>
      {/* Video */}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        onLongPress={handleDoubleTap}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: video }}
          shouldPlay={isActive}
          isLooping
          isMuted={muted}
          resizeMode="cover"
          onPlaybackStatusUpdate={setStatus}
        />
        
        {/* Heart Animation */}
        <Animated.View
          style={[
            styles.heartAnimation,
            {
              opacity: heartAnimation,
              transform: [
                {
                  scale: heartAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={80} color="#ff3040" />
        </Animated.View>
      </TouchableOpacity>

      {/* Bottom Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Left side - User info and caption */}
        <View style={styles.leftContent}>
          <TouchableOpacity style={styles.userInfo}>
            <Image
              source={{ uri: profileImage || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>@{username}</Text>
              <Text style={styles.timestamp}>
                {moment(timestamp?.toDate()).fromNow()}
              </Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.caption}>{caption}</Text>
          
          {songName && (
            <View style={styles.musicInfo}>
              <Ionicons name="musical-notes" size={16} color="#ffffff" />
              <Text style={styles.musicText}>{songName}</Text>
            </View>
          )}
        </View>

        {/* Right side - Action buttons */}
        <View style={styles.rightContent}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
              <Ionicons
                name={hasLiked ? 'heart' : 'heart-outline'}
                size={32}
                color={hasLiked ? '#ff3040' : '#ffffff'}
              />
            </Animated.View>
            <Text style={styles.actionText}>{likes.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={32} color="#ffffff" />
            <Text style={styles.actionText}>{comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={32}
              color={bookmarked ? '#fbbf24' : '#ffffff'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={32} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setMuted(!muted)}
          >
            <Ionicons
              name={muted ? 'volume-mute' : 'volume-high'}
              size={32}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
  },
  heartAnimation: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  content: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  leftContent: {
    flex: 1,
    paddingRight: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  rightContent: {
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});