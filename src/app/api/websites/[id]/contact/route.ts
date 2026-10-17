// Soumission de formulaire de contact public — crée un lead CRM
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Preflight CORS
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Simple rate-limit in-memory par IP (fenêtre 1 heure, max 5 soumissions)
const ipMap = new Map<string, { count: number; reset: number }>();
function checkIpLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.reset) {
    ipMap.set(ip, { count: 1, reset: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

type Params = { params: Promise<{ id: string }> };

// POST /api/websites/[id]/contact — public, pas d'auth
export async function POST(req: NextRequest, { params }: Params) {
  const { id: websiteId } = await params;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  if (!checkIpLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de soumissions. Réessayez plus tard." },
      { status: 429, headers: CORS },
    );
  }

  const body = await req.json().catch(() => null) as {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    [key: string]: unknown;
  } | null;

  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: "Nom et e-mail requis" }, { status: 400, headers: CORS });
  }

  // Valider e-mail basique
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "E-mail invalide" }, { status: 400, headers: CORS });
  }

  const admin = createSupabaseAdmin();

  // Retrouver le propriétaire du site
  const { data: site } = await admin
    .from("websites")
    .select("id, user_id, name")
    .eq("id", websiteId)
    .eq("status", "published")
    .single();

  if (!site) {
    // Site non publié ou inexistant — silencieux pour ne pas exposer l'existence
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  const ownerId = site.user_id as string;

  // Vérifier si contact existe déjà pour cet owner
  const { data: existing } = await admin
    .from("contacts")
    .select("id")
    .eq("email", body.email)
    .eq("user_id", ownerId)
    .maybeSingle();

  let contactId: string | null = existing?.id ?? null;

  if (!contactId) {
    const nameParts = String(body.name).trim().split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName  = nameParts.slice(1).join(" ");

    const { data: created } = await admin
      .from("contacts")
      .insert({
        user_id:    ownerId,
        first_name: firstName,
        last_name:  lastName,
        email:      body.email,
        phone:      body.phone ?? null,
        source:     `site-web:${site.name}`,
        status:     "lead",
        tags:       ["site-web"],
      })
      .select("id")
      .single();

    contactId = (created as { id: string } | null)?.id ?? null;
  }

  // Enregistrer la soumission
  await admin.from("website_contact_submissions").insert({
    website_id:      websiteId,
    user_id:         ownerId,
    data:            body,
    crm_contact_id:  contactId,
  });

  // Hash IP pour analytics (non réversible)
  const ipHash = createHash("sha256").update(ip + process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(-8)).digest("hex").slice(0, 16);

  // Enregistrer la visite de type "contact"
  await admin.from("website_visits").insert({
    website_id: websiteId,
    user_id:    ownerId,
    page_slug:  "/contact",
    ip_hash:    ipHash,
  });

  return NextResponse.json({ ok: true, contactId }, { headers: CORS });
}
