import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
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
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      // @ts-ignore — legacy build types
      pdfjsLib.GlobalWorkerOptions.workerSrc = false;

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdfDoc = await loadingTask.promise;

      const pages: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        pages.push(pageText);
      }
      text = pages.join('\n\n').trim();
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
