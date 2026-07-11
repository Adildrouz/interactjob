"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LinkItem {
  slug: string;
  url: string;
  title: string | null;
  ok: boolean;
  status: number;
  reason: string;
  postCount: number;
  lastPublishedDate: string;
  checkedAt: string;
}

interface BlockedEntry {
  blockedAt: string;
  url: string;
  reason: string;
  status: number;
  label: string | null;
  textExcerpt: string;
}

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const REASON_LABELS: Record<string, string> = {
  live: "En ligne",
  rendered_error_shell: "Page 404 (article introuvable)",
  no_article_content: "Contenu article absent",
  title_mismatch: "Titre ne correspond pas",
  article_missing_from_data: "Article absent de articles.json",
};

export default function LiensArticlesPage() {
  const router = useRouter();
  const [data, setData] = useState<{ generatedAt: string | null; totalPosts: number; verifiedCount: number; brokenCount: number; items: LinkItem[]; blocked: BlockedEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState<string | null>(null); // slug being rechecked, or "*" for all

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/link-health");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [router]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function recheck(slug?: string) {
    setRechecking(slug || "*");
    const res = await fetch("/api/admin/link-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slug ? { slug } : {}),
    });
    const d: { results: Array<Pick<LinkItem, "slug" | "ok" | "status" | "reason" | "checkedAt">> } = await res.json();
    setRechecking(null);
    if (!data) return;
    const bySlug = new Map(d.results.map((r) => [r.slug, r]));
    setData({
      ...data,
      items: data.items.map((it) => {
        const fresh = bySlug.get(it.slug);
        return fresh ? { ...it, ok: fresh.ok, status: fresh.status, reason: fresh.reason, checkedAt: fresh.checkedAt } : it;
      }),
    });
  }

  if (loading || !data) {
    return <div className="flex items-center justify-center h-48 text-gray-400">Chargement…</div>;
  }

  const { totalPosts, verifiedCount, brokenCount, generatedAt, items, blocked } = data;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Santé des liens d&apos;articles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Chaque article référencé dans un post LinkedIn — dernière vérification : {relTime(generatedAt)}
          </p>
        </div>
        <button
          onClick={() => recheck()}
          disabled={rechecking === "*"}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0A2D6E] hover:bg-[#0d3a8e] rounded-lg transition-colors disabled:opacity-50"
        >
          {rechecking === "*" ? "Vérification…" : "🔄 Vérifier maintenant"}
        </button>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
          <div className="text-xs text-gray-500 mt-0.5">posts publiés référençant un article</div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-600">🟢 {verifiedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">liens vérifiés</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-600">🔴 {brokenCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">liens cassés</div>
        </div>
      </div>

      {/* Blocked publish attempts (Phase 5 fail-safe log) */}
      {blocked.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-amber-800 mb-2 text-sm">⛔ Publications bloquées automatiquement (pipeline fail-safe)</p>
          <div className="space-y-2">
            {blocked.map((b, i) => (
              <div key={i} className="text-xs text-amber-700 bg-amber-100/60 rounded-lg p-2">
                <span className="font-semibold">{relTime(b.blockedAt)}</span> — {b.url} — {REASON_LABELS[b.reason] || b.reason} (HTTP {b.status})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-article table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Article</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Posts</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Dernière publication</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vérifié</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Aucune donnée — lancez la vérification quotidienne côté agent.</td></tr>
              ) : items.map((it) => (
                <tr key={it.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {it.ok ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">🟢 Lien vérifié</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">🔴 Lien mort — bloqué</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[320px]">
                    <p className="font-semibold text-gray-900 truncate">{it.title || it.slug}</p>
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">{it.url}</a>
                    {!it.ok && <p className="text-xs text-red-600 mt-0.5">{REASON_LABELS[it.reason] || it.reason} (HTTP {it.status})</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{it.postCount}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{it.lastPublishedDate}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{relTime(it.checkedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => recheck(it.slug)}
                      disabled={rechecking === it.slug}
                      className="px-2.5 py-1 text-xs font-semibold text-[#0A2D6E] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {rechecking === it.slug ? "…" : "🔄 Revérifier"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
