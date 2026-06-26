'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const PLAN_LABELS: Record<string, string> = {
  standard: 'Standard',
  pack_sponsoring: 'Pack Sponsoring',
  pro: 'Pro Mensuel',
  business: 'Business Annuel',
};

const PLAN_COLORS: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-600',
  pack_sponsoring: 'bg-amber-100 text-amber-700',
  pro: 'bg-[#E0F9FA] text-[#007A80]',
  business: 'bg-[#00347A] text-white',
};

const NAV = [
  { href: '/employeur', label: 'Tableau de bord', icon: '📊', exact: true },
  { href: '/employeur/entreprise', label: 'Mon entreprise', icon: '🏢' },
  { href: '/employeur/offres', label: 'Mes offres', icon: '📋' },
  { href: '/employeur/candidatures', label: 'Candidatures', icon: '👥' },
  { href: '/employeur/talent-pool', label: 'Talent Pool', icon: '🌟' },
  { href: '/employeur/analytics', label: 'Analytics', icon: '📈' },
  { href: '/employeur/facturation', label: 'Facturation', icon: '💳' },
];

interface Props {
  companyName: string;
  plan: string;
  email: string;
}

export default function EmployeurSidebar({ companyName, plan, email }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/employer/auth/logout', { method: 'POST' });
    router.push('/employeur/connexion');
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#D0E4F0]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#00347A]">InteractJob</span>
        </Link>
        <div className="mt-3">
          <p className="text-sm font-semibold text-gray-800 truncate">{companyName}</p>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_COLORS[plan] || PLAN_COLORS.standard}`}>
            {PLAN_LABELS[plan] || plan}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? 'bg-[#00347A] text-white'
                : 'text-gray-600 hover:bg-[#E0F0FA] hover:text-[#00347A]'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {href === '/employeur/talent-pool' && plan === 'standard' && (
              <span className="ml-auto text-xs bg-[#00C2CB] text-white px-1.5 py-0.5 rounded-full">Pro</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Upgrade CTA (Standard only) */}
      {plan === 'standard' && (
        <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-[#00347A] to-[#00507A] p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wide mb-1">Passer à Pro</p>
          <p className="text-xs opacity-80 mb-3">Talent Pool + offres illimitées + 3 sponsorings/mois</p>
          <Link
            href="/employeur/tarifs"
            className="block text-center bg-[#00C2CB] hover:bg-[#00a8b5] text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
          >
            Voir les offres →
          </Link>
        </div>
      )}

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-[#D0E4F0] pt-4">
        <p className="text-xs text-gray-400 truncate px-3 mb-2">{email}</p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
        >
          {loggingOut ? 'Déconnexion...' : '← Déconnexion'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-[#D0E4F0] z-40 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#D0E4F0] z-40 flex items-center justify-between px-4">
        <span className="font-bold text-[#00347A]">{companyName}</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white h-full flex flex-col border-r border-[#D0E4F0] mt-14">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Mobile top spacing */}
      <div className="md:hidden h-14" />
    </>
  );
}
