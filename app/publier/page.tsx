"use client";
import { useState } from "react";
import Link from "next/link";

const sectors = ["IT", "Finance", "Hôtellerie", "RH", "Administratif", "Commerce", "Marketing", "Juridique", "Logistique", "Autre"];
const contractTypes = ["CDI", "CDD", "Stage", "Freelance", "Alternance"];
const cities = ["Casablanca", "Rabat", "Marrakech", "Fès", "Agadir", "Tanger", "Meknès", "Khouribga", "Oujda", "Tétouan", "Autre"];

const plans = [
  {
    id: "gratuit",
    name: "Offre Standard",
    price: "Gratuit",
    description: "Publiez votre offre visiblement dans notre catalogue.",
    features: [
      "Publication pendant 30 jours",
      "Visible par tous les candidats",
      "Formulaire de candidature intégré",
      "Statistiques de vues de base",
    ],
    cta: "Publier gratuitement",
    highlight: false,
  },
  {
    id: "sponsorise",
    name: "Offre Sponsorisée",
    price: "990 MAD",
    period: "/ 30 jours",
    description: "Maximisez votre visibilité et recrutez plus vite.",
    features: [
      "Mise en avant en tête de liste",
      "Badge « Sponsorisé » vert visible",
      "Bordure verte distinctive",
      "Diffusion sur notre LinkedIn (18K+)",
      "Publication pendant 45 jours",
      "Statistiques avancées",
      "Support prioritaire",
    ],
    cta: "Sponsoriser mon offre",
    highlight: true,
  },
];

export default function PublierPage() {
  const [submitted, setSubmitted] = useState(false);
  const [plan, setPlan] = useState("gratuit");
  const [form, setForm] = useState({
    title: "",
    company: "",
    city: "",
    sector: "",
    contractType: "",
    description: "",
    requirements: "",
    salary: "",
    contactEmail: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Offre soumise avec succès !</h2>
          <p className="text-gray-500 mt-3 text-sm">
            Votre offre <strong>&ldquo;{form.title}&rdquo;</strong> chez <strong>{form.company}</strong> a été reçue.
            Notre équipe la validera dans les 24h.
          </p>
          {plan === "sponsorise" && (
            <div className="mt-4 bg-accent-light border border-accent rounded-xl p-4 text-sm text-accent-dark font-medium">
              ✨ Vous avez choisi l&apos;offre sponsorisée. Notre équipe vous contactera pour le règlement.
            </div>
          )}
          <div className="flex gap-3 mt-6 justify-center">
            <Link
              href="/offres"
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Voir les offres
            </Link>
            <button
              onClick={() => { setSubmitted(false); setForm({ title: "", company: "", city: "", sector: "", contractType: "", description: "", requirements: "", salary: "", contactEmail: "" }); }}
              className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Publier une autre offre
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Publiez votre offre d&apos;emploi</h1>
        <p className="text-gray-500 mt-2">
          Atteignez des milliers de candidats qualifiés à travers tout le Maroc
        </p>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p.id)}
            className={`text-left rounded-2xl border-2 p-6 transition-all ${
              plan === p.id
                ? p.highlight
                  ? "border-accent bg-accent-light"
                  : "border-primary bg-primary-light"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                {p.highlight && (
                  <span className="text-xs font-bold text-white bg-accent px-2.5 py-0.5 rounded-full mb-2 inline-block">
                    RECOMMANDÉ
                  </span>
                )}
                <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                plan === p.id
                  ? p.highlight ? "border-accent bg-accent" : "border-primary bg-primary"
                  : "border-gray-300"
              }`}>
                {plan === p.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">{p.description}</p>
            <div className="text-2xl font-bold text-gray-900">
              {p.price}
              {p.period && <span className="text-sm font-normal text-gray-500">{p.period}</span>}
            </div>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className={`w-4 h-4 flex-shrink-0 ${p.highlight ? "text-accent" : "text-primary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Détails de l&apos;offre</h2>

        <div className="space-y-5">
          {/* Title + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Intitulé du poste <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="title"
                type="text"
                placeholder="ex : Développeur React Senior"
                value={form.title}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom de l&apos;entreprise <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="company"
                type="text"
                placeholder="ex : OCP Group"
                value={form.company}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* City + Sector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ville <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
              >
                <option value="">Sélectionner une ville</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Secteur d&apos;activité <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="sector"
                value={form.sector}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
              >
                <option value="">Sélectionner un secteur</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Contract + Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type de contrat <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {contractTypes.map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => setForm({ ...form, contractType: ct })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      form.contractType === ct
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fourchette salariale (optionnel)
              </label>
              <input
                name="salary"
                type="text"
                placeholder="ex : 8 000 – 12 000 MAD/mois"
                value={form.salary}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description du poste <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              name="description"
              rows={6}
              placeholder="Décrivez le poste, les missions et le contexte de l'entreprise..."
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Profil recherché <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              name="requirements"
              rows={4}
              placeholder="Listez les compétences et qualifications requises (une par ligne)..."
              value={form.requirements}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            />
          </div>

          {/* Contact email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email de contact RH <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="contactEmail"
              type="email"
              placeholder="rh@votre-entreprise.ma"
              value={form.contactEmail}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Cet email recevra les candidatures. Il ne sera pas affiché publiquement.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className={`mt-8 rounded-xl p-5 border ${plan === "sponsorise" ? "bg-accent-light border-accent" : "bg-primary-light border-primary/20"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {plan === "sponsorise" ? "✨ Offre Sponsorisée" : "📋 Offre Standard"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {plan === "sponsorise"
                  ? "Votre offre sera mise en avant et partagée sur LinkedIn."
                  : "Votre offre sera publiée dans le catalogue pendant 30 jours."}
              </p>
            </div>
            <span className={`text-xl font-bold ${plan === "sponsorise" ? "text-accent" : "text-primary"}`}>
              {plan === "sponsorise" ? "990 MAD" : "Gratuit"}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full mt-5 py-3.5 rounded-xl font-bold text-white text-sm transition-colors ${
            plan === "sponsorise"
              ? "bg-accent hover:bg-accent-dark"
              : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {plan === "sponsorise" ? "✨ Sponsoriser et publier mon offre" : "Publier mon offre gratuitement"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          En soumettant, vous acceptez nos{" "}
          <Link href="#" className="text-primary hover:underline">conditions d&apos;utilisation</Link>.
          Les offres sont vérifiées avant publication.
        </p>
      </form>
    </div>
  );
}
