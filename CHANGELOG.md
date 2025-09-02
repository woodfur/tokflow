# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-01-22

### Changed
- **Currency System Update**: Changed store currency from US Dollars ($) to Sierra Leonean Leones (Le)
  - Created centralized currency formatting utility (`utils/currency.js`) with functions for Leones formatting
  - Updated all price displays across the application to use Leones currency
  - Modified cart page: shipping threshold changed from $50 to Le 500,000, shipping cost from $5.99 to Le 59,900
  - Updated store page, product detail page, wishlist page, and store management pages
  - Changed form labels in add-product and edit-product pages to indicate Leones currency
  - Implemented consistent currency formatting with proper comma separators and "Le" prefix

### Added
- **Marketplace Feature Activation**: Enabled full marketplace functionality by removing "Coming Soon" overlay
  - Product browsing and search capabilities
  - Shopping cart functionality with add/remove items
  - Wishlist feature for saving favorite products
  - User store management (create and manage your own store)
  - Mobile-responsive design with touch-friendly interface
  - Product filtering and sorting options
  - Grid and list view modes for product display
- **Sample Products API**: Created `/pages/api/seed-products.js` endpoint for adding sample products to database
  - 5 sample products across different categories (Electronics, Lifestyle, Home & Office, Sports & Fitness)
  - Complete product data including images, specifications, pricing, and SEO metadata
- **Stores Listing Feature**: Added comprehensive stores directory functionality
  - New "Stores" button on store page next to view toggle buttons with MapIcon
  - Comprehensive stores listing view showing all active stores on the platform
  - Store cards display store name, description, product count, rating, location, and category
  - Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
  - Loading states and empty states for better user experience
  - Click-to-visit functionality for individual stores
  - Integrated with existing `getActiveStores` function from Firebase operations
- **Navigation System Enhancement**: Implemented intuitive tab-based navigation for Products and Stores
  - Removed standalone "Stores" button from header area
  - Added "Products" and "Stores" navigation tabs positioned above the search bar
  - Dynamic search functionality that adapts to active tab (searches products or stores)
  - Tab switching automatically clears search query and loads appropriate content
  - Stores tab includes filtered search capability matching store name, description, or category
  - Categories filter section is now hidden when viewing Stores tab for cleaner UI
  - Improved user experience with clear visual indicators for active tab
  - Maintains responsive design and visual consistency with existing UI

### Fixed
- **Cart Error Handling**: Resolved "Failed to load product data" error when adding items to cart
  - **Root Cause**: No products existed in the database, causing `getProduct()` to return null
  - **Solution**: Added comprehensive error handling and user feedback
  - Improved error messages in `firebase/storeOperations.js` for better debugging
  - Added toast notifications in store page for success/error feedback
  - Specific error messages for different scenarios (product not found, out of stock, insufficient stock)
- **Firebase Timestamp Errors**: Fixed serverTimestamp() compatibility issues
  - **Root Cause**: `serverTimestamp()` cannot be used directly in array contexts in Firestore
  - **Solution**: Replaced all `serverTimestamp()` calls with `new Date()` throughout `firebase/storeOperations.js`
  - Fixed cart operations, product creation, order management, and wishlist functionality
  - Resolved TypeError issues in product review system
- **Missing Product Reviews Function**: Added missing `getProductReviews` function
  - Created `getProductReviews()` function to fetch product reviews from Firestore subcollections
  - Added `createProductReview()` function for creating new product reviews
  - Implemented proper error handling and review count tracking
- **Missing getUserWishlist Function**: Fixed TypeError in product and wishlist pages
  - **Root Cause**: `getUserWishlist` function was imported but not defined in `firebase/storeOperations.js`
  - **Solution**: Added `getUserWishlist()` function to retrieve user's wishlist from Firestore
  - Fixed console errors in `/pages/product/[id].js` and `/pages/wishlist.js`
- **Cart Clear Functionality**: Fixed cart clearing not working due to function name mismatch
  - **Root Cause**: `cart.js` expected `clearCart` function but `CartContext.js` exported `clearEntireCart`
  - **Solution**: Updated `CartContext.js` to export `clearEntireCart` as `clearCart` for consistency
  - Resolved "Clear Cart" button not functioning in cart page
- **Improved Error Messages**: Enhanced product loading error handling
  - Updated error message in `addToCart()` from "Failed to load product data" to "Product not found. Please refresh the page and try again."
  - Added better validation and logging in `getProduct()` function
  - Improved error context for debugging Firebase connection issues
- **Cart UX Enhancement**: Modified "Add to Cart" behavior to redirect users to cart page
  - **Previous Behavior**: Showed toast notifications when items were added to cart
  - **New Behavior**: Automatically redirects users to the full cart interface after adding items
  - Updated across all pages: store.js, product/[id].js, and wishlist.js
  - Provides immediate visual feedback and encourages checkout completion
- **Cart Quantity Update Fix**: Fixed cart item quantity modification functionality
  - **Root Cause**: Function name mismatch between cart.js and CartContext exports
  - **Solution**: Changed `updateQuantity` to `updateItemQuantity` in cart.js to match CartContext export
  - Enables users to properly increase/decrease item quantities in cart page
- **Cart UI Improvements**: Enhanced cart page layout and image handling
  - **Image Display Fix**: Replaced missing placeholder image with shopping cart icon fallback
  - **Responsive Layout**: Improved mobile layout to prevent text overflow and content bleeding
  - **Solution**: Implemented responsive flexbox layout with proper spacing and text truncation
  - Added graceful image error handling with visual fallback indicators
  - Enhanced mobile experience with centered controls and proper spacing
- **Firebase Composite Index Error**: Fixed stores query requiring composite index
  - **Root Cause**: `getActiveStores` query used both `where('isActive', '==', true)` and `orderBy('createdAt', 'desc')` requiring a composite index
  - **Solution**: Removed `orderBy` from Firestore query and implemented client-side sorting by `createdAt` in descending order
  - Eliminated Firebase index requirement while maintaining chronological store ordering
  - Fixed "no stores" display issue when stores exist in Firebase

### Changed
- **Store Page Display**: Removed "Coming Soon" overlay from `/pages/store.js`
  - Eliminated BuildingStorefrontIcon and "Coming Soon" text
  - Removed SparklesIcon animation and "Go Back" button
  - Activated main store interface with full product catalog
- **Error Messaging**: Enhanced cart functionality with better user feedback
  - Added `react-hot-toast` notifications for cart operations
  - Improved error specificity in Firebase operations

### Technical Details
- Removed approximately 50 lines of overlay JSX code
- Maintained existing store functionality and UI components
- Preserved mobile navigation and responsive design elements
- Enhanced Firebase error handling with specific error types
- Added comprehensive sample product seeding capability