import Link from "next/link";
import jobs from "@/data/jobs.json";
import { Job } from "@/types";
import JobCard from "@/components/JobCard";
import NotFoundSearch from "@/components/NotFoundSearch";

const recentJobs = (jobs as unknown as Job[])
  .filter((j) => !j.expired)
  .slice(0, 6);

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Logo + message */}
      <div className="text-center mb-12">
        <Link href="/" className="inline-flex items-center gap-1.5 mb-8">
          <span className="text-2xl font-black text-primary">InteractJob</span>
          <span className="text-xs font-bold text-accent bg-accent-light px-2 py-0.5 rounded-full">.ma</span>
        </Link>

        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">404</h1>
        <p className="text-xl font-semibold text-gray-700 mb-2">Page introuvable</p>
        <p className="text-gray-500 max-w-md mx-auto">
          Cette page n&apos;existe plus ou a été déplacée. Utilisez la recherche ci-dessous pour trouver une offre.
        </p>
      </div>

      {/* Search bar */}
      <NotFoundSearch />

      {/* Recent jobs */}
      {recentJobs.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Offres récentes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/offres"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors"
        >
          Voir toutes les offres
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
