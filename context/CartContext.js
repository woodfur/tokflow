// Cart Context Provider
// Global state management for shopping cart functionality

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import {
  getUserCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart
} from '../firebase/storeOperations';

// Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_LOADING: 'SET_LOADING',
};

// Initial cart state
const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  currency: 'USD',
  loading: false,
  error: null
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      };
    
    case CART_ACTIONS.ADD_ITEM:
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      );
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        updatedItems = [...state.items, action.payload];
      }
      
      const newTotalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const newTotalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: newTotalItems,
        totalAmount: newTotalAmount,
        loading: false,
        error: null
      };
    
    case CART_ACTIONS.REMOVE_ITEM:
      const filteredItems = state.items.filter(
        item => item.productId !== action.payload.productId
      );
      const removeTotalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
      const removeTotalAmount = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: filteredItems,
        totalItems: removeTotalItems,
        totalAmount: removeTotalAmount,
        loading: false,
        error: null
      };
    
    case CART_ACTIONS.UPDATE_QUANTITY:
      const quantityUpdatedItems = state.items.map(item =>
        item.productId === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const updateTotalItems = quantityUpdatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const updateTotalAmount = quantityUpdatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: quantityUpdatedItems,
        totalItems: updateTotalItems,
        totalAmount: updateTotalAmount,
        loading: false,
        error: null
      };
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        loading: false,
        error: null
      };
    
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [user] = useAuthState(auth);

  // Load cart when user changes
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      // Clear cart when user logs out
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
    }
  }, [user]);

  // Load cart from Firebase
  const loadCart = async () => {
    if (!user) return;
    
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      const cart = await getUserCart(user.uid);
      dispatch({ type: CART_ACTIONS.SET_CART, payload: cart });
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Add item to cart
  const addItemToCart = async (productId, quantity = 1) => {
    if (!user) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Please sign in to add items to cart' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      await addToCart(user.uid, productId, quantity);
      await loadCart(); // Reload cart to get updated data
    } catch (error) {
      console.error('Error adding item to cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Remove item from cart
  const removeItemFromCart = async (productId) => {
    if (!user) return;

    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      await removeFromCart(user.uid, productId);
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Update item quantity
  const updateItemQuantity = async (productId, quantity) => {
    if (!user) return;

    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      await updateCartItemQuantity(user.uid, productId, quantity);
      
      if (quantity <= 0) {
        dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
      } else {
        dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Clear entire cart
  const clearEntireCart = async () => {
    if (!user) return;

    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      await clearCart(user.uid);
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  // Check if item is in cart
  const isInCart = (productId) => {
    return state.items.some(item => item.productId === productId);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: CART_ACTIONS.SET_ERROR, payload: null });
  };

  const value = {
    // State
    cart: state,
    items: state.items,
    totalItems: state.totalItems,
    totalAmount: state.totalAmount,
    currency: state.currency,
    loading: state.loading,
    error: state.error,
    
    // Actions
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearEntireCart,
    loadCart,
    
    // Utilities
    getItemQuantity,
    isInCart,
    clearError
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;