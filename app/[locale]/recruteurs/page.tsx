import type { Metadata } from "next";
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

      <RecruiterLeadForm />

      <p className="text-center text-xs text-gray-400 mt-6">{t("footnote")}</p>
    </div>
  );
}
