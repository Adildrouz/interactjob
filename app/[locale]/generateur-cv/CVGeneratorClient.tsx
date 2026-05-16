'use client';

import UploadButton from '@/components/cv/UploadButton';

export default function CVGeneratorClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            🎁 100% Gratuit — Offert par InteractJob
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Générateur de CV professionnel par IA
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Importez votre CV existant ou partez de zéro. Notre IA génère un CV optimisé ATS,
            une lettre de motivation et un email de candidature adaptés au marché marocain.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>✅ 25 modèles professionnels</span>
            <span>✅ Export PDF</span>
            <span>✅ Optimisé ATS</span>
            <span>✅ Lettre de motivation</span>
          </div>
        </div>
      </div>

      {/* Main tool */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <UploadButton />
      </div>
    </div>
  );
}
