"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trackToolEvent } from "@/lib/trackToolEvent";

interface Props {
  jobTitle: string;
  company: string;
  jobId?: string;
  isDirect?: boolean;
  sourceUrl?: string;
  sourceName?: string;
  sector?: string;
  city?: string;
}

export default function ApplyForm({ jobTitle, company, jobId, isDirect, sourceUrl, sourceName, sector, city }: Props) {
  const t = useTranslations("applyForm");
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", message: "" });
  const [cv, setCv] = useState<File | null>(null);

  const [subscribeAlerts, setSubscribeAlerts] = useState(false);
  const [alertSecteur, setAlertSecteur] = useState(sector || "");
  const [alertVille, setAlertVille] = useState(city || "");
  const checkedFired = useRef(false);

  useEffect(() => {
    trackToolEvent("email_alerts", "alert_optin_shown", { metadata: { source_page: "application_form" } });
  }, []);

  function handleSubscribeToggle(checked: boolean) {
    setSubscribeAlerts(checked);
    if (checked && !checkedFired.current) {
      checkedFired.current = true;
      trackToolEvent("email_alerts", "alert_optin_checked", { metadata: { source_page: "application_form" } });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // All jobs go through the real pipeline: MongoDB + CV + emails via /api/apply.
    // Aggregated jobs without an employer email are still stored and forwarded to the admin.
    setSending(true);
    try {
      const fd = new FormData();
      fd.set("jobId", jobId || "");
      fd.set("jobTitle", jobTitle);
      fd.set("company", company);
      fd.set("applicantName", form.name);
      fd.set("applicantEmail", form.email);
      if (form.phone) fd.set("applicantPhone", form.phone);
      if (form.city) fd.set("applicantCity", form.city);
      if (form.message) fd.set("coverLetter", form.message);
      if (cv) fd.set("cv", cv);
      fd.set("subscribeAlerts", subscribeAlerts ? "true" : "false");
      if (subscribeAlerts) {
        if (alertSecteur) fd.set("alertSecteur", alertSecteur);
        if (alertVille) fd.set("alertVille", alertVille);
        fd.set("alertLanguage", locale);
      }

      const res = await fetch("/api/apply", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erreur lors de l'envoi");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Erreur réseau — réessayez.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "#F0F8FF", border: "1px solid #00C2CB" }}>
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-lg" style={{ color: "#001F4D" }}>
          {isDirect ? "Candidature envoyée ✓" : t("successTitle")}
        </h3>
        <p className="text-gray-600 mt-2 text-sm">
          {t("successDesc1")} <strong>{jobTitle}</strong> {t("successDesc2")}{" "}
          <strong>{company}</strong> {t("successDesc3")}
        </p>
        {!isDirect && sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 mt-5 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Maximisez vos chances — postulez aussi sur {sourceName || "le site d'origine"} ↗
          </a>
        )}
        <Link
          href="/offres"
          className="inline-block mt-5 text-sm font-medium transition-colors"
          style={{ color: "#00C2CB" }}
        >
          {t("backToOffers")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("nameLabel")} <span className="text-red-500">{t("required")}</span>
          </label>
          <input
            required
            type="text"
            placeholder={t("namePlaceholder")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("emailLabel")} <span className="text-red-500">{t("required")}</span>
          </label>
          <input
            required
            type="email"
            placeholder={t("emailPlaceholder")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("phoneLabel")}</label>
          <input
            type="tel"
            placeholder={t("phonePlaceholder")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("cityLabel")}</label>
          <input
            type="text"
            placeholder={t("cityPlaceholder")}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("cvLabel")} <span className="text-red-500">{t("required")}</span>
        </label>
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => document.getElementById("cv-upload")?.click()}
        >
          <input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            className="hidden"
            onChange={(e) => setCv(e.target.files?.[0] ?? null)}
          />
          {cv ? (
            <div className="flex items-center justify-center gap-2" style={{ color: "#00C2CB" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{cv.name}</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">
                {t("cvDrag")} <span className="text-primary font-medium">{t("cvBrowse")}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("cvInfo")}</p>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("coverLabel")}</label>
        <textarea
          rows={4}
          placeholder={t("coverPlaceholder")}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
        />
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            className="w-5 h-5 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors"
            style={subscribeAlerts ? { background: "#00C2CB", borderColor: "#00C2CB" } : { borderColor: "#D1D5DB" }}
            onClick={() => handleSubscribeToggle(!subscribeAlerts)}
          >
            {subscribeAlerts && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-sm text-gray-800">
            {t("alertOptinLabel")}
            <span className="block text-xs mt-0.5" style={{ color: "#6B8CAE" }}>{t("alertOptinHelper")}</span>
          </span>
        </label>

        {subscribeAlerts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pl-8">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("alertOptinSectorLabel")}</label>
              <input
                type="text"
                value={alertSecteur}
                onChange={(e) => setAlertSecteur(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("alertOptinCityLabel")}</label>
              <input
                type="text"
                value={alertVille}
                onChange={(e) => setAlertVille(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full text-white py-3 rounded-xl font-semibold transition-colors text-sm disabled:opacity-60"
        style={{ background: "#00347A" }}
        onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = "#00C2CB"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#00347A"; }}
      >
        {sending ? "Envoi en cours…" : t("submitButton")}
      </button>

      <p className="text-xs text-gray-400 text-center">
        {t("privacyPrefix")} <strong>{company}</strong>.
      </p>
    </form>
  );
}
