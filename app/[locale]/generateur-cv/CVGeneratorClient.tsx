'use client';

import Link from 'next/link';

const features = [
  { icon: '🎨', title: '25 modèles professionnels', desc: 'Moderne, classique, créatif, Europass…' },
  { icon: '🤖', title: 'Génération IA complète', desc: 'CV + lettre de motivation + email de candidature' },
  { icon: '✅', title: 'Optimisé ATS', desc: 'Passe les filtres automatiques des recruteurs' },
  { icon: '📄', title: 'Export PDF', desc: 'Téléchargement instantané, prêt à envoyer' },
  { icon: '🔄', title: 'Reconversion professionnelle', desc: 'Analyse IA de votre profil et suggestions de carrière' },
  { icon: '🆓', title: '100% Gratuit', desc: 'Aucun abonnement, aucune carte bancaire' },
];

export default function CVGeneratorClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-6">
          🚀 Bientôt disponible
        </span>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Générateur CV IA
          <span className="block text-blue-600 mt-1">100% Gratuit</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Nous préparons un outil de génération de CV par intelligence artificielle,
          adapté au marché marocain. Créez votre CV professionnel en quelques minutes.
        </p>

        {/* CTA vers l'outil déjà dispo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link
            href="/cv-checker"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            ✅ Testez votre CV maintenant
          </Link>
          <Link
            href="/offres"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
          >
            🔍 Voir les offres d'emploi
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
          Ce qui arrive bientôt
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Notification */}
        <div className="mt-10 bg-white rounded-2xl border border-blue-100 p-6 text-center shadow-sm">
          <p className="text-gray-600 text-sm">
            Vous souhaitez être notifié au lancement ?{' '}
            <a
              href="mailto:jobinteract@gmail.com?subject=Notification lancement générateur CV&body=Bonjour, je souhaite être notifié du lancement du générateur CV."
              className="text-blue-600 hover:underline font-medium"
            >
              Envoyez-nous un email
            </a>{' '}
            et nous vous préviendrons en premier.
          </p>
        </div>
      </div>
    </div>
  );
}
