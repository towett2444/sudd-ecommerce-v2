// One-time setup: installs dependencies and creates the .env files.
// Usage (from the project folder): npm run setup
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkNode } from './check-node.mjs';
import { startLog } from './log.mjs';

startLog('setup');

checkNode();

const root = fileURLToPath(new URL('..', import.meta.url));
const path = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

// 1. .env files
const serverEnv = path('server/.env');
if (!existsSync(serverEnv)) {
  const text = readFileSync(path('server/.env.example'), 'utf8')
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`)
    .replace(/^ADMIN_EMAIL=.*$/m, 'ADMIN_EMAIL=admin@suddshop.local')
    .replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${randomBytes(9).toString('base64url')}`)
    .replace(/^MPESA_CALLBACK_TOKEN=.*$/m, `MPESA_CALLBACK_TOKEN=${randomBytes(16).toString('hex')}`);
  writeFileSync(serverEnv, text);
  console.log('Created server/.env');
  console.log('Admin sign-in: the ADMIN_EMAIL and ADMIN_PASSWORD lines in server/.env');
}

const clientEnv = path('client/.env');
if (!existsSync(clientEnv)) {
  copyFileSync(path('client/.env.example'), clientEnv);
  console.log('Created client/.env');
}

// 2. dependencies
// run npm install, showing (and logging) its output as it happens
const install = (dir) =>
  new Promise((resolve) => {
    const child = spawn('npm install --no-audit --no-fund', {
      cwd: path(dir),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const print = (chunk) =>
      chunk
        .toString()
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .forEach((line) => console.log(`[${dir}] ${line}`));

    child.stdout.on('data', print);
    child.stderr.on('data', print);
    child.on('exit', (code) => resolve(code));
  });

for (const dir of ['server', 'client']) {
  console.log(
    `\nInstalling ${dir} dependencies (this can take a few minutes${
      dir === 'server' ? ', and downloads the MongoDB database, about 780 MB' : ''
    })...`,
  );

  const code = await install(dir);

  if (code !== 0) {
    console.error(
      `\nInstalling ${dir} failed (exit code ${code}). Check the internet connection and run`,
      '"npm run setup" again. If it keeps failing, send the file sudd-log.txt',
      'from this folder.\n',
    );
    process.exit(1);
  }
}

console.log(`\nSetup complete. Start the project with:  npm run dev\n(in ${root})`);
