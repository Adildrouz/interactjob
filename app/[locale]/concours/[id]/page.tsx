import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import { Concours } from "@/types";

const allConcours = concoursData as Concours[];
const BASE_URL = "https://www.interactjob.ma";

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allConcours.map((c) => ({ locale, id: c.id }))
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const c = allConcours.find((x) => x.id === id);
  if (!c) return {};

  const title       = c.meta_title || c.title_fr;
  const description = c.meta_description || c.summary_fr;
  const canonical   = `${BASE_URL}/concours/${c.id}`;

  return {
    title,
    description,
    keywords: [c.organization_fr, "concours maroc", "fonction publique", "recrutement état", c.niveau || ""].filter(Boolean),
    openGraph: { title, description, url: canonical, type: "website", siteName: "InteractJob" },
    alternates: { canonical },
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" });
}

function isExpired(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export default async function ConcoursDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const c = allConcours.find((x) => x.id === id);
  if (!c) notFound();

  const expired  = isExpired(c.deadline);
  const related  = allConcours
    .filter(x => x.id !== c.id && x.organization_fr === c.organization_fr)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title:             c.title_fr,
    datePosted:        c.datePosted,
    validThrough:      c.deadline || undefined,
    hiringOrganization: { "@type": "Organization", name: c.organization_fr },
    jobLocation:       { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "MA" } },
    description:       c.summary_fr || c.title_fr,
    employmentType:    "FULL_TIME",
  };

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
          <span className="text-gray-600 truncate">{c.organization_fr}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Status badge */}
            {expired && (
              <div className="mb-4 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-2 rounded-lg inline-block">
                Concours clôturé
              </div>
            )}

            {/* Organization */}
            <p className="text-sm font-bold text-primary mb-2">{c.organization_fr}</p>

            {/* Title FR */}
            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
              {c.title_fr}
            </h1>

            {/* Title AR */}
            <p className="text-base text-gray-500 mb-6 text-right leading-relaxed" dir="rtl">
              {c.title_ar}
            </p>

            {/* Summary */}
            {c.summary_fr && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
                <p className="text-sm font-semibold text-blue-800 mb-1">Résumé</p>
                <p className="text-sm text-blue-700 leading-relaxed">{c.summary_fr}</p>
              </div>
            )}

            {/* Arabic content */}
            {c.content_ar && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  تفاصيل المباراة
                </p>
                <p className="text-sm text-gray-700 leading-relaxed text-right whitespace-pre-line" dir="rtl">
                  {c.content_ar}
                </p>
              </div>
            )}

            {/* CTA */}
            <a
              href={c.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Voir le concours officiel
              <span>↗</span>
            </a>

            <p className="text-xs text-gray-400 mt-3">
              Source : alwadifa-maroc.com — Consultez la page officielle pour les documents et formulaires de candidature.
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Informations clés</h2>
              <dl className="space-y-3 text-sm">
                {c.postes && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">Postes</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5">{c.postes} poste{c.postes > 1 ? "s" : ""}</dd>
                  </div>
                )}
                {c.niveau && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">Niveau requis</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5">{c.niveau}</dd>
                  </div>
                )}
                {c.deadline && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">Date limite</dt>
                    <dd className={`font-semibold mt-0.5 ${expired ? "text-gray-400 line-through" : "text-orange-600"}`}>
                      {formatDate(c.deadline)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wider">Publié le</dt>
                  <dd className="text-gray-700 mt-0.5">{formatDate(c.datePosted)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wider">Organisation</dt>
                  <dd className="text-gray-700 mt-0.5">{c.organization_fr}</dd>
                </div>
              </dl>

              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Postuler ↗
              </a>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">
                  Autres concours — {c.organization_fr}
                </h2>
                <div className="space-y-2">
                  {related.map(r => (
                    <Link
                      key={r.id}
                      href={`/concours/${r.id}`}
                      className="block text-xs text-gray-600 hover:text-primary leading-snug py-1 border-b border-gray-50 last:border-0"
                    >
                      {r.title_fr.slice(0, 80)}{r.title_fr.length > 80 ? "…" : ""}
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
