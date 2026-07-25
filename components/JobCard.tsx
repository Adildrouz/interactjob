"use client";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { MapPin, ArrowRight } from "lucide-react";
import { Job } from "@/types";
import { sectorLabel } from "@/lib/morocco";
import { CARD_SHAPE, CHIP_SHAPE_SM, BTN_SHAPE_SM, DISPLAY } from "@/lib/design";

/* Contract type → brand-family badge. Coral is reserved for urgency, so
   contracts use navy / turquoise / sun instead. */
const contractBadge: Record<Job["contractType"], string> = {
  CDI: "bg-navy-50 text-navy-700 border-navy-100",
  CDD: "bg-sun-100 text-navy-800 border-sun-100",
  Stage: "bg-tq-50 text-tq-800 border-tq-200",
};

export default function JobCard({ job }: { job: Job }) {
  const t = useTranslations("common");
  const locale = useLocale();

  function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return t("today");
    if (diff === 1) return t("yesterday");
    if (diff < 7) return t("daysAgo", { days: diff });
    if (diff < 30) return t("weeksAgo", { weeks: Math.floor(diff / 7) });
    return t("monthsAgo", { months: Math.floor(diff / 30) });
  }

  const sectorText = job.sector ? sectorLabel(job.sector, locale) : null;

  return (
    <div
      className={`group bg-white ${CARD_SHAPE} p-5 border transition-[box-shadow,border-color,transform] duration-200 hover:shadow-[0_24px_50px_-24px_rgba(0,52,122,0.35)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 relative flex flex-col gap-0 ${
        job.sponsored
          ? "border-tq-400 shadow-sm"
          : "border-navy-100 hover:border-navy-200"
      }`}
    >
      {/* Sponsored badge — premium, not urgency; turquoise not coral */}
      {job.sponsored && (
        <div className="absolute -top-2.5 left-4 rtl:left-auto rtl:right-4">
          <span className="bg-tq-500 text-navy-950 text-xs font-bold px-3 py-0.5 rounded-full shadow-sm">
            {t("sponsored")}
          </span>
        </div>
      )}

      {/* Top: logo + title */}
      <div className="flex items-start gap-4 pt-2">
        <div
          className="w-12 h-12 rounded-[13px] rounded-br-[3px] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm ring-2 ring-white"
          style={{ backgroundColor: job.companyColor }}
        >
          {job.companyInitials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Stretched link — whole card clickable without nesting links */}
          <Link href={`/offres/${(job as { slug?: string }).slug || job.id}`} className="after:absolute after:inset-0 after:content-['']">
            <h3 className={`${DISPLAY} font-bold text-navy-900 group-hover:text-tq-700 transition-colors leading-snug line-clamp-2 text-[15px]`}>
              {job.title}
            </h3>
          </Link>
          <p className="text-sm text-navy-500 mt-0.5 truncate">{job.company}</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className={`text-xs font-bold px-2.5 py-1 ${CHIP_SHAPE_SM} border ${contractBadge[job.contractType]}`}>
          {job.contractType}
        </span>

        <span className={`text-xs text-navy-600 flex items-center gap-1 bg-navy-50 px-2.5 py-1 ${CHIP_SHAPE_SM} border border-navy-100`}>
          <MapPin size={13} className="text-navy-400" />
          {job.city}
        </span>

        {sectorText && (
          <span className={`text-xs text-navy-500 bg-navy-50 px-2.5 py-1 ${CHIP_SHAPE_SM} border border-navy-100`}>
            {sectorText}
          </span>
        )}
      </div>

      {/* Salary (if available) */}
      {job.salary && (
        <div className="mt-3">
          <span className={`text-xs font-bold text-tq-800 bg-tq-50 px-2.5 py-1 ${CHIP_SHAPE_SM}`}>
            {job.salary}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-navy-50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-navy-300">{t("via")}</span>
          <span className="text-xs font-medium text-navy-400 truncate">{job.source}</span>
          <span className="text-navy-200">·</span>
          <span className="text-xs text-navy-400 whitespace-nowrap">{timeAgo(job.postedAt)}</span>
        </div>
        <Link
          href={`/offres/${(job as { slug?: string }).slug || job.id}`}
          className={`relative z-10 inline-flex items-center gap-1 text-xs font-bold text-white bg-navy-700 hover:bg-navy-800 px-3.5 py-1.5 ${BTN_SHAPE_SM} transition-colors`}
        >
          {t("apply")} <ArrowRight size={13} className="rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
