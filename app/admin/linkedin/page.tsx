"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../components/AdminShell";

interface Message {
  _id: string;
  sender_name: string;
  sender_url: string;
  sender_title: string;
  message_text: string;
  category: string | null;
  confidence: number | null;
  language: string | null;
  key_points: string[];
  sender_firstname: string | null;
  response_draft: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  sent_at: string | null;
  error?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  job_seeker:       "Chercheur d'emploi",
  recruiter:        "Recruteur",
  internship:       "Stage",
  platform_question:"Question plateforme",
  networking:       "Networking",
  commercial:       "Offre comm.",
  other:            "Autre",
};

const CATEGORY_COLORS: Record<string, string> = {
  job_seeker:       "bg-blue-100 text-blue-700",
  recruiter:        "bg-green-100 text-green-700",
  internship:       "bg-purple-100 text-purple-700",
  platform_question:"bg-cyan-100 text-cyan-700",
  networking:       "bg-amber-100 text-amber-700",
  commercial:       "bg-red-100 text-red-700",
  other:            "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-gray-100 text-gray-600",
  draft_ready: "bg-amber-100 text-amber-700",
  approved:    "bg-green-100 text-green-700",
  sent:        "bg-blue-100 text-blue-700",
  skipped:     "bg-gray-100 text-gray-400",
  error:       "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "En attente",
  draft_ready: "Brouillon prêt",
  approved:    "Approuvé",
  sent:        "Envoyé",
  skipped:     "Ignoré",
  error:       "Erreur",
};

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Import modal ───────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ sender_name: "", sender_url: "", sender_title: "", message_text: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sender_name || !form.message_text) { toast("Nom et message requis", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/linkedin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (d.duplicate) { toast("Message déjà existant", "info"); onClose(); return; }
    if (d.success) { toast("Message ajouté — traitement en cours…", "success"); onImported(); onClose(); }
    else toast(d.error || "Erreur", "error");
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Importer un message LinkedIn</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom expéditeur *</label>
              <input value={form.sender_name} onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))}
                placeholder="Prénom NOM" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre / Poste</label>
              <input value={form.sender_title} onChange={e => setForm(f => ({ ...f, sender_title: e.target.value }))}
                placeholder="ex: DRH chez Marriott" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL profil LinkedIn</label>
            <input value={form.sender_url} onChange={e => setForm(f => ({ ...f, sender_url: e.target.value }))}
              placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du message *</label>
            <textarea value={form.message_text} onChange={e => setForm(f => ({ ...f, message_text: e.target.value }))}
              rows={5} placeholder="Collez le message LinkedIn ici…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-y" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#0A2D6E] hover:bg-[#0d3a8e] rounded-lg disabled:opacity-50">
              {saving ? "Ajout…" : "Ajouter et traiter →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Message detail panel ────────────────────────────────────────────────────────
function MessagePanel({
  msg,
  onClose,
  onUpdate,
}: {
  msg: Message;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Message>) => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState(msg.response_draft || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function patchStatus(status: string) {
    setSaving(true);
    await fetch(`/api/admin/linkedin/messages/${msg._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, response_draft: draft }),
    });
    onUpdate(msg._id, { status, response_draft: draft });
    setSaving(false);
    if (status === "sent") toast("Marqué comme envoyé ✓", "success");
    if (status === "skipped") { toast("Message ignoré", "info"); onClose(); }
    if (status === "approved") toast("Réponse approuvée ✓", "success");
  }

  async function saveDraft() {
    setSaving(true);
    await fetch(`/api/admin/linkedin/messages/${msg._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_draft: draft }),
    });
    onUpdate(msg._id, { response_draft: draft });
    setSaving(false);
    toast("Brouillon sauvegardé", "success");
  }

  function copyDraft() {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Réponse copiée — colle-la dans LinkedIn", "success");
  }

  const catColor = CATEGORY_COLORS[msg.category || "other"] || CATEGORY_COLORS.other;
  const catLabel = CATEGORY_LABELS[msg.category || "other"] || msg.category || "—";
  const conf = msg.confidence != null ? Math.round(msg.confidence * 100) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">{msg.sender_name}</p>
            {msg.sender_title && <p className="text-xs text-gray-400">{msg.sender_title}</p>}
          </div>
          <div className="flex items-center gap-3">
            {msg.sender_url && (
              <a href={msg.sender_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#0A66C2] hover:underline font-semibold">
                Voir profil →
              </a>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${catColor}`}>{catLabel}</span>
            {conf !== null && <span className="text-xs text-gray-400">{conf}%</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Original message */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Message reçu · {relTime(msg.created_at)}
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {msg.message_text}
            </div>
          </div>

          {/* Key points */}
          {msg.key_points?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {msg.key_points.map(k => (
                <span key={k} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{k}</span>
              ))}
            </div>
          )}

          {/* Draft response */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Réponse suggérée par Claude</p>
              {msg.status === "draft_ready" || msg.status === "approved" ? (
                <span className="text-xs text-green-600 font-semibold">✓ Prête</span>
              ) : msg.status === "pending" ? (
                <span className="text-xs text-amber-500 font-semibold">En cours de traitement…</span>
              ) : null}
            </div>
            {draft ? (
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-y font-mono leading-relaxed"
              />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-center">
                {msg.status === "pending"
                  ? "Traitement en cours… Cliquez sur « Traiter » pour lancer l'analyse."
                  : msg.error || "Aucun brouillon généré."}
              </div>
            )}
          </div>

          {msg.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600">{msg.error}</div>
          )}
        </div>

        {/* Actions footer */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-3">
          {draft && (
            <button
              onClick={copyDraft}
              className="w-full flex items-center justify-center gap-2 bg-[#0A66C2] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#004182] transition-colors"
            >
              {copied ? "✓ Copié !" : "📋 Copier la réponse → Coller dans LinkedIn"}
            </button>
          )}
          <div className="flex gap-2">
            {draft && (
              <button
                onClick={saveDraft}
                disabled={saving}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                💾 Sauvegarder
              </button>
            )}
            {(msg.status === "draft_ready" || msg.status === "approved") && (
              <button
                onClick={() => patchStatus("sent")}
                disabled={saving}
                className="flex-1 px-3 py-2 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
              >
                ✅ Marquer comme envoyé
              </button>
            )}
            <button
              onClick={() => patchStatus("skipped")}
              disabled={saving}
              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              ⏭ Ignorer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LinkedInPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetch_ = useCallback(async () => {
    const url = filterStatus
      ? `/api/admin/linkedin/messages?status=${filterStatus}`
      : "/api/admin/linkedin/messages";
    const res = await fetch(url);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const d = await res.json();
    setMessages(d.messages || []);
    setByStatus(d.byStatus || {});
    setLoading(false);
  }, [filterStatus, router]);

  useEffect(() => { setLoading(true); fetch_(); }, [fetch_]);

  async function processAll() {
    setProcessing(true);
    const res = await fetch("/api/admin/linkedin/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const d = await res.json();
    setProcessing(false);
    if (d.success) {
      toast(`${d.processed} message(s) traité(s) par Claude`, "success");
      fetch_();
    } else {
      toast(d.error || "Erreur", "error");
    }
  }

  async function processOne(msg: Message) {
    const res = await fetch("/api/admin/linkedin/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg._id }),
    });
    const d = await res.json();
    if (d.success && d.processed > 0) {
      toast("Traitement terminé", "success");
      fetch_();
    }
  }

  function updateMessage(id: string, updates: Partial<Message>) {
    setMessages(ms => ms.map(m => m._id === id ? { ...m, ...updates } : m));
    if (selected?._id === id) setSelected(s => s ? { ...s, ...updates } : s);
  }

  const pendingCount = byStatus["pending"] || 0;
  const draftCount   = byStatus["draft_ready"] || 0;

  const tabs: Array<{ key: string; label: string; count?: number }> = [
    { key: "",            label: "Tous",          count: Object.values(byStatus).reduce((a, b) => a + b, 0) },
    { key: "pending",     label: "En attente",    count: pendingCount },
    { key: "draft_ready", label: "Brouillons",    count: draftCount },
    { key: "approved",    label: "Approuvés",     count: byStatus["approved"] },
    { key: "sent",        label: "Envoyés",       count: byStatus["sent"] },
    { key: "skipped",     label: "Ignorés" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages LinkedIn</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Agent de réponse automatique — Classification & rédaction par Claude
          </p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              onClick={processAll}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#00BCD4] hover:bg-[#00a0b8] rounded-lg transition-colors disabled:opacity-50"
            >
              {processing ? "Traitement…" : `⚡ Traiter ${pendingCount} message${pendingCount > 1 ? "s" : ""}`}
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0A2D6E] hover:bg-[#0d3a8e] rounded-lg transition-colors"
          >
            + Importer un message
          </button>
        </div>
      </div>

      {/* Phantombuster setup info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm">
        <p className="font-semibold text-blue-800 mb-1">📡 Webhook Phantombuster</p>
        <p className="text-blue-700">
          Configurez Phantombuster pour envoyer les messages scraped à :{" "}
          <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">
            POST https://interactjob.ma/api/webhook/phantombuster
          </code>
          {" "}avec header{" "}
          <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">x-webhook-secret: WEBHOOK_SECRET</code>
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilterStatus(t.key)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              filterStatus === t.key ? "bg-white text-[#0A2D6E] shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                t.key === "pending" ? "bg-amber-100 text-amber-700" :
                t.key === "draft_ready" ? "bg-green-100 text-green-700" :
                "bg-gray-200 text-gray-600"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Chargement…</div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">
            {filterStatus ? "Aucun message dans cette catégorie" : "Aucun message LinkedIn pour le moment"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Importez un message manuellement ou configurez Phantombuster
          </p>
          <button
            onClick={() => setShowImport(true)}
            className="mt-4 px-5 py-2 text-sm font-semibold text-white bg-[#0A2D6E] rounded-lg hover:bg-[#0d3a8e]"
          >
            + Importer un message
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Expéditeur</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Message</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Catégorie</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {messages.map(msg => (
                  <tr
                    key={msg._id}
                    onClick={() => setSelected(msg)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{msg.sender_name}</p>
                      {msg.sender_title && (
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{msg.sender_title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="text-gray-700 truncate">{msg.message_text}</p>
                    </td>
                    <td className="px-4 py-3">
                      {msg.category ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[msg.category] || "bg-gray-100 text-gray-600"}`}>
                            {CATEGORY_LABELS[msg.category] || msg.category}
                          </span>
                          {msg.confidence != null && (
                            <span className="text-xs text-gray-400">{Math.round(msg.confidence * 100)}%</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[msg.status] || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[msg.status] || msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {relTime(msg.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                        {msg.status === "pending" && (
                          <button
                            onClick={() => processOne(msg)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#00BCD4] bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                          >
                            ⚡ Traiter
                          </button>
                        )}
                        {msg.response_draft && (
                          <button
                            onClick={() => { setSelected(msg); }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#0A2D6E] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Voir →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { fetch_(); processAll(); }}
        />
      )}

      {/* Message detail panel */}
      {selected && (
        <MessagePanel
          msg={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateMessage}
        />
      )}
    </div>
  );
}
