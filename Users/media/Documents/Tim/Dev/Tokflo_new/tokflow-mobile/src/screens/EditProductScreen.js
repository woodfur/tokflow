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
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { auth, firestore, storage } from '../firebase/firebase';

const categories = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Health & Beauty',
  'Books',
  'Toys & Games',
  'Automotive',
  'Food & Beverages',
  'Other',
];

export default function EditProductScreen({ route, navigation }) {
  const { productId } = route.params;
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: categories[0],
    stock: '',
    images: [],
    specifications: {},
  });
  
  const [newImages, setNewImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const productDoc = await getDoc(doc(firestore, 'products', productId));
      if (productDoc.exists()) {
        const productData = productDoc.data();
        
        // Check if user owns this product
        if (productData.sellerId !== user?.uid) {
          Alert.alert('Access Denied', 'You can only edit your own products');
          navigation.goBack();
          return;
        }
        
        setProduct({
          ...productData,
          price: productData.price.toString(),
          originalPrice: productData.originalPrice?.toString() || '',
          stock: productData.stock?.toString() || '',
        });
      } else {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets) {
      const totalImages = product.images.length + newImages.length + result.assets.length;
      if (totalImages > 5) {
        Alert.alert('Limit Exceeded', 'You can only have up to 5 images per product');
        return;
      }
      
      setNewImages([...newImages, ...result.assets]);
    }
  };

  const removeExistingImage = (imageUrl) => {
    setProduct({
      ...product,
      images: product.images.filter(img => img !== imageUrl),
    });
    setRemovedImages([...removedImages, imageUrl]);
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const uploadNewImages = async () => {
    const uploadPromises = newImages.map(async (image) => {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      const filename = `products/${user.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const imageRef = ref(storage, filename);
      
      await uploadBytes(imageRef, blob);
      return await getDownloadURL(imageRef);
    });
    
    return await Promise.all(uploadPromises);
  };

  const deleteRemovedImages = async () => {
    const deletePromises = removedImages.map(async (imageUrl) => {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    });
    
    await Promise.all(deletePromises);
  };

  const handleSave = async () => {
    if (!product.name.trim() || !product.description.trim() || !product.price) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(parseFloat(product.price)) || parseFloat(product.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }

    setSaving(true);
    try {
      // Upload new images
      const uploadedImageUrls = await uploadNewImages();
      
      // Delete removed images
      await deleteRemovedImages();
      
      // Prepare updated product data
      const updatedProduct = {
        ...product,
        price: parseFloat(product.price),
        originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
        stock: product.stock ? parseInt(product.stock) : 0,
        images: [...product.images, ...uploadedImageUrls],
        updatedAt: new Date(),
      };
      
      // Update product in Firestore
      await updateDoc(doc(firestore, 'products', productId), updatedProduct);
      
      Alert.alert('Success', 'Product updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // Delete all product images
      const allImages = [...product.images, ...removedImages];
      await Promise.all(
        allImages.map(async (imageUrl) => {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (error) {
            console.error('Error deleting image:', error);
          }
        })
      );
      
      // Delete product document
      await deleteDoc(doc(firestore, 'products', productId));
      
      Alert.alert('Success', 'Product deleted successfully!');
      navigation.navigate('Store');
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading product...</Text>
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
          <Text style={styles.headerTitle}>Edit Product</Text>
          <TouchableOpacity onPress={handleDelete} disabled={deleting}>
            <Ionicons name="trash-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Existing Images */}
            {product.images.map((imageUrl, index) => (
              <View key={`existing-${index}`} style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.productImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeExistingImage(imageUrl)}
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* New Images */}
            {newImages.map((image, index) => (
              <View key={`new-${index}`} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.productImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeNewImage(index)}
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add Image Button */}
            {(product.images.length + newImages.length) < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                <Ionicons name="camera" size={32} color="#6b7280" />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Product Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={product.name}
            onChangeText={(text) => setProduct({ ...product, name: text })}
            placeholder="Enter product name"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={product.description}
            onChangeText={(text) => setProduct({ ...product, description: text })}
            placeholder="Describe your product"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Price */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={product.price}
              onChangeText={(text) => setProduct({ ...product, price: text })}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Original Price</Text>
            <TextInput
              style={styles.input}
              value={product.originalPrice}
              onChangeText={(text) => setProduct({ ...product, originalPrice: text })}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Category and Stock */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerText}>{product.category}</Text>
              {/* Note: In a real app, you'd use a proper picker component */}
            </View>
          </View>
          
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              value={product.stock}
              onChangeText={(text) => setProduct({ ...product, stock: text })}
              placeholder="0"
              keyboardType="number-pad"
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
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  addImageText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 32,
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