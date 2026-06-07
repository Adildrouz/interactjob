import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ARTICLES_PATH = path.join(process.cwd(), "data/articles.json");

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const raw = await fs.readFile(ARTICLES_PATH, "utf-8");
    const articles: any[] = JSON.parse(raw);
    const before = articles.length;
    const filtered = articles.filter(a => a.id !== id && a.slug !== id);

    if (filtered.length === before) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

    await fs.writeFile(ARTICLES_PATH, JSON.stringify(filtered, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const { published } = await req.json();
    const raw = await fs.readFile(ARTICLES_PATH, "utf-8");
    const articles: any[] = JSON.parse(raw);
    const idx = articles.findIndex(a => a.id === id || a.slug === id);

    if (idx === -1) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

    articles[idx] = { ...articles[idx], published };
    await fs.writeFile(ARTICLES_PATH, JSON.stringify(articles, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
