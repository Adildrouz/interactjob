"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const C = {
  navy: "#00347A", turquoise: "#00C2CB", dark: "#001F4D",
  light: "#F0F8FF", muted: "#6B8CAE", border: "#D0E4F0",
  warn: "#F59E0B", err: "#EF4444", green: "#10B981",
};

const STATUS_OPTIONS = ["", "prospect", "contacted", "client", "unsubscribed"];
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  prospect:     { label: "Prospect",     color: C.muted },
  contacted:    { label: "Contacté",     color: C.warn },
  client:       { label: "Client",       color: C.green },
  unsubscribed: { label: "Désabonné",    color: C.err },
};

const TEMPLATES = [
  { id: "cold",     label: "Template 1 — Cold Outreach",   desc: "Première prise de contact employeur" },
  { id: "followup", label: "Template 2 — Relance J+7",     desc: "Suivi après la première campagne" },
  { id: "renewal",  label: "Template 3 — Renouvellement",  desc: "Offre arrivant à expiration" },
];

export default function MarketingPage() {
  const router = useRouter();
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [sending, setSending] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState("cold");
  const [showPreview, setShowPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterCity) params.set("city", filterCity);
    if (filterSector) params.set("sector", filterSector);
    const r = await fetch(`/api/admin/employers?${params}`);
    if (r.ok) {
      const d = await r.json();
      setEmployers(d.employers || []);
    }
    setLoading(false);
  }, [filterStatus, filterCity, filterSector]);

  useEffect(() => { load(); }, [load]);

  async function seed() {
    setSeeding(true);
    setSeedResult(null);
    const r = await fetch("/api/admin/employers/seed", { method: "POST" });
    const d = await r.json();
    setSeedResult(`✅ ${d.inserted} employeurs ajoutés (${d.total} extraits de jobs.json)`);
    setSeeding(false);
    load();
  }

  function toggleAll() {
    if (selected.size === employers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(employers.map(e => e._id?.toString() || e._id)));
    }
  }

  function toggle(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  async function sendCampaign() {
    if (selected.size === 0) return;
    if (!confirm(`Envoyer "${TEMPLATES.find(t => t.id === template)?.label}" à ${selected.size} employeur(s) ?`)) return;
    setSending(true);
    setSendResult(null);
    const r = await fetch("/api/admin/employers/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employerIds: Array.from(selected), template }),
    });
    const d = await r.json();
    setSendResult(`✅ ${d.sent} envoyés, ${d.errors} erreurs`);
    setSending(false);
    setSelected(new Set());
    load();
  }

  const selectedCount = selected.size;

  return (
    <div style={{ background: C.light, minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: "16px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/admin")} style={{ color: "#fff", opacity: 0.7, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
          ← Dashboard
        </button>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>📧 Marketing Employeurs</span>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total employeurs", value: employers.length },
            { label: "Prospects",        value: employers.filter(e => e.status === "prospect").length },
            { label: "Contactés",        value: employers.filter(e => e.status === "contacted").length },
            { label: "Clients",          value: employers.filter(e => e.status === "client").length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.navy }}>{value}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <button onClick={seed} disabled={seeding} style={{ background: C.navy, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            {seeding ? "Import…" : "🔄 Importer depuis jobs.json"}
          </button>

          <div style={{ width: 1, height: 28, background: C.border }} />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
              <option value="">Tous statuts</option>
              {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="Ville…" style={inputStyle} />
            <input value={filterSector} onChange={e => setFilterSector(e.target.value)} placeholder="Secteur…" style={inputStyle} />
          </div>

          {selectedCount > 0 && (
            <>
              <div style={{ width: 1, height: 28, background: C.border }} />
              <span style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>{selectedCount} sélectionné(s)</span>
              <select value={template} onChange={e => setTemplate(e.target.value)} style={selectStyle}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <button onClick={() => setShowPreview(!showPreview)} style={{ background: "none", border: `1px solid ${C.border}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                👁 Aperçu
              </button>
              <button onClick={sendCampaign} disabled={sending} style={{ background: C.turquoise, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                {sending ? `Envoi en cours…` : `📤 Envoyer à ${selectedCount}`}
              </button>
            </>
          )}
        </div>

        {/* Result banners */}
        {seedResult && <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 6, padding: "10px 16px", marginBottom: 12, fontSize: 13, color: "#065f46" }}>{seedResult}</div>}
        {sendResult && <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 6, padding: "10px 16px", marginBottom: 12, fontSize: 13, color: "#065f46" }}>{sendResult}</div>}

        {/* Template preview */}
        {showPreview && (
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8 }}>{TEMPLATES.find(t => t.id === template)?.label}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{TEMPLATES.find(t => t.id === template)?.desc}</div>
            <TemplatePreview template={template} />
          </div>
        )}

        {/* Employers table */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.light }}>
                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>
                  <input type="checkbox" onChange={toggleAll} checked={selectedCount === employers.length && employers.length > 0} />
                </th>
                {["Entreprise", "Email", "Ville", "Secteur", "Statut", "Dernière offre", "Contacté le"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: C.muted }}>Chargement…</td></tr>
              ) : employers.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: C.muted }}>
                  Aucun employeur. Cliquez sur "Importer depuis jobs.json" pour commencer.
                </td></tr>
              ) : employers.map((e: any, i: number) => {
                const id = e._id?.toString() || e._id;
                const sl = STATUS_LABELS[e.status] || { label: e.status, color: C.muted };
                return (
                  <tr key={id} style={{ borderBottom: `1px solid ${C.border}`, background: selected.has(id) ? "#f0f9ff" : i % 2 === 0 ? "#fff" : "#fafcff" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} />
                    </td>
                    <td style={{ padding: "10px 12px", color: C.dark, fontWeight: 500 }}>{e.company_name}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{e.email}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{e.city || "—"}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{e.sector || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: sl.color + "20", color: sl.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                        {sl.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>{e.last_job_title || "—"}</td>
                    <td style={{ padding: "10px 12px", color: C.muted }}>
                      {e.last_contacted ? new Date(e.last_contacted).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ template }: { template: string }) {
  const previews: Record<string, { subject: string; body: string }> = {
    cold: {
      subject: "[Prénom], publiez votre offre d'emploi sur InteractJob.ma",
      body: `Bonjour [Prénom],\n\nNous avons remarqué que [Entreprise] recrute activement au Maroc.\n\nInteractJob.ma vous propose de publier votre offre directement sur notre plateforme — des milliers de candidats qualifiés visitent notre site chaque mois.\n\n🌟 Offre Sponsorisée : 990 MAD / 30 jours\n✅ Mise en avant homepage + newsletter 8 000 abonnés RH\n✅ Badge "Sponsorisée" + position prioritaire\n✅ Rapport de performance (vues + candidatures)\n\n→ Publier mon offre maintenant\n\nCordialement,\nAdil Drouz — Fondateur InteractJob.ma`,
    },
    followup: {
      subject: "Votre offre sur InteractJob.ma — encore disponible",
      body: `Bonjour [Prénom],\n\nJe reviens vers vous suite à mon message de la semaine dernière.\n\nVos recrutements en cours méritent d'être vus par les meilleurs candidats marocains.\n\nCette semaine, des centaines de candidats ont recherché des postes dans votre secteur sur InteractJob.ma.\n\n🎯 Offre de lancement : 544 MAD (promo valable cette semaine)\n\n→ Démarrer maintenant\n\nCordialement,\nAdil Drouz — Fondateur InteractJob.ma`,
    },
    renewal: {
      subject: "[Entreprise] — votre offre expire bientôt",
      body: `Bonjour [Prénom],\n\nVotre offre "[Titre poste]" arrive à expiration prochainement.\n\nRenouveler maintenant pour continuer à recevoir des candidatures qualifiées.\n\n→ Renouveler mon offre — 990 MAD / 30 jours\n\nCordialement,\nAdil Drouz — Fondateur InteractJob.ma`,
    },
  };
  const p = previews[template];
  if (!p) return null;
  return (
    <div style={{ border: `1px solid #D0E4F0`, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ background: "#00347A", padding: "12px 16px", color: "#fff", fontSize: 13, fontWeight: 600 }}>
        Objet : {p.subject}
      </div>
      <div style={{ padding: 16, whiteSpace: "pre-wrap", fontSize: 13, color: "#001F4D", lineHeight: 1.6 }}>
        {p.body}
      </div>
      <div style={{ background: "#00C2CB", padding: "10px 16px", textAlign: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
        → Voir sur InteractJob.ma
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  border: `1px solid #D0E4F0`, borderRadius: 6, padding: "6px 10px", fontSize: 13,
  color: "#001F4D", background: "#fff", cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  border: `1px solid #D0E4F0`, borderRadius: 6, padding: "6px 10px", fontSize: 13,
  color: "#001F4D", background: "#fff", outline: "none", width: 120,
};
