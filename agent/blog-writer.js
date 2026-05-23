/**
 * InteractJob Blog Writer
 *
 * Reads agent/blog-topics.json, finds the next unpublished topic (tracked by
 * topicId in articles.json), generates a 1 200-word Markdown article via Claude,
 * converts it into the website's {heading, body} section format, and appends it
 * to data/articles.json. Sends the article by email.
 *
 * Runs Mon/Wed/Fri at 10:00 (Africa/Casablanca) via internal cron in agent.js.
 * Can also be triggered standalone: node agent.js --blog
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import { log } from './logger.js';
import { sendEmail } from './mailer.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const TOPICS_PATH   = path.join(__dirname, 'blog-topics.json');
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');
const SITE_URL      = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');

// ══════════════════════════════════════════════════════════════════════════
// Category → website styling
// ══════════════════════════════════════════════════════════════════════════

const CATEGORY_COLOR = {
  'Carrière':           'bg-green-100 text-green-700',
  'Juridique & RH':     'bg-red-100 text-red-700',
  'Innovation RH':      'bg-purple-100 text-purple-700',
  'Bien-être':          'bg-blue-100 text-blue-700',
  'Marché de l\'emploi':'bg-amber-100 text-amber-700',
  'Hôtellerie':         'bg-teal-100 text-teal-700',
  'Personal Branding':  'bg-indigo-100 text-indigo-700',
  'Recrutement':        'bg-green-100 text-green-700',
};

const CATEGORY_EMOJI = {
  'Carrière':           '🚀',
  'Juridique & RH':     '⚖️',
  'Innovation RH':      '🤖',
  'Bien-être':          '🧘',
  'Marché de l\'emploi':'📊',
  'Hôtellerie':         '🏨',
  'Personal Branding':  '✨',
  'Recrutement':        '🎯',
};

// ══════════════════════════════════════════════════════════════════════════
// Slug
// ══════════════════════════════════════════════════════════════════════════

function toSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// ══════════════════════════════════════════════════════════════════════════
// Markdown → sections array (for website rendering)
// ══════════════════════════════════════════════════════════════════════════

function markdownToSections(md) {
  const sections = [];
  const lines    = md.split('\n');
  let current    = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push({ heading: current.heading, body: current.body.trim() });
      current = { heading: line.slice(3).trim(), body: '' };
    } else if (line.startsWith('# ')) {
      // H1 is the title — skip it (already stored in title field)
    } else if (current) {
      // Strip remaining markdown (bold, italic, links) for clean body text
      const clean = line
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[-*]\s+/, '• ')
        .trim();
      if (clean) current.body += (current.body ? ' ' : '') + clean;
    } else if (line.trim() && !line.startsWith('#')) {
      // Text before first H2 → introduction section
      const clean = line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').trim();
      if (clean) {
        if (!current) current = { heading: 'Introduction', body: '' };
        current.body += (current.body ? ' ' : '') + clean;
      }
    }
  }

  if (current && current.body) sections.push({ heading: current.heading, body: current.body.trim() });
  return sections;
}

function estimateReadTime(md) {
  const words = md.split(/\s+/).length;
  return Math.max(4, Math.ceil(words / 200));
}

function extractExcerpt(md) {
  const text = md
    .replace(/#+\s+[^\n]*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 160).trim();
}

// ══════════════════════════════════════════════════════════════════════════
// Topic selection
// ══════════════════════════════════════════════════════════════════════════

function findNextTopic() {
  const topics   = fs.readJsonSync(TOPICS_PATH);
  const existing = fs.readJsonSync(ARTICLES_PATH).catch?.() ?? ((() => {
    try { return fs.readJsonSync(ARTICLES_PATH); } catch { return []; }
  })());
  const articles = (() => { try { return fs.readJsonSync(ARTICLES_PATH); } catch { return []; } })();

  const publishedTopicIds = new Set(
    articles.filter((a) => a.topicId != null).map((a) => a.topicId)
  );

  const next = topics.find((t) => !publishedTopicIds.has(t.id));
  if (next) return next;

  // All topics covered → cycle back from topic 1
  log('Blog writer: tous les 36 topics publiés — reprise depuis le topic 1');
  return topics[0];
}

// ══════════════════════════════════════════════════════════════════════════
// Claude generation
// ══════════════════════════════════════════════════════════════════════════

async function generateMarkdown(topic) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPrompt =
    `Écris un article de blog complet de 1 500 mots en français pour InteractJob.ma.\n` +
    `Titre : ${topic.title}\n` +
    `Mot-clé principal : ${topic.keyword}\n` +
    `Angle éditorial : ${topic.angle}\n` +
    `Catégorie : ${topic.category}\n\n` +
    `Structure OBLIGATOIRE :\n` +
    `## Introduction (150 mots)\n` +
    `  - Accroche forte : chiffre ou réalité concrète du marché marocain\n` +
    `  - Problème que l'article résout\n` +
    `  - Annonce du plan\n\n` +
    `## [Titre section 1] (180 mots) — contexte et enjeux\n` +
    `## [Titre section 2] (180 mots) — analyse et exemples marocains concrets\n` +
    `## [Titre section 3] (180 mots) — bonnes pratiques ou étapes\n` +
    `## [Titre section 4] (180 mots) — erreurs à éviter ou cas réels\n` +
    `## [Titre section 5] (180 mots) — tendances et perspectives 2025-2026\n` +
    `## Ce que ça change pour vous (120 mots)\n` +
    `  - 3 conseils pratiques actionnables immédiatement\n` +
    `  - Mention : 'Optimisez votre CV avec notre outil gratuit → interactjob.ma/cv-checker'\n` +
    `  - Si pertinent : 'Service CV professionnel rédigé par un DRH expert → interactjob.ma/services-cv'\n\n` +
    `## Questions fréquentes (120 mots)\n` +
    `  - 3 questions/réponses courtes liées au sujet (format Q: / R:)\n\n` +
    `## Conclusion (100 mots)\n` +
    `  - Synthèse des points clés\n` +
    `  - CTA OBLIGATOIRE : 'Retrouvez toutes les offres sur interactjob.ma et testez votre CV gratuitement → interactjob.ma/cv-checker'\n\n` +
    `SEO : utilise '${topic.keyword}' naturellement 5 à 6 fois dans le texte.\n` +
    `Exemples : cite des villes marocaines (Casablanca, Rabat, Essaouira, Marrakech), des secteurs locaux, des entreprises connues au Maroc.\n` +
    `Retourne UNIQUEMENT le contenu en Markdown (titre H1 en première ligne).`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4000,
    system:
      "Tu es un expert RH et journaliste spécialisé dans le marché du travail marocain. " +
      "Tu rédiges des articles de blog longs (1 500 mots minimum), originaux, informatifs et optimisés SEO pour InteractJob.ma. " +
      "Articles en français, 100% adaptés au contexte marocain : cite des entreprises, des villes, des lois marocaines réelles. " +
      "Tu n'inventes pas de statistiques précises — utilise 'selon les tendances observées' ou 'selon les experts RH'. " +
      "Chaque section doit apporter de la valeur concrète et actionnable au lecteur. " +
      "Ton professionnel mais accessible, structuré, avec des phrases courtes et impactantes.",
    messages: [{ role: 'user', content: userPrompt }],
  });

  return (response.content[0]?.text || '').trim();
}

// ══════════════════════════════════════════════════════════════════════════
// Main export
// ══════════════════════════════════════════════════════════════════════════

export async function writeBlogArticle() {
  if (!process.env.ANTHROPIC_API_KEY) {
    log('Blog writer: ANTHROPIC_API_KEY manquant — ignoré');
    return;
  }

  log('Blog writer: recherche du prochain topic à publier');
  const topic = findNextTopic();
  log(`Blog writer: topic sélectionné — "${topic.title}"`);

  // Generate markdown
  let markdown;
  try {
    markdown = await generateMarkdown(topic);
    log(`Blog writer: article généré (${markdown.split(/\s+/).length} mots)`);
  } catch (err) {
    log(`Blog writer: ERREUR génération — ${err.message}`);
    return;
  }

  // Build article object compatible with website schema + new fields
  const today    = new Date().toISOString().split('T')[0];
  const slug     = toSlug(topic.title);
  const sections = markdownToSections(markdown);
  const excerpt  = extractExcerpt(markdown);

  const article = {
    id:            uuidv4(),
    topicId:       topic.id,
    slug,
    lang:          'fr',
    title:         topic.title,
    category:      topic.category,
    categoryColor: CATEGORY_COLOR[topic.category] || 'bg-gray-100 text-gray-700',
    coverEmoji:    CATEGORY_EMOJI[topic.category]  || '📝',
    author:        'Équipe InteractJob',
    publishedAt:   today,
    date:          today,
    readTime:      estimateReadTime(markdown),
    excerpt,
    content:       sections,       // Array format — required by website renderer
    content_md:    markdown,       // Raw markdown — for email / reference
    keyword:       topic.keyword,
    pilier:        topic.pilier,
    published:     true,
  };

  // Deduplicate by slug then prepend
  const existing      = (() => { try { return fs.readJsonSync(ARTICLES_PATH); } catch { return []; } })();
  const existingSlugs = new Set(existing.map((a) => a.slug));

  if (existingSlugs.has(slug)) {
    log(`Blog writer: slug "${slug}" déjà existant — ignoré`);
    return;
  }

  await fs.writeJson(ARTICLES_PATH, [article, ...existing], { spaces: 2 });
  log(`Blog writer: ✨ "${article.title}" ajouté → data/articles.json`);

  // Git push → triggers Vercel rebuild so the article is live immediately
  try {
    const repoRoot = path.join(__dirname, '..');
    execSync('git add data/articles.json', { cwd: repoRoot, stdio: 'pipe' });
    execSync(
      `git diff --cached --quiet || git commit -m "chore: new blog article — ${article.slug} [skip ci]"`,
      { cwd: repoRoot, stdio: 'pipe', shell: true }
    );
    execSync('git push origin main', { cwd: repoRoot, stdio: 'pipe' });
    log('Blog writer: ✨ articles.json poussé → Vercel rebuild déclenché');
  } catch (gitErr) {
    log(`Blog writer: Git push ignoré — ${gitErr.message?.split('\n')[0]}`);
  }

  // Console preview when run standalone (no logger file)
  console.log('\n' + '═'.repeat(60));
  console.log('ARTICLE GÉNÉRÉ:');
  console.log('═'.repeat(60));
  console.log(`Titre : ${article.title}`);
  console.log(`Slug  : ${article.slug}`);
  console.log(`URL   : ${SITE_URL}/blog/${article.slug}`);
  console.log(`Mots  : ${markdown.split(/\s+/).length}`);
  console.log(`\n--- Début de l'article ---\n`);
  console.log(markdown.slice(0, 800) + (markdown.length > 800 ? '\n[...tronqué à 800 chars]' : ''));
  console.log('═'.repeat(60));

  // Send by email
  try {
    await sendEmail({
      to:      'contact@interactjob.ma',
      subject: `📝 Nouvel article blog publié — ${article.title}`,
      text:
        `Titre : ${article.title}\n` +
        `URL   : ${SITE_URL}/blog/${article.slug}\n` +
        `Catégorie : ${article.category}\n` +
        `Mot-clé : ${article.keyword}\n\n` +
        `---\n\n` +
        markdown +
        `\n\n---\nGénéré automatiquement par l'agent InteractJob.`,
    });
  } catch (err) {
    log(`Blog writer: envoi email échoué — ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Backward compat for --blog flag (existing agent.js calls writeBlogArticles)
// ══════════════════════════════════════════════════════════════════════════

export async function writeBlogArticles() {
  return writeBlogArticle();
}
