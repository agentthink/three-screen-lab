import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
export function python() {
  const local = path.join(
    root,
    '.venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
  );
  if (existsSync(local)) return local;
  for (const command of ['python3', 'python']) {
    if (spawnSync(command, ['-c', 'import sys; assert sys.version_info >= (3, 10)']).status === 0)
      return command;
  }
  throw new Error('Python 3.10+ is required. Install Python, then run npm run setup.');
}
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${path.basename(command)} exited with ${result.status}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [task, ...args] = process.argv.slice(2);
  try {
    if (task === 'build') run(python(), ['scripts/build.py', ...args]);
    else if (task === 'format-python') run(python(), ['-m', 'black', 'scripts', 'tests', ...args]);
    else if (task === 'test')
      run(python(), ['-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py']);
    else throw new Error('Unknown task: ' + task);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
