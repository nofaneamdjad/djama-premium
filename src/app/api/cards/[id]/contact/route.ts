import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// POST /api/cards/[id]/contact — soumettre un formulaire de contact
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as {
    name?:    string;
    email?:   string;
    phone?:   string;
    message?: string;
    company?: string;
    consent:  boolean;
  };

  if (!body.consent) {
    return NextResponse.json({ error: "Le consentement est requis" }, { status: 400 });
  }
  if (!body.name?.trim() && !body.email?.trim()) {
    return NextResponse.json({ error: "Nom ou email requis" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Vérifier la carte
  const { data: card } = await admin
    .from("business_cards")
    .select("id, user_id, show_contact_form, status")
    .eq("id", id)
    .single();

  if (!card) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  if (!card.show_contact_form) return NextResponse.json({ error: "Formulaire désactivé" }, { status: 403 });
  if (!["active", "draft"].includes(card.status)) {
    return NextResponse.json({ error: "Carte inactive" }, { status: 403 });
  }

  // Hash de l'IP pour anti-spam (sans stocker l'IP brute)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ipHash = createHash("sha256").update(`${ip}-${id}-${new Date().toDateString()}`).digest("hex").slice(0, 16);

  // Anti-spam : 3 soumissions max par jour par IP+carte
  const { count } = await admin
    .from("card_contacts")
    .select("id", { count: "exact", head: true })
    .eq("card_id", id)
    .eq("ip_hash", ipHash)
    .gte("created_at", new Date(Date.now() - 86400000).toISOString());

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Trop de soumissions. Réessayez demain." }, { status: 429 });
  }

  const { data: contact, error } = await admin
    .from("card_contacts")
    .insert({
      card_id:  id,
      owner_id: card.user_id,
      name:     body.name?.trim()    ?? null,
      email:    body.email?.trim()   ?? null,
      phone:    body.phone?.trim()   ?? null,
      message:  body.message?.trim() ?? null,
      company:  body.company?.trim() ?? null,
      source:   "form",
      ip_hash:  ipHash,
      consent:  true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Incrémenter contact_count (read-then-write)
  const { data: current } = await admin
    .from("business_cards")
    .select("contact_count")
    .eq("id", id)
    .single();
  if (current) {
    await admin
      .from("business_cards")
      .update({ contact_count: (current.contact_count ?? 0) + 1 })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true, contactId: contact.id });
}

// GET /api/cards/[id]/contact — liste des contacts (propriétaire uniquement)
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Vérif auth via cookie
  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const url    = new URL(req.url);
  const limit  = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const admin = createSupabaseAdmin();

  // Vérifier que l'utilisateur est propriétaire
  const { data: card } = await admin
    .from("business_cards")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!card) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { data: contacts, count } = await admin
    .from("card_contacts")
    .select("*", { count: "exact" })
    .eq("card_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ contacts: contacts ?? [], total: count ?? 0 });
}
