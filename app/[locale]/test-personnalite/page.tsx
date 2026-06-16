import type { Metadata } from "next";
import Link from "next/link";
import PriceTag from "@/components/PriceTag";
import { buildAlternates } from "@/lib/hreflang";

const BASE_URL = "https://www.interactjob.ma";
const NAVY = "#00347A";
const TURQ = "#00C2CB";

export const metadata: Metadata = {
  title: "Test de Personnalité Gratuit — Découvrez votre profil | InteractJob",
  description:
    "Passez un test de personnalité gratuit en 5 minutes. MBTI, DISC, Couleurs, Ennéagramme — découvrez votre profil et les métiers qui vous correspondent.",
  alternates: buildAlternates("/test-personnalite"),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Test de Personnalité Gratuit — Découvrez votre profil | InteractJob",
    description:
      "MBTI, DISC, Couleurs, Ennéagramme — découvrez votre profil et les métiers qui vous correspondent en 5 minutes.",
    type: "website",
    url: `${BASE_URL}/test-personnalite`,
    siteName: "InteractJob",
  },
};

const FAQ = [
  {
    q: "Les tests de personnalité sont-ils vraiment gratuits ?",
    a: "Oui. Les tests MBTI, Couleurs, DISC et Ennéagramme sont 100% gratuits et sans inscription. Seul le rapport professionnel complet est payant.",
  },
  {
    q: "Combien de temps dure un test ?",
    a: "Entre 8 et 15 minutes selon le test. Le test Couleurs est le plus rapide (8 min), le MBTI le plus complet (15 min).",
  },
  {
    q: "Mes résultats sont-ils confidentiels ?",
    a: "Oui. Vos résultats sont calculés dans votre navigateur et stockés localement. Nous ne collectons aucune donnée personnelle sans votre accord.",
  },
  {
    q: "À quoi servent ces tests pour ma carrière ?",
    a: "Ils vous aident à identifier vos forces, votre style de communication et les métiers qui correspondent le mieux à votre profil, puis à trouver des offres compatibles sur InteractJob.",
  },
];

const TESTS = [
  { href: "/test-personnalite/mbti", emoji: "🧭", title: "Test MBTI", meta: "60 questions · 15 min", desc: "Découvrez lequel des 16 types de personnalité vous correspond.", free: true },
  { href: "/test-personnalite/couleurs", emoji: "🎨", title: "Test des Couleurs", meta: "28 questions · 8 min", desc: "Rouge, Bleu, Vert ou Jaune : votre couleur dominante.", free: true },
  { href: "/test-personnalite/disc", emoji: "📊", title: "Test DISC", meta: "24 questions · 10 min", desc: "Votre profil comportemental D, I, S ou C au travail.", free: true },
  { href: "/test-personnalite/enneagramme", emoji: "⭐", title: "Test Ennéagramme", meta: "45 questions · 12 min", desc: "Identifiez votre type parmi les 9 de l'ennéagramme.", free: true },
];

export default function TestPersonnaliteHub() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "Comment passer un test de personnalité",
      step: [
        { "@type": "HowToStep", name: "Choisir un test", text: "Sélectionnez MBTI, Couleurs, DISC ou Ennéagramme." },
        { "@type": "HowToStep", name: "Répondre aux questions", text: "Répondez spontanément en 5 à 15 minutes." },
        { "@type": "HowToStep", name: "Découvrir son profil", text: "Obtenez votre profil et les métiers compatibles instantanément." },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Test de Personnalité", item: `${BASE_URL}/test-personnalite` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="text-white" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">Test de Personnalité Gratuit</h1>
          <p className="mt-4 text-lg md:text-xl" style={{ color: TURQ }}>
            Découvrez votre personnalité en 5 minutes — 100% gratuit
          </p>
          <p className="mt-3 text-white/80 max-w-2xl mx-auto">
            MBTI, Couleurs, DISC, Ennéagramme : choisissez votre test, répondez aux questions et
            découvrez les métiers qui vous correspondent.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="text-white text-center text-sm md:text-base font-medium py-3" style={{ background: TURQ }}>
        12 847 tests passés ce mois · 5 types de tests · Résultats instantanés
      </div>

      {/* Test cards */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {TESTS.map((tst) => (
            <Link
              key={tst.href}
              href={tst.href}
              className="group block rounded-2xl bg-white p-6 transition-all hover:-translate-y-0.5"
              style={{ border: `2px solid ${NAVY}` }}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{tst.emoji}</span>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: NAVY }}>{tst.title}</h2>
                  <p className="text-xs font-semibold text-gray-400">{tst.meta}</p>
                  <p className="mt-2 text-sm text-gray-600">{tst.desc}</p>
                  <span className="mt-3 inline-block text-sm font-semibold group-hover:underline" style={{ color: TURQ }}>
                    Commencer le test →
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Professionnel (monetized) */}
          <Link
            href="/test-personnalite/professionnel"
            className="group block rounded-2xl p-6 text-white transition-all hover:-translate-y-0.5 sm:col-span-2"
            style={{ background: NAVY, border: `2px solid ${TURQ}` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">💼</span>
              <div>
                <h2 className="text-lg font-bold">Test Professionnel — Rapport Complet</h2>
                <p className="text-xs font-semibold" style={{ color: TURQ }}>
                  Rapport PDF 10 pages · à partir de <PriceTag type="individual" />
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Analyse approfondie, correspondance métiers, style de communication et pack entreprise.
                </p>
                <span className="mt-3 inline-block text-sm font-semibold group-hover:underline" style={{ color: TURQ }}>
                  Découvrir le rapport pro →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-6" style={{ color: NAVY }}>Questions fréquentes</h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-xl bg-white p-4 border border-gray-200">
              <summary className="cursor-pointer font-semibold text-gray-900">{f.q}</summary>
              <p className="mt-2 text-sm text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Internal HR links */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-bold mb-3" style={{ color: NAVY }}>Pour aller plus loin</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/blog" className="font-medium hover:underline" style={{ color: TURQ }}>
              → Réussir son entretien d'embauche : conseils RH
            </Link>
          </li>
          <li>
            <Link href="/blog" className="font-medium hover:underline" style={{ color: TURQ }}>
              → Comment valoriser sa personnalité sur son CV
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
