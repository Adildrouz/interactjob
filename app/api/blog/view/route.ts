import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const VIEWS_PATH = path.join(process.cwd(), 'data/article-views.json');

async function readViews(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(VIEWS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== 'string') return NextResponse.json({ ok: false });

    const views = await readViews();
    views[slug] = (views[slug] || 0) + 1;
    await fs.writeFile(VIEWS_PATH, JSON.stringify(views, null, 2));

    return NextResponse.json({ ok: true, views: views[slug] });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function GET() {
  const views = await readViews();
  return NextResponse.json(views);
}
