'use client';
import { useState } from 'react';

const EMPLOYERS = [
  {
    name: "SGR",
    url: "https://www.linkedin.com/company/la-soci%C3%A9t%C3%A9-g%C3%A9n%C3%A9rale-de-recouvrement/",
    logo: null, // no public logo available — show text badge
  },
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
    name: "VIPtrad",
    url: "https://viptrad.com",
    logo: null, // SVG has dark background — show text badge
  },
  {
    name: "Fiberco",
    url: "https://fiberco.ma",
    logo: null, // redirects to ConnectMe — show text badge
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
  {
    name: "Evalucar",
    url: "https://www.evalucar.fr",
    logo: null, // Wix site — no accessible logo URL
  },
];

function LogoItem({ employer }: { employer: typeof EMPLOYERS[0] }) {
  const [failed, setFailed] = useState(false);
  const showText = !employer.logo || failed;

  return (
    <a
      href={employer.url}
      target="_blank"
      rel="noopener noreferrer"
      title={employer.name}
      className="flex items-center justify-center px-6 py-4 rounded-2xl border border-gray-200 bg-white hover:border-[#00347A]/30 hover:shadow-md transition-all duration-200 min-w-[140px] h-20 group"
    >
      {!showText ? (
        <img
          src={employer.logo!}
          alt={`Logo ${employer.name}`}
          className="max-h-12 max-w-[150px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
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
  return (
    <section className="py-14 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-base font-bold text-gray-600 tracking-[0.15em] uppercase mb-10">
          Ils nous font confiance
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {EMPLOYERS.map((emp) => (
            <LogoItem key={emp.name} employer={emp} />
          ))}
        </div>
      </div>
    </section>
  );
}
