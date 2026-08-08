import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`comptabilite:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const { caHT, charges, resultat, tvaCollectee, tvaDeductible, period } = await req.json() as {
    caHT: number; charges: number; resultat: number;
    tvaCollectee: number; tvaDeductible: number; period: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const tvaSolde = tvaCollectee - tvaDeductible;
  const tauxCharges = caHT > 0 ? Math.round((charges / caHT) * 100) : 0;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Analyse comptable d'une TPE/freelance française. Période : ${period}.

Données :
- CA HT : ${caHT.toLocaleString("fr-FR")} €
- Charges déductibles : ${charges.toLocaleString("fr-FR")} € (${tauxCharges}% du CA)
- Résultat net : ${resultat.toLocaleString("fr-FR")} €
- TVA collectée : ${tvaCollectee.toLocaleString("fr-FR")} €
- TVA déductible : ${tvaDeductible.toLocaleString("fr-FR")} €
- ${tvaSolde >= 0 ? "TVA à payer" : "Crédit de TVA"} : ${Math.abs(tvaSolde).toLocaleString("fr-FR")} €

Donne 2-3 observations clés et 1-2 actions concrètes à mener.
En français, 4-5 phrases courtes et directes. Pas de formules de politesse.`,
    }],
  });

  const analyse = (msg.content[0] as { text: string }).text.trim();
  return NextResponse.json({ analyse });
}
