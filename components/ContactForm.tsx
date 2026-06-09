"use client";

import { useState } from "react";

type Locale = "fr" | "en" | "ar";

const L: Record<Locale, Record<string, string>> = {
  fr: {
    heading: "Envoyez-nous un message",
    sub: "Remplissez le formulaire ci-dessous, nous vous répondons sous 24h.",
    name: "Nom complet",
    email: "Adresse email",
    subject: "Sujet",
    message: "Votre message",
    send: "Envoyer le message",
    sending: "Envoi en cours…",
    ok: "Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.",
    err: "Une erreur est survenue. Réessayez ou écrivez-nous à contact@interactjob.ma.",
    required: "Champs obligatoires",
  },
  en: {
    heading: "Send us a message",
    sub: "Fill in the form below, we reply within 24h.",
    name: "Full name",
    email: "Email address",
    subject: "Subject",
    message: "Your message",
    send: "Send message",
    sending: "Sending…",
    ok: "Thank you! Your message has been sent. We'll reply shortly.",
    err: "Something went wrong. Try again or email contact@interactjob.ma.",
    required: "Required fields",
  },
  ar: {
    heading: "أرسل لنا رسالة",
    sub: "املأ النموذج أدناه، نردّ خلال 24 ساعة.",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    subject: "الموضوع",
    message: "رسالتك",
    send: "إرسال الرسالة",
    sending: "جارٍ الإرسال…",
    ok: "شكراً! تم إرسال رسالتك وسنردّ عليك قريباً.",
    err: "حدث خطأ. أعد المحاولة أو راسلنا على contact@interactjob.ma.",
    required: "حقول إلزامية",
  },
};

export default function ContactForm({ locale = "fr" }: { locale?: Locale }) {
  const t = L[locale] ?? L.fr;
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("ok");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-semibold text-green-800">{t.ok}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-bold text-gray-900">{t.heading}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.sub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.name} *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.email} *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.subject}</label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t.message} *</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
        />
      </div>

      {status === "err" && <p className="text-sm text-red-600">{t.err}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-primary text-white font-bold py-3 rounded-xl text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {status === "sending" ? t.sending : t.send}
      </button>
      <p className="text-xs text-gray-400">* {t.required}</p>
    </form>
  );
}
