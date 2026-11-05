'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RecruiterHealth() {
  const [health, setHealth] = useState<{ unverified: number; events: Record<string, number> } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/admin/recruiter-health', { cache: 'no-store' }).then(async res => {
      if (!res.ok) throw new Error('unavailable');
      const data = await res.json(); if (active) setHealth(data);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  if (failed) return <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Le suivi des publications recruteurs est indisponible. Réessayez avant de conclure à une absence de demandes.</p>;
  if (!health) return null;
  const errors = (health.events.storage_error || 0) + (health.events.admin_notification_failed || 0) + (health.events.employer_notification_failed || 0);
  return <div className={`mb-5 rounded-xl border p-4 text-sm ${health.unverified || errors ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
    <p className="font-semibold">Suivi des recruteurs</p>
    <p>{health.unverified} compte(s) inscrit(s) en attente d’activation. <Link href="/admin/employeurs" className="underline">Voir les comptes</Link></p>
    <p className="mt-1">Sur 7 jours, depuis l’activation du suivi : {health.events.view || 0} visites du formulaire · {health.events.started || 0} débuts · {health.events.stored || 0} annonces enregistrées · {errors} erreurs de stockage ou de notification.</p>
    <div className="mt-2 flex gap-4"><Link href="/admin/offres" className="underline">Annonces à valider</Link><Link href="/admin/leads" className="underline">Demandes de contact à traiter</Link></div>
  </div>;
}
