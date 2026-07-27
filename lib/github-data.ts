/**
 * GitHub-backed data persistence for the web app (Vercel = read-only FS).
 *
 * On serverless, the bundled `data/*.json` files cannot be written at runtime
 * (EROFS). Admin actions (approve/reject/submit) therefore persist by committing
 * the updated JSON files to GitHub via the REST API — exactly like the Railway
 * agent does in agent/github-sync.js. The push triggers a Vercel redeploy so the
 * change goes live.
 *
 * Locally (no GITHUB_TOKEN), callers fall back to plain fs.writeFile so that
 * `npm run dev` keeps working against the on-disk files.
 */

const BRANCH = "main";

/**
 * Strip lone (unpaired) UTF-16 surrogates from a string. These can end up
 * embedded via naive .slice()/.substring() truncation of text containing
 * astral-plane characters (bold Unicode, emoji). Node's JSON.parse tolerates
 * them, but stricter downstream parsers (e.g. Turbopack's) reject them as
 * invalid JSON, breaking every subsequent build until the bad data is fixed.
 */
function stripLoneSurrogates(str: string): string {
  return str.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    ""
  );
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "InteractJob-Web/1.0",
  };
}

async function ghRequest(
  method: string,
  url: string,
  token: string,
  body?: unknown
) {
  const res = await fetch(url, {
    method,
    headers: ghHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg =
      (json && (json.message as string)) || JSON.stringify(json);
    throw new Error(`GitHub API ${res.status}: ${msg}`);
  }
  return json;
}

/** True when GitHub persistence is configured (production / Vercel). */
export function githubConfigured(): boolean {
  return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

/** Read & parse the latest version of a JSON file from GitHub on `main`.
 *  Falls back to the Git Blob API for large files (>1 MB) where /contents/ returns content:null.
 *
 *  Do NOT use `download_url` for that fallback — it points at raw.githubusercontent.com,
 *  which is CDN-cached for several minutes. Two writes to the same large file (e.g. two
 *  employer-offer approvals a couple of minutes apart) can each read a stale cached copy
 *  and silently clobber each other's change on write — confirmed happening in production
 *  during Employer Space verification (2026-07-27): a second approved offer's publish
 *  overwrote data/jobs.json with a pre-first-approval snapshot, wiping the first offer.
 *  The Git Data Blob API (`/git/blobs/{sha}`) reads the object store directly, keyed by
 *  the exact blob sha from this same request, so it can't return a stale cached body. */
export async function readJsonFromGithub<T>(relPath: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN as string;
  const repo = process.env.GITHUB_REPO as string;
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURI(
    relPath
  )}?ref=${BRANCH}`;
  const data = await ghRequest("GET", url, token);

  // GitHub /contents/ API truncates content for files >1 MB
  if (!data.content && data.sha) {
    const blob = await ghRequest(
      "GET",
      `https://api.github.com/repos/${repo}/git/blobs/${data.sha}`,
      token
    );
    const content = Buffer.from(
      blob.content,
      (blob.encoding as BufferEncoding) || "base64"
    ).toString("utf-8");
    return JSON.parse(content) as T;
  }

  const content = Buffer.from(
    data.content,
    (data.encoding as BufferEncoding) || "base64"
  ).toString("utf-8");
  return JSON.parse(content) as T;
}

/**
 * Commit one or more JSON files to GitHub in a single commit.
 * Uses the tree API with the current branch tree as base, so files NOT listed
 * here (e.g. data the agent just pushed) are preserved untouched.
 * Returns the new commit SHA.
 */
export async function commitJsonFilesToGithub(
  files: { path: string; data: unknown }[],
  message: string
): Promise<string> {
  const token = process.env.GITHUB_TOKEN as string;
  const repo = process.env.GITHUB_REPO as string;
  const base = `https://api.github.com/repos/${repo}`;

  // 1. Current branch HEAD + tree
  const branchData = await ghRequest("GET", `${base}/branches/${BRANCH}`, token);
  const headSha = branchData.commit.sha as string;
  const treeSha = branchData.commit.commit.tree.sha as string;

  // 2. Create a blob for each file
  const treeEntries = [];
  for (const f of files) {
    const content = stripLoneSurrogates(JSON.stringify(f.data, null, 2));
    const blob = await ghRequest("POST", `${base}/git/blobs`, token, {
      content: Buffer.from(content, "utf-8").toString("base64"),
      encoding: "base64",
    });
    treeEntries.push({
      path: f.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha as string,
    });
  }

  // 3. New tree based on current head tree
  const newTree = await ghRequest("POST", `${base}/git/trees`, token, {
    base_tree: treeSha,
    tree: treeEntries,
  });

  // 4. Commit
  const newCommit = await ghRequest("POST", `${base}/git/commits`, token, {
    message,
    tree: newTree.sha,
    parents: [headSha],
    author: {
      name: "InteractJob Admin",
      email: "adil.drouz@gmail.com",
      date: new Date().toISOString(),
    },
  });

  // 5. Move the branch ref
  await ghRequest("PATCH", `${base}/git/refs/heads/${BRANCH}`, token, {
    sha: newCommit.sha,
    force: false,
  });

  return newCommit.sha as string;
}
