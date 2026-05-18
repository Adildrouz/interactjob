"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erreur");
        return;
      }
      router.push("/admin/candidats");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-10 h-10 mx-auto mb-3">
            <Image src="/InteractJob-Logo.png" alt="InteractJob" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Espace Admin</h1>
          <p className="text-sm text-gray-500 mt-1">InteractJob.ma — Pool Candidats</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="••••••••••••"
              autoFocus
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Connexion →"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/" className="hover:text-gray-600 transition-colors">← Retour au site</a>
        </p>
      </div>
    </div>
  );
}
