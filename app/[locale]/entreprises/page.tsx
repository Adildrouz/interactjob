import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { connectDB } from "@/lib/db";
import { EmployerHub, type IEmployerHub } from "@/lib/models/EmployerHub";

export const revalidate = 3600;

const BASE_URL = "https://www.interactjob.ma";

async function getEmployers(): Promise<IEmployerHub[]> {
  await connectDB();
  const docs = await EmployerHub.find({ is_active: true }).sort({ name: 1 }).lean();
  return docs as unknown as IEmployerHub[];
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  const canonical = locale === "fr" ? `${BASE_URL}/entreprises` : `${BASE_URL}/${locale}/entreprises`;

  const title = isAr
    ? "دليل التوظيف حسب الشركة والمؤسسة | InteractJob"
    : "Guides de recrutement par entreprise | InteractJob";
  const description = isAr
    ? "عروض الشغل والأدلة العملية للتقديم والتسجيل لدى أكبر الشركات والمؤسسات في المغرب."
    : "Offres d'emploi, guides de candidature et d'inscription pour les plus grands employeurs et institutions au Maroc.";

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: { fr: `${BASE_URL}/entreprises`, en: `${BASE_URL}/en/entreprises`, ar: `${BASE_URL}/ar/entreprises` },
    },
  };
}

export default async function EntreprisesIndexPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const employers = await getEmployers();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={isAr ? "rtl" : "ltr"}>
      <nav className={`flex items-center gap-2 text-sm text-gray-400 mb-6 ${isAr ? "flex-row-reverse justify-end" : ""}`}>
        <Link href="/" className="hover:text-primary">{isAr ? "الرئيسية" : "Accueil"}</Link>
        <span>/</span>
        <span className="text-gray-600">{isAr ? "الشركات والمؤسسات" : "Entreprises"}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isAr ? "دليل التوظيف حسب الشركة والمؤسسة" : "Guides de recrutement par entreprise"}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {isAr
          ? "عروض الشغل والأدلة العملية للتقديم والتسجيل لدى أكبر الشركات والمؤسسات في المغرب."
          : "Offres d'emploi, guides de candidature et d'inscription pour les plus grands employeurs et institutions au Maroc."}
      </p>

      {employers.length === 0 ? (
        <p className="text-sm text-gray-400">{isAr ? "لا توجد صفحات متاحة حاليا." : "Aucune page disponible pour le moment."}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {employers.map((e) => (
            <Link
              key={e.slug}
              href={`/entreprises/${e.slug}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-primary transition-all"
            >
              <p className="font-bold text-gray-900">{isAr ? e.name_ar : e.name}</p>
              <p className="text-xs text-gray-400 mt-1">{e.sector}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
