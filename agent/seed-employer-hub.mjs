/**
 * Seed/update the employers_hub collection with hand-authored hub page
 * content. Dry-run by default — pass --commit to actually write.
 *
 * Usage:
 *   node seed-employer-hub.mjs            → dry run, prints what would change
 *   node seed-employer-hub.mjs --commit    → upserts for real
 */
import { MongoClient } from 'mongodb';

const COMMIT = process.argv.includes('--commit');
const COLLECTION = 'employers_hub';

const ANAPEC = {
  slug: 'anapec',
  name: 'ANAPEC',
  name_ar: 'أنابيك',
  sector: 'Secteur public / Emploi',
  official_website: 'https://www.anapec.org',
  job_match_keywords: ['anapec', 'idmaj'],
  is_active: true,

  description: `L'ANAPEC (Agence Nationale de Promotion de l'Emploi et des Compétences) est l'agence publique marocaine dédiée à l'intermédiation sur le marché du travail. Elle accompagne gratuitement les demandeurs d'emploi dans leur recherche — inscription, orientation, mise en relation avec des employeurs — et propose aux entreprises des dispositifs d'aide à l'embauche comme le contrat IDMAJ ou le programme TAEHIL. Contrairement à une agence d'intérim privée, l'ANAPEC ne facture jamais ses services aux candidats : la création d'un compte, l'accompagnement et la mise en relation sont entièrement gratuits. Cette page centralise ce qu'il faut savoir pour s'inscrire, postuler et comprendre les dispositifs ANAPEC, ainsi qu'un aperçu des offres d'emploi actuellement disponibles sur InteractJob.ma qui font référence à un contrat ANAPEC/IDMAJ.`,

  description_ar: `الوكالة الوطنية لإنعاش الشغل والكفاءات (أنابيك) هي المؤسسة العمومية المغربية المكلفة بالوساطة في سوق الشغل بين الباحثين عن عمل والمشغلين. تقدم الوكالة مواكبة مجانية للباحثين عن الشغل: التسجيل، التوجيه المهني، والربط بفرص العمل المتاحة، كما تقترح على المقاولات آليات لدعم التشغيل مثل عقد إدماج أو برنامج التأهيل. وخلافا لوكالات التشغيل المؤقت الخاصة، فإن خدمات أنابيك مجانية بالكامل للمترشحين: إنشاء الحساب والمواكبة والربط بالمشغلين لا يتطلب أي أداء مالي. تجمع هذه الصفحة أهم المعلومات للتسجيل والتقديم وفهم برامج أنابيك، إضافة إلى نظرة على عروض الشغل المتوفرة حاليا على منصة InteractJob.ma والتي تشير إلى عقد أنابيك/إدماج.`,

  how_to_apply: [
    { title: 'Créez votre espace candidat', body: 'Rendez-vous sur anapec.org et cliquez sur « Créer votre espace candidats ». Renseignez votre état civil, votre niveau de formation et vos coordonnées.' },
    { title: 'Complétez votre profil', body: "Ajoutez votre parcours (diplômes, expériences, compétences) et si possible votre CV. Un profil complet augmente vos chances d'être contacté par un conseiller ou un employeur." },
    { title: 'Recherchez les offres', body: "Utilisez le moteur de recherche du portail, ou consultez ci-dessous les offres qui font référence à un contrat ANAPEC/IDMAJ, en filtrant par région, secteur ou métier." },
    { title: 'Postulez en ligne', body: "Envoyez votre candidature directement depuis votre espace candidat, ou via les coordonnées indiquées dans l'annonce." },
    { title: 'Suivez votre dossier avec un conseiller', body: "Après votre inscription en ligne, un rendez-vous en agence est généralement nécessaire pour finaliser votre dossier avec les documents originaux (CIN, diplômes)." },
  ],

  how_to_apply_ar: [
    { title: 'أنشئ فضاءك الخاص كمترشح', body: 'توجه إلى الموقع الرسمي anapec.org واضغط على "إنشاء فضاء المترشحين". أدخل معلوماتك الشخصية ومستواك الدراسي وبيانات الاتصال.' },
    { title: 'أكمل ملفك الشخصي', body: 'أضف مسارك الدراسي والمهني ومهاراتك، وإن أمكن سيرتك الذاتية. الملف الكامل يزيد من فرص التواصل معك من طرف مستشار أو مشغل.' },
    { title: 'ابحث عن العروض المتاحة', body: 'استعمل محرك البحث في البوابة، أو اطلع على عروض الشغل المرتبطة بعقد أنابيك/إدماج أسفل هذه الصفحة، مع تصفية حسب الجهة أو القطاع أو المهنة.' },
    { title: 'قدم ترشيحك عبر الإنترنت', body: 'أرسل طلبك مباشرة من فضائك الشخصي، أو عبر المعلومات المذكورة في الإعلان.' },
    { title: 'تابع ملفك مع مستشار', body: 'بعد التسجيل عبر الإنترنت، يتطلب الأمر عادة موعدا في إحدى وكالات أنابيك لإتمام الملف بالوثائق الأصلية (البطاقة الوطنية، الشهادات).' },
  ],

  how_to_register: [
    { title: 'Rendez-vous sur anapec.org', body: 'Ouvrez le portail officiel et sélectionnez « Créer votre espace candidats » dans l\'espace chercheurs d\'emploi.' },
    { title: "Remplissez le formulaire d'inscription", body: 'Indiquez votre identité, votre niveau d\'études, votre situation professionnelle et vos coordonnées de contact.' },
    { title: 'Validez votre inscription en ligne', body: 'Votre demande est généralement traitée sous 48 heures.' },
    { title: "Présentez-vous à l'agence ANAPEC la plus proche", body: "Munissez-vous de votre CIN et des copies de vos diplômes pour finaliser votre dossier et activer pleinement votre compte." },
    { title: 'Tenez votre profil à jour', body: "Connectez-vous régulièrement à votre espace candidat pour mettre à jour vos expériences et rester visible auprès des employeurs partenaires." },
  ],

  how_to_register_ar: [
    { title: 'توجه إلى anapec.org', body: 'افتح البوابة الرسمية واختر "إنشاء فضاء المترشحين" ضمن فضاء الباحثين عن الشغل.' },
    { title: 'املأ استمارة التسجيل', body: 'أدخل هويتك ومستواك الدراسي ووضعيتك المهنية ومعلومات الاتصال بك.' },
    { title: 'أكد تسجيلك عبر الإنترنت', body: 'عادة ما تتم معالجة طلبك في ظرف 48 ساعة.' },
    { title: 'توجه إلى أقرب وكالة أنابيك', body: 'أحضر بطاقتك الوطنية ونسخا من شهاداتك لإتمام ملفك وتفعيل حسابك بشكل كامل.' },
    { title: 'حافظ على تحديث ملفك', body: 'لِج بانتظام إلى فضائك الخاص لتحديث تجاربك والبقاء ظاهرا أمام المشغلين الشركاء.' },
  ],

  faq: [
    { question: 'Comment créer un compte ANAPEC ?', answer: "Rendez-vous sur anapec.org, cliquez sur « Créer votre espace candidats » et renseignez vos informations personnelles, votre niveau de formation et vos coordonnées. L'inscription est gratuite et généralement traitée sous 48 heures ; un passage en agence avec vos documents originaux est ensuite nécessaire pour finaliser votre dossier." },
    { question: 'Qu\'est-ce qu\'un contrat ANAPEC (IDMAJ) ?', answer: "Le contrat IDMAJ est le dispositif d'insertion historique de l'ANAPEC : il permet à un jeune diplômé d'intégrer une entreprise avec une exonération de charges sociales et d'impôt sur le revenu pour l'employeur, sur une durée pouvant aller jusqu'à 24 mois. Les modalités précises de ce programme évoluent régulièrement — vérifiez son statut actuel directement sur anapec.org avant de vous engager." },
    { question: "L'ANAPEC est-elle gratuite pour les demandeurs d'emploi ?", answer: "Oui. L'inscription, l'accompagnement, la mise en relation avec les employeurs et l'accès aux offres sont entièrement gratuits pour les candidats. Aucun paiement n'est jamais demandé à un chercheur d'emploi." },
    { question: 'Comment mettre à jour mon profil ANAPEC ?', answer: "Connectez-vous à votre espace candidat sur anapec.org avec vos identifiants, puis modifiez vos informations (expériences, compétences, CV, coordonnées) directement depuis votre tableau de bord." },
    { question: 'Quelle est la différence entre anapec.org et anapec.ma ?', answer: "anapec.org héberge l'espace candidats et employeurs (inscription, offres, candidatures), tandis qu'anapec.ma présente plutôt les missions institutionnelles et les programmes de l'agence. Pour vous inscrire ou postuler, utilisez anapec.org." },
    { question: 'Qu\'est-ce que le programme Ana Moukawil ?', answer: "Ana Moukawil est le programme d'accompagnement de l'ANAPEC destiné aux porteurs de projets qui souhaitent créer leur propre activité, avec un appui à l'élaboration du business plan et à l'accès au financement — c'est la continuité de l'ancien programme Moukawalati." },
  ],

  faq_ar: [
    { question: 'كيف أنشئ حسابا في أنابيك؟', answer: 'توجه إلى anapec.org، اضغط على "إنشاء فضاء المترشحين" وأدخل معلوماتك الشخصية ومستواك الدراسي وبيانات الاتصال. التسجيل مجاني ويتم عادة في ظرف 48 ساعة، ثم يتوجب عليك زيارة إحدى الوكالات بوثائقك الأصلية لإتمام الملف.' },
    { question: 'ما هو عقد أنابيك (إدماج)؟', answer: 'عقد إدماج هو آلية الإدماج التاريخية لأنابيك: يتيح للخريجين الشباب الالتحاق بمقاولة مع إعفاء المشغل من الاشتراكات الاجتماعية والضريبة على الدخل، لمدة قد تصل إلى 24 شهرا. تتغير تفاصيل هذا البرنامج من حين لآخر — تحقق من وضعيته الحالية مباشرة عبر anapec.org قبل الالتزام به.' },
    { question: 'هل خدمات أنابيك مجانية للباحثين عن الشغل؟', answer: 'نعم. التسجيل والمواكبة والربط بالمشغلين والاطلاع على العروض كلها مجانية بالكامل للمترشحين. لا يُطلب أي أداء مالي من الباحث عن الشغل.' },
    { question: 'كيف أحدّث ملفي في أنابيك؟', answer: 'لِج إلى فضائك الخاص عبر anapec.org باستعمال معرّفاتك، ثم عدّل معلوماتك (التجارب، المهارات، السيرة الذاتية، بيانات الاتصال) مباشرة من لوحة التحكم الخاصة بك.' },
    { question: 'ما الفرق بين anapec.org و anapec.ma؟', answer: 'يحتضن anapec.org فضاء المترشحين والمشغلين (التسجيل، العروض، الترشيحات)، بينما يعرض anapec.ma بالأحرى المهام المؤسساتية وبرامج الوكالة. للتسجيل أو التقديم، استعمل anapec.org.' },
    { question: 'ما هو برنامج "أنا مقاول"؟', answer: 'أنا مقاول هو برنامج مواكبة تابع لأنابيك موجه لحاملي المشاريع الراغبين في إحداث نشاطهم الخاص، مع دعم في إعداد مخطط العمل والولوج إلى التمويل — وهو امتداد لبرنامج مقاولتي السابق.' },
  ],
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const col = client.db('interactjob').collection(COLLECTION);
    const existing = await col.findOne({ slug: ANAPEC.slug });

    console.log(`Mode: ${COMMIT ? 'COMMIT — will write' : 'dry run — no writes'}`);
    console.log(`Existing document for slug "${ANAPEC.slug}": ${existing ? 'yes (will update)' : 'no (will insert)'}`);
    console.log(`FR word count (description + steps + faq): ${countWords([
      ANAPEC.description,
      ...ANAPEC.how_to_apply.map(s => `${s.title} ${s.body}`),
      ...ANAPEC.how_to_register.map(s => `${s.title} ${s.body}`),
      ...ANAPEC.faq.map(f => `${f.question} ${f.answer}`),
    ].join(' '))}`);

    if (!COMMIT) { log('Dry run only — nothing was written. Re-run with --commit to write.'); return; }

    const now = new Date();
    await col.updateOne(
      { slug: ANAPEC.slug },
      {
        $set: { ...ANAPEC, updated_at: now },
        $setOnInsert: { created_at: now },
      },
      { upsert: true }
    );
    console.log(`✓ ${existing ? 'Updated' : 'Inserted'} employers_hub/${ANAPEC.slug}`);
  } finally {
    await client.close();
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}
function log(msg) { console.log(msg); }

main().catch((err) => { console.error(err); process.exit(1); });
