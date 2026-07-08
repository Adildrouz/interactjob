"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const WHATSAPP_URL = "https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j";

// Deliberately not RTL-flipped: fixed-corner support widgets (this + DonationButton)
// stay bottom-right regardless of language, matching the fixed-corner convention
// users expect from chat/support bubbles — see Phase 0 i18n foundation plan.
export default function WhatsAppButton() {
  const t = useTranslations("whatsapp");
  const [visible, setVisible] = useState(false);
  const [bottom, setBottom] = useState(96); // default: sits above the Ko-fi button

  // Appear after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Float above footer when user scrolls to it
  useEffect(() => {
    function recalc() {
      const footer = document.querySelector("footer");
      if (!footer) return;
      const gap = window.innerHeight - footer.getBoundingClientRect().top;
      setBottom(gap > 0 ? gap + 16 : 96);
    }
    window.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc, { passive: true });
    return () => {
      window.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
    };
  }, []);

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("ariaLabel")}
      style={{ bottom: `${bottom}px`, backgroundColor: "#25D366" }}
      className={`
        group fixed right-6 z-50
        w-[60px] h-[60px] rounded-full
        flex items-center justify-center
        shadow-[0_4px_16px_rgba(37,211,102,0.45)]
        hover:scale-110 hover:shadow-[0_6px_24px_rgba(37,211,102,0.6)]
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
    >
      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-8 h-8 fill-white"
        aria-hidden="true"
      >
        <path d="M16 .4C7.4.4.4 7.4.4 16c0 2.8.7 5.5 2.1 7.9L.4 31.6l7.9-2.1c2.3 1.3 5 2 7.7 2 8.6 0 15.6-7 15.6-15.6S24.6.4 16 .4zm0 28.5c-2.5 0-4.9-.7-7-1.9l-.5-.3-5 1.3 1.3-4.9-.3-.5c-1.3-2.2-2-4.6-2-7.2C2.5 8.5 8.5 2.5 16 2.5S29.5 8.5 29.5 16 23.5 28.9 16 28.9zm8.6-11.4c-.5-.2-2.8-1.4-3.2-1.5-.4-.2-.7-.2-1 .2-.3.5-1.2 1.5-1.4 1.8-.3.3-.5.3-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.8-2.6-3.2-.3-.5 0-.7.2-1l.6-.7c.2-.2.2-.5.4-.7.1-.2.1-.5 0-.7-.2-.2-1-2.5-1.4-3.4-.4-.9-.7-.7-1-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 3.9 1.7 4.2c.2.2 2.9 4.5 7.1 6.3 1 .4 1.8.7 2.4.9.9.3 1.8.3 2.5.2.8-.1 2.4-1 2.8-2 .3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.9-.5z" />
      </svg>

      {/* Tooltip */}
      <span
        className="
          absolute right-[72px] whitespace-nowrap
          bg-gray-900 text-white text-xs font-medium
          px-3 py-1.5 rounded-lg shadow-md
          opacity-0 group-hover:opacity-100
          translate-x-1 group-hover:translate-x-0
          transition-all duration-200 pointer-events-none
        "
      >
        {t("tooltip")}
        <span className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
      </span>
    </a>
  );
}
