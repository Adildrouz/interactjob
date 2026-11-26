"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { trackToolEvent } from '@/lib/trackToolEvent';

import { CityOptions, SectorOptions } from "@/components/MoroccoSelectOptions";

const contractTypes = ["Non précisé", "CDI", "CDD", "Stage", "Freelance", "Alternance"];

const EMPTY_FORM = { title: "", company: "", city: "", sector: "", sectorOther: "", contractType: "Non précisé", description: "", requirements: "", salary: "", contactEmail: "" };
const DRAFT_KEY = 'ij_publication_draft';

export default function PublierPage() {
  const t = useTranslations("publier");
  const [submitted, setSubmitted]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [payError, setPayError]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const started = useRef(false);
  const submissionKey = useRef('');
  const errorRef = useRef<HTMLDivElement>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState(false);
  /* Browser-only draft hydration must happen after deterministic server markup. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    submissionKey.current = crypto.randomUUID();
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (saved?.form) {
        const clean = { ...EMPTY_FORM };
        for (const key of Object.keys(clean) as (keyof typeof clean)[]) {
          if (typeof saved.form[key] === 'string') clean[key] = saved.form[key];
        }
        setForm(clean);
        if (typeof saved.submissionKey === 'string') submissionKey.current = saved.submissionKey;
        setRestored(true);
      }
    } catch { /* Storage may be disabled; publication must still work. */ }
    setDraftReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!draftReady || submitted) return;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, submissionKey: submissionKey.current })); }
    catch { /* Do not block submission when session storage is unavailable. */ }
  }, [form, draftReady, submitted]);
  useEffect(() => {
    if (payError) { errorRef.current?.focus(); errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }, [payError]);
  useEffect(() => { trackToolEvent('recruiter_publication', 'view'); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (!started.current) { started.current = true; trackToolEvent('recruiter_publication', 'started'); }
    setForm(current => ({ ...current, [e.target.name]: e.target.value }));
  }

  async function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setPayError('');
    if (!form.contractType) { setPayError(t('missingContract')); return; }
    setSubmitting(true);
    trackToolEvent('recruiter_publication', 'attempt');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...form,
          submissionKey: submissionKey.current,
          featured: false,
        }),
      });
      if (!res.ok) {
        trackToolEvent('recruiter_publication', 'error');
        const error = await res.json().catch(() => null);
        setPayError(error?.error || t('submitError'));
        return;
      }
      const data = await res.json();
      if (!data.success || !data.reference) throw new Error('Missing submission confirmation');
      setReference(data.reference);
      setSubmitted(true);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* optional */ }
      trackToolEvent('recruiter_publication', 'success');
    } catch (error) {
      trackToolEvent('recruiter_publication', 'error');
      setPayError(error instanceof Error && error.name === 'AbortError' ? t('submitTimeout') : t('submitError'));
      console.error("Submit error:", error);
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
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
          <p className="mt-3 text-xs text-gray-500">{t('reference')}: {reference}</p>
          <div className="flex gap-3 mt-6 justify-center">
            <Link href="/offres" className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
              {t("backToOffers")}
            </Link>
            <button
              onClick={() => { setSubmitted(false); setReference(''); setForm(EMPTY_FORM); started.current = false; submissionKey.current = crypto.randomUUID(); setRestored(false); }}
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
          <p className="text-primary font-semibold mt-3">{t('noAccount')}</p>
          <p className="text-sm text-gray-600 mt-3">{t('candidateHint')} <Link href="/offres" className="underline font-semibold">{t('candidateCta')}</Link></p>
        </div>

        {/* Publication gratuite — la visibilite premium passe par le contact direct */}
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary-light p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">{t("freeNoticeTitle")}</p>
            <p className="text-sm text-gray-600 mt-0.5">{t("freeNoticeBody")}</p>
          </div>
          <Link href="/recruteurs" className="shrink-0 text-sm font-bold text-primary hover:underline">
            {t("freeNoticeCta")}
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleFreeSubmit}
          onInvalidCapture={e => {
            const field = e.target as HTMLInputElement;
            trackToolEvent('recruiter_publication', 'validation_error', { metadata: { field: field.name } });
            setPayError(t('invalidFields'));
          }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("formTitle")}</h2>
          {restored && <p role="status" className="mb-5 text-sm text-gray-600">{t('draftRestored')}</p>}
          {payError && (
            <div ref={errorRef} tabIndex={-1} role="alert" className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {payError}
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="publication-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("titleLabel")} <span className="text-red-500">{t("required")}</span>
                </label>
                <input required id="publication-title" name="title" type="text" placeholder={t("titlePlaceholder")} value={form.title} onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
              <div>
                <label htmlFor="publication-company" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("companyLabel")} <span className="text-red-500">{t("required")}</span>
                </label>
                <input required id="publication-company" name="company" type="text" placeholder={t("companyPlaceholder")} value={form.company} onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="publication-city" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("cityLabel")} <span className="text-red-500">{t("required")}</span>
                </label>
                <select required id="publication-city" name="city" value={form.city} onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white">
                  <option value="">—</option>
                  <CityOptions />
                </select>
              </div>
              <div>
                <label htmlFor="publication-sector" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("sectorLabel")} <span className="text-red-500">{t("required")}</span>
                </label>
                <select required id="publication-sector" name="sector" value={form.sector} onChange={handleChange}
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
                    <button key={ct} type="button" aria-pressed={form.contractType === ct} onClick={() => { if (!started.current) { started.current = true; trackToolEvent('recruiter_publication', 'started'); } setForm(current => ({ ...current, contractType: ct })); }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        form.contractType === ct
                          ? "bg-primary text-white border-primary"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                      }`}>
                      {ct === 'Non précisé' ? t('contractUndecided') : ct}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="publication-salary" className="block text-sm font-medium text-gray-700 mb-1.5">{t("salaryLabel")}</label>
                <input id="publication-salary" name="salary" type="text" placeholder={t("salaryPlaceholder")} value={form.salary} onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            <div>
              <label htmlFor="publication-description" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("descLabel")} <span className="text-red-500">{t("required")}</span>
              </label>
              <textarea required id="publication-description" name="description" rows={6} placeholder={t("descPlaceholder")} value={form.description} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" />
            </div>

            <div>
              <label htmlFor="publication-requirements" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("reqLabel")}
              </label>
              <textarea id="publication-requirements" name="requirements" rows={4} placeholder={t("reqPlaceholder")} value={form.requirements} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" />
            </div>

            <div>
              <label htmlFor="publication-contactEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("emailLabel")} <span className="text-red-500">{t("required")}</span>
              </label>
              <input required id="publication-contactEmail" name="contactEmail" type="email" placeholder={t("emailPlaceholder")} value={form.contactEmail} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-600">{t('helpNotice')} <a className="text-primary underline" href={`mailto:contact@interactjob.ma?subject=${encodeURIComponent(`Publication : ${form.title || 'offre d’emploi'}`)}&body=${encodeURIComponent(`Entreprise : ${form.company}\nPoste : ${form.title}\nVille : ${form.city}\nContrat : ${form.contractType}\nEmail : ${form.contactEmail}\nSalaire : ${form.salary}\n\n${form.description}\n\n${form.requirements}`)}`}>{t('emailFallback')}</a></p>

          {/* Submit zone */}
          <div className="mt-6">
            <button type="submit" disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50">
              {submitting ? t('submitting') : t("submitButton")}
            </button>
          </div>
        </form>
    </div>
  );
}
