/**
 * IndexNow — notifie Bing (+ Yandex) immédiatement après chaque scrape
 * Docs: https://www.indexnow.org/documentation
 * Clé: vérifiable sur https://www.interactjob.ma/{KEY}.txt
 */

import axios from 'axios';
import { log } from './logger.js';

const HOST     = 'www.interactjob.ma';
const KEY      = process.env.INDEXNOW_KEY;
const ENDPOINT = 'https://api.indexnow.org/indexnow'; // soumet à Bing + Yandex en un seul appel

/**
 * Soumet une liste d'URLs à IndexNow.
 * @param {string[]} urls  URLs absolues à notifier (max 10 000 par appel)
 */
export async function notifyIndexNow(urls) {
  if (!KEY) {
    log('IndexNow: INDEXNOW_KEY non défini — skip');
    return;
  }

  const unique = [...new Set(
    (urls || []).filter(u => typeof u === 'string' && u.startsWith('https://'))
  )];

  if (unique.length === 0) {
    log('IndexNow: aucune URL à soumettre');
    return;
  }

  const body = {
    host:        HOST,
    key:         KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList:     unique,
  };

  try {
    const res = await axios.post(ENDPOINT, body, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: 15_000,
    });
    log(`IndexNow: ${unique.length} URL(s) soumises — HTTP ${res.status}`);
  } catch (err) {
    const status = err.response?.status;
    const detail = JSON.stringify(err.response?.data || err.message).slice(0, 120);
    // 422 = URLs already submitted recently — not an error
    if (status === 422) {
      log(`IndexNow: URLs déjà soumises récemment (HTTP 422) — normal`);
    } else {
      log(`IndexNow: ERREUR HTTP ${status ?? '?'} — ${detail}`);
    }
  }
}
