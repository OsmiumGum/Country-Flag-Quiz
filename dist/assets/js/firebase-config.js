// Firebase Configuration
// REPLACE WITH TEMPLATE VALUES BEFORE PUSHING TO GITHUB!

// YOUR ACTUAL CONFIGURATION (replace with template before pushing)
const firebaseConfig = {
    apiKey: "AIzaSyDsAHBfXT8LZVJNnVS9pcznENhNfdQ1OPk",
    authDomain: "flag-quiz-game-7745f.firebaseapp.com",
    projectId: "flag-quiz-game-7745f",
    storageBucket: "flag-quiz-game-7745f.firebasestorage.app",
    messagingSenderId: "734673677166",
    appId: "1:734673677166:web:26b9c3e0e681d957842f7f",
    measurementId: "G-7MR7SHQ1MD"
};

// Check if Firebase config is still using template values
const isTemplateConfig = firebaseConfig.apiKey === "your-api-key-here";

console.log('🔧 Firebase Debug Info:');
console.log('API Key:', firebaseConfig.apiKey);
console.log('Is Template Config:', isTemplateConfig);
console.log('Firebase Available:', typeof firebase !== 'undefined');

if (isTemplateConfig) {
    console.warn('⚠️ Firebase is using template configuration. User accounts are disabled.');
    console.log('To enable user accounts and statistics:');
    console.log('1. Create a Firebase project at https://console.firebase.google.com/');
    console.log('2. Update the firebaseConfig object above with your actual keys');
    console.log('3. Follow the setup guide in the repository README');
}

// Initialize Firebase only if we have valid config
let auth, db;
try {
    if (!isTemplateConfig && typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('✅ Firebase initialized successfully');
    } else {
        console.log('🎮 Running in demo mode - authentication disabled');
        // Create mock objects for demo mode
        auth = {
            onAuthStateChanged: (callback) => callback(null),
            signInWithEmailAndPassword: () => Promise.reject(new Error('Demo mode: Please configure Firebase')),
            createUserWithEmailAndPassword: () => Promise.reject(new Error('Demo mode: Please configure Firebase')),
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
    console.log('🎮 Running in demo mode');
}

// Export for use in other files
window.auth = auth;
window.db = db;
window.isFirebaseConfigured = !isTemplateConfig;