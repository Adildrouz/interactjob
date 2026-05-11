/**
 * InteractJob Blog Writer
 * Generates 2 blog articles per week using Claude:
 *   - 1 article on Recrutement/RH topics
 *   - 1 article on Social/Juridique/Code du travail topics
 */

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { log } from './logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_PATH = path.join(__dirname, '../data/articles.json');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Topic pools — rotated by week number ───────────────────────────────────

const RH_TOPICS = [
  "Comment réussir un entretien d'embauche au Maroc en 2025",
  "Les tendances de recrutement au Maroc en 2025",
  "Comment négocier son salaire au Maroc : guide pratique",
  "LinkedIn au Maroc : construire un profil qui attire les recruteurs",
  "Les erreurs à éviter lors de la rédaction d'un CV marocain",
  "Reconversion professionnelle au Maroc : par où commencer ?",
  "Le télétravail au Maroc : droits, réalités et perspectives",
  "Comment gérer la mobilité interne dans une entreprise marocaine",
  "Les soft skills les plus recherchés par les recruteurs marocains",
  "Recrutement par compétences vs diplôme au Maroc : qui gagne ?",
  "Comment les PME marocaines peuvent attirer les meilleurs talents",
  "L'onboarding efficace : fidéliser les nouvelles recrues dès le premier jour",
  "Intelligence artificielle et recrutement : ce qui change au Maroc",
  "Le bilan de compétences au Maroc : outil méconnu et puissant",
  "Freelance au Maroc : avantages, risques et démarches",
];

const JURIDIQUE_TOPICS = [
  "Tout savoir sur l'indemnité de licenciement au Maroc",
  "Les droits des salariés en CDD au Maroc : ce qu'il faut savoir",
  "Congés payés au Maroc : calcul, droits et exceptions",
  "La période d'essai au Maroc : règles et pièges à éviter",
  "Harcèlement au travail au Maroc : recours et procédures",
  "Le SMIG au Maroc en 2025 : montant, calcul et obligations",
  "Licenciement abusif au Maroc : comment se défendre ?",
  "Les délégués des salariés : rôle, droits et protection",
  "Maternité et travail au Maroc : tous les droits de la salariée",
  "Heures supplémentaires au Maroc : règles et majorations",
  "Le contrat d'apprentissage au Maroc : guide complet",
  "Démissionner au Maroc : préavis, droits et procédures",
  "La grève au Maroc : droit, procédure et limites",
  "Code du travail marocain : les 10 articles que tout salarié doit connaître",
  "Non-discrimination au travail au Maroc : ce que dit la loi",
];

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const CATEGORY_COLORS = {
  "Recrutement": "bg-green-100 text-green-700",
  "Juridique & RH": "bg-red-100 text-red-700",
  "Carrière": "bg-blue-100 text-blue-700",
  "CV & Candidature": "bg-blue-100 text-blue-700",
};

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

function estimateReadTime(sections) {
  const totalWords = sections.reduce((acc, s) => acc + s.body.split(' ').length, 0);
  return Math.max(3, Math.round(totalWords / 200));
}

const SYSTEM_PROMPT =
  "Tu es un expert RH et journaliste spécialisé dans le marché de l'emploi marocain. " +
  "Tu rédiges des articles de blog pratiques, bien documentés et adaptés au contexte marocain. " +
  "Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans markdown.";

function buildArticlePrompt(topic, category) {
  return (
    `Rédige un article de blog professionnel sur le sujet suivant : "${topic}".\n` +
    `Catégorie : ${category}\n` +
    `Public cible : salariés et chercheurs d'emploi marocains\n\n` +
    `Retourne ce JSON exact (sans commentaires) :\n` +
    `{\n` +
    `  "title": "titre accrocheur en français (max 80 caractères)",\n` +
    `  "excerpt": "résumé engageant de 1-2 phrases (max 200 caractères)",\n` +
    `  "coverEmoji": "un seul emoji pertinent",\n` +
    `  "content": [\n` +
    `    { "heading": "titre de section", "body": "paragraphe détaillé de 100-150 mots, pratique et concret pour le marché marocain" },\n` +
    `    { "heading": "...", "body": "..." }\n` +
    `  ]\n` +
    `}\n\n` +
    `Contraintes :\n` +
    `- 5 à 7 sections dans content\n` +
    `- Chaque body : 100-150 mots, en français, exemples concrets du Maroc\n` +
    `- Pas de section "Conclusion" générique — terminer par un conseil actionnable\n` +
    `- Ton professionnel mais accessible`
  );
}

async function generateArticle(topic, category, categoryColor) {
  log(`  Blog: génération "${topic}"`);

  let parsed;
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildArticlePrompt(topic, category) }],
    });

    const text = (response.content[0]?.text || '').trim();
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(clean);

    if (!Array.isArray(parsed.content) || parsed.content.length < 3) {
      throw new Error('content insuffisant');
    }
  } catch (err) {
    log(`  Blog: ERREUR génération "${topic}": ${err.message}`);
    return null;
  }

  const slug = toSlug(parsed.title || topic);
  const today = new Date().toISOString().split('T')[0];

  return {
    id: uuidv4(),
    slug,
    title: parsed.title || topic,
    category,
    categoryColor,
    coverEmoji: parsed.coverEmoji || '📝',
    author: 'Équipe InteractJob',
    publishedAt: today,
    readTime: estimateReadTime(parsed.content),
    excerpt: parsed.excerpt || '',
    content: parsed.content,
  };
}

export async function writeBlogArticles() {
  if (!process.env.ANTHROPIC_API_KEY) {
    log('Blog writer: ANTHROPIC_API_KEY manquant — ignoré');
    return;
  }

  log('Blog writer: démarrage de la génération hebdomadaire');

  const week = getWeekNumber(new Date());
  const rhTopic = RH_TOPICS[week % RH_TOPICS.length];
  const juridiqueTopic = JURIDIQUE_TOPICS[week % JURIDIQUE_TOPICS.length];

  const results = [];

  // Article 1 : RH / Recrutement
  const rhArticle = await generateArticle(rhTopic, 'Recrutement', 'bg-green-100 text-green-700');
  if (rhArticle) results.push(rhArticle);

  // Small delay between calls
  await new Promise((r) => setTimeout(r, 3000));

  // Article 2 : Juridique / Code du travail
  const juridiqueArticle = await generateArticle(
    juridiqueTopic,
    'Juridique & RH',
    'bg-red-100 text-red-700'
  );
  if (juridiqueArticle) results.push(juridiqueArticle);

  if (results.length === 0) {
    log('Blog writer: aucun article généré');
    return;
  }

  // Load existing articles and prepend new ones
  const existing = await fs.readJson(ARTICLES_PATH).catch(() => []);

  // Deduplicate by slug
  const existingSlugs = new Set(existing.map((a) => a.slug));
  const toAdd = results.filter((a) => !existingSlugs.has(a.slug));

  if (toAdd.length === 0) {
    log('Blog writer: articles déjà existants — rien ajouté');
    return;
  }

  const updated = [...toAdd, ...existing];
  await fs.writeJson(ARTICLES_PATH, updated, { spaces: 2 });
  log(`Blog writer: ${toAdd.length} article(s) ajouté(s) → articles.json`);
  for (const a of toAdd) {
    log(`  - "${a.title}" [${a.category}]`);
  }
}
