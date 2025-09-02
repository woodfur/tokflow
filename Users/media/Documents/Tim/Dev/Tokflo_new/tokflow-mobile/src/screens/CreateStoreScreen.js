import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { auth, firestore, storage } from '../firebase/firebase';

const storeCategories = [
  'General Store',
  'Electronics',
  'Fashion & Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Health & Beauty',
  'Books & Media',
  'Toys & Games',
  'Automotive',
  'Food & Beverages',
  'Art & Crafts',
  'Jewelry & Accessories',
  'Pet Supplies',
  'Office Supplies',
  'Other',
];

export default function CreateStoreScreen({ navigation }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [store, setStore] = useState({
    name: '',
    description: '',
    category: storeCategories[0],
    logo: null,
    banner: null,
    address: '',
    phone: '',
    email: '',
    website: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: '',
    },
    policies: {
      shipping: '',
      returns: '',
      privacy: '',
    },
  });
  
  const [logoImage, setLogoImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);

  useEffect(() => {
    checkExistingStore();
  }, [user]);

  const checkExistingStore = async () => {
    if (!user) return;
    
    try {
      const storeDoc = await getDoc(doc(firestore, 'stores', user.uid));
      if (storeDoc.exists()) {
        const storeData = storeDoc.data();
        setStore(storeData);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error checking existing store:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'logo') {
        setLogoImage(result.assets[0]);
      } else {
        setBannerImage(result.assets[0]);
      }
    }
  };

  const uploadImage = async (image, path) => {
    if (!image) return null;
    
    const response = await fetch(image.uri);
    const blob = await response.blob();
    const filename = `${path}/${user.uid}_${Date.now()}`;
    const imageRef = ref(storage, filename);
    
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleSave = async () => {
    if (!store.name.trim() || !store.description.trim()) {
      Alert.alert('Validation Error', 'Please fill in store name and description');
      return;
    }

    setSaving(true);
    try {
      let logoUrl = store.logo;
      let bannerUrl = store.banner;
      
      // Upload new logo if selected
      if (logoImage) {
        logoUrl = await uploadImage(logoImage, 'store_logos');
      }
      
      // Upload new banner if selected
      if (bannerImage) {
        bannerUrl = await uploadImage(bannerImage, 'store_banners');
      }
      
      const storeData = {
        ...store,
        logo: logoUrl,
        banner: bannerUrl,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: isEditing ? store.createdAt : new Date(),
        updatedAt: new Date(),
        isActive: true,
        rating: store.rating || 0,
        totalSales: store.totalSales || 0,
        totalProducts: store.totalProducts || 0,
      };
      
      if (isEditing) {
        await updateDoc(doc(firestore, 'stores', user.uid), storeData);
        Alert.alert('Success', 'Store updated successfully!');
      } else {
        await setDoc(doc(firestore, 'stores', user.uid), storeData);
        Alert.alert('Success', 'Store created successfully!');
      }
      
      navigation.navigate('Store');
    } catch (error) {
      console.error('Error saving store:', error);
      Alert.alert('Error', 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Store' : 'Create Store'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Branding</Text>
          
          {/* Banner */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Store Banner</Text>
            <TouchableOpacity
              style={styles.bannerContainer}
              onPress={() => pickImage('banner')}
            >
              {bannerImage || store.banner ? (
                <Image
                  source={{ uri: bannerImage?.uri || store.banner }}
                  style={styles.bannerImage}
                />
              ) : (
                <View style={styles.placeholderBanner}>
                  <Ionicons name="image-outline" size={48} color="#6b7280" />
                  <Text style={styles.placeholderText}>Add Store Banner</Text>
                  <Text style={styles.placeholderSubtext}>Recommended: 1600x900px</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Logo */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Store Logo</Text>
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={() => pickImage('logo')}
            >
              {logoImage || store.logo ? (
                <Image
                  source={{ uri: logoImage?.uri || store.logo }}
                  style={styles.logoImage}
                />
              ) : (
                <View style={styles.placeholderLogo}>
                  <Ionicons name="camera-outline" size={32} color="#6b7280" />
                  <Text style={styles.placeholderText}>Add Logo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={styles.input}
              value={store.name}
              onChangeText={(text) => setStore({ ...store, name: text })}
              placeholder="Enter your store name"
              maxLength={50}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={store.description}
              onChangeText={(text) => setStore({ ...store, description: text })}
              placeholder="Describe your store and what you sell"
              multiline
              numberOfLines={4}
              maxLength={300}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerText}>{store.category}</Text>
              {/* Note: In a real app, you'd use a proper picker component */}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={store.address}
              onChangeText={(text) => setStore({ ...store, address: text })}
              placeholder="Store address (optional)"
              maxLength={200}
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={store.phone}
                onChangeText={(text) => setStore({ ...store, phone: text })}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={store.email}
                onChangeText={(text) => setStore({ ...store, email: text })}
                placeholder="Contact email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={store.website}
              onChangeText={(text) => setStore({ ...store, website: text })}
              placeholder="https://yourstore.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instagram</Text>
            <TextInput
              style={styles.input}
              value={store.socialMedia.instagram}
              onChangeText={(text) => setStore({
                ...store,
                socialMedia: { ...store.socialMedia, instagram: text }
              })}
              placeholder="@username"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Facebook</Text>
            <TextInput
              style={styles.input}
              value={store.socialMedia.facebook}
              onChangeText={(text) => setStore({
                ...store,
                socialMedia: { ...store.socialMedia, facebook: text }
              })}
              placeholder="Facebook page URL"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Twitter</Text>
            <TextInput
              style={styles.input}
              value={store.socialMedia.twitter}
              onChangeText={(text) => setStore({
                ...store,
                socialMedia: { ...store.socialMedia, twitter: text }
              })}
              placeholder="@username"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Store' : 'Create Store'}
              </Text>
            )}
          </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
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
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  bannerContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    alignSelf: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});