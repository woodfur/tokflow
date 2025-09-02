import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload,
      };
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id
      );
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity || 1;
        return {
          ...state,
          items: updatedItems,
        };
      } else {
        return {
          ...state,
          items: [
            ...state.items,
            {
              ...action.payload,
              quantity: action.payload.quantity || 1,
            },
          ],
        };
      }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  items: [],
  loading: false,
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [user] = useAuthState(auth);

  // Load cart from AsyncStorage on app start
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Sync cart with Firebase when user changes
  useEffect(() => {
    if (user) {
      syncCartWithFirebase();
    } else {
      // Clear cart when user logs out
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user]);

  // Save cart to AsyncStorage whenever cart changes
  useEffect(() => {
    saveCartToStorage();
  }, [state.items]);

  const loadCartFromStorage = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        dispatch({ type: 'SET_CART', payload: parsedCart });
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  };

  const saveCartToStorage = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const syncCartWithFirebase = () => {
    if (!user) return;

    const cartRef = doc(firestore, 'carts', user.uid);
    
    // Listen to cart changes in Firebase
    const unsubscribe = onSnapshot(
      cartRef,
      (doc) => {
        if (doc.exists()) {
          const firebaseCart = doc.data().items || [];
          dispatch({ type: 'SET_CART', payload: firebaseCart });
        }
      },
      (error) => {
        console.error('Error syncing cart with Firebase:', error);
      }
    );

    return unsubscribe;
  };

  const saveCartToFirebase = async () => {
    if (!user) return;

    try {
      const cartRef = doc(firestore, 'carts', user.uid);
      await setDoc(cartRef, {
        items: state.items,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving cart to Firebase:', error);
    }
  };

  const addToCart = async (productId, productData, quantity = 1) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const cartItem = {
        id: productId,
        ...productData,
        quantity,
        addedAt: new Date().toISOString(),
      };
      
      dispatch({ type: 'ADD_ITEM', payload: cartItem });
      
      if (user) {
        await saveCartToFirebase();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (productId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
      
      if (user) {
        await saveCartToFirebase();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
      
      if (user) {
        await saveCartToFirebase();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      dispatch({ type: 'CLEAR_CART' });
      
      if (user) {
        await saveCartToFirebase();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId) => {
    return state.items.some(item => item.id === productId);
  };

  const getCartItem = (productId) => {
    return state.items.find(item => item.id === productId);
  };

  const value = {
    cartItems: state.items,
    loading: state.loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isInCart,
    getCartItem,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};