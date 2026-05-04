import Link from "next/link";
import JobCard from "@/components/JobCard";
import HeroSearch from "@/components/HeroSearch";
import jobs from "@/data/jobs.json";
import articles from "@/data/articles.json";
import { Job } from "@/types";

const allJobs = jobs as Job[];
const sponsoredJobs = allJobs.filter((j) => j.sponsored);
const featuredJobs = allJobs.filter((j) => j.featured && !j.sponsored);
const displayJobs = [...sponsoredJobs, ...featuredJobs].slice(0, 6);
const latestArticles = articles.slice(0, 3);

const stats = [
  {
    value: "247",
    label: "Offres actives",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    value: "12 400+",
    label: "Candidats inscrits",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: "84",
    label: "Entreprises partenaires",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const sectors = [
  { key: "IT", label: "IT & Digital", icon: "💻", count: 48, color: "from-violet-500 to-purple-600" },
  { key: "Finance", label: "Finance", icon: "📊", count: 35, color: "from-blue-500 to-cyan-600" },
  { key: "Hôtellerie", label: "Hôtellerie", icon: "🏨", count: 29, color: "from-orange-500 to-amber-600" },
  { key: "RH", label: "Ressources Humaines", icon: "👥", count: 22, color: "from-emerald-500 to-green-600" },
  { key: "Administratif", label: "Administratif", icon: "📁", count: 31, color: "from-slate-500 to-gray-600" },
  { key: "Commerce", label: "Commerce", icon: "🤝", count: 42, color: "from-rose-500 to-pink-600" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-primary via-[#1a47c8] to-[#0f3299] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-7 border border-white/20">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              🇲🇦 Plateforme #1 de l&apos;emploi au Maroc
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Trouvez l&apos;emploi
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-400">
                de vos rêves
              </span>
            </h1>

            <p className="mt-5 text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
              Des centaines d&apos;offres CDI, CDD et Stage dans toutes les villes
              du Maroc — publiées chaque jour par les meilleures entreprises.
            </p>

            <HeroSearch />

            <p className="mt-4 text-sm text-blue-300">
              Populaires&nbsp;:{" "}
              {["IT", "Finance", "Hôtellerie", "RH"].map((s, i) => (
                <span key={s}>
                  <Link
                    href={`/offres?sector=${encodeURIComponent(s)}`}
                    className="text-blue-200 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    {s}
                  </Link>
                  {i < 3 && <span className="mx-1.5 text-blue-400">·</span>}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48h1440V24C1200 8 900 0 720 0S240 8 0 24v24z" fill="rgb(248,250,252)" />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-primary mx-auto mb-3">
                  {s.icon}
                </div>
                <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured jobs ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">À la une</p>
            <h2 className="text-2xl font-extrabold text-gray-900">Offres récentes</h2>
          </div>
          <Link
            href="/offres"
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            Voir tout
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/offres"
            className="inline-flex items-center gap-2.5 bg-primary text-white px-7 py-3.5 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
          >
            Voir toutes les offres d&apos;emploi
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Sectors ── */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Explorez</p>
            <h2 className="text-2xl font-extrabold text-gray-900">Parcourir par secteur</h2>
            <p className="text-gray-500 mt-2 text-sm">Trouvez les offres dans votre domaine d&apos;expertise</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {sectors.map((sector) => (
              <Link
                key={sector.key}
                href={`/offres?sector=${encodeURIComponent(sector.key)}`}
                className="group relative bg-white hover:shadow-md border border-gray-100 rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${sector.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="text-4xl mb-3">{sector.icon}</div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors leading-tight">
                  {sector.label}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-medium">{sector.count} offres</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Conseils carrière</p>
            <h2 className="text-2xl font-extrabold text-gray-900">Blog RH</h2>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            Tous les articles
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {latestArticles.map((article) => (
            <Link key={article.id} href={`/blog/${article.slug}`} className="group">
              <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full flex flex-col">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center">
                  <span className="text-5xl">{article.coverEmoji}</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit mb-3 ${article.categoryColor}`}>
                    {article.category}
                  </span>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug flex-1">
                    {article.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>{article.readTime} min de lecture</span>
                    <span className="text-primary font-semibold group-hover:gap-2 flex items-center gap-1 transition-all">
                      Lire →
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ── LinkedIn bar ── */}
      <section className="border-y border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#0077B5] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Rejoignez notre communauté LinkedIn</p>
                <p className="text-sm text-gray-500">
                  <strong className="text-primary">18 000+</strong> professionnels marocains nous suivent déjà
                </p>
              </div>
            </div>
            <a
              href="https://www.linkedin.com/company/interact-job/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-[#0077B5] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#006097] transition-colors shadow-md"
            >
              Suivre InteractJob →
            </a>
          </div>
        </div>
      </section>

      {/* ── Employer CTA ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full mb-5 border border-white/20">
                  🏢 Pour les recruteurs
                </div>
                <h2 className="text-3xl font-extrabold leading-tight">
                  Trouvez les meilleurs<br />
                  talents marocains
                </h2>
                <p className="mt-4 text-gray-300 leading-relaxed">
                  Publiez votre offre d&apos;emploi et atteignez des milliers de candidats
                  qualifiés à travers tout le Royaume. Visibilité garantie.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/publier"
                    className="bg-accent text-white font-bold px-7 py-3.5 rounded-xl hover:bg-accent-dark transition-colors shadow-lg shadow-accent/25 text-center"
                  >
                    Publier une offre gratuite
                  </Link>
                  <Link
                    href="/a-propos"
                    className="border border-white/20 text-white px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors font-medium text-center"
                  >
                    En savoir plus
                  </Link>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-3">
                {[
                  { icon: "🎯", label: "Ciblage précis", desc: "Candidats filtrés par secteur et ville" },
                  { icon: "⚡", label: "Publication rapide", desc: "Votre offre en ligne en moins de 2 min" },
                  { icon: "📊", label: "Statistiques", desc: "Vues et candidatures en temps réel" },
                  { icon: "🌐", label: "Multi-diffusion", desc: "LinkedIn + InteractJob + réseau" },
                ].map((f) => (
                  <div key={f.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <p className="font-bold text-sm text-white">{f.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
