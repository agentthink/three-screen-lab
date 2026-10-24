import http from 'node:http';
import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './tasks.mjs';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.zip': 'application/zip',
  '.md': 'text/plain; charset=utf-8',
};
export function createServer(directory = path.join(root, 'dist')) {
  const base = path.resolve(directory);
  return http.createServer((request, response) => {
    const reject = (code) => {
      response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(http.STATUS_CODES[code]);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      reject(405);
      return;
    }
    let route;
    try {
      route = decodeURIComponent(request.url.split('?')[0]);
    } catch {
      reject(400);
      return;
    }
    if (route.includes('\0') || route.includes('\\')) {
      reject(400);
      return;
    }
    const file = path.resolve(base, '.' + (route.endsWith('/') ? route + 'index.html' : route));
    if (
      !file.startsWith(base + path.sep) ||
      route.split('/').some((part) => part.startsWith('.'))
    ) {
      reject(403);
      return;
    }
    try {
      if (
        !statSync(file).isFile() ||
        !realpathSync(file).startsWith(realpathSync(base) + path.sep)
      ) {
        reject(403);
        return;
      }
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader(
        'Cache-Control',
        /\.[a-f0-9]{16}\./.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache',
      );
      response.setHeader('Content-Length', statSync(file).size);
      response.writeHead(200);
      if (request.method === 'HEAD') response.end();
      else createReadStream(file).pipe(response);
    } catch {
      reject(404);
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!existsSync(path.join(root, 'dist/home.html'))) {
    console.error('Run npm run build first, or use npm run dev.');
    process.exitCode = 1;
  } else {
    const server = createServer();
    server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () =>
      console.log(`Preview: http://127.0.0.1:${server.address().port}/home.html`),
    );
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
  }
}
