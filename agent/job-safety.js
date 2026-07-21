/**
 * Shared safety guard for any code path that's about to replace data/jobs.json
 * wholesale — used by both github-sync.js (pulling from GitHub) and agent.js
 * (writing the merged/enriched result). Exists because two separate incidents
 * (2026-07-18 and 2026-07-19/20) each silently overwrote a good jobs.json with
 * a stale snapshot missing dozens of Direct offers — this makes that class of
 * bug abort loudly instead of writing.
 */

const DROP_THRESHOLD = 0.2; // abort if more than 20% of jobs (or Direct jobs) would vanish

export function assertNoSuspiciousDrop(beforeJobs, afterJobs, context) {
  if (!Array.isArray(beforeJobs) || beforeJobs.length === 0) return; // nothing to compare against yet

  const countDrop = (beforeJobs.length - afterJobs.length) / beforeJobs.length;
  if (countDrop > DROP_THRESHOLD) {
    throw new Error(
      `${context}: aborted — total job count would drop from ${beforeJobs.length} to ${afterJobs.length} ` +
      `(${(countDrop * 100).toFixed(1)}%, threshold ${DROP_THRESHOLD * 100}%)`
    );
  }

  const directBefore = beforeJobs.filter((j) => j.source === 'Direct').length;
  const directAfter  = afterJobs.filter((j) => j.source === 'Direct').length;
  if (directBefore > 0) {
    const directDrop = (directBefore - directAfter) / directBefore;
    if (directDrop > DROP_THRESHOLD) {
      throw new Error(
        `${context}: aborted — Direct offer count would drop from ${directBefore} to ${directAfter} ` +
        `(${(directDrop * 100).toFixed(1)}%, threshold ${DROP_THRESHOLD * 100}%)`
      );
    }
  }
}
