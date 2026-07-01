'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EmployeurInscription() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: '', email: '', password: '', phone: '', sector: '', location: '', website: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const SECTORS = [
    'Informatique & Tech', 'Finance & Banque', 'Logistique & Transport',
    'Commerce & Distribution', 'Industrie & BTP', 'Hôtellerie & Tourisme',
    'Santé & Pharmacie', 'Éducation & Formation', 'Immobilier', 'Agriculture',
    'Énergie & Environnement', 'Marketing & Communication', 'Autre',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/employer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur.'); return; }
      setSuccess('Compte créé ! Vérifiez votre email pour activer votre compte. (En mode dev, l\'email s\'affiche dans la console.)');
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-[#00347A]">InteractJob</span>
            <span className="ml-2 text-sm font-medium text-[#00C2CB] bg-[#E0F9FA] px-2 py-0.5 rounded-full">Employeurs</span>
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-[#00347A]">Créer votre espace recruteur</h1>
          <p className="mt-2 text-gray-500">Publiez vos offres, gérez vos candidats</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#D0E4F0] p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <p className="text-green-700 font-medium">{success}</p>
              <Link href="/employeur/connexion" className="inline-block text-[#00347A] underline text-sm">
                Me connecter
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise *</label>
                <input
                  type="text" required placeholder="Ex: Atlas Logistics"
                  value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel *</label>
                <input
                  type="email" required placeholder="rh@monentreprise.ma"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
                />
                <p className="text-xs text-gray-400 mt-1">Un lien de confirmation vous sera envoyé pour activer votre compte.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone *</label>
                <input
                  type="tel" required placeholder="+212 6XX XXX XXX"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
                />
                <p className="text-xs text-gray-400 mt-1">Requis pour publier des offres. Non affiché publiquement.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input
                  type="password" required minLength={8} placeholder="8 caractères minimum"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                  <select
                    value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                    className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB] bg-white"
                  >
                    <option value="">Choisir...</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text" placeholder="Casablanca"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                <input
                  type="url" placeholder="https://monentreprise.ma"
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-[#00347A] hover:bg-[#00285e] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
              >
                {loading ? 'Création...' : 'Créer mon espace recruteur'}
              </button>

              <p className="text-center text-xs text-gray-500">
                En créant un compte, vous acceptez nos{' '}
                <Link href="/conditions-utilisation" className="text-[#00347A] underline">CGU</Link>.
              </p>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/employeur/connexion" className="text-[#00347A] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
