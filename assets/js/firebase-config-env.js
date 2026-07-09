// Environment Variables Configuration
// This file reads Firebase config from environment variables

// Check if we're in a browser environment with env vars available
const getFirebaseConfig = () => {
    // For deployment platforms like Netlify/Vercel that inject env vars
    if (typeof process !== 'undefined' && process.env) {
        return {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        };
    }
    
    // For build-time injection (will be replaced during build)
    return {
        apiKey: "{{FIREBASE_API_KEY}}",
        authDomain: "{{FIREBASE_AUTH_DOMAIN}}",
        projectId: "{{FIREBASE_PROJECT_ID}}",
        storageBucket: "{{FIREBASE_STORAGE_BUCKET}}",
        messagingSenderId: "{{FIREBASE_MESSAGING_SENDER_ID}}",
        appId: "{{FIREBASE_APP_ID}}",
        measurementId: "{{FIREBASE_MEASUREMENT_ID}}"
    };
};

const firebaseConfig = getFirebaseConfig();

// Check if Firebase config is properly set
const isConfigured = firebaseConfig.apiKey && 
                     firebaseConfig.apiKey !== "{{FIREBASE_API_KEY}}" &&
                     firebaseConfig.apiKey !== "your-api-key-here";

if (isConfigured) {
    console.log('✅ Firebase configured with environment variables');
} else {
    console.warn('⚠️ Firebase not configured - running in demo mode');
}

// Initialize Firebase only if properly configured
let auth, db;
try {
    if (isConfigured && typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('✅ Firebase initialized successfully');
    } else {
        console.log('🎮 Running in demo mode');
        // Mock objects for demo mode
        auth = {
            onAuthStateChanged: (callback) => callback(null),
            signInWithEmailAndPassword: () => Promise.reject(new Error('Demo mode')),
            createUserWithEmailAndPassword: () => Promise.reject(new Error('Demo mode')),
            signOut: () => Promise.reject(new Error('Demo mode'))
        };
        db = {
            collection: () => ({
                doc: () => ({
                    set: () => Promise.resolve(),
                    get: () => Promise.resolve({ exists: false }),
                    update: () => Promise.resolve()
                })
            })
        };
    }
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

// Export for use in other files
window.auth = auth;
window.db = db;
window.isFirebaseConfigured = isConfigured;