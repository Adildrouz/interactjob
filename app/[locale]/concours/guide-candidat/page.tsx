import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { buildFrArAlternates } from "@/lib/hreflang";

const BASE_URL = "https://www.interactjob.ma";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "دليل المترشح — النجاح في مباراة الوظيفة العمومية بالمغرب"
      : "Guide du Candidat — Réussir un Concours de la Fonction Publique au Maroc",
    description: isAr
      ? "دليل شامل للنجاح في مباراة عمومية بالمغرب: مراحل المسطرة، الوثائق الواجب تحضيرها، نصائح للاختبار الكتابي والشفوي، الأخطاء الواجب تجنبها."
      : "Guide complet pour réussir un concours public au Maroc : étapes du processus, documents à préparer, conseils pour l'écrit et l'oral, erreurs à éviter.",
    alternates: buildFrArAlternates("/concours/guide-candidat"),
    keywords: isAr
      ? ["دليل مباراة الوظيفة العمومية المغرب", "النجاح في مباراة عمومية", "تحضير مباراة إدارية", "وثائق مباراة الوظيفة العمومية"]
      : ["guide concours fonction publique maroc", "réussir concours public maroc", "préparer concours administratif", "documents concours fonction publique"],
    robots: { index: locale !== "en", follow: true },
  };
}

const STEPS = [
  {
    title_fr: "1. Repérer et vérifier l'avis de concours",
    title_ar: "1. تتبع والتحقق من إعلان المباراة",
    body_fr: "Chaque concours fait l'objet d'un avis officiel publié par l'organisme recruteur (ministère, collectivité, établissement public), généralement relayé sur alwadifa-maroc.com et sur le site officiel de l'organisme. Vérifiez systématiquement : le niveau de diplôme requis, la limite d'âge éventuelle, le nombre de postes, la région d'affectation, et surtout la date limite de dépôt — un dossier envoyé après cette date est automatiquement rejeté.",
    body_ar: "تخضع كل مباراة لإعلان رسمي تنشره المؤسسة الموظِّفة (وزارة، جماعة ترابية، مؤسسة عمومية)، يُنشر عادة على موقع alwadifa-maroc.com وعلى الموقع الرسمي للمؤسسة. تحققوا بشكل منهجي من: مستوى الشهادة المطلوب، حد السن إن وُجد، عدد المناصب، جهة التعيين، وخصوصاً آخر أجل للإيداع — يُستبعد تلقائياً كل ملف يُرسل بعد هذا التاريخ.",
  },
  {
    title_fr: "2. Constituer un dossier complet",
    title_ar: "2. تكوين ملف كامل",
    body_fr: "La liste exacte des pièces est précisée dans chaque avis, mais elle comprend presque toujours : une demande manuscrite ou un formulaire de candidature, un CV à jour, une copie de la Carte d'Identité Nationale (CIN), des copies certifiées conformes de vos diplômes et relevés de notes, et deux photos d'identité récentes. Certains concours exigent en plus un extrait d'acte de naissance, un certificat médical d'aptitude ou un extrait de casier judiciaire (fiche anthropométrique B3).",
    body_ar: "تُحدد اللائحة الدقيقة للوثائق في كل إعلان، لكنها تشمل غالباً: طلباً خطياً أو استمارة ترشيح، سيرة ذاتية محدثة، نسخة من البطاقة الوطنية للتعريف (CIN)، نسخاً مطابقة لأصل الشهادات وكشوف النقط، وصورتين شمسيتين حديثتين. تشترط بعض المباريات إضافة مستخرج من رسم الولادة، أو شهادة طبية للياقة، أو مستخرج من السجل العدلي (البطاقة رقم 3).",
  },
  {
    title_fr: "3. Réussir la présélection sur dossier",
    title_ar: "3. اجتياز الانتقاء الأولي على أساس الملف",
    body_fr: "L'administration élimine d'abord les dossiers incomplets ou hors critères (diplôme non conforme, âge dépassé, pièces manquantes). Un CV clair et bien structuré, avec les intitulés de diplômes conformes à ceux demandés dans l'avis, augmente vos chances de passer cette première étape.",
    body_ar: "تستبعد الإدارة في البداية الملفات الناقصة أو غير المطابقة للمعايير (شهادة غير مطابقة، تجاوز السن، وثائق ناقصة). سيرة ذاتية واضحة ومنظمة جيداً، بمسميات شهادات مطابقة لتلك المطلوبة في الإعلان، تزيد من فرصكم في اجتياز هذه المرحلة الأولى.",
  },
  {
    title_fr: "4. Préparer l'épreuve écrite",
    title_ar: "4. التحضير للاختبار الكتابي",
    body_fr: "La plupart des concours publics comportent une épreuve de culture générale (actualité, institutions marocaines, Vision Royale) et une épreuve spécifique liée au poste (droit, finances, informatique, technique selon le métier). Entraînez-vous avec les annales des concours précédents de l'organisme visé, généralement disponibles sur son site ou partagées par les candidats sur les forums spécialisés.",
    body_ar: "تتضمن معظم المباريات العمومية اختباراً في الثقافة العامة (الأخبار الراهنة، المؤسسات المغربية، الرؤية الملكية) واختباراً تخصصياً مرتبطاً بالمنصب (القانون، المالية، المعلوميات، أو مجال تقني حسب المهنة). تدربوا باستخدام مواضيع المباريات السابقة للمؤسسة المستهدفة، والمتوفرة عادة على موقعها أو التي يتقاسمها المترشحون في المنتديات المتخصصة.",
  },
  {
    title_fr: "5. Réussir l'entretien oral",
    title_ar: "5. اجتياز المقابلة الشفوية",
    body_fr: "Les candidats admissibles à l'écrit passent un entretien devant un jury, qui évalue la motivation, la connaissance du poste et de l'organisme, et parfois la maîtrise d'une langue étrangère. Préparez une présentation de votre parcours en 2 minutes, renseignez-vous sur les missions de l'organisme, et anticipez les questions sur vos expériences passées.",
    body_ar: "يخضع المترشحون المقبولون في الاختبار الكتابي لمقابلة أمام لجنة، تقيّم الدافعية، ومعرفة المنصب والمؤسسة، وأحياناً إتقان لغة أجنبية. جهزوا تقديماً لمسيرتكم في حدود دقيقتين، اطّلعوا على مهام المؤسسة، وتوقعوا الأسئلة المتعلقة بتجاربكم السابقة.",
  },
  {
    title_fr: "6. Suivre les résultats",
    title_ar: "6. تتبع النتائج",
    body_fr: "Les résultats (admissibilité puis liste définitive des lauréats) sont publiés sur le site de l'organisme et souvent relayés sur alwadifa-maroc.com. Le délai entre la clôture des candidatures et les résultats définitifs varie généralement de 2 à 6 mois selon la taille du concours et le nombre de candidats.",
    body_ar: "تُنشر النتائج (القبول الأولي ثم اللائحة النهائية للناجحين) على موقع المؤسسة، وغالباً ما يُعاد نشرها على alwadifa-maroc.com. تتراوح المدة الفاصلة بين إغلاق باب الترشيحات والنتائج النهائية عموماً بين شهرين وستة أشهر حسب حجم المباراة وعدد المترشحين.",
  },
];

const MISTAKES = [
  {
    fr: "Déposer un dossier incomplet ou après la date limite — la cause n°1 de rejet automatique.",
    ar: "إيداع ملف ناقص أو بعد الأجل المحدد — السبب رقم 1 للاستبعاد التلقائي.",
  },
  {
    fr: "Ignorer les conditions précises de diplôme (un intitulé légèrement différent peut suffire à disqualifier un dossier).",
    ar: "تجاهل الشروط الدقيقة للشهادة (قد يكفي اختلاف طفيف في المسمى لإقصاء الملف).",
  },
  {
    fr: "Négliger la lettre de motivation ou la CIN à recopier, alors que ce sont souvent les pièces exigées en premier.",
    ar: "إهمال رسالة التحفيز أو نسخة البطاقة الوطنية، رغم أنها غالباً من أول الوثائق المطلوبة.",
  },
  {
    fr: "Ne pas se renseigner sur l'organisme avant l'entretien oral.",
    ar: "عدم الاطلاع على المؤسسة قبل المقابلة الشفوية.",
  },
  {
    fr: "Se limiter à un seul concours — multiplier les candidatures augmente vos chances sans coût supplémentaire.",
    ar: "الاقتصار على مباراة واحدة فقط — تعدد الترشيحات يزيد فرصكم دون أي تكلفة إضافية.",
  },
];

export default async function GuideCandidatPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const t = await getTranslations("concours");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">{t("breadcrumbHome")}</Link>
        <span>/</span>
        <Link href="/concours" className="hover:text-primary">{t("breadcrumbConcours")}</Link>
        <span>/</span>
        <span className="text-gray-600">{t("linkGuide").replace("📖 ", "")}</span>
      </nav>

      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{t("badge")}</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        {isAr ? "دليل المترشح — النجاح في مباراة الوظيفة العمومية بالمغرب" : "Guide du Candidat — Réussir un Concours de la Fonction Publique au Maroc"}
      </h1>
      <p className="text-gray-600 leading-relaxed mb-8">
        {isAr
          ? "يلخص هذا الدليل الخطوات العملية للتحضير واجتياز مباراة توظيف في الإدارة المغربية — من الجماعات الترابية إلى المؤسسات العمومية — إضافة إلى الوثائق الواجب تجميعها والأخطاء الأكثر شيوعاً التي تُقصي مترشحين رغم كفاءتهم."
          : "Ce guide résume les étapes concrètes pour préparer et réussir un concours de recrutement dans l'administration marocaine — des collectivités territoriales aux établissements publics — ainsi que les documents à réunir et les erreurs les plus fréquentes qui éliminent des candidats pourtant qualifiés."}
      </p>

      <div className="space-y-6 mb-10">
        {STEPS.map((s) => (
          <div key={s.title_fr} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-2">{isAr ? s.title_ar : s.title_fr}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{isAr ? s.body_ar : s.body_fr}</p>
          </div>
        ))}
      </div>

      <section className="mb-10 bg-orange-50 border border-orange-100 rounded-2xl p-6">
        <h2 className="text-base font-bold text-orange-800 mb-3">{t("guideMistakesTitle")}</h2>
        <ul className="space-y-2">
          {MISTAKES.map((m) => (
            <li key={m.fr} className="text-sm text-orange-700 leading-relaxed flex gap-2">
              <span>✗</span><span>{isAr ? m.ar : m.fr}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-10">
        <h2 className="text-lg font-bold mb-2">{t("prepareTitle")}</h2>
        <p className="text-blue-100 text-sm leading-relaxed mb-4">
          {isAr ? "سيرة ذاتية واضحة وخالية من الأخطاء غالباً ما تصنع الفرق منذ الانتقاء الأولي على الملف." : "Un CV clair et sans erreur fait souvent la différence dès la présélection sur dossier."}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            href={"/cv-checker" as any}
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            {t("ctaCvChecker")}
          </Link>
          <Link
            href={"/generateur-cv" as any}
            className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
          >
            {t("ctaCvGenerator")}
          </Link>
        </div>
      </section>

      <Link href="/concours" className="block text-center text-sm text-primary hover:underline py-2">
        {t("backToActive")}
      </Link>
    </div>
  );
}
