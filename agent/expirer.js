const MAX_JOBS = 500;

export function expireJobs(jobs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiredCount = 0;

  // Mark expired jobs
  const updated = jobs.map((job) => {
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

  // Trim to MAX_JOBS — remove oldest expired jobs first
  if (updated.length > MAX_JOBS) {
    const active  = updated.filter((j) => !j.expired);
    const expired = updated
      .filter((j) => j.expired)
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
