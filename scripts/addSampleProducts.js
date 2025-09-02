// Simple script to add sample products to Firebase
// Run with: node scripts/addSampleProducts.js

// Note: This script needs to be run in a way that can access Next.js environment variables
// We'll create a simpler version that works with hardcoded Firebase config for demo purposes

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Demo Firebase configuration - replace with your actual config
// For production, you should use environment variables
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample products data
const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "Premium quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
    category: "Electronics",
    subcategory: "Audio",
    price: 129.99,
    originalPrice: 179.99,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500"
    ],
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    stock: 50,
    sku: "WBH-001",
    isInStock: true,
    lowStockThreshold: 10,
    specifications: {
      "Battery Life": "30 hours",
      "Connectivity": "Bluetooth 5.0",
      "Weight": "250g",
      "Color": "Black"
    },
    tags: ["wireless", "bluetooth", "headphones", "audio", "music"],
    weight: 0.25,
    dimensions: {
      length: 20,
      width: 18,
      height: 8
    },
    isActive: true,
    isFeatured: true,
    rating: 4.5,
    totalReviews: 128,
    totalSales: 0,
    views: 0,
    likes: 0,
    seoTitle: "Premium Wireless Bluetooth Headphones - TokFlo Store",
    seoDescription: "Shop premium wireless bluetooth headphones with noise cancellation",
    seoKeywords: ["wireless headphones", "bluetooth", "noise cancellation"]
  },
  {
    name: "Smartphone Camera Lens Kit",
    description: "Professional 3-in-1 camera lens kit for smartphones. Includes wide-angle, macro, and fisheye lenses with premium glass construction.",
    category: "Electronics",
    subcategory: "Photography",
    price: 49.99,
    originalPrice: 79.99,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500",
      "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500"
    ],
    thumbnail: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300",
    stock: 75,
    sku: "SCL-002",
    isInStock: true,
    lowStockThreshold: 15,
    specifications: {
      "Lenses Included": "3 (Wide-angle, Macro, Fisheye)",
      "Compatibility": "Universal smartphone mount",
      "Material": "Premium glass",
      "Weight": "150g"
    },
    tags: ["camera", "lens", "smartphone", "photography", "mobile"],
    weight: 0.15,
    dimensions: {
      length: 12,
      width: 8,
      height: 3
    },
    isActive: true,
    isFeatured: false,
    rating: 4.2,
    totalReviews: 89,
    totalSales: 0,
    views: 0,
    likes: 0,
    seoTitle: "Professional Smartphone Camera Lens Kit - TokFlo Store",
    seoDescription: "Transform your smartphone photography with professional lens kit",
    seoKeywords: ["smartphone lens", "camera kit", "mobile photography"]
  },
  {
    name: "Eco-Friendly Water Bottle",
    description: "Sustainable stainless steel water bottle with double-wall insulation. Keeps drinks cold for 24 hours or hot for 12 hours.",
    category: "Lifestyle",
    subcategory: "Drinkware",
    price: 24.99,
    originalPrice: 34.99,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500"
    ],
    thumbnail: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300",
    stock: 100,
    sku: "EWB-003",
    isInStock: true,
    lowStockThreshold: 20,
    specifications: {
      "Capacity": "500ml",
      "Material": "Stainless Steel",
      "Insulation": "Double-wall vacuum",
      "BPA Free": "Yes"
    },
    tags: ["water bottle", "eco-friendly", "sustainable", "insulated", "steel"],
    weight: 0.3,
    dimensions: {
      length: 7,
      width: 7,
      height: 25
    },
    isActive: true,
    isFeatured: true,
    rating: 4.7,
    totalReviews: 203,
    totalSales: 0,
    views: 0,
    likes: 0,
    seoTitle: "Eco-Friendly Insulated Water Bottle - TokFlo Store",
    seoDescription: "Stay hydrated with our sustainable stainless steel water bottle",
    seoKeywords: ["eco water bottle", "insulated bottle", "sustainable drinkware"]
  },
  {
    name: "Minimalist Desk Organizer",
    description: "Clean and modern bamboo desk organizer with multiple compartments for pens, phones, and office supplies. Perfect for home or office.",
    category: "Home & Office",
    subcategory: "Organization",
    price: 39.99,
    originalPrice: 59.99,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500"
    ],
    thumbnail: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300",
    stock: 30,
    sku: "MDO-004",
    isInStock: true,
    lowStockThreshold: 5,
    specifications: {
      "Material": "Sustainable Bamboo",
      "Compartments": "6",
      "Dimensions": "25x15x8 cm",
      "Finish": "Natural wood"
    },
    tags: ["desk organizer", "bamboo", "minimalist", "office", "organization"],
    weight: 0.4,
    dimensions: {
      length: 25,
      width: 15,
      height: 8
    },
    isActive: true,
    isFeatured: false,
    rating: 4.3,
    totalReviews: 67,
    totalSales: 0,
    views: 0,
    likes: 0,
    seoTitle: "Minimalist Bamboo Desk Organizer - TokFlo Store",
    seoDescription: "Organize your workspace with our sustainable bamboo desk organizer",
    seoKeywords: ["desk organizer", "bamboo organizer", "office supplies"]
  },
  {
    name: "Fitness Resistance Bands Set",
    description: "Complete resistance bands set with 5 different resistance levels, door anchor, handles, and ankle straps. Perfect for home workouts.",
    category: "Sports & Fitness",
    subcategory: "Exercise Equipment",
    price: 29.99,
    originalPrice: 49.99,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
      "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=500"
    ],
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300",
    stock: 80,
    sku: "FRB-005",
    isInStock: true,
    lowStockThreshold: 10,
    specifications: {
      "Resistance Levels": "5 (10-50 lbs)",
      "Material": "Natural latex",
      "Includes": "Door anchor, handles, ankle straps",
      "Portable": "Yes"
    },
    tags: ["resistance bands", "fitness", "exercise", "home workout", "portable"],
    weight: 0.8,
    dimensions: {
      length: 30,
      width: 20,
      height: 5
    },
    isActive: true,
    isFeatured: true,
    rating: 4.6,
    totalReviews: 156,
    totalSales: 0,
    views: 0,
    likes: 0,
    seoTitle: "Complete Fitness Resistance Bands Set - TokFlo Store",
    seoDescription: "Get fit at home with our complete resistance bands workout set",
    seoKeywords: ["resistance bands", "home fitness", "exercise equipment"]
  }
];

// Function to seed products
async function seedProducts() {
  try {
    console.log('🌱 Starting to seed products...');
    
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = {
        ...sampleProducts[i],
        // Add required fields
        storeId: 'demo-store', // Demo store ID
        ownerId: 'demo-user', // Demo user ID
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'products'), product);
      console.log(`✅ Product ${i + 1}/5: "${product.name}" added with ID: ${docRef.id}`);
    }
    
    console.log('🎉 All sample products have been successfully added to the database!');
    console.log('💡 You can now test the cart functionality in your TokFlo Store.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedProducts();