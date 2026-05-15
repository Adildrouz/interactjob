"use client";
import { useState } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");

  const navLinks = [
    { href: "/offres" as const,    label: t("offers") },
    { href: "/concours" as any,    label: t("concours") },
    { href: "/blog" as const,      label: t("blog") },
    { href: "/code-travail" as any, label: t("codeTravail") },
    { href: "/cv-checker" as any,  label: t("cvChecker"), highlight: true },
    { href: "/a-propos" as const,  label: t("about") },
  ];

  function switchLocale(next: "fr" | "en" | "ar") {
    router.replace(pathname, { locale: next });
  }

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-8 h-8">
              <Image
                src="/InteractJob-Logo.png"
                alt="InteractJob"
                fill
                className="object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                InteractJob
              </span>
              <span className="hidden sm:block text-[10px] text-gray-400 leading-none -mt-0.5">
                {t("findJob")}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              const hl = (link as any).highlight;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? "text-primary bg-primary-light"
                      : hl
                      ? "text-accent font-semibold hover:bg-accent/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold">
              {(["fr", "en", "ar"] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => switchLocale(lng)}
                  className={`px-2.5 py-1.5 transition-colors ${
                    locale === lng
                      ? "bg-primary text-white"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {lng === "fr" ? "FR" : lng === "en" ? "EN" : "عربي"}
                </button>
              ))}
            </div>

            <Link
              href="/offres"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              {t("findJob")}
            </Link>
            <Link
              href="/publier"
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
            >
              {t("postJob")}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white py-3 px-4 shadow-lg">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${
                  pathname.startsWith(link.href)
                    ? "text-primary bg-primary-light"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/publier"
              onClick={() => setOpen(false)}
              className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center mt-2 hover:bg-primary-dark transition-colors"
            >
              {t("postJob")}
            </Link>
            {/* Mobile language switcher */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400 font-medium">Langue :</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold">
                {(["fr", "en", "ar"] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => { switchLocale(lng); setOpen(false); }}
                    className={`px-2.5 py-1.5 transition-colors ${
                      locale === lng
                        ? "bg-primary text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {lng === "fr" ? "FR" : lng === "en" ? "EN" : "عربي"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
