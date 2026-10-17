// CRUD domaines custom pour un site Website Builder
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string }> };

// GET /api/websites/[id]/domains — liste les domaines du site
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const { data: domains } = await admin
    .from("website_domains")
    .select("*")
    .eq("website_id", id)
    .order("created_at");

  return NextResponse.json({ domains: domains ?? [] });
}

// POST /api/websites/[id]/domains — ajouter un domaine custom
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const { domain } = await req.json() as { domain?: string };

  if (!domain) return NextResponse.json({ error: "Domaine requis" }, { status: 400 });

  // Valider le format du domaine
  const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: "Format de domaine invalide" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  // Générer un token de vérification DNS TXT
  const { randomBytes } = await import("crypto");
  const verifyToken = `djama-verify-${randomBytes(16).toString("hex")}`;

  const { data: newDomain, error } = await admin
    .from("website_domains")
    .insert({
      website_id:   id,
      user_id:      user.id,
      domain:       domain.toLowerCase(),
      verified:     false,
      ssl_status:   "pending",
      dns_target:   "sites.djama.site",
      verify_token: verifyToken,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce domaine est déjà enregistré" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: newDomain }, { status: 201 });
}

// DELETE /api/websites/[id]/domains?domain_id=xxx — supprimer un domaine
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const domainId = req.nextUrl.searchParams.get("domain_id");
  if (!domainId) return NextResponse.json({ error: "domain_id requis" }, { status: 400 });

  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const { error } = await admin
    .from("website_domains")
    .delete()
    .eq("id", domainId)
    .eq("website_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
