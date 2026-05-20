import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import remoteJobsRaw from "@/data/remote-jobs.json";

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
};

const allJobs = remoteJobsRaw as unknown as RemoteJob[];
const BASE_URL = "https://www.interactjob.ma";

const SOURCE_LABEL: Record<string, string> = {
  WeWorkRemotely: "We Work Remotely",
  Remotive:       "Remotive",
  RemoteOK:       "RemoteOK",
  Himalayas:      "Himalayas",
  WorkingNomads:  "Working Nomads",
  "Remote.co":    "Remote.co",
  Jobspresso:     "Jobspresso",
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

export async function generateStaticParams() {
  return allJobs.map((j) => ({ id: j.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const job = allJobs.find((j) => j.id === id);
  if (!job) return {};

  const title       = `${job.title} — ${job.company} | Remote Global`;
  const description = job.summary || `Offre remote 100% télétravail : ${job.title} chez ${job.company}. Candidature internationale acceptée.`;
  const canonical   = `${BASE_URL}/offres/remote/${job.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url:      canonical,
      type:     "website",
      siteName: "InteractJob",
    },
    twitter: { card: "summary", title, description },
    alternates: { canonical },
  };
}

export default async function RemoteJobPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = allJobs.find((j) => j.id === id);
  if (!job) notFound();

  const published = new Date(job.published).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const catColor   = CATEGORY_COLOR[job.category] ?? "bg-gray-100 text-gray-600";
  const srcLabel   = SOURCE_LABEL[job.source] ?? job.source;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back */}
      <Link
        href={"/offres/remote" as any}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour aux offres remote
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            🌍 Remote Global
          </span>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${catColor}`}>
            {job.category}
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">
            {srcLabel}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
          {job.title}
        </h1>
        <p className="text-lg text-gray-600 font-medium mb-1">{job.company}</p>
        <p className="text-sm text-gray-400 mb-6">Publié le {published}</p>

        {/* CTA principal */}
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm text-base mb-8"
        >
          Postuler à cette offre
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        {/* Description */}
        {job.summary && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-800 mb-3">Description du poste</h2>
            <p className="text-gray-600 leading-relaxed text-sm">{job.summary}</p>
          </div>
        )}

        {/* Infos pratiques */}
        <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Type de poste</p>
            <p className="text-sm font-semibold text-gray-700">100% Remote</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Localisation</p>
            <p className="text-sm font-semibold text-gray-700">Monde entier 🌍</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Catégorie</p>
            <p className="text-sm font-semibold text-gray-700">{job.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Source</p>
            <p className="text-sm font-semibold text-gray-700">{srcLabel}</p>
          </div>
        </div>

        {/* CTA secondaire */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm text-base"
          >
            Postuler maintenant
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <p className="text-center text-xs text-gray-400 mt-3">
            Tu seras redirigé vers {srcLabel} pour postuler
          </p>
        </div>
      </div>

      {/* Lien retour */}
      <div className="mt-6 text-center">
        <Link
          href={"/offres/remote" as any}
          className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
        >
          ← Voir toutes les offres remote
        </Link>
      </div>
    </div>
  );
}
