/**
 * InteractJob Blog Writer
 * Generates 2 blog articles per week using Claude:
 *   - 1 article on Recrutement/RH topics
 *   - 1 article on Social/Juridique/Code du travail topics
 */

import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
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
  "Le marché de l'emploi marocain mi-2026 : secteurs qui recrutent et salaires",
  "Télétravail au Maroc en 2026 : bilan, nouvelles pratiques et droits",
  "Les soft skills les plus recherchés par les recruteurs marocains en 2026",
  "Premier emploi au Maroc en 2026 : stratégies pour les jeunes diplômés",
  "Comment les PME marocaines recrutent en 2026 : outils et nouvelles pratiques",
  "L'onboarding efficace : intégrer et fidéliser les nouvelles recrues dès J1",
  "Le bilan de compétences au Maroc : outil méconnu pour changer de cap",
  "Freelance et auto-entrepreneur au Maroc en 2026 : avantages, risques et démarches",
  "Recrutement par compétences vs diplôme au Maroc : les nouvelles attentes des employeurs",
  "Offres d'emploi frauduleuses au Maroc : comment les identifier et se protéger",
  "Salaire variable et primes au Maroc : ce que vous pouvez vraiment négocier",
  "Réussir sa période d'essai au Maroc : conseils pratiques",
  "Emploi des seniors au Maroc : défis, droits et opportunités en 2026",
  "Les plateformes de recrutement au Maroc : comparatif 2026 (Rekrute, Emploi.ma, LinkedIn)",
  "Mobilité interne au Maroc : comment évoluer au sein de son entreprise",
];

const RH_TOPICS_AR = [
  "سوق الشغل المغربي منتصف 2026 : القطاعات التي توظف والرواتب",
  "العمل عن بُعد في المغرب 2026 : الواقع والحقوق والممارسات الجديدة",
  "المهارات الشخصية الأكثر طلباً من المجندين المغاربة في 2026",
  "أول وظيفة في المغرب 2026 : استراتيجيات للخريجين الجدد",
  "كيف توظف المؤسسات الصغيرة والمتوسطة في المغرب 2026 : أدوات وممارسات",
  "الاستقبال الفعّال : دمج الموظفين الجدد والاحتفاظ بهم منذ اليوم الأول",
  "تقييم الكفاءات في المغرب : أداة مجهولة لتغيير المسار المهني",
  "العمل الحر والمقاول الذاتي في المغرب 2026 : المزايا والمخاطر والإجراءات",
  "التوظيف بالكفاءات مقابل الشهادات في المغرب : توقعات أصحاب العمل الجدد",
  "عروض العمل الاحتيالية في المغرب : كيف تكتشفها وتحمي نفسك",
  "الراتب المتغير والمكافآت في المغرب : ما يمكنك فعلاً التفاوض عليه",
  "النجاح في فترة التجربة بالمغرب : نصائح عملية",
  "توظيف الأجراء الأكبر سناً في المغرب : تحديات وحقوق وفرص 2026",
  "منصات التوظيف في المغرب : مقارنة 2026 بين Rekrute وEmploi.ma وLinkedIn",
  "التنقل الداخلي في المغرب : كيف تتطور داخل شركتك",
];

const JURIDIQUE_TOPICS = [
  "Le SMIG 2026 au Maroc : nouveau montant après la revalorisation de janvier 2026",
  "Tout savoir sur l'indemnité de licenciement au Maroc en 2026",
  "Les droits des salariés en CDD au Maroc : ce qu'il faut savoir",
  "Congés payés au Maroc : calcul, droits et exceptions",
  "Harcèlement au travail au Maroc : recours légaux et procédures en 2026",
  "Licenciement abusif au Maroc : comment se défendre et quels recours ?",
  "Les délégués des salariés au Maroc : rôle, droits et protection",
  "Maternité et travail au Maroc : tous les droits de la salariée en 2026",
  "Heures supplémentaires au Maroc : calcul, droits et obligations de l'employeur",
  "Le contrat d'apprentissage au Maroc : guide complet 2026",
  "Démissionner au Maroc : préavis, droits et procédures à respecter",
  "La grève au Maroc : droit, procédure et limites légales",
  "Code du travail marocain : les 10 articles que tout salarié doit connaître",
  "Non-discrimination au travail au Maroc : ce que dit la loi",
  "Mutuelle d'entreprise au Maroc : droits, obligations et nouvelles règles 2026",
];

const JURIDIQUE_TOPICS_AR = [
  "الحد الأدنى للأجور SMIG 2026 في المغرب : المبلغ الجديد بعد مراجعة يناير 2026",
  "كل ما تحتاج معرفته عن تعويض الفصل في المغرب 2026",
  "حقوق موظفي عقد العمل المحدد المدة في المغرب",
  "العطلة المؤدى عنها في المغرب : الحساب والحقوق والاستثناءات",
  "التحرش في مكان العمل في المغرب : سبل الانتصاف القانونية والإجراءات 2026",
  "الفصل التعسفي في المغرب : كيف تدافع عن نفسك وما هي سبل الطعن؟",
  "مندوبو الأجراء في المغرب : الدور والحقوق والحماية",
  "الأمومة والعمل في المغرب : جميع حقوق المرأة العاملة في 2026",
  "الساعات الإضافية في المغرب : الحساب والحقوق والتزامات صاحب العمل",
  "عقد التمهين في المغرب : دليل شامل 2026",
  "الاستقالة في المغرب : الإخطار المسبق والحقوق والإجراءات الواجب اتباعها",
  "الإضراب في المغرب : الحق والإجراء والحدود القانونية",
  "مدونة الشغل المغربية : 10 فصول يجب أن يعرفها كل أجير",
  "عدم التمييز في العمل بالمغرب : ما يقوله القانون",
  "التأمين الصحي في المؤسسة بالمغرب : الحقوق والالتزامات والقواعد الجديدة 2026",
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

const SYSTEM_PROMPT_FR =
  "Tu es un expert RH et journaliste spécialisé dans le marché de l'emploi marocain. " +
  "Nous sommes en mai 2026. Le SMIG 2026 a été revalorisé en janvier 2026. " +
  "Tu rédiges des articles de blog pratiques, bien documentés, ancrés dans l'actualité 2026 et adaptés au contexte marocain. " +
  "Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans markdown.";

const SYSTEM_PROMPT_AR =
  "أنت خبير في الموارد البشرية وصحفي متخصص في سوق العمل المغربي. " +
  "نحن في ماي 2026. تم رفع الحد الأدنى للأجور SMIG 2026 في يناير 2026. " +
  "تكتب مقالات مدونة عملية وموثقة جيداً، مرتبطة بأحداث 2026 ومكيفة مع السياق المغربي باللغة العربية الفصحى. " +
  "أجب فقط بـ JSON صالح، بدون نص قبله أو بعده، بدون markdown.";

function buildArticlePrompt(topic, category, lang = 'fr') {
  if (lang === 'ar') {
    return (
      `اكتب مقال مدونة مهنياً حول الموضوع التالي : "${topic}".\n` +
      `الفئة : ${category}\n` +
      `الجمهور المستهدف : الموظفون والباحثون عن عمل المغاربة\n\n` +
      `أرجع هذا JSON بالضبط (بدون تعليقات) :\n` +
      `{\n` +
      `  "title": "عنوان جذاب بالعربية (100 حرف كحد أقصى)",\n` +
      `  "excerpt": "ملخص مقنع من 1-2 جمل (200 حرف كحد أقصى)",\n` +
      `  "coverEmoji": "emoji واحد ذو صلة",\n` +
      `  "content": [\n` +
      `    { "heading": "عنوان القسم", "body": "فقرة مفصلة من 100-150 كلمة، عملية وملموسة للسوق المغربية" },\n` +
      `    { "heading": "...", "body": "..." }\n` +
      `  ]\n` +
      `}\n\n` +
      `القيود :\n` +
      `- 5 إلى 7 أقسام في content\n` +
      `- كل body : 100-150 كلمة، بالعربية، أمثلة ملموسة من المغرب\n` +
      `- لا قسم "خاتمة" عام — الختام بنصيحة قابلة للتطبيق\n` +
      `- نبرة مهنية لكن سهلة الفهم`
    );
  }
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

async function generateArticle(topic, category, categoryColor, lang = 'fr') {
  log(`  Blog [${lang}]: génération "${topic}"`);

  let parsed;
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: lang === 'ar' ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_FR,
      messages: [{ role: 'user', content: buildArticlePrompt(topic, category, lang) }],
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
    slug: lang === 'ar' ? `${slug}-ar` : slug,
    lang,
    title: parsed.title || topic,
    category,
    categoryColor,
    coverEmoji: parsed.coverEmoji || '📝',
    author: lang === 'ar' ? 'فريق InteractJob' : 'Équipe InteractJob',
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
  const rhTopicAr = RH_TOPICS_AR[week % RH_TOPICS_AR.length];
  const juridiqueTopicAr = JURIDIQUE_TOPICS_AR[week % JURIDIQUE_TOPICS_AR.length];

  const results = [];

  // Article 1 : RH / Recrutement (FR)
  const rhArticle = await generateArticle(rhTopic, 'Recrutement', 'bg-green-100 text-green-700', 'fr');
  if (rhArticle) results.push(rhArticle);
  await new Promise((r) => setTimeout(r, 3000));

  // Article 2 : Juridique (FR)
  const juridiqueArticle = await generateArticle(juridiqueTopic, 'Juridique & RH', 'bg-red-100 text-red-700', 'fr');
  if (juridiqueArticle) results.push(juridiqueArticle);
  await new Promise((r) => setTimeout(r, 3000));

  // Article 3 : RH (AR)
  const rhArticleAr = await generateArticle(rhTopicAr, 'التوظيف', 'bg-green-100 text-green-700', 'ar');
  if (rhArticleAr) results.push(rhArticleAr);
  await new Promise((r) => setTimeout(r, 3000));

  // Article 4 : Juridique (AR)
  const juridiqueArticleAr = await generateArticle(juridiqueTopicAr, 'القانوني والموارد البشرية', 'bg-red-100 text-red-700', 'ar');
  if (juridiqueArticleAr) results.push(juridiqueArticleAr);

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
    log(`  - "${a.title}" [${a.category}] [${a.lang}]`);
  }

  // Post French articles to LinkedIn
  const frArticles = toAdd.filter((a) => a.lang === 'fr');
  if (frArticles.length > 0) {
    await postArticlesToLinkedIn(frArticles);
  }
}

async function postArticlesToLinkedIn(articles) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const siteUrl = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');

  if (!accessToken) {
    log('Blog LinkedIn: LINKEDIN_ACCESS_TOKEN manquant — publication ignorée');
    return;
  }

  // Resolve person URN
  let personUrn;
  try {
    const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const id = res.data.sub;
    if (!id) throw new Error('person ID introuvable');
    personUrn = `urn:li:person:${id}`;
  } catch (err) {
    log(`Blog LinkedIn: impossible de résoudre le profil — ${err.message}`);
    return;
  }

  const HASHTAGS = {
    'Recrutement': '#emploimaroc #recrutement #carrière #RH',
    'Juridique & RH': '#droitdutravail #RH #emploimaroc #codedutravail',
  };

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const url = `${siteUrl}/blog/${article.slug}`;
    const hashtags = HASHTAGS[article.category] || '#emploimaroc #RH #carrière';
    const text =
      `${article.coverEmoji} ${article.title}\n\n` +
      `${article.excerpt}\n\n` +
      `Lire l'article complet ↗\n\n` +
      hashtags;

    try {
      const body = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              originalUrl: url,
              title: { text: article.title.slice(0, 200) },
              description: { text: article.excerpt.slice(0, 256) },
            }],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };

      const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      const postId = res.headers['x-restli-id'] || res.data?.id || 'ok';
      log(`Blog LinkedIn: ✓ "${article.title}" — ${postId}`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      log(`Blog LinkedIn: ✗ "${article.title}" [${status || 'ERR'}] — ${msg}`);
    }

    if (i < articles.length - 1) await new Promise((r) => setTimeout(r, 15000));
  }

  log(`Blog LinkedIn: ${articles.length} article(s) FR publiés`);
}
