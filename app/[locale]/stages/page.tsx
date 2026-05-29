import type { Metadata } from 'next';
import jobs from '@/data/jobs.json';

const BASE_URL = 'https://www.interactjob.ma';

export const metadata: Metadata = {
  title: "Stage au Maroc 2027 — Offres de Stage CDI CDD | InteractJob.ma",
  description:
    "Trouvez un stage au Maroc en 2027. Stages PFE, PFA, fin d'études dans toutes les villes — Casablanca, Rabat, Marrakech, Tanger. Mis à jour quotidiennement sur InteractJob.ma.",
  keywords: [
    'stage maroc',
    'stage maroc 2027',
    'stage pfe maroc',
    'offre stage casablanca',
    'stage fin etudes maroc',
    'stage rabat marrakech tanger',
  ],
  alternates: { canonical: `${BASE_URL}/stages` },
  openGraph: {
    title: "Stage au Maroc 2027 — Offres PFE, PFA, Fin d'études | InteractJob.ma",
    description:
      "Toutes les offres de stage au Maroc 2027 : PFE, PFA, stage d'été, stage fin d'études. Postulez directement sur InteractJob.ma.",
    url: `${BASE_URL}/stages`,
    siteName: 'InteractJob.ma',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function StagesPage() {
  const allJobs = jobs as any[];

  // Filter internship/stage offers
  let stageJobs = allJobs.filter(
    (j) =>
      !j.expired &&
      (
        (j.contractType || j.contract_type || '')
          .toLowerCase()
          .includes('stage') ||
        (j.title || '').toLowerCase().includes('stage') ||
        (j.title || '').toLowerCase().includes('stagiaire') ||
        (j.title || '').toLowerCase().includes('pfe') ||
        (j.title || '').toLowerCase().includes('pfa')
      )
  );

  // Fallback: latest 8 jobs
  if (stageJobs.length < 3) {
    stageJobs = allJobs.filter((j) => !j.expired).slice(0, 8);
  }

  const displayJobs = stageJobs.slice(0, 12);

  const stageTypes = [
    { label: "Stage PFE", desc: "Projet de fin d'études — Bac+4/5" },
    { label: "Stage PFA", desc: "Projet de fin d'année — Bac+2/3" },
    { label: "Stage d'été", desc: "Stage 1 à 3 mois en été" },
    { label: "Stage de fin d'études", desc: "6 mois — Master, Ingénieur" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-gray-400 mb-4">
            <a href="/" className="hover:text-blue-600">Accueil</a>
            <span className="mx-1">›</span>
            <span>Stages au Maroc</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Offres de Stage au Maroc 2027
          </h1>
          <p className="text-gray-700 leading-relaxed max-w-2xl text-sm md:text-base">
            Trouvez votre <strong>stage au Maroc</strong> en 2027 : PFE, PFA, stage fin d&apos;études ou stage d&apos;été.
            InteractJob.ma publie chaque jour des centaines d&apos;offres de stage dans toutes les villes marocaines —
            Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès et plus encore.
            Tous secteurs : IT, Finance, Marketing, Hôtellerie, Industrie, RH.
          </p>

          {/* Stage types */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stageTypes.map((s) => (
              <div key={s.label} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="font-semibold text-blue-800 text-sm">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          {displayJobs.length} offre{displayJobs.length > 1 ? 's' : ''} de stage au Maroc
        </h2>

        <div className="space-y-3">
          {displayJobs.map((job: any) => (
            <a
              key={job.id || job.slug}
              href={`/offres/${job.slug}`}
              className="flex items-start justify-between bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 text-sm md:text-base truncate">
                  {job.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {job.company} · {job.city} · {job.contractType || job.contract_type}
                </p>
              </div>
              <span className="ml-3 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                Postuler →
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/offres"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Toutes les offres d&apos;emploi →
          </a>
        </div>
      </section>

      {/* SEO Content */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Comment décrocher un stage au Maroc en 2027 ?
          </h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              Le <strong>stage au Maroc</strong> est une étape clé pour les étudiants des écoles d&apos;ingénieurs,
              des facultés et des BTS. En 2027, les entreprises marocaines recrutent activement des stagiaires
              dans tous les secteurs, notamment l&apos;IT à Casablanca, la logistique à Tanger, l&apos;hôtellerie
              à Marrakech et la finance à Rabat.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎓 Stages PFE / PFA</h3>
                <p className="text-xs">
                  Les stages de projet de fin d&apos;études (PFE) durent généralement 4 à 6 mois.
                  Ils permettent de valider votre diplôme et de décrocher un CDI dans l&apos;entreprise.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2">☀️ Stages d&apos;été</h3>
                <p className="text-xs">
                  Les stages d&apos;été durent 1 à 3 mois (juin-août). Idéaux pour découvrir un secteur,
                  enrichir votre CV et créer votre réseau professionnel au Maroc.
                </p>
              </div>
            </div>
            <p className="mt-4">
              <strong>Conseil InteractJob :</strong> Optimisez votre CV avec notre{' '}
              <a href="/cv-checker" className="text-blue-600 hover:underline">CV Checker gratuit</a> avant
              de postuler. Un CV bien structuré multiplie vos chances d&apos;obtenir un entretien.
            </p>
          </div>
        </div>
      </section>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: "Offres de Stage au Maroc 2027",
            description: "Trouvez votre stage PFE, PFA ou fin d'études au Maroc en 2027 sur InteractJob.ma",
            url: `${BASE_URL}/stages`,
          }),
        }}
      />
    </main>
  );
}
