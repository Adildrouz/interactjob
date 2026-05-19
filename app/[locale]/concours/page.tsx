import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";

export const metadata: Metadata = {
  title: "Concours Fonction Publique Maroc 2026 — Résultats & Offres | InteractJob",
  description: "Tous les concours de recrutement de la fonction publique marocaine : ministères, collectivités, établissements publics. Résultats CSPJ 2026, Ministère de l'Intérieur et plus. Mis à jour quotidiennement.",
  alternates: { canonical: "https://www.interactjob.ma/concours" },
  keywords: ["concours fonction publique maroc 2026", "résultats concours CSPJ 2026", "concours ministère intérieur", "recrutement état maroc"],
};

const allConcours = concoursData as Concours[];

type Job = { id: string; slug: string; title: string; company: string; city: string; contractType: string; sector: string; expired?: boolean };
const allJobs = jobsData as Job[];

const PRIVATE_SECTORS = ["Finance", "IT", "Commerce", "RH", "Marketing", "Industrie", "Logistique", "Santé", "BTP", "Éducation"];
const privateJobs = allJobs
  .filter(j => !j.expired && PRIVATE_SECTORS.includes(j.sector))
  .slice(0, 6);

const NIVEAU_COLORS: Record<string, string> = {
  "Bac":          "bg-blue-50 text-blue-700",
  "Bac+2":        "bg-purple-50 text-purple-700",
  "Bac+3":        "bg-indigo-50 text-indigo-700",
  "Licence":      "bg-indigo-50 text-indigo-700",
  "Master":       "bg-orange-50 text-orange-700",
  "Ingénieur":    "bg-green-50 text-green-700",
  "Tous niveaux": "bg-gray-100 text-gray-600",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" });
}

function isExpiringSoon(deadline: string | null) {
  if (!deadline) return false;
  const d = new Date(deadline);
  const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 5;
}

function isExpired(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export default function ConcoursPage() {
  const active  = allConcours.filter(c => !isExpired(c.deadline));
  const expired = allConcours.filter(c => isExpired(c.deadline));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Fonction Publique</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Concours de Recrutement au Maroc</h1>
        <p className="text-gray-500 mt-2">
          {allConcours.length} concours disponibles — mis à jour quotidiennement depuis les sources officielles
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/concours/cspj-2026" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            Résultats CSPJ 2026
          </Link>
          <Link href="/concours/ministere-interieur" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            Concours Ministère Intérieur
          </Link>
          <Link href="/offres" className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">
            Offres secteur privé →
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary">{active.length}</p>
          <p className="text-xs text-gray-500 mt-1">Concours actifs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">
            {allConcours.reduce((sum, c) => sum + (c.postes || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Postes à pourvoir</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">
            {active.filter(c => isExpiringSoon(c.deadline)).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Clôture imminente</p>
        </div>
      </div>

      {/* Active concours */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Concours ouverts ({active.length})
        </h2>
        <div className="space-y-3">
          {active.length === 0 && (
            <p className="text-gray-400 text-sm">Aucun concours actif pour le moment.</p>
          )}
          {active.map(c => (
            <ConcoursCard key={c.id} concours={c} />
          ))}
        </div>
      </section>

      {/* Private sector CTA */}
      {privateJobs.length > 0 && (
        <section className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Secteur privé</p>
              <h2 className="text-lg font-bold text-gray-900">Après le concours, trouvez un emploi dans le privé</h2>
              <p className="text-sm text-gray-500 mt-1">Ne misez pas tout sur un seul concours — le secteur privé recrute aussi.</p>
            </div>
            <Link href="/offres" className="flex-shrink-0 text-xs font-semibold text-primary hover:underline whitespace-nowrap">
              Voir toutes les offres →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {privateJobs.map(j => (
              <Link
                key={j.id}
                href={`/offres/${j.slug}`}
                className="bg-white rounded-xl border border-blue-100 p-4 hover:shadow-md hover:border-primary transition-all"
              >
                <p className="text-xs font-semibold text-primary mb-1">{j.company}</p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{j.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">{j.city}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{j.contractType}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/offres"
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Toutes les offres d&apos;emploi
            </Link>
            <Link
              href="/postuler"
              className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Déposer mon CV
            </Link>
          </div>
        </section>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            Concours clôturés ({expired.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {expired.map(c => (
              <ConcoursCard key={c.id} concours={c} />
            ))}
          </div>
        </section>
      )}

      {/* Source attribution */}
      <div className="mt-12 pt-6 border-t border-gray-100 text-xs text-gray-400">
        Sources : alwadifa-maroc.com — données mises à jour quotidiennement.
      </div>
    </div>
  );
}

function ConcoursCard({ concours: c }: { concours: Concours }) {
  const expiring = isExpiringSoon(c.deadline);
  const niveauClass = c.niveau ? (NIVEAU_COLORS[c.niveau] || "bg-gray-100 text-gray-600") : "";

  return (
    <Link
      href={`/concours/${c.slug}` as any}
      className={`block bg-white rounded-xl border ${expiring ? "border-orange-200" : "border-gray-100"} shadow-sm p-5 hover:shadow-md hover:border-primary transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary mb-1">{c.organization_fr}</p>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {c.title_fr}
          </h3>
          {c.title_ar && (
            <p className="text-xs text-gray-400 mt-1 text-right dir-rtl line-clamp-1" dir="rtl">
              {c.title_ar}
            </p>
          )}
          {c.summary_fr && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.summary_fr}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {c.postes && (
              <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                {c.postes} poste{c.postes > 1 ? "s" : ""}
              </span>
            )}
            {c.niveau && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${niveauClass}`}>
                {c.niveau}
              </span>
            )}
            {c.deadline && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${expiring ? "bg-orange-50 text-orange-600 font-semibold" : "bg-gray-50 text-gray-500"}`}>
                {expiring ? "⚡ " : ""}Clôture : {formatDate(c.deadline)}
              </span>
            )}
            <span className="text-xs text-gray-400">
              Publié le {formatDate(c.datePosted)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-300 text-lg mt-1">→</div>
      </div>
    </Link>
  );
}
