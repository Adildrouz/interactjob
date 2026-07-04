import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";
import { buildFrOnlyAlternates } from "@/lib/hreflang";
import { formatDate, isExpired, inferConcoursSector, inferRegion } from "@/lib/concours";
import ConcoursExplorer, { type EnrichedConcours } from "./ConcoursExplorer";
import ConcoursAlertForm from "@/components/ConcoursAlertForm";
import TrackedLink from "@/components/TrackedLink";

export const metadata: Metadata = {
  title: "Concours Fonction Publique Maroc 2026 — Résultats & Offres",
  description: "Tous les concours de recrutement de la fonction publique marocaine : ministères, collectivités, établissements publics. Résultats CSPJ 2026, Ministère de l'Intérieur et plus. Mis à jour quotidiennement.",
  alternates: buildFrOnlyAlternates("/concours"),
  keywords: ["concours fonction publique maroc 2026", "résultats concours CSPJ 2026", "concours ministère intérieur", "recrutement état maroc"],
};

const allConcours = concoursData as Concours[];

type Job = { id: string; slug: string; title: string; company: string; city: string; contractType: string; sector: string; expired?: boolean };
const allJobs = jobsData as unknown as Job[];

const PRIVATE_SECTORS = ["Finance", "IT", "Commerce", "RH", "Marketing", "Industrie", "Logistique", "Santé", "BTP", "Éducation"];
const privateJobs = allJobs
  .filter(j => !j.expired && PRIVATE_SECTORS.includes(j.sector))
  .slice(0, 6);

const FAQ_ITEMS = [
  {
    q: "Comment postuler à un concours public au Maroc ?",
    a: "Consultez l'avis officiel publié par l'organisme recruteur (ministère, collectivité ou établissement public), vérifiez les conditions d'éligibilité (diplôme, âge, nationalité), puis déposez votre dossier avant la date limite indiquée — soit en ligne sur le portail de l'administration concernée, soit par courrier recommandé selon les modalités précisées dans l'annonce.",
  },
  {
    q: "Quels documents faut-il préparer pour un concours de la fonction publique ?",
    a: "En général : un CV à jour, une copie de la Carte d'Identité Nationale (CIN), des copies certifiées conformes de vos diplômes et attestations, une lettre de motivation, et parfois un extrait de casier judiciaire ou un certificat médical. La liste exacte est toujours précisée dans l'avis de concours officiel.",
  },
  {
    q: "Peut-on postuler à plusieurs concours en même temps ?",
    a: "Oui, il n'existe pas de limite légale au nombre de concours publics auxquels un candidat peut postuler simultanément, à condition de respecter les conditions d'éligibilité et les délais de chaque concours. Beaucoup de candidats multiplient les candidatures pour augmenter leurs chances.",
  },
  {
    q: "Combien de temps dure le processus de recrutement d'un concours public ?",
    a: "Le délai varie selon l'organisme, mais compte généralement entre 2 et 6 mois entre la clôture des candidatures et la publication des résultats définitifs, incluant présélection sur dossier, épreuves écrites et entretien oral.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function ConcoursPage() {
  const active  = allConcours.filter(c => !isExpired(c.deadline));
  const expired = allConcours.filter(c => isExpired(c.deadline));

  const enrichedActive: EnrichedConcours[] = active.map((c) => ({
    ...c,
    _sector: inferConcoursSector(c),
    _region: inferRegion(c),
  }));

  const latestPosted = allConcours.reduce<string | null>((latest, c) => {
    if (!c.datePosted) return latest;
    return !latest || c.datePosted > latest ? c.datePosted : latest;
  }, null);
  const isFreshToday = latestPosted === new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Fonction Publique</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Concours de Recrutement au Maroc</h1>
        <p className="text-gray-500 mt-2">
          {active.length} concours actifs · {isFreshToday ? "Mis à jour aujourd'hui" : `Mis à jour le ${formatDate(latestPosted)}`}
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/concours/cspj-2026" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            Résultats CSPJ 2026
          </Link>
          <Link href="/concours/ministere-interieur" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            Concours Ministère Intérieur
          </Link>
          <Link href={"/concours/guide-candidat" as any} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            📖 Guide du candidat
          </Link>
          <Link href="/offres" className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">
            Offres secteur privé →
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary">{active.length}</p>
          <p className="text-xs text-gray-500 mt-1">Concours actifs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">
            {allConcours.reduce((sum, c) => sum + (c.postes || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Postes à pourvoir</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">
            {enrichedActive.filter(c => {
              if (!c.deadline) return false;
              const diff = (new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              return diff >= 0 && diff <= 7;
            }).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Clôture imminente (7j)</p>
        </div>
      </div>

      {/* Préparez votre candidature — placed above the (potentially long) listing so it's always seen */}
      <section className="mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-bold mb-2">Préparez votre candidature</h2>
        <p className="text-blue-100 text-sm leading-relaxed mb-4">
          Maximisez vos chances de réussite. Un CV optimisé, une lettre de motivation percutante
          et un dossier complet font toute la différence lors de la présélection.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <TrackedLink
            href={"/cv-checker" as any}
            event="concours_cta_click"
            eventParams={{ cta: "cv_checker", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            ✅ Vérifiez votre CV gratuitement
          </TrackedLink>
          <TrackedLink
            href={"/generateur-cv" as any}
            event="concours_cta_click"
            eventParams={{ cta: "generateur_cv", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
          >
            🤖 Créer mon CV IA — 5€
          </TrackedLink>
          <TrackedLink
            href={"/postuler" as any}
            event="concours_cta_click"
            eventParams={{ cta: "postuler", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
          >
            📋 Candidature spontanée
          </TrackedLink>
        </div>
      </section>

      {/* Alertes concours */}
      <section className="mb-8">
        <ConcoursAlertForm />
      </section>

      {/* Interactive filter bar + closing-soon + results */}
      <ConcoursExplorer active={enrichedActive} />

      {/* Private sector CTA */}
      {privateJobs.length > 0 && (
        <section className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Secteur privé</p>
              <h2 className="text-lg font-bold text-gray-900">Après le concours, trouvez un emploi dans le privé</h2>
              <p className="text-sm text-gray-500 mt-1">Ne misez pas tout sur un seul concours — le secteur privé recrute aussi.</p>
            </div>
            <Link href="/offres" className="flex-shrink-0 text-xs font-semibold text-primary hover:underline whitespace-nowrap">
              Voir toutes les offres →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {privateJobs.map(j => (
              <Link
                key={j.id}
                href={`/offres/${j.slug}`}
                className="bg-white rounded-xl border border-blue-100 p-4 hover:shadow-md hover:border-primary transition-all"
              >
                <p className="text-xs font-semibold text-primary mb-1">{j.company}</p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{j.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">{j.city}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{j.contractType}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/offres"
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Toutes les offres d&apos;emploi
            </Link>
            <Link
              href="/postuler"
              className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Déposer mon CV
            </Link>
          </div>
        </section>
      )}

      {/* Intro (SEO + LLM) */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Comment fonctionnent les concours de la fonction publique au Maroc
        </h2>
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            Un concours de la fonction publique marocaine est une procédure officielle de recrutement organisée par un
            ministère, une collectivité territoriale ou un établissement public, dans le respect du statut général de la
            fonction publique. Chaque concours fait l&apos;objet d&apos;un avis officiel précisant le nombre de postes,
            le niveau de diplôme requis, les épreuves et la date limite de dépôt des candidatures.
          </p>
          <p>
            Le processus se déroule généralement en trois étapes : la présélection sur dossier (vérification des diplômes
            et de l&apos;éligibilité), les épreuves écrites (culture générale, matière spécifique, parfois langues), puis
            un entretien oral pour les candidats retenus. Les délais entre l&apos;ouverture d&apos;un concours et la
            publication des résultats définitifs varient de 2 à 6 mois selon l&apos;organisme.
          </p>
          <p>
            Pour candidater, préparez un dossier complet : CV à jour, copie de la CIN, copies certifiées conformes des
            diplômes, lettre de motivation, et tout document spécifique demandé dans l&apos;avis (certificat médical,
            extrait de casier judiciaire, etc.). Un dossier incomplet ou déposé hors délai est automatiquement écarté —
            vérifiez toujours les conditions sur le site officiel de l&apos;organisme avant de postuler.
          </p>
          <p>
            InteractJob recense quotidiennement l&apos;ensemble des concours publics au Maroc à partir des sources
            officielles. Consultez notre <Link href={"/concours/guide-candidat" as any} className="text-primary font-semibold hover:underline">guide du candidat</Link> pour
            des conseils détaillés, et utilisez nos outils gratuits pour optimiser votre CV avant de soumettre votre
            dossier.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <h2 className="text-lg font-bold text-gray-900 mb-4">Questions fréquentes</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{item.q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Expired */}
      {expired.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            Concours clôturés ({expired.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {expired.map(c => (
              <Link
                key={c.id}
                href={`/concours/${c.slug}` as any}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-primary transition-all"
              >
                <p className="text-xs font-semibold text-primary mb-1">{c.organization_fr}</p>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{c.title_fr}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Source attribution */}
      <div className="mt-12 pt-6 border-t border-gray-100 text-xs text-gray-400">
        Sources : alwadifa-maroc.com — données mises à jour quotidiennement.
      </div>
    </div>
  );
}
