// Firebase Store Operations
// Utility functions for store, product, cart, and order operations

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from './firebase';
import { COLLECTIONS } from './schemas';

// ============ STORE OPERATIONS ============

// Create a new store
export const createStore = async (storeData, userId) => {
  try {
    console.log('Creating store with data:', storeData);
    console.log('User ID:', userId);
    
    // Clean the store data - remove file objects that can't be stored in Firestore
    const cleanStoreData = {
      ...storeData,
      ownerId: userId,
      isActive: true,
      rating: 0,
      totalReviews: 0,
      totalProducts: 0,
      totalSales: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Remove file objects that can't be stored in Firestore
    delete cleanStoreData.logoFile;
    delete cleanStoreData.bannerFile;
    
    console.log('Clean store data:', cleanStoreData);
    
    const storeRef = await addDoc(collection(firestore, COLLECTIONS.STORES), cleanStoreData);
    console.log('Store created with ID:', storeRef.id);

    // Update user profile to indicate they have a store
    await updateDoc(doc(firestore, COLLECTIONS.USERS, userId), {
      hasStore: true,
      storeId: storeRef.id,
      updatedAt: serverTimestamp()
    });
    
    console.log('User profile updated successfully');
    return storeRef.id;
  } catch (error) {
    console.error('Error creating store:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    throw error;
  }
};

// Get store by ID
export const getStore = async (storeId) => {
  try {
    const storeDoc = await getDoc(doc(firestore, COLLECTIONS.STORES, storeId));
    if (storeDoc.exists()) {
      return { id: storeDoc.id, ...storeDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting store:', error);
    throw error;
  }
};

// Get user's store
export const getUserStore = async (userId) => {
  try {
    const q = query(
      collection(firestore, COLLECTIONS.STORES),
      where('ownerId', '==', userId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const storeDoc = querySnapshot.docs[0];
      return { id: storeDoc.id, ...storeDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user store:', error);
    throw error;
  }
};

// Update store
export const updateStore = async (storeId, updateData) => {
  try {
    await updateDoc(doc(firestore, COLLECTIONS.STORES, storeId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
};

// Get all active stores
export const getActiveStores = async (limitCount = 20) => {
  try {
    // Use a simpler query to avoid composite index requirement
    const q = query(
      collection(firestore, COLLECTIONS.STORES),
      where('isActive', '==', true),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const stores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by createdAt in JavaScript instead of Firestore
    return stores.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return bDate - aDate; // Descending order (newest first)
    });
  } catch (error) {
    console.error('Error getting active stores:', error);
    throw error;
  }
};

// ============ PRODUCT OPERATIONS ============

// Create a new product
export const createProduct = async (productData, storeId, userId) => {
  try {
    console.log('Creating product with data:', productData);
    console.log('Store ID:', storeId);
    console.log('User ID:', userId);
    
    // Clean the product data by removing file objects that can't be serialized
    const cleanProductData = { ...productData };
    delete cleanProductData.imageFiles; // Remove file objects
    
    console.log('Clean product data:', cleanProductData);
    
    const productRef = await addDoc(collection(firestore, COLLECTIONS.PRODUCTS), {
      ...cleanProductData,
      storeId,
      ownerId: userId,
      isActive: true,
      isFeatured: false,
      rating: 0,
      totalReviews: 0,
      totalSales: 0,
      views: 0,
      likes: 0,
      isInStock: productData.stock > 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update store's total products count
    await updateDoc(doc(firestore, COLLECTIONS.STORES, storeId), {
      totalProducts: increment(1),
      updatedAt: serverTimestamp()
    });

    console.log('Product created successfully with ID:', productRef.id);
    return productRef.id;
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error object:', error);
    throw error;
  }
};

// Get product by ID
export const getProduct = async (productId) => {
  try {
    const productDoc = await getDoc(doc(firestore, COLLECTIONS.PRODUCTS, productId));
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Get products by store
export const getStoreProducts = async (storeId, limitCount = 20) => {
  try {
    console.log('Getting products for store ID:', storeId);
    
    // First try without orderBy to check if it's an index issue
    const q = query(
      collection(firestore, COLLECTIONS.PRODUCTS),
      where('storeId', '==', storeId),
      where('isActive', '==', true),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Found products:', products.length, products);
    
    // Sort manually by createdAt if products exist
    if (products.length > 0) {
      products.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    }
    
    return products;
  } catch (error) {
    console.error('Error getting store products:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Get all active products
export const getActiveProducts = async (limitCount = 20, category = null) => {
  try {
    console.log('Getting active products, category:', category, 'limit:', limitCount);
    
    let q;
    if (category) {
      q = query(
        collection(firestore, COLLECTIONS.PRODUCTS),
        where('isActive', '==', true),
        where('category', '==', category),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(firestore, COLLECTIONS.PRODUCTS),
        where('isActive', '==', true),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Found active products:', products.length, products);
    
    // Sort manually by createdAt if products exist
    if (products.length > 0) {
      products.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    }
    
    return products;
  } catch (error) {
    console.error('Error getting active products:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Search products
export const searchProducts = async (searchTerm, category = null, limitCount = 20) => {
  try {
    console.log('Searching products, term:', searchTerm, 'category:', category, 'limit:', limitCount);
    
    // Note: This is a basic search. For production, consider using Algolia or similar
    let q;
    if (category) {
      q = query(
        collection(firestore, COLLECTIONS.PRODUCTS),
        where('isActive', '==', true),
        where('category', '==', category),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(firestore, COLLECTIONS.PRODUCTS),
        where('isActive', '==', true),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    let products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Found products before filtering:', products.length, products);
    
    // Client-side filtering for search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
      console.log('Found products after filtering:', products.length, products);
    }
    
    // Sort manually by createdAt if products exist
    if (products.length > 0) {
      products.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    }
    
    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Update product
export const updateProduct = async (productId, updateData) => {
  try {
    await updateDoc(doc(firestore, COLLECTIONS.PRODUCTS, productId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Update product stock
export const updateProductStock = async (productId, newStock) => {
  try {
    await updateDoc(doc(firestore, COLLECTIONS.PRODUCTS, productId), {
      stock: newStock,
      isInStock: newStock > 0,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

// Increment product views
export const incrementProductViews = async (productId) => {
  try {
    await updateDoc(doc(firestore, COLLECTIONS.PRODUCTS, productId), {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing product views:', error);
    throw error;
  }
};

// ============ CART OPERATIONS ============

// Get user's cart
export const getUserCart = async (userId) => {
  try {
    const cartDoc = await getDoc(doc(firestore, COLLECTIONS.CARTS, userId));
    if (cartDoc.exists()) {
      return { id: cartDoc.id, ...cartDoc.data() };
    }
    // Return empty cart if doesn't exist
    return {
      id: userId,
      userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      currency: 'USD'
    };
  } catch (error) {
    console.error('Error getting user cart:', error);
    throw error;
  }
};

// Add item to cart
export const addToCart = async (userId, productId, quantity = 1) => {
  try {
    const product = await getProduct(productId);
    if (!product || !product.isInStock || product.stock < quantity) {
      throw new Error('Product not available or insufficient stock');
    }

    const cart = await getUserCart(userId);
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...cart.items];
      updatedItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      const newItem = {
        productId,
        storeId: product.storeId,
        name: product.name,
        price: product.price,
        quantity,
        thumbnail: product.thumbnail,
        addedAt: serverTimestamp()
      };
      updatedItems = [...cart.items, newItem];
    }

    const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await setDoc(doc(firestore, COLLECTIONS.CARTS, userId), {
      userId,
      items: updatedItems,
      totalItems,
      totalAmount,
      currency: 'USD',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (userId, productId) => {
  try {
    const cart = await getUserCart(userId);
    const updatedItems = cart.items.filter(item => item.productId !== productId);
    
    const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await setDoc(doc(firestore, COLLECTIONS.CARTS, userId), {
      userId,
      items: updatedItems,
      totalItems,
      totalAmount,
      currency: 'USD',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (userId, productId, newQuantity) => {
  try {
    if (newQuantity <= 0) {
      return await removeFromCart(userId, productId);
    }

    const cart = await getUserCart(userId);
    const updatedItems = cart.items.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await setDoc(doc(firestore, COLLECTIONS.CARTS, userId), {
      userId,
      items: updatedItems,
      totalItems,
      totalAmount,
      currency: 'USD',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

// Clear cart
export const clearCart = async (userId) => {
  try {
    await setDoc(doc(firestore, COLLECTIONS.CARTS, userId), {
      userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      currency: 'USD',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// ============ WISHLIST OPERATIONS ============

// Add to wishlist
export const addToWishlist = async (userId, productId) => {
  try {
    await updateDoc(doc(firestore, COLLECTIONS.USERS, userId), {
      wishlist: arrayUnion(productId),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

// Remove from wishlist
export const removeFromWishlist = async (userId, productId) => {
  try {
    await updateDoc(doc(firestore, COLLECTIONS.USERS, userId), {
      wishlist: arrayRemove(productId),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

// ============ ORDER OPERATIONS ============

// Create order
export const createOrder = async (orderData) => {
  try {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const orderRef = await addDoc(collection(firestore, COLLECTIONS.ORDERS), {
      ...orderData,
      orderNumber,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get user orders
export const getUserOrders = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(firestore, COLLECTIONS.ORDERS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

// Get store orders
export const getStoreOrders = async (storeId, limitCount = 20) => {
  try {
    const q = query(
      collection(firestore, COLLECTIONS.ORDERS),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting store orders:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'shipped') {
      updateData.shippedAt = serverTimestamp();
    } else if (status === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
    }

    await updateDoc(doc(firestore, COLLECTIONS.ORDERS, orderId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};