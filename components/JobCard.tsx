import Link from "next/link";
import { Job } from "@/types";

const contractBadge: Record<Job["contractType"], string> = {
  CDI: "bg-blue-50 text-blue-700 border-blue-100",
  CDD: "bg-amber-50 text-amber-700 border-amber-100",
  Stage: "bg-purple-50 text-purple-700 border-purple-100",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} j.`;
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`;
  return `Il y a ${Math.floor(diff / 30)} mois`;
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <div
      className={`group bg-white rounded-2xl p-5 border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 relative flex flex-col gap-0 ${
        job.sponsored
          ? "border-accent shadow-sm"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Sponsored badge */}
      {job.sponsored && (
        <div className="absolute -top-2.5 left-4">
          <span className="bg-accent text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm">
            ⭐ Sponsorisé
          </span>
        </div>
      )}

      {/* Top: logo + title */}
      <div className="flex items-start gap-4 pt-2">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm ring-2 ring-white"
          style={{ backgroundColor: job.companyColor }}
        >
          {job.companyInitials}
        </div>

        <div className="flex-1 min-w-0">
          <Link href={`/offres/${job.id}`}>
            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug line-clamp-2 text-[15px]">
              {job.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{job.company}</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${contractBadge[job.contractType]}`}
        >
          {job.contractType}
        </span>

        <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.city}
        </span>

        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
          {job.sector}
        </span>
      </div>

      {/* Salary (if available) */}
      {job.salary && (
        <div className="mt-3">
          <span className="text-xs font-semibold text-accent bg-accent-light px-2.5 py-1 rounded-lg">
            💰 {job.salary}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">via</span>
          <span className="text-xs font-medium text-gray-400">{job.source}</span>
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400">{timeAgo(job.postedAt)}</span>
        </div>
        <Link
          href={`/offres/${job.id}`}
          className="text-xs font-bold text-primary bg-primary-light hover:bg-primary hover:text-white px-3.5 py-1.5 rounded-lg transition-colors"
        >
          Postuler →
        </Link>
      </div>
    </div>
  );
}
