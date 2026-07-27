import { redirect } from 'next/navigation';
import { getEmployerSession } from '@/lib/employer/auth';

/**
 * Talent Pool is built (spontaneous-candidate browsing) but deliberately not
 * offered in this deployment — free-first strategy, no Talent Pool access
 * regardless of plan. Blocked server-side so a direct URL can't reach it,
 * not just hidden from the sidebar nav.
 */
export default async function TalentPool() {
  const session = await getEmployerSession();
  if (!session) redirect('/employeur/connexion?error=unauthorized');
  redirect('/employeur');
}
