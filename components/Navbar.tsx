"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

function Dropdown({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");

  function switchLocale(next: "fr" | "en" | "ar") {
    router.replace(pathname, { locale: next });
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const dropdownLinkCls = "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors";

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-1">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group mr-2">
            <div className="relative w-8 h-8">
              <Image
                src="/InteractJob-Logo.png"
                alt="InteractJob"
                fill priority
                className="object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <span className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors hidden sm:block">
              InteractJob
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1">

            {/* Offres */}
            <Link href="/offres" className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${isActive("/offres") && !pathname.startsWith("/offres/remote") ? "text-primary bg-primary/8" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              {t("offers")}
              {isActive("/offres") && !pathname.startsWith("/offres/remote") && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </Link>

            {/* Remote */}
            <Link href={"/offres/remote" as any} className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${pathname.startsWith("/offres/remote") ? "text-primary bg-primary/8" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              🌍 Remote
              {pathname.startsWith("/offres/remote") && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </Link>

            {/* Postuler */}
            <Link href={"/postuler" as any} className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${isActive("/postuler") ? "text-primary bg-primary/8" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              {t("postuler")}
              {isActive("/postuler") && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </Link>

            {/* Blog */}
            <Link href="/blog" className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${isActive("/blog") ? "text-primary bg-primary/8" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              {t("blog")}
              {isActive("/blog") && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </Link>

            {/* Plus ▾ */}
            <Dropdown label="Explorer">
              <Link href={"/concours" as any} onClick={() => {}} className={dropdownLinkCls}>🏆 {t("concours")}</Link>
              <Link href={"/code-travail" as any} onClick={() => {}} className={dropdownLinkCls}>📋 {t("codeTravail")}</Link>
              <Link href="/a-propos" onClick={() => {}} className={dropdownLinkCls}>ℹ️ {t("about")}</Link>
            </Dropdown>

            {/* Outils ▾ */}
            <Dropdown label="Outils CV">
              <Link href={"/cv-checker" as any} onClick={() => {}} className={dropdownLinkCls}>🔍 {t("cvChecker")}</Link>
              <Link href={"/generateur-cv" as any} onClick={() => {}} className={dropdownLinkCls}>
                🤖 {t("cvGenerator")}
                <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">5€</span>
              </Link>
            </Dropdown>

            {/* Personnalité IA */}
            <a
              href="/personality"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap"
            >
              🧠 Personnalité
              <span className="text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-pink-500 px-1.5 py-0.5 rounded-full leading-none">IA</span>
            </a>
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-auto">

            {/* Language switcher */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold">
              {(["fr", "en", "ar"] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => switchLocale(lng)}
                  className={`px-2.5 py-1.5 transition-colors ${locale === lng ? "bg-primary text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                >
                  {lng === "fr" ? "FR" : lng === "en" ? "EN" : "عربي"}
                </button>
              ))}
            </div>

            {/* Publier CTA */}
            <Link
              href={"/publier" as any}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm whitespace-nowrap"
            >
              {t("postJob")}
            </Link>
          </div>

          {/* Mobile: right side shortcuts + hamburger */}
          <div className="lg:hidden flex items-center gap-2 ml-auto">
            <a href="/personality" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">
              🧠 <span className="text-[10px] font-bold text-pink-500">IA</span>
            </a>
            <button
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
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
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white py-3 px-4 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-0.5">

            {[
              { href: "/" as const,           label: t("home"),        icon: "🏠" },
              { href: "/offres" as const,      label: t("offers"),      icon: "💼" },
              { href: "/offres/remote" as any, label: "Remote",         icon: "🌍" },
              { href: "/postuler" as any,      label: t("postuler"),    icon: "📨" },
              { href: "/concours" as any,      label: t("concours"),    icon: "🏆" },
              { href: "/blog" as const,        label: t("blog"),        icon: "📰" },
              { href: "/code-travail" as any,  label: t("codeTravail"), icon: "📋" },
              { href: "/a-propos" as const,    label: t("about"),       icon: "ℹ️" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${isActive(link.href) ? "text-primary bg-primary/8" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Personnalité IA */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <a
                href="/personality"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <span className="flex items-center gap-2">🧠 Test Personnalité</span>
                <span className="text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-pink-500 px-2 py-0.5 rounded-full">IA</span>
              </a>
            </div>

            {/* Outils CV */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">Outils CV</p>
              {[
                { href: "/cv-checker" as any,    label: t("cvChecker"),   icon: "🔍", badge: undefined },
                { href: "/generateur-cv" as any, label: t("cvGenerator"), icon: "🤖", badge: "5€"  },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${tool.badge ? "text-blue-700 hover:bg-blue-50" : "text-accent hover:bg-accent/10"}`}
                >
                  <span className="flex items-center gap-2"><span>{tool.icon}</span>{tool.label}</span>
                  {tool.badge && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">{tool.badge}</span>}
                </Link>
              ))}
            </div>

            {/* Bottom actions */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
              <Link
                href={"/publier" as any}
                onClick={() => setOpen(false)}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-primary-dark transition-colors"
              >
                {t("postJob")}
              </Link>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold">
                {(["fr", "en", "ar"] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => { switchLocale(lng); setOpen(false); }}
                    className={`px-2.5 py-2 transition-colors ${locale === lng ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    {lng === "fr" ? "FR" : lng === "en" ? "EN" : "ع"}
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
