import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import ServicesCVCard from "@/components/ServicesCVCard";
import PromoCountdown from "@/components/PromoCountdown";

export const metadata: Metadata = {
  title: "CV Pro -50% Offre Flash — 99 MAD seulement | InteractJob",
  description:
    "Offre Flash -50% ! CV professionnel par un DRH expert à 99 MAD (au lieu de 199 MAD). Optimisé ATS, livré en 48h. Offre limitée jusqu'au 3 juin 2026.",
  keywords: [
    "CV professionnel maroc",
    "optimisation ATS maroc",
    "rédaction CV maroc",
    "CV expert RH",
    "CV Casablanca",
    "CV Rabat",
    "InteractJob",
  ],
  openGraph: {
    title: "CV Professionnel Optimisé ATS — 199 MAD | InteractJob",
    description:
      "DRH expert avec 8 ans d'expérience. CV optimisé ATS, livraison 48h, format Word + PDF. 199 MAD seulement.",
    type: "website",
  },
};

const WA_PHONE = "212630960352";

const STEPS = [
  {
    icon: "🧪",
    title: "Testez votre CV",
    desc: "Obtenez votre score ATS gratuit en 30 secondes.",
    href: "/cv-checker",
    cta: "Tester gratuitement →",
  },
  {
    icon: "💳",
    title: "Commandez le service",
    desc: "Choisissez votre mode de paiement parmi 3 options.",
    href: null,
    cta: null,
  },
  {
    icon: "📤",
    title: "Envoyez votre CV actuel",
    desc: "Par WhatsApp ou email après confirmation de paiement.",
    href: null,
    cta: null,
  },
  {
    icon: "📄",
    title: "Recevez votre CV professionnel",
    desc: "Livraison sous 48h maximum. Format Word + PDF.",
    href: null,
    cta: null,
  },
];

const WHY = [
  "Expert RH avec 8 ans d'expérience (pas un algorithme)",
  "Spécialisé marché marocain — Hôtellerie, IT, Finance, RH",
  "Optimisé pour les ATS des grandes entreprises marocaines",
  "Format accepté par Rekrute, Emploi.ma, LinkedIn",
  "Livraison Word + PDF modifiable",
];

const FAQS = [
  {
    q: "Quel délai de livraison ?",
    a: "48h maximum après réception de votre paiement et de votre CV actuel.",
  },
  {
    q: "Quels formats sont livrés ?",
    a: "Word (.docx) + PDF — deux fichiers prêts à l'emploi.",
  },
  {
    q: "Combien de révisions ?",
    a: "1 révision gratuite incluse dans les 7 jours suivant la livraison.",
  },
  {
    q: "Mon CV sera-t-il gardé confidentiel ?",
    a: "Oui, vos données personnelles ne sont jamais partagées avec des tiers.",
  },
  {
    q: "Je n'ai pas de CV actuel, vous pouvez quand même m'aider ?",
    a: "Oui — envoyez vos informations par WhatsApp et nous créons votre CV de zéro.",
  },
];

export default function ServicesCVPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1d4ed8] text-white py-20 px-4">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span>⭐</span> Service Premium — Expert RH
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-5">
            Obtenez un CV Professionnel
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              Optimisé ATS
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed mb-8">
            Rédigé par <strong className="text-white">Adil Drouz</strong> — DRH avec 8 ans d'expérience
            en hôtellerie internationale (Sofitel, Hôtel Le Golf d'Essaouira &amp; Spa)
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
            {["500+ CVs analysés", "8 ans d'expérience RH", "Réponse sous 48h"].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:inline text-blue-500">·</span>}
                <span className="font-semibold text-white">{s.split(" ")[0]}</span>
                <span>{s.split(" ").slice(1).join(" ")}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48h1440V24C1200 8 900 0 720 0S240 8 0 24v24z" fill="rgb(248,250,252)" />
          </svg>
        </div>
      </section>

      {/* ── Promo Countdown Banner ── */}
      <PromoCountdown />

      {/* ── Service Card ── */}
      <section className="bg-[#f8fafc] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ServicesCVCard />
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Processus</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Comment ça marche ?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%-12px)] w-6 h-0.5 bg-blue-100 z-0" />
                )}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 text-center relative z-10">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-3">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{step.desc}</p>
                  {step.href && step.cta && (
                    <Link
                      href={step.href as any}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {step.cta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pourquoi choisir InteractJob ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Avantages</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Pourquoi choisir InteractJob ?</h2>
          </div>

          <div className="bg-white rounded-3xl border border-blue-100 shadow-xl p-8 space-y-4">
            {WHY.map((item) => (
              <div key={item} className="flex items-start gap-4">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}

            {/* Action CTA */}
            <div className="pt-4 border-t border-gray-100">
              <a
                href={`https://wa.me/${WA_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb956] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-green-100"
              >
                📲 Poser une question sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Questions fréquentes</p>
            <h2 className="text-3xl font-extrabold text-gray-900">FAQ</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-semibold text-sm text-gray-900 hover:bg-gray-100 transition-colors">
                  {faq.q}
                  <svg
                    className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-2"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-4 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Témoignages</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Ce que disent nos clients</h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-bold text-gray-800">5,0 sur 5</span>
              <span className="text-sm text-gray-400">· 3 avis vérifiés LinkedIn</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  AE
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Ahmed ENNOUR</p>
                  <p className="text-xs text-gray-500 leading-snug">Responsable SAV &amp; Maintenance Industrielle · Maroc &amp; International</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-xs text-gray-400 ml-1.5">5,0 · sept. 2025</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                &ldquo;Je suis vraiment satisfait et heureux de ma collaboration avec Adil, il est honnête et une personne de parole. Je recommande vivement la collaboration avec M. Adil.&rdquo;
              </p>
              <span className="inline-block mt-3 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                Rédaction de CV
              </span>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  MS
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">MAHAMAT SABRI</p>
                  <p className="text-xs text-gray-500 leading-snug">Assistant Comptable · Master Banque &amp; Finance · Sage 100, Cegid</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-xs text-gray-400 ml-1.5">5,0 · mars 2026</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                &ldquo;J&rsquo;apprécie la qualité du service. Je suis très satisfait. La communication durant nos échanges a été excellente et le résultat est à la hauteur de mes attentes. Je recommande vivement ses services.&rdquo;
              </p>
              <span className="inline-block mt-3 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                Rédaction de CV
              </span>
            </div>
          </div>

          {/* Client strip */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Clients récents</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Ahmed ENNOUR", "MAHAMAT SABRI", "Abdoulaye Diallo", "Khaoula LAFRIOUNI", "Sébastien Tremblay", "Anass YOUKAOUI"].map((name) => (
                <span key={name} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-medium">
                  ✓ {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA — Promo urgency ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-red-600 via-orange-500 to-red-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          {/* Flash badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            🔥 Offre Flash — Plus que quelques jours
          </div>
          <h2 className="text-3xl font-extrabold mb-3">
            Ne ratez pas cette opportunité !
          </h2>
          <p className="text-white/80 mb-2 text-lg">
            CV Pro optimisé ATS à seulement{" "}
            <span className="text-yellow-300 font-black text-2xl">99 MAD</span>
          </p>
          <p className="text-white/60 text-sm mb-8">
            <span className="line-through">199 MAD</span> — Offre valable jusqu'au 3 juin 2026 · Livraison sous 48h
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#commander"
              className="bg-white text-red-600 font-black px-8 py-4 rounded-2xl hover:bg-yellow-50 hover:scale-[1.03] transition-all duration-200 shadow-2xl shadow-red-900/30"
            >
              🎯 Commander à 99 MAD maintenant
            </a>
            <Link
              href={"/cv-checker" as any}
              className="bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/30 transition-colors"
            >
              🧪 Tester mon CV gratuitement
            </Link>
            <a
              href={`https://wa.me/${WA_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1fb956] text-white font-bold px-6 py-4 rounded-2xl transition-colors shadow-lg"
            >
              📲 WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
