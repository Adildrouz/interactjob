import type { Metadata } from "next";

const BASE_URL = "https://www.interactjob.ma";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  const title = isAr
    ? "مدونة الشغل المغربية – الفصول والحقوق | InteractJob"
    : "Code du travail marocain – Articles & Droits | InteractJob";

  const description = isAr
    ? "اطلع على الفصول الأساسية من مدونة الشغل المغربية (القانون رقم 65.99): الفصل، SMIG، العطل، الإخطار، الأمومة، النقابات. ابحث بالموضوع أو الكلمة المفتاحية."
    : "Consultez les articles clés du Code du travail du Maroc (Loi n° 65-99) : licenciement, SMIG, congés, préavis, maternité, syndicats. Recherchez par thème ou mot-clé.";

  const keywords = isAr
    ? ["مدونة الشغل المغرب", "قانون الشغل المغرب", "الفصل المغرب", "SMIG المغرب", "العطل المؤدى عنها", "الإخطار المسبق", "القانون 65.99"]
    : ["code du travail maroc", "droit du travail maroc", "licenciement maroc", "SMIG maroc", "congés payés maroc", "préavis maroc", "loi 65-99"];

  const canonical = locale === "fr"
    ? `${BASE_URL}/code-travail`
    : `${BASE_URL}/${locale}/code-travail`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: isAr ? "مدونة الشغل المغربية | InteractJob" : "Code du travail marocain | InteractJob",
      description: isAr
        ? "جميع الفصول الأساسية من مدونة الشغل المغربية مشروحة بشكل مبسط."
        : "Tous les articles clés du Code du travail du Maroc expliqués simplement.",
      url: canonical,
      type: "website",
      siteName: "InteractJob",
      locale: isAr ? "ar_MA" : "fr_MA",
    },
    alternates: {
      canonical,
      languages: {
        fr: `${BASE_URL}/code-travail`,
        en: `${BASE_URL}/en/code-travail`,
        ar: `${BASE_URL}/ar/code-travail`,
      },
    },
  };
}

export default function CodeTravailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
