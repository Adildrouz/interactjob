"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFoundSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const destination = query.trim()
      ? `/offres?keyword=${encodeURIComponent(query.trim())}`
      : "/offres";
    router.push(destination);
  }

  return (
    <form onSubmit={handleSearch} className="max-w-xl mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un poste, une entreprise…"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors whitespace-nowrap"
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}
