import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

interface CartItemIn {
  id:        string;           // stock_products.id ou catalog_items.id
  type:      "product" | "service";
  qty:       number;
  discount:  number;           // remise ligne en %
}

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/pos/sale — Créer une vente POS

   SÉCURITÉ :
   - Les prix sont TOUJOURS rechargés depuis la base (jamais depuis le client).
   - Les taxes proviennent de vat_rate sur le produit.
   - La remise globale est validée côté serveur (max 100 %).
   - Si allow_negative_stock = false, on refuse si stock insuffisant.
   - Transaction comptable : document + items + payment + stock movement.
───────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 120, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const db = adminClient();

  const body = await req.json() as {
    items:            CartItemIn[];
    contact_id?:      string | null;
    session_id?:      string | null;
    payment_method:   "cash" | "card" | "link" | "transfer" | "other";
    global_discount:  number;         // % remise globale
    global_discount_type: "pct" | "fixed";
    received_cash?:   number;         // espèces reçues (pour monnaie)
    note?:            string;
  };

  /* ── Validation de base ── */
  if (!body.items?.length) return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  if (body.global_discount < 0 || body.global_discount > 100) {
    return NextResponse.json({ error: "Remise invalide" }, { status: 400 });
  }

  /* ── Recharger les prix depuis la DB ── */
  const productIds = body.items.filter(i => i.type === "product").map(i => i.id);
  const serviceIds = body.items.filter(i => i.type === "service").map(i => i.id);

  const [{ data: products }, { data: services }] = await Promise.all([
    productIds.length
      ? db.from("stock_products").select("id,name,sale_price,vat_rate,stock_current,unit").in("id", productIds)
      : Promise.resolve({ data: [] }),
    serviceIds.length
      ? db.from("catalog_items").select("id,description,unit_price,vat_rate,unit").in("id", serviceIds)
      : Promise.resolve({ data: [] }),
  ]);

  const productMap = new Map((products ?? []).map(p => [p.id as string, p]));
  const serviceMap = new Map((services ?? []).map(s => [s.id as string, s]));

  /* ── Vérification stock ── */
  for (const item of body.items) {
    if (item.type !== "product") continue;
    const p = productMap.get(item.id);
    if (!p) return NextResponse.json({ error: `Produit ${item.id} introuvable` }, { status: 400 });
    const stock = p.stock_current as number;
    if (stock < item.qty) {
      return NextResponse.json(
        { error: `Stock insuffisant pour "${p.name}" (${stock} disponible, ${item.qty} demandé)` },
        { status: 409 }
      );
    }
  }

  /* ── Construire lignes et calculer totaux ── */
  interface SaleLine {
    position:    number;
    description: string;
    unit:        string;
    quantity:    number;
    unit_price:  number;
    vat_rate:    number;
    remise_pct:  number;
    line_ht:     number;
    line_tva:    number;
    line_ttc:    number;
    source_id:   string;
    source_type: "product" | "service";
    stock_product_id: string | null;
  }

  const lines: SaleLine[] = [];
  let totalHt = 0, totalTva = 0;

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    const remiseLine = Math.min(Math.max(item.discount ?? 0, 0), 100);

    let name = "", price = 0, vatRate = 20, unit = "", stockProductId: string | null = null;

    if (item.type === "product") {
      const p = productMap.get(item.id)!;
      name         = p.name as string;
      price        = p.sale_price as number;
      vatRate      = (p.vat_rate as number) ?? 20;
      unit         = (p.unit as string) || "pièce";
      stockProductId = item.id;
    } else {
      const s = serviceMap.get(item.id);
      if (!s) return NextResponse.json({ error: `Service ${item.id} introuvable` }, { status: 400 });
      name    = s.description as string;
      price   = s.unit_price as number;
      vatRate = (s.vat_rate as number) ?? 20;
      unit    = (s.unit as string) || "";
    }

    const lineHtBrut = price * item.qty;
    const lineHt     = lineHtBrut * (1 - remiseLine / 100);
    const lineTva    = lineHt * vatRate / 100;
    const lineTtc    = lineHt + lineTva;

    totalHt  += lineHt;
    totalTva += lineTva;
    lines.push({
      position:    i + 1,
      description: name,
      unit,
      quantity:    item.qty,
      unit_price:  price,
      vat_rate:    vatRate,
      remise_pct:  remiseLine,
      line_ht:     lineHt,
      line_tva:    lineTva,
      line_ttc:    lineTtc,
      source_id:   item.id,
      source_type: item.type,
      stock_product_id: stockProductId,
    });
  }

  /* Remise globale */
  let remiseGlobale = 0;
  if (body.global_discount > 0) {
    if (body.global_discount_type === "fixed") {
      remiseGlobale = Math.min(body.global_discount, totalHt + totalTva);
    } else {
      const pct     = Math.min(body.global_discount, 100) / 100;
      totalHt  *= (1 - pct);
      totalTva *= (1 - pct);
      remiseGlobale = (totalHt + totalTva) * pct / (1 - pct); // pour affichage
    }
  }
  const totalTtc = totalHt + totalTva;

  /* ── Récupérer infos emetteur ── */
  const { data: settings } = await db
    .from("user_settings")
    .select("key,value")
    .eq("user_id", user.id);

  const settingsMap = new Map((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]));

  /* Infos client CRM si fourni */
  let clientNom = "Client de passage", clientEmail = "", clientTel = "", clientSociete = "";
  if (body.contact_id) {
    const { data: contact } = await db
      .from("contacts")
      .select("name,email,phone,company")
      .eq("id", body.contact_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (contact) {
      clientNom     = (contact.name as string) || "Client";
      clientEmail   = (contact.email as string) || "";
      clientTel     = (contact.phone as string) || "";
      clientSociete = (contact.company as string) || "";
    }
  }

  /* ── Numéro de facture POS ── */
  const year = new Date().getFullYear();
  const { data: lastDoc } = await db
    .from("documents")
    .select("numero")
    .eq("user_id", user.id)
    .ilike("numero", `FA-${year}-%`)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (lastDoc?.numero) {
    const parts = (lastDoc.numero as string).split("-");
    nextNum = (parseInt(parts[2] ?? "0", 10) || 0) + 1;
  }
  const numero = `FA-${year}-${String(nextNum).padStart(4, "0")}`;

  /* ── Créer le document (facture POS) ── */
  const { data: doc, error: docErr } = await db
    .from("documents")
    .insert({
      user_id:         user.id,
      type:            "facture",
      source:          "pos",
      pos_session_id:  body.session_id ?? null,
      numero,
      statut:          "payé",
      sujet:           `Vente POS — ${new Date().toLocaleDateString("fr-FR")}`,
      emetteur_nom:    settingsMap.get("company_name") ?? "",
      emetteur_email:  user.email ?? "",
      emetteur_siret:  settingsMap.get("siret") ?? "",
      client_nom:      clientNom,
      client_email:    clientEmail,
      client_telephone: clientTel,
      client_societe:  clientSociete,
      contact_id:      body.contact_id ?? null,
      date_document:   new Date().toISOString().slice(0, 10),
      total_ht:        Math.round(totalHt   * 100) / 100,
      total_tva:       Math.round(totalTva  * 100) / 100,
      total_ttc:       Math.round(totalTtc  * 100) / 100,
      montant_paye:    Math.round(totalTtc  * 100) / 100,
      remise_pct:      body.global_discount_type === "pct" ? body.global_discount : 0,
      notes:           body.note ?? "",
    })
    .select("id,numero,total_ttc")
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: docErr?.message ?? "Erreur création document" }, { status: 500 });
  }

  /* ── Créer les lignes (document_items) ── */
  const docItems = lines.map(l => ({
    document_id:      doc.id as string,
    position:         l.position,
    description:      l.description,
    unit:             l.unit,
    quantity:         l.quantity,
    unit_price:       l.unit_price,
    vat_rate:         l.vat_rate,
    remise_pct:       l.remise_pct,
    stock_product_id: l.stock_product_id,
  }));

  const { error: itemsErr } = await db.from("document_items").insert(docItems);
  if (itemsErr) {
    await db.from("documents").delete().eq("id", doc.id as string);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  /* ── Enregistrer le paiement ── */
  const method = body.payment_method === "cash" ? "cash"
               : body.payment_method === "card" ? "carte"
               : body.payment_method === "transfer" ? "virement"
               : "autre";

  const { error: payErr } = await db.from("document_payments").insert({
    user_id:     user.id,
    document_id: doc.id as string,
    amount:      Math.round(totalTtc * 100) / 100,
    date:        new Date().toISOString().slice(0, 10),
    method,
    notes:       `POS — ${body.payment_method}`,
  });
  if (payErr) {
    await db.from("documents").delete().eq("id", doc.id as string);
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  /* ── Sync trésorerie ── */
  try {
    await db.from("treasury_transactions").insert({
      user_id:         user.id,
      type:            "income",
      category:        "ventes",
      label:           `Vente POS ${numero}`,
      amount:          Math.round(totalTtc * 100) / 100,
      currency:        "EUR",
      date:            new Date().toISOString().slice(0, 10),
      payment_method:  method,
      status:          "completed",
      client_supplier: clientNom,
      invoice_ref:     numero,
      notes:           `Vente POS — ${body.payment_method}`,
    });
  } catch { /* non bloquant */ }

  /* ── Décrémenter stock ── */
  const stockMoves = lines.filter(l => l.source_type === "product" && l.stock_product_id);
  for (const l of stockMoves) {
    try {
      const { data: prod } = await db
        .from("stock_products")
        .select("stock_current")
        .eq("id", l.stock_product_id!)
        .single();
      const before = (prod?.stock_current as number) ?? 0;
      const after  = before - l.quantity;

      await db.from("stock_movements").insert({
        user_id:      user.id,
        product_id:   l.stock_product_id,
        product_name: l.description,
        type:         "sortie",
        quantity:     l.quantity,
        before_qty:   before,
        after_qty:    after,
        reason:       `Vente POS ${numero}`,
        reference:    numero,
        date:         new Date().toISOString().slice(0, 10),
      });

      await db.from("stock_products")
        .update({ stock_current: after, updated_at: new Date().toISOString() })
        .eq("id", l.stock_product_id!);
    } catch { /* log mais non bloquant — vente déjà enregistrée */ }
  }

  /* ── Mettre à jour totaux session ── */
  if (body.session_id) {
    try {
      const { data: sess } = await db
        .from("pos_sessions")
        .select("total_sales,sale_count,total_cash,total_card,total_other")
        .eq("id", body.session_id)
        .single();
      if (sess) {
        const isCash = body.payment_method === "cash";
        const isCard = body.payment_method === "card";
        await db.from("pos_sessions").update({
          total_sales: (sess.total_sales as number) + totalTtc,
          sale_count:  (sess.sale_count  as number) + 1,
          total_cash:  (sess.total_cash  as number) + (isCash ? totalTtc : 0),
          total_card:  (sess.total_card  as number) + (isCard ? totalTtc : 0),
          total_other: (sess.total_other as number) + (!isCash && !isCard ? totalTtc : 0),
        }).eq("id", body.session_id);
      }
    } catch { /* non bloquant */ }
  }

  /* ── Calcul monnaie (espèces) ── */
  const change = body.payment_method === "cash" && body.received_cash
    ? Math.max(0, body.received_cash - totalTtc)
    : null;

  return NextResponse.json({
    ok:         true,
    document_id: doc.id,
    numero,
    total_ttc:  Math.round(totalTtc * 100) / 100,
    change,
    lines:      lines.length,
  });
}
