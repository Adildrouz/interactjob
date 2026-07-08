"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "ij_cookie_consent";

export default function CookieBanner() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch {}
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem(STORAGE_KEY, "declined"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("ariaLabel")}
      className="fixed bottom-0 inset-x-0 z-50 bg-gray-900 text-white shadow-2xl"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 flex-1">
          {t("message")}{" "}
          <Link href="/politique-confidentialite" className="underline hover:text-white">
            {t("learnMore")}
          </Link>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
          >
            {t("decline")}
          </button>
          <button
            onClick={accept}
            className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
