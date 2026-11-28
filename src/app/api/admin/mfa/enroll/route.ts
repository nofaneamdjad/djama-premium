/**
 * POST /api/admin/mfa/enroll
 *
 * Lance l'enrôlement TOTP pour l'administrateur courant.
 * Retourne le QR code (SVG) et le secret TOTP pour saisie manuelle.
 * À utiliser uniquement si l'admin n'a pas encore de facteur TOTP enrôlé.
 *
 * Sécurité :
 *   - Auth Strategy 0 requise (session djama_admin_tok valide)
 *   - L'admin doit être actif (is_active = true)
 *   - Rate limit : 3 tentatives / 15 min (brute force)
 *   - Ne pas appeler si déjà enrôlé → vérifier d'abord via GET /api/admin/mfa/status
 */

import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { requireAdminUser }           from "@/lib/admin-auth-v2";
import { checkRateLimitAsyncStrict, buildRateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── 1. Authentification admin (Strategy 0 : token djama_admin_tok) ──────
  const authResult = await requireAdminUser(req);
  if (authResult.deny) return authResult.deny;
  const { admin } = authResult;
  if (!admin) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // ── 2. Rate limit strict (fail-closed) ──────────────────────────────────
  // 3 tentatives / 15 min — brute force sur l'enrôlement
  try {
    const rl = await checkRateLimitAsyncStrict(
      buildRateLimitKey(admin.id, "mfa-enroll"),
      3,
      15 * 60 * 1000,
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives d'enrôlement. Réessayez dans 15 minutes." },
        { status: 429 },
      );
    }
  } catch {
    // fail-closed : Redis down → bloquer par précaution
    return NextResponse.json(
      { error: "Service temporairement indisponible." },
      { status: 503 },
    );
  }

  // ── 3. Vérifier l'état MFA via le client user Supabase ──────────────────
  // Note : auth.admin.mfa.listFactors ne retourne que {factors: Factor[]}
  // Pour l'enrôlement, on utilise le client user (anon key) avec les cookies
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

  // Vérifier si TOTP déjà enrôlé et vérifié
  const { data: factorData, error: factorsError } = await userClient.auth.mfa.listFactors();
  if (factorsError) {
    return NextResponse.json({ error: "Erreur lors de la vérification MFA." }, { status: 500 });
  }

  const totpVerified = (factorData?.totp ?? []).some(f => f.status === "verified");
  if (totpVerified) {
    return NextResponse.json(
      { error: "MFA TOTP déjà enrôlé. Utilisez /api/admin/mfa/verify-enroll pour re-enrôler." },
      { status: 409 },
    );
  }

  // ── 4. Lancer l'enrôlement TOTP via le client user ──────────────────────
  const { data: enrollData, error: enrollError } = await userClient.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `djama-admin-${admin.email}`,
    issuer: "DJAMA Admin",
  });

  if (enrollError) {
    console.error("[MFAEnroll] Erreur enrôlement:", enrollError.message);
    return NextResponse.json({ error: "Erreur lors de l'initialisation du TOTP." }, { status: 500 });
  }

  // Journalisation
  const { logAdminAction } = await import("@/lib/admin-auth-v2");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAdminAction({
    admin,
    action:   "MFA_ENROLL_INITIATED",
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
    severity: "warning",
    details:  { factor_id: enrollData?.id },
  });

  return NextResponse.json({
    ok:        true,
    factorId:  enrollData?.id,               // ID du facteur à passer à verify-enroll
    qrCode:    enrollData?.totp?.qr_code,    // SVG inline — afficher dans <img src="..."> ou dangerouslySetInnerHTML
    secret:    enrollData?.totp?.secret,     // Pour saisie manuelle dans l'appli authenticator
    uri:       enrollData?.totp?.uri,
    message:   "Scannez le QR code avec Google Authenticator, Authy, ou toute appli TOTP. Puis vérifiez via POST /api/admin/mfa/verify-enroll.",
  });
}
