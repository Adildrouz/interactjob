interface StatsCardsProps {
  activeCount: number;
  totalPostes: number;
  expiringSoonCount: number;
  organismeCount: number;
}

const CARDS = [
  { key: "active", label: "Concours actifs", bg: "#00347A" },
  { key: "postes", label: "Postes ouverts", bg: "#00C2CB" },
  { key: "expiring", label: "Clôturent bientôt", bg: "#2E6FA8" },
  { key: "organismes", label: "Ministères qui recrutent", bg: "#2E7D52" },
] as const;

export default function StatsCards({ activeCount, totalPostes, expiringSoonCount, organismeCount }: StatsCardsProps) {
  const values: Record<(typeof CARDS)[number]["key"], number> = {
    active: activeCount,
    postes: totalPostes,
    expiring: expiringSoonCount,
    organismes: organismeCount,
  };

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
      {CARDS.map((card) => (
        <div key={card.key} className="rounded-2xl p-4 sm:p-5 text-white shadow-sm" style={{ backgroundColor: card.bg }}>
          <p className="text-2xl sm:text-3xl font-extrabold leading-none">{values[card.key]}</p>
          <p className="text-xs sm:text-sm text-white/85 mt-2 font-medium">{card.label}</p>
        </div>
      ))}
    </section>
  );
}
