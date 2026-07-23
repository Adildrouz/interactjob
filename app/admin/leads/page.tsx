"use client";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("/api/admin/recruteur-leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads || []))
      .finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: Lead["status"]) {
    setLeads((ls) => ls.map((l) => (l._id === id ? { ...l, status } : l)));
    await fetch("/api/admin/recruteur-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--ad-text)]">Leads recruteurs (inbound)</h1>
        <p className="text-sm text-[var(--ad-text-muted)] mt-1">
          Demandes du formulaire « Vous recrutez ? » — suivi manuel, stratégie gratuit-d&apos;abord.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ad-text-muted)]">Chargement…</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-[var(--ad-text-muted)]">Aucun lead pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l._id} className="rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] bg-[var(--ad-surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[var(--ad-text)]">
                    {l.company_name}
                    <span className="ml-2 text-xs font-medium text-[var(--ad-text-muted)]">
                      {l.sector}{l.sector_other ? ` — ${l.sector_other}` : ""}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--ad-text-muted)] mt-0.5">
                    <a href={`mailto:${l.email}`} className="underline">{l.email}</a>
                    {" · "}{new Date(l.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  {l.message && <p className="text-sm text-[var(--ad-text)] mt-2 whitespace-pre-wrap">{l.message}</p>}
                </div>
                <select
                  value={l.status}
                  onChange={(e) => setStatus(l._id, e.target.value as Lead["status"])}
                  className="text-sm border border-[var(--ad-border)] rounded-lg px-2 py-1.5 bg-[var(--ad-surface)]"
                >
                  {Object.entries(STATUS_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
