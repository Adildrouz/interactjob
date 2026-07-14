"use client";
import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { trackToolEvent } from "@/lib/trackToolEvent";

// ── Bilingual data ─────────────────────────────────────────────────────────
const VILLES = [
  "Casablanca","Rabat","Marrakech","Agadir","Essaouira","Tanger","Fès","Meknès",
  "Oujda","Tétouan","Kénitra","Béni Mellal","El Jadida","Settat","Laâyoune","Dakhla","Other / Autre",
];

const SECTEURS_FR = [
  "Hôtellerie & Tourisme","IT & Digital","Ressources Humaines","Finance & Banque",
  "Commerce & Vente","Administratif","Marketing & Communication","Industrie & BTP",
  "Santé","Éducation","Autre",
];
const SECTEURS_EN = [
  "Hospitality & Tourism","IT & Digital","Human Resources","Finance & Banking",
  "Sales & Commerce","Administrative","Marketing & Communication","Industry & Construction",
  "Healthcare","Education","Other",
];

const NIVEAUX_FR = [
  { value: "Stage",          label: "Stage" },
  { value: "Junior",         label: "Junior (0–2 ans)" },
  { value: "Intermédiaire",  label: "Intermédiaire (3–5 ans)" },
  { value: "Senior",         label: "Senior (6–10 ans)" },
  { value: "Expert",         label: "Expert (10+ ans)" },
];
const NIVEAUX_EN = [
  { value: "Stage",          label: "Internship" },
  { value: "Junior",         label: "Junior (0–2 yrs)" },
  { value: "Intermédiaire",  label: "Mid-level (3–5 yrs)" },
  { value: "Senior",         label: "Senior (6–10 yrs)" },
  { value: "Expert",         label: "Expert (10+ yrs)" },
];

const DISPOS_FR = ["Immédiate","Sous 1 mois","Sous 3 mois","À négocier"];
const DISPOS_EN = ["Immediately","Within 1 month","Within 3 months","To be negotiated"];

const LANGUES = ["Arabic / Arabe","French / Français","English / Anglais","Spanish / Espagnol","Italian / Italien","German / Allemand"];

const WA_URL = "https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j";

// ── i18n strings ───────────────────────────────────────────────────────────
const i18n = {
  fr: {
    badge:          "✅ Gratuit · Confidentiel · Réponse sous 48h",
    heroTitle:      "Candidature Spontanée — InteractJob.ma",
    heroSub:        "Soumettez votre profil et nous vous contacterons dès qu'une opportunité correspond à vos compétences",
    firstName:      "Prénom", firstNamePh: "Votre prénom", firstNameErr: "Prénom requis",
    lastName:       "Nom", lastNamePh: "Votre nom", lastNameErr: "Nom requis",
    email:          "Email", emailPh: "vous@email.com", emailErr: "Email invalide",
    phone:          "Téléphone", phonePh: "+212 6XX XXX XXX / +33 6XX XXX / +1 XXX…", phoneErr: "Numéro invalide (min 7 chiffres)",
    city:           "Ville", cityDefault: "Sélectionnez votre ville", cityErr: "Sélectionnez une ville",
    sectors:        "Secteur(s) visé(s)", sectorsErr: "Sélectionnez au moins un secteur",
    position:       "Poste recherché", positionPh: "ex: Spa Manager, Développeur Full Stack, Responsable RH…", positionErr: "Poste requis",
    experience:     "Niveau d'expérience", experienceErr: "Sélectionnez un niveau",
    availability:   "Disponibilité", availabilityDefault: "Sélectionnez votre disponibilité", availabilityErr: "Sélectionnez une disponibilité",
    languages:      "Langues parlées",
    linkedin:       "Profil LinkedIn", linkedinOpt: "(optionnel)", linkedinPh: "https://linkedin.com/in/votre-profil",
    about:          "À propos de vous", aboutPh: "Présentez-vous brièvement : votre parcours, vos compétences clés, ce que vous recherchez…", aboutErr: (n: number) => `Minimum 50 caractères (${n}/50)`,
    cv:             "CV (PDF)", cvPh: "Cliquez pour uploader votre CV", cvSub: "PDF uniquement — max 5 Mo",
    cvErr:          "CV PDF requis", cvFmtErr: "Format PDF uniquement", cvSizeErr: "Fichier trop lourd (max 5 Mo)",
    rgpd:           `J'accepte que mes données soient conservées par InteractJob.ma pour être contacté lors d'opportunités correspondant à mon profil. Données supprimables sur simple demande à`,
    rgpdErr:        "Vous devez accepter les conditions",
    alertOptinLabel: "Je souhaite recevoir les nouvelles offres d'emploi par email",
    alertOptinHelper: "Vous pouvez vous désinscrire à tout moment.",
    submit:         "Envoyer ma candidature →",
    sending:        "Envoi en cours...",
    serverErr:      "Une erreur est survenue. Veuillez réessayer ou envoyer votre CV à",
    required:       "*",
    successTitle:   "Candidature reçue avec succès !",
    successMsg:     (name: string) => `Nous avons bien reçu votre profil ${name}. Notre équipe vous contactera dès qu'une opportunité correspond.`,
    waBtn:          "📲 Rejoindre la chaîne WhatsApp",
    waSub:          "Recevez les offres chaque matin directement sur WhatsApp",
    viewOffers:     "Voir les offres du moment →",
    backHome:       "Retour à l'accueil",
    waAlt:          "📲 Rejoindre notre chaîne WhatsApp — Alertes emploi quotidiennes",
    cards: [
      { icon: "🔒", title: "Données confidentielles", desc: "Votre CV n'est jamais partagé sans votre accord explicite" },
      { icon: "⚡", title: "Réponse rapide",           desc: "Nous vous contactons sous 48h si une opportunité correspond" },
      { icon: "🎯", title: "Gratuit pour toujours",    desc: "Aucun frais, aucun abonnement pour les candidats" },
    ],
  },
  en: {
    badge:          "✅ Free · Confidential · Reply within 48h",
    heroTitle:      "Spontaneous Application — InteractJob.ma",
    heroSub:        "Submit your profile and we'll contact you as soon as a matching opportunity arises",
    firstName:      "First name", firstNamePh: "Your first name", firstNameErr: "First name required",
    lastName:       "Last name", lastNamePh: "Your last name", lastNameErr: "Last name required",
    email:          "Email", emailPh: "you@email.com", emailErr: "Invalid email",
    phone:          "Phone", phonePh: "+212 6XX XXX XXX / +33 6XX / +1 XXX…", phoneErr: "Invalid number (min 7 digits)",
    city:           "City", cityDefault: "Select your city", cityErr: "Please select a city",
    sectors:        "Target sector(s)", sectorsErr: "Select at least one sector",
    position:       "Position sought", positionPh: "e.g. Spa Manager, Full Stack Developer, HR Manager…", positionErr: "Position required",
    experience:     "Experience level", experienceErr: "Select a level",
    availability:   "Availability", availabilityDefault: "Select your availability", availabilityErr: "Select your availability",
    languages:      "Languages spoken",
    linkedin:       "LinkedIn profile", linkedinOpt: "(optional)", linkedinPh: "https://linkedin.com/in/your-profile",
    about:          "About you", aboutPh: "Briefly introduce yourself: your background, key skills, what you're looking for…", aboutErr: (n: number) => `Minimum 50 characters (${n}/50)`,
    cv:             "CV (PDF)", cvPh: "Click to upload your CV", cvSub: "PDF only — max 5 MB",
    cvErr:          "PDF CV required", cvFmtErr: "PDF format only", cvSizeErr: "File too large (max 5 MB)",
    rgpd:           "I agree that my data may be stored by InteractJob.ma in order to be contacted for matching opportunities. Data can be deleted on request at",
    rgpdErr:        "You must accept the terms",
    alertOptinLabel: "I'd like to receive new job offers by email",
    alertOptinHelper: "You can unsubscribe at any time.",
    submit:         "Send my application →",
    sending:        "Sending…",
    serverErr:      "An error occurred. Please try again or send your CV to",
    required:       "*",
    successTitle:   "Application received!",
    successMsg:     (name: string) => `We have received your profile ${name}. Our team will contact you as soon as a matching opportunity arises.`,
    waBtn:          "📲 Join our WhatsApp channel",
    waSub:          "Receive job alerts every morning directly on WhatsApp",
    viewOffers:     "View current offers →",
    backHome:       "Back to home",
    waAlt:          "📲 Join our WhatsApp channel — Daily job alerts",
    cards: [
      { icon: "🔒", title: "Confidential data",  desc: "Your CV is never shared without your explicit consent" },
      { icon: "⚡", title: "Quick response",      desc: "We contact you within 48h if an opportunity matches" },
      { icon: "🎯", title: "Always free",         desc: "No fees, no subscription for candidates" },
    ],
  },
} as const;

// ── Types ──────────────────────────────────────────────────────────────────
type Status = "idle" | "loading" | "success" | "error";
type ApiError = string | null;
interface FormFields {
  firstName: string; lastName: string; email: string; phone: string; city: string;
  sectors: string[]; position: string; experienceLevel: string; availability: string;
  languages: string[]; linkedin: string; about: string;
}
type Errors = Partial<Record<keyof FormFields | "cv" | "rgpd", string>>;

const init: FormFields = {
  firstName:"", lastName:"", email:"", phone:"", city:"",
  sectors:[], position:"", experienceLevel:"", availability:"",
  languages:[], linkedin:"", about:"",
};

export default function PostulerPage() {
  const locale  = useLocale();
  const isEn    = locale === "en";
  const t       = isEn ? i18n.en : i18n.fr;
  const SECTEURS = isEn ? SECTEURS_EN : SECTEURS_FR;
  const NIVEAUX  = isEn ? NIVEAUX_EN  : NIVEAUX_FR;
  const DISPOS   = isEn ? DISPOS_EN   : DISPOS_FR;

  const [form, setForm]     = useState<FormFields>(init);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [apiError, setApiError] = useState<ApiError>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [rgpd, setRgpd]     = useState(false);
  const [subscribeAlerts, setSubscribeAlerts] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const checkedFired = useRef(false);

  useEffect(() => {
    trackToolEvent("email_alerts", "alert_optin_shown", { metadata: { source_page: "spontaneous_application" } });
  }, []);

  function toggleSubscribeAlerts(checked: boolean) {
    setSubscribeAlerts(checked);
    if (checked && !checkedFired.current) {
      checkedFired.current = true;
      trackToolEvent("email_alerts", "alert_optin_checked", { metadata: { source_page: "spontaneous_application" } });
    }
  }

  function set(field: keyof FormFields, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }
  function toggleList(field: "sectors" | "languages", value: string) {
    setForm(f => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = t.firstNameErr;
    if (!form.lastName.trim())  e.lastName  = t.lastNameErr;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.emailErr;
    // International phone: optional leading +, then 7–20 digits/spaces/dashes/parens
    if (!/^\+?[\d\s\-().]{7,20}$/.test(form.phone.trim())) e.phone = t.phoneErr;
    if (!form.city)  e.city = t.cityErr;
    if (form.sectors.length === 0) e.sectors = t.sectorsErr;
    if (!form.position.trim())     e.position = t.positionErr;
    if (!form.experienceLevel)     e.experienceLevel = t.experienceErr;
    if (!form.availability)        e.availability = t.availabilityErr;
    if (form.about.length < 50)    e.about = t.aboutErr(form.about.length);
    if (!cvFile)                   e.cv = t.cvErr;
    else if (cvFile.type !== "application/pdf" && !cvFile.name.endsWith(".pdf")) e.cv = t.cvFmtErr;
    else if (cvFile.size > 5 * 1024 * 1024) e.cv = t.cvSizeErr;
    if (!rgpd) e.rgpd = t.rgpdErr;
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus("loading");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(item => fd.append(k, item));
        else fd.append(k, v);
      });
      if (cvFile) fd.append("cv", cvFile);
      fd.append("subscribeAlerts", subscribeAlerts ? "true" : "false");
      if (subscribeAlerts) fd.append("alertLanguage", locale);
      const res = await fetch("/api/candidates/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Erreur serveur";
        console.error("[postuler] API error:", msg);
        setApiError(msg);
        throw new Error(msg);
      }
      setStatus("success");
    } catch (err) {
      console.error("[postuler] submit error:", err);
      setStatus("error");
    }
  }

  const inputCls = (field: keyof Errors) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
    }`;

  // ── Success screen ───────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center bg-white rounded-2xl border border-green-100 shadow-xl p-10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t.successTitle}</h2>
          <p className="text-gray-500 mb-6">{t.successMsg(form.firstName)}</p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors mb-3"
          >
            {t.waBtn}
          </a>
          <p className="text-xs text-gray-400 mb-5">{t.waSub}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/offres" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm text-center hover:bg-primary-dark transition-colors">
              {t.viewOffers}
            </Link>
            <Link href="/" className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm text-center hover:bg-gray-50 transition-colors">
              {t.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f8fafc] min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-[#1a47c8] to-[#0f3299] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/20">
            {t.badge}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{t.heroTitle}</h1>
          <p className="mt-3 text-blue-100 text-base max-w-xl mx-auto leading-relaxed">{t.heroSub}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-7">

            {/* First name + Last name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.firstName} <span className="text-red-500">{t.required}</span></label>
                <input type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inputCls("firstName")} placeholder={t.firstNamePh} />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.lastName} <span className="text-red-500">{t.required}</span></label>
                <input type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inputCls("lastName")} placeholder={t.lastNamePh} />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.email} <span className="text-red-500">{t.required}</span></label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls("email")} placeholder={t.emailPh} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.phone} <span className="text-red-500">{t.required}</span></label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls("phone")} placeholder={t.phonePh} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.city} <span className="text-red-500">{t.required}</span></label>
              <select value={form.city} onChange={e => set("city", e.target.value)} className={inputCls("city")}>
                <option value="">{t.cityDefault}</option>
                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Sectors */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.sectors} <span className="text-red-500">{t.required}</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTEURS.map(s => (
                  <label key={s} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm transition-colors ${
                    form.sectors.includes(s) ? "border-primary bg-primary/5 text-primary font-medium" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input type="checkbox" className="sr-only" checked={form.sectors.includes(s)} onChange={() => toggleList("sectors", s)} />
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-white text-xs ${form.sectors.includes(s) ? "bg-primary border-primary" : "border-gray-300"}`}>
                      {form.sectors.includes(s) && "✓"}
                    </span>
                    {s}
                  </label>
                ))}
              </div>
              {errors.sectors && <p className="text-red-500 text-xs mt-1">{errors.sectors}</p>}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.position} <span className="text-red-500">{t.required}</span></label>
              <input type="text" value={form.position} onChange={e => set("position", e.target.value)} className={inputCls("position")} placeholder={t.positionPh} />
              {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.experience} <span className="text-red-500">{t.required}</span></label>
              <div className="flex flex-wrap gap-2">
                {NIVEAUX.map(n => (
                  <label key={n.value} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm transition-colors ${
                    form.experienceLevel === n.value ? "border-primary bg-primary/5 text-primary font-semibold" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input type="radio" name="experienceLevel" className="sr-only" value={n.value} checked={form.experienceLevel === n.value} onChange={() => set("experienceLevel", n.value)} />
                    {n.label}
                  </label>
                ))}
              </div>
              {errors.experienceLevel && <p className="text-red-500 text-xs mt-1">{errors.experienceLevel}</p>}
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.availability} <span className="text-red-500">{t.required}</span></label>
              <select value={form.availability} onChange={e => set("availability", e.target.value)} className={inputCls("availability")}>
                <option value="">{t.availabilityDefault}</option>
                {DISPOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.availability && <p className="text-red-500 text-xs mt-1">{errors.availability}</p>}
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.languages}</label>
              <div className="flex flex-wrap gap-2">
                {LANGUES.map(l => (
                  <label key={l} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer text-sm transition-colors ${
                    form.languages.includes(l) ? "border-primary bg-primary/5 text-primary font-medium" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input type="checkbox" className="sr-only" checked={form.languages.includes(l)} onChange={() => toggleList("languages", l)} />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t.linkedin} <span className="text-gray-400 font-normal">{t.linkedinOpt}</span>
              </label>
              <input type="url" value={form.linkedin} onChange={e => set("linkedin", e.target.value)} className={inputCls("linkedin")} placeholder={t.linkedinPh} />
            </div>

            {/* About */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t.about} <span className="text-red-500">{t.required}</span>
                <span className={`ml-2 text-xs font-normal ${form.about.length < 50 ? "text-gray-400" : "text-green-600"}`}>
                  {form.about.length}/500
                </span>
              </label>
              <textarea
                value={form.about}
                onChange={e => { if (e.target.value.length <= 500) set("about", e.target.value); }}
                rows={4}
                className={inputCls("about")}
                placeholder={t.aboutPh}
              />
              {errors.about && <p className="text-red-500 text-xs mt-1">{errors.about}</p>}
            </div>

            {/* CV Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.cv} <span className="text-red-500">{t.required}</span></label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  errors.cv ? "border-red-400 bg-red-50" : cvFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-primary hover:bg-primary/5"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0] || null;
                    setCvFile(f);
                    setErrors(err => ({ ...err, cv: undefined }));
                  }}
                />
                {cvFile ? (
                  <div className="text-green-700">
                    <p className="font-semibold">✅ {cvFile.name}</p>
                    <p className="text-xs mt-1">{(cvFile.size / 1024 / 1024).toFixed(2)} Mo — {isEn ? "Click to change" : "Cliquez pour changer"}</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <p className="text-2xl mb-2">📄</p>
                    <p className="text-sm">{t.cvPh}</p>
                    <p className="text-xs mt-1">{t.cvSub}</p>
                  </div>
                )}
              </div>
              {errors.cv && <p className="text-red-500 text-xs mt-1">{errors.cv}</p>}
            </div>

            {/* RGPD */}
            <div>
              <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-colors ${errors.rgpd ? "border-red-300 bg-red-50" : "border-gray-100 hover:border-gray-200"}`}>
                <div
                  className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${rgpd ? "bg-primary border-primary" : "border-gray-300"}`}
                  onClick={() => { setRgpd(!rgpd); setErrors(e => ({ ...e, rgpd: undefined })); }}
                >
                  {rgpd && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-xs text-gray-600 leading-relaxed">
                  {t.rgpd}{" "}
                  <a href="mailto:contact@interactjob.ma" className="text-primary hover:underline">contact@interactjob.ma</a>
                </span>
              </label>
              {errors.rgpd && <p className="text-red-500 text-xs mt-1">{errors.rgpd}</p>}
            </div>

            {/* Alert opt-in */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div
                  className="w-5 h-5 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors"
                  style={subscribeAlerts ? { background: "#00C2CB", borderColor: "#00C2CB" } : { borderColor: "#D1D5DB" }}
                  onClick={() => toggleSubscribeAlerts(!subscribeAlerts)}
                >
                  {subscribeAlerts && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm text-gray-800">
                  {t.alertOptinLabel}
                  <span className="block text-xs mt-0.5" style={{ color: "#6B8CAE" }}>{t.alertOptinHelper}</span>
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {status === "loading" ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t.sending}
                  </>
                ) : t.submit}
              </button>

              {status === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">
                  {apiError
                    ? <><strong>{apiError}</strong><br/><span className="text-xs mt-1 block text-red-500">Si le problème persiste, écrivez à <a href="mailto:contact@interactjob.ma" className="font-semibold underline">contact@interactjob.ma</a></span></>
                    : <>{t.serverErr}{" "}<a href="mailto:contact@interactjob.ma" className="font-semibold underline">contact@interactjob.ma</a></>
                  }
                </div>
              )}

              <div className="text-center pt-2">
                <p className="text-xs text-gray-400 mb-2">{isEn ? "Or receive offers directly:" : "Ou recevez les offres directement :"}</p>
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#25D366] hover:text-green-600 transition-colors"
                >
                  {t.waAlt}
                </a>
              </div>
            </div>
          </div>
        </form>

        {/* Reassurance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {t.cards.map(card => (
            <div key={card.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-3xl mb-2">{card.icon}</div>
              <p className="font-bold text-gray-900 text-sm mb-1">{card.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
