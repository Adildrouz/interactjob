import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyArticleLive, articleUrl } from "@/lib/verifyArticleLive";

const LINK_HEALTH_PATH = path.join(process.cwd(), "data/link-health.json");
const BLOCKED_PATH = path.join(process.cwd(), "data/blocked-posts.json");
const ARTICLES_PATH = path.join(process.cwd(), "data/articles.json");
const SITE_URL = "https://www.interactjob.ma";

interface LinkHealthItem {
  slug: string;
  url: string;
  title: string | null;
  ok: boolean;
  status: number;
  reason: string;
  postCount: number;
  lastPublishedDate: string;
  checkedAt: string;
}
interface LinkHealthSnapshot {
  generatedAt: string | null;
  totalPosts: number;
  verifiedCount: number;
  brokenCount: number;
  items: LinkHealthItem[];
}
interface BlockedEntry {
  blockedAt: string;
  url: string;
  reason: string;
  status: number;
  label: string | null;
  textExcerpt: string;
}
interface ArticleRecord {
  slug: string;
  title: string;
  [key: string]: unknown;
}

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8"));
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [health, blocked] = await Promise.all([
    readJson<LinkHealthSnapshot>(LINK_HEALTH_PATH, { generatedAt: null, totalPosts: 0, verifiedCount: 0, brokenCount: 0, items: [] }),
    readJson<BlockedEntry[]>(BLOCKED_PATH, []),
  ]);

  return NextResponse.json({
    generatedAt: health.generatedAt,
    totalPosts: health.totalPosts,
    verifiedCount: health.verifiedCount,
    brokenCount: health.brokenCount,
    items: health.items,
    blocked: blocked.slice(-20).reverse(), // most recent blocks first
  });
}

// On-demand re-check ("Vérifier maintenant") — live, not persisted (Vercel fs
// is read-only at runtime; the daily agent-side cron is what persists results).
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { slug } = await req.json().catch(() => ({ slug: undefined as string | undefined }));

  const articles = await readJson<ArticleRecord[]>(ARTICLES_PATH, []);

  const targets = slug
    ? articles.filter((a) => a.slug === slug)
    : articles;

  if (slug && targets.length === 0) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  const results = await Promise.all(
    targets.map(async (a) => {
      const url = articleUrl(SITE_URL, a.slug);
      const check = await verifyArticleLive(url, { expectedPathIncludes: "/blog/", expectedTitle: a.title });
      return { slug: a.slug, title: a.title, url, ...check, checkedAt: new Date().toISOString() };
    })
  );

  return NextResponse.json({ results });
}
