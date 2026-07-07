/**
 * Raw MongoDB access for the concours pipeline (agent side) — same house
 * pattern as agent/alerts-sender.js: connect-per-run with MongoClient, no ODM.
 * The Next.js app reads/writes the same `concours` collection via Mongoose
 * (models/Concours.ts).
 *
 * Dev vs prod DB selection: pass --dev on the CLI, or set CONCOURS_ENV=dev,
 * to point at MONGODB_URI_DEV instead of MONGODB_URI. This is what keeps
 * local test runs from ever touching production data.
 */

import { MongoClient } from 'mongodb';

const COLLECTION = 'concours';

function isDevMode() {
  return process.argv.includes('--dev') || process.env.CONCOURS_ENV === 'dev';
}

/**
 * Prod and dev URIs point at the SAME cluster, different logical databases
 * (interactjob vs interactjob_dev) — the DB name always comes from the URI's
 * own path, never hardcoded, so dev runs can't accidentally land in prod.
 */
function dbNameFromUri(uri) {
  const name = new URL(uri).pathname.replace(/^\//, '');
  if (!name) throw new Error('MongoDB URI has no database name in its path');
  return name;
}

export async function connectConcoursCollection() {
  const dev = isDevMode();
  const uri = dev ? process.env.MONGODB_URI_DEV : process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(`${dev ? 'MONGODB_URI_DEV' : 'MONGODB_URI'} is not defined`);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbNameFromUri(uri)).collection(COLLECTION);
  return { client, col, dev };
}
