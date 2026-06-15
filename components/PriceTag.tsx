"use client";

import { useCurrency } from "@/hooks/useCurrency";

export default function PriceTag({
  type,
  className = "",
}: {
  type: "individual" | "pack";
  className?: string;
}) {
  const { priceIndividual, pricePack, loading } = useCurrency();

  if (loading) {
    return (
      <span
        className={`inline-block h-[1em] w-16 animate-pulse rounded bg-current opacity-20 align-middle ${className}`}
        aria-hidden="true"
      />
    );
  }

  const value = type === "individual" ? priceIndividual : pricePack;
  return <span className={className}>{value}</span>;
}
