import { readdirSync, readFileSync } from 'node:fs';
import { run, python } from './tasks.mjs';
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(dir + '/' + e.name) : [dir + '/' + e.name],
  );
}
try {
  for (const file of [...files('src'), ...files('scripts'), ...files('tests')].filter((p) =>
    /\.(js|mjs)$/.test(p),
  ))
    run(process.execPath, ['--check', file]);
  run(python(), [
    '-c',
    'import sys; sys.path.insert(0,"scripts"); from buildlib import load_registry; print("Registry:", len(load_registry()), "screens")',
  ]);
  for (const file of ['LICENSE', 'CONTRIBUTING.md', 'THIRD_PARTY_NOTICES.md'])
    if (!readFileSync(file).length) throw new Error('Missing ' + file);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
