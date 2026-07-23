import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

/* Faint five-point star tile — the brand's institutional motif */
const STAR_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cpath d='M64 54l1.7 3.65 3.85.45-2.9 2.85.75 4.05-3.4-1.95-3.4 1.95.75-4.05-2.9-2.85 3.85-.45z' fill='%2300347A' fill-opacity='0.05'/%3E%3C/svg%3E\")";

const ICONS = ["🧭", "🧠", "📍", "⚖️", "🆓"];

/**
 * Real competitive advantages over Rekrute / Emploi.ma / JobSquare —
 * none of which offer these. Light canvas, navy/turquoise brand accents.
 */
export default async function Differentiators() {
  const t = await getTranslations("diff");
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <section
      className="relative overflow-hidden bg-white border-y border-gray-100"
      style={{ backgroundImage: STAR_TILE }}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className={`mb-10 ${isAr ? "text-right" : ""}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#00347A]">{t("title")}</h2>
          <p className="text-gray-500 mt-2">{t("subtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`relative bg-white rounded-2xl border p-6 shadow-sm ${
                i === 4 ? "border-[#00C2CB] ring-1 ring-[#00C2CB]/30" : "border-gray-200"
              }`}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ background: i % 2 ? "#EAFCFD" : "#EFF5FC" }}
                aria-hidden
              >
                {ICONS[i]}
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{t(`c${i}t` as "c0t")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t(`c${i}b` as "c0b")}</p>
              {i === 4 && (
                <span className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-[10px] font-bold uppercase tracking-wide text-[#008E96] bg-[#EAFCFD] px-2 py-0.5 rounded-full">
                  ✓
                </span>
              )}
            </div>
          ))}

          {/* recruiter inbound entry point, woven into the grid */}
          <Link
            href={"/recruteurs" as any}
            className="flex flex-col items-start justify-center rounded-2xl border-2 border-dashed border-[#00347A]/30 p-6 hover:border-[#00347A] hover:bg-[#EFF5FC]/50 transition-colors group"
          >
            <span className="text-xl mb-3" aria-hidden>🤝</span>
            <span className="font-bold text-[#00347A] group-hover:underline">
              {t("recruiterCta")} →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
