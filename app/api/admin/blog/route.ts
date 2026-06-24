import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ARTICLES_PATH = path.join(process.cwd(), "data/articles.json");
const VIEWS_PATH = path.join(process.cwd(), "data/article-views.json");

async function readViews(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(VIEWS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const [raw, views] = await Promise.all([
      fs.readFile(ARTICLES_PATH, "utf-8"),
      readViews(),
    ]);
    const articles: any[] = JSON.parse(raw);
    // Return lightweight list (no full content)
    const list = articles.map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      lang: a.lang,
      publishedAt: a.publishedAt || a.date,
      published: a.published !== false,
      readTime: a.readTime,
      author: a.author,
      pilier: a.pilier,
      views: views[a.slug] || 0,
    }));
    // Sort newest first
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return NextResponse.json({ articles: list, total: list.length });
  } catch {
    return NextResponse.json({ articles: [], total: 0 });
  }
}
