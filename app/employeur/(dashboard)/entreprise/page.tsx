'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SECTORS = [
  'Informatique & Tech', 'Finance & Banque', 'Logistique & Transport',
  'Commerce & Distribution', 'Industrie & BTP', 'Hôtellerie & Tourisme',
  'Santé & Pharmacie', 'Éducation & Formation', 'Immobilier', 'Agriculture',
  'Énergie & Environnement', 'Marketing & Communication', 'Autre',
];

const SIZES = ['1-10 employés', '10-20 employés', '20-50 employés', '50-200 employés', '200-500 employés', '500+ employés'];

export default function EmployeurEntreprise() {
  const [form, setForm] = useState({
    company_name: '', description: '', sector: '', website: '', location: '', size: '', logo_url: '', phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    fetch('/api/employer/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.employer) {
          setSlug(data.employer.slug);
          fetch(`/api/employer/profile/${data.employer.id}`)
            .then(r => r.json())
            .then(p => {
              if (p.employer) {
                setForm({
                  company_name: p.employer.company_name || '',
                  description: p.employer.description || '',
                  sector: p.employer.sector || '',
                  website: p.employer.website || '',
                  location: p.employer.location || '',
                  size: p.employer.size || '',
                  logo_url: p.employer.logo_url || '',
                  phone: p.employer.phone || '',
                });
                setEmailVerified(!!p.employer.email_verified);
                setPhoneVerified(!!p.employer.phone_verified);
              }
            });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/employer/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur.'); return; }
      setSuccess('Profil mis à jour !');
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00347A]">Mon entreprise</h1>
          <p className="text-gray-500 text-sm mt-1">Ces informations apparaissent sur votre page publique.</p>
        </div>
        {slug && (
          <Link
            href={`/entreprises/${slug}`}
            target="_blank"
            className="text-xs text-[#00C2CB] border border-[#00C2CB] px-3 py-1.5 rounded-lg hover:bg-[#E0F9FA] transition"
          >
            Voir la page publique →
          </Link>
        )}
      </div>

      {/* Statut de vérification */}
      <div className="bg-white rounded-2xl border border-[#D0E4F0] p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Statut de vérification</p>
        <div className="flex items-center gap-3 text-sm">
          {emailVerified ? (
            <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
              <span>✓</span> Email vérifié
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
              <span>✗</span> Email non vérifié — consultez votre boîte de réception
            </span>
          )}
          {form.phone ? (
            phoneVerified ? (
              <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                <span>✓</span> Téléphone vérifié
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <span>⏳</span> Téléphone en attente de vérification
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
              <span>⚠</span> Téléphone manquant — requis pour publier
            </span>
          )}
        </div>
        {(!emailVerified || !form.phone) && (
          <p className="text-xs text-gray-400 mt-1">
            Vous devez vérifier votre email et renseigner votre téléphone pour pouvoir publier des offres.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#D0E4F0] p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">{success}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
          <input type="text" value={form.company_name}
            onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL du logo</label>
          <input type="url" placeholder="https://..." value={form.logo_url}
            onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
          />
          {form.logo_url && (
            <img src={form.logo_url} alt="Logo preview" className="mt-2 h-12 rounded-lg border border-[#D0E4F0]" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={5} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Décrivez votre entreprise, votre culture, vos valeurs..."
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
            <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              <option value="">Choisir...</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taille</label>
            <select value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              <option value="">Choisir...</option>
              {SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input type="text" placeholder="Casablanca" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" placeholder="+212 6XX XXX XXX" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
          <input type="url" placeholder="https://..." value={form.website}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
          />
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-[#00347A] hover:bg-[#00285e] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}
