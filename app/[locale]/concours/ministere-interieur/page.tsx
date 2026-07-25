import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Concours Ministère de l'Intérieur Maroc 2026",
  description: "Tous les concours de recrutement du Ministère de l'Intérieur Maroc 2026 : inspecteurs, ingénieurs d'État, contrôleurs. Dates limites, conditions et résultats.",
  alternates: { canonical: `${BASE_URL}/concours/ministere-interieur` },
  keywords: ["concours ministère intérieur maroc 2026", "recrutement ministère intérieur", "inspecteurs administration territoriale", "ingénieurs état maroc concours"],
};

type Job = { id: string; slug: string; title: string; company: string; city: string; contractType: string; sector: string; expired?: boolean };
const allJobs = jobsData as unknown as Job[];
const allConcours = concoursData as Concours[];

const miConcours = allConcours.filter(c =>
  c.organization_fr.toLowerCase().includes("intérieur") ||
  c.organization_fr.toLowerCase().includes("interieur") ||
  c.organization_fr.toLowerCase().includes("sûreté") ||
  c.organization_fr.toLowerCase().includes("surete")
);

const relatedJobs = allJobs
  .filter(j => !j.expired && ["Finance", "Administratif", "RH", "IT"].includes(j.sector))
  .slice(0, 4);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Concours Ministère de l'Intérieur Maroc 2026",
  description: "Liste des concours de recrutement du Ministère de l'Intérieur du Maroc pour 2026",
  url: `${BASE_URL}/concours/ministere-interieur`,
  numberOfItems: miConcours.length,
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" });
}

function isExpired(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export default function MinistereInterieurPage() {
  const activeMI  = miConcours.filter(c => !isExpired(c.deadline));
  const expiredMI = miConcours.filter(c => isExpired(c.deadline));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-navy-700">Accueil</Link>
          <span>/</span>
          <Link href="/concours" className="hover:text-navy-700">Concours</Link>
          <span>/</span>
          <span className="text-gray-600">Ministère de l&apos;Intérieur</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-bold text-navy-700 mb-2">Fonction Publique — Ministère de l&apos;Intérieur</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
            Concours Ministère de l&apos;Intérieur Maroc 2026
          </h1>
          <p className="text-base text-gray-500 text-right leading-relaxed" dir="rtl">
            مباريات وزارة الداخلية — المملكة المغربية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <p className="text-sm font-semibold text-blue-800 mb-2">À propos</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Le Ministère de l&apos;Intérieur est l&apos;un des plus grands recruteurs de la fonction publique marocaine. Il organise régulièrement des concours pour des postes d&apos;inspecteurs de l&apos;administration territoriale, d&apos;ingénieurs d&apos;État, de contrôleurs et de techniciens dans de nombreuses spécialités.
              </p>
            </div>

            {/* Active concours */}
            {activeMI.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Concours ouverts ({activeMI.length})
                </h2>
                <div className="space-y-3">
                  {activeMI.map(c => (
                    <Link
                      key={c.id}
                      href={`/concours/${c.id}`}
                      className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-primary transition-all"
                    >
                      <p className="text-xs font-semibold text-navy-700 mb-1">{c.organization_fr}</p>
                      <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{c.title_fr}</p>
                      {c.summary_fr && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.summary_fr}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {c.postes && (
                          <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                            {c.postes} poste{c.postes > 1 ? "s" : ""}
                          </span>
                        )}
                        {c.niveau && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {c.niveau}
                          </span>
                        )}
                        {c.deadline && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            Clôture : {formatDate(c.deadline)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeMI.length === 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 text-center">
                <p className="text-sm text-gray-500">Aucun concours actif pour le moment.</p>
                <p className="text-xs text-gray-400 mt-1">Consultez la section des concours clôturés ci-dessous.</p>
              </div>
            )}

            {/* Profiles */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-800 mb-3">Profils habituellement recrutés</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Inspecteurs administration territoriale", niveau: "Ingénieur / Master" },
                  { label: "Ingénieurs d'État (génie civil, hydraulique, SIG)", niveau: "Ingénieur" },
                  { label: "Contrôleurs de gestion et logistique", niveau: "Bac+3 / Licence" },
                  { label: "Techniciens spécialisés (topographie, infographie)", niveau: "Bac+2" },
                  { label: "Officiers et inspecteurs de police (DGSN)", niveau: "Tous niveaux" },
                  { label: "Secrétaires administratifs", niveau: "Bac" },
                ].map(p => (
                  <div key={p.label} className="flex items-start gap-2">
                    <span className="text-navy-700 mt-0.5 flex-shrink-0">▸</span>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{p.label}</p>
                      <p className="text-xs text-gray-400">{p.niveau}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expired */}
            {expiredMI.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  Concours clôturés ({expiredMI.length})
                </h2>
                <div className="space-y-2 opacity-60">
                  {expiredMI.map(c => (
                    <Link
                      key={c.id}
                      href={`/concours/${c.id}`}
                      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-300 transition-all"
                    >
                      <p className="text-sm text-gray-600 line-clamp-2">{c.title_fr}</p>
                      <div className="flex gap-2 mt-2">
                        {c.postes && (
                          <span className="text-xs text-gray-400">{c.postes} postes</span>
                        )}
                        {c.deadline && (
                          <span className="text-xs text-gray-400">— {formatDate(c.deadline)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <a
              href="https://emploi-public.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Candidater sur emploi-public.ma ↗
            </a>
            <p className="text-xs text-gray-400 mt-2">
              Les candidatures au Ministère de l&apos;Intérieur se font via le portail officiel emploi-public.ma.
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Liens utiles</h2>
              <div className="space-y-2">
                <a href="https://emploi-public.ma" target="_blank" rel="noopener noreferrer"
                   className="block text-xs text-navy-700 hover:underline py-1 border-b border-gray-50">
                  emploi-public.ma — dépôt de candidature
                </a>
                <a href="https://www.interieur.gov.ma" target="_blank" rel="noopener noreferrer"
                   className="block text-xs text-navy-700 hover:underline py-1">
                  interieur.gov.ma — site officiel
                </a>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-500 mb-3">Diversifiez vos chances — explorez aussi le secteur privé :</p>
                <Link
                  href="/offres"
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Offres d&apos;emploi privé
                </Link>
                <Link
                  href="/postuler"
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Déposer mon CV
                </Link>
              </div>
            </div>

            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">Offres secteur privé</h2>
                <div className="space-y-2">
                  {relatedJobs.map(j => (
                    <Link
                      key={j.id}
                      href={`/offres/${j.slug}`}
                      className="block text-xs text-gray-600 hover:text-navy-700 leading-snug py-1 border-b border-gray-50 last:border-0"
                    >
                      {j.title.slice(0, 70)}{j.title.length > 70 ? "…" : ""}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/concours"
              className="block text-center text-sm text-navy-700 hover:underline py-2"
            >
              ← Tous les concours
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
