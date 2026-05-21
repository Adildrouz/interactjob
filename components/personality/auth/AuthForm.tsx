'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const endpoint = `/api/personality/auth/${mode}`;
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) { setError(data.error ?? 'Erreur'); return; }
      router.push('/personality/dashboard');
      router.refresh();
    } catch { setError('Erreur réseau'); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto">
      {mode === 'register' && (
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Nom complet</label>
          <input type="text" required minLength={2} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Votre nom" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
      )}
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">Email</label>
        <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="vous@exemple.com" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">Mot de passe</label>
        <input type="password" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="••••••••" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none" />
      </div>
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">{error}</div>}
      <button type="submit" disabled={loading} className="w-full rounded-xl py-3.5 font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity" style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}>
        {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
      </button>
      <p className="text-center text-sm text-slate-500">
        {mode === 'login' ? 'Pas de compte ? ' : 'Déjà un compte ? '}
        <a href={mode === 'login' ? '/personality/register' : '/personality/login'} className="text-indigo-400 hover:text-indigo-300">
          {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
        </a>
      </p>
    </form>
  );
}
