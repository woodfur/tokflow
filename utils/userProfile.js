import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { COLLECTIONS } from '../firebase/schemas';

/**
 * Creates or updates a user profile in Firestore
 * @param {Object} user - Firebase auth user object
 * @returns {Promise<Object>} User profile data
 */
export const createUserProfile = async (user) => {
  if (!user) {
    throw new Error('User object is required');
  }

  const userRef = doc(firestore, COLLECTIONS.USERS, user.uid);
  
  try {
    // Check if user profile already exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // User profile exists, return existing data
      return { id: userDoc.id, ...userDoc.data() };
    }
    
    // Create new user profile
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      bio: '',
      location: '',
      website: '',
      phoneNumber: user.phoneNumber || '',
      // Social media links
      socialLinks: {
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: ''
      },
      // User preferences
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        theme: 'light'
      },
      // Store-related fields
      hasStore: false,
      storeId: null,
      // Activity tracking
      totalPosts: 0,
      totalLikes: 0,
      totalFollowers: 0,
      totalFollowing: 0,
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };
    
    // Save user profile to Firestore
    await setDoc(userRef, userProfile);
    
    console.log('User profile created successfully:', user.uid);
    return { id: user.uid, ...userProfile };
    
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Updates user profile data
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, updates) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const userRef = doc(firestore, COLLECTIONS.USERS, userId);
  
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    
    await setDoc(userRef, updateData, { merge: true });
    console.log('User profile updated successfully:', userId);
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Gets user profile data
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile data or null if not found
 */
export const getUserProfile = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const userRef = doc(firestore, COLLECTIONS.USERS, userId);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Updates user's last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const updateLastLogin = async (userId) => {
  if (!userId) return;
  
  try {
    await updateUserProfile(userId, {
      lastLoginAt: new Date()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};