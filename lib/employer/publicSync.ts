/**
 * Employer-posted offers (JobOffer, Mongo) are invisible to candidates until
 * they're mirrored into data/jobs.json — the flat file every public page
 * (/offres, /offres/[slug], sitemap, /api/apply) actually reads. This is the
 * same "Direct" job shape/pipeline the admin-approved manual submissions use
 * (see app/api/admin/jobs/approve/[id]/route.ts), just triggered from the
 * employer-space approve/edit/close paths instead.
 *
 * employer_id + job_offer_id are carried on the jobs.json entry so
 * /api/apply can attribute an application back to the right employer.
 */
import { promises as fs } from 'fs';
import path from 'path';
import {
  githubConfigured,
  readJsonFromGithub,
  commitJsonFilesToGithub,
} from '@/lib/github-data';
import { safeTruncate } from '@/lib/utils';
import type { IJobOffer } from '@/lib/models/JobOffer';
import type { IEmployer } from '@/lib/models/Employer';

const JOBS_REL = 'data/jobs.json';
const JOBS_PATH = path.join(process.cwd(), JOBS_REL);

function toSlug(title: string, city: string): string {
  return `${title} ${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function generateColor(str: string): string {
  const colors = [
    '#7C3AED', '#E11D48', '#2563EB', '#059669', '#D97706',
    '#0891B2', '#7C2D12', '#1D4ED8', '#065F46', '#92400E',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return colors[hash % colors.length];
}

function contractTypeToSchema(ct: string): string {
  const map: Record<string, string> = { CDI: 'FULL_TIME', CDD: 'CONTRACTOR', Stage: 'INTERN' };
  return map[ct] || 'OTHER';
}

async function readJobs(): Promise<any[]> {
  const useGithub = githubConfigured();
  try {
    if (useGithub) return await readJsonFromGithub<any[]>(JOBS_REL);
    return JSON.parse(await fs.readFile(JOBS_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

async function writeJobs(jobs: any[], message: string) {
  const useGithub = githubConfigured();
  if (useGithub) {
    await commitJsonFilesToGithub([{ path: JOBS_REL, data: jobs }], message);
  } else {
    await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), 'utf-8');
  }
}

function buildJobEntry(offer: IJobOffer, employer: IEmployer) {
  const now = new Date();
  const offerId = offer._id.toString();
  const slug = toSlug(offer.title, offer.location);
  const isUrlApplication = offer.application_method === 'url' && !!offer.application_url;
  const contactEmail = offer.application_email || employer.email;

  return {
    id: offerId,
    title: offer.title,
    company: employer.company_name,
    companyInitials: employer.company_name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map((w) => w[0]).join('').toUpperCase() || 'XX',
    companyColor: generateColor(employer.company_name),
    city: offer.location,
    sector: offer.sector || 'Autre',
    sectorOther: offer.sector_other || '',
    contractType: offer.contract_type,
    description: offer.description,
    requirements: [],
    salary: offer.salary || null,
    contactEmail: isUrlApplication ? '' : contactEmail,
    source: 'Direct',
    sourceUrl: isUrlApplication ? offer.application_url : null,
    postedAt: now.toISOString().split('T')[0],
    featured: offer.is_sponsored,
    sponsored: offer.is_sponsored,
    slug,
    country: 'Maroc',
    contract_type: offer.contract_type,
    source_site: 'Direct',
    source_url: isUrlApplication ? offer.application_url : null,
    date_posted: now.toISOString().split('T')[0],
    date_scraped: now.toISOString(),
    date_expires: null,
    expired: false,
    manually_closed: false,
    hr_commentary: '',
    meta_title: safeTruncate(`${offer.title} – ${offer.location}`, 60),
    meta_description: safeTruncate(
      `Offre emploi : ${offer.title} chez ${employer.company_name} à ${offer.location}. Candidatez maintenant sur InteractJob.ma.`,
      155
    ),
    linkedin_caption: `${offer.title} chez ${employer.company_name} — ${offer.location}`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: offer.title,
      description: offer.description,
      datePosted: now.toISOString().split('T')[0],
      employmentType: contractTypeToSchema(offer.contract_type),
      jobLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: offer.location, addressCountry: 'MA' },
      },
      hiringOrganization: { '@type': 'Organization', name: employer.company_name },
    },
    // Attribution back to the employer space — read by /api/apply to create
    // an EmployerApplication alongside the normal applications record.
    employer_id: offer.employer_id.toString(),
    job_offer_id: offerId,
  };
}

/** Upsert an active JobOffer into jobs.json (add if new, refresh fields if already present). */
export async function syncOfferToPublicSite(offer: IJobOffer, employer: IEmployer) {
  const jobs = await readJobs();
  const entry = buildJobEntry(offer, employer);
  const idx = jobs.findIndex((j: any) => j.job_offer_id === entry.job_offer_id);
  if (idx >= 0) {
    // Preserve original postedAt/slug so the URL and "posted X days ago" stay stable across edits
    entry.postedAt = jobs[idx].postedAt || entry.postedAt;
    entry.date_posted = jobs[idx].date_posted || entry.date_posted;
    entry.slug = jobs[idx].slug || entry.slug;
    jobs[idx] = entry;
  } else {
    jobs.unshift(entry);
  }
  await writeJobs(jobs, `chore(employer): publish offer "${offer.title}" — ${entry.slug}`);
}

/** Remove a JobOffer from jobs.json — used when an offer is closed, suspended, rejected, or deleted. */
export async function removeOfferFromPublicSite(offerId: string, reason: string) {
  const jobs = await readJobs();
  const idx = jobs.findIndex((j: any) => j.job_offer_id === offerId);
  if (idx === -1) return; // never synced (e.g. rejected before ever going active) — nothing to do
  const [removed] = jobs.splice(idx, 1);
  await writeJobs(jobs, `chore(employer): ${reason} — ${removed.slug || offerId}`);
}
