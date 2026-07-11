/**
 * verifyArticleLive — Next.js/admin-side mirror of agent/lib/verify-article-live.js.
 *
 * Kept as a separate implementation (not a shared import) because the agent
 * runs as an independent Node process on Railway while this runs in Vercel
 * functions — the two never share a runtime, only the same repo/data files.
 * Any behavior change here should be mirrored in the agent's copy.
 */

export interface VerifyResult {
  ok: boolean;
  status: number;
  reason: string;
}

const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT = "InteractJob-LinkVerifier/1.0 (+https://www.interactjob.ma)";

export async function verifyArticleLive(
  url: string,
  opts: { expectedTitle?: string; expectedPathIncludes?: string; timeoutMs?: number } = {}
): Promise<VerifyResult> {
  const { expectedTitle, expectedPathIncludes, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;

  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });
    clearTimeout(timer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, reason: `fetch_failed: ${message}` };
  }

  const status = res.status;
  if (status !== 200) {
    return { ok: false, status, reason: `http_${status}` };
  }

  if (expectedPathIncludes && res.url && !res.url.includes(expectedPathIncludes)) {
    return { ok: false, status, reason: `redirected_away: ${res.url}` };
  }

  let html: string;
  try {
    html = await res.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status, reason: `body_read_failed: ${message}` };
  }

  if (html.includes('id="__next_error__"')) {
    return { ok: false, status, reason: "rendered_error_shell" };
  }

  if (!/<article[\s>]/i.test(html)) {
    return { ok: false, status, reason: "no_article_content" };
  }

  if (expectedTitle) {
    const normalizedHtml = html.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
    if (!normalizedHtml.includes(expectedTitle)) {
      return { ok: false, status, reason: "title_mismatch" };
    }
  }

  return { ok: true, status, reason: "live" };
}

export function articleUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, "")}/blog/${slug}`;
}
