"use client";
import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Link } from "@/i18n/routing";

const VILLES = [
  "Casablanca","Rabat","Marrakech","Agadir","Essaouira","Tanger","Fès","Meknès",
  "Oujda","Tétouan","Kénitra","Béni Mellal","El Jadida","Settat","Laâyoune","Dakhla","Autre",
];
const SECTEURS = [
  "Hôtellerie & Tourisme","IT & Digital","Ressources Humaines","Finance & Banque",
  "Commerce & Vente","Administratif","Marketing & Communication","Industrie & BTP",
  "Santé","Éducation","Autre",
];
const NIVEAUX = [
  { value: "Stage",           label: "Stage" },
  { value: "Junior",         label: "Junior (0–2 ans)" },
  { value: "Intermédiaire",  label: "Intermédiaire (3–5 ans)" },
  { value: "Senior",         label: "Senior (6–10 ans)" },
  { value: "Expert",         label: "Expert (10+ ans)" },
];
const DISPOS = ["Immédiate","Sous 1 mois","Sous 3 mois","À négocier"];
const LANGUES = ["Arabe","Français","Anglais","Espagnol","Italien","Allemand"];
const WA_URL  = "https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j";

type Status = "idle" | "loading" | "success" | "error";

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
  const [form, setForm]     = useState<FormFields>(init);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [rgpd, setRgpd]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!form.firstName.trim()) e.firstName = "Prénom requis";
    if (!form.lastName.trim())  e.lastName  = "Nom requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide";
    if (!/^(\+212|06|07)/.test(form.phone)) e.phone = "Doit commencer par +212, 06 ou 07";
    if (!form.city)  e.city = "Sélectionnez une ville";
    if (form.sectors.length === 0) e.sectors = "Sélectionnez au moins un secteur";
    if (!form.position.trim())     e.position = "Poste requis";
    if (!form.experienceLevel)     e.experienceLevel = "Sélectionnez un niveau";
    if (!form.availability)        e.availability = "Sélectionnez une disponibilité";
    if (form.about.length < 50)    e.about = `Minimum 50 caractères (${form.about.length}/50)`;
    if (!cvFile)                   e.cv = "CV PDF requis";
    else if (cvFile.type !== "application/pdf" && !cvFile.name.endsWith(".pdf")) e.cv = "Format PDF uniquement";
    else if (cvFile.size > 5 * 1024 * 1024) e.cv = "Fichier trop lourd (max 5 Mo)";
    if (!rgpd) e.rgpd = "Vous devez accepter les conditions";
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
      const res = await fetch("/api/candidates/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const inputCls = (field: keyof Errors) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
    }`;

  if (status === "success") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center bg-white rounded-2xl border border-green-100 shadow-xl p-10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Candidature reçue avec succès !</h2>
          <p className="text-gray-500 mb-6">
            Nous avons bien reçu votre profil <strong>{form.firstName}</strong>. Notre équipe vous contactera dès qu&apos;une opportunité correspond.
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors mb-3"
          >
            📲 Rejoindre la chaîne WhatsApp
          </a>
          <p className="text-xs text-gray-400 mb-5">Recevez les offres chaque matin directement sur WhatsApp</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/offres" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm text-center hover:bg-primary-dark transition-colors">
              Voir les offres du moment →
            </Link>
            <Link href="/" className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm text-center hover:bg-gray-50 transition-colors">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-[#1a47c8] to-[#0f3299] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/20">
            ✅ Gratuit · Confidentiel · Réponse sous 48h
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Candidature Spontanée — InteractJob.ma
          </h1>
          <p className="mt-3 text-blue-100 text-base max-w-xl mx-auto leading-relaxed">
            Soumettez votre profil et nous vous contacterons dès qu&apos;une opportunité correspond à vos compétences
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-7">

            {/* Prénom + Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                <input type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inputCls("firstName")} placeholder="Votre prénom" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                <input type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inputCls("lastName")} placeholder="Votre nom" />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email + Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls("email")} placeholder="vous@email.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone <span className="text-red-500">*</span></label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls("phone")} placeholder="+212 6XX XXX XXX" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville <span className="text-red-500">*</span></label>
              <select value={form.city} onChange={e => set("city", e.target.value)} className={inputCls("city")}>
                <option value="">Sélectionnez votre ville</option>
                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Secteurs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Secteur(s) visé(s) <span className="text-red-500">*</span></label>
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

            {/* Poste */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Poste recherché <span className="text-red-500">*</span></label>
              <input type="text" value={form.position} onChange={e => set("position", e.target.value)} className={inputCls("position")} placeholder="ex: Spa Manager, Développeur Full Stack, Responsable RH..." />
              {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
            </div>

            {/* Expérience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau d&apos;expérience <span className="text-red-500">*</span></label>
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

            {/* Disponibilité */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Disponibilité <span className="text-red-500">*</span></label>
              <select value={form.availability} onChange={e => set("availability", e.target.value)} className={inputCls("availability")}>
                <option value="">Sélectionnez votre disponibilité</option>
                {DISPOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.availability && <p className="text-red-500 text-xs mt-1">{errors.availability}</p>}
            </div>

            {/* Langues */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Langues parlées</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Profil LinkedIn <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="url" value={form.linkedin} onChange={e => set("linkedin", e.target.value)} className={inputCls("linkedin")} placeholder="https://linkedin.com/in/votre-profil" />
            </div>

            {/* À propos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                À propos de vous <span className="text-red-500">*</span>
                <span className={`ml-2 text-xs font-normal ${form.about.length < 50 ? "text-gray-400" : "text-green-600"}`}>
                  {form.about.length}/500 caractères
                </span>
              </label>
              <textarea
                value={form.about}
                onChange={e => { if (e.target.value.length <= 500) set("about", e.target.value); }}
                rows={4}
                className={inputCls("about")}
                placeholder="Présentez-vous brièvement : votre parcours, vos compétences clés, ce que vous recherchez..."
              />
              {errors.about && <p className="text-red-500 text-xs mt-1">{errors.about}</p>}
            </div>

            {/* CV Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">CV (PDF) <span className="text-red-500">*</span></label>
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
                    <p className="text-xs mt-1">{(cvFile.size / 1024 / 1024).toFixed(2)} Mo — Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <p className="text-2xl mb-2">📄</p>
                    <p className="text-sm">Cliquez pour uploader votre CV</p>
                    <p className="text-xs mt-1">PDF uniquement — max 5 Mo</p>
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
                  J&apos;accepte que mes données soient conservées par InteractJob.ma pour être contacté lors d&apos;opportunités correspondant à mon profil. Données supprimables sur simple demande à{" "}
                  <a href="mailto:contact@interactjob.ma" className="text-primary hover:underline">contact@interactjob.ma</a>
                </span>
              </label>
              {errors.rgpd && <p className="text-red-500 text-xs mt-1">{errors.rgpd}</p>}
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
                    Envoi en cours...
                  </>
                ) : "Envoyer ma candidature →"}
              </button>

              {status === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">
                  Une erreur est survenue. Veuillez réessayer ou envoyer votre CV à{" "}
                  <a href="mailto:candidatures@interactjob.ma" className="font-semibold underline">candidatures@interactjob.ma</a>
                </div>
              )}

              <div className="text-center pt-2">
                <p className="text-xs text-gray-400 mb-2">Ou recevez les offres directement :</p>
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#25D366] hover:text-green-600 transition-colors"
                >
                  📲 Rejoindre notre chaîne WhatsApp — Alertes emploi quotidiennes
                </a>
              </div>
            </div>
          </div>
        </form>

        {/* Reassurance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: "🔒", title: "Données confidentielles", desc: "Votre CV n'est jamais partagé sans votre accord explicite" },
            { icon: "⚡", title: "Réponse rapide", desc: "Nous vous contactons sous 48h si une opportunité correspond" },
            { icon: "🎯", title: "Gratuit pour toujours", desc: "Aucun frais, aucun abonnement pour les candidats" },
          ].map(card => (
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
