import type { Metadata } from "next";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Plan du site | InteractJob",
  description:
    "Plan du site InteractJob.ma — retrouvez toutes les pages : offres d'emploi, blog, outils CV, concours, villes et plus.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.interactjob.ma/sitemap" },
};

const SECTIONS = [
  {
    title: "Emploi",
    links: [
      { href: "/offres",        label: "Offres d'emploi" },
      { href: "/offres/remote", label: "Emplois remote" },
      { href: "/stages",        label: "Stages" },
      { href: "/concours",      label: "Concours" },
      { href: "/postuler",      label: "Candidature spontanée" },
      { href: "/publier",       label: "Publier une offre" },
    ],
  },
  {
    title: "Villes",
    links: [
      { href: "/offres-emploi-casablanca",    label: "Emploi Casablanca" },
      { href: "/offres-emploi-rabat",         label: "Emploi Rabat" },
      { href: "/offres-emploi-marrakech",     label: "Emploi Marrakech" },
      { href: "/offres-emploi-agadir",        label: "Emploi Agadir" },
      { href: "/offres-emploi-tanger",        label: "Emploi Tanger" },
      { href: "/offres-emploi-fes",           label: "Emploi Fès" },
    ],
  },
  {
    title: "Outils carrière",
    links: [
      { href: "/generateur-cv", label: "Générateur CV IA" },
      { href: "/cv-checker",    label: "Checker CV (score ATS)" },
      { href: "/code-travail",  label: "Code du travail Maroc" },
    ],
  },
  {
    title: "Blog",
    links: [
      { href: "/blog", label: "Tous les articles" },
    ],
  },
  {
    title: "À propos",
    links: [
      { href: "/a-propos",                  label: "Qui sommes-nous ?" },
      { href: "/contact",                   label: "Contact" },
      { href: "/mentions-legales",          label: "Mentions légales & CGU" },
      { href: "/politique-confidentialite", label: "Politique de confidentialité" },
      { href: "/disclaimer",                label: "Avis de non-responsabilité" },
    ],
  },
  {
    title: "Flux RSS",
    links: [
      { href: "/rss.xml",        label: "Offres d'emploi (RSS)" },
      { href: "/blog-rss.xml",   label: "Blog (RSS)" },
      { href: "/remote-rss.xml", label: "Remote jobs (RSS)" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Navigation</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Plan du site</h1>
        <p className="text-sm text-gray-400 mt-2">
          Toutes les pages d&apos;InteractJob.ma organisées par catégorie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as any}
                    className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-gray-300">→</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-x-6 gap-y-2">
        <span>
          Sitemap XML :{" "}
          <a href="/sitemap.xml" className="hover:text-primary transition-colors">sitemap.xml</a>
          {" · "}
          <a href="/sitemap-jobs.xml" className="hover:text-primary transition-colors">offres</a>
          {" · "}
          <a href="/sitemap-blog.xml" className="hover:text-primary transition-colors">blog</a>
          {" · "}
          <a href="/sitemap-pages.xml" className="hover:text-primary transition-colors">pages</a>
        </span>
      </div>
    </div>
  );
}
