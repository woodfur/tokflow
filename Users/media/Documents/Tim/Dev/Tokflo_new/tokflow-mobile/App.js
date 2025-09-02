import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase/firebase';
import { createUserProfile, updateLastLogin } from './src/utils/userProfile';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import VideoDetailScreen from './src/screens/VideoDetailScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import UploadScreen from './src/screens/UploadScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import EditProductScreen from './src/screens/EditProductScreen';
import CreateStoreScreen from './src/screens/CreateStoreScreen';
import CartScreen from './src/screens/CartScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import SearchScreen from './src/screens/SearchScreen';

// Context
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await createUserProfile(user);
          await updateLastLogin(user.uid);
          setUser(user);
        } catch (error) {
          console.error('Error initializing user profile:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
              <>
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen 
                  name="VideoDetail" 
                  component={VideoDetailScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen 
                  name="UserProfile" 
                  component={UserProfileScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen 
                  name="Upload" 
                  component={UploadScreen}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen 
                  name="ProductDetail" 
                  component={ProductDetailScreen}
                />
                <Stack.Screen 
                  name="EditProduct" 
                  component={EditProductScreen}
                />
                <Stack.Screen 
                  name="CreateStore" 
                  component={CreateStoreScreen}
                />
                <Stack.Screen 
                  name="Cart" 
                  component={CartScreen}
                />
                <Stack.Screen 
                  name="Wishlist" 
                  component={WishlistScreen}
                />
                <Stack.Screen 
                  name="Search" 
                  component={SearchScreen}
                />
              </>
            ) : (
              <Stack.Screen name="Auth" component={AuthScreen} />
            )}
          </Stack.Navigator>
          <Toast />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}