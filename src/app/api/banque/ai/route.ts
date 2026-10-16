/**
 * POST /api/banque/ai — Assistant IA bancaire (Claude Haiku)
 * Répond aux questions financières de l'entrepreneur sur ses propres données.
 * Limite : 20 req/h. Ne modifie aucune donnée.
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Tu es l'assistant financier de DJAMA, spécialisé dans la gestion bancaire des TPE et freelances.
Tu analyses les données réelles fournies et réponds de façon concise et précise.

Règles absolues :
- Utilise uniquement les données fournies dans le contexte. N'invente pas de chiffres.
- Si les données sont insuffisantes pour répondre, dis-le clairement.
- Ne génère jamais d'écriture comptable ou de virement sans confirmation explicite.
- Réponds toujours en français.
- Format : paragraphes courts, listes à puces si nécessaire. Pas de markdown excessif.`;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimitAsync(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite : 20 questions/h" }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question vide" }, { status: 422 });

  // Charger le contexte financier de l'utilisateur (derniers 90 jours)
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const [{ data: accounts }, { data: txs }] = await Promise.all([
    supabase.from("treasury_accounts")
      .select("name, bank, balance, currency")
      .eq("user_id", user.id)
      .limit(20),
    supabase.from("treasury_transactions")
      .select("type, category, label, amount, currency, date, status, reconciliation_status")
      .eq("user_id", user.id)
      .gte("date", since)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(200),
  ]);

  const income  = (txs ?? []).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = (txs ?? []).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const unmatched = (txs ?? []).filter(t => t.reconciliation_status === "unmatched").length;

  const context = `
COMPTES (${(accounts ?? []).length}) :
${(accounts ?? []).map(a => `- ${a.name} (${a.bank}) : ${a.balance} ${a.currency}`).join("\n")}

RÉSUMÉ 90 JOURS :
- Entrées : ${income.toFixed(2)} €
- Sorties : ${expense.toFixed(2)} €
- Solde net : ${(income - expense).toFixed(2)} €
- Transactions non rapprochées : ${unmatched}

DERNIÈRES TRANSACTIONS (${Math.min((txs ?? []).length, 30)}) :
${(txs ?? []).slice(0, 30).map(t =>
  `${t.date} | ${t.type === "income" ? "+" : "-"}${t.amount} ${t.currency} | ${t.label.slice(0, 60)} | ${t.category}`
).join("\n")}
`.trim();

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system:     SYSTEM,
      messages:   [{ role: "user", content: `Contexte financier :\n${context}\n\nQuestion : ${question.slice(0, 500)}` }],
    });

    const answer = msg.content.find(c => c.type === "text")?.text ?? "Aucune réponse.";
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}
