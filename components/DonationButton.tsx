'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const DONATION_URL = 'https://ko-fi.com/interactjob';

// Deliberately not RTL-flipped: fixed-corner support widgets (this + WhatsAppButton)
// stay bottom-right regardless of language, matching the fixed-corner convention
// users expect from chat/support bubbles — see Phase 0 i18n foundation plan.
export default function DonationButton() {
  const t = useTranslations('donation');
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        aria-label={t('ariaLabel')}
      >
        <span className="text-lg">☕</span>
        <span className="hidden sm:block">{t('floatingLabel')}</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">☕</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('modalTitle')}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {t('modalBody')}
              </p>
              <a
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-xl transition-colors"
              >
                {t('cta')}
              </a>
              <button
                onClick={() => setOpen(false)}
                className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
