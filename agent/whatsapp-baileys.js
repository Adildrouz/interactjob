/**
 * WhatsApp Channel poster via Baileys (whatsapp-web protocol)
 * - Connects using the personal number that owns the channel
 * - QR code sent to Telegram on first launch (scan once)
 * - Auth session persisted in data/baileys-auth/
 * - Channel JID: 0029VbDDkicIXnlrXOBWxJ1j@newsletter
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from '@whiskeysockets/baileys';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR  = path.join(__dirname, '../data/baileys-auth');
const CHANNEL_JID = '0029VbDDkicIXnlrXOBWxJ1j@newsletter';

await fs.ensureDir(AUTH_DIR);

// ── Telegram QR sender ────────────────────────────────────────────────────────

async function sendQrToTelegram(qrText) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Always print in logs so Railway terminal is a fallback
  log('[baileys] QR prêt — scannez depuis Railway logs ou Telegram');

  if (!token || !chatId) return;

  try {
    const { default: QRCode } = await import('qrcode');

    // Generate as PNG buffer (high quality, no compression issues)
    const pngBuffer = await QRCode.toBuffer(qrText, {
      errorCorrectionLevel: 'M',
      type:   'png',
      width:  512,
      margin: 2,
    });

    // Send as document (not photo) — Telegram never compresses documents
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('document', pngBuffer, { filename: 'whatsapp-qr.png', contentType: 'image/png' });
    form.append('caption', '📱 Scannez ce QR WhatsApp\n\nWhatsApp → Appareils connectés → Connecter un appareil\n\n⏱ Expire dans 60 secondes — renvoie automatiquement si expiré.');

    await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body:   form,
      headers: form.getHeaders(),
    });
    log('[baileys] QR envoyé sur Telegram (document PNG haute qualité)');
  } catch (e) {
    log(`[baileys] Erreur envoi QR Telegram: ${e.message}`);
  }
}

async function sendTelegramText(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  }).catch(() => {});
}

// ── Socket factory ────────────────────────────────────────────────────────────

let sock = null;
let sockReady = false;
let connectPromise = null;

async function connect() {
  if (connectPromise) return connectPromise;
  connectPromise = _doConnect();
  return connectPromise;
}

async function _doConnect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds:  state.creds,
      keys:   makeCacheableSignalKeyStore(state.keys, { error: () => {} }),
    },
    browser:       Browsers.ubuntu('InteractJob-Agent'),
    printQRInTerminal: true,
    logger:        { level: 'silent', trace: ()=>{}, debug: ()=>{}, info: ()=>{}, warn: ()=>{}, error: ()=>{}, fatal: ()=>{}, child: ()=>({ trace:()=>{}, debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{}, fatal:()=>{} }) },
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connexion timeout (90s)')), 90000);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        log('[baileys] QR reçu — envoi sur Telegram...');
        await sendQrToTelegram(qr);
      }

      if (connection === 'open') {
        clearTimeout(timeout);
        sockReady = true;
        log('[baileys] ✓ Connecté à WhatsApp');
        await sendTelegramText('✅ *WhatsApp connecté !* L\'agent peut maintenant poster sur la chaîne.');
        resolve(sock);
      }

      if (connection === 'close') {
        sockReady = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        log(`[baileys] Déconnecté (code: ${code})`);
        if (loggedOut) {
          await fs.emptyDir(AUTH_DIR);
          log('[baileys] Session supprimée — reconnecter via QR');
          await sendTelegramText('⚠️ *WhatsApp déconnecté* (session expirée). Redémarrez l\'agent pour un nouveau QR.');
        }
        clearTimeout(timeout);
        connectPromise = null;
        reject(new Error(`Déconnecté: code ${code}`));
      }
    });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function postToChannel(message) {
  try {
    const socket = await connect();
    await socket.sendMessage(CHANNEL_JID, { text: message });
    log('[baileys] ✓ Message posté sur la chaîne WhatsApp');
    return true;
  } catch (e) {
    log(`[baileys] ✗ Erreur post chaîne: ${e.message}`);
    return false;
  } finally {
    // Close connection after posting to free resources on Railway
    if (sock) {
      try { sock.end(); } catch {}
      sock = null;
      sockReady = false;
      connectPromise = null;
    }
  }
}

export async function isSessionActive() {
  try {
    const credsPath = path.join(AUTH_DIR, 'creds.json');
    return await fs.pathExists(credsPath);
  } catch { return false; }
}

// Call on agent startup — triggers QR via Telegram if no session exists
export async function warmupConnection() {
  try {
    log('[baileys] Warmup: tentative de connexion...');
    await connect();
    log('[baileys] Warmup: connecté');
  } catch (e) {
    log(`[baileys] Warmup: ${e.message}`);
  }
}
