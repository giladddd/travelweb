const http = require('http');
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 8080;
const ROOT = __dirname.endsWith(path.sep) ? __dirname : __dirname + path.sep;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
};

const COMPRESSIBLE = new Set(['.html','.css','.js','.svg']);
const IMMUTABLE    = new Set(['.css','.js','.woff','.woff2','.ttf','.eot','.webp','.png','.jpg','.jpeg','.gif','.ico']);

const gzipCache = new Map();

// Rate limiting: max 300 req/sec per IP
const requestCounts = new Map();
setInterval(() => requestCounts.clear(), 1000);

function serveFile(req, res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';
  const cacheControl = IMMUTABLE.has(ext)
    ? 'public, max-age=604800, immutable'
    : 'public, max-age=0, must-revalidate';

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (ext === '.mp4' || ext === '.webm') {
    let total;
    try { total = fs.statSync(filePath).size; } catch(e) { res.writeHead(404); res.end('Not found'); return; }
    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end   = endStr ? parseInt(endStr, 10) : Math.min(start + 1024 * 1024, total - 1);
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${total}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(filePath, { start, end }).on('error', () => res.destroy()).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': total, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
    }
    return;
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (COMPRESSIBLE.has(ext) && acceptEncoding.includes('gzip')) {
    let stat;
    try { stat = fs.statSync(filePath); } catch(e) { res.writeHead(404); res.end('Not found'); return; }
    const cached = gzipCache.get(filePath);
    if (cached && cached.mtime === stat.mtimeMs) {
      res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip', 'Content-Length': cached.data.length, 'Cache-Control': cacheControl, 'Vary': 'Accept-Encoding' });
      res.end(cached.data); return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(500); res.end(); return; }
      zlib.gzip(data, (err, compressed) => {
        if (err) { res.writeHead(500); res.end(); return; }
        // Keep cache size manageable (max 200 entries)
        if (gzipCache.size > 200) {
          const firstKey = gzipCache.keys().next().value;
          gzipCache.delete(firstKey);
        }
        gzipCache.set(filePath, { mtime: stat.mtimeMs, data: compressed });
        res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip', 'Content-Length': compressed.length, 'Cache-Control': cacheControl, 'Vary': 'Accept-Encoding' });
        res.end(compressed);
      });
    }); return;
  }

  let size;
  try { size = fs.statSync(filePath).size; } catch(e) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Cache-Control': cacheControl });
  fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
}

const server = http.createServer((req, res) => {
  // Rate limiting
  const ip = req.socket.remoteAddress || 'unknown';
  const count = (requestCounts.get(ip) || 0) + 1;
  requestCounts.set(ip, count);
  if (count > 300) { res.writeHead(429); res.end('Too Many Requests'); return; }

  // Keep raw URL — product pages are named with literal %d7%xx slugs
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  urlPath = urlPath.replace(/%20/g, ' ').replace(/%2B/gi, '+');

  const filePath = path.join(ROOT, urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveFile(req, res, filePath);
    }
  } catch(e) {}

  // Fallback: decode Hebrew percent-encoding (for image/asset URLs)
  try {
    const decoded = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (decoded.startsWith(ROOT) && fs.existsSync(decoded) && fs.statSync(decoded).isFile()) {
      return serveFile(req, res, decoded);
    }
  } catch(e) {}

  res.writeHead(404); res.end('Not found: ' + urlPath);

});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Server running at http://localhost:' + PORT);
  console.log('Features: gzip, video streaming, asset caching, Hebrew decode fallback, rate limiting');
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });

// Top-level crash guards — log errors but keep the server alive
process.on('uncaughtException',  err => console.error('[uncaughtException]', err));
process.on('unhandledRejection', err => console.error('[unhandledRejection]', err));
