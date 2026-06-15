"use client";

import { useEffect, useState } from "react";

export type CurrencyInfo = {
  country: string;
  currency: string;
  symbol: string;
  priceIndividual: string;
  pricePack: string;
};

const FALLBACK: CurrencyInfo = {
  country: "EU",
  currency: "EUR",
  symbol: "€",
  priceIndividual: "4,90 €",
  pricePack: "49 €",
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${
    60 * 60 * 24
  }; SameSite=Lax`;
}

export function useCurrency() {
  const [info, setInfo] = useState<CurrencyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cookie = readCookie("ij_currency");
    if (cookie) {
      try {
        const parsed = JSON.parse(cookie) as CurrencyInfo;
        if (parsed && parsed.currency) {
          setInfo(parsed);
          setLoading(false);
          return;
        }
      } catch {
        /* fall through to fetch */
      }
    }

    fetch("/api/detect-currency")
      .then((r) => r.json())
      .then((data: CurrencyInfo) => {
        if (cancelled) return;
        setInfo(data);
        writeCookie("ij_currency", JSON.stringify(data));
      })
      .catch(() => {
        if (!cancelled) setInfo(FALLBACK);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const resolved = info ?? FALLBACK;

  return {
    currency: resolved.currency,
    symbol: resolved.symbol,
    priceIndividual: resolved.priceIndividual,
    pricePack: resolved.pricePack,
    loading,
  };
}
