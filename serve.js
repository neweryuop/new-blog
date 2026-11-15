import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.md':   'text/markdown; charset=utf-8'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  console.log('[req]', req.method, urlPath);

  // 候选路径：先原样，再补 .html，再当目录找 index.html
  const candidates = [];

  if (urlPath === '/') {
    candidates.push('/index.html');
  } else if (urlPath.endsWith('/')) {
    candidates.push(urlPath + 'index.html');
  } else {
    candidates.push(urlPath);
    candidates.push(urlPath + '.html');
    candidates.push(urlPath + '/index.html');
  }

  let idx = 0;

  function tryNext() {
    if (idx >= candidates.length) {
      console.log('[404]', urlPath, '→ tried:');
      candidates.forEach(c => console.log('       ', c));
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(
        '404 Not Found: ' + urlPath + '\n\n' +
        'Tried:\n  ' + candidates.join('\n  ') + '\n\n' +
        'Root: ' + ROOT + '\n'
      );
      return;
    }

    const candidate = candidates[idx++];
    const filePath = path.join(ROOT, candidate);

    if (!filePath.startsWith(ROOT)) {
      tryNext();
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        tryNext();
        return;
      }
      console.log('[ok]  ', candidate);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
  }

  tryNext();
}).listen(PORT, () => {
  console.log('\n  Blue Hour running at http://localhost:' + PORT);
  console.log('  Root:', ROOT);
  console.log('  Press Ctrl+C to stop.\n');
});