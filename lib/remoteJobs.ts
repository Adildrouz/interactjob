// Remote jobs have no explicit expiry field — agent/remote-scraper.js already
// prunes data/remote-jobs.json down to a rolling 7-day window (KEEP_DAYS), so
// no listing is ever actually older than that in practice. This constant is
// the "how long do we tell Google this posting stays valid" window used
// consistently for the sitemap cutoff, JobPosting validThrough, and robots —
// previously these three disagreed (90d sitemap cutoff vs 60d validThrough,
// robots not conditioned on age at all).
export const REMOTE_JOB_VALID_DAYS = 30;

export function isRemoteJobExpired(published: string | null | undefined): boolean {
  if (!published) return false;
  const ageMs = Date.now() - new Date(published).getTime();
  return ageMs > REMOTE_JOB_VALID_DAYS * 24 * 60 * 60 * 1000;
}
