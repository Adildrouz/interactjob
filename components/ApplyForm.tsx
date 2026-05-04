"use client";
import { useState } from "react";
import Link from "next/link";

interface Props {
  jobTitle: string;
  company: string;
}

export default function ApplyForm({ jobTitle, company }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [cv, setCv] = useState<File | null>(null);

  if (submitted) {
    return (
      <div className="bg-accent-light border border-accent rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-bold text-gray-900 text-lg">Candidature envoyée !</h3>
        <p className="text-gray-600 mt-2 text-sm">
          Votre candidature pour <strong>{jobTitle}</strong> chez{" "}
          <strong>{company}</strong> a bien été transmise. Bonne chance !
        </p>
        <Link
          href="/offres"
          className="inline-block mt-5 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
        >
          ← Voir d&apos;autres offres
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            placeholder="Votre nom complet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="email"
            placeholder="vous@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        <input
          type="tel"
          placeholder="+212 6XX XXX XXX"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CV (PDF ou Word) <span className="text-red-500">*</span>
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
            <div className="flex items-center justify-center gap-2 text-accent">
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
                Glissez votre CV ou <span className="text-primary font-medium">parcourez</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — max 5 Mo</p>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lettre de motivation
        </label>
        <textarea
          rows={4}
          placeholder="Présentez-vous brièvement et expliquez votre motivation..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors text-sm"
      >
        Envoyer ma candidature
      </button>

      <p className="text-xs text-gray-400 text-center">
        En soumettant, vos données seront transmises à <strong>{company}</strong>.
      </p>
    </form>
  );
}
