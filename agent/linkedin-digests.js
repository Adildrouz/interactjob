/**
 * LinkedIn Daily Digest Generator for InteractJob.ma
 *
 * Generates 5 themed LinkedIn posts from the day's freshly enriched jobs.
 * Saves them to data/linkedin-queue.txt and sends by email.
 *
 * Post schedule:
 *   08:00 — Hôtellerie digest
 *   10:00 — IT & Digital digest
 *   12:00 — RH & Finance digest
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
import { publishTextPost } from './linkedin.js';
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

function formatJobsForPrompt(jobs) {
  return jobs.map((j) => `- ${jobLine(j)}`).join('\n');
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
// 5 post generators
// ══════════════════════════════════════════════════════════════════════════

async function post1Hotel(enrichedJobs) {
  // Chercher offres hôtellerie, tourisme, événements, restauration
  let jobs = enrichedJobs.filter((j) => {
    const sector = (j.sector || '').toLowerCase();
    return sector.includes('hôtel') || sector.includes('hotel') ||
           sector.includes('tourisme') || sector.includes('restaurant') ||
           sector.includes('événement') || sector.includes('event') ||
           j.title?.toLowerCase().includes('hôtel') ||
           j.title?.toLowerCase().includes('tourisme');
  }).slice(0, 5);

  // Si aucune offre hôtellerie, utiliser les offres générales du jour
  if (jobs.length === 0) {
    jobs = enrichedJobs.slice(0, 6);
  }

  if (jobs.length === 0) {
    // Fallback ultime (ne devrait presque jamais arriver ici)
    return null;
  }

  const prompt =
    `Rédige un post LinkedIn SIMPLE et ANIMÉ pour InteractJob.ma.\n\n` +
    `IMPORTANT : Ne JAMAIS utiliser **, ##, ou autre markdown. Utilise UNIQUEMENT des emojis et sauts de ligne.\n\n` +
    `Structure EXACTE :\n` +
    `1. Une ligne accroche percutante avec emoji au début\n` +
    `2. Ligne vide\n` +
    `3. "💼 TOP OFFRES DU JOUR"\n` +
    `4. Ligne vide\n` +
    `5. Pour CHAQUE offre (max 4) :\n` +
    `   📌 Titre de l'offre\n` +
    `   📍 Ville | Type contrat\n` +
    `   Ligne vide\n` +
    `6. Ligne vide\n` +
    `7. "✨ Cette semaine on recrute !"\n` +
    `8. "👉 Postulez sur interactjob.ma"\n` +
    `9. Ligne vide\n` +
    `10. Hashtags sur une ligne\n\n` +
    `OFFRES À METTRE :\n${formatJobsForPrompt(jobs.slice(0, 4))}\n\n` +
    `Max 200 mots. Format simple, lisible, avec VRAIS emojis (pas markdown).`;

  return await generatePost(prompt, 700) ||
    `🔥 Nous recrutons cette semaine !\n\n💼 TOP OFFRES DU JOUR\n\n${jobs.slice(0, 3).map(j => `📌 ${j.title}\n📍 ${j.city} | ${j.contractType}`).join('\n\n')}\n\n✨ Cette semaine on recrute !\n👉 Postulez sur interactjob.ma\n\n${HASHTAGS_BASE} #OffreEmploi #JobMaroc`;
}

async function post2IT(enrichedJobs) {
  // Chercher offres IT, Digital, Développement, Tech
  const jobs = enrichedJobs.filter((j) => {
    const sector = (j.sector || '').toLowerCase();
    const title = (j.title || '').toLowerCase();
    return sector.includes('it') || sector.includes('informatique') ||
           sector.includes('développement') || sector.includes('tech') ||
           sector.includes('digital') || sector.includes('web') ||
           sector.includes('data') || sector.includes('devops') ||
           title.includes('développeur') || title.includes('developer') ||
           title.includes('ingénieur') || title.includes('analyst');
  }).slice(0, 5);

  if (jobs.length === 0) {
    // Si aucune offre IT, afficher les offres générales du jour
    const allJobs = enrichedJobs.slice(0, 4);
    if (allJobs.length === 0) {
      return `💻 Le digital et l'IT au Maroc recrutent sans relâche — retrouvez toutes les opportunités sur ${SITE_URL}\n\n${HASHTAGS_BASE} ${HASHTAGS_IT}`;
    }
    return `💻 Offres du jour sur InteractJob.ma :\n${formatJobsForPrompt(allJobs)}\n\nPostulez → ${SITE_URL}\n📲 ${WA_LINK}\n\n${HASHTAGS_BASE} ${HASHTAGS_IT}`;
  }

  const prompt =
    `Rédige un post LinkedIn SIMPLE et ANIMÉ pour InteractJob.ma sur des offres IT & Digital.\n\n` +
    `IMPORTANT : Ne JAMAIS utiliser **, ##, ou autre markdown. Utilise UNIQUEMENT des emojis et sauts de ligne.\n\n` +
    `Structure EXACTE :\n` +
    `1. Accroche percutante avec emoji (ex: "🚀 Le tech recrute au Maroc !")\n` +
    `2. Ligne vide\n` +
    `3. "💻 OFFRES IT & DIGITAL"\n` +
    `4. Ligne vide\n` +
    `5. Pour CHAQUE offre (max 4) :\n` +
    `   💼 Titre de l'offre\n` +
    `   📍 Ville | Type contrat\n` +
    `   Ligne vide\n` +
    `6. "⚡ Rejoins une équipe dynamique"\n` +
    `7. "👉 Candidatez maintenant sur interactjob.ma"\n` +
    `8. Ligne vide\n` +
    `9. Hashtags\n\n` +
    `OFFRES À METTRE :\n${formatJobsForPrompt(jobs.slice(0, 4))}\n\n` +
    `Max 200 mots. Simple, lisible, emojis réels uniquement.`;

  return await generatePost(prompt, 700) ||
    `🚀 Le tech recrute au Maroc !\n\n💻 OFFRES IT & DIGITAL\n\n${jobs.slice(0, 3).map(j => `💼 ${j.title}\n📍 ${j.city} | ${j.contractType}`).join('\n\n')}\n\n⚡ Rejoins une équipe dynamique\n👉 Candidatez maintenant sur interactjob.ma\n\n${HASHTAGS_BASE} ${HASHTAGS_IT}`;
}

async function post3RHFinance(enrichedJobs) {
  // Chercher offres RH, Finance, Gestion, Comptabilité, Admin
  const jobs = enrichedJobs.filter((j) => {
    const sector = (j.sector || '').toLowerCase();
    const title = (j.title || '').toLowerCase();
    return sector.includes('rh') || sector.includes('ressources humaines') ||
           sector.includes('finance') || sector.includes('comptabilité') ||
           sector.includes('gestion') || sector.includes('administratif') ||
           sector.includes('audit') || sector.includes('contrôle') ||
           title.includes('rh') || title.includes('finance') ||
           title.includes('comptable') || title.includes('gestionnaire') ||
           title.includes('administrateur');
  }).slice(0, 5);

  if (jobs.length === 0) {
    // Si aucune offre RH/Finance, afficher les offres générales du jour
    const allJobs = enrichedJobs.slice(0, 4);
    if (allJobs.length === 0) {
      return `📊 RH, Finance & Gestion — des métiers en pleine transformation au Maroc. Nos offres : ${SITE_URL}\n\n${HASHTAGS_BASE} ${HASHTAGS_RH}`;
    }
    return `📊 Offres du jour sur InteractJob.ma :\n${formatJobsForPrompt(allJobs)}\n\nPostulez → ${SITE_URL}\n📲 ${WA_LINK}\n\n${HASHTAGS_BASE} ${HASHTAGS_RH}`;
  }

  const prompt =
    `Rédige un post LinkedIn SIMPLE et ANIMÉ pour InteractJob.ma sur des offres RH, Finance & Gestion.\n\n` +
    `IMPORTANT : Ne JAMAIS utiliser **, ##, ou autre markdown. Utilise UNIQUEMENT des emojis et sauts de ligne.\n\n` +
    `Structure EXACTE :\n` +
    `1. Accroche percutante (ex: "💰 Les RH & Finance recrutent au Maroc !")\n` +
    `2. Ligne vide\n` +
    `3. "📊 OFFRES RH, FINANCE & GESTION"\n` +
    `4. Ligne vide\n` +
    `5. Pour CHAQUE offre (max 4) :\n` +
    `   📌 Titre de l'offre\n` +
    `   📍 Ville | Type contrat\n` +
    `   Ligne vide\n` +
    `6. "✅ Postes en CDI — Stabilité garantie"\n` +
    `7. "👉 Candidatez sur interactjob.ma"\n` +
    `8. Ligne vide\n` +
    `9. Hashtags\n\n` +
    `OFFRES À METTRE :\n${formatJobsForPrompt(jobs.slice(0, 4))}\n\n` +
    `Max 200 mots. Simple, clair, emojis réels.`;

  return await generatePost(prompt, 700) ||
    `💰 Les RH & Finance recrutent !\n\n📊 OFFRES RH, FINANCE & GESTION\n\n${jobs.slice(0, 3).map(j => `📌 ${j.title}\n📍 ${j.city} | ${j.contractType}`).join('\n\n')}\n\n✅ Postes en CDI — Stabilité garantie\n👉 Candidatez sur interactjob.ma\n\n${HASHTAGS_BASE} ${HASHTAGS_RH}`;
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
    log(`LinkedIn soir: ✨ post 17h publié — ${postId}`);
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
  if (jobs.length === 0) {
    return `💼 Des opportunités d'emploi vous attendent sur ${SITE_URL} — découvrez toutes nos offres du jour !\n\n${HASHTAGS_BASE} #OffreEmploi #JobMaroc`;
  }

  const prompt =
    `Post LinkedIn percutant pour InteractJob.ma — récapitulatif des offres d'emploi du jour au Maroc, tous secteurs.\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche : chiffre ou réalité sur le marché de l'emploi au Maroc (1 ligne forte)\n` +
    `2. '💼 Offres du jour sur InteractJob.ma :'\n` +
    `3. Bullet points : titre — ville (contrat)\n` +
    `4. CTA : 'Toutes les offres → ${SITE_URL}'\n` +
    `5. Bonus : 'Alertes emploi gratuites sur WhatsApp → ${WA_LINK}'\n` +
    `6. Hashtags : ${HASHTAGS_BASE} #OffreEmploi #JobMaroc #EmploiCasablanca\n\n` +
    `Offres (tous secteurs) :\n${formatJobsForPrompt(jobs)}\n` +
    `Max 200 mots. Post engageant, accessible à tous les profils.`;

  return await generatePost(prompt, 650) ||
    `💼 Offres du jour sur InteractJob.ma :\n${formatJobsForPrompt(jobs)}\n\nToutes les offres → ${SITE_URL}\n📲 ${WA_LINK}\n\n${HASHTAGS_BASE} #OffreEmploi #JobMaroc`;
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
    log(`LinkedIn jobs 21h10: ✨ post publié — ${postId}`);
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
    if (article) {
      savePublishedArticle(article.slug, today, postId);
      log(`LinkedIn nuit: ✨ post 21h publié — ${postId} (article: ${article.slug})`);
    } else {
      log(`LinkedIn nuit: ✨ post 21h publié — ${postId}`);
    }
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
    log(`LinkedIn digest [${label}]: ✨ post publié — ${postId}`);
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
  const jobsForDigest = enrichedJobs.length > 0 ? enrichedJobs : loadAllJobs().filter(j => !j.expired);
  log(`LinkedIn digests: génération des 4 posts du jour (${jobsForDigest.length} offres disponibles)`);

  // Generate 4 posts with small delay between Claude calls
  const [p1, p2, p3, p4] = await Promise.allSettled([
    post1Hotel(jobsForDigest),
    (async () => { await sleep(1500); return post2IT(jobsForDigest); })(),
    (async () => { await sleep(3000); return post3RHFinance(jobsForDigest); })(),
    (async () => { await sleep(4500); return post5Blog(true); })(),
  ]);

  const get = (r) => (r.status === 'fulfilled' ? r.value : `[Erreur: ${r.reason?.message}]`);
  const getText = (value) => (typeof value === 'object' && value.text) ? value.text : value;

  const posts = {
    '08:00 HÔTELLERIE':   get(p1),
    '10:00 IT & DIGITAL': get(p2),
    '12:00 RH & FINANCE': get(p3),
    '19:00 ARTICLE BLOG': getText(get(p4)),
  };

  log(`LinkedIn digests: 4 posts générés`);

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
