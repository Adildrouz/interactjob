import Link from 'next/link';
import type { Metadata } from 'next';

const BASE_URL = 'https://www.interactjob.ma';

const PROFILES = [
  { emoji: '🦁', label: 'Visionary Leader',       labelFr: 'Leader Visionnaire',       color: '#6366f1', desc: 'Ambitieux, stratégique, inspire et entraîne les équipes.' },
  { emoji: '🌟', label: 'Dynamic Influencer',      labelFr: 'Influenceur Dynamique',     color: '#ec4899', desc: 'Communicant naturel, persuasif, à l\'aise dans la vente et le marketing.' },
  { emoji: '⚓', label: 'Supportive Anchor',       labelFr: 'Pilier de l\'Équipe',       color: '#10b981', desc: 'Fiable, empathique, fédérateur — idéal pour les RH et le service client.' },
  { emoji: '🔬', label: 'Strategic Analyst',       labelFr: 'Analyste Stratégique',      color: '#3b82f6', desc: 'Rigoureux, data-driven, excellent en finance, IT et audit.' },
  { emoji: '⚡', label: 'Inspiring Commander',     labelFr: 'Commandant Inspirant',      color: '#8b5cf6', desc: 'Décisif, orienté résultats, profil de directeur ou chef de projet.' },
  { emoji: '📐', label: 'Reliable Architect',      labelFr: 'Architecte Fiable',         color: '#64748b', desc: 'Méthodique, structuré, performant en ingénierie et gestion de projets.' },
  { emoji: '🎨', label: 'Creative Explorer',       labelFr: 'Explorateur Créatif',       color: '#f59e0b', desc: 'Innovant, curieux, s\'épanouit dans les métiers créatifs et digitaux.' },
  { emoji: '🤝', label: 'Harmonious Energizer',    labelFr: 'Catalyseur d\'Harmonie',    color: '#06b6d4', desc: 'Diplomate, médiateur naturel, excellent dans les négociations.' },
  { emoji: '🧭', label: 'Resilient Navigator',     labelFr: 'Navigateur Résilient',      color: '#84cc16', desc: 'Adaptable, calme sous pression, gère les crises avec efficacité.' },
  { emoji: '🏆', label: 'Competitive Achiever',    labelFr: 'Achiever Compétitif',       color: '#ef4444', desc: 'Performant, ambitieux, moteur dans les environnements challengeants.' },
  { emoji: '💡', label: 'Thoughtful Innovator',    labelFr: 'Innovateur Réfléchi',       color: '#a855f7', desc: 'Créatif et analytique à la fois — profil idéal pour les startups tech.' },
];

const FEATURES = [
  { icon: '⚡', title: '10 minutes chrono',        desc: '40 mises en situation professionnelles réelles — scoring scientifique instantané.' },
  { icon: '🧠', title: 'Rapport IA personnalisé',  desc: 'Claude AI génère votre analyse carrière sur mesure : forces, angles d\'amélioration, conseils entretien.' },
  { icon: '🎯', title: '18 sections détaillées',   desc: 'Leadership, gestion du stress, communication, style de management, coaching carrière au Maroc.' },
  { icon: '🔒', title: '100% gratuit & privé',     desc: 'Aucun compte requis pour le test de base. Données non vendues, chiffrement HTTPS.' },
];

const FAQS = [
  {
    q: 'Le test de personnalité est-il vraiment gratuit ?',
    a: 'Oui, le test complet (40 questions) et le résultat de base sont entièrement gratuits et ne nécessitent pas de création de compte. Un rapport IA premium détaillé est disponible en option payante.',
  },
  {
    q: 'Combien de temps prend le test ?',
    a: 'Entre 8 et 12 minutes en moyenne. Le test comporte 40 situations professionnelles à choix multiples. Il n\'y a ni bonne ni mauvaise réponse — répondez instinctivement.',
  },
  {
    q: 'Ce test est-il adapté au marché de l\'emploi marocain ?',
    a: 'Oui. Les situations proposées sont basées sur des contextes professionnels courants au Maroc (hôtellerie, banque, IT, commerce, administration publique). Le rapport IA tient compte des spécificités du marché marocain.',
  },
  {
    q: 'Quelle est la différence avec le test MBTI ?',
    a: 'Notre test est inspiré du modèle DISC, reconnu dans 50+ pays pour son application professionnelle. Contrairement au MBTI (payant, droits protégés), notre test est gratuit, adapté au contexte marocain, et produit un rapport IA carrière personnalisé.',
  },
  {
    q: 'Puis-je utiliser mes résultats en entretien de recrutement ?',
    a: 'Absolument. Connaître votre profil vous aide à anticiper les questions comportementales des recruteurs (ex. "Décrivez votre style de travail") et à valoriser vos forces selon le poste visé.',
  },
  {
    q: 'Les entreprises marocaines utilisent-elles ces tests ?',
    a: 'De plus en plus : banques, multinationales en zone franche (Tanger, Casablanca Finance City), sociétés d\'offshoring et cabinets RH intègrent les tests comportementaux dans leurs processus de sélection. Se préparer en amont est un avantage concret.',
  },
];

const SECTORS = [
  { icon: '🏦', name: 'Finance & Banque',      profiles: ['Strategic Analyst', 'Reliable Architect'] },
  { icon: '💻', name: 'IT & Digital',           profiles: ['Thoughtful Innovator', 'Strategic Analyst'] },
  { icon: '🏨', name: 'Hôtellerie & Tourisme',  profiles: ['Supportive Anchor', 'Dynamic Influencer'] },
  { icon: '👥', name: 'RH & Recrutement',       profiles: ['Supportive Anchor', 'Inspiring Commander'] },
  { icon: '📊', name: 'Commerce & Vente',       profiles: ['Dynamic Influencer', 'Competitive Achiever'] },
  { icon: '🏛️', name: 'Secteur Public',         profiles: ['Reliable Architect', 'Resilient Navigator'] },
];

// JSON-LD structured data
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(faq => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Test de Personnalité Professionnel Gratuit — Emploi Maroc',
  description: 'Test de personnalité professionnel gratuit adapté au marché de l\'emploi marocain. Découvrez votre profil comportemental en 10 minutes avec rapport IA personnalisé.',
  url: `${BASE_URL}/personality`,
  inLanguage: 'fr-MA',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Test de Personnalité', item: `${BASE_URL}/personality` },
    ],
  },
};

export default function PersonalityHome() {
  return (
    <main className="min-h-screen">
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />

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
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Test gratuit · Résultat en 10 min · Adapté au marché marocain
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
          Test de Personnalité{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            Professionnel Gratuit
          </span>
          <br />
          <span className="text-3xl md:text-4xl text-slate-300">Maroc 2026</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-4">
          Découvrez votre profil comportemental en <strong className="text-white">10 minutes</strong> grâce à notre test inspiré du modèle DISC — spécialement adapté aux réalités du marché de l'emploi marocain.
        </p>
        <p className="text-slate-500 text-sm max-w-xl mx-auto mb-10">
          Utilisé par des candidats à <strong className="text-slate-400">Casablanca, Rabat, Marrakech, Tanger</strong> pour préparer leurs entretiens de recrutement dans les banques, l'IT, l'hôtellerie et le secteur public.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/personality/assessment"
            className="rounded-xl px-8 py-4 font-semibold text-lg hover:opacity-90 transition-opacity text-white shadow-2xl shadow-indigo-500/30"
            style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}
          >
            Passer le test — 100% Gratuit
          </Link>
          <Link href="#comment" className="rounded-xl border border-slate-700 px-8 py-4 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors">
            Comment ça marche ?
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-600">Aucun compte requis · 40 questions · Rapport IA instantané</p>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-800/50 bg-slate-900/40 py-6 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { val: '11', label: 'Profils distincts' },
            { val: '40', label: 'Questions situationnelles' },
            { val: '10 min', label: 'Durée du test' },
            { val: '100%', label: 'Gratuit' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-white">{s.val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Profile grid ── */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">11 profils de personnalité</p>
          <h2 className="text-2xl font-bold text-white">Quel est votre profil professionnel ?</h2>
          <p className="text-slate-400 text-sm mt-2">Chaque profil correspond à un style comportemental distinct — découvrez lequel vous correspond.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROFILES.map(p => (
            <div key={p.label} className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4 flex items-start gap-3 hover:border-slate-700 transition-colors">
              <span className="text-2xl mt-0.5">{p.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-white">{p.labelFr}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Par secteur au Maroc ── */}
      <section className="px-6 py-14 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Marché marocain</p>
            <h2 className="text-2xl font-bold text-white">Quel profil selon votre secteur ?</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              Les recruteurs marocains recherchent des profils comportementaux précis selon les secteurs. Découvrez les profils les plus valorisés dans votre domaine.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SECTORS.map(s => (
              <div key={s.name} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.profiles.map(prof => (
                    <span key={prof} className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      {prof}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="comment" className="px-6 py-16 border-t border-slate-800 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Pourquoi ce test de personnalité ?</h2>
          <p className="text-slate-400 text-sm mt-2">Conçu spécifiquement pour les candidats et professionnels du marché marocain</p>
        </div>
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

      {/* ── Arabic section ── */}
      <section className="px-6 py-14 border-t border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950" dir="rtl">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3" dir="ltr">النسخة العربية</p>
          <h2 className="text-2xl font-bold text-white mb-4">
            اختبار الشخصية المهني المجاني — المغرب
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-6">
            اكتشف ملفك الشخصي المهني في 10 دقائق فقط. اختبار مجاني بالكامل، مبني على نموذج DISC العالمي، ومكيّف مع سوق الشغل المغربي. احصل على تقريرك الشخصي فوراً دون الحاجة لإنشاء حساب.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            يُستخدم من طرف المرشحين في الدار البيضاء والرباط ومراكش وطنجة للتحضير لمقابلات التوظيف في البنوك، قطاع تقنية المعلومات، الفندقة والقطاع العام.
          </p>
          <Link
            href="/personality/assessment"
            dir="ltr"
            className="inline-block rounded-xl px-8 py-4 font-semibold text-lg hover:opacity-90 transition-opacity text-white"
            style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}
          >
            🎯 ابدأ الاختبار — مجاناً
          </Link>
        </div>
      </section>

      {/* ── Blog CTA ── */}
      <section className="px-6 py-10 border-t border-slate-800 bg-indigo-500/5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Conseil carrière</p>
            <h3 className="text-lg font-bold text-white">Préparez votre entretien selon votre profil</h3>
            <p className="text-slate-400 text-sm mt-1">Lisez nos guides pour réussir votre recrutement au Maroc selon votre personnalité.</p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link href="/fr/blog/reussir-entretien-selon-profil-personnalite-maroc" className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
              Guide entretien →
            </Link>
            <Link href="/fr/blog/mbti-recrutement-maroc-2026-guide-complet" className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
              MBTI & Recrutement →
            </Link>
            <Link href="/fr/blog/test-de-personnalite-emploi-maroc" className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20 px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
              Guide personnalité →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-16 border-t border-slate-800 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Questions fréquentes</p>
          <h2 className="text-2xl font-bold text-white">FAQ — Test de personnalité Maroc</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <details key={faq.q} className="group rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-sm text-white hover:bg-slate-800/50 transition-colors">
                {faq.q}
                <svg className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180 flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-20 text-center border-t border-slate-800">
        <h2 className="text-3xl font-bold mb-3">Prêt à découvrir votre profil ?</h2>
        <p className="text-slate-400 mb-2 max-w-lg mx-auto">
          Test de personnalité professionnel <strong className="text-white">100% gratuit</strong>, résultat instantané, sans création de compte.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Le rapport premium IA vous donne un avantage concret en entretien de recrutement au Maroc.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/personality/assessment"
            className="inline-block rounded-xl px-10 py-4 font-semibold text-lg hover:opacity-90 transition-opacity text-white shadow-2xl shadow-indigo-500/30"
            style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}
          >
            Commencer le test — Gratuit
          </Link>
          <Link href="/fr/offres" className="rounded-xl border border-slate-700 px-8 py-4 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors">
            Voir les offres d'emploi →
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-xs text-slate-600">
        © 2026 InteractJob.ma · Test de Personnalité Professionnel Gratuit · Maroc
      </footer>
    </main>
  );
}
