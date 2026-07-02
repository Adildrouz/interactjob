'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';

const TITLES: Record<string, { main: string; highlighted: string; sub: string }> = {
  fr: { main: 'Ils nous font', highlighted: 'confiance', sub: 'Plus de 50 entreprises publient leurs offres sur notre plateforme' },
  en: { main: 'They', highlighted: 'trust', sub: 'More than 50 companies post their jobs on our platform' },
  ar: { main: 'يثقون', highlighted: 'بنا', sub: 'أكثر من ٥٠ مؤسسة تنشر وظائفها عبر منصتنا' },
};

const EMPLOYERS = [
  {
    name: "Armonia",
    url: "https://www.armonia-facilities.com",
    logo: "https://www.armonia-facilities.com/themes/custom/armonia_theme/integration/assets/images/logo-baseline.jpg",
  },
  {
    name: "Mafoder Group",
    url: "https://mafoder.com",
    logo: "https://mafoder.com/wp-content/uploads/2022/10/Logo-Group-blck-1.webp",
  },
  {
    name: "Agents Only",
    url: "https://www.agentsonly.com",
    logo: "https://cdn.prod.website-files.com/62c753fca6f9ac29d2462136/65aa253081a7b46d1f3fc77f_logotype.svg",
  },
  {
    name: "Sotorelac",
    url: "https://sotorelac.com",
    logo: "https://sotorelac.com/wp-content/uploads/2025/11/en-tete.jpg",
  },
  { name: "SGR",       url: "https://www.linkedin.com/company/la-soci%C3%A9t%C3%A9-g%C3%A9n%C3%A9rale-de-recouvrement/", logo: null },
  { name: "VIPtrad",   url: "https://viptrad.com",  logo: null },
  { name: "Fiberco",   url: "https://fiberco.ma",   logo: null },
  { name: "Evalucar",  url: "https://www.evalucar.fr", logo: null },
];

// Visible slides per viewport
const VISIBLE = 5;

function LogoSlide({ employer }: { employer: typeof EMPLOYERS[0] }) {
  const [failed, setFailed] = useState(false);
  const showText = !employer.logo || failed;

  return (
    <a
      href={employer.url}
      target="_blank"
      rel="noopener noreferrer"
      title={employer.name}
      className="flex items-center justify-center px-6 h-20 rounded-2xl border border-gray-200 bg-white hover:border-[#00347A]/30 hover:shadow-md transition-all duration-200 group shrink-0"
      style={{ minWidth: 160 }}
    >
      {!showText ? (
        <img
          src={employer.logo!}
          alt={`Logo ${employer.name}`}
          className="max-h-12 max-w-[140px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-base font-bold text-[#00347A] text-center leading-tight tracking-tight group-hover:text-[#00C2CB] transition-colors">
          {employer.name}
        </span>
      )}
    </a>
  );
}

export default function TrustedEmployers() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const title = TITLES[locale] ?? TITLES.fr;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = EMPLOYERS.length;
  const maxIdx = total - VISIBLE;

  const next = useCallback(() => {
    setCurrent(c => (c >= maxIdx ? 0 : c + 1));
  }, [maxIdx]);

  const prev = useCallback(() => {
    setCurrent(c => (c <= 0 ? maxIdx : c - 1));
  }, [maxIdx]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 2800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, next]);

  const dots = Array.from({ length: maxIdx + 1 });

  return (
    <section
      className="py-14 bg-[#F4F8FC] border-t border-gray-100"
      dir={isRTL ? 'rtl' : 'ltr'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-[#00347A] mb-2">
          {title.main}{' '}
          <span className="text-[#00C2CB]">{title.highlighted}</span>
          {locale === 'en' ? ' us' : ''}
        </h2>
        <p className="text-center text-sm text-gray-400 mb-10">{title.sub}</p>

        {/* Carousel */}
        <div className="relative flex items-center gap-3">

          {/* Prev arrow */}
          <button
            onClick={isRTL ? next : prev}
            aria-label="Précédent"
            className="shrink-0 w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center text-[#00347A] hover:bg-[#00347A] hover:text-white hover:border-[#00347A] transition-all shadow-sm z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Slides window */}
          <div className="overflow-hidden flex-1">
            <div
              className="flex gap-4 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(${isRTL ? '' : '-'}${current * (160 + 16)}px)`,
              }}
            >
              {EMPLOYERS.map((emp) => (
                <LogoSlide key={emp.name} employer={emp} />
              ))}
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={isRTL ? prev : next}
            aria-label="Suivant"
            className="shrink-0 w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center text-[#00347A] hover:bg-[#00347A] hover:text-white hover:border-[#00347A] transition-all shadow-sm z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-7">
          {dots.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2.5 bg-[#00347A]'
                  : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
