"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { CityOptions } from "@/components/MoroccoSelectOptions";

export default function HeroSearch() {
  const router = useRouter();
  const t = useTranslations("hero");
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (city) params.set("city", city);
    router.push(`/offres?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl shadow-xl max-w-2xl mx-auto"
    >
      <div className="flex items-center flex-1 gap-2 px-3">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 text-gray-800 placeholder-gray-400 text-sm outline-none bg-transparent py-2"
        />
      </div>

      <div className="h-px sm:h-auto sm:w-px bg-gray-100 sm:bg-gray-200 mx-2" />

      <div className="flex items-center gap-2 px-3 sm:w-44">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1 text-sm text-gray-700 outline-none bg-transparent py-2"
        >
          <option value="">{t("cityAll")}</option>
          <CityOptions />
        </select>
      </div>

      <button
        type="submit"
        className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors flex-shrink-0"
      >
        {t("searchButton")}
      </button>
    </form>
  );
}
