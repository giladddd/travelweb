const http = require('http');
const fs = require('fs');
const path = require('path');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join('C:/Users/gilad/smart_traveller_local', url);
  const ext = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8080, () => console.log('Server running on http://localhost:8080'));
