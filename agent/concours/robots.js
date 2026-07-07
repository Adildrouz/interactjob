/**
 * robots.txt compliance + respectful fetching for the concours scrapers.
 * One instance per host: fetches robots.txt once, caches disallowed paths,
 * and enforces a randomized delay between every request to that host.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../logger.js';

const USER_AGENT = 'InteractJobBot/1.0 (+https://www.interactjob.ma; contact@interactjob.ma)';
const TIMEOUT = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDisallowedPaths(robotsTxt) {
  const paths = [];
  let appliesToUs = false;
  for (const rawLine of robotsTxt.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      appliesToUs = value === '*';
    } else if (key === 'disallow' && appliesToUs && value) {
      paths.push(value);
    }
  }
  return paths;
}

/**
 * Creates a politeFetch(url) bound to one host — fetches robots.txt once,
 * refuses to fetch disallowed paths, and waits minDelayMs–maxDelayMs
 * between every request to be a good citizen.
 */
export function createPoliteFetcher(baseUrl, { minDelayMs = 3000, maxDelayMs = 5000 } = {}) {
  const origin = new URL(baseUrl).origin;
  let disallowedPaths = null;
  let lastRequestAt = 0;

  async function loadRobots() {
    if (disallowedPaths) return disallowedPaths;
    try {
      const res = await axios.get(`${origin}/robots.txt`, {
        timeout: TIMEOUT,
        headers: { 'User-Agent': USER_AGENT },
      });
      disallowedPaths = parseDisallowedPaths(res.data);
      log(`Concours[${origin}]: robots.txt chargé — ${disallowedPaths.length} chemin(s) interdit(s)`);
    } catch (err) {
      log(`Concours[${origin}]: robots.txt introuvable/erreur (${err.message}) — aucun chemin exclu par défaut`);
      disallowedPaths = [];
    }
    return disallowedPaths;
  }

  function isAllowed(url) {
    const path = new URL(url).pathname;
    return !disallowedPaths.some((d) => path.startsWith(d));
  }

  async function waitForSlot() {
    const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < delay) await sleep(delay - elapsed);
    lastRequestAt = Date.now();
  }

  return async function politeFetch(url) {
    await loadRobots();
    if (!isAllowed(url)) {
      throw new Error(`robots.txt disallows ${url} — skipping`);
    }
    await waitForSlot();
    const res = await axios.get(url, {
      timeout: TIMEOUT,
      headers: { 'User-Agent': USER_AGENT },
    });
    return cheerio.load(res.data);
  };
}

export { USER_AGENT };
