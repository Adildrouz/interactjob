"use client";
import { useEffect, useState } from "react";
import { excludedFromRecruiterOutreach } from "@/lib/recruiter-policy";

interface Lead {
  _id: string;
  company_name: string;
  sector: string;
  sector_other?: string;
  email: string;
  message: string;
  locale?: string;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: string;
  contacted_at?: string;
  notes?: string;
  admin_notification?: string;
  acknowledgement?: string;
}

const STATUS_LABELS: Record<Lead["status"], string> = {
  new: "🆕 Nouveau",
  contacted: "📞 Contacté",
  converted: "✅ Converti",
  closed: "🚫 Fermé",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);
  const [now] = useState(() => Date.now());
  const untreated = leads.filter(lead => lead.status === "new" && !excludedFromRecruiterOutreach(lead.company_name, lead.email));
  const overdue = untreated.filter(lead => now - new Date(lead.created_at).getTime() > 86400000);
  const visibleLeads = onlyNew ? untreated : leads;

  useEffect(() => {
    fetch("/api/admin/recruteur-leads", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("Impossible de charger les demandes."); return r.json(); })
      .then((d) => setLeads(d.leads || []))
      .catch(() => setError("Impossible de charger les demandes. Actualisez la page pour réessayer."))
      .finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: Lead["status"]) {
    setSaving(id); setError("");
    try {
    const res = await fetch("/api/admin/recruteur-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error("Le statut n’a pas été enregistré.");
    setLeads((ls) => ls.map((l) => (l._id === id ? { ...l, status } : l)));
    } catch { setError("Le statut n’a pas été enregistré. Réessayez."); }
    finally { setSaving(null); }
  }

  async function saveNotes(lead: Lead) {
    setSaving(lead._id); setError("");
    try {
      const res = await fetch("/api/admin/recruteur-leads", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead._id, notes: lead.notes || "" }),
      });
      if (!res.ok) throw new Error("Échec de sauvegarde");
    } catch { setError("Les notes n’ont pas été enregistrées. Réessayez."); }
    finally { setSaving(null); }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--ad-text)]">Leads recruteurs (inbound)</h1>
        <p className="text-sm text-[var(--ad-text-muted)] mt-1">
          Demandes du formulaire « Vous recrutez ? » — suivi manuel, stratégie gratuit-d&apos;abord.
        </p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        <strong>{untreated.length} demande(s) à traiter · {overdue.length} depuis plus de 24 h</strong>
        <label className="flex items-center gap-2"><input type="checkbox" checked={onlyNew} onChange={e => setOnlyNew(e.target.checked)} />Afficher seulement les demandes à traiter</label>
      </div>}

      {loading ? (
        <p className="text-sm text-[var(--ad-text-muted)]">Chargement…</p>
      ) : error && leads.length === 0 ? null : visibleLeads.length === 0 ? (
        <p className="text-sm text-[var(--ad-text-muted)]">Aucun lead pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">
          {visibleLeads.map((l) => (
            <div key={l._id} className="rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] bg-[var(--ad-surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[var(--ad-text)]">
                    {l.company_name}
                    {excludedFromRecruiterOutreach(l.company_name, l.email) && <span className="ml-2 text-xs text-gray-500">Exclu des prises de contact</span>}
                    <span className="ml-2 text-xs font-medium text-[var(--ad-text-muted)]">
                      {l.sector}{l.sector_other ? ` — ${l.sector_other}` : ""}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--ad-text-muted)] mt-0.5">
                    <a href={`mailto:${l.email}`} className="underline">{l.email}</a>
                    {" · "}{new Date(l.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  {l.status === "new" && now - new Date(l.created_at).getTime() > 86400000 && !excludedFromRecruiterOutreach(l.company_name, l.email) && <p className="mt-2 text-xs font-bold text-amber-700">Sans suivi depuis plus de 24 h</p>}
                  {l.message && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Lire le besoin de recrutement</summary><p className="mt-2 whitespace-pre-wrap">{l.message}</p></details>}
                  {l.message?.length === 3000 && <p className="mt-2 text-xs text-amber-700">Ancien formulaire : texte potentiellement tronqué. Demander le descriptif intégral.</p>}
                  {l.admin_notification === "failed" && <p className="mt-2 text-xs text-red-700">L’alerte email n’a pas été envoyée. Cette demande reste à traiter.</p>}
                  {l.acknowledgement === "failed" && <p className="mt-2 text-xs text-red-700">L’accusé de réception n’a pas été envoyé.</p>}
                </div>
                <select
                  value={l.status}
                  disabled={saving === l._id}
                  aria-label={`Statut de ${l.company_name}`}
                  onChange={(e) => setStatus(l._id, e.target.value as Lead["status"])}
                  className="text-sm border border-[var(--ad-border)] rounded-lg px-2 py-1.5 bg-[var(--ad-surface)]"
                >
                  {Object.entries(STATUS_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
              <label className="mt-4 block text-xs font-medium" htmlFor={`notes-${l._id}`}>Notes de suivi</label>
              <textarea id={`notes-${l._id}`} maxLength={10000} rows={2} value={l.notes || ""}
                onChange={event => setLeads(list => list.map(lead => lead._id === l._id ? { ...lead, notes: event.target.value } : lead))}
                className="mt-1 w-full rounded-lg border border-[var(--ad-border)] bg-transparent p-2 text-sm" />
              <button disabled={saving === l._id} onClick={() => saveNotes(l)} className="mt-2 text-xs font-semibold text-blue-700 underline">{saving === l._id ? "Enregistrement…" : "Enregistrer les notes"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
