import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import { Concours } from "@/types";
import { buildFrArAlternates } from "@/lib/hreflang";
import { isExpired } from "@/lib/concours";
import ArchivesExplorer from "./ArchivesExplorer";

const allConcours = concoursData as Concours[];

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "أرشيف مباريات الوظيفة العمومية بالمغرب — المباريات المنتهية"
      : "Archives des Concours Fonction Publique Maroc — Concours Clôturés",
    description: isAr
      ? "أرشيف كامل لمباريات توظيف الوظيفة العمومية المغربية المنتهية: الوزارات، الجماعات الترابية، المؤسسات العمومية."
      : "Historique complet des concours de recrutement de la fonction publique marocaine déjà clôturés : ministères, collectivités, établissements publics.",
    alternates: buildFrArAlternates("/concours/archives"),
    keywords: isAr
      ? ["أرشيف مباريات الوظيفة العمومية المغرب", "مباريات منتهية المغرب"]
      : ["archives concours fonction publique maroc", "concours clôturés maroc", "historique concours administration"],
    robots: { index: locale !== "en", follow: true },
  };
}

export default async function ConcoursArchivesPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const t = await getTranslations("concours");

  const expired = allConcours
    .filter((c) => isExpired(c.deadline))
    .sort((a, b) => new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">{t("breadcrumbHome")}</Link>
        <span>/</span>
        <Link href="/concours" className="hover:text-primary">{t("breadcrumbConcours")}</Link>
        <span>/</span>
        <span className="text-gray-600">{t("breadcrumbArchives")}</span>
      </nav>

      <div className="mb-8">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">{t("badge")}</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{t("archivesTitle")}</h1>
        <p className="text-gray-500 mt-2">
          {t("archivesCount", { count: expired.length })}
        </p>
        <Link href="/concours" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-3">
          {t("backToActive")}
        </Link>
      </div>

      <ArchivesExplorer expired={expired} locale={locale} />
    </div>
  );
}
