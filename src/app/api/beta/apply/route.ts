/**
 * POST /api/beta/apply
 * Candidature à la bêta publique DJAMA.
 * - Vérifie que les inscriptions sont ouvertes (beta_config)
 * - Vérifie que le quota de testeurs n'est pas atteint
 * - Insère dans prelaunch_waitlist avec source="beta-apply"
 * - Rate limiting 3/IP/heure
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";
import { createHash } from "crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ApplySchema = z.object({
  nom:        z.string().min(1).max(120),
  email:      z.string().email().max(255),
  entreprise: z.string().max(200).optional(),
  pays:       z.string().max(100).optional(),
  usage:      z.string().max(500).optional(),
  consent:    z.literal(true),
  website:    z.string().optional(), // honeypot
});

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // Rate limit
  const { allowed } = await checkRateLimit(`beta:apply:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une heure." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = ApplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { nom, email, entreprise, pays, usage, consent, website } = parsed.data;

  // Honeypot
  if (website) return NextResponse.json({ ok: true });
  if (!consent) return NextResponse.json({ error: "Consentement requis." }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Vérifier que les inscriptions sont ouvertes
  const { data: config } = await supabase
    .from("beta_config")
    .select("signups_open, max_testers, current_testers")
    .eq("id", "default")
    .single();

  if (!config?.signups_open) {
    return NextResponse.json({ error: "Les candidatures ne sont pas encore ouvertes. Rejoignez la liste d'attente." }, { status: 403 });
  }

  if (config.current_testers >= config.max_testers) {
    return NextResponse.json({ error: "Le quota de testeurs est atteint. Votre candidature est enregistrée sur liste d'attente." }, { status: 429 });
  }

  const ipHash = createHash("sha256").update(ip).digest("hex");

  const { error } = await supabase.from("prelaunch_waitlist").insert({
    nom,
    email:      email.toLowerCase().trim(),
    entreprise: entreprise ?? null,
    pays:       pays ?? null,
    consent:    true,
    ip_hash:    ipHash,
    source:     "beta-apply",
    ...(usage ? { metadata: { usage } } : {}),
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true }); // email déjà inscrit, succès silencieux
    return NextResponse.json({ error: "Erreur lors de l'enregistrement. Réessayez." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET /api/beta/apply — état des inscriptions (public)
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data } = await supabase
    .from("beta_config")
    .select("signups_open, max_testers, current_testers, beta_ends_at")
    .eq("id", "default")
    .single();

  return NextResponse.json({
    open:            data?.signups_open ?? false,
    max:             data?.max_testers ?? 50,
    current:         data?.current_testers ?? 0,
    beta_ends_at:    data?.beta_ends_at ?? null,
  });
}
