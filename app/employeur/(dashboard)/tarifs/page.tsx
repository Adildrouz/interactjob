import { redirect } from 'next/navigation';
import { getEmployerSession } from '@/lib/employer/auth';

/**
 * Pricing/PayPal is built but not offered in this deployment — free-first
 * strategy, no payment UI anywhere in the employer flow. Blocked server-side
 * so a direct URL can't reach it, not just hidden from the sidebar nav.
 */
export default async function Tarifs() {
  const session = await getEmployerSession();
  if (!session) redirect('/employeur/connexion?error=unauthorized');
  redirect('/employeur');
}
