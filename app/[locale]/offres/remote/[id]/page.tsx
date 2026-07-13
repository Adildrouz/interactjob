import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import remoteJobsRaw from "@/data/remote-jobs.json";
import { REMOTE_JOB_VALID_DAYS, isRemoteJobExpired } from "@/lib/remoteJobs";

export const revalidate = 3600;

type RemoteJob = {
  id: string;
  title: string;
  company: string;
  link: string;
  published: string;
  summary: string;
  source: string;
  category: string;
  scrapedAt: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryUnit?: string;
  locationCountry?: string;
  applicationEmail?: string;
};

const allJobs  = remoteJobsRaw as unknown as RemoteJob[];
const BASE_URL = "https://www.interactjob.ma";

const SOURCE_LABEL: Record<string, string> = {
  WeWorkRemotely: "We Work Remotely",
  Remotive:       "Remotive",
  RemoteOK:       "RemoteOK",
  Himalayas:      "Himalayas",
  WorkingNomads:  "Working Nomads",
  "Remote.co":    "Remote.co",
  Jobspresso:     "Jobspresso",
  InteractJob:    "InteractJob",
};

const CATEGORY_COLOR: Record<string, string> = {
  Development:       "bg-blue-100 text-blue-700",
  Marketing:         "bg-pink-100 text-pink-700",
  Design:            "bg-purple-100 text-purple-700",
  HR:                "bg-orange-100 text-orange-700",
  Finance:           "bg-emerald-100 text-emerald-700",
  "Customer Support":"bg-yellow-100 text-yellow-700",
  Product:           "bg-cyan-100 text-cyan-700",
  General:           "bg-gray-100 text-gray-600",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Development:       ["développeur remote", "ingénieur logiciel télétravail", "développeur full stack remote", "job dev remote maroc"],
  Marketing:         ["marketing remote", "digital marketing télétravail", "content manager remote", "growth hacker remote maroc", "community manager remote maroc", "community manager télétravail", "réseaux sociaux remote", "créateur de contenu remote maroc"],
  Design:            ["designer remote", "UX designer télétravail", "graphiste remote", "UI design remote maroc"],
  HR:                ["RH remote", "recrutement télétravail", "human resources remote", "gestionnaire RH remote"],
  Finance:           ["finance remote", "comptable télétravail", "analyste financier remote", "finance manager remote maroc"],
  "Customer Support":["support client remote", "customer success télétravail", "service client remote", "support technique remote"],
  Product:           ["product manager remote", "chef de produit télétravail", "product owner remote", "PM remote maroc"],
  General:           ["offre remote", "télétravail international", "job remote monde entier", "travail à distance"],
};

const CATEGORY_DESCRIPTION: Record<string, string> = {
  Development:       "poste en développement logiciel et ingénierie informatique",
  Marketing:         "poste en marketing digital, growth et communication",
  Design:            "poste en design graphique, UX/UI et création visuelle",
  HR:                "poste en ressources humaines, recrutement et people management",
  Finance:           "poste en finance, comptabilité et analyse financière",
  "Customer Support":"poste en support client, customer success et relation client",
  Product:           "poste en product management et développement produit",
  General:           "poste en télétravail ouvert à tous profils",
};

export async function generateStaticParams() {
  return allJobs.map((j) => ({ id: j.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const job = allJobs.find((j) => j.id === id);
  if (!job) return {};

  const srcLabel   = SOURCE_LABEL[job.source] ?? job.source;
  const catDesc    = CATEGORY_DESCRIPTION[job.category] ?? "poste en télétravail";
  const catKws     = CATEGORY_KEYWORDS[job.category]    ?? [];
  const canonical  = `${BASE_URL}/offres/remote/${job.id}`;

  const salarySnippet = job.salaryMin && job.salaryMax
    ? ` Salaire : ${job.salaryMin.toLocaleString("fr-FR")} – ${job.salaryMax.toLocaleString("fr-FR")} ${job.salaryCurrency ?? "MAD"}/mois.`
    : "";
  const locationSnippet = job.locationCountry === "MA" ? " Poste réservé aux candidats basés au Maroc." : " Candidature internationale acceptée.";

  const title       = `${job.title} — ${job.company} | Offre Remote 🌍 | InteractJob`;
  const description =
    `${job.company} recrute un(e) ${job.title} en télétravail complet (${catDesc}).` +
    salarySnippet + locationSnippet +
    ` Publiée le ${new Date(job.published).toLocaleDateString("fr-FR")} via ${srcLabel}.` +
    ` Postulez maintenant sur InteractJob.ma.`;

  return {
    title,
    description,
    keywords: [
      job.title,
      job.company,
      job.category,
      "remote",
      "télétravail",
      "offre emploi remote",
      "travail à distance maroc",
      "job remote international",
      srcLabel,
      ...(job.locationCountry === "MA" ? ["job remote maroc", "télétravail maroc", "offre emploi maroc remote"] : []),
      ...(job.salaryMin ? [`salaire ${job.salaryMin} MAD`, `salaire ${job.salaryMax} MAD`, `salaire remote maroc`] : []),
      ...catKws,
    ],
    openGraph: {
      title,
      description,
      url:      canonical,
      type:     "website",
      siteName: "InteractJob — Emploi au Maroc & Remote",
      locale:   "fr_MA",
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical,
      languages: { fr: canonical, "x-default": canonical },
    },
    robots: { index: !isRemoteJobExpired(job.published), follow: true },
  };
}

// ── JSON-LD schemas ────────────────────────────────────────────────────────────

function buildJobPostingSchema(job: RemoteJob) {
  const validThrough = new Date(job.published);
  validThrough.setDate(validThrough.getDate() + REMOTE_JOB_VALID_DAYS);

  const locationName = job.locationCountry === "MA" ? "Morocco" : "Worldwide";
  const addressCountry = job.locationCountry ?? "REMOTE";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.summary || `${job.title} — poste 100% remote chez ${job.company}.`,
    "datePosted": new Date(job.published).toISOString().split("T")[0],
    "validThrough": validThrough.toISOString().split("T")[0],
    "employmentType": "FULL_TIME",
    "jobLocationType": "TELECOMMUTE",
    "applicantLocationRequirements": { "@type": "Country", "name": locationName },
    "hiringOrganization": { "@type": "Organization", "name": job.company },
    "jobLocation": {
      "@type": "Place",
      "address": { "@type": "PostalAddress", "addressCountry": addressCountry },
    },
    "occupationalCategory": job.category,
    "url": `${BASE_URL}/offres/remote/${job.id}`,
  };

  schema["baseSalary"] = job.salaryMin ? {
    "@type": "MonetaryAmount",
    "currency": job.salaryCurrency ?? "MAD",
    "value": {
      "@type": "QuantitativeValue",
      ...(job.salaryMax && job.salaryMax !== job.salaryMin
        ? { "minValue": job.salaryMin, "maxValue": job.salaryMax }
        : { "value": job.salaryMin }),
      "unitText": job.salaryUnit ?? "MONTH",
    },
  } : {
    "@type": "MonetaryAmount",
    "currency": "MAD",
    "value": { "@type": "QuantitativeValue", "value": 3111, "unitText": "MONTH" },
  };

  return schema;
}

function buildBreadcrumbSchema(job: RemoteJob) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil",       "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Offres Remote", "item": `${BASE_URL}/offres/remote` },
      { "@type": "ListItem", "position": 3, "name": job.title,       "item": `${BASE_URL}/offres/remote/${job.id}` },
    ],
  };
}

// ── Page component ─────────────────────────────────────────────────────────────

export default async function RemoteJobPage(
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  const { id } = await params;
  const job = allJobs.find((j) => j.id === id);
  if (!job) notFound();

  const srcLabel  = SOURCE_LABEL[job.source] ?? job.source;
  const catColor  = CATEGORY_COLOR[job.category] ?? "bg-gray-100 text-gray-600";
  const catDesc   = CATEGORY_DESCRIPTION[job.category] ?? "poste en télétravail";
  const published = new Date(job.published).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Related jobs — same category, different id
  const related = allJobs
    .filter((j) => j.category === job.category && j.id !== job.id)
    .slice(0, 3);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJobPostingSchema(job)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(job)) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-400">
            <li><Link href="/" className="hover:text-primary transition-colors">Accueil</Link></li>
            <li>/</li>
            <li><Link href={"/offres/remote" as any} className="hover:text-primary transition-colors">Offres Remote</Link></li>
            <li>/</li>
            <li className="text-gray-600 font-medium truncate max-w-[200px]">{job.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  🌍 Remote Global
                </span>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${catColor}`}>
                  {job.category}
                </span>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">
                  via {srcLabel}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                {job.title}
              </h1>
              <p className="text-lg text-primary font-semibold mb-1">{job.company}</p>
              <p className="text-sm text-gray-400">
                Publié le {published} · 100% télétravail · {job.locationCountry === "MA" ? "🇲🇦 Maroc" : "Monde entier"}
              </p>
              {job.salaryMin && job.salaryMax && (
                <p className="text-sm font-semibold text-emerald-700 mt-1">
                  💰 {job.salaryMin.toLocaleString("fr-FR")} – {job.salaryMax.toLocaleString("fr-FR")} {job.salaryCurrency ?? "MAD"}/mois
                </p>
              )}

              {/* CTA principal */}
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm text-base"
              >
                Postuler à cette offre
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {job.applicationEmail ? (
                <p className="text-xs text-gray-400 mt-2">
                  Ou par email :{" "}
                  <a href={`mailto:${job.applicationEmail}`} className="text-primary hover:underline font-medium">
                    {job.applicationEmail}
                  </a>
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Vous serez redirigé vers {srcLabel} pour postuler</p>
              )}
            </div>

            {/* Description */}
            {job.summary && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Description du poste</h2>
                <p className="text-gray-700 leading-relaxed">{job.summary}</p>
              </div>
            )}

            {/* GEO content — contexte enrichi pour les LLMs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">À propos de cette offre remote</h2>
              <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
                <p>
                  <strong>{job.company}</strong> recrute actuellement un(e) <strong>{job.title}</strong> en
                  télétravail complet (remote). Il s&apos;agit d&apos;un {catDesc}, ouvert aux candidats du monde entier,
                  y compris depuis le Maroc et les pays africains.
                </p>
                <p>
                  Cette offre a été publiée le <strong>{published}</strong> sur la plateforme <strong>{srcLabel}</strong>,
                  spécialisée dans les emplois 100% remote. Elle est agrégée et mise à jour en temps réel
                  sur InteractJob.ma pour faciliter la recherche d&apos;emploi remote depuis le Maroc.
                </p>
                <p>
                  Le télétravail (remote work) permet de travailler depuis n&apos;importe où dans le monde.
                  Cette offre est particulièrement adaptée aux professionnels marocains souhaitant accéder
                  au marché de l&apos;emploi international tout en restant au Maroc ou à l&apos;étranger.
                </p>
              </div>
            </div>

            {/* FAQ — optimisé GEO pour les extraits IA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Questions fréquentes</h2>
              <div className="space-y-5">
                <FaqItem
                  q={`Comment postuler à l'offre ${job.title} chez ${job.company} ?`}
                  a={`Cliquez sur le bouton "Postuler à cette offre" ci-dessus. Vous serez redirigé vers ${srcLabel} où vous pourrez soumettre votre candidature directement. Assurez-vous que votre CV est à jour avant de postuler.`}
                />
                <FaqItem
                  q="Cette offre est-elle ouverte aux candidats marocains ?"
                  a={`Oui. Les offres remote globales sont ouvertes aux candidats du monde entier, y compris depuis le Maroc, la Tunisie, l'Algérie et toute l'Afrique. Aucune restriction géographique n'est indiquée pour ce poste chez ${job.company}.`}
                />
                <FaqItem
                  q="Qu'est-ce qu'un poste 100% remote ?"
                  a="Un poste 100% remote (télétravail complet) signifie que vous pouvez travailler depuis n'importe où dans le monde, sans obligation de vous déplacer au bureau. La communication se fait en ligne (email, visioconférence, outils collaboratifs)."
                />
                <FaqItem
                  q={`Quel est le domaine de ce poste chez ${job.company} ?`}
                  a={`Ce poste est classé dans la catégorie "${job.category}" — ${catDesc}. Il s'adresse aux professionnels ayant une expérience dans ce domaine.`}
                />
              </div>
            </div>

            {/* Tips CV — lien interne */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 p-6">
              <h3 className="font-bold text-gray-900 mb-2">💡 Optimisez votre candidature</h3>
              <p className="text-sm text-gray-600 mb-4">
                Avant de postuler à cette offre remote, assurez-vous que votre CV met en valeur
                vos expériences en télétravail et vos compétences en communication à distance.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={"/cv-checker" as any}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Analyser mon CV gratuitement →
                </Link>
                <Link
                  href={"/generateur-cv" as any}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Créer mon CV avec IA — 5€ →
                </Link>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Fiche rapide */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Fiche de l&apos;offre</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Entreprise</dt>
                  <dd className="font-semibold text-gray-800">{job.company}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Catégorie</dt>
                  <dd className="font-semibold text-gray-800">{job.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Type de contrat</dt>
                  <dd className="font-semibold text-gray-800">Remote / Télétravail</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Localisation</dt>
                  <dd className="font-semibold text-gray-800">{job.locationCountry === "MA" ? "🇲🇦 Maroc" : "🌍 Monde entier"}</dd>
                </div>
                {job.salaryMin && job.salaryMax && (
                  <div>
                    <dt className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Salaire</dt>
                    <dd className="font-semibold text-emerald-700">{job.salaryMin.toLocaleString("fr-FR")} – {job.salaryMax.toLocaleString("fr-FR")} {job.salaryCurrency ?? "MAD"}/mois</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Source</dt>
                  <dd className="font-semibold text-gray-800">{srcLabel}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Date de publication</dt>
                  <dd className="font-semibold text-gray-800">{published}</dd>
                </div>
              </dl>
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Postuler maintenant
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Offres similaires */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Offres similaires</h3>
                <ul className="space-y-3">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/offres/remote/${r.id}` as any}
                        className="group block"
                      >
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {r.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.company}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={"/offres/remote" as any}
                  className="mt-4 block text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Voir toutes les offres {job.category} →
                </Link>
              </div>
            )}

            {/* Alerte emploi */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">📱 Alertes emploi remote</h3>
              <p className="text-sm text-gray-600 mb-3">
                Rejoignez notre canal WhatsApp pour recevoir les meilleures offres remote chaque jour.
              </p>
              <a
                href="https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors text-sm"
              >
                Rejoindre sur WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href={"/offres/remote" as any}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← Retour aux offres remote
          </Link>
        </div>
      </div>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div itemScope itemType="https://schema.org/Question">
      <h3 className="font-semibold text-gray-900 text-sm mb-1.5" itemProp="name">{q}</h3>
      <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
        <p className="text-gray-600 text-sm leading-relaxed" itemProp="text">{a}</p>
      </div>
    </div>
  );
}
