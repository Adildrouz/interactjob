'use client';
import { useState, useEffect, useCallback } from 'react';

interface Employer {
  _id: string;
  company_name: string;
  email: string;
  phone?: string;
  phone_verified: boolean;
  plan: string;
  location?: string;
  sector?: string;
  created_at: string;
  verified: boolean;
  email_verified: boolean;
  approved_offers_count: number;
  notes?: string;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  standard:        { label: 'Standard',         color: 'bg-gray-100 text-gray-600' },
  pack_sponsoring: { label: 'Pack Sponsoring',  color: 'bg-blue-100 text-blue-700' },
  pro:             { label: 'Pro',              color: 'bg-purple-100 text-purple-700' },
  business:        { label: 'Business',         color: 'bg-amber-100 text-amber-700' },
};

export default function AdminEmployeurs() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [notes, setNotes]         = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/employers');
    const data = await res.json();
    const list: Employer[] = data.employers || [];
    setEmployers(list);
    const n: Record<string, string> = {};
    list.forEach(e => { if (e.notes) n[e._id] = e.notes; });
    setNotes(n);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveNotes(id: string) {
    setSaving(id);
    await fetch('/api/admin/employers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employerId: id, notes: notes[id] || '' }),
    });
    setSaving(null);
  }

  async function togglePhoneVerified(emp: Employer) {
    setVerifying(emp._id);
    const newVal = !emp.phone_verified;
    await fetch('/api/admin/employers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employerId: emp._id, phone_verified: newVal }),
    });
    setEmployers(list => list.map(e => e._id === emp._id ? { ...e, phone_verified: newVal } : e));
    setVerifying(null);
  }

  const filtered = employers.filter(e => {
    const q = search.toLowerCase();
    return (
      e.company_name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.phone?.includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  });

  const withPhone    = employers.filter(e => e.phone).length;
  const withoutPhone = employers.length - withPhone;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00347A]">Employeurs</h1>
          <p className="text-gray-500 text-sm mt-1">
            {employers.length} employeurs inscrits — {withPhone} avec téléphone
            {withoutPhone > 0 && <span className="text-amber-600"> · {withoutPhone} sans numéro</span>}
          </p>
        </div>
        <button onClick={load} className="text-xs text-gray-400 hover:text-[#00347A] border border-[#D0E4F0] px-3 py-1.5 rounded-lg">
          ↻ Actualiser
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher par entreprise, email, téléphone, ville..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-8 text-center text-gray-400">
          Aucun employeur trouvé.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(emp => {
            const plan = PLAN_LABELS[emp.plan] || { label: emp.plan, color: 'bg-gray-100 text-gray-600' };
            return (
              <div key={emp._id} className="bg-white rounded-2xl border border-[#D0E4F0] p-5">
                <div className="flex items-start gap-4">

                  {/* Initiales */}
                  <div className="w-10 h-10 rounded-xl bg-[#00347A] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {emp.company_name?.slice(0, 2).toUpperCase() || '??'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h2 className="font-semibold text-gray-900">{emp.company_name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.color}`}>
                        {plan.label}
                      </span>
                      {emp.email_verified && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Email vérifié</span>
                      )}
                    </div>

                    {/* Coordonnées */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                      {/* Email */}
                      <div className="flex items-center gap-1.5">
                        <a href={`mailto:${emp.email}`} className="text-[#00347A] hover:underline flex items-center gap-1">
                          <span>✉</span> {emp.email}
                        </a>
                        {emp.email_verified ? (
                          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">✓ vérifié</span>
                        ) : (
                          <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">✗ non vérifié</span>
                        )}
                      </div>

                      {/* Téléphone */}
                      {emp.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${emp.phone.replace(/\s/g, '')}`}
                            className="text-green-700 font-semibold hover:underline flex items-center gap-1">
                            <span>📞</span> {emp.phone}
                          </a>
                          {emp.phone_verified ? (
                            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">✓ vérifié</span>
                          ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">⏳ à appeler</span>
                          )}
                          <button
                            onClick={() => togglePhoneVerified(emp)}
                            disabled={verifying === emp._id}
                            className={`text-xs px-2 py-0.5 rounded-full border transition ${
                              emp.phone_verified
                                ? 'border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                                : 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100'
                            } disabled:opacity-50`}
                          >
                            {verifying === emp._id ? '...' : emp.phone_verified ? '↩ Retirer' : '✓ Marquer vérifié'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-500 text-xs italic flex items-center gap-1">
                          <span>⚠</span> Pas de téléphone
                        </span>
                      )}
                    </div>

                    {/* Infos secondaires */}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      {emp.location && <span>📍 {emp.location}</span>}
                      {emp.sector && <span>🏭 {emp.sector}</span>}
                      <span>📅 Inscrit le {new Date(emp.created_at).toLocaleDateString('fr-FR')}</span>
                      <span>📋 {emp.approved_offers_count} offre(s) approuvée(s)</span>
                    </div>

                    {/* Notes internes */}
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Notes internes (feedback appel, statut...)"
                        value={notes[emp._id] || ''}
                        onChange={e => setNotes(n => ({ ...n, [emp._id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && saveNotes(emp._id)}
                        className="flex-1 border border-[#D0E4F0] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
                      />
                      <button
                        onClick={() => saveNotes(emp._id)}
                        disabled={saving === emp._id}
                        className="text-xs text-[#00347A] border border-[#D0E4F0] px-3 py-1.5 rounded-lg hover:bg-[#F0F8FF] transition disabled:opacity-50">
                        {saving === emp._id ? '...' : 'Sauver'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
