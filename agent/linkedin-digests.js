/**
 * LinkedIn Daily Digest Generator for InteractJob.ma
 *
 * Generates 4 LinkedIn posts from unfeatured jobs (all sectors mixed).
 * Saves them to data/linkedin-queue.txt and sends by email.
 *
 * Post schedule:
 *   08:00 — Offres Matin (batch 1, tous secteurs)
 *   10:00 — Offres Mid   (batch 2, tous secteurs)
 *   12:00 — Offres Midi  (batch 3, tous secteurs)
 *   17:00 — Offres qui expirent bientôt
 *   19:00 — Dernier article blog
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs-extra';
import { log } from './logger.js';
import { sendEmail } from './mailer.js';
import { publishTextPost, publishTextPostToCompany, persistDedupState } from './linkedin.js';
import { logTokenUsage } from './token-tracker.js';

const __dirname       = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const JOBS_PATH     = path.join(__dirname, '../data/jobs.json');
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');
const QUEUE_PATH    = path.join(__dirname, '../data/linkedin-queue.txt');
const PUBLISHED_PATH = path.join(__dirname, '../data/published-posts.json');
const SITE_URL      = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const WA_LINK       = 'https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════

function jobLine(j) {
  return `${j.title} — ${j.city} (${j.contractType})`;
}

function jobUrl(j) {
  return `${SITE_URL}/offres/${j.slug || j.id}`;
}

function formatJobsForPrompt(jobs) {
  return jobs.map((j) => `- ${jobLine(j)}`).join('\n');
}

// Format jobs WITH individual links — used for digest posts
function formatJobsWithLinks(jobs) {
  return jobs.map((j) => `📌 ${j.title}\n📍 ${j.city} | ${j.contractType}\n🔗 ${jobUrl(j)}`).join('\n\n');
}

function loadAllJobs() {
  try { return fs.readJsonSync(JOBS_PATH); } catch { return []; }
}

function loadPublishedPosts() {
  try { return fs.readJsonSync(PUBLISHED_PATH); } catch { return {}; }
}

function savePublishedPost(label, date, postId) {
  const published = loadPublishedPosts();
  const key = `${date}|${label}`;
  published[key] = { date, label, postId, publishedAt: new Date().toISOString() };
  fs.writeJsonSync(PUBLISHED_PATH, published, { spaces: 2 });
}

function loadLatestArticle() {
  try {
    const articles = fs.readJsonSync(ARTICLES_PATH);
    return articles.filter((a) => (a.lang ?? 'fr') === 'fr').sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    )[0] || null;
  } catch { return null; }
}

function loadAllArticles() {
  try {
    const articles = fs.readJsonSync(ARTICLES_PATH);
    return articles.filter((a) => (a.lang ?? 'fr') === 'fr').sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );
  } catch { return []; }
}

function getPublishedArticlesToday() {
  const published = loadPublishedPosts();
  const today = new Date().toISOString().split('T')[0];
  const articlesPostedToday = [];

  for (const [key, value] of Object.entries(published)) {
    if (key.startsWith(today) && key.includes('|article|')) {
      articlesPostedToday.push(value.articleSlug);
    }
  }

  return articlesPostedToday;
}

function savePublishedArticle(articleSlug, date, postId) {
  const published = loadPublishedPosts();
  const key = `${date}|article|${articleSlug}`;
  published[key] = { date, label: 'ARTICLE BLOG', articleSlug, postId, publishedAt: new Date().toISOString() };
  fs.writeJsonSync(PUBLISHED_PATH, published, { spaces: 2 });
}

function getExpiringSoon(allJobs) {
  const in3days = new Date(Date.now() + 3 * 86400000);
  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  return allJobs.filter((j) => {
    if (j.expired) return false;
    const exp = j.date_expires ? new Date(j.date_expires) : null;
    return exp && exp >= today && exp <= in3days;
  }).slice(0, 5);
}

// ── "Unfeatured jobs" pool: jobs never yet highlighted in a digest post ──────
function getUnfeaturedJobs(allJobs) {
  const published = loadPublishedPosts();
  const featuredSlugs = new Set(
    Object.keys(published)
      .filter(k => k.startsWith('digest-job|'))
      .map(k => k.replace('digest-job|', ''))
  );
  return allJobs.filter(j => !j.expired && !featuredSlugs.has(j.slug || j.id));
}

function markDigestJobsAsFeatured(jobs) {
  const published = loadPublishedPosts();
  const now = new Date().toISOString();
  for (const j of jobs) {
    const key = `digest-job|${j.slug || j.id}`;
    if (!published[key]) {
      published[key] = { slug: j.slug || j.id, featuredAt: now };
    }
  }
  fs.writeJsonSync(PUBLISHED_PATH, published, { spaces: 2 });
}

// ══════════════════════════════════════════════════════════════════════════
// One Claude call per post
// ══════════════════════════════════════════════════════════════════════════

const HASHTAGS_BASE    = '#EmploiMaroc #InteractJob #RHMaroc #Recrutement #MarocEmploi';
const HASHTAGS_HOTEL   = '#HôtellerieMaroc #TourismeMaroc #HospitalityJobs';
const HASHTAGS_IT      = '#ITMaroc #DigitalMaroc #TechMaroc #Informatique';
const HASHTAGS_RH      = '#RHMaroc #FinanceMaroc #GestionRH #Comptabilité';
const HASHTAGS_BLOG    = '#ConseilsCarrière #CVProfessionnel #ChercheEmploi #TipsRH';

// OPTIMIZATION 5 & 8c: Use haiku (cheaper) and reduce max_tokens from 600 to 250
async function generatePost(prompt, maxTokens = 250) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const currentYear = new Date().getFullYear();
  try {
    const res = await getClient().messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: maxTokens,
      system:
        `Tu es le community manager expert d'InteractJob.ma — le job board #1 au Maroc pour l'hôtellerie et l'emploi. ` +
        `Nous sommes en ${currentYear}. ` +
        "Tu rédiges des posts LinkedIn percutants qui génèrent de l'engagement. " +
        "Chaque post doit : commencer par une accroche forte (question ou fait surprenant), " +
        "inclure des bullet points clairs, terminer par un CTA clair et des hashtags. " +
        "IMPORTANT : ne jamais mentionner une année autre que " + currentYear + ". " +
        "Langue : français. Ton professionnel mais dynamique.",
    messages: [{ role: 'user', content: prompt }],
    });

    // OPTIMIZATION 1: Log token usage
    const inputTokens = res.usage?.input_tokens || 0;
    const outputTokens = res.usage?.output_tokens || 0;
    logTokenUsage('linkedin-digests', inputTokens, outputTokens);

    return (res.content[0]?.text || '').trim();
  } catch (err) {
    log(`LinkedIn digest: erreur Claude — ${err.message}`);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Post generators
// ══════════════════════════════════════════════════════════════════════════

// Generic all-sectors post — accepts a pre-selected batch of unfeatured jobs
async function postGeneralJobs(jobs) {
  const selected = jobs.slice(0, 6);

  // Fallback template with individual links (used if Claude fails)
  const fallbackText =
    `💼 OFFRES DU JOUR — TOUS SECTEURS\n\n` +
    `${formatJobsWithLinks(selected)}\n\n` +
    `✨ Toutes nos offres → ${SITE_URL}\n` +
    `📲 Alertes WhatsApp → ${WA_LINK}\n\n` +
    `${HASHTAGS_BASE} #OffreEmploi #JobMaroc`;

  if (selected.length === 0) return fallbackText;

  const prompt =
    `Rédige un post LinkedIn SIMPLE et ANIMÉ pour InteractJob.ma — offres tous secteurs confondus.\n\n` +
    `IMPORTANT : Ne JAMAIS utiliser **, ##, ou autre markdown. Utilise UNIQUEMENT des emojis et sauts de ligne.\n` +
    `IMPORTANT : Pour chaque offre tu DOIS inclure le lien 🔗 EXACTEMENT comme fourni ci-dessous — NE PAS modifier les URLs.\n\n` +
    `Structure EXACTE :\n` +
    `1. Une ligne accroche percutante avec emoji au début\n` +
    `2. Ligne vide\n` +
    `3. "💼 OFFRES DU JOUR — TOUS SECTEURS"\n` +
    `4. Ligne vide\n` +
    `5. Pour CHAQUE offre (dans l'ordre) :\n` +
    `   📌 [Titre de l'offre]\n` +
    `   📍 [Ville] | [Type contrat]\n` +
    `   🔗 [URL de l'offre — COPIER EXACTEMENT]\n` +
    `   Ligne vide\n` +
    `6. "✨ Toutes nos offres → ${SITE_URL}"\n` +
    `7. "📲 Alertes WhatsApp → ${WA_LINK}"\n` +
    `8. Ligne vide\n` +
    `9. Hashtags sur une ligne\n\n` +
    `OFFRES À PUBLIER (copie les URLs exactement) :\n${formatJobsWithLinks(selected)}\n\n` +
    `Hashtags à utiliser : ${HASHTAGS_BASE} #OffreEmploi #JobMaroc\n` +
    `Max 250 mots. Format simple, lisible, avec VRAIS emojis (pas markdown).`;

  return await generatePost(prompt, 800) || fallbackText;
}

async function post4Expiring(allJobs) {
  const jobs = getExpiringSoon(allJobs);
  if (jobs.length === 0) {
    return `⏰ Pas d'offres qui expirent cette semaine — c'est le moment idéal pour postuler sereinement !\n\n👉 ${SITE_URL}\n\n${HASHTAGS_BASE}`;
  }

  const prompt =
    `Post LinkedIn URGENT pour InteractJob.ma. Ces offres expirent dans moins de 3 jours !\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche choc : '⚡ Ces opportunités ferment dans [X] jours — avez-vous déjà postulé ?'\n` +
    `2. '⏰ Offres qui expirent bientôt :'\n` +
    `3. Bullet points : titre — ville (date d'expiration)\n` +
    `4. Urgence : 'Ne laissez pas cette opportunité passer — Postulez maintenant → ${SITE_URL}'\n` +
    `5. Hashtags : ${HASHTAGS_BASE} #UrgenceEmploi #DeadlineEmploi\n\n` +
    `Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Max 180 mots. Crée un vrai sentiment d'urgence.`;

  return await generatePost(prompt, 600) ||
    `⏰ Ces offres expirent bientôt :\n${formatJobsForPrompt(jobs)}\n\nPostulez maintenant → ${SITE_URL}\n📲 ${WA_LINK}\n\n${HASHTAGS_BASE}`;
}

async function post5Blog(trackArticle = false) {
  const allArticles = loadAllArticles();
  if (allArticles.length === 0) {
    return {
      text: `📝 Nos derniers articles RH et emploi vous attendent sur ${SITE_URL}/blog\n\nConseils CV, marché de l'emploi marocain, entretien d'embauche — tout y est.\n\n${HASHTAGS_BASE} ${HASHTAGS_BLOG}`,
      article: null
    };
  }

  // Get articles already posted today
  const postedToday = getPublishedArticlesToday();

  // Find first article not posted today
  let article = null;
  for (const art of allArticles) {
    if (!postedToday.includes(art.slug)) {
      article = art;
      break;
    }
  }

  // Fallback: if all articles posted today, use the most recent
  if (!article) {
    article = allArticles[0];
    log(`LinkedIn blog: tous les articles ont été postés aujourd'hui, réutilisation du plus récent — ${article.slug}`);
  }

  const prompt =
    `Post LinkedIn pour promouvoir cet article d'InteractJob.ma et générer des clics.\n\n` +
    `Article : "${article.title}"\n` +
    `Extrait : ${article.excerpt}\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Question d'accroche percutante liée au sujet de l'article (interpelle les professionnels marocains)\n` +
    `2. 3 insights clés de l'article en bullet points (concrets et actionnables)\n` +
    `3. CTA : 'Lisez l'article complet → ${SITE_URL}/blog/${article.slug}'\n` +
    `4. Bonus : mention du CV checker gratuit → ${SITE_URL}/cv-checker\n` +
    `5. Hashtags : ${HASHTAGS_BASE} ${HASHTAGS_BLOG}\n\n` +
    `Max 220 mots. Post qui donne envie de lire l'article.`;

  const generatedText = await generatePost(prompt, 700);
  const postText = generatedText ||
    `📝 ${article.title}\n\n${article.excerpt}\n\nArticle complet → ${SITE_URL}/blog/${article.slug}\n📲 ${WA_LINK}\n\n${HASHTAGS_BASE} ${HASHTAGS_BLOG}`;

  // Track article selection at generation time (for queue-based posts)
  if (trackArticle && article) {
    const today = new Date().toISOString().split('T')[0];
    savePublishedArticle(article.slug, today, null);
  }

  return { text: postText, article };
}

// ══════════════════════════════════════════════════════════════════════════
// Auto-post soir (17:00)
// ══════════════════════════════════════════════════════════════════════════

export async function postLinkedInSoir() {
  log('LinkedIn soir: génération + publication du post urgence expiration');
  const allJobs = loadAllJobs();

  const text = await post4Expiring(allJobs);
  if (!text) {
    log('LinkedIn soir: aucun contenu généré — publication ignorée');
    return;
  }

  const postId = await publishTextPost(text);
  if (postId) {
    log(`LinkedIn soir: ✨ post 17h publié (profil) — ${postId}`);
  }

  // Mirror to company page
  await sleep(2000);
  const companyPostId = await publishTextPostToCompany(text);
  if (companyPostId) {
    log(`LinkedIn soir: ✨ post 17h publié (page entreprise) — ${companyPostId}`);
  }

  // Email de confirmation
  const today = new Date().toISOString().split('T')[0];
  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `📱 LinkedIn Soir publié — ${today}`,
      text:    `Post LinkedIn publié automatiquement à 17h :\n\n${text}\n\n---\nID: ${postId || 'non disponible'}`,
    });
  } catch (err) {
    log(`LinkedIn soir: email confirmation échoué — ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Post offres générales (21:10)
// ══════════════════════════════════════════════════════════════════════════

async function post6General(allJobs) {
  const today = new Date().toISOString().split('T')[0];
  let jobs = allJobs.filter((j) => !j.expired && j.date_posted === today).slice(0, 6);
  if (jobs.length < 3) {
    jobs = allJobs.filter((j) => !j.expired).slice(0, 6);
  }

  const fallbackText = jobs.length === 0
    ? `💼 Des opportunités d'emploi vous attendent sur ${SITE_URL} — découvrez toutes nos offres du jour !\n\n${HASHTAGS_BASE} #OffreEmploi #JobMaroc`
    : `💼 Offres du jour sur InteractJob.ma :\n\n${formatJobsWithLinks(jobs)}\n\nToutes les offres → ${SITE_URL}\n📲 ${WA_LINK}\n\n${HASHTAGS_BASE} #OffreEmploi #JobMaroc #EmploiCasablanca`;

  if (jobs.length === 0) return fallbackText;

  const prompt =
    `Post LinkedIn percutant pour InteractJob.ma — récapitulatif des offres d'emploi du jour au Maroc, tous secteurs.\n\n` +
    `IMPORTANT : Ne JAMAIS utiliser **, ##, ou autre markdown. Utilise UNIQUEMENT des emojis et sauts de ligne.\n` +
    `IMPORTANT : Pour chaque offre tu DOIS inclure le lien 🔗 EXACTEMENT comme fourni — NE PAS modifier les URLs.\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche forte : chiffre ou réalité sur le marché de l'emploi au Maroc (1 ligne)\n` +
    `2. Ligne vide\n` +
    `3. "💼 Offres du jour sur InteractJob.ma :"\n` +
    `4. Ligne vide\n` +
    `5. Pour CHAQUE offre :\n` +
    `   📌 [Titre]\n` +
    `   📍 [Ville] | [Contrat]\n` +
    `   🔗 [URL — COPIER EXACTEMENT]\n` +
    `   Ligne vide\n` +
    `6. "📲 Alertes emploi gratuites sur WhatsApp → ${WA_LINK}"\n` +
    `7. Hashtags : ${HASHTAGS_BASE} #OffreEmploi #JobMaroc #EmploiCasablanca\n\n` +
    `Offres (copie les URLs exactement) :\n${formatJobsWithLinks(jobs)}\n` +
    `Max 250 mots. Post engageant, accessible à tous les profils.`;

  return await generatePost(prompt, 800) || fallbackText;
}

export async function postLinkedInGeneralJobs() {
  log('LinkedIn jobs 21h10: génération + publication du post offres générales');

  const today = new Date().toISOString().split('T')[0];
  const dedupKey = `${today}|21:10 OFFRES GENERALES`;
  const alreadyPublished = loadPublishedPosts();
  if (alreadyPublished[dedupKey]) {
    log(`LinkedIn jobs 21h10: déjà publié aujourd'hui (${alreadyPublished[dedupKey].postId}) — ignoré`);
    return;
  }

  const allJobs = loadAllJobs();

  const text = await post6General(allJobs);
  if (!text) {
    log('LinkedIn jobs 21h10: aucun contenu généré — publication ignorée');
    return;
  }

  const postId = await publishTextPost(text);
  if (postId) {
    savePublishedPost('21:10 OFFRES GENERALES', today, postId);
    await persistDedupState();
    log(`LinkedIn jobs 21h10: ✨ post publié (profil) — ${postId}`);
  }

  // Mirror to company page
  await sleep(2000);
  const companyPostId = await publishTextPostToCompany(text);
  if (companyPostId) {
    log(`LinkedIn jobs 21h10: ✨ post publié (page entreprise) — ${companyPostId}`);
  }

  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `📱 LinkedIn Jobs 21h10 publié — ${today}`,
      text:    `Post LinkedIn offres générales publié automatiquement à 21h10 :\n\n${text}\n\n---\nID: ${postId || 'non disponible'}`,
    });
  } catch (err) {
    log(`LinkedIn jobs 21h10: email confirmation échoué — ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Auto-post nuit (21:00)
// ══════════════════════════════════════════════════════════════════════════

export async function postLinkedInNuit() {
  log('LinkedIn nuit: génération + publication du post article blog');

  const today = new Date().toISOString().split('T')[0];
  const dedupKey = `${today}|21:00 ARTICLE BLOG`;
  const alreadyPublished = loadPublishedPosts();
  if (alreadyPublished[dedupKey]) {
    log(`LinkedIn nuit: déjà publié aujourd'hui (${alreadyPublished[dedupKey].postId}) — ignoré`);
    return;
  }

  const result = await post5Blog();
  if (!result || !result.text) {
    log('LinkedIn nuit: aucun contenu généré — publication ignorée');
    return;
  }

  const { text, article } = result;
  const postId = await publishTextPost(text);
  if (postId) {
    savePublishedPost('21:00 ARTICLE BLOG', today, postId);
    await persistDedupState();
    if (article) {
      savePublishedArticle(article.slug, today, postId);
      log(`LinkedIn nuit: ✨ post 21h publié (profil) — ${postId} (article: ${article.slug})`);
    } else {
      log(`LinkedIn nuit: ✨ post 21h publié (profil) — ${postId}`);
    }
  }

  // Mirror to company page
  await sleep(2000);
  const companyPostId = await publishTextPostToCompany(text);
  if (companyPostId) {
    log(`LinkedIn nuit: ✨ post 21h publié (page entreprise) — ${companyPostId}`);
  }

  // Email de confirmation
  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `📱 LinkedIn Nuit publié — ${today}`,
      text:    `Post LinkedIn publié automatiquement à 21h :\n\n${text}\n\n---\nID: ${postId || 'non disponible'}`,
    });
  } catch (err) {
    log(`LinkedIn nuit: email confirmation échoué — ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Main export
// ══════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════
// Queue reader — extract today's posts by label
// ══════════════════════════════════════════════════════════════════════════

function extractTodaysQueueEntry() {
  try {
    const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
    const today   = new Date().toISOString().split('T')[0];

    // Find the DIGEST section specifically (with == fence markers)
    // Pattern: ========================== [DATE] ==========================
    const fence = '='.repeat(26);
    const fenceStart = `${fence} [${today}] ${fence}`;
    const startIdx = content.indexOf(fenceStart);

    if (startIdx < 0) return null;

    // Find the next fence or end of file
    const endIdx = content.indexOf(fence, startIdx + fenceStart.length + 10);
    const endPos = endIdx > 0 ? endIdx : content.length;

    const entry = content.substring(startIdx + fenceStart.length, endPos);
    const posts = {};
    const lines = entry.split('\n');

    let currentLabel = null;
    let currentContent = [];

    for (const line of lines) {
      // Check if this line is a label [TIME LABEL]
      const labelMatch = line.match(/^\[([^\]]+)\]/);

      if (labelMatch) {
        // Save the previous post if it exists
        if (currentLabel && currentContent.length > 0) {
          let label = currentLabel;
          // Normalize label: fix common mojibake patterns
          label = label.replace(/Hé”?TELLERIE/gi, 'HÔTELLERIE');
          label = label.replace(/Hé(?:[“”])?TELLERIE/gi, 'HÔTELLERIE');
          label = label.replace(/ðŸ[^]*/g, '');

          const text = currentContent.join('\n').trim();
          if (text && text.length > 0) {
            posts[label] = text;
          }
        }

        // Start a new post
        currentLabel = labelMatch[1].trim();
        currentContent = [];
      } else if (line.trim() === '---') {
        // Skip the separator lines (they're just formatting)
        currentContent.push(line);
      } else if (currentLabel) {
        // Add content lines to the current post
        currentContent.push(line);
      }
    }

    // Don't forget the last post
    if (currentLabel && currentContent.length > 0) {
      let label = currentLabel;
      label = label.replace(/Hé”?TELLERIE/gi, 'HÔTELLERIE');
      label = label.replace(/Hé(?:[“”])?TELLERIE/gi, 'HÔTELLERIE');
      label = label.replace(/ðŸ[^]*/g, '');

      const text = currentContent.join('\n').trim();
      if (text && text.length > 0) {
        posts[label] = text;
      }
    }

    return posts;
  } catch (err) {
    log(`extractTodaysQueueEntry: ${err.message}`);
    return null;
  }
}

export async function postDigestByLabel(label) {
  // Lazy generation: if today's queue entry doesn't exist yet, generate it now.
  // This handles the case where the 08:00 cron fires before run() has completed.
  let posts = extractTodaysQueueEntry();
  if (!posts || !posts[label]) {
    log(`LinkedIn digest [${label}]: queue vide pour aujourd'hui — génération à la demande`);
    await generateLinkedInDigests([]);   // [] → falls back to all active jobs
    posts = extractTodaysQueueEntry();
  }
  if (!posts || !posts[label]) {
    log(`LinkedIn digest [${label}]: aucun post généré — ignoré`);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const published = loadPublishedPosts();
  const key = `${today}|${label}`;

  // Check if already published today
  if (published[key]) {
    log(`LinkedIn digest [${label}]: déjà publié aujourd'hui — ${published[key].postId}`);
    return;
  }

  const text = posts[label];
  const postId = await publishTextPost(text);
  if (postId) {
    savePublishedPost(label, today, postId);
    await persistDedupState();
    log(`LinkedIn digest [${label}]: ✨ post publié (profil) — ${postId}`);
  }

  // Mirror to company page (2s after personal post to avoid rate-limit burst)
  await sleep(2000);
  const companyPostId = await publishTextPostToCompany(text);
  if (companyPostId) {
    log(`LinkedIn digest [${label}]: ✨ post publié (page entreprise) — ${companyPostId}`);
  }
}

export async function generateLinkedInDigests(enrichedJobs) {
  const today = new Date().toISOString().split('T')[0];

  // Skip if today's queue entry already exists (idempotent — safe to call multiple times)
  const existing = extractTodaysQueueEntry();
  if (existing && Object.keys(existing).length >= 3) {
    log(`LinkedIn digests: queue déjà générée pour aujourd'hui — ignoré`);
    return;
  }

  // Fallback: if no newly enriched jobs, use all active jobs for digest content
  const allActive = enrichedJobs.length > 0 ? enrichedJobs : loadAllJobs().filter(j => !j.expired);

  // Pick unfeatured jobs (never yet highlighted in a digest post), all sectors
  const unfeatured = getUnfeaturedJobs(allActive);
  log(`LinkedIn digests: ${unfeatured.length} offres non-featured disponibles (total actifs: ${allActive.length})`);

  // Split into 3 batches of up to 6 jobs each — each slot gets DIFFERENT jobs
  const batch1 = unfeatured.slice(0, 6);
  const batch2 = unfeatured.slice(6, 12);
  const batch3 = unfeatured.slice(12, 18);
  log(`LinkedIn digests: génération des 4 posts du jour (batches: ${batch1.length}+${batch2.length}+${batch3.length} offres)`);

  // Generate 4 posts with small delay between Claude calls
  const [p1, p2, p3, p4] = await Promise.allSettled([
    postGeneralJobs(batch1),
    (async () => { await sleep(1500); return postGeneralJobs(batch2); })(),
    (async () => { await sleep(3000); return postGeneralJobs(batch3); })(),
    (async () => { await sleep(4500); return post5Blog(true); })(),
  ]);

  const get = (r) => (r.status === 'fulfilled' ? r.value : `[Erreur: ${r.reason?.message}]`);
  const getText = (value) => (typeof value === 'object' && value.text) ? value.text : value;

  const posts = {
    '08:00 OFFRES MATIN': get(p1),
    '10:00 OFFRES MID':   get(p2),
    '12:00 OFFRES MIDI':  get(p3),
    '19:00 ARTICLE BLOG': getText(get(p4)),
  };

  log(`LinkedIn digests: 4 posts générés`);

  // Mark all batched jobs as featured so they won't be re-posted in future digests
  markDigestJobsAsFeatured([...batch1, ...batch2, ...batch3]);
  await persistDedupState(); // persist to GitHub (survives Railway restarts)

  // Build the queue file entry
  const fence = '='.repeat(26);
  let entry = `\n${fence} [${today}] ${fence}\n\n`;
  for (const [label, text] of Object.entries(posts)) {
    entry += `[${label}]\n${text}\n---\n`;
  }
  entry += `${fence}\n`;

  await fs.appendFile(QUEUE_PATH, entry, 'utf-8');
  log('LinkedIn digests: sauvegardés → data/linkedin-queue.txt (publication via crons 08h/10h/12h/19h)');

  // Send by email
  const emailBody =
    `Posts LinkedIn InteractJob — ${today}\n\n` +
    Object.entries(posts)
      .map(([label, text]) => `[${label}]\n${text}`)
      .join('\n\n---\n\n') +
    '\n\n---\nGénéré automatiquement par l\'agent InteractJob.';

  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `📋 Posts LinkedIn InteractJob — ${today}`,
      text:    emailBody,
    });
  } catch (err) {
    log(`LinkedIn digests: envoi email échoué — ${err.message}`);
  }
}
