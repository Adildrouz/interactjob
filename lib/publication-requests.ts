import { createHash } from 'crypto';
import { connectDB } from '@/lib/db';

export interface PublicationRequest {
  id: string;
  title: string;
  company: string;
  applicantEmail: string;
  submittedAt: string;
  status: string;
  [key: string]: unknown;
}

async function collection() {
  const mongoose = await connectDB();
  if (!mongoose.connection.db) throw new Error('Publication database unavailable');
  return mongoose.connection.db.collection<PublicationRequest>('publication_requests');
}

/** A request is acknowledged only after durable storage, independently of GitHub. */
export async function savePublicationRequest(job: PublicationRequest, submissionKey?: string) {
  const rows = await collection();
  await rows.createIndex({ dedupeKey: 1 }, { unique: true });
  // Bind retries to the complete content, not just a client-controlled ID.
  const content = Object.fromEntries(Object.entries(job).filter(([key]) => key !== 'id' && key !== 'submittedAt'));
  const dedupeKey = createHash('sha256').update(JSON.stringify([submissionKey || job.id, content])).digest('hex');
  let created = false;
  try {
    const result = await rows.updateOne({ dedupeKey }, { $setOnInsert: { ...job, dedupeKey } }, { upsert: true });
    created = result.upsertedCount === 1;
  } catch (error) {
    // Two overlapping retries can race at the unique index. The winner's
    // durable receipt is the correct result for both callers.
    if ((error as { code?: number }).code !== 11000) throw error;
  }
  const stored = await rows.findOne({ dedupeKey });
  if (!stored) throw new Error('Missing durable publication receipt');
  return { reference: stored.id, created };
}

export async function publicationRequests() {
  const rows = await collection();
  return rows.find({}, { projection: { _id: 0, dedupeKey: 0 } }).sort({ submittedAt: -1 }).toArray();
}

export async function resolvePublicationRequest(id: string, status: 'approved' | 'rejected') {
  if (!process.env.MONGODB_URI) return;
  const rows = await collection();
  await rows.updateOne({ id }, { $set: { status, resolvedAt: new Date().toISOString() } });
}
