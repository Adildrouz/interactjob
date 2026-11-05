'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function EmployerVerificationHelp({ email, password }: { email: string; password: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function resend() {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/employer/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setMessage(res.ok ? data.message : data.error || 'Impossible de renvoyer le lien.');
    } catch { setMessage('Connexion interrompue. Réessayez.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm space-y-3">
    <p>Lien d’activation introuvable ou inutilisable ? Renseignez votre email et votre mot de passe, puis demandez un nouveau lien.</p>
    <button type="button" disabled={busy || !email || !password} onClick={resend}
      className="font-semibold text-[#00347A] underline disabled:opacity-50">
      {busy ? 'Envoi en cours…' : 'Renvoyer le lien d’activation'}
    </button>
    {message && <p role="status">{message}</p>}
    <p><Link href="/publier" className="font-semibold text-[#00347A] underline">Publier gratuitement sans créer de compte →</Link></p>
  </div>;
}
