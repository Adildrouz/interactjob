const MAX_JOBS = 500;

// Direct offers (source === "Direct", employer-posted via the admin
// approval flow) never auto-expire and are never eligible for the
// MAX_JOBS trim below — they stay active until manually closed via
// app/api/admin/jobs/close/[id]. This exemption is the fix for a real
// incident: 36 Direct offers were silently hard-deleted between
// 2026-07-11 and 2026-07-17 because this function previously applied
// the same 30-day fallback expiry and trim to every job regardless of
// source (see fix/direct-offers-expiry investigation). Scraped/RSS/
// remote jobs are completely unaffected by this change.
function isDirect(job) {
  return job.source === 'Direct';
}

export function expireJobs(jobs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiredCount = 0;

  // Mark expired jobs
  const updated = jobs.map((job) => {
    if (isDirect(job)) return job; // never auto-expire Direct offers
    if (job.expired) return job; // already expired, leave it

    // Use agent field first, fall back to website field
    const expiryStr = job.date_expires || null;
    // For legacy website jobs with no date_expires, compute from postedAt + 30 days
    const postedStr = job.date_posted || job.postedAt;

    let expiryDate;
    if (expiryStr) {
      expiryDate = new Date(expiryStr);
    } else if (postedStr) {
      expiryDate = new Date(new Date(postedStr).getTime() + 30 * 86400000);
    } else {
      return job; // no date info — leave untouched
    }

    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      expiredCount++;
      return { ...job, expired: true, schema: null };
    }
    return job;
  });

  // Trim to MAX_JOBS — remove oldest expired jobs first. Direct offers are
  // never in the trim-eligible pool, even defensively (a manually-closed
  // Direct offer keeps expired:true for its "Poste pourvu" badge, but must
  // never be hard-deleted — it stays for SEO per the manual-close design).
  if (updated.length > MAX_JOBS) {
    const active  = updated.filter((j) => isDirect(j) || !j.expired);
    const expired = updated
      .filter((j) => !isDirect(j) && j.expired)
      .sort((a, b) => {
        const da = new Date(a.date_posted || a.postedAt || 0).getTime();
        const db = new Date(b.date_posted || b.postedAt || 0).getTime();
        return da - db; // oldest first
      });

    const toKeep = MAX_JOBS - active.length;
    const trimmedExpired = toKeep > 0 ? expired.slice(expired.length - toKeep) : [];

    return { jobs: [...active, ...trimmedExpired], expiredCount };
  }

  return { jobs: updated, expiredCount };
}
