/**
 * InteractJob — GitHub Sync (API-based)
 * Pushes updated data files to GitHub after each scrape run.
 * Uses GitHub REST API directly — no git CLI needed.
 * Requires GITHUB_TOKEN and GITHUB_REPO env vars on Railway.
 */

import { readFileSync, existsSync } from 'fs';
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
  'data/published-posts.json', // LinkedIn dedup/anti-spam state — must persist across Railway restarts
];

const BRANCH = 'main';

async function githubRequest(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      Accept:         'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent':   'InteractJob-Agent/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${json.message || JSON.stringify(json)}`);
  return json;
}

export async function pushToGithub(message) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO; // e.g. "Adildrouz/interactjob"

  if (!token) { log('GitHub sync: GITHUB_TOKEN non défini — sync ignoré'); return; }
  if (!repo)  { log('GitHub sync: GITHUB_REPO non défini — sync ignoré');  return; }

  const commitMsg = message || `chore: agent data update ${new Date().toISOString()} [skip ci]`;
  const base      = `https://api.github.com/repos/${repo}`;

  try {
    // 1. Get current branch HEAD commit SHA
    const branchData = await githubRequest('GET', `${base}/branches/${BRANCH}`, token);
    const headSha    = branchData.commit.sha;
    const treeSha    = branchData.commit.commit.tree.sha;

    // 2. Build blobs for files that exist and have changed
    const treeEntries = [];
    let changed = false;

    for (const relPath of DATA_FILES) {
      const absPath = path.join(ROOT_DIR, relPath);
      if (!existsSync(absPath)) continue;

      const content    = readFileSync(absPath, 'utf-8');
      const b64Content = Buffer.from(content, 'utf-8').toString('base64');

      // Get current file SHA from GitHub (to detect changes)
      let remoteSha = null;
      try {
        const fileData = await githubRequest('GET', `${base}/contents/${relPath}?ref=${BRANCH}`, token);
        remoteSha = fileData.sha;

        // GitHub file SHA = sha1 of "blob {size}\0{content}"
        const { createHash } = await import('crypto');
        const raw     = readFileSync(absPath);
        const blobStr = `blob ${raw.length}\0`;
        const hash    = createHash('sha1')
          .update(Buffer.concat([Buffer.from(blobStr), raw]))
          .digest('hex');

        if (hash === remoteSha) continue; // File unchanged — skip
      } catch {
        // File doesn't exist on remote yet — include it
      }

      // Create blob
      const blobData = await githubRequest('POST', `${base}/git/blobs`, token, {
        content:  b64Content,
        encoding: 'base64',
      });

      treeEntries.push({
        path: relPath,
        mode: '100644',
        type: 'blob',
        sha:  blobData.sha,
      });
      changed = true;
    }

    if (!changed) {
      log('GitHub sync: aucun changement — commit ignoré');
      return;
    }

    // 3. Create new tree
    const newTree = await githubRequest('POST', `${base}/git/trees`, token, {
      base_tree: treeSha,
      tree:      treeEntries,
    });

    // 4. Create commit
    const newCommit = await githubRequest('POST', `${base}/git/commits`, token, {
      message: commitMsg,
      tree:    newTree.sha,
      parents: [headSha],
      author: {
        name:  'Adildrouz',
        email: 'adil.drouz@gmail.com',
        date:  new Date().toISOString(),
      },
    });

    // 5. Update branch ref
    await githubRequest('PATCH', `${base}/git/refs/heads/${BRANCH}`, token, {
      sha:   newCommit.sha,
      force: false,
    });

    log(`GitHub sync: ✓ données poussées vers GitHub (${treeEntries.length} fichier(s)) — ${newCommit.sha.slice(0, 7)}`);
  } catch (err) {
    log(`GitHub sync: ERREUR — ${err.message?.split('\n')[0]}`);
  }
}
