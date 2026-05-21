import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { log } from './logger.js';

// Palette that matches the website's existing company colors
const COLORS = [
  '#7C3AED', '#E11D48', '#2563EB', '#059669', '#D97706',
  '#0891B2', '#7C2D12', '#1D4ED8', '#065F46', '#92400E',
  '#6D28D9', '#DC2626', '#047857', '#B45309', '#0369A1',
  '#BE185D', '#0F766E', '#C2410C', '#4338CA', '#0284C7',
];

function generateColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return COLORS[hash % COLORS.length];
}

function getInitials(company) {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'XX';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + (words[1][0] || '')).toUpperCase();
}

function toSlug(title, city) {
  return `${title} ${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Map Claude's contract_type to the website's contractType field (CDI | CDD | Stage)
function toWebsiteContractType(ct) {
  if (ct === 'CDI' || ct === 'CDD' || ct === 'Stage') return ct;
  if (ct === 'Intérim') return 'CDD';
  return 'CDI';
}

// Map contract type to schema.org employmentType
function toSchemaEmploymentType(ct) {
  const map = { CDI: 'FULL_TIME', CDD: 'CONTRACTOR', Stage: 'INTERN', Intérim: 'TEMPORARY', Autre: 'OTHER' };
  return map[ct] || 'OTHER';
}

// Allowed sectors in the website
const VALID_SECTORS = [
  'Hôtellerie', 'IT', 'RH', 'Finance', 'Administratif',
  'Commerce', 'Marketing', 'Industrie', 'Santé', 'BTP',
  'Logistique', 'Éducation', 'Autre',
];

function normalizeSector(sector) {
  return VALID_SECTORS.includes(sector) ? sector : 'Autre';
}

const SYSTEM_PROMPT =
  "Tu es un consultant RH expert au Maroc avec 8 ans d'expérience. Réponds UNIQUEMENT en JSON valide, aucun texte avant ou après, aucun markdown.";

function buildUserPrompt(job) {
  const desc = (job.description || '').slice(0, 500);
  return (
    `Offre: ${job.title} | Entreprise: ${job.company} | Ville: ${job.location} | Description: ${desc}\n` +
    `Retourne ce JSON exact:\n` +
    `{\n` +
    `  "hr_commentary": "150 mots français, analyse RH originale, contexte marché marocain, conseil carrière",\n` +
    `  "meta_title": "max 60 caractères avec titre et ville",\n` +
    `  "meta_description": "max 155 caractères accrocheur avec type contrat",\n` +
    `  "linkedin_caption": "post LinkedIn 3 parties : (1) accroche courte avec 2 emojis sur le poste et ${job.location}, (2) 3 bullet points sur les points clés de l'offre, (3) CTA : 'Postuler → https://interactjob.ma/offres/[SLUG]'. Terminer TOUJOURS par : '📲 Offres quotidiennes sur notre chaîne WhatsApp → https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j'. Maximum 250 mots.",\n` +
    `  "sector": "un seul parmi: Hôtellerie|IT|RH|Finance|Administratif|Commerce|Autre",\n` +
    `  "contract_type": "un seul parmi: CDI|CDD|Stage|Intérim|Autre"\n` +
    `}`
  );
}

function fallback(job) {
  return {
    hr_commentary: `Opportunité à saisir : ${job.title} chez ${job.company} à ${job.location}. Ce poste s'inscrit dans la dynamique du marché de l'emploi marocain en pleine croissance. Les candidats motivés trouveront ici une belle occasion de développer leurs compétences dans un environnement professionnel stimulant. Nous vous encourageons à postuler rapidement et à préparer soigneusement votre candidature.`,
    meta_title: `${job.title} – ${job.location}`.slice(0, 60),
    meta_description: `Offre emploi : ${job.title} chez ${job.company} à ${job.location}. Candidatez maintenant sur InteractJob.`.slice(0, 155),
    linkedin_caption: `🇲🇦 ${job.title} chez ${job.company} — ${job.location} 💼 Postulez maintenant !`.slice(0, 200),
    sector: 'Autre',
    contract_type: 'CDI',
  };
}

function buildJobObject(raw, enrichment) {
  const now = new Date();
  const datePosted = raw.date_posted || now.toISOString().split('T')[0];
  const dateExpires = new Date(new Date(datePosted).getTime() + 30 * 86400000)
    .toISOString()
    .split('T')[0];

  const contractType = toWebsiteContractType(enrichment.contract_type);
  const sector = normalizeSector(enrichment.sector);
  const slug = toSlug(raw.title, raw.location);

  // Ensure the caption always has the canonical job URL (slug-based, www, https)
  // Claude sometimes ignores [SLUG] and writes its own URL — we override all interactjob.ma/offres/* URLs
  const canonicalUrl = `https://www.interactjob.ma/offres/${slug}`;
  if (enrichment.linkedin_caption) {
    enrichment.linkedin_caption = enrichment.linkedin_caption
      // Replace [SLUG] placeholder if Claude used it
      .replace(/\[SLUG\]/g, slug)
      // Replace any interactjob.ma/offres/... URL Claude may have generated on its own
      .replace(/https?:\/\/(?:www\.)?interactjob\.ma\/offres\/[^\s\n]*/g, canonicalUrl);
  }

  return {
    // ── Fields the website already uses ──────────────────────────────────
    id:               uuidv4(),
    title:            raw.title,
    company:          raw.company,
    companyInitials:  getInitials(raw.company),
    companyColor:     generateColor(raw.company),
    city:             raw.location,
    sector,
    contractType,                          // website field: CDI | CDD | Stage
    source:           raw.source_site,     // website field: "Rekrute.com" etc.
    sourceUrl:        raw.source_url || null,
    description:      raw.description || '',
    requirements:     [],                  // enriched by Claude in future iterations
    contactEmail:     'jobinteract@gmail.com',
    postedAt:         datePosted,          // website field: YYYY-MM-DD string
    featured:         false,
    sponsored:        false,

    // ── Agent enrichment fields ──────────────────────────────────────────
    slug,
    country:          'Maroc',
    contract_type:    enrichment.contract_type,
    source_site:      raw.source_site,
    source_url:       raw.source_url || null,
    date_posted:      datePosted,
    date_scraped:     now.toISOString(),
    date_expires:     dateExpires,
    expired:          false,
    hr_commentary:    enrichment.hr_commentary,
    meta_title:       enrichment.meta_title,
    meta_description: enrichment.meta_description,
    linkedin_caption: enrichment.linkedin_caption,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title:          raw.title,
      description:    raw.description || '',
      datePosted,
      validThrough:   dateExpires,
      employmentType: toSchemaEmploymentType(contractType),
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type':          'PostalAddress',
          addressLocality:  raw.location,
          addressCountry:   'MA',
        },
      },
      hiringOrganization: {
        '@type': 'Organization',
        name:    raw.company,
      },
    },
  };
}

export async function enrichJobs(rawJobs, testMode = false) {
  if (!process.env.ANTHROPIC_API_KEY) {
    log('AVERTISSEMENT: ANTHROPIC_API_KEY non défini — mode dégradé (fallback pour tous les jobs)');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const enriched = [];
  let failed = 0;

  for (let i = 0; i < rawJobs.length; i++) {
    const job = rawJobs[i];
    let enrichment;

    try {
      const response = await client.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 2048,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: buildUserPrompt(job) }],
      });

      const text = (response.content[0]?.text || '').trim();

      // Strip any accidental markdown fences
      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      enrichment = JSON.parse(clean);

      // Validate minimum required fields
      if (typeof enrichment.hr_commentary !== 'string') throw new Error('hr_commentary manquant');
      if (typeof enrichment.sector !== 'string')        throw new Error('sector manquant');
    } catch (err) {
      log(`  ⚠ Claude fallback pour "${job.title}": ${err.message}`);
      enrichment = fallback(job);
      failed++;
    }

    enriched.push(buildJobObject(job, enrichment));

    // Rate-limit between calls (skip delay after the last one or in test mode)
    if (!testMode && i < rawJobs.length - 1) {
      await sleep(500);
    }
  }

  return { enriched, failed };
}
