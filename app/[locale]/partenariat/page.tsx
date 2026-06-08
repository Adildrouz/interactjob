"use client";
import { useState } from "react";
import { Link } from "@/i18n/routing";

const COMPANY_SIZES = [
  "1–10 employés",
  "11–50 employés",
  "51–200 employés",
  "201–500 employés",
  "+500 employés",
];

const NEEDS_LIST = [
  "Recrutement cadres & dirigeants",
  "Recrutement volume / masse",
  "Chasse de têtes (Executive search)",
  "Externalisation RH (RPO)",
  "Gestion de talent pool",
  "Assessment & tests de personnalité",
  "Audit RH & conseil",
  "Autre",
];

const BUDGET_OPTIONS = [
  "Moins de 5 000 MAD/mois",
  "5 000 – 15 000 MAD/mois",
  "15 000 – 30 000 MAD/mois",
  "+30 000 MAD/mois",
  "À définir ensemble",
];

const EMPTY = {
  company: "", contactName: "", email: "", phone: "",
  companySize: "", needs: "", budget: "", message: "",
};

export default function PartenariatPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.company || !form.contactName || !form.email || !form.needs) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/partenariat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json();
        setError(d.error || "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Demande envoyée !</h2>
          <p className="text-gray-500 mt-3 text-sm">
            Merci {form.contactName}. Notre équipe reviendra vers vous sous 48h pour discuter de votre projet de recrutement.
          </p>
          <Link href="/" className="mt-6 inline-block bg-[#0A2D6E] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#0d3a8e] transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-[#00BCD4] uppercase tracking-widest">Entreprises</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Partenariat Recrutement</h1>
        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
          Confiez-nous votre recrutement. InteractJob accompagne les entreprises marocaines dans leur stratégie RH grâce à un réseau de candidats qualifiés et des outils d'évaluation avancés.
        </p>
      </div>

      {/* Value props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: "🎯", title: "Matching précis", desc: "Candidats pré-qualifiés correspondant à votre besoin métier" },
          { icon: "⚡", title: "Rapidité", desc: "Shortlist de candidats en moins de 72h pour vos postes urgents" },
          { icon: "📊", title: "Évaluation complète", desc: "Tests de personnalité et assessment pour sécuriser vos recrutements" },
        ].map(v => (
          <div key={v.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">{v.icon}</div>
            <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
            <p className="text-sm text-gray-500">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Votre demande de partenariat</h2>

        <form onSubmit={submit} className="space-y-5">
          {/* Company info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom de l'entreprise <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={e => set("company", e.target.value)}
                placeholder="Ex : Groupe Saham, OCP, StartupX…"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Votre nom & prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.contactName}
                onChange={e => set("contactName", e.target.value)}
                placeholder="Prénom NOM"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email professionnel <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="vous@entreprise.ma"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="+212 6XX XXX XXX"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Taille de l'entreprise</label>
              <select
                value={form.companySize}
                onChange={e => set("companySize", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              >
                <option value="">Choisir…</option>
                {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget mensuel indicatif</label>
              <select
                value={form.budget}
                onChange={e => set("budget", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              >
                <option value="">Choisir…</option>
                {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Besoins en recrutement <span className="text-red-500">*</span>
            </label>
            <select
              value={form.needs}
              onChange={e => set("needs", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              required
            >
              <option value="">Sélectionner le type de service…</option>
              {NEEDS_LIST.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Décrivez votre projet
            </label>
            <textarea
              value={form.message}
              onChange={e => set("message", e.target.value)}
              rows={5}
              placeholder="Postes à pourvoir, délais souhaités, secteur d'activité, contraintes particulières…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-y"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#0A2D6E] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0d3a8e] transition-colors disabled:opacity-50"
            >
              {loading ? "Envoi en cours…" : "Envoyer ma demande →"}
            </button>
            <Link
              href="/contact"
              className="text-center px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Nous contacter directement
            </Link>
          </div>

          <p className="text-xs text-gray-400 text-center">
            En soumettant ce formulaire, vous acceptez d'être contacté par l'équipe InteractJob concernant votre demande.
          </p>
        </form>
      </div>
    </div>
  );
}
