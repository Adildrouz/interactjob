import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { githubConfigured, readJsonFromGithub, commitJsonFilesToGithub } from "@/lib/github-data";

const JOBS_REL  = "data/jobs.json";
const JOBS_PATH = path.join(process.cwd(), JOBS_REL);

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

function toSlug(title: string, city: string): string {
  return `${title} ${city}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function generateColor(str: string): string {
  const colors = ["#7C3AED","#E11D48","#2563EB","#059669","#D97706","#0891B2","#7C2D12","#1D4ED8","#065F46","#92400E"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return colors[hash % colors.length];
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, company, city, sector, contractType, description, requirements, salary, sponsored } = await req.json();
  if (!title || !company || !city) return NextResponse.json({ error: "Titre, entreprise et ville requis" }, { status: 400 });

  const useGithub = githubConfigured();
  const now = new Date();
  const slug = toSlug(title, city);

  const newJob = {
    id: randomUUID(),
    title, company,
    companyInitials: company.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "XX",
    companyColor: generateColor(company),
    city, sector: sector || "Autre",
    contractType: contractType || "CDI",
    description: description || "",
    requirements: typeof requirements === "string" ? requirements.split("\n").filter(Boolean) : (requirements || []),
    salary: salary || null,
    source: "Direct",
    sourceUrl: null,
    postedAt: now.toISOString().split("T")[0],
    featured: !!sponsored,
    sponsored: !!sponsored,
    slug,
    country: "Maroc",
    contract_type: contractType || "CDI",
    source_site: "Direct",
    source_url: null,
    date_posted: now.toISOString().split("T")[0],
    date_scraped: now.toISOString(),
    date_expires: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    expired: false,
    hr_commentary: "",
    meta_title: `${title} – ${city}`.slice(0, 60),
    meta_description: `Offre emploi : ${title} chez ${company} à ${city}. Candidatez maintenant sur InteractJob.ma.`.slice(0, 155),
    linkedin_caption: `${title} chez ${company} — ${city}`,
    schema: {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title, description: description || "",
      datePosted: now.toISOString().split("T")[0],
      validThrough: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      employmentType: ({ CDI: "FULL_TIME", CDD: "CONTRACTOR", Stage: "INTERN" } as Record<string,string>)[contractType] || "OTHER",
      jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: city, addressCountry: "MA" } },
      hiringOrganization: { "@type": "Organization", name: company },
    },
  };

  let jobs: any[] = [];
  if (useGithub) {
    jobs = await readJsonFromGithub<any[]>(JOBS_REL);
  } else {
    try { jobs = JSON.parse(await fs.readFile(JOBS_PATH, "utf-8")); } catch { jobs = []; }
  }
  jobs.unshift(newJob);

  if (useGithub) {
    await commitJsonFilesToGithub([{ path: JOBS_REL, data: jobs }], `feat(admin): add job "${title}" — ${slug}`);
  } else {
    await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
  }

  return NextResponse.json({ success: true, slug, id: newJob.id });
}
