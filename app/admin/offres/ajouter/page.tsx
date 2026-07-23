"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/AdminShell";

import { CityOptions, SectorOptions } from "@/components/MoroccoSelectOptions";

export default function AjouterOffrePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "", company: "", city: "", sector: "", sectorOther: "",
    contractType: "CDI", salary: "", description: "", requirements: "",
    contactEmail: "", sponsored: false,
  });
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.company || !form.city || !form.sector) {
      toast("Remplissez tous les champs obligatoires", "error");
      return;
    }
    if (form.sector === "Autre" && !form.sectorOther.trim()) {
      toast("Précisez le métier ou secteur pour \"Autre\"", "error");
      return;
    }
    if (!form.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      toast("Email de contact employeur obligatoire et valide", "error");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/jobs/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      toast("Offre publiée avec succès !", "success");
      router.push("/admin/offres");
    } else {
      toast(data.error || "Erreur lors de la publication", "error");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajouter une offre</h1>
        <p className="text-sm text-gray-500 mt-1">Publication directe sans validation</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Informations générales</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du poste *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="ex: Développeur Full Stack"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise *</label>
            <input
              type="text"
              value={form.company}
              onChange={e => set("company", e.target.value)}
              placeholder="Nom de l'entreprise"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
              <select
                value={form.city}
                onChange={e => set("city", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                required
              >
                <option value="">Choisir…</option>
                <CityOptions />
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur *</label>
              <select
                value={form.sector}
                onChange={e => set("sector", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                required
              >
                <option value="">Choisir…</option>
                <SectorOptions />
              </select>
            </div>
          </div>

          {form.sector === "Autre" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Précisez le métier ou secteur *</label>
              <input
                type="text"
                value={form.sectorOther}
                onChange={e => set("sectorOther", e.target.value)}
                placeholder="ex: Sécurité privée, Esthétique, Import-export…"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact employeur *</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={e => set("contactEmail", e.target.value)}
              placeholder="recrutement@entreprise.ma"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Les candidatures seront transmises à cet email</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
              <select
                value={form.contractType}
                onChange={e => set("contractType", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salaire</label>
              <input
                type="text"
                value={form.salary}
                onChange={e => set("salary", e.target.value)}
                placeholder="ex: 8 000 – 12 000 MAD"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Détails</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Décrivez le poste, les missions…"
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-y"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profil recherché</label>
            <textarea
              value={form.requirements}
              onChange={e => set("requirements", e.target.value)}
              placeholder="Compétences requises, expérience…"
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-y"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sponsored}
              onChange={e => set("sponsored", e.target.checked)}
              className="w-4 h-4 rounded accent-[#00BCD4]"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Offre sponsorisée</p>
              <p className="text-xs text-gray-400">Mise en avant pendant 30 jours</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/offres")}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-[#0A2D6E] hover:bg-[#0d3a8e] rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Publication…" : "Publier l'offre"}
          </button>
        </div>
      </form>
    </div>
  );
}
