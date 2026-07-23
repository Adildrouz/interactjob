import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { githubConfigured, readJsonFromGithub, commitJsonFilesToGithub } from "@/lib/github-data";
import { safeTruncate } from "@/lib/utils";

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

  const { title, company, city, sector, sectorOther, contractType, description, requirements, salary, sponsored, contactEmail } = await req.json();
  if (sector === "Autre" && !(sectorOther || "").trim()) {
    return NextResponse.json({ error: "Précisez le métier ou secteur pour \"Autre\"" }, { status: 400 });
  }
  if (!title || !company || !city) return NextResponse.json({ error: "Titre, entreprise et ville requis" }, { status: 400 });
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: "Email de contact employeur obligatoire" }, { status: 400 });
  }

  const useGithub = githubConfigured();
  const now = new Date();
  const slug = toSlug(title, city);

  const newJob = {
    id: randomUUID(),
    title, company,
    companyInitials: company.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "XX",
    companyColor: generateColor(company),
    city, sector: sector || "Autre",
    sectorOther: sector === "Autre" ? (sectorOther || "").trim() : "",
    contractType: contractType || "CDI",
    description: description || "",
    requirements: typeof requirements === "string" ? requirements.split("\n").filter(Boolean) : (requirements || []),
    salary: salary || null,
    contactEmail: contactEmail.trim().toLowerCase(),
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
    meta_title: safeTruncate(`${title} – ${city}`, 60),
    meta_description: safeTruncate(`Offre emploi : ${title} chez ${company} à ${city}. Candidatez maintenant sur InteractJob.ma.`, 155),
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

  // Auto-upsert employer in CRM so it appears immediately in Marketing Employeurs
  try {
    const { MongoClient, ObjectId } = await import("mongodb");
    const uri = process.env.MONGODB_URI;
    if (uri) {
      const client = new MongoClient(uri);
      await client.connect();
      const col = client.db("interactjob").collection("employers");
      await col.createIndex({ email: 1 }, { unique: true }).catch(() => {});
      await col.updateOne(
        { email: contactEmail.trim().toLowerCase() },
        {
          $setOnInsert: {
            _id: new ObjectId(),
            company_name: company,
            contact_name: "",
            email: contactEmail.trim().toLowerCase(),
            phone: "",
            city,
            sector: sector || "Autre",
            source: "direct",
            status: "prospect",
            notes: "",
            created_at: new Date(),
          },
          $set: {
            last_job_title: title,
            last_job_date: now.toISOString().split("T")[0],
          },
        },
        { upsert: true }
      );
      await client.close();
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ success: true, slug, id: newJob.id });
}
