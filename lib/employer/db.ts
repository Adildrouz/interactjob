/**
 * Employer Space always connects to MONGODB_URI_DEV during local dev.
 * In production, swap MONGODB_URI_DEV to the production cluster URI.
 */
import mongoose from 'mongoose';

interface Cache { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
declare global { var _employerDbCache: Cache | undefined }
const cached: Cache = global._employerDbCache ?? { conn: null, promise: null };
global._employerDbCache = cached;

export async function connectEmployerDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI_DEV;
  if (!uri) throw new Error('MONGODB_URI_DEV not set in .env.local');
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
