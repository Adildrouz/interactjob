import { postJobsToLinkedIn, directJobNeedsSharing } from './linkedin.js';
import { isActiveDirectJob } from './direct-job-sharing.js';
import { log } from './logger.js';

let running = false;

export async function shareDirectJobs(siteUrl) {
  if (running) return;
  running = true;
  try {
    if (!process.env.LINKEDIN_ACCESS_TOKEN && !(process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_CHANNEL_ID)) {
      log('LinkedIn direct: aucun compte de diffusion configuré');
      return;
    }
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    if (!token || !repo) throw new Error('Lecture des offres directes impossible : accès GitHub manquant');
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/data/jobs.json?ref=main`, {
      headers, signal: AbortSignal.timeout(30000), cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Lecture des offres : HTTP ${response.status}`);
    const file = await response.json();
    let encoded = file.content;
    if (!encoded && file.sha) {
      const blob = await fetch(`https://api.github.com/repos/${repo}/git/blobs/${file.sha}`, {
        headers, signal: AbortSignal.timeout(30000),
      });
      if (!blob.ok) throw new Error(`Lecture des offres : HTTP ${blob.status}`);
      encoded = (await blob.json()).content;
    }
    if (!encoded) throw new Error('Fichier des offres vide ou indisponible');
    const jobs = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    if (!Array.isArray(jobs)) throw new Error('Format des offres invalide');
    const pending = jobs.filter(job => isActiveDirectJob(job) && directJobNeedsSharing(job))
      .sort((a, b) => new Date(b.postedAt || b.date_posted) - new Date(a.postedAt || a.date_posted));
    log(`LinkedIn direct: ${pending.length} offre(s) en attente de diffusion`);
    await postJobsToLinkedIn(pending, siteUrl, { maxPosts: 1 });
  } finally { running = false; }
}
