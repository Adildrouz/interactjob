"use client";
import { useEffect } from "react";

export interface RecentJob {
  id: string;
  slug: string;
  title: string;
  company: string;
  city: string;
  contractType: string;
  companyColor: string;
  companyInitials: string;
  sector: string;
}

const STORAGE_KEY = "ij_recent_jobs";
const MAX = 3;

export function trackJobVisit(job: RecentJob) {
  try {
    const stored: RecentJob[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = stored.filter((j) => j.id !== job.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([job, ...filtered].slice(0, MAX)));
  } catch {}
}

export function getRecentJobs(): RecentJob[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function JobVisitTracker({ job }: { job: RecentJob }) {
  useEffect(() => {
    trackJobVisit(job);
    // Server-side view counter — once per browser session per job
    try {
      const seenKey = `ij_viewed_${job.id}`;
      if (!sessionStorage.getItem(seenKey)) {
        sessionStorage.setItem(seenKey, "1");
        fetch("/api/jobs/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
