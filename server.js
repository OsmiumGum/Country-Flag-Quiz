const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const publicRoots = [
    rootDir,
    path.join(rootDir, 'assets'),
    path.join(rootDir, 'pages'),
    path.join(rootDir, 'images')
];

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

function resolveRequestPath(urlPath) {
    const requestPath = decodeURIComponent(urlPath.split('?')[0]);
    const candidates = [];

    if (requestPath === '/' || requestPath === '') {
        candidates.push(path.join(rootDir, 'index.html'));
    } else {
        const trimmed = requestPath.replace(/^\//, '');
        candidates.push(path.join(rootDir, trimmed));
        candidates.push(path.join(rootDir, 'assets', trimmed));
        candidates.push(path.join(rootDir, 'pages', trimmed));
        candidates.push(path.join(rootDir, 'images', trimmed));
    }

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }
    }

    return null;
}

const server = http.createServer((req, res) => {
    const filePath = resolveRequestPath(req.url);

    if (!filePath) {
        const notFoundPath = path.join(rootDir, '404.html');
        if (fs.existsSync(notFoundPath)) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(notFoundPath, 'utf-8'));
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Open this URL in your browser to test the Flag Quiz Game');
});
