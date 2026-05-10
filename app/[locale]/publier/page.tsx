"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const sectors = ["IT", "Finance", "Hôtellerie", "RH", "Administratif", "Commerce", "Marketing", "Juridique", "Logistique", "Autre"];
const contractTypes = ["CDI", "CDD", "Stage", "Freelance", "Alternance"];
const cities = ["Casablanca", "Rabat", "Marrakech", "Fès", "Agadir", "Tanger", "Meknès", "Khouribga", "Oujda", "Tétouan", "Essaouira", "Autre"];

export default function PublierPage() {
  const t = useTranslations("publier");
  const [submitted, setSubmitted] = useState(false);
  const [plan, setPlan] = useState("gratuit");
  const [form, setForm] = useState({
    title: "", company: "", city: "", sector: "",
    contractType: "", description: "", requirements: "", salary: "", contactEmail: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const plans = [
    {
      id: "gratuit",
      name: t("planStandard"),
      price: t("planFree"),
      description: t("planStandardDesc"),
      features: [t("formFeature1"), t("formFeature2"), t("formFeature3"), t("formFeature4")],
      cta: t("planStandardCta"),
      highlight: false,
    },
    {
      id: "sponsorise",
      name: t("planSponsored"),
      price: t("planPrice"),
      period: t("planPeriod"),
      description: t("planSponsoredDesc"),
      features: [t("sponsFeature1"), t("sponsFeature2"), t("sponsFeature3"), t("sponsFeature4"), t("sponsFeature5"), t("sponsFeature6"), t("sponsFeature7")],
      cta: t("planSponsoredCta"),
      highlight: true,
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t("successTitle")}</h2>
          <p className="text-gray-500 mt-3 text-sm">{t("successDesc")}</p>
          {plan === "sponsorise" && (
            <div className="mt-4 bg-accent-light border border-accent rounded-xl p-4 text-sm text-accent-dark font-medium">
              ✨ {t("sponsFeature4")}
            </div>
          )}
          <div className="flex gap-3 mt-6 justify-center">
            <Link
              href="/offres"
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              {t("backToOffers")}
            </Link>
            <button
              onClick={() => { setSubmitted(false); setForm({ title: "", company: "", city: "", sector: "", contractType: "", description: "", requirements: "", salary: "", contactEmail: "" }); }}
              className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {t("planStandardCta")}
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
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-2">{t("subtitle")}</p>
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
                    {t("popular").toUpperCase()}
                  </span>
                )}
                <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                plan === p.id
                  ? p.highlight ? "border-accent bg-accent" : "border-primary bg-primary"
                  : "border-gray-300"
              }`}>
                {plan === p.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">{p.description}</p>
            <div className="text-2xl font-bold text-gray-900">
              {p.price}
              {"period" in p && p.period && <span className="text-sm font-normal text-gray-500">{p.period}</span>}
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
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t("formTitle")}</h2>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("titleLabel")} <span className="text-red-500">{t("required")}</span>
              </label>
              <input required name="title" type="text" placeholder={t("titlePlaceholder")} value={form.title} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("companyLabel")} <span className="text-red-500">{t("required")}</span>
              </label>
              <input required name="company" type="text" placeholder={t("companyPlaceholder")} value={form.company} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("cityLabel")} <span className="text-red-500">{t("required")}</span>
              </label>
              <select required name="city" value={form.city} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white">
                <option value="">—</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("sectorLabel")} <span className="text-red-500">{t("required")}</span>
              </label>
              <select required name="sector" value={form.sector} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white">
                <option value="">—</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("contractLabel")} <span className="text-red-500">{t("required")}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {contractTypes.map((ct) => (
                  <button key={ct} type="button" onClick={() => setForm({ ...form, contractType: ct })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      form.contractType === ct
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                    }`}>
                    {ct}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("salaryLabel")}</label>
              <input name="salary" type="text" placeholder={t("salaryPlaceholder")} value={form.salary} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("descLabel")} <span className="text-red-500">{t("required")}</span>
            </label>
            <textarea required name="description" rows={6} placeholder={t("descPlaceholder")} value={form.description} onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("reqLabel")} <span className="text-red-500">{t("required")}</span>
            </label>
            <textarea required name="requirements" rows={4} placeholder={t("reqPlaceholder")} value={form.requirements} onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("emailLabel")} <span className="text-red-500">{t("required")}</span>
            </label>
            <input required name="contactEmail" type="email" placeholder={t("emailPlaceholder")} value={form.contactEmail} onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
          </div>
        </div>

        <button type="submit"
          className={`w-full mt-6 py-3.5 rounded-xl font-bold text-white text-sm transition-colors ${
            plan === "sponsorise" ? "bg-accent hover:bg-accent-dark" : "bg-primary hover:bg-primary-dark"
          }`}>
          {t("submitButton")}
        </button>
      </form>
    </div>
  );
}
