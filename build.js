const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
}

function copyDir(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
        console.warn(`⚠️ Skipping missing directory: ${path.relative(rootDir, srcDir)}`);
        return;
    }

    ensureDir(destDir);
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

function cleanDist() {
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    ensureDir(distDir);
}

console.log('📁 Building site into /dist...');
cleanDist();

// Copy root entry point and shared static folders
copyFile(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));
copyDir(path.join(rootDir, 'assets'), path.join(distDir, 'assets'));
copyDir(path.join(rootDir, 'pages'), path.join(distDir, 'pages'));
copyDir(path.join(rootDir, 'images'), path.join(distDir, 'images'));

// Copy any other standalone assets that live at the root and are intended for deployment.
const extraRootFiles = ['netlify.toml'];
for (const file of extraRootFiles) {
    const src = path.join(rootDir, file);
    if (fs.existsSync(src)) {
        copyFile(src, path.join(distDir, file));
    }
}

console.log('\n🎉 Build complete! Files ready in /dist directory');
console.log('📤 Static pages are preserved under /pages and shared assets under /assets');
