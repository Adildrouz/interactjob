"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SectorOptions } from "@/components/MoroccoSelectOptions";
import { Link } from "@/i18n/routing";

export default function RecruiterLeadForm() {
  const t = useTranslations("recruteurs");
  const locale = useLocale();
  const [form, setForm] = useState({ companyName: "", sector: "", sectorOther: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");
  const copy = locale === "ar" ? {
    candidate: "هل تبحث عن عمل؟ أرسل ترشيحك من هنا.", publish: "انشر إعلانك مجاناً", length: "الحد الأقصى 30 000 حرف. أرسل النص الأطول إلى contact@interactjob.ma.",
  } : locale === "en" ? {
    candidate: "Looking for a job? Submit your application here.", publish: "Post a job for free", length: "Maximum 30,000 characters. Email longer descriptions to contact@interactjob.ma.",
  } : {
    candidate: "Vous cherchez un emploi ? Déposez votre candidature ici.", publish: "Publier une annonce gratuitement", length: "30 000 caractères maximum. Envoyez les descriptifs plus longs à contact@interactjob.ma.",
  };

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.sector === "Autre" && !form.sectorOther.trim()) {
      setError(t("sectorOtherRequired"));
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/recruteurs/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale, website }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "error");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error && err.message !== "error" ? err.message : t("errorGeneric"));
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-bold text-emerald-800 mb-1">{t("successTitle")}</h3>
        <p className="text-sm text-emerald-700">{t("successBody")}</p>
        <Link href="/publier" className="mt-4 inline-block rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white">{copy.publish}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={website} onChange={e => setWebsite(e.target.value)} />
      <Link href="/postuler" className="block rounded-lg bg-blue-50 p-3 text-sm text-primary underline">{copy.candidate}</Link>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("companyLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text" required value={form.companyName}
          onChange={(e) => set("companyName", e.target.value)}
          placeholder={t("companyPlaceholder")}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("sectorLabel")}</label>
        <select
          value={form.sector} onChange={(e) => set("sector", e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
        >
          <option value="">—</option>
          <SectorOptions locale={locale} />
        </select>
      </div>

      {form.sector === "Autre" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("sectorOtherLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text" required value={form.sectorOther}
            onChange={(e) => set("sectorOther", e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("emailLabel")} <span className="text-red-500">*</span>
        </label>
        <input
          type="email" required value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="rh@entreprise.ma"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("messageLabel")}</label>
        <textarea
          rows={6} maxLength={30000} value={form.message} aria-describedby="recruiter-message-limit"
          onChange={(e) => set("message", e.target.value)}
          placeholder={t("messagePlaceholder")}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
        />
        <p id="recruiter-message-limit" className="mt-1 text-xs text-gray-500">{form.message.length.toLocaleString(locale)} / 30 000 — {copy.length}</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit" disabled={status === "loading"}
        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {status === "loading" ? "…" : t("submit")}
      </button>
    </form>
  );
}
