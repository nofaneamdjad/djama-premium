/**
 * GET  /api/payment-links        — liste les liens de l'utilisateur authentifié
 * POST /api/payment-links        — crée un lien + Stripe PaymentLink
 *
 * SÉCURITÉ : le montant est imposé par la DB (document_id) ou par le formulaire
 * validé côté serveur. Jamais confiance au montant envoyé par le client si
 * document_id est fourni.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("payment-links");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const STRIPE_CURRENCIES = new Set([
  "eur","usd","gbp","chf","cad","dkk","nok","sek","jpy","aud","sgd","hkd",
]);

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base || "paiement"}-${rand}`;
}

async function getUser(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  return supabase.auth.getUser();
}

/* ── GET — liste ── */
export async function GET(req: NextRequest) {
  const { data: { user } } = await getUser(req);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const url    = new URL(req.url);
  const status = url.searchParams.get("status");
  const q      = url.searchParams.get("q");
  const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);

  let query = supabaseAdmin
    .from("payment_links")
    .select(`*, payment_transactions(count)`)
    .eq("user_id", user.id)
    .not("status", "eq", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (q)      query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/* ── POST — création ── */
export async function POST(req: NextRequest) {
  const { data: { user } } = await getUser(req);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const body = await req.json() as {
    title:                 string;
    description?:          string;
    amount?:               number;
    currency?:             string;
    is_free_amount?:       boolean;
    document_id?:          string;
    contact_id?:           string;
    project_id?:           string;
    collect_name?:         boolean;
    collect_email?:        boolean;
    collect_phone?:        boolean;
    quantity_enabled?:     boolean;
    after_payment_message?:string;
    expires_at?:           string;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  /* ── Résolution du montant ── */
  let amount:   number | null = null;
  let currency: string        = (body.currency ?? "eur").toLowerCase();
  let docData:  Record<string, unknown> | null = null;

  if (body.document_id) {
    // Montant imposé par la facture — sécurisé serveur
    const { data: doc, error: docErr } = await supabaseAdmin
      .from("documents")
      .select("id,total_ttc,sujet,numero,devise,client_email,montant_paye")
      .eq("id", body.document_id)
      .eq("user_id", user.id)
      .single();
    if (docErr || !doc) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    const paid    = (doc.montant_paye as number) ?? 0;
    const remaining = (doc.total_ttc as number) - paid;
    if (remaining <= 0) return NextResponse.json({ error: "Facture déjà réglée" }, { status: 400 });
    amount   = remaining;
    currency = STRIPE_CURRENCIES.has((doc.devise as string)?.toLowerCase()) ? (doc.devise as string).toLowerCase() : "eur";
    docData  = doc as Record<string, unknown>;
  } else if (!body.is_free_amount) {
    amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount ?? 0));
    if (!amount || amount <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    if (amount > 999999) return NextResponse.json({ error: "Montant trop élevé" }, { status: 400 });
  }

  if (!STRIPE_CURRENCIES.has(currency)) currency = "eur";

  const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const slug    = makeSlug(body.title.trim());

  /* ── Créer dans Supabase d'abord (sans Stripe ID) ── */
  const { data: link, error: insertErr } = await supabaseAdmin
    .from("payment_links")
    .insert({
      user_id:               user.id,
      slug,
      title:                 body.title.trim(),
      description:           body.description?.trim() ?? "",
      amount:                amount ?? null,
      currency,
      is_free_amount:        body.is_free_amount ?? false,
      document_id:           body.document_id   ?? null,
      contact_id:            body.contact_id    ?? null,
      project_id:            body.project_id    ?? null,
      collect_name:          body.collect_name  ?? true,
      collect_email:         body.collect_email ?? true,
      collect_phone:         body.collect_phone ?? false,
      quantity_enabled:      body.quantity_enabled ?? false,
      after_payment_message: body.after_payment_message?.trim() ?? "",
      expires_at:            body.expires_at ?? null,
      status:                "active",
    })
    .select("*")
    .single();

  if (insertErr || !link) {
    log.error("insert payment_link", insertErr?.message);
    return NextResponse.json({ error: "Erreur création lien" }, { status: 500 });
  }

  /* ── Créer le Stripe PaymentLink (optionnel — dégradé si pas de clé) ── */
  const stripe = getStripe();
  if (stripe && amount && amount > 0) {
    try {
      const productName = body.title.trim() || (docData?.sujet as string) || "Paiement";
      const successUrl  = `${APP_URL}/paiement-confirme?link_id=${link.id}&session_id={CHECKOUT_SESSION_ID}`;

      const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100),
        currency,
        product_data: {
          name: productName,
          metadata: {
            payment_link_id: link.id,
            user_id:         user.id,
            ...(body.document_id ? { document_id: body.document_id } : {}),
          },
        },
      });

      const fields: Stripe.PaymentLinkCreateParams.CustomField[] = [];
      if (body.collect_name  ?? true)  fields.push({ key: "customer_name",  label: { type: "custom", custom: "Nom complet" }, type: "text", optional: false });
      if (body.collect_phone ?? false) fields.push({ key: "customer_phone", label: { type: "custom", custom: "Téléphone"   }, type: "text", optional: true  });

      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        custom_fields: fields.length > 0 ? fields : undefined,
        after_completion: {
          type: "redirect",
          redirect: { url: successUrl },
        },
        invoice_creation: { enabled: true },
        metadata: {
          payment_link_id: link.id,
          user_id:         user.id,
          ...(body.document_id ? { document_id: body.document_id } : {}),
        },
        ...(body.collect_email !== false ? { phone_number_collection: { enabled: false } } : {}),
      });

      // Mise à jour avec les IDs Stripe
      await supabaseAdmin
        .from("payment_links")
        .update({
          stripe_payment_link_id:  paymentLink.id,
          stripe_payment_link_url: paymentLink.url,
          stripe_price_id:         price.id,
        })
        .eq("id", link.id);

      return NextResponse.json({
        ...link,
        stripe_payment_link_id:  paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        public_url: `${APP_URL}/pay/${slug}`,
      });
    } catch (err) {
      log.error("Stripe PaymentLink creation failed", err);
      // On retourne le lien DB sans Stripe — la page /pay/[slug] affichera un message
    }
  }

  return NextResponse.json({
    ...link,
    public_url: `${APP_URL}/pay/${slug}`,
  });
}
