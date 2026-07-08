"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Concours } from "@/types";
import { formatDate, localizedTitle, localizedOrganization } from "@/lib/concours";

const PAGE_SIZE = 20;

export default function ArchivesExplorer({ expired, locale }: { expired: Concours[]; locale: string }) {
  const t = useTranslations("concours");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return expired;
    return expired.filter((c) => `${c.organization_fr} ${c.title_fr} ${c.organization_ar} ${c.title_ar}`.toLowerCase().includes(q));
  }, [expired, query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
        placeholder={t("archivesSearchPlaceholder")}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-6"
      />

      {filtered.length === 0 && (
        <p className="text-gray-400 text-sm">{t("archivesNoResults")}</p>
      )}

      <div className="space-y-3 opacity-60">
        {filtered.slice(0, visibleCount).map((c) => (
          <Link
            key={c.id}
            href={`/concours/${c.slug}` as any}
            className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-primary transition-all"
          >
            <p className="text-xs font-semibold text-primary mb-1">{localizedOrganization(c, locale)}</p>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{localizedTitle(c, locale)}</h3>
            {c.deadline && (
              <p className="text-xs text-gray-400 mt-2">{t("closedOn", { date: formatDate(c.deadline, locale) })}</p>
            )}
          </Link>
        ))}
      </div>

      {filtered.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className="mt-4 w-full text-center text-sm font-semibold text-primary bg-white border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors opacity-100"
        >
          {t("archivesShowMore", { count: filtered.length - visibleCount })}
        </button>
      )}
    </div>
  );
}
