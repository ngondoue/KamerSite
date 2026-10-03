import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Starting an in-memory Mongo + a real server can take a while on the
// first run (binary download), so give it more room than Jest's default.
jest.setTimeout(30000);

// Jest runs each test FILE in its own worker process by default, and
// every one of them imports this file and spawns its own server. A
// single hardcoded port means only one worker's server actually binds
// it -- every other file's HTTP requests then silently land on that one
// "winning" server, which is backed by a different in-memory database
// than the one that file seeded, causing spurious 401s and, once that
// file's afterAll() kills its server, ECONNREFUSED/ECONNRESET in
// whichever files are still running. JEST_WORKER_ID is set by Jest
// itself and is unique per worker, so offsetting by it gives each test
// file its own port.
const TEST_PORT =
    process.env.TEST_PORT ||
    5099 + Number(process.env.JEST_WORKER_ID || 0);
export const BASE_URL = `http://localhost:${TEST_PORT}`;
// Also exposed as a global for convenience/back-compat with any test
// file that reaches for it instead of importing BASE_URL directly.
global.API_URL = BASE_URL;

let mongod;
let serverProcess;

// Polls a TCP port until something is listening on it, or gives up
// after timeoutMs. Doesn't assume any particular route exists -- it
// only checks that the server has started accepting connections.
function waitForPort(port, host, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const socket = net.createConnection(port, host);

      socket.once('connect', () => {
        socket.end();
        resolve();
      });

      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`server.js did not start listening on port ${port} within ${timeoutMs}ms`));
        } else {
          setTimeout(tryConnect, 150);
        }
      });
    }
    tryConnect();
  });
}

beforeAll(async () => {
  let mongoUri = process.env.TEST_MONGODB_URI;

  if (!mongoUri) {
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
  }

  // Connect mongoose in THIS (Jest) process too, so test files can seed
  // or inspect data directly through the models (e.g. Category.create,
  // Review.findOne) in addition to hitting the API over HTTP.
  await mongoose.connect(mongoUri);

  const serverPath = path.join(__dirname, '..', 'server.js');

  serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      MONGODB_URI: mongoUri,
      JWT_SECRET: 'test_jwt_secret',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Surface anything the server prints to stderr -- makes a broken
  // test run much easier to debug than a silent timeout.
  serverProcess.stderr.on('data', (chunk) => {
    console.error(`[server.js] ${chunk}`);
  });

  await waitForPort(TEST_PORT, 'localhost', 20000);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) {
    await mongod.stop();
  }
});
