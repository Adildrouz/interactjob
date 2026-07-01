'use client';
import { useState } from 'react';

const EMPLOYERS = [
  {
    name: "SGR",
    fullName: "Société Générale de Recouvrement",
    url: "https://www.linkedin.com/company/la-soci%C3%A9t%C3%A9-g%C3%A9n%C3%A9rale-de-recouvrement/",
    logo: "https://logo.clearbit.com/sgr.ma",
  },
  {
    name: "Armonia",
    fullName: "Armonia Facilities",
    url: "https://www.armonia-facilities.com",
    logo: "https://www.armonia-facilities.com/themes/custom/armonia_theme/integration/assets/images/armonia-logo.png",
  },
  {
    name: "Mafoder",
    fullName: "Mafoder Group",
    url: "https://mafoder.com",
    logo: "https://mafoder.com/wp-content/uploads/2022/10/Logo-Group-blck-1.webp",
  },
  {
    name: "VIPtrad",
    fullName: "VIPtrad",
    url: "https://viptrad.com",
    logo: "https://viptrad.com/assets/img/vip-trad-logo-sombre.svg",
  },
  {
    name: "Fiberco",
    fullName: "Fiberco",
    url: "https://fiberco.ma",
    logo: "https://www.connectme.ma/wp-content/uploads/2017/09/logofinal.jpg",
  },
  {
    name: "AgentsOnly",
    fullName: "Agents Only",
    url: "https://www.agentsonly.com",
    logo: "https://cdn.prod.website-files.com/62c753fca6f9ac29d2462136/65aa253081a7b46d1f3fc77f_logotype.svg",
  },
  {
    name: "Sotorelac",
    fullName: "Sotorelac SARL",
    url: "https://sotorelac.com",
    logo: "https://sotorelac.com/wp-content/uploads/2025/11/en-tete.jpg",
  },
  {
    name: "Evalucar",
    fullName: "Evalucar",
    url: "https://www.evalucar.fr",
    logo: "https://logo.clearbit.com/evalucar.fr",
  },
];

function LogoItem({ employer }: { employer: typeof EMPLOYERS[0] }) {
  const [failed, setFailed] = useState(false);

  return (
    <a
      href={employer.url}
      target="_blank"
      rel="noopener noreferrer"
      title={employer.fullName}
      className="flex items-center justify-center px-4 py-3 rounded-xl border border-gray-100 bg-white hover:border-[#00347A]/20 hover:shadow-sm transition-all duration-200 min-w-[120px] h-16"
    >
      {!failed ? (
        <img
          src={employer.logo}
          alt={`Logo ${employer.name}`}
          className="max-h-10 max-w-[130px] w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-gray-500 text-center leading-tight">
          {employer.name}
        </span>
      )}
    </a>
  );
}

export default function TrustedEmployers() {
  return (
    <section className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">
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
