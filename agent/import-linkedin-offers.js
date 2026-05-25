/**
 * Manual LinkedIn offers import
 * Processes offers directly from LinkedIn and adds them to jobs.json
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { config as dotenvConfig } from 'dotenv';
import { publishTextPost } from './linkedin.js';
import { log, initLogger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env') });

const JOBS_PATH = path.join(__dirname, '../data/jobs.json');

initLogger();

function generateColor(str) {
  const colors = [
    '#7C3AED', '#E11D48', '#2563EB', '#059669', '#D97706',
    '#0891B2', '#7C2D12', '#1D4ED8', '#065F46', '#92400E',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return colors[hash % colors.length];
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

const offers = [
  {
    title: 'HR Manager International',
    company: 'Établissement Scolaire International',
    city: 'Casablanca',
    location: 'Casablanca',
    sector: 'RH',
    contractType: 'CDI',
    description: 'Au cœur d\'un environnement éducatif prestigieux et multiculturel, vous pilotez l\'ensemble de la fonction RH avec une forte composante internationale: Mobilité Internationale, Administration RH, Partenaire Stratégique.',
    requirements: ['7+ ans exp RH managérial multiculturel', 'Anglais bilingue impératif', 'Expertise expatriation et accueil talents internationaux', 'Communication, empathie, rigueur, adaptabilité'],
    email: 'H.sadki@diorh.com',
    sourceCompany: 'DIO RH',
  },
  {
    title: 'Technicien Électricité',
    company: 'EM-Énergie',
    city: 'Kénitra',
    location: 'Kénitra',
    sector: 'Industrie',
    contractType: 'CDI',
    description: 'Technicien en Électricité pour renforcer nos équipes dans le cadre du développement de nos activités.',
    requirements: ['Bac+3 Génie Électrique', '1-3 ans expérience similaire', 'Maîtrise installations électriques et normes sécurité', 'Esprit équipe, rigueur, sens responsabilités'],
    email: 'recrutement@em-energie.com',
    sourceCompany: 'EM-Énergie',
  },
  {
    title: 'Technicien Méthodes - Aéronautique',
    company: 'Fortil Group',
    city: 'Nouaceur',
    location: 'Nouaceur',
    sector: 'Industrie',
    contractType: 'CDI',
    description: 'Renforcer les équipes de production en interface avec la production, la qualité et le bureau d\'études. Garantir la bonne préparation des activités industrielles aéronautiques.',
    requirements: ['Bac+2 à Bac+3 génie mécanique', 'Exp similaire milieu industriel (aéronautique)', 'Connaissance procédés fabrication', 'Maîtrise Excel, Word, ERP', 'Rigueur, organisation, analyse'],
    email: 'recrutement.maroc@fortil.group',
    sourceCompany: 'Fortil Group',
  },
  {
    title: 'Directeur Sportif National - Fitness',
    company: 'Groupe Fitness Premium Maroc',
    city: 'Casablanca',
    location: 'Casablanca',
    sector: 'Commerce',
    contractType: 'CDI',
    description: 'Leader incontesté du secteur fitness avec réseau de clubs premium. Chef d\'orchestre de l\'expertise technique, garant de l\'ADN sportif avec architecte de l\'offre, audit terrain, elite management.',
    requirements: ['5+ ans management multisites', 'Expertise fitness haut niveau (musculation, cardio, cours collectifs)', 'Leadership fédérateur', 'Mobilité nationale', 'Disponibilité immédiate'],
    email: 'chassetetes@gmail.com',
    sourceCompany: 'Groupe Fitness Maroc',
  },
];

async function importOffers() {
  try {
    // Load existing jobs
    let jobs = [];
    try {
      jobs = await fs.readJson(JOBS_PATH);
    } catch {
      jobs = [];
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const existingSlugs = new Set(jobs.map(j => j.slug).filter(Boolean));

    const newJobs = [];
    const linkedinPosts = [];

    for (const offer of offers) {
      const slug = toSlug(offer.title, offer.city);
      let finalSlug = slug;
      let suffix = 2;
      while (existingSlugs.has(finalSlug)) {
        finalSlug = `${slug}-${suffix++}`;
      }
      existingSlugs.add(finalSlug);

      const jobUrl = `https://www.interactjob.ma/offres/${finalSlug}`;
      const job = {
        id: randomUUID(),
        title: offer.title,
        company: offer.company,
        companyInitials: getInitials(offer.company),
        companyColor: generateColor(offer.company),
        city: offer.city,
        sector: offer.sector,
        contractType: offer.contractType,
        description: offer.description,
        requirements: offer.requirements,
        salary: null,
        source: 'Direct',
        sourceUrl: null,
        postedAt: today,
        featured: false,
        sponsored: false,
        slug: finalSlug,
        country: 'Maroc',
        contract_type: offer.contractType,
        source_site: offer.sourceCompany,
        source_url: null,
        date_posted: today,
        date_scraped: now.toISOString(),
        date_expires: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expired: false,
        hr_commentary: `Opportunité de carrière chez ${offer.company} à ${offer.city}. Poste en ${offer.contractType} avec excellentes perspectives. Contact: ${offer.email}`,
        meta_title: `${offer.title} – ${offer.city}`.slice(0, 60),
        meta_description: `${offer.title} chez ${offer.company} à ${offer.city}. ${offer.requirements[0] || 'Candidature en ligne'} — Postulez sur InteractJob.ma`.slice(0, 155),
        linkedin_caption: `💼 ${offer.title}\n\n🏢 ${offer.company}\n📍 ${offer.city} | ${offer.contractType}\n\n✨ Profil recherché:\n${offer.requirements.slice(0, 3).map(r => `• ${r}`).join('\n')}\n\n👉 Détails & Candidature →${jobUrl}\n\n📲 Offres quotidiennes → https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j\n\n#EmploiMaroc #${offer.sector.replace(/\s+/g, '')} #Recrutement #InteractJob #Maroc`,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: offer.title,
          description: offer.description,
          datePosted: today,
          validThrough: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          employmentType: offer.contractType === 'CDI' ? 'FULL_TIME' : 'CONTRACTOR',
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: offer.city,
              addressCountry: 'MA',
            },
          },
          hiringOrganization: {
            '@type': 'Organization',
            name: offer.company,
          },
        },
      };

      newJobs.push(job);
      linkedinPosts.push(job);
      log(`✓ Job created: "${job.title}" — ${job.slug}`);
    }

    // Add to jobs.json (prepend for newest first)
    const finalJobs = [...newJobs, ...jobs];
    await fs.writeJson(JOBS_PATH, finalJobs, { spaces: 2 });
    log(`\n✓ jobs.json updated with ${newJobs.length} new jobs`);

    // Publish on LinkedIn
    log(`\n📱 Publishing ${linkedinPosts.length} posts on LinkedIn...`);
    let published = 0;
    for (const job of linkedinPosts) {
      try {
        const postId = await publishTextPost(job.linkedin_caption);
        if (postId) {
          published++;
          log(`✓ [${published}/${linkedinPosts.length}] "${job.title}" — ${postId}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        log(`✗ LinkedIn post failed: "${job.title}" — ${err.message}`);
      }
    }

    log(`\n${'='.repeat(60)}`);
    log(`✅ Import complete: ${newJobs.length} jobs added, ${published} posts published`);
    log(`${'='.repeat(60)}`);

  } catch (err) {
    log(`❌ Import failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
  process.exit(0);
}

importOffers();
