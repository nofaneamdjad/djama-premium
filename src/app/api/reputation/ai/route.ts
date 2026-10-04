import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}
async function getUserOrg(userId: string) {
  const db = adminDb();
  const { data } = await db.from("organization_members")
    .select("organization_id").eq("user_id", userId).is("suspended_at", null).limit(1).single();
  return data?.organization_id ?? null;
}

function ai() {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) throw new Error("Clé API Anthropic manquante");
  return new Anthropic({ apiKey: k, maxRetries: 0, timeout: 30_000 });
}

/* POST /api/reputation/ai
   actions : reply | sentiment | analyze | social_post | report | batch_sentiment
*/
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite 30 req/h atteinte" }, { status: 429 });

  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const body = await req.json() as {
    action:      "reply" | "sentiment" | "analyze" | "social_post" | "report" | "batch_sentiment";
    review_id?:  string;
    tone?:       string;
    reviews?:    { id: string; rating: number; message: string; author_name?: string }[];
    period?:     string;
    text?:       string;
    rating?:     number;
    author_name?: string;
  };

  try {
    const client = ai();

    /* ── REPLY : suggérer une réponse à un avis ── */
    if (body.action === "reply") {
      if (!body.text) return NextResponse.json({ error: "text requis" }, { status: 400 });

      const toneDesc =
        body.tone === "court"         ? "plus courte et directe" :
        body.tone === "chaleureux"    ? "chaleureuse et personnalisée" :
        body.tone === "professionnel" ? "très professionnelle et formelle" :
        body.tone === "reformuler"    ? "reformulée différemment" :
        "professionnelle et bienveillante";

      const sentiment = (body.rating ?? 3) >= 4 ? "positif" : (body.rating ?? 3) >= 3 ? "neutre" : "négatif";
      const instructions =
        sentiment === "positif" ? "Remerciez chaleureusement le client. Mentionnez un détail spécifique de son avis." :
        sentiment === "négatif" ? "Répondez de manière empathique, calme et orientée résolution. Proposez de prendre contact directement. Ne soyez jamais défensif." :
        "Répondez de manière constructive et professionnelle.";

      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 350,
        messages: [{ role: "user", content: `Rédige une réponse ${toneDesc} à cet avis client en français.
${instructions}
Client : ${body.author_name ?? "un client"}
Note : ${body.rating ?? "?"}/5
Avis : "${body.text}"
Réponse (2-4 phrases max, directement, sans introduction) :` }],
      });
      const reply = res.content[0].type === "text" ? res.content[0].text.trim() : "";

      // Sauvegarder le brouillon si review_id fourni
      if (body.review_id) {
        const db = adminDb();
        const { data: existing } = await db.from("rep_reviews").select("org_id").eq("id", body.review_id).single();
        if (existing?.org_id === orgId) {
          await db.from("rep_reviews").update({ ai_reply_draft: reply, updated_at: new Date().toISOString() })
            .eq("id", body.review_id);
        }
      }
      return NextResponse.json({ reply });
    }

    /* ── SENTIMENT : analyser sentiment + thèmes d'un avis ── */
    if (body.action === "sentiment") {
      if (!body.text) return NextResponse.json({ error: "text requis" }, { status: 400 });
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 300,
        messages: [{ role: "user", content: `Analyse cet avis client en français.
Avis : "${body.text}"
Note : ${body.rating ?? "?"}/5

Réponds en JSON valide (sans markdown) :
{
  "sentiment": "positive" | "neutral" | "negative",
  "themes": ["Prix","Service","Qualité","Livraison","Support","Communication","Délais","Résultat","Accueil","Autre"],
  "summary": "Résumé en 1 phrase"
}
Ne retourne QUE les thèmes réellement présents dans l'avis. Maximum 3 thèmes.` }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      const result = match ? JSON.parse(match[0]) as Record<string, unknown> : { sentiment: "neutral", themes: [] };
      return NextResponse.json(result);
    }

    /* ── BATCH_SENTIMENT : analyser un lot d'avis sans sentiment ── */
    if (body.action === "batch_sentiment") {
      if (!body.reviews?.length) return NextResponse.json({ error: "reviews requis" }, { status: 400 });
      const db = adminDb();
      const results: { id: string; sentiment: string; themes: string[] }[] = [];

      for (const r of body.reviews.slice(0, 10)) {
        if (!r.message) continue;
        const res = await client.messages.create({
          model: "claude-haiku-4-5-20251001", max_tokens: 150,
          messages: [{ role: "user", content: `Analyse cet avis (note ${r.rating}/5) : "${r.message}"
JSON sans markdown : {"sentiment":"positive"|"neutral"|"negative","themes":["max 3 thèmes parmi Prix,Service,Qualité,Livraison,Support,Communication,Délais,Résultat,Accueil,Autre"]}` }],
        });
        const raw   = res.content[0].type === "text" ? res.content[0].text : "{}";
        const match = raw.match(/\{[\s\S]*\}/);
        const parsed = match ? JSON.parse(match[0]) as { sentiment?: string; themes?: string[] } : {};
        const sentiment = (parsed.sentiment as string) ?? (r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral");
        const themes = Array.isArray(parsed.themes) ? parsed.themes : [];

        await db.from("rep_reviews").update({ sentiment, themes, updated_at: new Date().toISOString() })
          .eq("id", r.id).eq("org_id", orgId);
        results.push({ id: r.id, sentiment, themes });
      }
      return NextResponse.json({ processed: results.length, results });
    }

    /* ── ANALYZE : analyse globale de la réputation ── */
    if (body.action === "analyze") {
      const db = adminDb();
      const { data: reviews } = await db.from("rep_reviews")
        .select("rating,message,sentiment,themes,response_text,created_at")
        .eq("org_id", orgId).eq("status", "published").limit(100);

      if (!reviews?.length) return NextResponse.json({ analysis: "Aucun avis publié à analyser pour le moment." });

      const stats = {
        total:       reviews.length,
        avg_rating:  (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        positive:    reviews.filter(r => r.sentiment === "positive").length,
        negative:    reviews.filter(r => r.sentiment === "negative").length,
        no_response: reviews.filter(r => !r.response_text).length,
        themes:      reviews.flatMap(r => Array.isArray(r.themes) ? r.themes as string[] : []),
      };

      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 800,
        messages: [{ role: "user", content: `Tu es analyste réputation client. Analyse ces données réelles et fournis des insights actionnables en français.
Données : ${JSON.stringify(stats, null, 2)}
Période : ${body.period ?? "30 derniers jours"}

Fournis :
1. Résumé en 2 phrases
2. Points forts (basé sur les vrais avis)
3. Problèmes récurrents (thèmes négatifs identifiés)
4. Avis critiques à traiter en priorité
5. 3 recommandations concrètes

Base-toi UNIQUEMENT sur les données fournies. Ne fabrique aucune statistique.` }],
      });
      const analysis = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ analysis });
    }

    /* ── SOCIAL_POST : transformer un témoignage en post ── */
    if (body.action === "social_post") {
      if (!body.text) return NextResponse.json({ error: "text requis" }, { status: 400 });
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 400,
        messages: [{ role: "user", content: `Transforme ce témoignage client en publication pour les réseaux sociaux. Ton professionnel et authentique. En français.
Témoignage (${body.rating ?? 5}/5 étoiles) : "${body.text}"
Auteur : ${body.author_name ?? "Un client"}

Génère en JSON (sans markdown) :
{
  "caption": "Texte de la publication avec la citation mise en valeur (max 250 caractères)",
  "hashtags": ["3 hashtags pertinents sans #"],
  "quote": "Citation courte extraite du témoignage"
}` }],
      });
      const raw   = res.content[0].type === "text" ? res.content[0].text : "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      return NextResponse.json(match ? JSON.parse(match[0]) : { caption: "", hashtags: [], quote: "" });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur IA";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
