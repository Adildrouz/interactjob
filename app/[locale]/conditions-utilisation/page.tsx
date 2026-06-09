import type { Metadata } from "next";
import { Link } from "@/i18n/routing";

const BASE_URL = "https://www.interactjob.ma";
const EMAIL = "contact@interactjob.ma";
const LAST_UPDATE = "7 juin 2026";

type Locale = "fr" | "en" | "ar";

const META: Record<Locale, { title: string; description: string }> = {
  fr: {
    title: "Conditions d'utilisation | InteractJob",
    description:
      "Conditions générales d'utilisation d'InteractJob.ma : règles d'usage de la plateforme d'emploi, droits et responsabilités des candidats et recruteurs au Maroc.",
  },
  en: {
    title: "Terms of Use | InteractJob",
    description:
      "InteractJob.ma terms of use: platform rules, rights and responsibilities of job seekers and recruiters in Morocco.",
  },
  ar: {
    title: "شروط الاستخدام | InteractJob",
    description:
      "شروط استخدام منصة InteractJob.ma للتوظيف في المغرب: القواعد وحقوق وواجبات المرشحين والموظِّفين.",
  },
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const l = (["fr", "en", "ar"].includes(locale) ? locale : "fr") as Locale;
  const canonical = `${BASE_URL}/conditions-utilisation`;
  return {
    title: META[l].title,
    description: META[l].description,
    robots: l === "fr" ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical,
      languages: {
        fr: canonical,
        en: `${BASE_URL}/en/conditions-utilisation`,
        ar: `${BASE_URL}/ar/conditions-utilisation`,
        "x-default": canonical,
      },
    },
  };
}

type Section = { h: string; p?: string[]; ul?: string[] };

const CONTENT: Record<Locale, { eyebrow: string; title: string; updated: string; intro: string; sections: Section[]; back: string }> = {
  fr: {
    eyebrow: "Légal",
    title: "Conditions Générales d'Utilisation",
    updated: `Dernière mise à jour : ${LAST_UPDATE}`,
    intro:
      "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'usage du site InteractJob.ma, une plateforme d'emploi dédiée au marché marocain éditée par Adil Drouz, basé à Essaouira (Maroc). En naviguant sur le site, en consultant une offre, en déposant une candidature ou en publiant une annonce, vous acceptez sans réserve les présentes conditions.",
    sections: [
      {
        h: "1. Objet du service",
        p: [
          "InteractJob.ma met à disposition des candidats un agrégateur d'offres d'emploi, de stages et de concours publics au Maroc, enrichi d'analyses RH éditoriales originales, ainsi que des outils gratuits et payants (vérificateur de CV, générateur de CV, test de personnalité). Le site permet également aux recruteurs de publier des offres d'emploi.",
          "L'accès au site est gratuit pour les candidats. Certains services à valeur ajoutée (CV professionnel, mise en avant d'annonces sponsorisées) font l'objet d'une tarification clairement indiquée avant tout paiement.",
        ],
      },
      {
        h: "2. Sources des offres et rôle d'intermédiaire",
        p: [
          "Une partie des offres publiées est agrégée depuis des sources publiques (sites de recrutement, pages carrières, réseaux professionnels) et enrichie par notre équipe. InteractJob agit en qualité d'intermédiaire technique et éditorial : nous ne sommes ni l'employeur, ni le mandataire des entreprises citées.",
          "Nous nous efforçons de vérifier et de tenir à jour les informations, mais nous ne garantissons ni l'exactitude permanente, ni la disponibilité, ni l'issue d'une candidature. Toute relation contractuelle se noue exclusivement entre le candidat et l'employeur.",
        ],
      },
      {
        h: "3. Engagements de l'utilisateur",
        p: ["En utilisant InteractJob, vous vous engagez à :"],
        ul: [
          "Fournir des informations exactes et à jour lors d'une candidature ou de la publication d'une offre ;",
          "Ne pas usurper l'identité d'un tiers ni publier de fausses annonces ;",
          "Ne pas diffuser de contenu illégal, discriminatoire, diffamatoire ou contraire aux bonnes mœurs ;",
          "Ne pas tenter de collecter massivement les données du site par des moyens automatisés sans autorisation écrite ;",
          "Respecter les droits de propriété intellectuelle d'InteractJob et des tiers.",
        ],
      },
      {
        h: "4. Candidatures et données personnelles",
        p: [
          "Lorsque vous déposez une candidature, les informations transmises (CV, coordonnées, lettre de motivation) sont traitées pour vous mettre en relation avec des opportunités correspondant à votre profil. Le traitement de vos données est détaillé dans notre Politique de Confidentialité, conforme à la loi marocaine 09-08.",
        ],
      },
      {
        h: "5. Publication d'offres par les recruteurs",
        p: [
          "Le recruteur garantit être habilité à publier l'offre et que son contenu est licite, exact et non discriminatoire. InteractJob se réserve le droit de refuser, modifier ou retirer toute annonce ne respectant pas ces conditions ou la législation en vigueur, sans préavis ni indemnité.",
        ],
      },
      {
        h: "6. Services payants et paiement",
        p: [
          "Les prix des services payants sont indiqués en euros et/ou en dirhams, toutes taxes éventuelles comprises. Le paiement s'effectue via nos prestataires sécurisés. La livraison du service (CV professionnel, activation d'une annonce sponsorisée) intervient dans les délais annoncés sur la page concernée.",
        ],
      },
      {
        h: "7. Propriété intellectuelle",
        p: [
          "La structure du site, sa charte graphique, ses textes éditoriaux (notamment les analyses RH), son logo et sa base de données enrichie sont protégés. Toute reproduction, extraction ou réutilisation non autorisée est interdite. Les marques et logos des entreprises citées restent la propriété de leurs titulaires respectifs.",
        ],
      },
      {
        h: "8. Publicité",
        p: [
          "Le site est en partie financé par la publicité, notamment via Google AdSense. Les annonces affichées sont gérées par des réseaux tiers ; InteractJob n'endosse pas le contenu des publicités diffusées. Les modalités relatives aux cookies publicitaires sont détaillées dans la Politique de Confidentialité.",
        ],
      },
      {
        h: "9. Limitation de responsabilité",
        p: [
          "InteractJob ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site, d'une erreur dans une offre, d'une interruption de service ou des relations nouées avec un employeur. Le site est fourni « en l'état » et son usage relève de la seule responsabilité de l'utilisateur.",
        ],
      },
      {
        h: "10. Modification et résiliation",
        p: [
          "InteractJob peut modifier les présentes CGU à tout moment ; la version applicable est celle en ligne au moment de votre visite. Nous pouvons suspendre l'accès d'un utilisateur en cas de manquement aux présentes conditions.",
        ],
      },
      {
        h: "11. Droit applicable",
        p: [
          "Les présentes CGU sont régies par le droit marocain. Tout litige relèvera des tribunaux compétents du Maroc, à défaut de résolution amiable.",
        ],
      },
      {
        h: "12. Contact",
        p: [`Pour toute question relative aux présentes conditions : ${EMAIL} — InteractJob, Essaouira, Maroc.`],
      },
    ],
    back: "Retour à l'accueil",
  },
  en: {
    eyebrow: "Legal",
    title: "Terms of Use",
    updated: `Last updated: ${LAST_UPDATE}`,
    intro:
      "These Terms of Use govern access to and use of InteractJob.ma, a job platform dedicated to the Moroccan market, published by Adil Drouz, based in Essaouira, Morocco. By browsing the site, viewing a listing, submitting an application or posting a job, you fully accept these terms.",
    sections: [
      {
        h: "1. Purpose of the service",
        p: [
          "InteractJob.ma provides job seekers with an aggregator of job offers, internships and public-sector competitions in Morocco, enriched with original editorial HR analysis, along with free and paid tools (CV checker, CV builder, personality test). The site also lets recruiters publish job offers.",
          "Access is free for candidates. Certain value-added services (professional CV, sponsored listings) are priced clearly before any payment.",
        ],
      },
      {
        h: "2. Source of listings and intermediary role",
        p: [
          "Some listings are aggregated from public sources (recruitment sites, career pages, professional networks) and enriched by our team. InteractJob acts as a technical and editorial intermediary: we are neither the employer nor the agent of the companies mentioned.",
          "We strive to verify and keep information up to date, but we do not guarantee its permanent accuracy, availability, or the outcome of any application. Any contractual relationship is formed solely between the candidate and the employer.",
        ],
      },
      {
        h: "3. User commitments",
        p: ["By using InteractJob, you agree to:"],
        ul: [
          "Provide accurate, up-to-date information when applying or posting an offer;",
          "Not impersonate others or post false listings;",
          "Not publish illegal, discriminatory or defamatory content;",
          "Not scrape the site's data through automated means without written permission;",
          "Respect the intellectual property rights of InteractJob and third parties.",
        ],
      },
      {
        h: "4. Applications and personal data",
        p: [
          "When you apply, the information you submit (CV, contact details, cover letter) is processed to connect you with opportunities matching your profile. Data processing is detailed in our Privacy Policy, compliant with Moroccan Law 09-08.",
        ],
      },
      {
        h: "5. Job postings by recruiters",
        p: [
          "The recruiter warrants that they are authorized to post the offer and that its content is lawful, accurate and non-discriminatory. InteractJob reserves the right to refuse, edit or remove any listing that does not comply, without notice or compensation.",
        ],
      },
      {
        h: "6. Paid services and payment",
        p: [
          "Prices for paid services are shown in euros and/or dirhams, including any applicable taxes. Payment is processed through our secure providers. Service delivery occurs within the timeframe stated on the relevant page.",
        ],
      },
      {
        h: "7. Intellectual property",
        p: [
          "The site structure, design, editorial texts (notably HR analysis), logo and enriched database are protected. Any unauthorized reproduction, extraction or reuse is prohibited. Company brands and logos remain the property of their respective owners.",
        ],
      },
      {
        h: "8. Advertising",
        p: [
          "The site is partly funded by advertising, notably Google AdSense. Ads are served by third-party networks; InteractJob does not endorse advertised content. Advertising cookies are detailed in the Privacy Policy.",
        ],
      },
      {
        h: "9. Limitation of liability",
        p: [
          "InteractJob shall not be liable for direct or indirect damages resulting from use of the site, an error in a listing, service interruption, or relationships formed with an employer. The site is provided “as is.”",
        ],
      },
      {
        h: "10. Changes and termination",
        p: [
          "InteractJob may amend these terms at any time; the applicable version is the one online at the time of your visit. We may suspend a user's access in case of breach.",
        ],
      },
      {
        h: "11. Governing law",
        p: ["These terms are governed by Moroccan law. Any dispute falls under the competent Moroccan courts, failing amicable resolution."],
      },
      {
        h: "12. Contact",
        p: [`For any question about these terms: ${EMAIL} — InteractJob, Essaouira, Morocco.`],
      },
    ],
    back: "Back to home",
  },
  ar: {
    eyebrow: "قانوني",
    title: "الشروط العامة للاستخدام",
    updated: `آخر تحديث: ${LAST_UPDATE}`,
    intro:
      "تنظّم هذه الشروط العامة للاستخدام الوصول إلى موقع InteractJob.ma واستعماله، وهو منصة توظيف مخصّصة للسوق المغربية يديرها عادل دروز ومقرّها الصويرة بالمغرب. بتصفّحك للموقع أو اطّلاعك على عرض أو إرسال ترشيح أو نشر إعلان، فإنك تقبل هذه الشروط دون تحفّظ.",
    sections: [
      {
        h: "1. موضوع الخدمة",
        p: [
          "يوفّر InteractJob.ma للمرشحين مجمِّعاً لعروض الشغل والتداريب والمباريات العمومية بالمغرب، مع تحاليل تحريرية أصلية في الموارد البشرية، إضافة إلى أدوات مجانية ومؤدّى عنها (فاحص السيرة الذاتية، مولّد السيرة، اختبار الشخصية). كما يتيح للموظِّفين نشر عروض الشغل.",
          "الولوج مجاني للمرشحين. بعض الخدمات ذات القيمة المضافة (سيرة ذاتية احترافية، إعلانات مموَّلة) تُحدَّد أسعارها بوضوح قبل أي أداء.",
        ],
      },
      {
        h: "2. مصادر العروض ودور الوسيط",
        p: [
          "تُجمَع بعض العروض من مصادر عمومية (مواقع التوظيف، صفحات الوظائف، الشبكات المهنية) ويتم إغناؤها من طرف فريقنا. يعمل InteractJob كوسيط تقني وتحريري: لسنا الموظِّف ولا وكيله.",
          "نحرص على التحقّق وتحديث المعلومات، لكننا لا نضمن دقّتها الدائمة ولا توفّرها ولا نتيجة أي ترشيح. كل علاقة تعاقدية تنشأ حصراً بين المرشّح والموظِّف.",
        ],
      },
      {
        h: "3. التزامات المستخدم",
        p: ["باستخدامك InteractJob، تلتزم بما يلي:"],
        ul: [
          "تقديم معلومات صحيحة ومحيَّنة عند الترشيح أو نشر عرض؛",
          "عدم انتحال هوية الغير أو نشر إعلانات كاذبة؛",
          "عدم نشر محتوى غير قانوني أو تمييزي أو تشهيري؛",
          "عدم جمع بيانات الموقع آلياً دون إذن كتابي؛",
          "احترام حقوق الملكية الفكرية لـ InteractJob والغير.",
        ],
      },
      { h: "4. الترشيحات والمعطيات الشخصية", p: ["عند ترشّحك، تُعالَج المعلومات المرسَلة (السيرة، بيانات الاتصال، رسالة الدافع) لربطك بالفرص الملائمة. تفاصيل المعالجة في سياسة الخصوصية، طبقاً للقانون المغربي 09-08."] },
      { h: "5. نشر العروض من طرف الموظِّفين", p: ["يضمن الموظِّف أنه مخوَّل لنشر العرض وأن محتواه قانوني ودقيق وغير تمييزي. يحتفظ InteractJob بحق رفض أو تعديل أو سحب أي إعلان مخالف دون إشعار أو تعويض."] },
      { h: "6. الخدمات المؤدّى عنها والأداء", p: ["تُعرَض أسعار الخدمات المؤدّى عنها بالأورو و/أو الدرهم متضمّنة الرسوم عند الاقتضاء. يتم الأداء عبر مزوّدينا الآمنين، وتُسلَّم الخدمة داخل الآجال المعلنة في الصفحة المعنية."] },
      { h: "7. الملكية الفكرية", p: ["بنية الموقع وتصميمه ونصوصه التحريرية وشعاره وقاعدة بياناته المُغناة محمية. يُمنع أي استنساخ أو استخراج أو إعادة استعمال دون إذن. تبقى علامات وشعارات الشركات المذكورة ملكاً لأصحابها."] },
      { h: "8. الإشهار", p: ["يُموَّل الموقع جزئياً بالإشهار، خاصة عبر Google AdSense. تُدار الإعلانات من طرف شبكات خارجية، ولا يتبنّى InteractJob محتواها. تفاصيل ملفات تعريف الارتباط الإشهارية في سياسة الخصوصية."] },
      { h: "9. تحديد المسؤولية", p: ["لا يتحمّل InteractJob المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استعمال الموقع أو خطأ في عرض أو انقطاع الخدمة أو العلاقات مع موظِّف. يُقدَّم الموقع « على حالته »."] },
      { h: "10. التعديل والإنهاء", p: ["يمكن لـ InteractJob تعديل هذه الشروط في أي وقت؛ والنسخة السارية هي المنشورة وقت زيارتك. ويمكننا تعليق ولوج أي مستخدم في حال الإخلال."] },
      { h: "11. القانون المطبَّق", p: ["تخضع هذه الشروط للقانون المغربي، وكل نزاع يعود للمحاكم المغربية المختصة في غياب حل ودّي."] },
      { h: "12. الاتصال", p: [`لأي سؤال حول هذه الشروط: ${EMAIL} — InteractJob، الصويرة، المغرب.`] },
    ],
    back: "العودة إلى الصفحة الرئيسية",
  },
};

export default async function ConditionsPage({ params }: { params: Promise<{ locale: string }> }) {
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
        <Link href="/politique-confidentialite" className="text-primary hover:underline">
          {l === "ar" ? "سياسة الخصوصية" : l === "en" ? "Privacy Policy" : "Politique de confidentialité"}
        </Link>
        <Link href="/charte-editoriale" className="text-primary hover:underline">
          {l === "ar" ? "الميثاق التحريري" : l === "en" ? "Editorial Policy" : "Charte éditoriale"}
        </Link>
        <Link href="/" className="text-gray-400 hover:text-gray-600">{c.back}</Link>
      </div>
    </div>
  );
}
