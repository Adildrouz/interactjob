/**
 * Shared safety guard for any code path that's about to replace data/jobs.json
 * wholesale — used by both github-sync.js (pulling from GitHub) and agent.js
 * (writing the merged/enriched result). Exists because two separate incidents
 * (2026-07-18 and 2026-07-19/20) each silently overwrote a good jobs.json with
 * a stale snapshot missing dozens of Direct offers — this makes that class of
 * bug abort loudly instead of writing.
 */

const DROP_THRESHOLD = 0.2; // abort if more than 20% of jobs (or Direct jobs) would vanish

// Typed so callers can tell a guard abort from an ordinary failure and alert on it.
export class JobsSafetyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JobsSafetyError';
  }
}

// Per-offer check, independent of any percentage: an automated run must never
// remove a Direct offer or flip it to expired unless it was manually closed.
// The 20% count guard above cannot see this — flipping expired:true leaves the
// count unchanged, and gradual deletions of a few offers per run stay under
// the threshold (both happened 2026-08-16 to 2026-09-26, 70 -> 13 Direct offers).
export function assertDirectOffersIntact(beforeJobs, afterJobs, context) {
  if (!Array.isArray(beforeJobs) || !Array.isArray(afterJobs)) return;

  const afterById = new Map(afterJobs.filter((j) => j.source === 'Direct').map((j) => [j.id, j]));
  const removed = [];
  const expired = [];

  for (const before of beforeJobs) {
    if (before.source !== 'Direct') continue;
    const after = afterById.get(before.id);
    if (!after) {
      if (before.manually_closed !== true) removed.push(before);
    } else if (before.expired !== true && after.expired === true && after.manually_closed !== true) {
      expired.push(after);
    }
  }

  if (removed.length === 0 && expired.length === 0) return;

  const label = (j) => `${String(j.id).slice(0, 8)} "${String(j.title || '').slice(0, 40)}"`;
  const parts = [];
  if (removed.length) parts.push(`${removed.length} removed (${removed.slice(0, 5).map(label).join(', ')}${removed.length > 5 ? ', …' : ''})`);
  if (expired.length) parts.push(`${expired.length} auto-expired (${expired.slice(0, 5).map(label).join(', ')}${expired.length > 5 ? ', …' : ''})`);
  throw new JobsSafetyError(
    `${context}: aborted — Direct offers changed without a manual close: ${parts.join('; ')}`
  );
}

export function assertNoSuspiciousDrop(beforeJobs, afterJobs, context) {
  if (!Array.isArray(beforeJobs) || beforeJobs.length === 0) return; // nothing to compare against yet

  const countDrop = (beforeJobs.length - afterJobs.length) / beforeJobs.length;
  if (countDrop > DROP_THRESHOLD) {
    throw new JobsSafetyError(
      `${context}: aborted — total job count would drop from ${beforeJobs.length} to ${afterJobs.length} ` +
      `(${(countDrop * 100).toFixed(1)}%, threshold ${DROP_THRESHOLD * 100}%)`
    );
  }

  const directBefore = beforeJobs.filter((j) => j.source === 'Direct').length;
  const directAfter  = afterJobs.filter((j) => j.source === 'Direct').length;
  if (directBefore > 0) {
    const directDrop = (directBefore - directAfter) / directBefore;
    if (directDrop > DROP_THRESHOLD) {
      throw new JobsSafetyError(
        `${context}: aborted — Direct offer count would drop from ${directBefore} to ${directAfter} ` +
        `(${(directDrop * 100).toFixed(1)}%, threshold ${DROP_THRESHOLD * 100}%)`
      );
    }
  }
}
