import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createServer } from '../scripts/server.mjs';
let server, base, directory;
before(async () => {
  directory = mkdtempSync(path.join(os.tmpdir(), 'vizlab-http-'));
  writeFileSync(path.join(directory, 'index.html'), '<main>OK</main>');
  mkdirSync(path.join(directory, '_assets'));
  writeFileSync(path.join(directory, '_assets/code.0123456789abcdef.js'), 'let a=1;');
  server = createServer(directory);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(directory, { recursive: true });
});
function raw(route) {
  return new Promise((resolve, reject) => {
    http
      .get(base + route, (r) => {
        r.resume();
        r.on('end', () => resolve(r.statusCode));
      })
      .on('error', reject);
  });
}
test('HTML is refreshable and hashed resources are immutable', async () => {
  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.equal(home.headers.get('cache-control'), 'no-cache');
  assert.match(await home.text(), /OK/);
  const code = await fetch(base + '/_assets/code.0123456789abcdef.js');
  assert.match(code.headers.get('content-type'), /javascript/);
  assert.match(code.headers.get('cache-control'), /immutable/);
});
test('blocks source traversal, hidden files and malformed paths', async () => {
  for (const route of ['/%2e%2e%2fpackage.json', '/.git/config', '/%5c..%5cpackage.json', '/%00'])
    assert.ok([400, 403].includes(await raw(route)), route);
  assert.equal(await raw('/%ZZ'), 400);
  assert.equal((await fetch(base + '/missing.html')).status, 404);
});
test('only GET and HEAD are allowed', async () => {
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  const head = await fetch(base + '/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
