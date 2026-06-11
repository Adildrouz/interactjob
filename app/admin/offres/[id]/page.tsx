"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const C = {
  navy: "#00347A", turquoise: "#00C2CB", dark: "#001F4D",
  light: "#F0F8FF", muted: "#6B8CAE", border: "#D0E4F0",
  warn: "#F59E0B", err: "#EF4444", green: "#10B981",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  recue:    { label: "Reçue",    color: C.muted },
  vue:      { label: "Vue",      color: C.turquoise },
  refusee:  { label: "Refusée",  color: C.err },
  acceptee: { label: "Acceptée", color: C.green },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sponsorSending, setSponsorSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/jobs/${id}`);
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(applicationId: string, status: string) {
    await fetch(`/api/admin/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    load();
  }

  async function proposerSponsorisee() {
    if (!data?.job?.contactEmail) return;
    setSponsorSending(true);
    await fetch("/api/admin/jobs/sponsor/" + id, { method: "POST" }).catch(() => {});
    setSponsorSending(false);
    alert("Email envoyé à " + data.job.contactEmail);
  }

  if (loading) return (
    <div style={{ background: C.light, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.navy, fontSize: 18 }}>Chargement…</div>
    </div>
  );
  if (!data) return (
    <div style={{ background: C.light, minHeight: "100vh", padding: 40 }}>
      <div style={{ color: C.err }}>Offre introuvable.</div>
    </div>
  );

  const { job, stats, applications } = data;

  return (
    <div style={{ background: C.light, minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: "16px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/admin")} style={{ color: "#fff", opacity: 0.7, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
          ← Dashboard
        </button>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{job.title}</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{job.company} · {job.city}</span>
        {job.sponsored && (
          <span style={{ background: C.warn, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
            SPONSORISÉE
          </span>
        )}
        {!job.sponsored && (
          <button
            onClick={proposerSponsorisee}
            disabled={sponsorSending || !job.contactEmail}
            style={{ marginLeft: "auto", background: C.turquoise, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            {sponsorSending ? "Envoi…" : "⭐ Proposer en Sponsorisée"}
          </button>
        )}
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Vues totales",      value: stats.viewsTotal,        icon: "👁️" },
            { label: "Vues aujourd'hui",  value: stats.viewsToday,        icon: "📅" },
            { label: "Candidatures",      value: stats.applicationsTotal, icon: "📬" },
            { label: "Taux de conversion",value: stats.viewsTotal > 0 ? (stats.applicationsTotal / stats.viewsTotal * 100).toFixed(1) + "%" : "—", icon: "📊" },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.navy }}>{value}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Sparkline + meta */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, color: C.navy, marginBottom: 12 }}>Vues — 7 derniers jours</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={stats.sparkline}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke={C.turquoise} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, color: C.navy, marginBottom: 12 }}>Détails</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <Row label="Publié le"       value={job.postedAt ? new Date(job.postedAt).toLocaleDateString("fr-FR") : "—"} />
              <Row label="Secteur"         value={job.sector || "—"} />
              <Row label="Contrat"         value={job.contractType || "—"} />
              <Row label="Contact email"   value={job.contactEmail || "—"} />
              <Row label="Dernière candid." value={stats.lastApplication ? new Date(stats.lastApplication).toLocaleDateString("fr-FR") : "—"} />
            </div>
          </div>
        </div>

        {/* Applications table */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.navy, fontSize: 15 }}>
            Candidatures ({applications.length})
          </div>
          {applications.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.muted }}>Aucune candidature reçue.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.light }}>
                  {["Candidat", "Email", "Date", "Statut", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((a: any, i: number) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : "#fafcff" }}>
                    <td style={{ padding: "10px 16px", color: C.dark, fontWeight: 500 }}>{a.applicantName}</td>
                    <td style={{ padding: "10px 16px", color: C.muted }}>{a.applicantEmail}</td>
                    <td style={{ padding: "10px 16px", color: C.muted }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <select
                        value={a.status}
                        onChange={e => changeStatus(a.id, e.target.value)}
                        style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 12,
                          color: STATUS_LABELS[a.status]?.color || C.muted, fontWeight: 600, cursor: "pointer" }}
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {a.cvUrl && (
                          <a href={a.cvUrl} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, color: C.turquoise, fontWeight: 600, textDecoration: "none" }}>
                            📄 CV
                          </a>
                        )}
                        {a.applicantEmailFull && (
                          <a href={`mailto:${a.applicantEmailFull}`}
                            style={{ fontSize: 12, color: C.navy, fontWeight: 600, textDecoration: "none" }}>
                            ✉️ Email
                          </a>
                        )}
                        {a.coverLetter && (
                          <button
                            onClick={() => alert(a.coverLetter)}
                            style={{ fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                            💬 Msg
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#6B8CAE" }}>{label}</span>
      <span style={{ color: "#001F4D", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
