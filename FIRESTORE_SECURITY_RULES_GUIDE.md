# Firestore Security Rules - Best Practices & Implementation Guide

## Overview
Firestore Security Rules control data access in Firebase Firestore. This guide covers best practices for your e-commerce application.

## Current Rules Status
Your current `firestore.rules` file allows:
- Authenticated users to read/write all documents
- Server-side checkout to create orders without authentication

## Key Security Patterns

### 1. Authentication-Based Access
```javascript
// Allow access only for authenticated users
allow read, write: if request.auth != null;
```

### 2. Owner-Based Access  
```javascript
// Users can only access their own orders
allow read: if request.auth.uid == resource.data.userId;
allow write: if request.auth.uid == request.resource.data.userId;
```

### 3. Server-Side Access (Checkout API)
```javascript
// Allow server-side order creation without auth
allow create: if request.auth == null 
  && request.resource.data.amount > 0
  && request.resource.data.status == 'pending';
```

## Complete Rules Implementation

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isUser(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, update: if isUser(userId);
      allow create, delete: if false; // Admin only via console
    }
    
    // Orders collection - critical for checkout
    match /orders/{orderId} {
      // Customers can read their own orders
      allow read: if isUser(resource.data.userId);
      
      // Server-side checkout can create orders
      allow create: if request.auth == null
        && request.resource.data.amount is number
        && request.resource.data.amount > 0
        && request.resource.data.status == 'pending';
        
      // Prevent updates and deletes
      allow update, delete: if false;
    }
    
    // Products collection
    match /products/{productId} {
      // Public read access
      allow read: if true;
      
      // Only authenticated users can write (admin functionality)
      allow write: if isAuthenticated();
    }
    
    // Default deny for unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Testing Your Rules

### 1. Use Firebase Emulator
```bash
firebase emulators:start --only firestore
```

### 2. Test Checkout Flow
- Verify server-side order creation works without auth
- Ensure authenticated users can read their orders
- Confirm unauthenticated users cannot read others' orders

## Deployment Steps

1. **Test locally** with Firebase Emulator
2. **Deploy rules**: `firebase deploy --only firestore:rules`
3. **Verify deployment** in Firebase Console
4. **Test checkout flow** with real payments

## Troubleshooting

### Common Issues:
1. **PERMISSION_DENIED**: Rules not deployed or too restrictive
2. **Missing fields**: Data validation failing
3. **Auth context**: Server-side vs client-side confusion

### Debug Tips:
- Check Firebase Console > Firestore > Rules for errors
- Use `console.log` in rules for debugging
- Test with Firebase Emulator first

## Next Steps
1. Deploy updated rules
2. Test checkout functionality
3. Monitor Firestore logs for denied requests
4. Iterate based on real-world usage

---
*Last updated: Based on your current firestore.rules configuration*