"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast, useConfirm } from "../components/AdminShell";

interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  lang: string;
  publishedAt: string;
  published: boolean;
  readTime?: number;
  author?: string;
  pilier?: string;
}

function relTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("");

  useEffect(() => {
    fetch("/api/admin/blog")
      .then(res => {
        if (res.status === 401) { router.push("/admin/login"); return null; }
        return res.json();
      })
      .then(d => {
        if (d) setArticles(d.articles || []);
        setLoading(false);
      });
  }, [router]);

  async function togglePublish(article: Article) {
    const next = !article.published;
    const ok = await confirm({
      title: next ? "Republier l'article ?" : "Dépublier l'article ?",
      message: `"${article.title}"`,
    });
    if (!ok) return;

    setActionId(article.id);
    const res = await fetch(`/api/admin/blog/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    });
    if (res.ok) {
      toast(next ? "Article republié" : "Article dépublié", "success");
      setArticles(a => a.map(x => x.id === article.id ? { ...x, published: next } : x));
    } else {
      toast("Erreur", "error");
    }
    setActionId(null);
  }

  async function deleteArticle(article: Article) {
    const ok = await confirm({
      title: "Supprimer l'article ?",
      message: `"${article.title}" sera supprimé définitivement.`,
      danger: true,
    });
    if (!ok) return;

    setActionId(article.id);
    const res = await fetch(`/api/admin/blog/${article.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Article supprimé", "success");
      setArticles(a => a.filter(x => x.id !== article.id));
    } else {
      toast("Erreur lors de la suppression", "error");
    }
    setActionId(null);
  }

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
    const matchLang = !filterLang || a.lang === filterLang;
    return matchSearch && matchLang;
  });

  const langs = [...new Set(articles.map(a => a.lang))].sort();
  const publishedCount = articles.filter(a => a.published).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-0.5">{articles.length} articles · {publishedCount} publiés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher un article…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] w-full max-w-sm"
        />
        <select
          value={filterLang}
          onChange={e => setFilterLang(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
        >
          <option value="">Toutes langues</option>
          {langs.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Titre</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Catégorie</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Langue</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(a => (
                  <tr key={a.id} className={`hover:bg-gray-50 transition-colors ${!a.published ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[280px]">
                      <p className="truncate">{a.title}</p>
                      {a.author && <p className="text-xs text-gray-400 font-normal">{a.author}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.category}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase font-semibold">{a.lang}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{relTime(a.publishedAt)}</td>
                    <td className="px-4 py-3">
                      {a.published
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Publié</span>
                        : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Masqué</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => togglePublish(a)}
                          disabled={actionId === a.id}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {a.published ? "Masquer" : "Publier"}
                        </button>
                        <button
                          onClick={() => deleteArticle(a)}
                          disabled={actionId === a.id}
                          className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-400">Aucun article trouvé</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
