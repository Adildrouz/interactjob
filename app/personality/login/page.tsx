import Link from 'next/link';
import { AuthForm } from '@/components/personality/auth/AuthForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/personality" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
            ← Test Personnalité
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Connexion</h1>
          <p className="text-slate-400 text-sm">Accédez à vos résultats et rapports</p>
        </div>

        <AuthForm mode="login" />
      </div>
    </main>
  );
}
