/**
 * POST /api/stripe/payment-link
 * Crée un lien de paiement Stripe pour une facture.
 * Body : { document_id }
 * Le montant est TOUJOURS lu en base — jamais depuis le client.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe                        from "stripe";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger("stripe/payment-link");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

// Devises supportées par Stripe (MAD, XOF, DZD non supportés → fallback EUR)
const STRIPE_SUPPORTED = new Set([
  "eur","usd","gbp","chf","cad","dkk","nok","sek","jpy","aud","sgd","hkd",
]);

// Rate limiter : max 5 liens / user / 10 min
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = rateLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 5) return false;
  slot.count++;
  return true;
}

export async function POST(req: NextRequest) {
  /* ── Authentification ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  /* ── Rate limiting ── */
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez dans 10 minutes." },
      { status: 429 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe non configuré (STRIPE_SECRET_KEY manquant)" },
      { status: 500 }
    );
  }

  const body = await req.json() as { document_id: string };

  if (!body.document_id) {
    return NextResponse.json({ error: "document_id requis" }, { status: 400 });
  }

  /* ── Montant depuis la DB (jamais depuis le client) ── */
  const { data: doc, error: docErr } = await supabaseAdmin
    .from("documents")
    .select("id, total_ttc, sujet, numero, devise, client_email, type")
    .eq("id", body.document_id)
    .eq("user_id", user.id)
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const amount   = doc.total_ttc as number;
  const currency = STRIPE_SUPPORTED.has((doc.devise as string)?.toLowerCase() ?? "")
    ? (doc.devise as string).toLowerCase()
    : "eur";

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide (TTC = 0)" }, { status: 400 });
  }

  const description = (doc.sujet as string)?.trim()
    || `${doc.type === "facture" ? "Facture" : "Devis"} ${doc.numero}`;

  try {
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency,
      product_data: {
        name: description,
        metadata: {
          document_id: doc.id as string,
          reference:   doc.numero as string,
        },
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type:     "redirect",
        redirect: { url: "https://djama.space/paiement-confirme" },
      },
      invoice_creation: { enabled: true },
      metadata: {
        document_id: doc.id as string,
        reference:   doc.numero as string,
        user_id:     user.id,
      },
      ...(doc.client_email ? { customer_creation: "always" } : {}),
    });

    return NextResponse.json({ url: paymentLink.url, id: paymentLink.id });
  } catch (err) {
    log.error("Stripe error", err);
    const message = err instanceof Error ? err.message : "Erreur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
