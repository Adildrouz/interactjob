import { MOROCCO_REGIONS, SECTORS } from "@/lib/morocco";

/**
 * Drop-in <option> sources for city and sector <select>s, so every form
 * shares the same canonical lists while keeping its own styling.
 *
 * Usage:
 *   <select …>
 *     <option value="">Toutes les villes</option>
 *     <CityOptions />
 *   </select>
 */

export function CityOptions() {
  return (
    <>
      {MOROCCO_REGIONS.map((r) => (
        <optgroup key={r.region} label={r.region}>
          {r.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

export function SectorOptions({ locale = "fr" }: { locale?: string }) {
  return (
    <>
      {SECTORS.map((s) => (
        <option key={s.value} value={s.value}>
          {locale === "ar" ? s.labelAr : s.label}
        </option>
      ))}
    </>
  );
}
