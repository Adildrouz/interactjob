import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos – InteractJob",
  description: "Découvrez InteractJob, la plateforme d'emploi dédiée au marché marocain avec 18 000+ abonnés LinkedIn.",
};

const stats = [
  { value: "18 000+", label: "Abonnés LinkedIn" },
  { value: "247", label: "Offres actives" },
  { value: "12 400+", label: "Candidats inscrits" },
  { value: "84", label: "Entreprises partenaires" },
];

const values = [
  {
    icon: "🎯",
    title: "Accessibilité",
    description: "Rendre le marché de l'emploi marocain transparent, accessible et équitable pour tous les candidats.",
  },
  {
    icon: "🤝",
    title: "Confiance",
    description: "Chaque offre est vérifiée avant publication. Nous garantissons des annonces légitimes et de qualité.",
  },
  {
    icon: "🚀",
    title: "Innovation",
    description: "Nous utilisons les meilleurs outils digitaux pour connecter efficacement talent et recruteurs.",
  },
  {
    icon: "🇲🇦",
    title: "Ancrage local",
    description: "InteractJob est 100% dédié au marché marocain, avec une connaissance fine de son tissu économique.",
  },
];

const partners = [
  "OCP Group", "Attijariwafa Bank", "Inwi", "Maroc Telecom",
  "Banque Populaire", "Royal Air Maroc", "Club Med", "Manpower Maroc",
];

export default function AProposPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
            🇲🇦 Fondé au Maroc, pour le Maroc
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            La plateforme d&apos;emploi<br />
            <span className="text-accent">du Maroc digital</span>
          </h1>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
            InteractJob connecte chaque jour des milliers de candidats marocains
            aux meilleures entreprises du Royaume. Notre mission : simplifier
            le recrutement et ouvrir les portes de l&apos;emploi à tous.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
            {stats.map((s) => (
              <div key={s.label} className="py-10 text-center px-4">
                <p className="text-4xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-gray-500 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Notre mission</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-3 leading-tight">
              Connecter les talents marocains avec les meilleures opportunités
            </h2>
            <p className="text-gray-600 mt-5 leading-relaxed">
              Créée par des professionnels du recrutement passionnés par le marché de l&apos;emploi
              marocain, InteractJob est née d&apos;une conviction simple : chaque candidat
              mérite d&apos;accéder facilement aux meilleures offres d&apos;emploi, et chaque
              entreprise mérite de trouver rapidement le talent qu&apos;elle cherche.
            </p>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Nous agrégeons les offres des meilleurs jobboards marocains (Rekrute.com,
              Emploi.ma, Bayt.com) et y ajoutons des offres en direct des entreprises
              partenaires — le tout dans une interface moderne, rapide et intuitive.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/offres"
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                Voir les offres
              </Link>
              <Link
                href="/publier"
                className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Publier une offre
              </Link>
            </div>
          </div>

          {/* Visual card */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-gray-100">
            <div className="space-y-4">
              {[
                { label: "Offres CDI", value: "156", color: "bg-blue-100 text-primary" },
                { label: "Offres CDD", value: "68", color: "bg-amber-100 text-amber-700" },
                { label: "Stages", value: "23", color: "bg-purple-100 text-purple-700" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-50">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${item.color}`}>
                    {item.value} offres
                  </span>
                </div>
              ))}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Villes actives</p>
                <div className="flex flex-wrap gap-2">
                  {["Casablanca", "Rabat", "Marrakech", "Fès", "Agadir"].map((city) => (
                    <span key={city} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Nos valeurs</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">Ce qui nous définit</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary hover:bg-primary-light transition-all group">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LinkedIn CTA */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0077B5] to-[#005582] rounded-2xl p-10 text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle, white 2px, transparent 2px)", backgroundSize: "40px 40px" }}
            />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="text-2xl font-bold">18 000+ abonnés</span>
                </div>
                <h3 className="text-2xl font-bold">Notre communauté LinkedIn</h3>
                <p className="text-blue-100 mt-2 max-w-md">
                  Rejoignez plus de 18 000 professionnels marocains qui suivent
                  nos actualités RH, conseils carrière et offres d&apos;emploi exclusives.
                </p>
              </div>
              <a
                href="https://www.linkedin.com/company/interact-job/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-white text-[#0077B5] font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-sm"
              >
                Rejoindre la communauté →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">
            Entreprises qui nous font confiance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {partners.map((p) => (
              <span key={p} className="text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-4 py-2 rounded-full">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Contactez-nous</h2>
          <p className="text-gray-500 mt-3 text-sm">
            Une question, un partenariat, une offre à publier ? Notre équipe est disponible.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "✉️", label: "Email", value: "contact@interactjob.ma", href: "mailto:contact@interactjob.ma" },
              { icon: "💼", label: "LinkedIn", value: "InteractJob", href: "https://www.linkedin.com/company/interact-job/" },
              { icon: "📍", label: "Siège", value: "Casablanca, Maroc", href: null },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-700">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
