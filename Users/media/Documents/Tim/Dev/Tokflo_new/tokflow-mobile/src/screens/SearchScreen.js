import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { Video } from 'expo-av';

const { width } = Dimensions.get('window');
const numColumns = 3;
const itemSize = (width - 32 - 16) / numColumns; // Account for padding and gaps

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('videos'); // videos, users, hashtags

  const mockTrendingHashtags = [
    '#fyp',
    '#viral',
    '#dance',
    '#comedy',
    '#music',
    '#food',
    '#fashion',
    '#travel',
    '#fitness',
    '#art',
  ];

  const mockRecentSearches = [
    'funny videos',
    'dance challenge',
    'cooking tips',
    'workout routine',
  ];

  useEffect(() => {
    setTrendingHashtags(mockTrendingHashtags);
    setRecentSearches(mockRecentSearches);
  }, []);

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      let searchQuery;
      
      if (activeTab === 'videos') {
        searchQuery = query(
          collection(firestore, 'posts'),
          where('caption', '>=', query),
          where('caption', '<=', query + '\uf8ff'),
          orderBy('caption'),
          limit(20)
        );
      } else if (activeTab === 'users') {
        searchQuery = query(
          collection(firestore, 'users'),
          where('username', '>=', query),
          where('username', '<=', query + '\uf8ff'),
          orderBy('username'),
          limit(20)
        );
      }

      const snapshot = await getDocs(searchQuery);
      setSearchResults(snapshot.docs);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagPress = (hashtag) => {
    setSearchQuery(hashtag);
    handleSearch(hashtag);
  };

  const renderVideoResult = ({ item }) => {
    const post = item.data();
    
    return (
      <TouchableOpacity
        style={styles.videoItem}
        onPress={() => navigation.navigate('VideoDetail', { postId: item.id })}
      >
        <Video
          source={{ uri: post.videoUrl }}
          style={styles.videoThumbnail}
          shouldPlay={false}
          isLooping={false}
          isMuted={true}
          resizeMode="cover"
        />
        <View style={styles.videoOverlay}>
          <View style={styles.videoStats}>
            <Ionicons name="heart" size={16} color="#ffffff" />
            <Text style={styles.videoStatsText}>{post.likes || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserResult = ({ item }) => {
    const user = item.data();
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <Image
          source={{ uri: user.profilePicture || 'https://via.placeholder.com/50' }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.userFullName}>{user.fullName}</Text>
          <Text style={styles.userFollowers}>
            {user.followers?.length || 0} followers
          </Text>
        </View>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHashtag = ({ item }) => (
    <TouchableOpacity
      style={styles.hashtagItem}
      onPress={() => handleHashtagPress(item)}
    >
      <Text style={styles.hashtagText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => {
        setSearchQuery(item);
        handleSearch(item);
      }}
    >
      <Ionicons name="time-outline" size={20} color="#6b7280" />
      <Text style={styles.recentSearchText}>{item}</Text>
      <TouchableOpacity style={styles.removeSearchButton}>
        <Ionicons name="close" size={16} color="#6b7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTabButton = (tab, title) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive,
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tab && styles.tabButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos, users, hashtags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchQuery.length > 0 && searchResults.length > 0 ? (
        <View style={styles.content}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            {renderTabButton('videos', 'Videos')}
            {renderTabButton('users', 'Users')}
            {renderTabButton('hashtags', 'Hashtags')}
          </View>

          {/* Results */}
          <FlatList
            data={searchResults}
            renderItem={activeTab === 'videos' ? renderVideoResult : renderUserResult}
            keyExtractor={(item) => item.id}
            numColumns={activeTab === 'videos' ? numColumns : 1}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        </View>
      ) : (
        /* Discovery Content */
        <View style={styles.content}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearch}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Trending Hashtags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Hashtags</Text>
            <FlatList
              data={trendingHashtags}
              renderItem={renderHashtag}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.hashtagsList}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  tabButtonActive: {
    backgroundColor: '#6366f1',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  resultsList: {
    padding: 16,
  },
  videoItem: {
    width: itemSize,
    height: itemSize * 1.5,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoStatsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userFullName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  userFollowers: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clearAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  removeSearchButton: {
    padding: 4,
  },
  hashtagsList: {
    paddingHorizontal: 16,
  },
  hashtagItem: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    width: '48%',
  },
  hashtagText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6366f1',
    textAlign: 'center',
  },
});