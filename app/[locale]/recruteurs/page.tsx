import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import RecruiterLeadForm from "@/components/RecruiterLeadForm";
import { buildAlternates } from "@/lib/hreflang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("recruteurs");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/recruteurs"),
  };
}

export default async function RecruteursPage() {
  const t = await getTranslations("recruteurs");
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t("title")}</h1>
        <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">{t("subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10 text-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800">{t(`benefit${i}Title`)}</p>
            <p className="text-xs text-gray-500 mt-1">{t(`benefit${i}Body`)}</p>
          </div>
        ))}
      </div>

      {/* Self-serve — primary path: free posting is live, no need to wait on manual outreach */}
      <div className="text-center mb-10">
        <Link
          href="/employeur/inscription"
          className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3.5 rounded-xl transition"
        >
          {t("selfServeCta")}
        </Link>
        <p className="text-xs text-gray-400 mt-3">{t("selfServeNote")}</p>
      </div>

      <div className="flex items-center gap-4 mb-10 text-gray-300 text-sm">
        <div className="flex-1 h-px bg-gray-200" />
        {t("orDivider")}
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Manual path — kept as an alternative for employers who'd rather not self-serve */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t("manualTitle")}</h2>
        <p className="text-gray-600 text-sm max-w-xl mx-auto leading-relaxed">{t("manualSubtitle")}</p>
      </div>

      <RecruiterLeadForm />

      <p className="text-center text-xs text-gray-400 mt-6">{t("footnote")}</p>
    </div>
  );
}
