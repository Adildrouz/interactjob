import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CurrencyInfo = {
  country: string;
  currency: string;
  symbol: string;
  priceIndividual: string;
  pricePack: string;
};

const EUR: Omit<CurrencyInfo, "country"> = {
  currency: "EUR",
  symbol: "€",
  priceIndividual: "4,90 €",
  pricePack: "49 €",
};

function resolve(country: string): CurrencyInfo {
  switch (country) {
    case "MA":
      return {
        country,
        currency: "MAD",
        symbol: "MAD",
        priceIndividual: "49 MAD",
        pricePack: "490 MAD",
      };
    case "FR":
    case "BE":
      return { country, ...EUR };
    case "CH":
      return {
        country,
        currency: "CHF",
        symbol: "CHF",
        priceIndividual: "4.90 CHF",
        pricePack: "49 CHF",
      };
    default:
      return { country: country || "EU", ...EUR };
  }
}

export async function GET(req: NextRequest) {
  try {
    const country = (req.headers.get("cf-ipcountry") || "").toUpperCase();
    const info = resolve(country);

    const res = NextResponse.json(info);
    res.cookies.set("ij_currency", JSON.stringify(info), {
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch {
    // Never throw — fall back to EUR silently
    return NextResponse.json({ country: "EU", ...EUR });
  }
}
