"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="font-bold text-xl text-white">InteractJob</span>
            <p className="mt-1 text-sm text-gray-500 italic">{t("tagline")}</p>
            <p className="mt-4 text-sm leading-relaxed">{t("desc")}</p>
            <a
              href="https://www.linkedin.com/company/interact-job/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {t("followLinkedin")}
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {t("navTitle")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">{t("home")}</Link></li>
              <li><Link href="/offres" className="hover:text-white transition-colors">{t("offers")}</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">{t("blog")}</Link></li>
              <li><Link href="/publier" className="hover:text-white transition-colors">{t("postJob")}</Link></li>
              <li><Link href="/a-propos" className="hover:text-white transition-colors">{t("about")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {t("contactTitle")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="mailto:jobinteract@gmail.com" className="hover:text-white transition-colors">
                  jobinteract@gmail.com
                </a>
              </li>
              <li>Essaouira, Maroc</li>
              <li className="pt-2">
                <a
                  href="https://www.linkedin.com/company/interact-job/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t("contactLinkedin")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500">© {new Date().getFullYear()} InteractJob. {t("copyright")}</p>
          <div className="flex items-center gap-6 text-gray-500">
            <Link href="/politique-confidentialite" className="hover:text-white transition-colors">{t("privacy")}</Link>
            <Link href="/mentions-legales" className="hover:text-white transition-colors">{t("terms")}</Link>
            <Link href="/mentions-legales" className="hover:text-white transition-colors">{t("legal")}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{t("contactTitle")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
