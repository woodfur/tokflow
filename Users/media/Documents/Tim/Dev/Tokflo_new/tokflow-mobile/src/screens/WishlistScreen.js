import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (width - 48) / numColumns;

export default function WishlistScreen({ navigation }) {
  const [user] = useAuthState(auth);
  const {
    wishlistItems,
    removeFromWishlist,
    addToCart,
    clearWishlist,
  } = useCart();
  const [loading, setLoading] = useState(false);

  const handleRemoveFromWishlist = (productId) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromWishlist(productId),
        },
      ]
    );
  };

  const handleClearWishlist = () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearWishlist(),
        },
      ]
    );
  };

  const handleAddToCart = async (product) => {
    setLoading(true);
    try {
      await addToCart(product, 1);
      Alert.alert('Success', 'Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const renderWishlistItem = ({ item }) => {
    return (
      <View style={styles.wishlistItem}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
          <Image
            source={{ uri: item.images?.[0] || 'https://via.placeholder.com/200' }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          
          {/* Discount Badge */}
          {item.originalPrice && item.originalPrice > item.price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFromWishlist(item.id)}
        >
          <Ionicons name="heart" size={20} color="#ef4444" />
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.itemPrice}>${item.price}</Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>${item.originalPrice}</Text>
            )}
          </View>
          
          {/* Rating */}
          {item.rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= item.rating ? "star" : "star-outline"}
                    size={12}
                    color="#fbbf24"
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>({item.reviewCount || 0})</Text>
            </View>
          )}
          
          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
            disabled={loading || item.stock === 0}
          >
            <Ionicons name="bag-add-outline" size={16} color="#ffffff" />
            <Text style={styles.addToCartText}>
              {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyWishlist = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Save items you love to find them easily later
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Store')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Wishlist</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        
        <View style={styles.signInContainer}>
          <Ionicons name="person-outline" size={60} color="#d1d5db" />
          <Text style={styles.signInTitle}>Sign in to view your wishlist</Text>
          <Text style={styles.signInSubtitle}>
            Your saved items will be synced across devices
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
            Wishlist ({wishlistItems.length})
          </Text>
          {wishlistItems.length > 0 && (
            <TouchableOpacity onPress={handleClearWishlist}>
              <Ionicons name="trash-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {wishlistItems.length === 0 ? (
        renderEmptyWishlist()
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          style={styles.wishlistList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.wishlistListContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  wishlistList: {
    flex: 1,
  },
  wishlistListContent: {
    padding: 16,
  },
  wishlistItem: {
    width: itemWidth,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: itemWidth * 0.8,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    borderRadius: 6,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});