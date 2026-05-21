import Link from 'next/link';

const TYPES = [
  { emoji: '🦁', label: 'Visionary Leader',      color: '#6366f1' },
  { emoji: '🌟', label: 'Dynamic Influencer',    color: '#ec4899' },
  { emoji: '⚓', label: 'Supportive Anchor',     color: '#10b981' },
  { emoji: '🔬', label: 'Strategic Analyst',     color: '#3b82f6' },
  { emoji: '⚡', label: 'Inspiring Commander',   color: '#8b5cf6' },
  { emoji: '📐', label: 'Reliable Architect',    color: '#64748b' },
];

const FEATURES = [
  { icon: '⚡', title: '10 minutes',           desc: '40 situations professionnelles, scoring scientifique' },
  { icon: '🧠', title: 'Rapport IA',           desc: 'Claude AI génère votre analyse carrière personnalisée' },
  { icon: '🎯', title: '18 sections détaillées', desc: 'Leadership, stress, communication, coaching carrière...' },
  { icon: '🔒', title: 'Privé & sécurisé',    desc: 'Anonyme par défaut, chiffré HTTPS, données non vendues' },
];

export default function PersonalityHome() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← InteractJob</Link>
            <span className="text-slate-700">|</span>
            <span className="font-semibold text-white">Test Personnalité <span className="text-indigo-400">IA</span></span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/personality/login" className="text-slate-400 hover:text-white transition-colors">Connexion</Link>
            <Link href="/personality/assessment" className="rounded-lg bg-indigo-500 px-4 py-2 font-medium hover:bg-indigo-600 transition-colors">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> Propulsé par l'IA · Résultat gratuit immédiat
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Découvrez votre{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            Identité Professionnelle
          </span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
          Un test comportemental inspiré du modèle DISC — 40 situations de travail, 4 dimensions, et un rapport IA taillé pour votre carrière.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/personality/assessment" className="rounded-xl px-8 py-4 font-semibold text-lg hover:opacity-90 transition-opacity text-white" style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}>
            Passer le test — Gratuit
          </Link>
          <Link href="#comment" className="rounded-xl border border-slate-700 px-8 py-4 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors">
            Comment ça marche
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-600">Aucun compte requis · 10 minutes · Résultat instantané</p>
      </section>

      {/* Profile grid */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">11 profils de personnalité distincts</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TYPES.map(p => (
            <div key={p.label} className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-sm font-medium text-slate-300">{p.label}</span>
            </div>
          ))}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <span className="text-sm font-medium text-slate-500">+5 autres profils</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="comment" className="px-6 py-16 border-t border-slate-800 max-w-5xl mx-auto">
        <h2 className="text-center text-3xl font-bold mb-10">Conçu pour votre carrière</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center border-t border-slate-800">
        <h2 className="text-3xl font-bold mb-4">Prêt à vous découvrir ?</h2>
        <p className="text-slate-400 mb-8">Le test de base est toujours gratuit. Le rapport premium vous donne un avantage réel en entretien.</p>
        <Link href="/personality/assessment" className="inline-block rounded-xl px-10 py-4 font-semibold text-lg hover:opacity-90 transition-opacity text-white" style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}>
          Commencer maintenant
        </Link>
      </section>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-xs text-slate-600">
        © 2025 InteractJob.ma · Test Personnalité IA
      </footer>
    </main>
  );
}
