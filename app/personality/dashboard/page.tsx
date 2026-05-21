import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyToken } from '@/lib/personality/auth';
import { connectPersonalityDB } from '@/lib/personality/db';
import PersonalityAssessment from '@/models/PersonalityAssessment';
import type { PersonalityResult } from '@/types/personality';

interface AssessmentDoc {
  _id: string;
  result: PersonalityResult;
  isPremium: boolean;
  completedAt: string;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('interact_personality_token')?.value;

  if (!token) redirect('/personality/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/personality/login');

  await connectPersonalityDB();
  const assessments = await PersonalityAssessment
    .find({ userId: payload.userId })
    .sort({ completedAt: -1 })
    .limit(20)
    .lean() as unknown as AssessmentDoc[];

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/personality" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
              ← Test Personnalité
            </Link>
            <h1 className="text-2xl font-bold text-white mt-3">Mes résultats</h1>
          </div>
          <form action="/api/personality/auth/logout" method="POST">
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
              Déconnexion
            </button>
          </form>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-white mb-2">Aucun test complété</h2>
            <p className="text-slate-400 text-sm mb-6">Passez votre premier test de personnalité</p>
            <Link
              href="/personality/assessment"
              className="inline-block rounded-xl px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}
            >
              Passer le test
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map(a => (
              <Link
                key={a._id}
                href={`/personality/result/${a._id}`}
                className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{a.result.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{a.result.label}</span>
                        {a.isPremium && (
                          <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)', color: 'white' }}>
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(a.completedAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-600">→</span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(['L', 'I', 'S', 'P'] as const).map(dim => (
                    <div key={dim} className="text-center">
                      <div className="text-xs text-slate-500 mb-1">{dim}</div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${a.result.scores[dim]}%`,
                            background: dim === 'L' ? '#6366f1' : dim === 'I' ? '#ec4899' : dim === 'S' ? '#10b981' : '#3b82f6',
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{a.result.scores[dim]}</div>
                    </div>
                  ))}
                </div>
              </Link>
            ))}

            <div className="text-center pt-4">
              <Link
                href="/personality/assessment"
                className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                + Nouveau test
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
