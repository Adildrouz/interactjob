import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Aucun fichier reçu' }, { status: 400 });
  }

  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Aucun fichier reçu' }, { status: 400 });
    }

    const mimeType = file.type;
    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = '';

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Import internal lib file directly — pdf-parse index.js reads a test PDF
      // from disk on require() which does not exist in the Vercel bundle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      text = data.text.trim();
    }

    // ── DOCX / DOC ───────────────────────────────────────────────────────────
    else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value.trim();
    }

    // ── TXT ──────────────────────────────────────────────────────────────────
    else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
      text = buffer.toString('utf-8').trim();
    }

    else {
      return NextResponse.json(
        { success: false, error: 'Format non supporté. Utilisez PDF, DOCX ou TXT.' },
        { status: 415 }
      );
    }

    if (!text || text.length < 20) {
      return NextResponse.json(
        { success: false, error: 'Le fichier semble vide ou illisible. Essayez un autre format.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, text });
  } catch (err) {
    console.error('[extract-text]', err);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la lecture du fichier.' },
      { status: 500 }
    );
  }
}
