import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');
const numColumns = 3;
const itemSize = (width - 32 - 16) / numColumns;

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [user] = useAuthState(auth);
  const { followUser, unfollowUser, isFollowing } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (userId) {
      setIsOwnProfile(user?.uid === userId);
      loadUserProfile();
      loadUserPosts();
    }
  }, [userId, user]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      } else {
        Alert.alert('Error', 'User not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = () => {
    const postsQuery = query(
      collection(firestore, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        setUserPosts(snapshot.docs);
      },
      (error) => {
        console.error('Error loading user posts:', error);
      }
    );

    return unsubscribe;
  };

  const handleFollow = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing(userId)) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    // Navigate to chat screen
    navigation.navigate('Chat', { userId, username: userProfile?.username });
  };

  const renderPost = ({ item }) => {
    const post = item.data();
    
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => navigation.navigate('VideoDetail', { postId: item.id })}
      >
        <Video
          source={{ uri: post.videoUrl }}
          style={styles.postThumbnail}
          shouldPlay={false}
          isLooping={false}
          isMuted={true}
          resizeMode="cover"
        />
        <View style={styles.postOverlay}>
          <View style={styles.postStats}>
            <Ionicons name="heart" size={16} color="#ffffff" />
            <Text style={styles.postStatsText}>{post.likes?.length || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>@{userProfile.username}</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri: userProfile.profilePicture || 'https://via.placeholder.com/100',
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.username}>@{userProfile.username}</Text>
              <Text style={styles.fullName}>{userProfile.fullName}</Text>
              {userProfile.bio && (
                <Text style={styles.bio}>{userProfile.bio}</Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userPosts.reduce((total, post) => total + (post.data().likes?.length || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing(userId) && styles.followingButton,
                ]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing(userId) && styles.followingButtonText,
                  ]}
                >
                  {followLoading
                    ? 'Loading...'
                    : isFollowing(userId)
                    ? 'Following'
                    : 'Follow'
                  }
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.messageButton}
                onPress={handleMessage}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#6366f1" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsContainer}>
          <View style={styles.postsHeader}>
            <Text style={styles.postsTitle}>Posts</Text>
            <Text style={styles.postsCount}>{userPosts.length}</Text>
          </View>
          
          {userPosts.length > 0 ? (
            <FlatList
              data={userPosts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={60} color="#6b7280" />
              <Text style={styles.emptyStateText}>
                {isOwnProfile ? 'No posts yet' : `${userProfile.username} hasn't posted yet`}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {isOwnProfile
                  ? 'Share your first video to get started!'
                  : 'Check back later for new content'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  followingButtonText: {
    color: '#374151',
  },
  messageButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  postsContainer: {
    flex: 1,
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  postsCount: {
    fontSize: 16,
    color: '#6b7280',
  },
  postsList: {
    padding: 8,
  },
  postItem: {
    width: itemSize,
    height: itemSize * 1.5,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});