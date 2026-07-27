/**
 * Shared failure reporting for the agent daemon.
 *
 * Recurring bug pattern in this codebase: a catch block logs an error to
 * stdout and returns null, so the caller (and the daemon's own state) looks
 * identical to a genuine "nothing to do" outcome. On Railway, stdout-only
 * logs are invisible unless someone happens to be tailing `railway logs` —
 * which is how a LinkedIn token expiry silently killed all personal-profile
 * posting for 2 days (2026-07-25 to 2026-07-27) before anyone noticed.
 *
 * recordFailure() makes a failure visible two ways: an immediate Telegram
 * alert, and a git-tracked record in data/agent-failures.json (kept even if
 * Telegram itself is misconfigured, and inspectable after the fact without
 * needing Railway log access).
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from '../logger.js';
import { pushToGithub } from '../github-sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAILURES_PATH = path.join(__dirname, '../../data/agent-failures.json');
const MAX_FAILURES = 200;

export async function notifyTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const https = await import('https');
    const body  = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
    await new Promise((resolve) => {
      const req = https.default.request(
        `https://api.telegram.org/bot${token}/sendMessage`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
        (res) => { res.resume(); res.on('end', resolve); }
      );
      req.on('error', resolve);
      req.write(body);
      req.end();
    });
  } catch (_) { /* never crash because of a notification failure */ }
}

/**
 * @param {string} context short label identifying what failed, e.g. "LinkedIn text (profil)"
 * @param {unknown} err the caught error
 * @param {{ status?: number|string }} [extra] optional HTTP status if not on err.response.status
 */
export async function recordFailure(context, err, extra = {}) {
  const status  = extra.status ?? err?.response?.status ?? null;
  const message = err?.response?.data?.message || err?.message || String(err);
  const entry   = { context, status, message, timestamp: new Date().toISOString() };

  try {
    let failures = [];
    try { failures = await fs.readJson(FAILURES_PATH); } catch { failures = []; }
    failures.push(entry);
    if (failures.length > MAX_FAILURES) failures = failures.slice(-MAX_FAILURES);
    await fs.writeJson(FAILURES_PATH, failures, { spaces: 2 });
    await pushToGithub(`chore: record failure — ${context} [skip ci]`, ['data/agent-failures.json']);
  } catch (persistErr) {
    log(`[failure] could not persist failure record for "${context}" — ${persistErr.message}`);
  }

  await notifyTelegram(`🔴 *${context}*\n\`${status ?? 'ERR'}\`\n${message}\n\n${entry.timestamp}`);

  return entry;
}
