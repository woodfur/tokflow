import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadUserProfile(user.uid);
        await checkFirstTimeUser();
      } else {
        setUserProfile(null);
        setIsFirstTime(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (userId) => {
    setProfileLoading(true);
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        
        // Cache profile data locally
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      } else {
        // Create new user profile if it doesn't exist
        await createUserProfile(userId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Try to load from cache if Firebase fails
      try {
        const cachedProfile = await AsyncStorage.getItem('userProfile');
        if (cachedProfile) {
          setUserProfile(JSON.parse(cachedProfile));
        }
      } catch (cacheError) {
        console.error('Error loading cached profile:', cacheError);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const createUserProfile = async (userId) => {
    try {
      const newProfile = {
        uid: userId,
        email: user?.email || '',
        username: user?.email?.split('@')[0] || `user${Date.now()}`,
        fullName: user?.displayName || '',
        profilePicture: user?.photoURL || '',
        bio: '',
        followers: [],
        following: [],
        posts: [],
        likes: [],
        bookmarks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
        isPrivate: false,
        settings: {
          notifications: {
            likes: true,
            comments: true,
            follows: true,
            mentions: true,
          },
          privacy: {
            profileVisibility: 'public',
            allowMessages: 'everyone',
            allowComments: 'everyone',
          },
        },
      };

      await setDoc(doc(firestore, 'users', userId), newProfile);
      setUserProfile(newProfile);
      setIsFirstTime(true);
      
      // Cache the new profile
      await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) throw new Error('No authenticated user');

    setProfileLoading(true);
    try {
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(doc(firestore, 'users', user.uid), updatedProfile);
      setUserProfile(updatedProfile);
      
      // Update cache
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  const followUser = async (targetUserId) => {
    if (!user || !userProfile) throw new Error('No authenticated user');
    if (targetUserId === user.uid) throw new Error('Cannot follow yourself');

    try {
      // Update current user's following list
      const updatedFollowing = [...(userProfile.following || []), targetUserId];
      await updateDoc(doc(firestore, 'users', user.uid), {
        following: updatedFollowing,
        updatedAt: new Date(),
      });

      // Update target user's followers list
      const targetUserDoc = await getDoc(doc(firestore, 'users', targetUserId));
      if (targetUserDoc.exists()) {
        const targetUserData = targetUserDoc.data();
        const updatedFollowers = [...(targetUserData.followers || []), user.uid];
        await updateDoc(doc(firestore, 'users', targetUserId), {
          followers: updatedFollowers,
          updatedAt: new Date(),
        });
      }

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        following: updatedFollowing,
      }));

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  };

  const unfollowUser = async (targetUserId) => {
    if (!user || !userProfile) throw new Error('No authenticated user');

    try {
      // Update current user's following list
      const updatedFollowing = (userProfile.following || []).filter(
        id => id !== targetUserId
      );
      await updateDoc(doc(firestore, 'users', user.uid), {
        following: updatedFollowing,
        updatedAt: new Date(),
      });

      // Update target user's followers list
      const targetUserDoc = await getDoc(doc(firestore, 'users', targetUserId));
      if (targetUserDoc.exists()) {
        const targetUserData = targetUserDoc.data();
        const updatedFollowers = (targetUserData.followers || []).filter(
          id => id !== user.uid
        );
        await updateDoc(doc(firestore, 'users', targetUserId), {
          followers: updatedFollowers,
          updatedAt: new Date(),
        });
      }

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        following: updatedFollowing,
      }));

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  };

  const isFollowing = (targetUserId) => {
    if (!userProfile) return false;
    return (userProfile.following || []).includes(targetUserId);
  };

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setIsFirstTime(true);
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setIsFirstTime(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const clearUserData = async () => {
    try {
      await AsyncStorage.multiRemove(['userProfile', 'hasSeenOnboarding']);
      setUserProfile(null);
      setIsFirstTime(false);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading: loading || profileLoading,
    error,
    isFirstTime,
    updateUserProfile,
    followUser,
    unfollowUser,
    isFollowing,
    completeOnboarding,
    clearUserData,
    refreshProfile: () => user && loadUserProfile(user.uid),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};