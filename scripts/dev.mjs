import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { python, root } from './tasks.mjs';
import { createServer } from './server.mjs';
let running = false,
  pending = false,
  timer,
  server;
function build() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  const child = spawn(python(), ['scripts/build.py', '--mode', 'web'], {
    cwd: root,
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    running = false;
    if (code === 0 && !server) {
      server = createServer();
      server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () =>
        console.log(
          `Preview: http://127.0.0.1:${server.address().port}/home.html — save source, then refresh`,
        ),
      );
    }
    if (pending) {
      pending = false;
      build();
    }
  });
}
const watchers = ['src', 'config', 'assets'].map((directory) =>
  watch(new URL('../' + directory, import.meta.url), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  }),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    clearTimeout(timer);
    watchers.forEach((w) => w.close());
    server?.close();
  });
build();
