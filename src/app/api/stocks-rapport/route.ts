/**
 * POST /api/stocks-rapport
 * Génère une analyse IA de l'inventaire via Claude Haiku.
 * Body : {
 *   totalProducts, outOfStock, lowStock, criticalStock,
 *   totalValue, totalSaleValue, potentialMargin, marginRate,
 *   totalIn, totalOut,
 *   topCategories: [{ cat, count, val }],
 *   ruptures: [{ name, sku, supplier }],
 *   alertes: [{ name, sku, current, minimum, state }]
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("stocks-rapport");

// Rate limit : 10 analyses stocks/user/heure
const stocksLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = stocksLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    stocksLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 10) return false;
  slot.count++;
  return true;
}

const SYSTEM = `\
Tu es un expert en gestion des stocks et logistique pour TPE/freelances françaises.
Génère une analyse de l'inventaire en JSON valide (sans markdown) :
{
  "score_sante": <0-100>,
  "resume_executif": "<2-3 phrases résumant l'état des stocks>",
  "points_forts": ["<point positif 1>", "<point positif 2>"],
  "alertes": ["<alerte critique si nécessaire>"],
  "recommandations": ["<action logistique concrète 1>", "<action 2>", "<action 3>"],
  "produits_prioritaires": [{ "nom": "<produit>", "sku": "<sku>", "etat": "<rupture|critique|faible>", "action": "<action immédiate>" }],
  "objectif_semaine": "<objectif stock concret et chiffré pour cette semaine>"
}
Le score_sante évalue : taux de ruptures, adéquation stocks/minimums, rotation, diversification fournisseurs.
Sois direct, orienté action, utilise les vrais chiffres.`;

export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Limite atteinte : 10 analyses par heure." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  const body = await req.json() as {
    totalProducts:  number;
    outOfStock:     number;
    lowStock:       number;
    criticalStock:  number;
    totalValue:     number;
    totalSaleValue: number;
    potentialMargin: number;
    marginRate:     number;
    totalIn:        number;
    totalOut:       number;
    topCategories:  { cat: string; count: number; val: number }[];
    ruptures:       { name: string; sku: string; supplier: string }[];
    alertsStock:    { name: string; sku: string; current: number; minimum: number; state: string }[];
  };

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const topCatStr = body.topCategories.length > 0
    ? body.topCategories.slice(0, 5).map(c => `${c.cat}: ${c.count} prod. (${fmt(c.val)})`).join("; ")
    : "Aucune catégorie";

  const rupturesStr = body.ruptures.length > 0
    ? body.ruptures.slice(0, 8).map(r => `${r.name}${r.sku ? ` (${r.sku})` : ""}${r.supplier ? ` — ${r.supplier}` : ""}`).join("; ")
    : "Aucune rupture";

  const alertsStr = body.alertsStock.length > 0
    ? body.alertsStock.slice(0, 8).map(a => `${a.name}: ${a.current} / min ${a.minimum} (${a.state})`).join("; ")
    : "Aucune alerte";

  const prompt = [
    `Analyse stocks — état actuel :`,
    ``,
    `Inventaire :`,
    `- Produits actifs      : ${body.totalProducts}`,
    `- En rupture (stock=0) : ${body.outOfStock}`,
    `- Stock faible         : ${body.lowStock}`,
    `- Stock critique       : ${body.criticalStock}`,
    ``,
    `Valeurs :`,
    `- Valeur stock achat   : ${fmt(body.totalValue)}`,
    `- Valeur stock vente   : ${fmt(body.totalSaleValue)}`,
    `- Marge potentielle    : ${fmt(body.potentialMargin)} (${body.marginRate}%)`,
    ``,
    `Mouvements :`,
    `- Total entrées        : ${body.totalIn} unités`,
    `- Total sorties        : ${body.totalOut} unités`,
    ``,
    `Top catégories (valeur) : ${topCatStr}`,
    `Ruptures              : ${rupturesStr}`,
    `Alertes stock         : ${alertsStr}`,
    ``,
    `Génère l'analyse complète en JSON.`,
  ].join("\n");

  try {
    const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 25_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system:     SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Réponse non-JSON");

    return NextResponse.json(JSON.parse(raw.slice(start, end + 1)));
  } catch (err) {
    log.error("Erreur génération analyse stocks", err);
    return NextResponse.json({ error: "Erreur génération analyse stocks" }, { status: 500 });
  }
}
