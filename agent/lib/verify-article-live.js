/**
 * verifyArticleLive — the article-first publishing gate's core check.
 *
 * A LinkedIn/social post referencing a blog article may only be marked
 * "ready"/"published" once this returns { ok: true } for the article's live URL.
 *
 * Checks (in order):
 *   1. The URL is reachable and returns HTTP 200 after following redirects.
 *   2. The final URL didn't get bounced to the homepage or another path
 *      (soft-redirect-to-home is a common "page doesn't really exist" pattern).
 *   3. The rendered HTML is not Next.js's error/not-found shell
 *      (id="__next_error__" — confirmed empirically as this site's 404 signature).
 *   4. The page contains a real <article> content container.
 *   5. Optionally, the page contains the expected article title (strongest check,
 *      used when the caller knows the title up front).
 */

const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT = 'InteractJob-LinkVerifier/1.0 (+https://www.interactjob.ma)';

export async function verifyArticleLive(url, opts = {}) {
  const { expectedTitle, expectedPathIncludes, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;

  let res;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timer);
  } catch (err) {
    return { ok: false, status: 0, reason: `fetch_failed: ${err.message}` };
  }

  const status = res.status;
  if (status !== 200) {
    return { ok: false, status, reason: `http_${status}` };
  }

  if (expectedPathIncludes && res.url && !res.url.includes(expectedPathIncludes)) {
    return { ok: false, status, reason: `redirected_away: ${res.url}` };
  }

  let html;
  try {
    html = await res.text();
  } catch (err) {
    return { ok: false, status, reason: `body_read_failed: ${err.message}` };
  }

  if (html.includes('id="__next_error__"')) {
    return { ok: false, status, reason: 'rendered_error_shell' };
  }

  if (!/<article[\s>]/i.test(html)) {
    return { ok: false, status, reason: 'no_article_content' };
  }

  if (expectedTitle) {
    const normalizedHtml = html.replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
    if (!normalizedHtml.includes(expectedTitle)) {
      return { ok: false, status, reason: 'title_mismatch' };
    }
  }

  return { ok: true, status, reason: 'live' };
}

export function articleUrl(siteUrl, slug) {
  return `${siteUrl.replace(/\/$/, '')}/blog/${slug}`;
}
