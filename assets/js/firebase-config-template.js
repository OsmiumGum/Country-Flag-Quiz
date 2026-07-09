// Firebase Configuration - Template
// INSTRUCTIONS: 
// 1. Copy this file to 'firebase-config-local.js' 
// 2. Replace the placeholder values with your actual Firebase config
// 3. Add 'firebase-config-local.js' to .gitignore

const firebaseConfig = {
    apiKey: "your-actual-api-key-here",
    authDomain: "your-project.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.auth = auth;
window.db = db;