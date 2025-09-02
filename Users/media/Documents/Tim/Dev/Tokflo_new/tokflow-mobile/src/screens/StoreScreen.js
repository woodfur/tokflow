import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/firebase';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';

export default function StoreScreen({ navigation }) {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { addToCart, cartItems } = useCart();

  const categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline' },
    { id: 'fashion', name: 'Fashion', icon: 'shirt-outline' },
    { id: 'home', name: 'Home', icon: 'home-outline' },
    { id: 'beauty', name: 'Beauty', icon: 'flower-outline' },
    { id: 'sports', name: 'Sports', icon: 'fitness-outline' },
  ];

  useEffect(() => {
    loadProducts();
    loadStores();
  }, [selectedCategory]);

  const loadProducts = () => {
    let productQuery = query(
      collection(firestore, 'products'),
      orderBy('createdAt', 'desc')
    );

    if (selectedCategory !== 'all') {
      productQuery = query(
        collection(firestore, 'products'),
        where('category', '==', selectedCategory),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      productQuery,
      (snapshot) => {
        setProducts(snapshot.docs);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading products:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  };

  const loadStores = () => {
    const unsubscribe = onSnapshot(
      query(collection(firestore, 'stores'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setStores(snapshot.docs.slice(0, 5)); // Show top 5 stores
      }
    );

    return unsubscribe;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
    loadStores();
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, product.data());
      Toast.show({
        type: 'success',
        text1: 'Added to cart!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add to cart',
      });
    }
  };

  const renderProduct = ({ item }) => {
    const product = item.data();
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <Image
          source={{ uri: product.images?.[0] || 'https://via.placeholder.com/200' }}
          style={styles.productImage}
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.productPrice}>
            ${product.price?.toFixed(2)}
          </Text>
          
          <View style={styles.productActions}>
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                isInCart && styles.addToCartButtonDisabled,
              ]}
              onPress={() => handleAddToCart(item)}
              disabled={isInCart}
            >
              <Ionicons
                name={isInCart ? 'checkmark' : 'add'}
                size={16}
                color="#ffffff"
              />
              <Text style={styles.addToCartText}>
                {isInCart ? 'In Cart' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStore = ({ item }) => {
    const store = item.data();
    
    return (
      <TouchableOpacity style={styles.storeCard}>
        <Image
          source={{ uri: store.logo || 'https://via.placeholder.com/80' }}
          style={styles.storeLogo}
        />
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription} numberOfLines={2}>
            {store.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={selectedCategory === item.id ? '#ffffff' : '#6366f1'}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>TokFlo Store</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="bag" size={24} color="#ffffff" />
              {cartItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Featured Stores */}
        {stores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Stores</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={stores}
              renderItem={renderStore}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storesList}
            />
          </View>
        )}

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateStore')}>
              <Text style={styles.seeAllText}>Sell</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  storesList: {
    paddingHorizontal: 16,
  },
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});