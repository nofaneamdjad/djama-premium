/**
 * POST /api/admin/mfa/verify-enroll
 *
 * Vérifie le code TOTP après scan du QR code et finalise l'enrôlement.
 * Corps : { factorId: string, code: string }
 *
 * Sécurité :
 *   - Auth Strategy 0 requise
 *   - Rate limit : 5 tentatives / 5 min (brute force sur le code TOTP)
 *   - Le factorId doit appartenir à l'admin courant (pas à un autre admin)
 *   - En cas de succès : génère automatiquement les codes de récupération
 */

import { NextRequest, NextResponse } from "next/server";
import { z }                         from "zod";
import { createServerClient }        from "@supabase/ssr";
import { requireAdminUser }          from "@/lib/admin-auth-v2";
import { generateRecoveryCodes }     from "@/lib/admin-mfa-recovery";
import { checkRateLimitAsyncStrict, buildRateLimitKey, resetRateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  factorId: z.string().min(1, "factorId requis"),
  code:     z.string().regex(/^\d{6}$/, "Code TOTP invalide (6 chiffres attendus)"),
});

export async function POST(req: NextRequest) {
  // ── 1. Auth admin ──────────────────────────────────────────────────────
  const authResult = await requireAdminUser(req);
  if (authResult.deny) return authResult.deny;
  const { admin } = authResult;
  if (!admin) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // ── 2. Validation du corps ─────────────────────────────────────────────
  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Corps invalide" },
      { status: 400 },
    );
  }
  const { factorId, code } = parsed.data;

  // ── 3. Rate limit strict (fail-closed) ─────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    const rl = await checkRateLimitAsyncStrict(
      buildRateLimitKey(admin.id, "mfa-verify-enroll"),
      5,
      5 * 60 * 1000, // 5 tentatives / 5 minutes
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 5 minutes." },
        { status: 429 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Service temporairement indisponible." }, { status: 503 });
  }

  // ── 4. Client user Supabase (anon key) pour les opérations MFA ─────────
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    },
  );

  // BUG-03 : vérifier que la session Supabase correspond à cet administrateur DJAMA
  const { data: { user: supabaseUser }, error: supabaseAuthError } = await userClient.auth.getUser();
  if (supabaseAuthError || !supabaseUser) {
    return NextResponse.json({ error: "Session Supabase invalide ou expirée. Reconnectez-vous." }, { status: 401 });
  }
  if (supabaseUser.email !== admin.email) {
    return NextResponse.json(
      { error: "Session Supabase et session admin DJAMA ne correspondent pas." },
      { status: 403 },
    );
  }

  // ── 5. Vérifier que le factorId appartient bien à cet admin ────────────
  const { data: factorData, error: factorsError } = await userClient.auth.mfa.listFactors();

  if (factorsError) {
    return NextResponse.json({ error: "Erreur vérification facteurs." }, { status: 500 });
  }

  const ownsFactor = (factorData?.totp ?? []).some(f => f.id === factorId);
  if (!ownsFactor) {
    // Tentative d'accès à un facteur d'un autre admin — log critique
    const { logAdminAction } = await import("@/lib/admin-auth-v2");
    await logAdminAction({
      admin,
      action:   "MFA_VERIFY_ENROLL_UNAUTHORIZED_FACTOR",
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
      severity: "critical",
      details:  { attempted_factor_id: factorId },
    });
    return NextResponse.json({ error: "Facteur invalide." }, { status: 403 });
  }

  // ── 6. Vérifier le code TOTP via Supabase Auth ─────────────────────────
  const { data: challenge, error: challengeError } = await userClient.auth.mfa.challenge({
    factorId,
  });

  if (challengeError || !challenge) {
    console.error("[MFAVerifyEnroll] Erreur challenge:", challengeError?.message);
    return NextResponse.json({ error: "Erreur lors de la création du challenge MFA." }, { status: 500 });
  }

  const { error: verifyError } = await userClient.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "Code TOTP incorrect. Vérifiez l'heure de votre appareil et réessayez." },
      { status: 400 },
    );
  }

  // ── 7. Succès : réinitialiser le rate limit + générer les codes de récupération ──
  await resetRateLimitKey(buildRateLimitKey(admin.id, "mfa-verify-enroll")).catch(() => {});

  let recoveryCodes: string[] | undefined;
  try {
    const result = await generateRecoveryCodes(
      admin,
      ip,
      req.headers.get("user-agent") ?? undefined,
    );
    recoveryCodes = result.codes;
  } catch (err) {
    console.error("[MFAVerifyEnroll] Erreur génération codes récupération:", err);
    // Enrôlement réussi même sans codes — les codes peuvent être régénérés
  }

  // Journalisation succès
  const { logAdminAction } = await import("@/lib/admin-auth-v2");
  await logAdminAction({
    admin,
    action:   "MFA_ENROLL_COMPLETED",
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
    severity: "critical", // enrôlement MFA = événement critique à toujours tracer
    details:  {
      factor_id: factorId,
      recovery_codes_generated: recoveryCodes?.length ?? 0,
    },
  });

  return NextResponse.json({
    ok:            true,
    message:       "MFA TOTP enrôlé avec succès.",
    recoveryCodes, // ⚠️ Afficher UNE SEULE FOIS et demander à l'admin de les conserver
    warning:       recoveryCodes
      ? "Conservez ces codes dans un endroit sécurisé. Ils ne seront plus affichés."
      : "Codes de récupération non générés — contactez le support.",
  });
}
