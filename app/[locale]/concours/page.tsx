import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Landmark, GraduationCap, Stethoscope, Building2, Scale, Building, ArrowRight, FileCheck2, Bot, ClipboardList } from "lucide-react";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";
import { buildFrOnlyAlternates } from "@/lib/hreflang";
import { formatDate, isExpired, inferConcoursSector, inferRegion, hasResults } from "@/lib/concours";
import { INSTITUTION_STYLE, type InstitutionType } from "@/lib/concours-institution";
import ConcoursExplorer, { type EnrichedConcours } from "./ConcoursExplorer";
import ConcoursAlertForm from "@/components/ConcoursAlertForm";
import SectionHeading from "@/components/SectionHeading";
import TrackedLink from "@/components/TrackedLink";
import { BTN_SHAPE, BTN_SHAPE_SM, CARD_SHAPE, CHIP_SHAPE, DISPLAY, STAR_TILE_LIGHT } from "@/lib/design";

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

/* The crest colour system, surfaced as a legend — the recurring brand motif. */
const LEGEND_TYPES: { type: InstitutionType; icon: typeof Landmark }[] = [
  { type: "ministere", icon: Landmark },
  { type: "universite", icon: GraduationCap },
  { type: "sante", icon: Stethoscope },
  { type: "collectivite", icon: Building2 },
  { type: "justice", icon: Scale },
  { type: "etablissement", icon: Building },
];

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

const RECENT_CLOSED_COUNT = 15;

export default function ConcoursPage() {
  const active  = allConcours.filter(c => !isExpired(c.deadline));
  const expired = allConcours
    .filter(c => isExpired(c.deadline))
    .sort((a, b) => new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime());
  const recentClosed = expired.slice(0, RECENT_CLOSED_COUNT);

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

  const totalPostes = allConcours.reduce((sum, c) => sum + (c.postes || 0), 0);
  const closingSoon = enrichedActive.filter(c => {
    if (!c.deadline) return false;
    const diff = (new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  return (
    <div className="bg-white">
      {/* ── Header with soft brand glow + star filigrane ── */}
      <div className="relative overflow-hidden border-b border-navy-100">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(720px 320px at 20% -20%, rgba(0,194,203,0.10), transparent 60%)" }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <SectionHeading index="◆" kicker="fonction publique" title="Concours de recrutement au Maroc" />
          <p className="text-navy-500 mt-2">
            {active.length} concours actifs · {isFreshToday ? "Mis à jour aujourd'hui" : `Mis à jour le ${formatDate(latestPosted)}`}
          </p>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <Link href="/concours/cspj-2026" className={`text-xs bg-navy-50 text-navy-700 px-3 py-1.5 ${CHIP_SHAPE} font-bold hover:bg-navy-100 transition-colors`}>
              Résultats CSPJ 2026
            </Link>
            <Link href="/concours/ministere-interieur" className={`text-xs bg-navy-50 text-navy-700 px-3 py-1.5 ${CHIP_SHAPE} font-bold hover:bg-navy-100 transition-colors`}>
              Concours Ministère Intérieur
            </Link>
            <Link href={"/concours/guide-candidat" as "/concours"} className={`text-xs bg-tq-50 text-tq-800 px-3 py-1.5 ${CHIP_SHAPE} font-bold hover:bg-tq-100 transition-colors`}>
              📖 Guide du candidat
            </Link>
            <Link href="/offres" className={`inline-flex items-center gap-1 text-xs bg-white border border-navy-200 text-navy-600 px-3 py-1.5 ${CHIP_SHAPE} font-bold hover:border-navy-400 transition-colors`}>
              Offres secteur privé <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Stats — editorial strip, urgency in coral ── */}
        <div className="flex flex-wrap items-stretch gap-y-5 border-b border-navy-100 pb-7 mb-8">
          <div className="flex-1 min-w-[30%] px-2 sm:px-6">
            <p className={`${DISPLAY} text-3xl font-bold text-navy-700 tabular-nums`}>{active.length}</p>
            <p className="mt-1 text-sm text-navy-500">Concours actifs</p>
          </div>
          <div className="flex-1 min-w-[30%] px-2 sm:px-6 sm:border-l sm:border-navy-100 rtl:sm:border-l-0 rtl:sm:border-r">
            <p className={`${DISPLAY} text-3xl font-bold text-navy-700 tabular-nums`}>{totalPostes}</p>
            <p className="mt-1 text-sm text-navy-500">Postes à pourvoir</p>
          </div>
          <div className="flex-1 min-w-[30%] px-2 sm:px-6 sm:border-l sm:border-navy-100 rtl:sm:border-l-0 rtl:sm:border-r">
            <p className={`${DISPLAY} text-3xl font-bold text-coral-500 tabular-nums`}>{closingSoon}</p>
            <p className="mt-1 text-sm text-navy-500">Clôture imminente (7j)</p>
          </div>
        </div>

        {/* ── Institution-type legend: the crest colour system as a motif ── */}
        <div className={`mb-10 ${CARD_SHAPE} border border-navy-100 bg-navy-50/40 p-5`} style={{ backgroundImage: STAR_TILE_LIGHT }}>
          <p className="text-xs font-medium text-navy-500 mb-3">Chaque concours est identifié par son type d&apos;institution</p>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {LEGEND_TYPES.map(({ type, icon: Icon }) => {
              const s = INSTITUTION_STYLE[type];
              return (
                <span key={type} className="inline-flex items-center gap-2">
                  <span
                    className="relative grid h-8 w-8 place-items-center rounded-[10px] rounded-br-[2px] text-white"
                    style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accentDark})` }}
                    aria-hidden
                  >
                    <Icon size={16} />
                  </span>
                  <span className="text-xs font-semibold text-navy-700">{s.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Préparez votre candidature — the one sanctioned dark band (Atlas) ── */}
        <section className={`mb-10 ${CARD_SHAPE} relative overflow-hidden p-6`} style={{ background: "var(--gradient-atlas)" }}>
          <div aria-hidden className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: STAR_TILE_LIGHT }} />
          <div className="relative">
            <h2 className={`${DISPLAY} text-lg font-bold text-white mb-2`}>Préparez votre candidature</h2>
            <p className="text-navy-100 text-sm leading-relaxed mb-4 max-w-2xl">
              Maximisez vos chances de réussite. Un CV optimisé, une lettre de motivation percutante
              et un dossier complet font toute la différence lors de la présélection.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <TrackedLink
                href={"/cv-checker" as "/cv-checker"}
                event="concours_cta_click"
                eventParams={{ cta: "cv_checker", page: "listing" }}
                className={`inline-flex items-center justify-center gap-2 bg-white text-navy-700 font-bold px-5 py-2.5 ${BTN_SHAPE_SM} text-sm hover:bg-navy-50 transition-colors`}
              >
                <FileCheck2 size={16} /> Vérifiez votre CV gratuitement
              </TrackedLink>
              <TrackedLink
                href={"/generateur-cv" as "/generateur-cv"}
                event="concours_cta_click"
                eventParams={{ cta: "generateur_cv", page: "listing" }}
                className={`inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-5 py-2.5 ${BTN_SHAPE_SM} text-sm border border-white/25 transition-colors`}
              >
                <Bot size={16} /> Créer mon CV IA — 5€
              </TrackedLink>
              <TrackedLink
                href={"/postuler" as "/postuler"}
                event="concours_cta_click"
                eventParams={{ cta: "postuler", page: "listing" }}
                className={`inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-5 py-2.5 ${BTN_SHAPE_SM} text-sm border border-white/25 transition-colors`}
              >
                <ClipboardList size={16} /> Candidature spontanée
              </TrackedLink>
            </div>
          </div>
        </section>

        {/* Alertes concours */}
        <section className="mb-10">
          <ConcoursAlertForm />
        </section>

        {/* Interactive filter bar + closing-soon + results */}
        <ConcoursExplorer active={enrichedActive} />

        {/* Private sector CTA */}
        {privateJobs.length > 0 && (
          <section className={`mb-12 ${CARD_SHAPE} border border-navy-100 bg-navy-50/40 p-6`}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <SectionHeading index="05" kicker="secteur privé" title="Après le concours, trouvez un emploi dans le privé" />
              <Link href="/offres" className="flex-shrink-0 mt-1 text-xs font-bold text-navy-700 hover:text-tq-700 whitespace-nowrap inline-flex items-center gap-1">
                Voir toutes les offres <ArrowRight size={12} />
              </Link>
            </div>
            <p className="text-sm text-navy-500 -mt-3 mb-5">Ne misez pas tout sur un seul concours — le secteur privé recrute aussi.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {privateJobs.map(j => (
                <Link
                  key={j.id}
                  href={`/offres/${j.slug}`}
                  className={`bg-white ${CHIP_SHAPE} border border-navy-100 p-4 hover:shadow-md hover:border-navy-300 transition-all`}
                >
                  <p className="text-xs font-bold text-tq-700 mb-1">{j.company}</p>
                  <p className={`${DISPLAY} text-sm font-bold text-navy-900 line-clamp-2 leading-snug`}>{j.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-navy-400">{j.city}</span>
                    <span className="text-navy-200">·</span>
                    <span className="text-xs bg-navy-50 text-navy-500 px-2 py-0.5 rounded-full">{j.contractType}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/offres" className={`inline-flex items-center gap-2 bg-navy-700 text-white px-5 py-2.5 ${BTN_SHAPE_SM} text-sm font-bold hover:bg-navy-800 transition-colors`}>
                Toutes les offres d&apos;emploi
              </Link>
              <Link href="/postuler" className={`inline-flex items-center gap-2 bg-white text-navy-700 border-2 border-navy-200 px-5 py-2.5 ${BTN_SHAPE_SM} text-sm font-bold hover:border-navy-400 transition-colors`}>
                Déposer mon CV
              </Link>
            </div>
          </section>
        )}

        {/* Intro (SEO + LLM) */}
        <section className="mb-12">
          <h2 className={`${DISPLAY} text-lg font-bold text-navy-900 mb-3`}>
            Comment fonctionnent les concours de la fonction publique au Maroc
          </h2>
          <div className="space-y-3 text-sm text-navy-700 leading-relaxed">
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
              officielles. Consultez notre <Link href={"/concours/guide-candidat" as "/concours"} className="text-tq-700 font-semibold hover:underline">guide du candidat</Link> pour
              des conseils détaillés, et utilisez nos outils gratuits pour optimiser votre CV avant de soumettre votre
              dossier.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
          <h2 className={`${DISPLAY} text-lg font-bold text-navy-900 mb-4`}>Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className={`bg-white ${CHIP_SHAPE} border border-navy-100 p-5`}>
                <h3 className="text-sm font-bold text-navy-900 mb-1.5">{item.q}</h3>
                <p className="text-sm text-navy-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Expired */}
        {expired.length > 0 && (
          <section>
            <h2 className={`${DISPLAY} text-lg font-bold text-navy-400 mb-4 flex items-center gap-2`}>
              <span className="w-2 h-2 rounded-full bg-navy-200 inline-block" />
              Concours clôturés ({expired.length})
            </h2>
            <div className="space-y-3 opacity-70">
              {recentClosed.map(c => (
                <Link
                  key={c.id}
                  href={`/concours/${c.slug}` as "/concours"}
                  className={`block bg-white ${CHIP_SHAPE} border border-navy-100 p-4 hover:shadow-md hover:border-navy-300 transition-all`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-navy-500">{c.organization_fr}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-500">Dépôt clos</span>
                    {hasResults(c) && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-light text-success">Résultats disponibles</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-navy-900 text-sm leading-snug line-clamp-2">{c.title_fr}</h3>
                </Link>
              ))}
            </div>
            {expired.length > RECENT_CLOSED_COUNT && (
              <Link
                href={"/concours/archives" as "/concours"}
                className={`mt-4 block w-full text-center text-sm font-bold text-navy-700 bg-white border-2 border-navy-200 ${BTN_SHAPE_SM} py-3 hover:border-navy-400 transition-colors`}
              >
                Voir toutes les archives ({expired.length})
              </Link>
            )}
          </section>
        )}

        {/* Source attribution */}
        <div className="mt-12 pt-6 border-t border-navy-100 text-xs text-navy-400">
          Sources : plateformes d&apos;emploi public marocaines. Vérifiez toujours l&apos;annonce officielle sur le
          portail de l&apos;organisme concerné.
        </div>
      </div>
    </div>
  );
}
