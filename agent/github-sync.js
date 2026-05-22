/**
 * InteractJob â€” GitHub Sync
 * Pushes updated data files to GitHub after each scrape run.
 * Requires GITHUB_TOKEN and GITHUB_REPO env vars on Railway.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR  = path.join(__dirname, '..');

const DATA_FILES = [
  'data/jobs.json',
  'data/articles.json',
  'data/concours.json',
  'data/remote-jobs.json',
];

export async function pushToGithub(message) {
  if (!process.env.GITHUB_TOKEN) {
    log('GitHub sync: GITHUB_TOKEN non défini â€” sync ignoré');
    return;
  }
  if (!process.env.GITHUB_REPO) {
    log('GitHub sync: GITHUB_REPO non défini â€” sync ignoré');
    return;
  }

  const repoUrl    = `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPO}.git`;
  const commitMsg  = message || `chore: agent data update ${new Date().toISOString()} [skip ci]`;

  try {
    execSync(`git config user.email "agent@interactjob.ma"`, { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync(`git config user.name "InteractJob Agent"`,    { cwd: ROOT_DIR, stdio: 'pipe' });

    // Stage only the data files that actually exist
    const filesToAdd = DATA_FILES.join(' ');
    execSync(`git add ${filesToAdd}`, { cwd: ROOT_DIR, stdio: 'pipe' });

    // Commit only if there are staged changes
    try {
      execSync(`git diff --cached --quiet`, { cwd: ROOT_DIR, stdio: 'pipe' });
      log('GitHub sync: aucun changement â€” commit ignoré');
    } catch {
      // diff --cached --quiet exits 1 when there are changes â†’ commit
      execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT_DIR, stdio: 'pipe' });
      execSync(`git push ${repoUrl} main`,     { cwd: ROOT_DIR, stdio: 'pipe' });
      log('GitHub sync: âœ“ données poussées vers GitHub');
    }
  } catch (err) {
    log(`GitHub sync: ERREUR â€” ${err.message?.split('\n')[0]}`);
  }
}
