const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT) || 8080;
const root = path.resolve(__dirname, '..');
const siteRoot = path.resolve(__dirname);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
};

function safePath(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const candidate = path.resolve(base, '.' + decoded);
  return candidate.startsWith(base + path.sep) || candidate === base ? candidate : null;
}

function sendFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return false;
    const type = mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' });
    fs.createReadStream(filePath).pipe(res);
    return true;
  });
  return true;
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = url.pathname;
    if (pathname === '/') pathname = '/index.html';

    // Serve the rebuilt site first.
    let file = safePath(siteRoot, pathname);
    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(res, file);

    // Preserve the repository's original images and legacy pages.
    file = safePath(root, pathname);
    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(res, file);

    // Friendly fallback for extensionless routes.
    if (!path.extname(pathname)) {
      file = safePath(siteRoot, '/index.html');
      if (file) return sendFile(res, file);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`RTB.com.co listening on port ${port}`);
});
