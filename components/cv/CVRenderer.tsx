"use client"

import React, { useRef } from 'react';
import { trackToolEvent } from '@/lib/trackToolEvent';

interface CVRendererProps {
  content: string;
  cvData: any;
  language: string;
  jobTitle?: string;
  userLocation?: string;
}

export default function CVRenderer({ content, cvData, language, jobTitle, userLocation }: CVRendererProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showJobOffers, setShowJobOffers] = React.useState(false);

  const handlePrint = () => {
    try { (window as any).ev && (window as any).ev('download_cv', { method: 'print' }); } catch {}
    trackToolEvent('cv_builder', 'cv_downloaded', { metadata: { doc_type: 'cv', method: 'print' } });
    setShowJobOffers(true);
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CV - ${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }

          .cv-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
          }

          .cv-header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .cv-name {
            font-size: 2.5em;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 700;
          }

          .cv-contact {
            font-size: 1.1em;
            color: #7f8c8d;
            margin-top: 10px;
          }

          .cv-contact span {
            margin: 0 15px;
          }

          .cv-content {
            margin-top: 30px;
          }

          .cv-section {
            margin-bottom: 25px;
          }

          .cv-section-title {
            font-size: 1.4em;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3498db;
            font-weight: 600;
          }

          .cv-section-content {
            line-height: 1.7;
            text-align: justify;
          }

          .cv-section-content h3 {
            font-size: 1.2em;
            color: #34495e;
            margin: 15px 0 8px 0;
            font-weight: 600;
          }

          .cv-section-content h4 {
            font-size: 1.1em;
            color: #34495e;
            margin: 12px 0 6px 0;
            font-weight: 600;
          }

          .cv-section-content ul {
            margin: 10px 0;
            padding-left: 25px;
          }

          .cv-section-content li {
            margin-bottom: 6px;
          }

          .cv-section-content p {
            margin-bottom: 12px;
          }

          .cv-section-content strong {
            color: #2c3e50;
            font-weight: 600;
          }

          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
            transition: all 0.3s ease;
          }

          .print-button:hover {
            background: #2980b9;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadHTML = () => {
    try { (window as any).ev && (window as any).ev('download_cv', { method: 'html' }); } catch {}
    trackToolEvent('cv_builder', 'cv_downloaded', { metadata: { doc_type: 'cv', method: 'html' } });
    setShowJobOffers(true);
    const printContent = printRef.current;
    if (!printContent) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CV - ${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}</title>
        <style>
          @media print { body { margin: 0; } }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; padding: 20px; }
          .cv-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 10px; }
          .cv-header { text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
          .cv-name { font-size: 2.5em; color: #2c3e50; margin-bottom: 10px; font-weight: 700; }
          .cv-contact { font-size: 1.1em; color: #7f8c8d; margin-top: 10px; }
          .cv-contact span { margin: 0 15px; }
          .cv-content { margin-top: 30px; }
          .cv-section { margin-bottom: 25px; }
          .cv-section-title { font-size: 1.4em; color: #2c3e50; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #3498db; font-weight: 600; }
          .cv-section-content { line-height: 1.7; text-align: justify; }
          .cv-section-content h3 { font-size: 1.2em; color: #34495e; margin: 15px 0 8px 0; font-weight: 600; }
          .cv-section-content h4 { font-size: 1.1em; color: #34495e; margin: 12px 0 6px 0; font-weight: 600; }
          .cv-section-content ul { margin: 10px 0; padding-left: 25px; }
          .cv-section-content li { margin-bottom: 6px; }
          .cv-section-content p { margin-bottom: 12px; }
          .cv-section-content strong { color: #2c3e50; font-weight: 600; }
          .print-btn { position: fixed; top: 20px; right: 20px; background: #3498db; color: white; padding: 12px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimer/PDF</button>
        ${printContent.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Convertir le contenu markdown en HTML structuré
  const formatContentToHTML = (content: string): string => {
    if (!content) return '';

    let htmlContent = content;

    // Convertir les titres
    htmlContent = htmlContent.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    htmlContent = htmlContent.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    htmlContent = htmlContent.replace(/^# (.+)$/gm, '<h2 class="cv-section-title">$1</h2>');

    // Convertir le texte en gras
    htmlContent = htmlContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convertir les listes
    htmlContent = htmlContent.replace(/^- (.+)$/gm, '<li>$1</li>');
    htmlContent = htmlContent.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convertir les paragraphes
    const paragraphs = htmlContent.split('\n\n').filter(p => p.trim());
    htmlContent = paragraphs.map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<div')) {
        return trimmed;
      }
      const withBreaks = trimmed.replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    }).join('\n');

    return htmlContent;
  };

  const formattedContent = formatContentToHTML(content);

  function determineIndeedDomain(loc: string): string {
    const l = (loc || '').toLowerCase();
    if (l.includes('france') || l.includes('fr ')) return 'fr.indeed.com';
    if (l.includes('belgique') || l.includes('belgie') || l.includes('belgië') || l.includes('be ')) return 'be.indeed.com';
    if (l.includes('luxembourg') || l.includes('lu ')) return 'lu.indeed.com';
    if (l.includes('pays-bas') || l.includes('netherlands') || l.includes('nl ')) return 'nl.indeed.com';
    return 'www.indeed.com';
  }

  const computedJobTitle = (jobTitle || '').trim() || (cvData?.experiences?.[0]?.position || '').toString();
  const computedLocation = (userLocation || cvData?.personalInfo?.location || '').toString();
  const indeedDomain = determineIndeedDomain(computedLocation);
  const skillsList: string[] = Array.isArray(cvData?.skills) ? cvData.skills.slice(0, 5) : [];
  const query = encodeURIComponent([computedJobTitle, ...skillsList].filter(Boolean).join(' '));
  const cityParam = encodeURIComponent(computedLocation);
  const indeedUrl = `https://${indeedDomain}/jobs?q=${query}&l=${cityParam}`;
  const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${cityParam}`;

  return (
    <div className="bg-white">
      {/* Boutons d'action */}
      <div className="flex justify-end gap-3 mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🖨️ Imprimer/PDF
        </button>
        <button
          onClick={handleDownloadHTML}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          📄 Télécharger HTML
        </button>
      </div>

      {/* CV Content */}
      <div
        ref={printRef}
        className="cv-container bg-white shadow-lg rounded-lg border p-8"
      >
        <div className="cv-header">
          <h1 className="cv-name">
            {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
          </h1>
          <div className="cv-contact">
            <span>📧 {cvData.personalInfo.email}</span>
            <span>📱 {cvData.personalInfo.phone}</span>
            <span>📍 {cvData.personalInfo.location}</span>
          </div>
        </div>

        <div
          className="cv-content cv-section-content"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      </div>

      {/* Offres d'emploi contextuelles (affichées après téléchargement/impression) */}
      {showJobOffers && (
        <div className="mt-8">
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href={indeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border bg-white hover:shadow-lg transition-shadow p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-gray-900">Offres Indeed</div>
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">Direct</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {computedJobTitle || 'Emplois'} • {computedLocation || 'Votre région'}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {skillsList.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded text-gray-700">{s}</span>
                ))}
              </div>
            </a>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border bg-white hover:shadow-lg transition-shadow p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-gray-900">Offres LinkedIn</div>
                <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700">Direct</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {computedJobTitle || 'Emplois'} • {computedLocation || 'Votre région'}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {skillsList.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded text-gray-700">{s}</span>
                ))}
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
