'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'];
const LEVELS = ['Junior', 'Confirmé', 'Senior', 'Non précisé'];
const SECTORS = ['Informatique', 'Finance', 'Logistique', 'Commerce', 'Industrie', 'Hôtellerie', 'Santé', 'BTP', 'Autre'];

export default function EditOffer() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/employer/offers/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.offer) setForm(data.offer);
        else setError(data.error || 'Offre introuvable.');
      })
      .catch(() => setError('Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch(`/api/employer/offers/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, description: form.description, location: form.location,
        contract_type: form.contract_type, salary: form.salary, level: form.level,
        sector: form.sector, application_method: form.application_method,
        application_email: form.application_email, application_url: form.application_url,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.offer) {
      router.push('/employeur/offres');
    } else {
      setError(data.error || 'Erreur lors de la sauvegarde.');
    }
  }

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>;
  if (!form) return <div className="text-red-500">{error || 'Offre introuvable.'}</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#00347A] mb-6">Modifier l&apos;offre</h1>
      {form.status === 'active' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl p-3 mb-5">
          ⚠️ Cette offre est active. Toute modification la repassera en modération (sauf si votre compte est vérifié).
        </div>
      )}
      {error && <div className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-5">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#D0E4F0] p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre du poste *</label>
          <input value={form.title || ''} onChange={e => set('title', e.target.value)} required
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea rows={8} value={form.description || ''} onChange={e => set('description', e.target.value)} required
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB] resize-y" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
            <input value={form.location || ''} onChange={e => set('location', e.target.value)} required
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rémunération</label>
            <input value={form.salary || ''} onChange={e => set('salary', e.target.value)} placeholder="ex: 5 000 – 7 000 MAD"
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrat</label>
            <select value={form.contract_type || ''} onChange={e => set('contract_type', e.target.value)}
              className="w-full border border-[#D0E4F0] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              {CONTRACT_TYPES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
            <select value={form.level || ''} onChange={e => set('level', e.target.value)}
              className="w-full border border-[#D0E4F0] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
            <select value={form.sector || ''} onChange={e => set('sector', e.target.value)}
              className="w-full border border-[#D0E4F0] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode de candidature</label>
          <div className="flex gap-4">
            {['email', 'url'].map(m => (
              <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" value={m} checked={form.application_method === m} onChange={() => set('application_method', m)} />
                {m === 'email' ? 'Par email' : 'Via lien'}
              </label>
            ))}
          </div>
          {form.application_method === 'email' ? (
            <input type="email" value={form.application_email || ''} onChange={e => set('application_email', e.target.value)}
              placeholder="recrutement@entreprise.ma" className="mt-2 w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
          ) : (
            <input type="url" value={form.application_url || ''} onChange={e => set('application_url', e.target.value)}
              placeholder="https://..." className="mt-2 w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-[#00347A] hover:bg-[#00285e] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          <button type="button" onClick={() => router.push('/employeur/offres')}
            className="border border-[#D0E4F0] text-gray-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
