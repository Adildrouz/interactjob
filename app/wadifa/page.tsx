import type { Metadata } from 'next';
import Link from 'next/link';
import jobsData from '@/data/jobs.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  sector: string;
  contractType: string;
  slug: string;
  postedAt: string;
  expired: boolean;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: 'Wadifa au Maroc 2026 — Offres d\'Emploi | InteractJob.ma',
  description:
    'Trouvez votre wadifa au Maroc en 2026. Des centaines d\'offres d\'emploi dans tous les secteurs et toutes les villes. CDI, CDD, stage — postulez sur InteractJob.ma',
  alternates: { canonical: 'https://www.interactjob.ma/wadifa' },
  openGraph: {
    title: 'Wadifa au Maroc 2026 — Offres d\'Emploi | InteractJob.ma',
    description:
      'Trouvez votre wadifa au Maroc en 2026. Des centaines d\'offres d\'emploi dans tous les secteurs et toutes les villes.',
    url: 'https://www.interactjob.ma/wadifa',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

// ---------------------------------------------------------------------------
// City links data
// ---------------------------------------------------------------------------
const CITY_LINKS: { slug: string; displayName: string }[] = [
  { slug: 'casablanca', displayName: 'Casablanca' },
  { slug: 'rabat', displayName: 'Rabat' },
  { slug: 'marrakech', displayName: 'Marrakech' },
  { slug: 'agadir', displayName: 'Agadir' },
  { slug: 'fes', displayName: 'Fès' },
  { slug: 'meknes', displayName: 'Meknès' },
  { slug: 'tanger', displayName: 'Tanger' },
  { slug: 'tetouan', displayName: 'Tétouan' },
  { slug: 'kenitra', displayName: 'Kénitra' },
  { slug: 'oujda', displayName: 'Oujda' },
  { slug: 'mohammedia', displayName: 'Mohammedia' },
  { slug: 'temara', displayName: 'Témara' },
  { slug: 'el-jadida', displayName: 'El Jadida' },
  { slug: 'essaouira', displayName: 'Essaouira' },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function WadifaPage() {
  const allJobs = (jobsData as unknown as Job[]).filter((j) => !j.expired);

  // Sort by most recent, take top 100
  const jobs = allJobs
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, 100);

  const totalCount = allJobs.length;

  // Schema.org ItemList JSON-LD
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Wadifa au Maroc 2026 — Toutes les Offres d\'Emploi',
    url: 'https://www.interactjob.ma/wadifa',
    numberOfItems: totalCount,
    itemListElement: jobs.slice(0, 50).map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'JobPosting',
        title: job.title,
        hiringOrganization: { '@type': 'Organization', name: job.company },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.city,
            addressCountry: 'MA',
          },
        },
        employmentType: job.contractType,
        url: `https://www.interactjob.ma/offres/${job.slug}`,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <span className="text-white">Wadifa au Maroc</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Wadifa au Maroc 2026 — Toutes les Offres d&apos;Emploi
          </h1>
          <p className="text-indigo-400 font-semibold text-lg">
            {totalCount} offre{totalCount !== 1 ? 's' : ''} d&apos;emploi disponible{totalCount !== 1 ? 's' : ''}
            {jobs.length < totalCount ? ` (affichage des ${jobs.length} plus récentes)` : ''}
          </p>
        </header>

        {/* Intro */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 mb-8">
          <p className="text-slate-300 leading-relaxed">
            Trouver une wadifa au Maroc en 2026 est une priorité pour des millions de Marocains — jeunes diplômés,
            demandeurs d&apos;emploi expérimentés ou professionnels en reconversion. Le marché du travail marocain offre
            chaque année des dizaines de milliers de postes dans tous les secteurs : industrie, BTP, commerce, finance,
            tourisme, santé, éducation et nouvelles technologies. Les grandes villes comme Casablanca, Rabat, Tanger et
            Marrakech concentrent la majorité des offres d&apos;emploi, mais les villes de taille moyenne — Agadir, Fès,
            Meknès, Kénitra — proposent également de belles opportunités, notamment dans l&apos;industrie et
            l&apos;agro-alimentaire. Pour décrocher une wadifa au Maroc, il est essentiel de cibler les bons secteurs en
            croissance : l&apos;automobile et l&apos;aéronautique dans les zones franches, le numérique dans les grandes
            villes, l&apos;export agricole dans le Souss-Massa, et la logistique dans les ports. Les contrats CDI, CDD
            et les stages offrent différents niveaux d&apos;engagement adaptés à tous les profils. InteractJob.ma
            référence quotidiennement les meilleures opportunités de wadifa au Maroc, directement issues des entreprises
            et des agences de recrutement. Créez votre alerte emploi et ne manquez plus aucune wadifa qui correspond à
            votre profil.
          </p>
        </section>

        {/* Jobs list */}
        <section className="space-y-4 mb-10">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-base leading-snug mb-1 truncate">
                  {job.title}
                </h2>
                <p className="text-slate-400 text-sm mb-2">{job.company}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                    {job.city}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-indigo-900/50 border border-indigo-700/50 px-2.5 py-0.5 text-xs text-indigo-300">
                    {job.contractType}
                  </span>
                  {job.sector && job.sector !== 'Autre' && (
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                      {job.sector}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/offres/${job.slug}`}
                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors text-center"
              >
                Voir l&apos;offre
              </Link>
            </article>
          ))}
        </section>

        {/* City links section */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Trouvez une wadifa dans votre ville
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CITY_LINKS.map(({ slug, displayName }) => (
              <Link
                key={slug}
                href={`/offres-emploi-${slug}`}
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-300 hover:border-indigo-500 hover:text-white transition-colors text-center font-medium"
              >
                {displayName}
              </Link>
            ))}
          </div>
        </section>

        {/* Back link */}
        <div className="border-t border-slate-800 pt-6">
          <Link
            href="/offres"
            className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
          >
            Voir toutes les offres d&apos;emploi au Maroc
          </Link>
        </div>
      </div>
    </main>
  );
}
