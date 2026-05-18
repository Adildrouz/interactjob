import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import jobsData from "@/data/jobs.json";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Résultats Concours CSPJ 2026 — 37 Postes | InteractJob",
  description: "Résultats définitifs du concours de recrutement CSPJ 2026 (Conseil Supérieur du Pouvoir Judiciaire) — 37 postes. Consultez les listes des lauréats et trouvez votre prochain emploi.",
  alternates: { canonical: `${BASE_URL}/concours/cspj-2026` },
  keywords: ["résultats concours CSPJ 2026", "CSPJ recrutement 2026", "concours pouvoir judiciaire maroc", "liste lauréats CSPJ"],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: "Concours de recrutement CSPJ 2026",
  datePosted: "2026-01-01",
  hiringOrganization: {
    "@type": "Organization",
    name: "Conseil Supérieur du Pouvoir Judiciaire (CSPJ)",
    url: "https://www.cspj.ma",
  },
  jobLocation: {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressCountry: "MA", addressLocality: "Maroc" },
  },
  description: "Concours de recrutement de 37 postes au Conseil Supérieur du Pouvoir Judiciaire (CSPJ) du Maroc, exercice 2026.",
  employmentType: "FULL_TIME",
  totalJobOpenings: 37,
};

type Job = { id: string; slug: string; title: string; company: string; city: string; contractType: string; sector: string; expired?: boolean };
const allJobs = jobsData as Job[];

const relatedJobs = allJobs
  .filter(j => !j.expired && ["Finance", "Administratif", "RH"].includes(j.sector))
  .slice(0, 4);

export default function CspjPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link href="/concours" className="hover:text-primary">Concours</Link>
          <span>/</span>
          <span className="text-gray-600">CSPJ 2026</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <p className="text-sm font-bold text-primary mb-2">Conseil Supérieur du Pouvoir Judiciaire</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
              Résultats Concours CSPJ 2026 — 37 Postes
            </h1>
            <p className="text-base text-gray-500 mb-6 text-right leading-relaxed" dir="rtl">
              نتائج مباراة توظيف المجلس الأعلى للسلطة القضائية 2026
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-2">À propos du concours</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Le Conseil Supérieur du Pouvoir Judiciaire (CSPJ) a organisé un concours de recrutement pour <strong>37 postes</strong> au titre de l&apos;exercice 2026. Ce concours s&apos;adresse aux candidats remplissant les conditions de diplôme et d&apos;âge fixées par le règlement intérieur du CSPJ.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-4">
              <h2 className="text-base font-bold text-gray-800">Informations sur le concours</h2>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Organisme</p>
                <p className="text-sm text-gray-700">Conseil Supérieur du Pouvoir Judiciaire (CSPJ)</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre de postes</p>
                <p className="text-sm font-semibold text-gray-900">37 postes</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Résultats</p>
                <p className="text-sm text-green-700 font-semibold">Résultats définitifs publiés</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Source officielle</p>
                <a
                  href="https://www.cspj.ma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  www.cspj.ma ↗
                </a>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6">
              <h2 className="text-base font-bold text-gray-800 mb-3">Profils recherchés</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  Juristes, greffiers, secrétaires judiciaires
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  Techniciens en informatique et systèmes d&apos;information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  Cadres administratifs et financiers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  Techniciens et agents de service
                </li>
              </ul>
            </div>

            <a
              href="https://www.cspj.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Voir les résultats officiels ↗
            </a>

            <p className="text-xs text-gray-400 mt-3">
              Consultez le site officiel du CSPJ pour les listes nominatives complètes.
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">En attente des résultats ?</h2>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Ne restez pas inactif. Le secteur privé offre de nombreuses opportunités pour les profils administratifs et juridiques.
              </p>
              <Link
                href="/offres"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Voir les offres d&apos;emploi
              </Link>
              <Link
                href="/postuler"
                className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Déposer mon CV
              </Link>
            </div>

            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">Offres similaires</h2>
                <div className="space-y-2">
                  {relatedJobs.map(j => (
                    <Link
                      key={j.id}
                      href={`/offres/${j.slug}`}
                      className="block text-xs text-gray-600 hover:text-primary leading-snug py-1 border-b border-gray-50 last:border-0"
                    >
                      {j.title.slice(0, 70)}{j.title.length > 70 ? "…" : ""}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/concours"
              className="block text-center text-sm text-primary hover:underline py-2"
            >
              ← Tous les concours
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
