/**
 * GET /api/depenses/exchange-rates
 *
 * Retourne les taux de change EUR→devises supportées.
 * Données fournies par api.frankfurter.app (open-source, gratuit, sans clé API).
 * Cache mémoire 1 heure — retombe sur des taux statiques si le service est indisponible.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYMBOLS = "USD,GBP,CHF,CAD,MAD";

// Taux de repli (mis à jour manuellement si nécessaire)
const FALLBACK: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.95, CAD: 1.47, MAD: 10.82,
};

let cache: { rates: Record<string, number>; ts: number } | null = null;
const TTL = 60 * 60 * 1000; // 1 h

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.rates);
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?base=EUR&symbols=${SYMBOLS}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { rates: Record<string, number> };
    const rates = { EUR: 1, ...data.rates };
    cache = { rates, ts: Date.now() };
    return NextResponse.json(rates);
  } catch {
    // Service indisponible : on retourne les taux de repli
    return NextResponse.json(FALLBACK, {
      headers: { "X-Rates-Source": "fallback" },
    });
  }
}
