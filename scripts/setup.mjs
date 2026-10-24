import path from 'node:path';
import { python, root, run } from './tasks.mjs';
try {
  run(python(), ['-m', 'venv', '.venv']);
  const local = path.join(
    root,
    '.venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
  );
  run(local, ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', 'requirements.txt']);
  console.log('Ready. Run npm run dev.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
