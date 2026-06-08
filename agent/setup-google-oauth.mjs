/**
 * Run once to authorize Google Analytics + Search Console access.
 * Usage: node setup-google-oauth.mjs <path-to-client-secret.json>
 *
 * This opens a browser, you log in with your Google account,
 * then the script prints the refresh token to save in env vars.
 */
import { google } from 'googleapis';
import http from 'http';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node setup-google-oauth.mjs <client-secret.json>');
  process.exit(1);
}

const { client_id, client_secret } = JSON.parse(readFileSync(arg, 'utf8')).installed
  || JSON.parse(readFileSync(arg, 'utf8')).web
  || (() => { throw new Error('Format client secret non reconnu'); })();

const REDIRECT_PORT = 4242;
const REDIRECT_URI  = `http://localhost:${REDIRECT_PORT}`;

const oauth2 = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

// Open browser automatically on Windows
import { exec } from 'child_process';
exec(`start "" "${authUrl}"`);
console.log('\n🌐 Navigateur ouvert — connecte-toi avec adil.drouz@gmail.com');
console.log('   (Si le navigateur ne s\'ouvre pas : colle ce lien manuellement)');
console.log('\n' + authUrl + '\n');

// Local server catches the redirect
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', REDIRECT_URI);
  const code = urlObj.searchParams.get('code');

  if (!code) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('waiting...');
    return;
  }
  res.end('<html><body><h2 style="font-family:sans-serif">✅ Authentifié ! Tu peux fermer cet onglet.</h2></body></html>');
  server.close();

  try {
    const { tokens } = await oauth2.getToken(code);

    console.log('\n✅ Refresh token obtenu avec succès !\n');
    console.log('Ajoute ces variables dans agent/.env et Railway :\n');
    console.log(`GOOGLE_CLIENT_ID=${client_id}`);
    console.log(`GOOGLE_CLIENT_SECRET=${client_secret}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

    // Auto-append to .env
    const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const lines = [];
    if (!envContent.includes('GOOGLE_CLIENT_ID'))
      lines.push(`GOOGLE_CLIENT_ID=${client_id}`);
    if (!envContent.includes('GOOGLE_CLIENT_SECRET'))
      lines.push(`GOOGLE_CLIENT_SECRET=${client_secret}`);
    if (tokens.refresh_token && !envContent.includes('GOOGLE_REFRESH_TOKEN'))
      lines.push(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    if (lines.length > 0) {
      import('fs').then(({ appendFileSync }) => appendFileSync(envPath, '\n' + lines.join('\n') + '\n'));
      console.log('\n✅ Variables ajoutées automatiquement à agent/.env');
      console.log('   → Copie aussi GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET et GOOGLE_REFRESH_TOKEN sur Railway\n');
    }
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}).listen(REDIRECT_PORT, () => {
  console.log(`⏳ En attente d'autorisation sur port ${REDIRECT_PORT}...`);
});
