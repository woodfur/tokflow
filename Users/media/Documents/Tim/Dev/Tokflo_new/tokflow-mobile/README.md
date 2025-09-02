# TokFlo Mobile - React Native App

A React Native mobile application that mirrors the functionality of the TokFlo web app, providing a TikTok-style video sharing platform with integrated e-commerce features.

## Features

### 🎥 Video Features
- TikTok-style vertical video feed
- Video recording and upload
- Like, comment, and share functionality
- Video bookmarking
- User profiles with video grids
- Search videos, users, and hashtags

### 🛒 E-commerce Features
- Product listings and store management
- Shopping cart and wishlist
- Product search and categories
- Store creation and management
- Product upload and editing

### 👤 User Features
- Firebase authentication (login/signup)
- User profiles and following system
- Personalized feeds
- User settings and preferences

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **State Management**: React Context API
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Video**: Expo AV
- **Camera**: Expo Camera
- **UI Components**: React Native Elements, Expo Vector Icons
- **Forms**: React Hook Form
- **Storage**: AsyncStorage

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)
- Firebase project with configuration

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tokflow-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Download the configuration file
   - Update `src/firebase/firebase.js` with your Firebase configuration:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

4. **Set up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Posts are readable by all, writable by owner
       match /posts/{postId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
       
       // Products and stores
       match /products/{productId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == resource.data.sellerId;
       }
       
       match /stores/{storeId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
       }
     }
   }
   ```

5. **Set up Firebase Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

## Running the App

1. **Start the Expo development server**
   ```bash
   npx expo start
   ```

2. **Run on iOS Simulator**
   ```bash
   npx expo start --ios
   ```

3. **Run on Android Emulator**
   ```bash
   npx expo start --android
   ```

4. **Run on physical device**
   - Install Expo Go app on your device
   - Scan the QR code from the terminal

## Project Structure

```
tokflow-mobile/
├── src/
│   ├── components/          # Reusable components
│   │   └── VideoPost.js     # Video post component
│   ├── context/             # React Context providers
│   │   ├── AuthContext.js   # Authentication context
│   │   └── CartContext.js   # Shopping cart context
│   ├── firebase/            # Firebase configuration
│   │   └── firebase.js      # Firebase setup
│   ├── navigation/          # Navigation components
│   │   └── MainTabNavigator.js
│   └── screens/             # App screens
│       ├── AuthScreen.js
│       ├── HomeScreen.js
│       ├── SearchScreen.js
│       ├── UploadScreen.js
│       ├── StoreScreen.js
│       ├── ProfileScreen.js
│       ├── VideoDetailScreen.js
│       ├── UserProfileScreen.js
│       ├── ProductDetailScreen.js
│       ├── CartScreen.js
│       ├── WishlistScreen.js
│       ├── EditProductScreen.js
│       └── CreateStoreScreen.js
├── assets/                  # Static assets
├── App.js                   # Main app component
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── README.md               # This file
```

## Key Features Implementation

### Video Feed
- Vertical scrolling video feed using `FlatList`
- Auto-play videos when in viewport
- Double-tap to like functionality
- Swipe gestures for navigation

### Authentication
- Firebase Authentication integration
- Email/password and social login support
- Persistent login state with AsyncStorage

### E-commerce
- Product catalog with categories
- Shopping cart with persistent state
- Store management for sellers
- Order processing workflow

### Media Handling
- Video recording with Expo Camera
- Image/video selection from gallery
- Firebase Storage for media uploads
- Optimized media loading and caching

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React Native best practices
- Implement proper error handling
- Use TypeScript for better type safety (optional)

### Performance
- Implement lazy loading for images/videos
- Use FlatList for large datasets
- Optimize re-renders with React.memo
- Implement proper caching strategies

### Security
- Never expose Firebase config in client code
- Implement proper Firestore security rules
- Validate user inputs
- Use HTTPS for all API calls

## Building for Production

### iOS
```bash
npx expo build:ios
```

### Android
```bash
npx expo build:android
```

### Using EAS Build (Recommended)
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS Simulator not opening**
   - Ensure Xcode is installed
   - Check iOS Simulator path in Expo settings

3. **Android emulator issues**
   - Ensure Android Studio is properly configured
   - Check ANDROID_HOME environment variable

4. **Firebase connection issues**
   - Verify Firebase configuration
   - Check network connectivity
   - Ensure Firebase services are enabled

### Performance Issues

1. **Video playback lag**
   - Reduce video quality/resolution
   - Implement video preloading
   - Use video compression

2. **App crashes on large datasets**
   - Implement pagination
   - Use FlatList with proper optimization
   - Reduce memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review Firebase documentation for backend issues

## Roadmap

- [ ] Push notifications
- [ ] Live streaming functionality
- [ ] Advanced video editing
- [ ] Payment integration
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Offline functionality