"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SourceStat {
  source: string;
  total: number;
  active: number;
  expired: number;
  lastScrapedAt: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  "emploi-public.ma": "emploi-public.ma (source officielle)",
  "alwadifa-maroc.com": "alwadifa-maroc.com (secondaire)",
};

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function ConcoursSourcesPage() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    const res = await fetch("/api/admin/concours/sources");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const d = await res.json();
    setSources(d.sources || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const totals = sources.reduce(
    (acc, s) => ({ total: acc.total + s.total, active: acc.active + s.active, expired: acc.expired + s.expired }),
    { total: 0, active: 0, expired: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Sources concours</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Concours de la fonction publique marocaine, scrapés directement depuis les sources officielles.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-2xl font-bold">{totals.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total concours</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-2xl font-bold text-green-600">{totals.active}</p>
          <p className="text-xs text-muted-foreground mt-1">Actifs</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-2xl font-bold text-gray-400">{totals.expired}</p>
          <p className="text-xs text-muted-foreground mt-1">Clôturés</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Actifs</th>
                <th className="p-3 font-medium">Clôturés</th>
                <th className="p-3 font-medium">Dernier scrape</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source} className="border-t">
                  <td className="p-3 font-medium">{SOURCE_LABELS[s.source] || s.source}</td>
                  <td className="p-3">{s.total}</td>
                  <td className="p-3 text-green-600">{s.active}</td>
                  <td className="p-3 text-gray-400">{s.expired}</td>
                  <td className="p-3 text-muted-foreground">{relTime(s.lastScrapedAt)}</td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                    Aucune donnée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
