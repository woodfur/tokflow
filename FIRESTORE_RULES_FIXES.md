# Firestore Rules Fixes for TokFlow Application

## Current Errors Identified

The console logs show multiple `Missing or insufficient permissions` errors:

1. **Error fetching posts** - Reading from posts collection
2. **Firebase getUserCart error** - Reading user cart data
3. **Error getting user store** - Reading user store information
4. **Error loading user store** - Reading store data
5. **Network errors** - Connection issues to Firestore

## Root Cause

The Firestore security rules are likely too restrictive or missing proper read/write permissions for the required collections.

## Required Rule Modifications

### Current Firestore Rules Structure (Expected)

Based on the error patterns, your Firestore rules need to allow authenticated users to read/write to specific collections. Here's the comprehensive fix:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow users to read their own cart data
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (resource.data.customerInfo.userId == request.auth.uid ||
         request.auth.uid == resource.data.customerId);
      allow create: if request.auth != null;
    }
    
    // Allow reading posts (public content)
    match /posts/{postId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Allow users to read/write their own store data
    match /stores/{storeId} {
      allow read: if true; // Public read access for stores
      allow write: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Allow users to read/write their user data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading product data (public)
    match /products/{productId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Authenticated users can write
    }
    
    // Default fallback - deny all other operations
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step-by-Step Implementation

### 1. Update Firestore Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`soldev-aa9ae`)
3. Navigate to Firestore Database → Rules
4. Replace existing rules with the rules above
5. Click "Publish"

### 2. Specific Collection Permissions Needed

#### For Cart Operations:
```firestore
match /carts/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

#### For Order Operations (Payment on Delivery):
```firestore
match /orders/{orderId} {
  allow read, write: if request.auth != null && 
    (resource.data.customerInfo.userId == request.auth.uid ||
     request.auth.uid == resource.data.customerId);
  allow create: if request.auth != null;
}
```

#### For Store Operations:
```firestore
match /stores/{storeId} {
  allow read: if true; // Public read access
  allow write: if request.auth != null && resource.data.ownerId == request.auth.uid;
}
```

#### For Post/Content Operations:
```firestore
match /posts/{postId} {
  allow read: if true; // Public read access
  allow write: if request.auth != null; // Authenticated users can write
}
```

## Testing the Rules

After updating the rules, test the following scenarios:

1. **Authenticated User Access:**
   - User should be able to read/write their own cart
   - User should be able to create and read their orders
   - User should be able to read public posts and products

2. **Unauthenticated User Access:**
   - Should be able to read posts and products (public content)
   - Should NOT be able to write to any collections
   - Should NOT be able to access user-specific data

3. **Cross-User Access:**
   - User A should NOT be able to access User B's cart or orders
   - Users should only see their own data in user-specific collections

## Common Issues and Solutions

### Issue: "Missing or insufficient permissions"
**Solution:** Ensure the rules allow read operations for the specific collection and that users are properly authenticated.

### Issue: Network errors (ERR_ABORTED)
**Solution:** These are often secondary to permission errors. Fixing the rules should resolve these.

### Issue: User can't create orders
**Solution:** Add `allow create: if request.auth != null;` to orders collection rules.

## Emergency Rules (If Needed)

If you need immediate access for development, use these temporary rules (NOT for production):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Warning:** These rules provide no security - use only for development and testing.

## Best Practices

1. **Start restrictive:** Begin with deny-all rules and gradually add permissions
2. **Test thoroughly:** Use the Firestore Rules Simulator in Firebase Console
3. **Monitor logs:** Check Firebase logs for permission denied errors
4. **Regular reviews:** Periodically review and update rules as features change

## Next Steps

1. Update the Firestore rules with the provided configuration
2. Test the application to ensure permission errors are resolved
3. Monitor console logs for any remaining issues
4. Adjust rules as needed based on specific feature requirements