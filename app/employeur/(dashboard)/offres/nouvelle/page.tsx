'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel', 'Intérim', 'Alternance'];
const LEVELS = ['Junior (0-2 ans)', 'Confirmé (3-5 ans)', 'Senior (5+ ans)', 'Manager', 'Étudiant / Stagiaire'];
const SECTORS = [
  'Informatique & Tech', 'Finance & Banque', 'Logistique & Transport',
  'Commerce & Distribution', 'Industrie & BTP', 'Hôtellerie & Tourisme',
  'Santé & Pharmacie', 'Éducation & Formation', 'Immobilier', 'Agriculture',
  'Énergie & Environnement', 'Marketing & Communication', 'RH & Recrutement', 'Autre',
];

export default function NouvelleOffre() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', location: '', contract_type: 'CDI',
    salary: '', level: '', sector: '',
    application_method: 'email' as 'email' | 'url',
    application_email: '', application_url: '',
    is_sponsored: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState('');
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employer/auth/session').then(r => r.json()).then(d => {
      if (d.employer) {
        setCredits(d.employer.sponsoring_credits || 0);
        setPlan(d.employer.plan || 'standard');
        setEmailVerified(!!d.employer.email_verified);
        setHasPhone(!!d.employer.phone);
        setForm(f => ({ ...f, application_email: d.employer.email }));
      }
    }).finally(() => setSessionLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/employer/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur.');
        if (data.limit_reached) {
          setError(data.error + ' → Voir les plans.');
        }
        return;
      }
      router.push(`/employeur/offres?success=1`);
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  }

  const blocked = emailVerified === false || hasPhone === false;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/employeur/offres" className="text-sm text-gray-500 hover:text-[#00347A]">← Mes offres</Link>
        <h1 className="text-2xl font-bold text-[#00347A] mt-2">Nouvelle offre d&apos;emploi</h1>
        <p className="text-sm text-gray-500 mt-1">Votre offre sera enrichie automatiquement par IA avant publication.</p>
      </div>

      {/* Blocage si conditions non remplies */}
      {!sessionLoading && blocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-bold text-amber-900">Avant de publier une offre, vous devez :</p>
              <p className="text-sm text-amber-700 mt-0.5">Complétez ces étapes pour débloquer la publication.</p>
            </div>
          </div>
          <ul className="space-y-3">
            {emailVerified === false && (
              <li className="flex items-start gap-3 bg-white rounded-xl border border-amber-200 p-3">
                <span className="text-xl mt-0.5">📧</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Vérifier votre adresse email</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Un email de confirmation vous a été envoyé lors de l&apos;inscription. Vérifiez votre boîte de réception (et les spams).
                  </p>
                </div>
                <span className="text-red-500 text-lg">✗</span>
              </li>
            )}
            {hasPhone === false && (
              <li className="flex items-start gap-3 bg-white rounded-xl border border-amber-200 p-3">
                <span className="text-xl mt-0.5">📱</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Renseigner votre numéro de téléphone</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ajoutez votre numéro dans{' '}
                    <Link href="/employeur/entreprise" className="text-[#00347A] underline font-medium">
                      Mon entreprise → Coordonnées
                    </Link>
                    . Il ne sera jamais affiché publiquement.
                  </p>
                </div>
                <Link href="/employeur/entreprise" className="shrink-0 bg-[#00347A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#00285e] transition">
                  Compléter →
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`bg-white rounded-2xl border border-[#D0E4F0] p-6 space-y-5 ${blocked ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre du poste *</label>
          <input type="text" required placeholder="Ex: Développeur Full-Stack React/Node.js"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
            <span className="ml-2 text-xs text-purple-500 font-normal">✨ Sera enrichie par IA automatiquement</span>
          </label>
          <textarea rows={6} required
            placeholder="Décrivez le poste, les missions, le profil recherché..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB] resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
            <input type="text" required placeholder="Casablanca"
              value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat *</label>
            <select value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expérience</label>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              <option value="">Choisir...</option>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
            <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
              className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
              <option value="">Choisir...</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salaire (optionnel)</label>
          <input type="text" placeholder="Ex: 8 000 – 12 000 MAD"
            value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
            className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
        </div>

        {/* Application method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de candidature</label>
          <div className="flex gap-3">
            {(['email', 'url'] as const).map(m => (
              <label key={m} className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 cursor-pointer text-sm transition ${
                form.application_method === m ? 'border-[#00347A] bg-[#F0F8FF] text-[#00347A] font-medium' : 'border-[#D0E4F0] text-gray-600'
              }`}>
                <input type="radio" name="method" value={m} checked={form.application_method === m}
                  onChange={() => setForm(f => ({ ...f, application_method: m }))} className="sr-only" />
                {m === 'email' ? '📧 Email direct' : '🔗 Lien externe'}
              </label>
            ))}
          </div>
          {form.application_method === 'email' ? (
            <input type="email" placeholder="rh@monentreprise.ma" value={form.application_email}
              onChange={e => setForm(f => ({ ...f, application_email: e.target.value }))}
              className="w-full mt-3 border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
          ) : (
            <input type="url" placeholder="https://jobs.monentreprise.ma/postuler"
              value={form.application_url}
              onChange={e => setForm(f => ({ ...f, application_url: e.target.value }))}
              className="w-full mt-3 border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]" />
          )}
        </div>

        {/* Sponsoring toggle */}
        {credits > 0 && (
          <div className={`rounded-xl border p-4 ${form.is_sponsored ? 'border-amber-300 bg-amber-50' : 'border-[#D0E4F0]'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_sponsored}
                onChange={e => setForm(f => ({ ...f, is_sponsored: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-amber-500" />
              <div>
                <p className="font-medium text-sm text-gray-800">⭐ Sponsoriser cette offre</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Utilise 1 crédit ({credits} disponible{credits > 1 ? 's' : ''}) — Mise en avant homepage + badge gold + analytics avancés
                </p>
              </div>
            </label>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-[#00347A] hover:bg-[#00285e] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
          {loading ? 'Publication en cours...' : 'Publier l\'offre'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          {plan === 'standard' || plan === 'pack_sponsoring'
            ? 'Les nouvelles offres sont soumises à modération (24–48h pour les nouveaux comptes).'
            : 'Votre compte est de confiance — l\'offre sera publiée immédiatement.'}
        </p>
      </form>
    </div>
  );
}
