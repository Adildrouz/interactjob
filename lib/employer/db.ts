/**
 * Employer Space shares the main app's MongoDB cluster (MONGODB_URI) —
 * same database as jobs/candidates/etc, just different collections
 * (Employer, JobOffer, EmployerApplication). There is no separate
 * employer cluster; MONGODB_URI_DEV never existed in Vercel prod/preview,
 * which meant this connection always failed there.
 */
import mongoose from 'mongoose';

interface Cache { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
declare global { var _employerDbCache: Cache | undefined }
const cached: Cache = global._employerDbCache ?? { conn: null, promise: null };
global._employerDbCache = cached;

export async function connectEmployerDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env.local');
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
