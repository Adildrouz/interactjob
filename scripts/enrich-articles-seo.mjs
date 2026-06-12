/**
 * Enriches data/articles.json with:
 *   heroImage    — curated Pexels CDN photo URL (1200×630)
 *   internalLinks — 2-3 related /blog and /code-travail links
 *   externalLink  — 1 authority link (HCP, CGEM, HBR, MIT Sloan…)
 *
 * Run: node scripts/enrich-articles-seo.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_PATH = path.join(__dirname, "../data/articles.json");

// ── Curated enrichment data keyed by slug ────────────────────────────────────
// heroImage: Pexels CDN permanent URLs (no API key needed for display)
// Photos selected to match each article topic exactly.
const ENRICHMENT = {
  "teletravail-au-maroc-en-2026-cadre-legal-entreprises-qui-le-proposent-et-salaire": {
    heroImage: "https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Personne en télétravail devant son ordinateur depuis son domicile",
    internalLinks: [
      { href: "/blog/licenciement-au-maroc-vos-droits-exacts-selon-le-code-du-travail-2026", title: "Licenciement au Maroc : vos droits exacts" },
      { href: "/blog/negocier-son-salaire-au-maroc-les-phrases-exactes-qui-fonctionnent-en-2026", title: "Négocier son salaire au Maroc en 2026" },
      { href: "/code-travail/art-52", title: "Code du Travail — Art. 52 : indemnité de licenciement" },
    ],
    externalLink: { href: "https://www.hcp.ma/Tableau-de-bord-du-marche-du-travail_a2487.html", title: "HCP.ma — Tableau de bord du marché du travail", authority: "HCP.ma" },
  },

  "harcelement-moral-au-travail-au-maroc-definition-legale-preuves-et-recours": {
    heroImage: "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Personne stressée au bureau — harcèlement moral au travail",
    internalLinks: [
      { href: "/blog/licenciement-abusif-au-maroc-defendez-vos-droits", title: "Licenciement abusif au Maroc : défendez vos droits" },
      { href: "/blog/burn-out-au-maroc-comment-le-reconnaitre-le-declarer-et-se-proteger-legalement", title: "Burn-out au Maroc : reconnaître, déclarer et se protéger" },
      { href: "/code-travail/art-44", title: "Code du Travail — Art. 44 : faute grave" },
    ],
    externalLink: { href: "https://www.travail.gov.ma/index.php/fr/", title: "Ministère du Travail et de l'Insertion Professionnelle — Maroc", authority: "Ministère du Travail" },
  },

  "negocier-son-salaire-au-maroc-les-phrases-exactes-qui-fonctionnent-en-2026": {
    heroImage: "https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Poignée de main lors d'une négociation salariale",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain 2026 : tendances et salaires" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées au Maroc" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien d'embauche : les règles d'or" },
    ],
    externalLink: { href: "https://hbr.org/2014/04/15-rules-for-negotiating-a-job-offer", title: "Harvard Business Review — 15 Rules for Negotiating a Job Offer", authority: "Harvard Business Review" },
  },

  "periode-dessai-au-maroc-en-2026-duree-legale-renouvellement-et-pieges-a-eviter": {
    heroImage: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Nouvelle recrue lors de sa période d'essai en réunion d'équipe",
    internalLinks: [
      { href: "/blog/licenciement-au-maroc-vos-droits-exacts-selon-le-code-du-travail-2026", title: "Licenciement au Maroc : vos droits exacts" },
      { href: "/blog/onboarding-efficace-integrer-vos-recrues-des-le-jour-1", title: "Onboarding efficace : intégrer vos recrues dès le Jour 1" },
      { href: "/code-travail/art-13", title: "Code du Travail — Art. 13 : durée de la période d'essai" },
    ],
    externalLink: { href: "https://www.cgem.ma/upload/1527513398.pdf", title: "CGEM — Guide du droit du travail au Maroc", authority: "CGEM" },
  },

  "jours-feries-maroc-2027": {
    heroImage: "https://images.pexels.com/photos/1303090/pexels-photo-1303090.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Calendrier des jours fériés au Maroc 2027",
    internalLinks: [
      { href: "/blog/teletravail-au-maroc-en-2026-cadre-legal-entreprises-qui-le-proposent-et-salaire", title: "Télétravail au Maroc : cadre légal 2026" },
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain 2026" },
      { href: "/code-travail/art-53", title: "Code du Travail — Art. 53 : heures supplémentaires" },
    ],
    externalLink: { href: "https://www.service-public.ma/fr/actualite/content/19649", title: "Service-public.ma — Jours fériés officiels au Maroc", authority: "Service-public.ma" },
  },

  "comment-devenir-expert-en-prompts-ia-pour-booster-sa-carriere-au-maroc": {
    heroImage: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Intelligence artificielle et prompt engineering pour la carrière",
    internalLinks: [
      { href: "/blog/intelligence-artificielle-recherche-emploi", title: "L'IA au service de votre recherche d'emploi" },
      { href: "/blog/comment-preparer-son-entretien-dembauche-avec-lia-en-2026-guide-complet", title: "Préparer son entretien d'embauche avec l'IA en 2026" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées par les recruteurs" },
    ],
    externalLink: { href: "https://mitsloan.mit.edu/ideas-made-to-matter/how-to-use-ai-make-better-decisions", title: "MIT Sloan — How to use AI to make better decisions", authority: "MIT Sloan" },
  },

  "les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026": {
    heroImage: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Équipe professionnelle présentant des compétences en réunion",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain 2026 : tendances" },
      { href: "/blog/optimiser-profil-linkedin-recruteurs", title: "Optimiser votre profil LinkedIn pour les recruteurs" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien d'embauche : les règles d'or" },
    ],
    externalLink: { href: "https://hbr.org/2023/11/the-skills-your-employees-need-to-work-effectively-with-ai", title: "Harvard Business Review — Skills needed to work effectively with AI", authority: "Harvard Business Review" },
  },

  "burn-out-au-maroc-comment-le-reconnaitre-le-declarer-et-se-proteger-legalement": {
    heroImage: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Personne épuisée au bureau — burn-out professionnel",
    internalLinks: [
      { href: "/blog/harcelement-moral-au-travail-au-maroc-definition-legale-preuves-et-recours", title: "Harcèlement moral au travail : définition légale et recours" },
      { href: "/blog/teletravail-au-maroc-en-2026-cadre-legal-entreprises-qui-le-proposent-et-salaire", title: "Télétravail au Maroc : comment réduire le stress" },
      { href: "/code-travail/art-74", title: "Code du Travail — Art. 74 : protection de la santé au travail" },
    ],
    externalLink: { href: "https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases", title: "OMS — Burn-out : phénomène professionnel reconnu", authority: "OMS / WHO" },
  },

  "les-15-metiers-qui-vont-disparaitre-au-maroc-dici-2027-et-par-quoi-les-remplacer": {
    heroImage: "https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Robotisation et automatisation du travail au Maroc",
    internalLinks: [
      { href: "/blog/intelligence-artificielle-recherche-emploi", title: "L'IA au service de votre recherche d'emploi" },
      { href: "/blog/comment-devenir-expert-en-prompts-ia-pour-booster-sa-carriere-au-maroc", title: "Devenir expert en prompts IA pour booster sa carrière" },
      { href: "/blog/reconversion-professionnelle-au-maroc-par-ou-commencer", title: "Reconversion professionnelle au Maroc : par où commencer ?" },
    ],
    externalLink: { href: "https://mitsloan.mit.edu/ideas-made-to-matter/automation-could-displace-a-quarter-us-jobs-over-next-20-years", title: "MIT Sloan — Automation could displace a quarter of jobs", authority: "MIT Sloan" },
  },

  "licenciement-au-maroc-vos-droits-exacts-selon-le-code-du-travail-2026": {
    heroImage: "https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Documents légaux sur le licenciement au Maroc",
    internalLinks: [
      { href: "/blog/licenciement-abusif-au-maroc-defendez-vos-droits", title: "Licenciement abusif : comment défendre vos droits" },
      { href: "/blog/periode-dessai-au-maroc-en-2026-duree-legale-renouvellement-et-pieges-a-eviter", title: "Période d'essai au Maroc : durée légale et pièges" },
      { href: "/code-travail/art-52", title: "Code du Travail — Art. 52 : indemnité de licenciement" },
    ],
    externalLink: { href: "https://www.cgem.ma/upload/1527513398.pdf", title: "CGEM — Guide pratique du droit du travail marocain", authority: "CGEM" },
  },

  "comment-preparer-son-entretien-dembauche-avec-lia-en-2026-guide-complet": {
    heroImage: "https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Candidat préparant son entretien d'embauche avec l'intelligence artificielle",
    internalLinks: [
      { href: "/blog/comment-devenir-expert-en-prompts-ia-pour-booster-sa-carriere-au-maroc", title: "Devenir expert en prompts IA pour booster sa carrière" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien d'embauche : les règles d'or" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées au Maroc" },
    ],
    externalLink: { href: "https://hbr.org/2021/11/10-common-job-interview-questions-and-how-to-answer-them", title: "Harvard Business Review — 10 Common Job Interview Questions", authority: "Harvard Business Review" },
  },

  "onboarding-efficace-integrer-vos-recrues-des-le-jour-1": {
    heroImage: "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Équipe accueillant un nouveau collaborateur lors de son onboarding",
    internalLinks: [
      { href: "/blog/periode-dessai-au-maroc-en-2026-duree-legale-renouvellement-et-pieges-a-eviter", title: "Période d'essai au Maroc : ce que dit la loi" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées par les recruteurs" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien d'embauche" },
    ],
    externalLink: { href: "https://hbr.org/2024/01/onboarding-can-make-or-break-a-new-hire-s-experience", title: "Harvard Business Review — Onboarding Can Make or Break a New Hire", authority: "Harvard Business Review" },
  },

  "licenciement-abusif-au-maroc-defendez-vos-droits": {
    heroImage: "https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Balance de la justice — licenciement abusif au Maroc",
    internalLinks: [
      { href: "/blog/licenciement-au-maroc-vos-droits-exacts-selon-le-code-du-travail-2026", title: "Licenciement au Maroc : vos droits selon le Code du Travail" },
      { href: "/blog/harcelement-moral-au-travail-au-maroc-definition-legale-preuves-et-recours", title: "Harcèlement moral au travail : recours légaux" },
      { href: "/code-travail/art-43", title: "Code du Travail — Art. 43 : rupture abusive du contrat" },
    ],
    externalLink: { href: "https://www.travail.gov.ma/index.php/fr/", title: "Ministère du Travail du Maroc — Recours et inspection du travail", authority: "Ministère du Travail" },
  },

  "reconversion-professionnelle-au-maroc-par-ou-commencer": {
    heroImage: "https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Professionnelle marocaine en reconversion, devant un ordinateur",
    internalLinks: [
      { href: "/blog/les-15-metiers-qui-vont-disparaitre-au-maroc-dici-2027-et-par-quoi-les-remplacer", title: "Les métiers qui vont disparaître au Maroc d'ici 2027" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées" },
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain : tendances 2026" },
    ],
    externalLink: { href: "https://www.ofppt.ma/fr", title: "OFPPT — Formations professionnelles au Maroc", authority: "OFPPT" },
  },

  "rediger-cv-percutant-2026": {
    heroImage: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "CV percutant posé sur un bureau — rédaction pour 2026",
    internalLinks: [
      { href: "/blog/optimiser-profil-linkedin-recruteurs", title: "Optimiser votre profil LinkedIn pour les recruteurs" },
      { href: "/blog/lettre-motivation-erreurs-eviter", title: "Lettre de motivation : les erreurs à éviter" },
      { href: "/blog/comprendre-systeme-ats-recrutement", title: "Comprendre le système ATS des recruteurs" },
    ],
    externalLink: { href: "https://hbr.org/2014/12/how-to-write-a-resume-that-stands-out", title: "Harvard Business Review — How to Write a Resume That Stands Out", authority: "Harvard Business Review" },
  },

  "intelligence-artificielle-recherche-emploi": {
    heroImage: "https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Intelligence artificielle appliquée à la recherche d'emploi",
    internalLinks: [
      { href: "/blog/comment-devenir-expert-en-prompts-ia-pour-booster-sa-carriere-au-maroc", title: "Devenir expert en prompts IA pour booster sa carrière" },
      { href: "/blog/comment-preparer-son-entretien-dembauche-avec-lia-en-2026-guide-complet", title: "Préparer son entretien d'embauche avec l'IA" },
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV percutant en 2026" },
    ],
    externalLink: { href: "https://mitsloan.mit.edu/ideas-made-to-matter/how-use-generative-ai-your-job-search", title: "MIT Sloan — How to use generative AI in your job search", authority: "MIT Sloan" },
  },

  "comprendre-systeme-ats-recrutement": {
    heroImage: "https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Logiciel ATS de recrutement sur écran d'ordinateur",
    internalLinks: [
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV percutant qui passe les ATS" },
      { href: "/blog/lettre-motivation-erreurs-eviter", title: "Lettre de motivation : les erreurs à éviter" },
      { href: "/blog/optimiser-profil-linkedin-recruteurs", title: "Optimiser votre profil LinkedIn pour les recruteurs" },
    ],
    externalLink: { href: "https://hbr.org/2019/07/your-approach-to-hiring-is-all-wrong", title: "Harvard Business Review — Your Approach to Hiring Is All Wrong", authority: "Harvard Business Review" },
  },

  "reussir-entretien-embauche-regles-or": {
    heroImage: "https://images.pexels.com/photos/5668855/pexels-photo-5668855.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Candidat en entretien d'embauche professionnel",
    internalLinks: [
      { href: "/blog/comment-preparer-son-entretien-dembauche-avec-lia-en-2026-guide-complet", title: "Préparer son entretien avec l'IA en 2026" },
      { href: "/blog/negocier-son-salaire-au-maroc-les-phrases-exactes-qui-fonctionnent-en-2026", title: "Négocier son salaire au Maroc : les phrases exactes" },
      { href: "/blog/periode-dessai-au-maroc-en-2026-duree-legale-renouvellement-et-pieges-a-eviter", title: "Période d'essai : ce que vous devez savoir avant de signer" },
    ],
    externalLink: { href: "https://hbr.org/2021/11/10-common-job-interview-questions-and-how-to-answer-them", title: "Harvard Business Review — 10 Common Interview Questions", authority: "Harvard Business Review" },
  },

  "optimiser-profil-linkedin-recruteurs": {
    heroImage: "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Optimisation du profil LinkedIn pour attirer les recruteurs",
    internalLinks: [
      { href: "/blog/reseauter-efficacement-emploi-cache", title: "Réseauter efficacement pour trouver l'emploi caché" },
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV percutant en 2026" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées par les recruteurs" },
    ],
    externalLink: { href: "https://www.linkedin.com/business/talent/blog/talent-acquisition/linkedin-profile-tips", title: "LinkedIn Talent Blog — Profile Tips for Job Seekers", authority: "LinkedIn" },
  },

  "lettre-motivation-erreurs-eviter": {
    heroImage: "https://images.pexels.com/photos/4778621/pexels-photo-4778621.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Rédaction d'une lettre de motivation sur ordinateur portable",
    internalLinks: [
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV percutant qui se démarque" },
      { href: "/blog/comprendre-systeme-ats-recrutement", title: "Comprendre le système ATS pour optimiser votre candidature" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien d'embauche : les règles d'or" },
    ],
    externalLink: { href: "https://hbr.org/2022/05/how-to-write-a-cover-letter", title: "Harvard Business Review — How to Write a Cover Letter", authority: "Harvard Business Review" },
  },

  "negocier-salaire-maroc-guide-pratique": {
    heroImage: "https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Négociation salariale entre employeur et candidat au Maroc",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain : grilles salariales 2026" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien d'embauche" },
      { href: "/blog/optimiser-profil-linkedin-recruteurs", title: "Optimiser votre profil LinkedIn pour être mieux payé" },
    ],
    externalLink: { href: "https://www.hcp.ma/downloads/Salaire-moyen-dans-le-secteur-prive_t13090.html", title: "HCP.ma — Salaires dans le secteur privé marocain", authority: "HCP.ma" },
  },

  "marche-emploi-maroc-2026-tendances": {
    heroImage: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Panorama du marché de l'emploi marocain en 2026",
    internalLinks: [
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées par les recruteurs" },
      { href: "/blog/reconversion-professionnelle-au-maroc-par-ou-commencer", title: "Reconversion professionnelle au Maroc : guide complet" },
      { href: "/blog/teletravail-au-maroc-en-2026-cadre-legal-entreprises-qui-le-proposent-et-salaire", title: "Télétravail au Maroc : entreprises qui le proposent" },
    ],
    externalLink: { href: "https://www.hcp.ma/Tableau-de-bord-du-marche-du-travail_a2487.html", title: "HCP.ma — Tableau de bord du marché du travail marocain", authority: "HCP.ma" },
  },

  "reseauter-efficacement-emploi-cache": {
    heroImage: "https://images.pexels.com/photos/1708936/pexels-photo-1708936.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Professionnels marocains en train de réseauter lors d'un événement",
    internalLinks: [
      { href: "/blog/optimiser-profil-linkedin-recruteurs", title: "Optimiser votre profil LinkedIn pour les recruteurs" },
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain : où chercher en 2026" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées" },
    ],
    externalLink: { href: "https://hbr.org/2016/05/learn-to-love-networking", title: "Harvard Business Review — Learn to Love Networking", authority: "Harvard Business Review" },
  },

  "reconversion-professionnelle-maroc-guide": {
    heroImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Professionnel en reconversion préparant sa nouvelle carrière au Maroc",
    internalLinks: [
      { href: "/blog/les-15-metiers-qui-vont-disparaitre-au-maroc-dici-2027-et-par-quoi-les-remplacer", title: "Les métiers qui vont disparaître au Maroc" },
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain : secteurs qui recrutent" },
      { href: "/blog/les-10-competences-les-plus-recherchees-par-les-recruteurs-marocains-en-2026", title: "Les 10 compétences les plus recherchées" },
    ],
    externalLink: { href: "https://www.ofppt.ma/fr", title: "OFPPT — Formations certifiantes pour votre reconversion", authority: "OFPPT" },
  },

  "emploi-casablanca-2027": {
    heroImage: "https://images.pexels.com/photos/3243090/pexels-photo-3243090.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Casablanca — skyline et quartier des affaires, capitale économique du Maroc",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain 2026 : tendances et salaires" },
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV percutant pour décrocher un emploi à Casablanca" },
      { href: "/blog/negocier-salaire-maroc-guide-pratique", title: "Négocier son salaire au Maroc : guide pratique" },
    ],
    externalLink: { href: "https://www.casainvest.ma/fr", title: "Casa Invest — Investissement et emploi à Casablanca", authority: "Casa Invest" },
  },

  "offre-emploi-rabat": {
    heroImage: "https://images.pexels.com/photos/3551526/pexels-photo-3551526.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Rabat — capitale du Maroc, opportunités d'emploi dans la fonction publique",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain 2026" },
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV percutant pour Rabat" },
      { href: "/blog/emploi-casablanca-2027", title: "Emploi à Casablanca 2027 : guide complet" },
    ],
    externalLink: { href: "https://www.hcp.ma/region-rabat/", title: "HCP.ma — Statistiques emploi Région Rabat-Salé-Kénitra", authority: "HCP.ma" },
  },

  "offre-emploi-marrakech": {
    heroImage: "https://images.pexels.com/photos/4388164/pexels-photo-4388164.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Marrakech — tourisme et hôtellerie, secteurs qui recrutent",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain : secteurs porteurs" },
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV pour le secteur tourisme-hôtellerie" },
      { href: "/blog/emploi-casablanca-2027", title: "Emploi à Casablanca 2027" },
    ],
    externalLink: { href: "https://www.hcp.ma/region-marrakech/", title: "HCP.ma — Statistiques emploi Région Marrakech-Safi", authority: "HCP.ma" },
  },

  "stage-maroc-2027": {
    heroImage: "https://images.pexels.com/photos/3153201/pexels-photo-3153201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Stagiaire marocain en formation en entreprise",
    internalLinks: [
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV de stagiaire percutant" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien de stage : les règles d'or" },
      { href: "/blog/lettre-motivation-erreurs-eviter", title: "Lettre de motivation pour un stage : erreurs à éviter" },
    ],
    externalLink: { href: "https://www.cgem.ma/fr/entreprises-affiliees", title: "CGEM — Entreprises membres qui recrutent des stagiaires", authority: "CGEM" },
  },

  "emploi-tanger": {
    heroImage: "https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Tanger Med — zone industrielle et emploi dans le nord du Maroc",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain : régions qui recrutent" },
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV pour les industries de Tanger" },
      { href: "/blog/emploi-casablanca-2027", title: "Emploi à Casablanca 2027" },
    ],
    externalLink: { href: "https://www.tangermed.ma/fr/emplois/", title: "Tanger Med — Offres d'emploi zone industrielle", authority: "Tanger Med" },
  },

  "wadifa-maroc": {
    heroImage: "https://images.pexels.com/photos/3184317/pexels-photo-3184317.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Candidats passant des concours de la fonction publique marocaine",
    internalLinks: [
      { href: "/blog/marche-emploi-maroc-2026-tendances", title: "Marché de l'emploi marocain 2026" },
      { href: "/blog/rediger-cv-percutant-2026", title: "Rédiger un CV pour les concours administratifs" },
      { href: "/blog/reussir-entretien-embauche-regles-or", title: "Réussir son entretien pour la fonction publique" },
    ],
    externalLink: { href: "https://www.mmsp.gov.ma/fr/nos-services/concours-de-recrutement", title: "Ministère de la Modernisation — Concours de recrutement Maroc", authority: "MMSP.gov.ma" },
  },

  "teletravail-maroc-2027": {
    heroImage: "https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    heroAlt: "Télétravail au Maroc en 2027 — tendances et opportunités",
    internalLinks: [
      { href: "/blog/teletravail-au-maroc-en-2026-cadre-legal-entreprises-qui-le-proposent-et-salaire", title: "Télétravail au Maroc 2026 : cadre légal complet" },
      { href: "/blog/negocier-son-salaire-au-maroc-les-phrases-exactes-qui-fonctionnent-en-2026", title: "Négocier son salaire en télétravail" },
      { href: "/code-travail/art-52", title: "Code du Travail — Droits du télétravailleur" },
    ],
    externalLink: { href: "https://www.hcp.ma/Tableau-de-bord-du-marche-du-travail_a2487.html", title: "HCP.ma — Emploi et nouvelles formes de travail au Maroc", authority: "HCP.ma" },
  },
};

// ── Apply enrichment to articles ─────────────────────────────────────────────
const articles = JSON.parse(readFileSync(ARTICLES_PATH, "utf-8"));

let enriched = 0;
let skipped = 0;

for (const article of articles) {
  const data = ENRICHMENT[article.slug];
  if (!data) {
    skipped++;
    continue;
  }
  article.heroImage   = data.heroImage;
  article.heroAlt     = data.heroAlt;
  article.internalLinks = data.internalLinks;
  article.externalLink  = data.externalLink;
  enriched++;
}

writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2), "utf-8");
console.log(`✅ Done: ${enriched} articles enriched, ${skipped} skipped (no mapping found).`);
if (skipped > 0) {
  const slugs = articles.filter(a => !ENRICHMENT[a.slug]).map(a => a.slug);
  console.log("Skipped slugs:", slugs);
}
