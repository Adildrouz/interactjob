'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EmployeurConnexion() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errParam = params.get('error');
    if (errParam === 'token_invalid') setError('Lien de vérification invalide ou expiré.');
    if (errParam === 'unauthorized') setError('Connectez-vous pour accéder à cet espace.');
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/employer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur.'); return; }
      router.push('/employeur');
      router.refresh();
    } catch { setError('Erreur réseau.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-[#00347A]">InteractJob</span>
            <span className="ml-2 text-sm font-medium text-[#00C2CB] bg-[#E0F9FA] px-2 py-0.5 rounded-full">Employeurs</span>
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-[#00347A]">Connexion recruteur</h1>
          <p className="mt-2 text-gray-500">Accédez à votre espace employeur</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#D0E4F0] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
            )}
            {params.get('welcome') === '1' && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">
                Email vérifié ! Vous pouvez vous connecter.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required placeholder="rh@monentreprise.ma"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-[#D0E4F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2CB]"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#00347A] hover:bg-[#00285e] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Dev helper — seed credentials */}
          {process.env.NODE_ENV !== 'production' && (
            <details className="mt-6 text-xs text-gray-400 border-t border-gray-100 pt-4">
              <summary className="cursor-pointer">Comptes de test (dev)</summary>
              <div className="mt-2 space-y-1 font-mono">
                <div>rh@atlas-logistics.ma / Test1234! (Pro)</div>
                <div>recrutement@mogador-tech.ma / Test1234! (Business)</div>
                <div>jobs@saphir-hotellerie.ma / Test1234! (Pack)</div>
                <div>rh@nour-distribution.ma / Test1234! (Standard)</div>
                <div>contact@test-pending-co.ma / Test1234! (Pending offer)</div>
              </div>
            </details>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link href="/employeur/inscription" className="text-[#00347A] font-medium hover:underline">
            Créer un espace recruteur
          </Link>
        </p>
        <p className="text-center mt-2 text-sm text-gray-400">
          Vous êtes candidat ?{' '}
          <Link href="/offres" className="text-gray-500 hover:underline">Voir les offres d&apos;emploi</Link>
        </p>
      </div>
    </div>
  );
}
