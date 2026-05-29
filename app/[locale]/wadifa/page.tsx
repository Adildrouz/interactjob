import type { Metadata } from 'next';
import jobs from '@/data/jobs.json';

const BASE_URL = 'https://www.interactjob.ma';

export const metadata: Metadata = {
  title: "Wadifa au Maroc 2027 | وظائف المغرب — InteractJob.ma",
  description:
    "Wadifa au Maroc 2027 : toutes les offres d'emploi (وظائف) mises à jour quotidiennement. CDI, CDD, Stage — Casablanca, Rabat, Marrakech et partout au Maroc sur InteractJob.ma.",
  keywords: [
    'wadifa',
    'wadifa maroc',
    'وظائف المغرب',
    'emploi maroc 2027',
    'offre emploi maroc',
    'recrutement maroc',
  ],
  alternates: { canonical: `${BASE_URL}/wadifa` },
  openGraph: {
    title: "Wadifa au Maroc 2027 | وظائف — InteractJob.ma",
    description:
      "Trouvez votre wadifa (وظيفة) au Maroc en 2027. CDI, CDD, Stage dans toutes les villes marocaines.",
    url: `${BASE_URL}/wadifa`,
    siteName: 'InteractJob.ma',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function WadifaPage() {
  const allJobs = jobs as any[];
  const displayJobs = allJobs.filter((j) => !j.expired).slice(0, 12);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-gray-400 mb-4">
            <a href="/" className="hover:text-blue-600">Accueil</a>
            <span className="mx-1">›</span>
            <span>Wadifa Maroc</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Wadifa au Maroc 2027 — وظائف في المغرب
          </h1>
          <p className="text-gray-700 leading-relaxed max-w-2xl text-sm md:text-base">
            Retrouvez toutes les <strong>wadifa</strong> (وظيفة) disponibles au Maroc en 2027.
            InteractJob.ma recense chaque jour les meilleures offres d&apos;emploi — CDI, CDD, Stage —
            dans toutes les villes : Casablanca, Rabat, Marrakech, Tanger, Agadir et plus encore.
            Que vous cherchiez une wadifa dans le secteur public, privé ou en télétravail,
            notre plateforme vous connecte directement aux recruteurs marocains.
          </p>

          {/* Arabic section for bilingual SEO */}
          <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-100 text-right" dir="rtl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">وظائف في المغرب 2027</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              ابحث عن وظيفة في المغرب — كازابلانكا، الرباط، مراكش، طنجة، أكادير وسائر المدن.
              عروض الشغل محدثة يومياً على منصة <strong>InteractJob.ma</strong>.
              عقود دائمة، مؤقتة، وتدريب في جميع القطاعات.
            </p>
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          {displayJobs.length} wadifa disponibles au Maroc
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
                Voir →
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/offres"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Toutes les wadifa →
          </a>
        </div>
      </section>

      {/* SEO content block */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Comment trouver une wadifa au Maroc en 2027 ?
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Le terme <strong>wadifa</strong> (وظيفة) désigne une offre d&apos;emploi ou un poste en arabe marocain.
            En 2027, le marché du travail marocain offre des opportunités dans de nombreux secteurs :
            IT et digital, banque et finance, hôtellerie et tourisme, industrie et BTP, commerce et vente.
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              Consultez les offres filtrées par ville et secteur sur InteractJob.ma
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              Déposez votre candidature spontanée via <a href="/postuler" className="text-blue-600 hover:underline">/postuler</a>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              Optimisez votre CV avec notre <a href="/cv-checker" className="text-blue-600 hover:underline">CV Checker gratuit</a>
            </li>
          </ul>
        </div>
      </section>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: "Wadifa Maroc 2027 — وظائف في المغرب",
            description: "Toutes les offres d'emploi (wadifa) au Maroc en 2027 sur InteractJob.ma",
            url: `${BASE_URL}/wadifa`,
            inLanguage: ['fr', 'ar'],
          }),
        }}
      />
    </main>
  );
}
