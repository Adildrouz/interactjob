"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MBTI_TYPES } from "../../mbti/mbtiData";

const NAVY = "#00347A";
const TURQ = "#00C2CB";

type StoredResult = {
  id: string;
  test_type: string;
  result_type: string;
  scores?: Record<string, number>;
  created_at: string;
};

export default function ResultClient({ id }: { id: string }) {
  const [state, setState] = useState<"loading" | "found" | "missing">("loading");
  const [data, setData] = useState<StoredResult | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(id);
      if (raw) {
        setData(JSON.parse(raw) as StoredResult);
        setState("found");
        return;
      }
    } catch {
      /* ignore */
    }
    setState("missing");
  }, [id]);

  if (state === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-gray-400">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderColor: TURQ }} />
      </div>
    );
  }

  if (state === "missing" || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold" style={{ color: NAVY }}>Résultat non disponible</h1>
        <p className="mt-2 text-gray-600">Ce résultat n'est pas enregistré sur cet appareil. Refaites le test pour obtenir votre profil.</p>
        <Link href="/test-personnalite" className="mt-5 inline-block rounded-xl px-5 py-3 font-semibold text-white" style={{ background: TURQ }}>
          Refaire le test
        </Link>
      </div>
    );
  }

  const type = data.test_type === "mbti" ? MBTI_TYPES[data.result_type] : undefined;
  const name = type ? `${data.result_type} — ${type.name}` : data.result_type;
  const top3 = type ? type.strengths.slice(0, 3) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${NAVY}` }}>
          <div className="p-6 text-white text-center" style={{ background: NAVY }}>
            <p className="text-sm uppercase tracking-wide" style={{ color: TURQ }}>Mon profil</p>
            <h1 className="mt-1 text-2xl font-bold">{name}</h1>
            {type && <p className="mt-1 text-white/80 text-sm">{type.tagline}</p>}
          </div>

          <div className="bg-white p-6">
            {top3.length > 0 && (
              <>
                <h2 className="font-bold mb-2" style={{ color: NAVY }}>Mes 3 forces principales</h2>
                <ul className="space-y-1 text-gray-700 text-sm mb-6">
                  {top3.map((s) => <li key={s}>✅ {s}</li>)}
                </ul>
              </>
            )}

            <h2 className="font-bold mb-2" style={{ color: NAVY }}>Compatibilité avec les offres InteractJob</h2>
            <p className="text-sm text-gray-600 mb-5">
              Votre profil correspond à des métiers précis. Découvrez les offres d'emploi
              filtrées selon votre personnalité.
            </p>

            <Link
              href={`/offres?personality=${data.result_type}`}
              className="block text-center rounded-xl px-5 py-3 font-semibold text-white"
              style={{ background: TURQ }}
            >
              Voir les offres compatibles avec mon profil →
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link href="/test-personnalite" className="hover:underline" style={{ color: NAVY }}>
            Passer un autre test de personnalité
          </Link>
        </p>
      </div>
    </div>
  );
}
