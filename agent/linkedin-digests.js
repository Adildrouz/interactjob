/**
 * LinkedIn Daily Digest Generator for InteractJob.ma
 *
 * Generates 5 themed LinkedIn posts from the day's freshly enriched jobs.
 * Saves them to data/linkedin-queue.txt and sends by email.
 *
 * Post schedule:
 *   08:00 â€” HÃ´tellerie digest
 *   10:00 â€” IT & Digital digest
 *   12:00 â€” RH & Finance digest
 *   17:00 â€” Offres qui expirent bientÃ´t
 *   19:00 â€” Dernier article blog
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs-extra';
import { log } from './logger.js';
import { sendEmail } from './mailer.js';
import { publishTextPost } from './linkedin.js';

const __dirname       = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const JOBS_PATH     = path.join(__dirname, '../data/jobs.json');
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');
const QUEUE_PATH    = path.join(__dirname, '../data/linkedin-queue.txt');
const SITE_URL      = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const WA_LINK       = 'https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function jobLine(j) {
  return `${j.title} â€” ${j.city} (${j.contractType})`;
}

function formatJobsForPrompt(jobs) {
  return jobs.map((j) => `- ${jobLine(j)}`).join('\n');
}

function loadAllJobs() {
  try { return fs.readJsonSync(JOBS_PATH); } catch { return []; }
}

function loadLatestArticle() {
  try {
    const articles = fs.readJsonSync(ARTICLES_PATH);
    return articles.filter((a) => (a.lang ?? 'fr') === 'fr').sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    )[0] || null;
  } catch { return null; }
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

// â”€â”€ One Claude call per post â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HASHTAGS_BASE    = '#EmploiMaroc #InteractJob #RHMaroc #Recrutement #MarocEmploi';
const HASHTAGS_HOTEL   = '#HÃ´tellerieMaroc #TourismeMaroc #HospitalityJobs';
const HASHTAGS_IT      = '#ITMaroc #DigitalMaroc #TechMaroc #Informatique';
const HASHTAGS_RH      = '#RHMaroc #FinanceMaroc #GestionRH #ComptabilitÃ©';
const HASHTAGS_BLOG    = '#ConseilsCarriÃ¨re #CVProfessionnel #ChercheEmploi #TipsRH';

async function generatePost(prompt, maxTokens = 600) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const res = await getClient().messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system:
        "Tu es le community manager expert d'InteractJob.ma â€” le job board #1 au Maroc pour l'hÃ´tellerie et l'emploi. " +
        "Tu rÃ©diges des posts LinkedIn percutants qui gÃ©nÃ¨rent de l'engagement. " +
        "Chaque post doit : commencer par une accroche forte (question ou fait surprenant), " +
        "inclure des bullet points clairs, terminer par un CTA clair et des hashtags. " +
        "Langue : franÃ§ais. Ton professionnel mais dynamique.",
    messages: [{ role: 'user', content: prompt }],
    });
    return (res.content[0]?.text || '').trim();
  } catch (err) {
    log(`LinkedIn digest: erreur Claude â€” ${err.message}`);
    return null;
  }
}

// â”€â”€ 5 post generators â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function post1Hotel(enrichedJobs) {
  const jobs = enrichedJobs.filter((j) => j.sector === 'HÃ´tellerie').slice(0, 4);
  if (jobs.length === 0) {
    return `ðŸ¨ Le secteur HÃ´tellerie & Tourisme recrute activement au Maroc ! Retrouvez toutes nos offres sur ${SITE_URL}\n\n${HASHTAGS_BASE} ${HASHTAGS_HOTEL}`;
  }

  const prompt =
    `RÃ©dige un post LinkedIn percutant pour InteractJob.ma sur ces ${jobs.length} offres dans l'hÃ´tellerie.\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche : chiffre ou tendance sur l'hÃ´tellerie marocaine (1 ligne, impactante)\n` +
    `2. 'ðŸ¨ Top offres HÃ´tellerie & Tourisme du jour :'\n` +
    `3. Bullet points : titre â€” ville (contrat)\n` +
    `4. Appel Ã  l'action : 'Postulez directement â†’ ${SITE_URL}'\n` +
    `5. Hashtags sur une ligne : ${HASHTAGS_BASE} ${HASHTAGS_HOTEL}\n\n` +
    `Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Max 200 mots. Post engageant, concis, professionnel.`;

  return await generatePost(prompt, 650) ||
    `ðŸ¨ Top offres HÃ´tellerie & Tourisme du jour :\n${formatJobsForPrompt(jobs)}\n\nPostulez â†’ ${SITE_URL}\nðŸ“² ${WA_LINK}\n\n${HASHTAGS_BASE} ${HASHTAGS_HOTEL}`;
}

async function post2IT(enrichedJobs) {
  const jobs = enrichedJobs.filter((j) => j.sector === 'IT' || j.sector === 'Informatique').slice(0, 4);
  if (jobs.length === 0) {
    return `ðŸ’» Le digital et l'IT au Maroc recrutent sans relÃ¢che â€” retrouvez toutes les opportunitÃ©s sur ${SITE_URL}\n\n${HASHTAGS_BASE} ${HASHTAGS_IT}`;
  }

  const prompt =
    `Post LinkedIn pour ${jobs.length} offres IT & Digital du jour pour InteractJob.ma.\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche : tendance du marchÃ© IT au Maroc (1 ligne percutante)\n` +
    `2. 'ðŸ’» Offres IT & Digital du jour :'\n` +
    `3. Bullet points clairs : titre â€” ville (contrat)\n` +
    `4. CTA : 'Toutes les offres Tech â†’ ${SITE_URL}'\n` +
    `5. Hashtags : ${HASHTAGS_BASE} ${HASHTAGS_IT}\n\n` +
    `Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Max 200 mots.`;

  return await generatePost(prompt, 650) ||
    `ðŸ’» Offres IT & Digital du jour :\n${formatJobsForPrompt(jobs)}\n\n${SITE_URL}\nðŸ“² ${WA_LINK}\n\n${HASHTAGS_BASE} ${HASHTAGS_IT}`;
}

async function post3RHFinance(enrichedJobs) {
  const jobs = enrichedJobs.filter((j) => j.sector === 'RH' || j.sector === 'Finance' || j.sector === 'Administratif').slice(0, 4);
  if (jobs.length === 0) {
    return `ðŸ“Š RH, Finance & Gestion â€” des mÃ©tiers en pleine transformation au Maroc. Nos offres : ${SITE_URL}\n\n${HASHTAGS_BASE} ${HASHTAGS_RH}`;
  }

  const prompt =
    `Post LinkedIn pour ${jobs.length} offres RH, Finance et Administration du jour â€” InteractJob.ma.\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche : rÃ©alitÃ© du marchÃ© RH/Finance au Maroc aujourd'hui (1 ligne)\n` +
    `2. 'ðŸ“Š Offres RH, Finance & Gestion :'\n` +
    `3. Bullet points : titre â€” ville (contrat)\n` +
    `4. CTA : 'Postulez sur ${SITE_URL}'\n` +
    `5. Hashtags : ${HASHTAGS_BASE} ${HASHTAGS_RH}\n\n` +
    `Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Max 200 mots.`;

  return await generatePost(prompt, 650) ||
    `ðŸ“Š Offres RH & Finance :\n${formatJobsForPrompt(jobs)}\n\n${SITE_URL}\nðŸ“² ${WA_LINK}\n\n${HASHTAGS_BASE} ${HASHTAGS_RH}`;
}

async function post4Expiring(allJobs) {
  const jobs = getExpiringSoon(allJobs);
  if (jobs.length === 0) {
    return `â° Pas d'offres qui expirent cette semaine â€” c'est le moment idÃ©al pour postuler sereinement !\n\nðŸ‘‰ ${SITE_URL}\n\n${HASHTAGS_BASE}`;
  }

  const prompt =
    `Post LinkedIn URGENT pour InteractJob.ma. Ces offres expirent dans moins de 3 jours !\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche choc : 'âš ï¸ Ces opportunitÃ©s ferment dans [X] jours â€” avez-vous dÃ©jÃ  postulÃ© ?'\n` +
    `2. 'â° Offres qui expirent bientÃ´t :'\n` +
    `3. Bullet points : titre â€” ville (date d'expiration)\n` +
    `4. Urgence : 'Ne laissez pas cette opportunitÃ© passer â€” Postulez maintenant â†’ ${SITE_URL}'\n` +
    `5. Hashtags : ${HASHTAGS_BASE} #UrgenceEmploi #DeadlineEmploi\n\n` +
    `Offres :\n${formatJobsForPrompt(jobs)}\n` +
    `Max 180 mots. CrÃ©e un vrai sentiment d'urgence.`;

  return await generatePost(prompt, 600) ||
    `â° Ces offres expirent bientÃ´t :\n${formatJobsForPrompt(jobs)}\n\nPostulez maintenant â†’ ${SITE_URL}\nðŸ“² ${WA_LINK}\n\n${HASHTAGS_BASE}`;
}

async function post5Blog() {
  const article = loadLatestArticle();
  if (!article) {
    return `âœï¸ Nos derniers articles RH et emploi vous attendent sur ${SITE_URL}/blog\n\nConseils CV, marchÃ© de l'emploi marocain, entretien d'embauche â€” tout y est.\n\n${HASHTAGS_BASE} ${HASHTAGS_BLOG}`;
  }

  const prompt =
    `Post LinkedIn pour promouvoir cet article d'InteractJob.ma et gÃ©nÃ©rer des clics.\n\n` +
    `Article : "${article.title}"\n` +
    `Extrait : ${article.excerpt}\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Question d'accroche percutante liÃ©e au sujet de l'article (interpelle les professionnels marocains)\n` +
    `2. 3 insights clÃ©s de l'article en bullet points (concrets et actionnables)\n` +
    `3. CTA : 'Lisez l'article complet â†’ ${SITE_URL}/blog/${article.slug}'\n` +
    `4. Bonus : mention du CV checker gratuit â†’ ${SITE_URL}/cv-checker\n` +
    `5. Hashtags : ${HASHTAGS_BASE} ${HASHTAGS_BLOG}\n\n` +
    `Max 220 mots. Post qui donne envie de lire l'article.`;

  return await generatePost(prompt, 700) ||
    `âœï¸ ${article.title}\n\n${article.excerpt}\n\nArticle complet â†’ ${SITE_URL}/blog/${article.slug}\nðŸ“² ${WA_LINK}\n\n${HASHTAGS_BASE} ${HASHTAGS_BLOG}`;
}

// â”€â”€ Auto-post soir (17:00) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function postLinkedInSoir() {
  log('LinkedIn soir: gÃ©nÃ©ration + publication du post urgence expiration');
  const allJobs = loadAllJobs();

  const text = await post4Expiring(allJobs);
  if (!text) {
    log('LinkedIn soir: aucun contenu gÃ©nÃ©rÃ© â€” publication ignorÃ©e');
    return;
  }

  const postId = await publishTextPost(text);
  if (postId) {
    log(`LinkedIn soir: âœ“ post 17h publiÃ© â€” ${postId}`);
  }

  // Email de confirmation
  const today = new Date().toISOString().split('T')[0];
  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `ðŸ”µ LinkedIn Soir publiÃ© â€” ${today}`,
      text:    `Post LinkedIn publiÃ© automatiquement Ã  17h :\n\n${text}\n\n---\nID: ${postId || 'non disponible'}`,
    });
  } catch (err) {
    log(`LinkedIn soir: email confirmation Ã©chouÃ© â€” ${err.message}`);
  }
}

// â”€â”€ Post offres gÃ©nÃ©rales (21:10) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function post6General(allJobs) {
  const today = new Date().toISOString().split('T')[0];
  let jobs = allJobs.filter((j) => !j.expired && j.date_posted === today).slice(0, 6);
  if (jobs.length < 3) {
    jobs = allJobs.filter((j) => !j.expired).slice(0, 6);
  }
  if (jobs.length === 0) {
    return `ðŸ’¼ Des opportunitÃ©s d'emploi vous attendent sur ${SITE_URL} â€” dÃ©couvrez toutes nos offres du jour !\n\n${HASHTAGS_BASE} #OffreEmploi #JobMaroc`;
  }

  const prompt =
    `Post LinkedIn percutant pour InteractJob.ma â€” rÃ©capitulatif des offres d'emploi du jour au Maroc, tous secteurs.\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `1. Accroche : chiffre ou rÃ©alitÃ© sur le marchÃ© de l'emploi au Maroc (1 ligne forte)\n` +
    `2. 'ðŸ’¼ Offres du jour sur InteractJob.ma :'\n` +
    `3. Bullet points : titre â€” ville (contrat)\n` +
    `4. CTA : 'Toutes les offres â†’ ${SITE_URL}'\n` +
    `5. Bonus : 'Alertes emploi gratuites sur WhatsApp â†’ ${WA_LINK}'\n` +
    `6. Hashtags : ${HASHTAGS_BASE} #OffreEmploi #JobMaroc #EmploiCasablanca\n\n` +
    `Offres (tous secteurs) :\n${formatJobsForPrompt(jobs)}\n` +
    `Max 200 mots. Post engageant, accessible Ã  tous les profils.`;

  return await generatePost(prompt, 650) ||
    `ðŸ’¼ Offres du jour sur InteractJob.ma :\n${formatJobsForPrompt(jobs)}\n\nToutes les offres â†’ ${SITE_URL}\nðŸ“² ${WA_LINK}\n\n${HASHTAGS_BASE} #OffreEmploi #JobMaroc`;
}

export async function postLinkedInGeneralJobs() {
  log('LinkedIn jobs 21h10: gÃ©nÃ©ration + publication du post offres gÃ©nÃ©rales');
  const allJobs = loadAllJobs();

  const text = await post6General(allJobs);
  if (!text) {
    log('LinkedIn jobs 21h10: aucun contenu gÃ©nÃ©rÃ© â€” publication ignorÃ©e');
    return;
  }

  const postId = await publishTextPost(text);
  if (postId) {
    log(`LinkedIn jobs 21h10: âœ“ post publiÃ© â€” ${postId}`);
  }

  const today = new Date().toISOString().split('T')[0];
  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `ðŸ”µ LinkedIn Jobs 21h10 publiÃ© â€” ${today}`,
      text:    `Post LinkedIn offres gÃ©nÃ©rales publiÃ© automatiquement Ã  21h10 :\n\n${text}\n\n---\nID: ${postId || 'non disponible'}`,
    });
  } catch (err) {
    log(`LinkedIn jobs 21h10: email confirmation Ã©chouÃ© â€” ${err.message}`);
  }
}

// â”€â”€ Auto-post nuit (21:00) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function postLinkedInNuit() {
  log('LinkedIn nuit: gÃ©nÃ©ration + publication du post article blog');

  const text = await post5Blog();
  if (!text) {
    log('LinkedIn nuit: aucun contenu gÃ©nÃ©rÃ© â€” publication ignorÃ©e');
    return;
  }

  const postId = await publishTextPost(text);
  if (postId) {
    log(`LinkedIn nuit: âœ“ post 21h publiÃ© â€” ${postId}`);
  }

  // Email de confirmation
  const today = new Date().toISOString().split('T')[0];
  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `ðŸ”µ LinkedIn Nuit publiÃ© â€” ${today}`,
      text:    `Post LinkedIn publiÃ© automatiquement Ã  21h :\n\n${text}\n\n---\nID: ${postId || 'non disponible'}`,
    });
  } catch (err) {
    log(`LinkedIn nuit: email confirmation Ã©chouÃ© â€” ${err.message}`);
  }
}

// â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function generateLinkedInDigests(enrichedJobs) {
  log('LinkedIn digests: gÃ©nÃ©ration des 5 posts du jour');

  const allJobs = loadAllJobs();
  const today   = new Date().toISOString().split('T')[0];

  // Generate 5 posts with small delay between Claude calls
  const [p1, p2, p3, p4, p5] = await Promise.allSettled([
    post1Hotel(enrichedJobs),
    (async () => { await sleep(1500); return post2IT(enrichedJobs); })(),
    (async () => { await sleep(3000); return post3RHFinance(enrichedJobs); })(),
    (async () => { await sleep(4500); return post4Expiring(allJobs); })(),
    (async () => { await sleep(6000); return post5Blog(); })(),
  ]);

  const get = (r) => (r.status === 'fulfilled' ? r.value : `[Erreur: ${r.reason?.message}]`);

  const posts = {
    '08:00 HÃ”TELLERIE':       get(p1),
    '10:00 IT & DIGITAL':     get(p2),
    '12:00 RH & FINANCE':     get(p3),
    '17:00 URGENCE EXPIRATION': get(p4),
    '19:00 ARTICLE BLOG':     get(p5),
  };

  log(`LinkedIn digests: 5 posts gÃ©nÃ©rÃ©s`);

  // Build the queue file entry
  const fence = '='.repeat(26);
  let entry = `\n${fence} [${today}] ${fence}\n\n`;
  for (const [label, text] of Object.entries(posts)) {
    entry += `[${label}]\n${text}\n---\n`;
  }
  entry += `${fence}\n`;

  await fs.appendFile(QUEUE_PATH, entry, 'utf-8');
  log('LinkedIn digests: sauvegardÃ©s â†’ data/linkedin-queue.txt');

  // Send by email
  const emailBody =
    `Posts LinkedIn InteractJob â€” ${today}\n\n` +
    Object.entries(posts)
      .map(([label, text]) => `[${label}]\n${text}`)
      .join('\n\n---\n\n') +
    '\n\n---\nGÃ©nÃ©rÃ© automatiquement par l\'agent InteractJob.';

  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `ðŸ“‹ Posts LinkedIn InteractJob â€” ${today}`,
      text:    emailBody,
    });
  } catch (err) {
    log(`LinkedIn digests: envoi email Ã©chouÃ© â€” ${err.message}`);
  }
}

