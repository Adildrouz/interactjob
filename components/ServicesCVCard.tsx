"use client";
import { useState } from "react";

const WA_PHONE = "212630960352";
const PAYPAL_URL = "https://paypal.me/drouzadil/18";

const WA_CASHPLUS =
  `https://wa.me/${WA_PHONE}?text=Bonjour%20Adil%2C%20je%20souhaite%20commander%20le%20service%20CV%20Professionnel%20%28199%20MAD%29.%20Je%20vais%20effectuer%20le%20paiement%20via%20CashPlus%2FWestern%20Union.%20Merci%20de%20m%27envoyer%20les%20instructions%20de%20paiement.`;

const WA_CIH =
  `https://wa.me/${WA_PHONE}?text=Bonjour%20Adil%2C%20je%20souhaite%20commander%20le%20service%20CV%20Professionnel%20%28199%20MAD%29.%20Je%20vais%20effectuer%20un%20virement%20bancaire%20CIH.%0A%0ARIB%20%3A%20230%20240%209445383211000600%2068%0AIBAN%20%3A%20MA64%202302%204094%204538%203211%200006%200068%0ASWIFT%20%3A%20CIHMMAMCA%0ABen%C3%A9ficiaire%20%3A%20MONSIEUR%20ADIL%20DROUZ%0AMontant%20%3A%20199%20MAD%0A%0AMerci%20de%20m%27envoyer%20la%20confirmation%20de%20virement%20par%20WhatsApp.`;

const FEATURES = [
  "Analyse complète de votre CV",
  "Rédaction 100% professionnelle",
  "Optimisation ATS garantie",
  "Mise en page moderne",
  "Livraison en 48h max",
  "1 révision incluse",
  "Format Word + PDF",
];

export default function ServicesCVCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Service Card ── */}
      <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-blue-100 shadow-2xl shadow-blue-100/60 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

        <div className="p-8">
          {/* Title row */}
          <div className="flex items-start gap-4 mb-6">
            <span className="text-5xl leading-none">📄</span>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-1">CV Professionnel</h3>
              <span className="inline-block text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Offre de lancement
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-7">
            <span className="text-xl text-gray-400 line-through font-medium">299 MAD</span>
            <span className="text-5xl font-extrabold text-blue-600">199 MAD</span>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => setOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-100 transition-all duration-200"
          >
            Commander — 199 MAD
          </button>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal panel */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Sticky header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-extrabold text-gray-900">
                Choisissez votre mode de paiement
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Option 1 — Carte / PayPal */}
              <div className="border-2 border-blue-100 rounded-2xl p-5 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Payer par carte (Visa / Mastercard)</p>
                    <p className="text-xs text-gray-500">Paiement sécurisé via PayPal</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3 pl-9">Maroc et international acceptés</p>
                <a
                  href={PAYPAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#0070ba] hover:bg-[#005ea6] text-white text-sm font-bold py-3 rounded-xl text-center transition-colors shadow-md shadow-blue-100"
                >
                  Payer 199 MAD par carte →
                </a>
              </div>

              {/* Option 2 — CashPlus / Western Union */}
              <div className="border-2 border-orange-100 rounded-2xl p-5 hover:border-orange-300 transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Payer en agence</p>
                    <p className="text-xs text-gray-500">CashPlus, Western Union, Wafacash</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3 pl-9">Disponible dans tout le Maroc</p>
                <a
                  href={WA_CASHPLUS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#25D366] hover:bg-[#1fb956] text-white text-sm font-bold py-3 rounded-xl text-center transition-colors shadow-md shadow-green-100"
                >
                  Voir les instructions →
                </a>
              </div>

              {/* Option 3 — Virement CIH */}
              <div className="border-2 border-emerald-100 rounded-2xl p-5 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🏦</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Virement bancaire CIH (instantané)</p>
                    <p className="text-xs text-gray-500">Recommandé pour les clients CIH Bank</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3 pl-9">Virement instantané</p>
                <a
                  href={WA_CIH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 rounded-xl text-center transition-colors shadow-md shadow-emerald-100"
                >
                  Voir le RIB →
                </a>
              </div>

              {/* Footer note */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <span>🔒</span> Paiement 100% sécurisé
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Après paiement, envoyez votre CV actuel par WhatsApp ou email.
                  Livraison du CV professionnel sous 48h.
                </p>
                <a
                  href={`https://wa.me/${WA_PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:underline"
                >
                  📞 Une question ? Écrivez-nous sur WhatsApp
                </a>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
