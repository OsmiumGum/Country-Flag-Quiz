const fs = require('fs');
const path = require('path');

// Create dist directory
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy all files to dist
const filesToCopy = [
    'index.html',
    'detailed-stats.html',
    'styles.css',
    'script.js',
    'detailed-stats.js',
    'user-manager.js', 
    'countries.js',
    'server.js'
];

console.log('📁 Copying files to dist...');

filesToCopy.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace firebase config import in HTML
    if (file === 'index.html') {
        content = content.replace(
            'src="firebase-config.js"',
            'src="firebase-config-env.js"'
        );
    }
    
    fs.writeFileSync(path.join('dist', file), content);
    console.log(`✅ Copied ${file}`);
});

// Copy firebase config with environment variables
let firebaseConfigContent = fs.readFileSync('firebase-config-env.js', 'utf8');

// Replace placeholders with environment variables (for build-time injection)
const envVars = {
    'FIREBASE_API_KEY': process.env.FIREBASE_API_KEY,
    'FIREBASE_AUTH_DOMAIN': process.env.FIREBASE_AUTH_DOMAIN,
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_STORAGE_BUCKET': process.env.FIREBASE_STORAGE_BUCKET,
    'FIREBASE_MESSAGING_SENDER_ID': process.env.FIREBASE_MESSAGING_SENDER_ID,
    'FIREBASE_APP_ID': process.env.FIREBASE_APP_ID,
    'FIREBASE_MEASUREMENT_ID': process.env.FIREBASE_MEASUREMENT_ID
};

// Replace placeholders if environment variables are available
Object.keys(envVars).forEach(key => {
    if (envVars[key]) {
        const placeholder = `{{${key}}}`;
        firebaseConfigContent = firebaseConfigContent.replace(placeholder, envVars[key]);
    }
});

fs.writeFileSync(path.join('dist', 'firebase-config-env.js'), firebaseConfigContent);
console.log('✅ Copied firebase-config-env.js');

console.log('\n🎉 Build complete! Files ready in /dist directory');
console.log('📤 Ready to deploy to Netlify/Vercel with environment variables');