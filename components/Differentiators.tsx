import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  ArrowRight, Compass, BrainCircuit, Route, Scale, Sparkles, Handshake,
} from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { CARD_SHAPE, DISPLAY, STAR_TILE } from "@/lib/design";

/**
 * Real competitive advantages over Rekrute / Emploi.ma / JobSquare —
 * none of which offer these. v2 direction: light canvas, brand accents,
 * signature cut-corner cards, star filigrane, and a deliberately uneven
 * grid (the free-forever promise spans wide) instead of N identical
 * soft-shadow cards.
 */
const CARDS = [
  { icon: Compass,      accent: "navy" },
  { icon: BrainCircuit, accent: "tq"   },
  { icon: Route,        accent: "navy" },
  { icon: Scale,        accent: "tq"   },
] as const;

export default async function Differentiators() {
  const t = await getTranslations("diff");
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <section
      className="relative overflow-hidden bg-navy-50/40 border-y border-navy-100"
      style={{ backgroundImage: STAR_TILE }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeading
          index="02"
          kicker={t("kicker")}
          title={t("title")}
        />
        <p className={`text-navy-500 mt-2 mb-10 ${isAr ? "text-right" : ""}`}>{t("subtitle")}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {CARDS.map(({ icon: Icon, accent }, i) => (
            <div
              key={i}
              className={`${CARD_SHAPE} border border-navy-100 bg-white p-6 transition-[border-color,box-shadow] duration-300 hover:border-navy-200 hover:shadow-[0_20px_44px_-26px_rgba(0,52,122,0.35)]`}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: accent === "tq" ? "#EAFCFD" : "#EFF5FC" }}
                aria-hidden
              >
                <Icon size={20} className={accent === "tq" ? "text-tq-700" : "text-navy-700"} />
              </div>
              <h3 className={`${DISPLAY} font-bold text-navy-900 mb-1.5`}>{t(`c${i}t` as "c0t")}</h3>
              <p className="text-sm text-navy-600 leading-relaxed">{t(`c${i}b` as "c0b")}</p>
            </div>
          ))}

          {/* the promise that anchors the whole strategy — given real weight */}
          <div className={`sm:col-span-2 ${CARD_SHAPE} border-2 border-tq-500 bg-white p-6 relative overflow-hidden`}>
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(60% 120% at 100% 0%, #EAFCFD, transparent 70%)" }}
            />
            <div className="relative flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tq-500" aria-hidden>
                <Sparkles size={20} className="text-navy-950" />
              </div>
              <div>
                <h3 className={`${DISPLAY} text-lg font-bold text-navy-900 mb-1.5`}>{t("c4t")}</h3>
                <p className="text-sm text-navy-600 leading-relaxed max-w-xl">{t("c4b")}</p>
              </div>
            </div>
          </div>

          {/* recruiter inbound entry — dashed, deliberately not another card */}
          <Link
            href={"/recruteurs" as "/offres"}
            className={`group flex flex-col justify-center ${CARD_SHAPE} border-2 border-dashed border-navy-200 p-6 hover:border-navy-500 hover:bg-white transition-colors`}
          >
            <Handshake size={22} className="text-navy-600 mb-3" aria-hidden />
            <span className={`${DISPLAY} font-bold text-navy-800 inline-flex items-center gap-1.5`}>
              {t("recruiterCta")}
              <ArrowRight
                size={16}
                className={`transition-transform ${isAr ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`}
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
