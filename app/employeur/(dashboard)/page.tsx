import { getEmployerSession } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { JobOffer } from '@/lib/models/JobOffer';
import { EmployerApplication } from '@/lib/models/EmployerApplication';
import Link from 'next/link';

const PLAN_LABELS: Record<string, string> = {
  standard: 'Standard',
  pack_sponsoring: 'Pack Sponsoring',
  pro: 'Pro Mensuel',
  business: 'Business Annuel',
};

export default async function EmployeurDashboard() {
  const session = await getEmployerSession();
  if (!session) return null;

  await connectEmployerDB();
  const employerId = session.id;

  const [activeOffers, pendingOffers, totalApps, newApps] = await Promise.all([
    JobOffer.countDocuments({ employer_id: employerId, status: 'active' }),
    JobOffer.countDocuments({ employer_id: employerId, status: 'pending' }),
    EmployerApplication.countDocuments({ employer_id: employerId }),
    EmployerApplication.countDocuments({ employer_id: employerId, status: 'nouveau' }),
  ]);

  const recentOffers = await JobOffer.find({ employer_id: employerId })
    .sort({ created_at: -1 })
    .limit(5)
    .lean();

  const recentApps = await EmployerApplication.find({ employer_id: employerId })
    .sort({ created_at: -1 })
    .limit(5)
    .lean();

  const plan = session.plan;
  const isProOrBusiness = plan === 'pro' || plan === 'business';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#00347A]">Bonjour, {session.company_name} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Plan : <strong>{PLAN_LABELS[plan]}</strong></p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Offres actives', value: activeOffers, icon: '📋', href: '/employeur/offres' },
          { label: 'En attente', value: pendingOffers, icon: '⏳', href: '/employeur/offres' },
          { label: 'Candidatures', value: totalApps, icon: '👥', href: '/employeur/candidatures' },
          { label: 'Nouvelles', value: newApps, icon: '🔔', href: '/employeur/candidatures' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}
            className="bg-white rounded-2xl border border-[#D0E4F0] p-5 hover:shadow-sm transition"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-[#00347A]">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/employeur/offres/nouvelle"
          className="inline-flex items-center gap-2 bg-[#00347A] hover:bg-[#00285e] text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
        >
          + Publier une offre
        </Link>
        <Link href="/employeur/entreprise"
          className="inline-flex items-center gap-2 border border-[#D0E4F0] bg-white hover:bg-[#F0F8FF] text-[#00347A] font-medium px-5 py-2.5 rounded-xl transition text-sm"
        >
          Compléter le profil
        </Link>
        {!isProOrBusiness && (
          <Link href="/employeur/tarifs"
            className="inline-flex items-center gap-2 bg-[#00C2CB] hover:bg-[#00a8b5] text-white font-medium px-5 py-2.5 rounded-xl transition text-sm"
          >
            Passer à Pro →
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent offers */}
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#00347A]">Dernières offres</h2>
            <Link href="/employeur/offres" className="text-xs text-[#00C2CB] hover:underline">Voir tout</Link>
          </div>
          {recentOffers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune offre publiée.</p>
          ) : (
            <div className="space-y-3">
              {recentOffers.map((o: any) => (
                <div key={o._id.toString()} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800 truncate flex-1">{o.title}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#00347A]">Dernières candidatures</h2>
            <Link href="/employeur/candidatures" className="text-xs text-[#00C2CB] hover:underline">Voir tout</Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune candidature reçue.</p>
          ) : (
            <div className="space-y-3">
              {recentApps.map((a: any) => (
                <div key={a._id.toString()} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{a.candidate_name}</span>
                    {a.personality_profile?.mbti && (
                      <span className="ml-2 text-xs text-[#00C2CB] font-medium">✓ Profil testé</span>
                    )}
                  </div>
                  <AppStatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    draft: 'bg-gray-100 text-gray-600',
    expired: 'bg-red-100 text-red-600',
    suspended: 'bg-orange-100 text-orange-700',
    rejected: 'bg-red-100 text-red-600',
  };
  const labels: Record<string, string> = {
    active: 'Active', pending: 'En attente', draft: 'Brouillon',
    expired: 'Expirée', suspended: 'Suspendue', rejected: 'Rejetée',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 shrink-0 ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    nouveau: 'bg-blue-100 text-blue-700',
    vu: 'bg-gray-100 text-gray-600',
    preselectionne: 'bg-green-100 text-green-700',
    refuse: 'bg-red-100 text-red-600',
  };
  const labels: Record<string, string> = {
    nouveau: 'Nouveau', vu: 'Vu', preselectionne: 'Présélectionné', refuse: 'Refusé',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 shrink-0 ${map[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}
