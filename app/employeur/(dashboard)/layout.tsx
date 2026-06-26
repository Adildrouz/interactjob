import { redirect } from 'next/navigation';
import { getEmployerSession } from '@/lib/employer/auth';
import EmployeurSidebar from './components/EmployeurSidebar';

export default async function EmployeurLayout({ children }: { children: React.ReactNode }) {
  const session = await getEmployerSession();
  if (!session) redirect('/employeur/connexion?error=unauthorized');

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex">
      <EmployeurSidebar
        companyName={session.company_name}
        plan={session.plan}
        email={session.email}
      />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
