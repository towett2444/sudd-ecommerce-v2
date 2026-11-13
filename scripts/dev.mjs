// Starts the API (with a local MongoDB) and the store together.
// Usage (from the project folder): npm run dev
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkNode } from './check-node.mjs';
import { startLog } from './log.mjs';

startLog('dev');

checkNode();

const path = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

if (
  !existsSync(path('server/node_modules/express')) ||
  !existsSync(path('client/node_modules/vite')) ||
  !existsSync(path('server/.env')) ||
  !existsSync(path('client/.env'))
) {
  console.error('\nThe project is not set up yet. Run this first:  npm run setup\n');
  process.exit(1);
}

const run = (name, dir, script) => {
  const child = spawn(`npm run ${script}`, {
    cwd: path(dir),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const prefix = (chunk) =>
    chunk
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => `[${name}] ${line}`)
      .join('\n');

  child.stdout.on('data', (chunk) => console.log(prefix(chunk)));
  child.stderr.on('data', (chunk) => console.error(prefix(chunk)));
  child.on('exit', (code) => {
    console.log(`[${name}] stopped${code ? ` (exit code ${code})` : ''}`);
    process.exit(code || 0);
  });

  return child;
};

// read PORT from server/.env (defaults to 8000)
const envText = readFileSync(path('server/.env'), 'utf8');
const port = envText.match(/^PORT=(\d+)/m)?.[1] || '8000';
const healthUrl = `http://localhost:${port}/test`;

const isServerUp = async () => {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(2000) });
    const body = await response.json();
    return body?.message === 'API running...';
  } catch {
    return false;
  }
};

const portAnswers = async () => {
  try {
    await fetch(healthUrl, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
};

const fail = (lines) => {
  console.error(`\n${'='.repeat(70)}\n${lines.join('\n')}\n${'='.repeat(70)}\n`);
  process.exit(1);
};

// Something else is already using the API port
if (await portAnswers()) {
  fail([
    `Port ${port} is already in use by another program.`,
    `Close that program, or change PORT in server/.env and VITE_API_URL in client/.env`,
    `(for example PORT=8001 and VITE_API_URL=http://localhost:8001/api/v1).`,
  ]);
}

console.log('\nStarting Sudd Shop... (press Ctrl+C to stop)\n');
console.log('Step 1/2: starting the database and API server.');
console.log('          The FIRST run may download MongoDB (~780 MB). Please wait.\n');

const server = run('server', 'server', 'dev:local');

let serverExited = false;
server.on('exit', () => {
  serverExited = true;
});

// wait for the API to answer before opening the store
const started = Date.now();
let lastNotice = started;

while (!(await isServerUp())) {
  if (serverExited) {
    fail([
      'The API server stopped before it was ready. Read the [server] lines above',
      'for the reason. Common fixes:',
      ' - No internet / download failed: check the connection and run again.',
      ' - MongoDB will not start on this PC: install the "Microsoft Visual C++',
      '   Redistributable (x64)", or put a MongoDB Atlas connection string in',
      '   MONGODB_URI in server/.env to skip the local database.',
    ]);
  }

  if (Date.now() - lastNotice > 20000) {
    lastNotice = Date.now();
    const seconds = Math.round((Date.now() - started) / 1000);
    console.log(`... still waiting for the API server (${seconds}s). Do not close this window.`);
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
}

console.log(`\nStep 2/2: API server is ready at http://localhost:${port}. Starting the store...\n`);

run('client', 'client', 'dev');

console.log('\nOpen the store at the address in the [client] "Local:" line (usually http://localhost:5173).\n');
