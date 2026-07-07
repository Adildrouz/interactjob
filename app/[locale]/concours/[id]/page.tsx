import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";
import { inferJobSector, inferConcoursSector, formatDate, isExpired } from "@/lib/concours";
import ConcoursAlertForm from "@/components/ConcoursAlertForm";
import TrackedLink from "@/components/TrackedLink";

const allConcours = concoursData as Concours[];
const BASE_URL = "https://www.interactjob.ma";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allConcours.map((c) => ({ locale, id: c.slug }))
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const c = UUID_RE.test(id)
    ? allConcours.find((x) => x.id === id)
    : allConcours.find((x) => x.slug === id);
  if (!c) return {};

  const title = `${c.organization_fr} — Résultats & Informations`;
  const description = c.meta_description || c.summary_fr || `Concours de recrutement ${c.organization_fr} au Maroc.`;
  const canonical = `${BASE_URL}/concours/${c.slug}`;

  return {
    title,
    description,
    keywords: [c.organization_fr, "concours maroc", "fonction publique", "recrutement état", c.niveau || ""].filter(Boolean),
    openGraph: { title, description, url: canonical, type: "website", siteName: "InteractJob" },
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

function resolveDate(datePosted: string | null, deadline: string | null): string {
  if (datePosted) return datePosted;
  if (deadline) {
    const d = new Date(deadline);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

function buildDescriptionParagraphs(c: Concours): string[] {
  const paras: string[] = [];

  if (c.summary_fr) {
    paras.push(c.summary_fr);
  }

  paras.push(
    `${c.organization_fr} a ouvert un concours de recrutement au Maroc` +
    (c.niveau ? `, destiné aux candidats titulaires d'un niveau ${c.niveau}` : "") +
    `. Ce type d'avis de concours s'inscrit dans le cadre des procédures officielles de recrutement dans la fonction publique marocaine, ` +
    `garantissant transparence et égalité des chances pour tous les candidats.`
  );

  if (c.postes) {
    paras.push(
      `Ce recrutement concerne ${c.postes} poste${c.postes > 1 ? "s" : ""} à pourvoir. ` +
      `Les lauréats intégreront le cadre de la fonction publique avec une rémunération, des avantages et ` +
      `une stabilité professionnelle conformes au statut général de la fonction publique marocaine.`
    );
  }

  paras.push(
    `Pour constituer un dossier de candidature complet, préparez généralement : un CV à jour, ` +
    `une copie de la CIN, des copies certifiées conformes de vos diplômes, une lettre de motivation, ` +
    `et tout autre document spécifié dans l'annonce officielle. ` +
    `Vérifiez impérativement les conditions d'éligibilité sur le site officiel de ${c.organization_fr} ` +
    `ou sur alwadifa-maroc.com avant de soumettre votre candidature.`
  );

  paras.push(
    `InteractJob recense l'ensemble des concours de recrutement de la fonction publique, des collectivités ` +
    `territoriales et des établissements publics au Maroc. Utilisez nos outils gratuits pour optimiser votre ` +
    `CV et maximiser vos chances de réussite. Un CV optimisé ATS peut faire toute la différence lors de la ` +
    `présélection des dossiers, même pour les concours publics.`
  );

  return paras;
}

export default async function ConcoursDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // UUID → slug 301 redirect
  if (UUID_RE.test(id)) {
    const byUUID = allConcours.find((x) => x.id === id);
    if (byUUID?.slug) permanentRedirect(`/concours/${byUUID.slug}`);
    notFound();
  }

  const c = allConcours.find((x) => x.slug === id);
  if (!c) notFound();

  const expired = isExpired(c.deadline);

  // Related: same secteur first ("Autres concours dans le même secteur"), topped up with same-organization matches
  const concoursSector = inferConcoursSector(c);
  const sameSector = allConcours.filter((x) => x.id !== c.id && !isExpired(x.deadline) && inferConcoursSector(x) === concoursSector);
  const sameOrg = allConcours.filter((x) => x.id !== c.id && x.organization_fr === c.organization_fr);
  const related = [...sameSector, ...sameOrg.filter((x) => !sameSector.some((s) => s.id === x.id))].slice(0, 5);

  const activeJobs = (jobsData as any[]).filter((j) => !j.expired);
  const jobSector = inferJobSector(c);
  const sectorJobs = jobSector ? activeJobs.filter((j) => j.sector === jobSector) : [];
  const similarJobs = (sectorJobs.length >= 2 ? sectorJobs : activeJobs).slice(0, 4);

  const descParagraphs = buildDescriptionParagraphs(c);

  // validThrough: use deadline if set, else 6 months after datePosted (government concours stay open long)
  const posted      = new Date(resolveDate(c.datePosted, c.deadline) ?? new Date());
  const defaultExpiry = new Date(posted.getTime() + 180 * 86400000);
  const validThrough  = c.deadline ?? defaultExpiry.toISOString().split("T")[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: c.title_fr,
    datePosted: resolveDate(c.datePosted, c.deadline),
    validThrough,
    hiringOrganization: { "@type": "Organization", name: c.organization_fr },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Maroc",
        addressRegion: "Maroc",
        addressCountry: "MA",
      },
    },
    applicantLocationRequirements: { "@type": "Country", name: "MA" },
    description: descParagraphs.join(" "),
    employmentType: "FULL_TIME",
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "MAD",
      value: { "@type": "QuantitativeValue", minValue: 3111, unitText: "MONTH" },
    },
    url: `${BASE_URL}/concours/${c.slug}`,
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
          <div className="lg:col-span-2 space-y-6">
            {expired && (
              <div className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-2 rounded-lg inline-block">
                Concours clôturé
              </div>
            )}

            <p className="text-sm font-bold text-primary">{c.organization_fr}</p>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
              {c.title_fr}
            </h1>

            {c.title_ar && (
              <p className="text-base text-gray-500 text-right leading-relaxed" dir="rtl">
                {c.title_ar}
              </p>
            )}

            {c.summary_fr && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <p className="text-sm font-semibold text-blue-800 mb-1">Résumé</p>
                <p className="text-sm text-blue-700 leading-relaxed">{c.summary_fr}</p>
              </div>
            )}

            {c.content_ar && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  تفاصيل المباراة
                </p>
                <p className="text-sm text-gray-700 leading-relaxed text-right whitespace-pre-line" dir="rtl">
                  {c.content_ar}
                </p>
              </div>
            )}

            {/* Description SEO */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">À propos de ce concours</h2>
              {descParagraphs.map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
              ))}
            </div>

            {/* CTA */}
            <div>
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                Voir l&apos;annonce ↗
              </a>
              <p className="text-xs text-gray-400 mt-3">
                Repéré via alwadifa-maroc.com — vérifiez toujours l&apos;annonce originale sur le site de
                l&apos;organisme avant de postuler.
              </p>
            </div>

            {/* Préparez votre candidature */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <h2 className="text-lg font-bold mb-2">Préparez votre candidature</h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Maximisez vos chances de réussite. Un CV optimisé, une lettre de motivation percutante
                et un dossier complet font toute la différence lors de la présélection.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <TrackedLink
                  href={"/cv-checker" as any}
                  event="concours_cta_click"
                  eventParams={{ cta: "cv_checker", concours: c.slug }}
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
                >
                  ✅ Vérifiez votre CV gratuitement
                </TrackedLink>
                <TrackedLink
                  href={"/generateur-cv" as any}
                  event="concours_cta_click"
                  eventParams={{ cta: "generateur_cv", concours: c.slug }}
                  className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
                >
                  🤖 Créer mon CV IA — 5€
                </TrackedLink>
                <TrackedLink
                  href={"/postuler" as any}
                  event="concours_cta_click"
                  eventParams={{ cta: "postuler", concours: c.slug }}
                  className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
                >
                  📋 Candidature spontanée
                </TrackedLink>
              </div>
            </div>

            {/* Alertes concours */}
            <ConcoursAlertForm sector={concoursSector} />

            {/* Offres similaires */}
            {similarJobs.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Offres d&apos;emploi similaires
                </h2>
                <div className="space-y-3">
                  {similarJobs.map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/offres/${job.slug}` as any}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: job.companyColor || "#1d4ed8" }}
                      >
                        {job.companyInitials || job.company?.slice(0, 2).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.company} · {job.city || job.location} · {job.sector}
                        </p>
                      </div>
                      <span className="text-xs text-primary font-semibold flex-shrink-0">Voir →</span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/offres"
                  className="block text-center text-sm text-primary hover:underline mt-4"
                >
                  Voir toutes les offres d&apos;emploi →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Informations clés</h2>
              <dl className="space-y-3 text-sm">
                {c.postes && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">Postes</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5">
                      {c.postes} poste{c.postes > 1 ? "s" : ""}
                    </dd>
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

            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">
                  {sameSector.length > 0
                    ? `Autres concours — secteur ${concoursSector}`
                    : `Autres concours — ${c.organization_fr}`}
                </h2>
                <div className="space-y-2">
                  {related.map((r) => (
                    <TrackedLink
                      key={r.id}
                      href={`/concours/${r.slug}` as any}
                      event="concours_related_click"
                      eventParams={{ from: c.slug, to: r.slug }}
                      className="block text-xs text-gray-600 hover:text-primary leading-snug py-1 border-b border-gray-50 last:border-0"
                    >
                      {r.title_fr.slice(0, 80)}{r.title_fr.length > 80 ? "…" : ""}
                    </TrackedLink>
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
