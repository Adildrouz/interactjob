"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import { CityOptions, SectorOptions } from "@/components/MoroccoSelectOptions";

const contractTypes = ["CDI", "CDD", "Stage", "Freelance", "Alternance"];

const EMPTY_FORM = { title: "", company: "", city: "", sector: "", sectorOther: "", contractType: "", description: "", requirements: "", salary: "", contactEmail: "" };

export default function PublierPage() {
  const t = useTranslations("publier");
  const [submitted, setSubmitted]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [payError, setPayError]     = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          featured: false,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        setPayError(error.error || "Une erreur est survenue lors de la soumission.");
        return;
      }
      setSubmitted(true);
    } catch (error) {
      setPayError("Erreur réseau lors de la soumission.");
      console.error("Submit error:", error);
    }
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
          <h2 className="text-2xl font-bold text-gray-900">{t("successTitle")}</h2>
          <p className="text-gray-500 mt-3 text-sm">{t("successDesc")}</p>
          <div className="flex gap-3 mt-6 justify-center">
            <Link href="/offres" className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
              {t("backToOffers")}
            </Link>
            <button
              onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); }}
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

        {/* Publication gratuite — la visibilite premium passe par le contact direct */}
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary-light p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">{t("freeNoticeTitle")}</p>
            <p className="text-sm text-gray-600 mt-0.5">{t("freeNoticeBody")}</p>
          </div>
          <Link href={"/recruteurs" as any} className="shrink-0 text-sm font-bold text-primary hover:underline">
            {t("freeNoticeCta")}
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleFreeSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
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
                  <CityOptions />
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("sectorLabel")} <span className="text-red-500">{t("required")}</span>
                </label>
                <select required name="sector" value={form.sector} onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white">
                  <option value="">—</option>
                  <SectorOptions />
                </select>
              </div>
            </div>

            {form.sector === "Autre" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Précisez le métier ou secteur <span className="text-red-500">*</span>
                </label>
                <input required type="text" name="sectorOther" value={form.sectorOther} onChange={handleChange}
                  placeholder="Ex: Sécurité privée, Esthétique, Import-export…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            )}

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

          {/* Error message for free submission */}
          {payError && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {payError}
            </div>
          )}

          {/* Submit zone */}
          <div className="mt-6">
            <button type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-primary hover:bg-primary-dark transition-colors">
              {t("submitButton")}
            </button>
          </div>
        </form>
    </div>
  );
}
