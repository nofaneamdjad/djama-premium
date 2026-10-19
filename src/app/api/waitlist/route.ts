import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { checkRateLimitAsync as checkRateLimit }            from "@/lib/rate-limit";
import { createHash }                from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export async function POST(req: NextRequest) {
  // ── Rate limit : 5 inscriptions par IP par heure ──────────────────────────
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une heure." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  // ── Honeypot anti-spam ────────────────────────────────────────────────────
  if (body.website) {
    return NextResponse.json({ ok: true }); // silencieux : on simule le succès
  }

  const nom       = String(body.nom ?? "").trim();
  const email     = String(body.email ?? "").trim().toLowerCase();
  const entreprise = String(body.entreprise ?? "").trim() || null;
  const pays      = String(body.pays ?? "").trim() || null;
  const consent   = body.consent === true;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!nom)                return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  if (!email)              return NextResponse.json({ error: "L'adresse email est requise." }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  if (!consent)            return NextResponse.json({ error: "Le consentement est requis." }, { status: 400 });

  if (nom.length > 120)       return NextResponse.json({ error: "Nom trop long." }, { status: 400 });
  if (email.length > 255)     return NextResponse.json({ error: "Email trop long." }, { status: 400 });
  if (entreprise && entreprise.length > 200)
    return NextResponse.json({ error: "Nom d'entreprise trop long." }, { status: 400 });

  // ── Insertion via service_role (contourne RLS) ────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("[waitlist] Supabase env vars manquantes");
    return NextResponse.json({ error: "Service temporairement indisponible." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ipHash = createHash("sha256").update(ip).digest("hex");

  const { error } = await supabase.from("prelaunch_waitlist").insert({
    nom,
    email,
    entreprise,
    pays,
    consent,
    ip_hash: ipHash,
    source: "djama.space",
  });

  if (error) {
    if (error.code === "23505") {
      // Duplicate email — on retourne succès pour ne pas fuiter l'info
      return NextResponse.json({ ok: true });
    }
    console.error("[waitlist] Erreur Supabase :", error.message);
    return NextResponse.json({ error: "Erreur lors de l'inscription. Réessayez." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
