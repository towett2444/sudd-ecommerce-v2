// Local development: starts a MongoDB server on this machine (data kept in
// server/.local-db so it survives restarts), then starts the API.
// If MONGODB_URI is set in server/.env, that database is used instead and
// nothing is downloaded.
// Usage: npm run dev:local
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
});

if (process.env.MONGODB_URI) {
  console.log('Using the database from MONGODB_URI in server/.env');
} else {
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  const dbPath = fileURLToPath(new URL('../.local-db', import.meta.url));
  mkdirSync(dbPath, { recursive: true });

  // Use the MongoDB binary downloaded during npm install, whatever folder we run from
  const binaryDir = fileURLToPath(
    new URL('../node_modules/.cache/mongodb-memory-server', import.meta.url),
  );

  console.log(
    'Starting local MongoDB (the first run may download it, which can take a while)...',
  );

  let mongo;

  try {
    mongo = await MongoMemoryServer.create({
      binary: { downloadDir: binaryDir, version: '8.2.6' },
      instance: { port: 27018, dbPath, storageEngine: 'wiredTiger' },
    });
  } catch (error) {
    console.error('\nCould not start the local MongoDB database:');
    console.error(error.message);
    console.error(
      '\nFix: check the internet connection (first run downloads MongoDB), install the\n' +
        '"Microsoft Visual C++ Redistributable (x64)" from Microsoft, or set MONGODB_URI\n' +
        'in server/.env to a MongoDB Atlas connection string.\n',
    );
    process.exit(1);
  }

  process.env.MONGODB_URI = mongo.getUri('sudd-shop');
  console.log(`Local MongoDB running at ${process.env.MONGODB_URI}`);

  const stop = async () => {
    await mongo.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

await import('../src/server.js');
