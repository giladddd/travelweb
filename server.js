const http = require('http');
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');
const tls  = require('tls');
const net  = require('net');

// ── Gmail SMTP (no npm) ──────────────────────────────────────────────────────
// Set env vars before starting: EMAIL_PASS=your-gmail-app-password
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;
const EMAIL_USER = process.env.EMAIL_USER || 'thesmarttravel3@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

function base64(str) { return Buffer.from(str, 'utf8').toString('base64'); }

function sendEmail({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    if (!EMAIL_PASS) return reject(new Error('EMAIL_PASS not set'));
    const boundary = 'boundary_' + Date.now();
    const message = [
      `From: =?UTF-8?B?${base64('המטייל החכם')}?= <${EMAIL_USER}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${base64(subject)}?=`,
      'MIME-Version: 1.0',
      `Content-Type: text/html; charset=UTF-8`,
      '',
      html
    ].join('\r\n');

    let socket = net.createConnection(SMTP_PORT, SMTP_HOST);
    let secure = false;
    let buf = '';
    let step = 0;

    function send(cmd) { (secure ? socket : socket).write(cmd + '\r\n'); }

    function onData(data) {
      buf += data.toString();
      const lines = buf.split('\r\n');
      buf = lines.pop();
      for (const line of lines) {
        const code = parseInt(line);
        if (isNaN(code)) continue;
        if (step === 0 && code === 220) { step=1; send('EHLO localhost'); }
        else if (step === 1 && code === 250) { step=2; send('STARTTLS'); }
        else if (step === 2 && code === 220) {
          step=3;
          const upgraded = tls.connect({ socket, host: SMTP_HOST, servername: SMTP_HOST }, () => {
            socket = upgraded;
            socket.on('data', onData);
            send('EHLO localhost');
          });
          return;
        }
        else if (step === 3 && code === 250) { step=4; send('AUTH LOGIN'); }
        else if (step === 4 && code === 334) { step=5; send(base64(EMAIL_USER)); }
        else if (step === 5 && code === 334) { step=6; send(base64(EMAIL_PASS)); }
        else if (step === 6 && code === 235) { step=7; send(`MAIL FROM:<${EMAIL_USER}>`); }
        else if (step === 7 && code === 250) { step=8; send(`RCPT TO:<${to}>`); }
        else if (step === 8 && code === 250) { step=9; send('DATA'); }
        else if (step === 9 && code === 354) { step=10; send(message + '\r\n.'); }
        else if (step === 10 && code === 250) { step=11; send('QUIT'); resolve(); }
        else if (code >= 400) { reject(new Error('SMTP error: ' + line)); send('QUIT'); }
      }
    }
    socket.on('data', onData);
    socket.on('error', reject);
    socket.on('timeout', () => reject(new Error('SMTP timeout')));
    socket.setTimeout(15000);
  });
}

async function handleSendOrder(req, res) {
  let body = '';
  req.on('data', d => body += d);
  req.on('end', async () => {
    try {
      const order = JSON.parse(body);
      const { name, phone, email, gender, flightDate, address, notes, cart } = order;

      const cartHtml = (cart || []).map(i => {
        const p = parseFloat((i.price||'').toString().replace(/[^\d.]/g,'')) || 0;
        const vars = i.variations ? (typeof i.variations === 'string' ? i.variations
          : Object.entries(i.variations).map(([k,v])=>k+': '+v).join(' | ')) : '';
        return `<tr><td>${i.qty||1} × ${i.name}${vars?' ('+vars+')':''}</td><td>₪${p.toFixed(2)}</td></tr>`;
      }).join('');

      const businessHtml = `<div dir="rtl" style="font-family:Arial;font-size:15px">
        <h2>הזמנה חדשה 🎒</h2>
        <p><b>שם:</b> ${name}</p>
        <p><b>טלפון:</b> ${phone}</p>
        ${email ? `<p><b>מייל:</b> ${email}</p>` : ''}
        ${gender ? `<p><b>מין:</b> ${gender}</p>` : ''}
        ${flightDate ? `<p><b>תאריך טיסה:</b> ${flightDate}</p>` : ''}
        ${address ? `<p><b>כתובת:</b> ${address}</p>` : ''}
        ${notes ? `<p><b>הערות:</b> ${notes}</p>` : ''}
        <h3>מוצרים:</h3>
        <table border="1" cellpadding="6" style="border-collapse:collapse">
          <tr><th>פריט</th><th>מחיר</th></tr>${cartHtml}
        </table>
      </div>`;

      const customerHtml = `<div dir="rtl" style="font-family:Arial;font-size:15px">
        <h2>שלום ${name} 👋</h2>
        <p>קיבלנו את הזמנתך ונחזור אליך בהקדם לתיאום!</p>
        <p>לכל שאלה: <a href="https://wa.me/972523960215">WhatsApp</a> | ${EMAIL_USER}</p>
        <p>צוות המטייל החכם 🎒</p>
      </div>`;

      await sendEmail({ to: EMAIL_USER, subject: `הזמנה חדשה מ-${name}`, html: businessHtml });
      if (email) await sendEmail({ to: email, subject: 'ההזמנה שלך התקבלה – המטייל החכם', html: customerHtml });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Email error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  });
}

const PORT = process.env.PORT || 8080;
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
  // Send order email endpoint
  if (req.method === 'POST' && req.url === '/api/send-order') {
    return handleSendOrder(req, res);
  }

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
