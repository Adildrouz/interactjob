'use client';

import dynamic from 'next/dynamic';

const UploadButton = dynamic(() => import('@/components/cv/UploadButton'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  ),
});

export default function CVGeneratorClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            🤖 5€ — Propulsé par IA
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            Générateur CV IA
            <span className="block text-blue-600 mt-1">2026</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Décrivez votre parcours en quelques lignes — notre IA génère votre CV professionnel,
            votre lettre de motivation et votre email de candidature en 3 minutes.
          </p>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">✅ 25 modèles professionnels</span>
          <span className="flex items-center gap-1.5">🎯 Optimisé ATS International</span>
          <span className="flex items-center gap-1.5">⚡ Résultat en 3 min</span>
          <span className="flex items-center gap-1.5">💳 5€ · Paiement unique sécurisé</span>
        </div>

        {/* Main tool */}
        <UploadButton />
      </div>
    </div>
  );
}
