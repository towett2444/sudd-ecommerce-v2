// Copies everything printed to the terminal into sudd-log.txt in the project
// folder, with a header describing this PC. Send that file when asking for help.
import { appendFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const path = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const logFile = path('sudd-log.txt');

// strip terminal colour codes so the file is readable
const clean = (text) => String(text).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

const write = (text) => {
  try {
    appendFileSync(logFile, `${clean(text)}\n`);
  } catch {
    // never let logging break the app
  }
};

const mongoBinary = () => {
  const dir = path('server/node_modules/.cache/mongodb-memory-server');
  try {
    const exe = readdirSync(dir).find((f) => f.startsWith('mongod') && !f.endsWith('.md5'));
    return exe ? `${exe} (${Math.round(statSync(`${dir}/${exe}`).size / 1e6)} MB)` : 'not downloaded yet';
  } catch {
    return 'not downloaded yet';
  }
};

export const startLog = (command) => {
  write(
    [
      '',
      '='.repeat(70),
      `${new Date().toISOString()}  npm run ${command}`,
      `Node ${process.versions.node} | ${os.type()} ${os.release()} ${os.arch()}`,
      `Project folder: ${path('')}`,
      `Terminal folder: ${process.cwd()}`,
      `server/node_modules: ${existsSync(path('server/node_modules/express')) ? 'yes' : 'NO'}`,
      `client/node_modules: ${existsSync(path('client/node_modules/vite')) ? 'yes' : 'NO'}`,
      `server/.env: ${existsSync(path('server/.env')) ? 'yes' : 'NO'}`,
      `client/.env: ${existsSync(path('client/.env')) ? 'yes' : 'NO'}`,
      `MongoDB program: ${mongoBinary()}`,
      '='.repeat(70),
    ].join('\n'),
  );

  for (const method of ['log', 'error', 'warn']) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
      original(...args);
      write(args.join(' '));
    };
  }

  process.on('uncaughtException', (error) => {
    console.error('Unexpected error:', error?.stack || error);
    process.exit(1);
  });

  process.on('exit', (code) => write(`--- finished (exit code ${code}) ---`));
};
