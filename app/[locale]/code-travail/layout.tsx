import type { Metadata } from "next";

const BASE_URL = "https://www.interactjob.ma";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  const title = isAr
    ? "مدونة الشغل المغربية — 70 فصلاً + حاسبة التعويضات | InteractJob"
    : "Code du Travail Maroc — 70 Articles + Calculateur d'Indemnités | InteractJob";

  const description = isAr
    ? "مدونة الشغل المغربية كاملة (القانون 65.99) : 70 فصلاً مشروحة بلغة بسيطة، حاسبة تعويضات الفصل والتقاعد، أسئلة شائعة قانونية. ابحث بالموضوع أو الكلمة المفتاحية."
    : "Code du Travail Maroc (Loi 65-99) : 70 articles expliqués, calculateur d'indemnités de licenciement/retraite, FAQ juridiques. Recherchez par thème ou mot-clé.";

  const keywords = isAr
    ? ["مدونة الشغل المغرب", "قانون الشغل المغرب", "تعويض الفصل المغرب", "SMIG المغرب", "العطل المؤدى عنها", "الإخطار المسبق", "القانون 65.99", "حساب تعويض الفصل"]
    : ["code du travail maroc", "droit du travail maroc", "indemnité licenciement maroc", "calculateur indemnité", "SMIG maroc", "préavis maroc", "loi 65-99"];

  const canonical = locale === "fr"
    ? `${BASE_URL}/code-travail`
    : `${BASE_URL}/${locale}/code-travail`;

  const ogTitle = isAr
    ? "مدونة الشغل المغربية + حاسبة التعويضات | InteractJob"
    : "Code du Travail Maroc + Calculateur d'Indemnités | InteractJob";
  const ogDesc = isAr
    ? "70 فصلاً من مدونة الشغل مشروحة + حاسبة تعويضات الفصل والتقاعد — مجاني على InteractJob"
    : "70 articles du Code du Travail expliqués + calculateur d'indemnités de licenciement et retraite — gratuit sur InteractJob";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      type: "website",
      siteName: "InteractJob",
      locale: isAr ? "ar_MA" : "fr_MA",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
    },
    alternates: {
      canonical,
      languages: {
        fr: `${BASE_URL}/code-travail`,
        ar: `${BASE_URL}/ar/code-travail`,
      },
    },
  };
}

export default function CodeTravailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
