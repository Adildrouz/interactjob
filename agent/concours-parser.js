/**
 * Concours de la Fonction Publique — Scraper
 * Source: alwadifa-maroc.com
 * Fetches latest concours, translates AR→FR via Claude, saves to data/concours.json
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const CONCOURS_PATH = path.join(__dirname, '../data/concours.json');
const BASE_URL      = 'https://alwadifa-maroc.com';
const MAX_NEW       = 15;
const TIMEOUT       = 15000;

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function loadConcours() {
  try { return fs.readJsonSync(CONCOURS_PATH); } catch { return []; }
}

async function fetchPage(url) {
  const res = await axios.get(url, {
    timeout: TIMEOUT,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InteractJobBot/1.0)' },
  });
  return cheerio.load(res.data);
}

async function fetchListingIds() {
  const $ = await fetchPage(BASE_URL);
  const ids = new Set();
  $('a[href*="/offre/show/id/"]').each((_, el) => {
    const m = $(el).attr('href').match(/\/offre\/show\/id\/(\d+)/);
    if (m) ids.add(parseInt(m[1]));
  });
  return [...ids].sort((a, b) => b - a); // newest first
}

async function fetchConcoursDetail(id) {
  const url = `${BASE_URL}/offre/show/id/${id}`;
  const $ = await fetchPage(url);

  // JSON-LD metadata
  let datePosted = '';
  let organization_ar = '';
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data.datePosted) datePosted = data.datePosted;
      if (data.hiringOrganization?.name) organization_ar = data.hiringOrganization.name;
    } catch {}
  });

  const title_ar = $('h1').first().text().trim().replace(/\s+/g, ' ');

  // Main content
  const contentHtml = $('.job-content').html() || $('.main-content-container').html() || '';
  const content_ar = $('<div>').html(contentHtml).text().replace(/\s+/g, ' ').trim().slice(0, 3000);

  return { title_ar, organization_ar, datePosted, content_ar, sourceUrl: url, sourceId: id };
}

async function enrichWithClaude(raw) {
  const prompt = `Tu es un assistant spécialisé dans les concours de la fonction publique marocaine.

Voici un concours en arabe :
Titre (AR) : ${raw.title_ar}
Organisation (AR) : ${raw.organization_ar}
Date de publication : ${raw.datePosted}
Contenu (AR) : ${raw.content_ar}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown) avec ces champs :
{
  "title_fr": "Titre traduit en français (clair et concis)",
  "organization_fr": "Nom de l'organisation en français",
  "deadline": "Date limite YYYY-MM-DD ou null si non trouvée",
  "postes": nombre_entier_ou_null,
  "niveau": "Bac / Bac+2 / Bac+3 / Licence / Master / Ingénieur / Tous niveaux / null",
  "meta_title": "Titre SEO en français (max 60 chars)",
  "meta_description": "Description SEO en français (max 155 chars)",
  "summary_fr": "Résumé en français du concours (2-3 phrases claires pour les candidats)"
}`;

  const res = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.content[0].text.trim();
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(jsonStr);
}

function makeSlug(title_fr, id) {
  const base = title_fr
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}-${id}`;
}

export async function fetchConcours() {
  log('Concours: démarrage du scraping (alwadifa-maroc.com)');

  const existing  = loadConcours();
  const existIds  = new Set(existing.map(c => c.sourceId));

  let listingIds;
  try {
    listingIds = await fetchListingIds();
  } catch (err) {
    log(`Concours: ERREUR listing — ${err.message}`);
    return { added: 0, total: existing.length };
  }

  const newIds = listingIds.filter(id => !existIds.has(id)).slice(0, MAX_NEW);
  log(`Concours: ${listingIds.length} trouvés, ${newIds.length} nouveaux à traiter`);

  if (newIds.length === 0) {
    log('Concours: aucun nouveau concours');
    return { added: 0, total: existing.length };
  }

  const newConcours = [];
  let enriched = 0, failed = 0;

  for (const id of newIds) {
    try {
      const raw = await fetchConcoursDetail(id);
      if (!raw.title_ar) { failed++; continue; }

      let enrichment = {};
      try {
        enrichment = await enrichWithClaude(raw);
        enriched++;
      } catch (err) {
        log(`  ⚠ Claude fallback pour concours ${id}: ${err.message}`);
        enrichment = {
          title_fr: raw.title_ar,
          organization_fr: raw.organization_ar,
          deadline: null,
          postes: null,
          niveau: null,
          meta_title: raw.title_ar.slice(0, 60),
          meta_description: raw.content_ar.slice(0, 155),
          summary_fr: '',
        };
        failed++;
      }

      newConcours.push({
        id:              uuidv4(),
        sourceId:        id,
        sourceUrl:       raw.sourceUrl,
        title_ar:        raw.title_ar,
        title_fr:        enrichment.title_fr || raw.title_ar,
        organization_ar: raw.organization_ar,
        organization_fr: enrichment.organization_fr || raw.organization_ar,
        datePosted:      raw.datePosted,
        deadline:        enrichment.deadline || null,
        postes:          enrichment.postes   || null,
        niveau:          enrichment.niveau   || null,
        content_ar:      raw.content_ar,
        summary_fr:      enrichment.summary_fr || '',
        meta_title:      enrichment.meta_title || '',
        meta_description: enrichment.meta_description || '',
        slug:            makeSlug(enrichment.title_fr || `concours-${id}`, id),
      });

      // small delay to be polite
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      log(`  ⚠ Concours ${id} ignoré: ${err.message}`);
      failed++;
    }
  }

  if (newConcours.length > 0) {
    const updated = [...newConcours, ...existing];
    fs.writeJsonSync(CONCOURS_PATH, updated, { spaces: 2 });
    log(`Concours: ${enriched} enrichis, ${failed} échoués. ${newConcours.length} ajoutés. Total: ${updated.length}`);
    return { added: newConcours.length, total: updated.length, newItems: newConcours };
  }

  return { added: 0, total: existing.length };
}
