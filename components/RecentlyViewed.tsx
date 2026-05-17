"use client";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { getRecentJobs, type RecentJob } from "./JobVisitTracker";

const contractBadge: Record<string, string> = {
  CDI: "bg-blue-50 text-blue-700 border-blue-100",
  CDD: "bg-amber-50 text-amber-700 border-amber-100",
  Stage: "bg-purple-50 text-purple-700 border-purple-100",
};

export default function RecentlyViewed() {
  const [jobs, setJobs] = useState<RecentJob[]>([]);

  useEffect(() => {
    setJobs(getRecentJobs());
  }, []);

  if (jobs.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">🕐</span>
        Vu récemment
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/offres/${job.slug || job.id}`}
            className="group bg-white rounded-xl border border-gray-100 p-4 hover:border-primary/30 hover:shadow-md transition-all flex items-start gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: job.companyColor }}
            >
              {job.companyInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {job.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{job.company} · {job.city}</p>
              <span className={`mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded border ${contractBadge[job.contractType] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                {job.contractType}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
