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
  }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
