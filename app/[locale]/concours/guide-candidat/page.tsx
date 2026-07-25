import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { buildFrOnlyAlternates } from "@/lib/hreflang";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Guide du Candidat — Réussir un Concours de la Fonction Publique au Maroc",
  description: "Guide complet pour réussir un concours public au Maroc : étapes du processus, documents à préparer, conseils pour l'écrit et l'oral, erreurs à éviter.",
  alternates: buildFrOnlyAlternates("/concours/guide-candidat"),
  keywords: ["guide concours fonction publique maroc", "réussir concours public maroc", "préparer concours administratif", "documents concours fonction publique"],
};

const STEPS = [
  {
    title: "1. Repérer et vérifier l'avis de concours",
    body: "Chaque concours fait l'objet d'un avis officiel publié par l'organisme recruteur (ministère, collectivité, établissement public), généralement relayé sur alwadifa-maroc.com et sur le site officiel de l'organisme. Vérifiez systématiquement : le niveau de diplôme requis, la limite d'âge éventuelle, le nombre de postes, la région d'affectation, et surtout la date limite de dépôt — un dossier envoyé après cette date est automatiquement rejeté.",
  },
  {
    title: "2. Constituer un dossier complet",
    body: "La liste exacte des pièces est précisée dans chaque avis, mais elle comprend presque toujours : une demande manuscrite ou un formulaire de candidature, un CV à jour, une copie de la Carte d'Identité Nationale (CIN), des copies certifiées conformes de vos diplômes et relevés de notes, et deux photos d'identité récentes. Certains concours exigent en plus un extrait d'acte de naissance, un certificat médical d'aptitude ou un extrait de casier judiciaire (fiche anthropométrique B3).",
  },
  {
    title: "3. Réussir la présélection sur dossier",
    body: "L'administration élimine d'abord les dossiers incomplets ou hors critères (diplôme non conforme, âge dépassé, pièces manquantes). Un CV clair et bien structuré, avec les intitulés de diplômes conformes à ceux demandés dans l'avis, augmente vos chances de passer cette première étape.",
  },
  {
    title: "4. Préparer l'épreuve écrite",
    body: "La plupart des concours publics comportent une épreuve de culture générale (actualité, institutions marocaines, Vision Royale) et une épreuve spécifique liée au poste (droit, finances, informatique, technique selon le métier). Entraînez-vous avec les annales des concours précédents de l'organisme visé, généralement disponibles sur son site ou partagées par les candidats sur les forums spécialisés.",
  },
  {
    title: "5. Réussir l'entretien oral",
    body: "Les candidats admissibles à l'écrit passent un entretien devant un jury, qui évalue la motivation, la connaissance du poste et de l'organisme, et parfois la maîtrise d'une langue étrangère. Préparez une présentation de votre parcours en 2 minutes, renseignez-vous sur les missions de l'organisme, et anticipez les questions sur vos expériences passées.",
  },
  {
    title: "6. Suivre les résultats",
    body: "Les résultats (admissibilité puis liste définitive des lauréats) sont publiés sur le site de l'organisme et souvent relayés sur alwadifa-maroc.com. Le délai entre la clôture des candidatures et les résultats définitifs varie généralement de 2 à 6 mois selon la taille du concours et le nombre de candidats.",
  },
];

const MISTAKES = [
  "Déposer un dossier incomplet ou après la date limite — la cause n°1 de rejet automatique.",
  "Ignorer les conditions précises de diplôme (un intitulé légèrement différent peut suffire à disqualifier un dossier).",
  "Négliger la lettre de motivation ou la CIN à recopier, alors que ce sont souvent les pièces exigées en premier.",
  "Ne pas se renseigner sur l'organisme avant l'entretien oral.",
  "Se limiter à un seul concours — multiplier les candidatures augmente vos chances sans coût supplémentaire.",
];

export default function GuideCandidatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-navy-700">Accueil</Link>
        <span>/</span>
        <Link href="/concours" className="hover:text-navy-700">Concours</Link>
        <span>/</span>
        <span className="text-gray-600">Guide du candidat</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <span className="font-[family-name:var(--font-hand)] text-2xl font-semibold text-tq-700 leading-none">◆</span>
        <span aria-hidden className="h-px w-10 bg-tq-400" />
        <span className="text-sm font-medium text-navy-500">fonction publique</span>
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-navy-900 mb-4">
        Guide du Candidat — Réussir un Concours de la Fonction Publique au Maroc
      </h1>
      <p className="text-gray-600 leading-relaxed mb-8">
        Ce guide résume les étapes concrètes pour préparer et réussir un concours de recrutement dans l&apos;administration
        marocaine — des collectivités territoriales aux établissements publics — ainsi que les documents à réunir et les
        erreurs les plus fréquentes qui éliminent des candidats pourtant qualifiés.
      </p>

      <div className="space-y-6 mb-10">
        {STEPS.map((s) => (
          <div key={s.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-2">{s.title}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <section className="mb-10 bg-orange-50 border border-orange-100 rounded-2xl p-6">
        <h2 className="text-base font-bold text-orange-800 mb-3">Erreurs fréquentes à éviter</h2>
        <ul className="space-y-2">
          {MISTAKES.map((m) => (
            <li key={m} className="text-sm text-orange-700 leading-relaxed flex gap-2">
              <span>✗</span><span>{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[image:var(--gradient-atlas)] rounded-2xl p-6 text-white mb-10">
        <h2 className="text-lg font-bold mb-2">Préparez votre candidature</h2>
        <p className="text-blue-100 text-sm leading-relaxed mb-4">
          Un CV clair et sans erreur fait souvent la différence dès la présélection sur dossier.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            href={"/cv-checker" as any}
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            ✅ Vérifiez votre CV gratuitement
          </Link>
          <Link
            href={"/generateur-cv" as any}
            className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
          >
            🤖 Créer mon CV IA — 5€
          </Link>
        </div>
      </section>

      <Link href="/concours" className="block text-center text-sm text-navy-700 hover:underline py-2">
        ← Voir tous les concours actifs
      </Link>
    </div>
  );
}
