import type { Metadata } from "next";
import { Link } from "@/i18n/routing";

const BASE_URL = "https://www.interactjob.ma";
const EMAIL = "contact@interactjob.ma";
const LAST_UPDATE = "7 juin 2026";

type Locale = "fr" | "en" | "ar";

const META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title: "Charte éditoriale | InteractJob",
    description:
      "Comment InteractJob sélectionne, vérifie et enrichit ses offres d'emploi, et produit ses contenus éditoriaux RH. Notre méthode et nos standards de qualité.",
  },
  en: {
    title: "Editorial Policy | InteractJob",
    description:
      "How InteractJob sources, verifies and enriches its job listings, and produces its HR editorial content. Our method and quality standards.",
  },
  ar: {
    title: "الميثاق التحريري | InteractJob",
    description:
      "كيف ينتقي InteractJob عروض الشغل ويتحقّق منها ويُغنيها، وكيف يُنتج محتواه التحريري في الموارد البشرية. منهجيتنا ومعاييرنا.",
  },
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const l = (["fr", "en", "ar"].includes(locale) ? locale : "fr") as Locale;
  const canonical = `${BASE_URL}/charte-editoriale`;
  return {
    title: META[l].title,
    description: META[l].description,
    robots: l === "fr" ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical,
      languages: {
        fr: canonical,
        en: `${BASE_URL}/en/charte-editoriale`,
        ar: `${BASE_URL}/ar/charte-editoriale`,
        "x-default": canonical,
      },
    },
  };
}

type Section = { h: string; p?: string[]; ul?: string[] };

const CONTENT: Record<Locale, { eyebrow: string; title: string; updated: string; intro: string; sections: Section[]; back: string }> = {
  fr: {
    eyebrow: "Notre méthode",
    title: "Charte éditoriale",
    updated: `Dernière mise à jour : ${LAST_UPDATE}`,
    intro:
      "InteractJob.ma n'est pas un simple agrégateur. Chaque offre publiée et chaque article fait l'objet d'un travail éditorial humain : sélection, vérification, mise en contexte et analyse RH originale. Cette charte explique précisément comment nous produisons notre contenu et les standards de qualité que nous nous imposons, dans l'intérêt des candidats marocains.",
    sections: [
      {
        h: "1. Qui produit le contenu",
        p: [
          "Le contenu éditorial d'InteractJob est dirigé par Adil Drouz, consultant en ressources humaines disposant de plusieurs années d'expérience sur le marché de l'emploi marocain, assisté par l'équipe InteractJob. Nos articles de fond sont signés, datés et attribués à un auteur identifiable.",
          "Notre mission : aider chaque candidat marocain à trouver un emploi pertinent et à présenter sa candidature de la meilleure façon possible, avec une information fiable et des conseils concrets.",
        ],
      },
      {
        h: "2. Comment nous sélectionnons les offres",
        p: ["Les offres diffusées sur InteractJob proviennent de plusieurs canaux :"],
        ul: [
          "Offres soumises directement par les recruteurs via notre formulaire de publication ;",
          "Offres repérées sur des sources publiques (sites de recrutement, pages carrières d'entreprises, réseaux professionnels) ;",
          "Concours et recrutements publics annoncés par les administrations marocaines.",
        ],
      },
      {
        h: "3. Vérification et contrôle qualité",
        p: ["Avant publication ou mise en avant, nous appliquons un contrôle systématique :"],
        ul: [
          "Vérification de la cohérence de l'offre (intitulé, entreprise, ville, type de contrat) ;",
          "Suppression des doublons et des annonces manifestement frauduleuses ou trompeuses ;",
          "Datation de l'offre et fixation d'une date d'expiration ; les offres expirées sont retirées de l'index ;",
          "Normalisation des secteurs et des niveaux d'expérience pour faciliter la recherche.",
        ],
      },
      {
        h: "4. L'enrichissement éditorial : l'Analyse RH",
        p: [
          "C'est ce qui distingue InteractJob. Pour les offres, nous ajoutons une « Analyse RH InteractJob » : un texte original qui replace le poste dans le contexte du secteur et du marché marocain, décrit les missions réelles, le profil idéal, les perspectives de carrière et donne des conseils concrets pour candidater.",
          "Cette analyse est rédigée selon notre ligne éditoriale, relue pour sa pertinence, et n'est jamais une simple reformulation de l'annonce d'origine. Elle vise à apporter une valeur ajoutée réelle au candidat.",
        ],
      },
      {
        h: "5. Outils d'assistance à la rédaction",
        p: [
          "Pour produire à grande échelle des analyses de qualité, notre équipe s'appuie sur des outils d'assistance à la rédaction, encadrés par une supervision éditoriale humaine et nos standards de qualité. Aucun contenu n'est mis en ligne sans correspondre à notre ligne éditoriale et à notre exigence d'utilité pour le lecteur.",
        ],
      },
      {
        h: "6. Indépendance et transparence",
        p: [
          "Nos analyses RH sont indépendantes des recruteurs : une analyse n'est pas un argumentaire commercial. Lorsqu'une annonce est sponsorisée, elle est clairement identifiée comme telle. La publicité affichée sur le site (Google AdSense) est distincte du contenu éditorial et n'influence pas nos analyses.",
        ],
      },
      {
        h: "7. Corrections et signalements",
        p: [
          `Nous corrigeons rapidement toute erreur signalée. Si vous repérez une offre expirée, un lien cassé, une information inexacte ou un contenu inapproprié, écrivez-nous à ${EMAIL}. Nous traitons les signalements dans les meilleurs délais.`,
        ],
      },
      {
        h: "8. Respect de la vie privée et des droits",
        p: [
          "Le traitement des données des candidats est décrit dans notre Politique de Confidentialité, conforme à la loi marocaine 09-08. Nous respectons les droits de propriété intellectuelle : les marques et logos cités appartiennent à leurs titulaires.",
        ],
      },
    ],
    back: "Retour à l'accueil",
  },
  en: {
    eyebrow: "Our method",
    title: "Editorial Policy",
    updated: `Last updated: ${LAST_UPDATE}`,
    intro:
      "InteractJob.ma is not a plain aggregator. Every published listing and every article goes through human editorial work: selection, verification, contextualization and original HR analysis. This policy explains exactly how we produce our content and the quality standards we hold ourselves to, in the interest of Moroccan job seekers.",
    sections: [
      {
        h: "1. Who produces the content",
        p: [
          "InteractJob's editorial content is led by Adil Drouz, a human resources consultant with several years of experience in the Moroccan job market, supported by the InteractJob team. Our in-depth articles are signed, dated and attributed to an identifiable author.",
          "Our mission: to help every Moroccan candidate find a relevant job and present their application in the best possible way, with reliable information and concrete advice.",
        ],
      },
      {
        h: "2. How we select listings",
        p: ["Listings on InteractJob come from several channels:"],
        ul: [
          "Offers submitted directly by recruiters via our posting form;",
          "Offers found on public sources (recruitment sites, company career pages, professional networks);",
          "Public competitions and recruitment announced by Moroccan administrations.",
        ],
      },
      {
        h: "3. Verification and quality control",
        p: ["Before publication or promotion, we apply a systematic check:"],
        ul: [
          "Consistency check of the offer (title, company, city, contract type);",
          "Removal of duplicates and clearly fraudulent or misleading listings;",
          "Dating each offer and setting an expiry date; expired offers are removed from the index;",
          "Normalizing sectors and experience levels to ease search.",
        ],
      },
      {
        h: "4. Editorial enrichment: the HR Analysis",
        p: [
          "This is what sets InteractJob apart. For listings, we add an “InteractJob HR Analysis”: an original text that places the role within its sector and the Moroccan market, describes the real responsibilities, the ideal profile, career outlook, and concrete application advice.",
          "This analysis follows our editorial line, is reviewed for relevance, and is never a mere rewording of the original ad. It aims to bring real added value to the candidate.",
        ],
      },
      {
        h: "5. Writing-assistance tools",
        p: [
          "To produce quality analysis at scale, our team relies on writing-assistance tools, governed by human editorial oversight and our quality standards. No content goes live unless it matches our editorial line and our usefulness requirement for the reader.",
        ],
      },
      {
        h: "6. Independence and transparency",
        p: [
          "Our HR analyses are independent of recruiters: an analysis is not a sales pitch. When a listing is sponsored, it is clearly labeled as such. Advertising on the site (Google AdSense) is separate from editorial content and does not influence our analyses.",
        ],
      },
      {
        h: "7. Corrections and reports",
        p: [
          `We promptly correct any reported error. If you spot an expired offer, a broken link, inaccurate information or inappropriate content, email us at ${EMAIL}. We handle reports as quickly as possible.`,
        ],
      },
      {
        h: "8. Privacy and rights",
        p: [
          "Processing of candidate data is described in our Privacy Policy, compliant with Moroccan Law 09-08. We respect intellectual property rights: cited brands and logos belong to their owners.",
        ],
      },
    ],
    back: "Back to home",
  },
  ar: {
    eyebrow: "منهجيتنا",
    title: "الميثاق التحريري",
    updated: `آخر تحديث: ${LAST_UPDATE}`,
    intro:
      "InteractJob.ma ليس مجرّد مجمِّع. كل عرض يُنشَر وكل مقال يخضع لعمل تحريري بشري: انتقاء وتحقّق ووضع في السياق وتحليل أصلي في الموارد البشرية. يوضّح هذا الميثاق كيف نُنتج محتوانا والمعايير التي نلتزم بها لمصلحة الباحثين عن عمل بالمغرب.",
    sections: [
      {
        h: "1. من يُنتج المحتوى",
        p: [
          "يُشرف على المحتوى التحريري لـ InteractJob عادل دروز، مستشار في الموارد البشرية بخبرة سنوات في سوق الشغل المغربية، بمساندة فريق InteractJob. مقالاتنا المعمّقة موقّعة ومؤرّخة ومنسوبة إلى كاتب معروف.",
          "مهمتنا: مساعدة كل مرشّح مغربي على إيجاد عمل مناسب وتقديم ترشيحه بأفضل صورة، بمعلومات موثوقة ونصائح ملموسة.",
        ],
      },
      {
        h: "2. كيف ننتقي العروض",
        p: ["تأتي العروض على InteractJob من عدة قنوات:"],
        ul: [
          "عروض يرسلها الموظِّفون مباشرة عبر نموذج النشر؛",
          "عروض مرصودة من مصادر عمومية (مواقع التوظيف، صفحات الوظائف، الشبكات المهنية)؛",
          "المباريات والتوظيفات العمومية التي تعلنها الإدارات المغربية.",
        ],
      },
      {
        h: "3. التحقّق ومراقبة الجودة",
        p: ["قبل النشر أو الإبراز، نطبّق مراقبة منهجية:"],
        ul: [
          "التحقّق من تناسق العرض (المسمى، الشركة، المدينة، نوع العقد)؛",
          "حذف التكرارات والإعلانات الاحتيالية أو المضلِّلة بوضوح؛",
          "تأريخ العرض وتحديد تاريخ انتهائه؛ وتُسحَب العروض المنتهية من الفهرسة؛",
          "توحيد القطاعات ومستويات الخبرة لتسهيل البحث.",
        ],
      },
      {
        h: "4. الإغناء التحريري: تحليل الموارد البشرية",
        p: [
          "هذا ما يميّز InteractJob. نضيف للعروض « تحليل الموارد البشرية InteractJob »: نص أصلي يضع المنصب في سياق قطاعه والسوق المغربية، ويصف المهام الحقيقية والملف المثالي وآفاق المسار المهني ونصائح ملموسة للترشّح.",
          "يُكتب هذا التحليل وفق خطّنا التحريري ويُراجَع من حيث الجدوى، وليس مجرّد إعادة صياغة للإعلان الأصلي، بل يهدف إلى قيمة مضافة حقيقية للمرشّح.",
        ],
      },
      {
        h: "5. أدوات المساعدة على التحرير",
        p: [
          "لإنتاج تحاليل جيّدة على نطاق واسع، يعتمد فريقنا على أدوات للمساعدة على التحرير، تحت إشراف تحريري بشري ومعايير الجودة لدينا. لا يُنشَر أي محتوى ما لم يطابق خطّنا التحريري وشرط الفائدة للقارئ.",
        ],
      },
      {
        h: "6. الاستقلالية والشفافية",
        p: [
          "تحاليلنا مستقلة عن الموظِّفين: التحليل ليس خطاباً تجارياً. وعندما يكون الإعلان مموَّلاً يُشار إلى ذلك بوضوح. الإشهار على الموقع (Google AdSense) منفصل عن المحتوى التحريري ولا يؤثّر في تحاليلنا.",
        ],
      },
      {
        h: "7. التصحيحات والتبليغات",
        p: [
          `نُصحّح بسرعة أي خطأ يُبلَّغ عنه. إن لاحظت عرضاً منتهياً أو رابطاً معطّلاً أو معلومة غير دقيقة أو محتوى غير لائق، راسلنا على ${EMAIL}. نعالج التبليغات في أقرب الآجال.`,
        ],
      },
      {
        h: "8. احترام الخصوصية والحقوق",
        p: [
          "تُوصَف معالجة بيانات المرشحين في سياسة الخصوصية، طبقاً للقانون المغربي 09-08. ونحترم حقوق الملكية الفكرية: العلامات والشعارات المذكورة ملك لأصحابها.",
        ],
      },
    ],
    back: "العودة إلى الصفحة الرئيسية",
  },
};

export default async function CharteEditorialePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = (["fr", "en", "ar"].includes(locale) ? locale : "fr") as Locale;
  const c = CONTENT[l];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">{c.eyebrow}</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{c.title}</h1>
        <p className="text-sm text-gray-400 mt-2">{c.updated}</p>
      </div>

      <p className="text-gray-600 leading-relaxed mb-10">{c.intro}</p>

      <div className="space-y-10 text-gray-600 leading-relaxed">
        {c.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{s.h}</h2>
            {s.p?.map((para, i) => (
              <p key={i} className="text-sm mt-2 first:mt-0">{para}</p>
            ))}
            {s.ul && (
              <ul className="list-disc pl-5 mt-3 space-y-1.5 text-sm">
                {s.ul.map((li, i) => <li key={i}>{li}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-6 text-sm">
        <Link href="/a-propos" className="text-primary hover:underline">
          {l === "ar" ? "من نحن" : l === "en" ? "About us" : "À propos"}
        </Link>
        <Link href="/conditions-utilisation" className="text-primary hover:underline">
          {l === "ar" ? "شروط الاستخدام" : l === "en" ? "Terms of Use" : "Conditions d'utilisation"}
        </Link>
        <Link href="/" className="text-gray-400 hover:text-gray-600">{c.back}</Link>
      </div>
    </div>
  );
}
