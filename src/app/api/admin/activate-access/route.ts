/**
 * POST /api/admin/activate-access
 *
 * Active ou désactive un accès utilisateur depuis l'admin.
 * Quand activate=true → met à jour user_access ET envoie l'email d'activation.
 * Quand activate=false → met à jour user_access uniquement (pas d'email).
 *
 * Body JSON :
 *   email       string   — obligatoire
 *   col         "espace_premium" | "coaching_ia" | "soutien_scolaire" | "outils_saas"
 *   activate    boolean  — true = débloquer, false = retirer
 *   name?       string   — utilisé dans l'email si fourni
 *
 * Réponse :
 *   { success: true, email_sent?: boolean, email_error?: string }
 */

import { NextResponse }              from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { sendAccessActivatedEmail }  from "@/lib/email";
import { createLogger }              from "@/lib/logger";

const log = createLogger("activate-access");

type AccessCol = "espace_premium" | "coaching_ia" | "soutien_scolaire" | "outils_saas";

function getSupabaseClient() {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const isPlaceholder = !SERVICE_KEY || SERVICE_KEY.startsWith("COLLER_");
  const key = isPlaceholder
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : SERVICE_KEY;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  // ── Constantes URL résolues à l'exécution (pas au chargement du module) ──
  const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";
  const LOGIN_URLS: Record<AccessCol, string> = {
    espace_premium:   `${SITE_URL}/client`,
    coaching_ia:      `${SITE_URL}/coaching-ia/espace`,
    soutien_scolaire: `${SITE_URL}/client`,
    outils_saas:      `${SITE_URL}/client`,
  };

  // ── Diagnostic env (visible dans les logs Vercel) ──────────────
  const rawKey    = process.env.RESEND_API_KEY;
  const trimmed   = rawKey?.trim() ?? "";
  const sanitized = trimmed.replace(/^["']|["']$/g, "").trim();
  const keyPreview = sanitized
    ? `${sanitized.slice(0, 7)}...${sanitized.slice(-4)} (${sanitized.length} chars)`
    : "ABSENTE";
  log.debug("ENV", {
    RESEND_API_KEY: keyPreview,
    RESEND_FROM:    process.env.RESEND_FROM ?? "ABSENT",
    SITE_URL,
    SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("COLLER_") ? "PLACEHOLDER" : "SET")
      : "ABSENT",
  });

  try {
    const body = await req.json() as {
      email:    string;
      col:      AccessCol;
      activate: boolean;
      name?:    string;
    };

    const { email, col, activate, name } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const validCols: AccessCol[] = ["espace_premium", "coaching_ia", "soutien_scolaire", "outils_saas"];
    if (!validCols.includes(col)) {
      return NextResponse.json({ error: "Colonne invalide." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase        = getSupabaseClient();

    // ── 1. Lire l'entrée existante ────────────────────────────────
    const { data: existing } = await supabase
      .from("user_access")
      .select("name, notes")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const resolvedName = name?.trim() || (existing?.name as string | null) || null;

    // ── 2. Mise à jour dans user_access ──────────────────────────
    const { error: updateError } = await supabase
      .from("user_access")
      .update({
        [col]:      activate,
        updated_at: new Date().toISOString(),
        ...(activate ? { notes: (existing?.notes ?? "") + ` | Activé le ${new Date().toLocaleDateString("fr-FR")}` } : {}),
      })
      .eq("email", normalizedEmail);

    if (updateError) {
      log.error("update error", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    log.info(`${activate ? "Activé" : "Désactivé"} ${col} → ${normalizedEmail}`);

    // ── 3. Envoi de l'email si activation (pas pour désactivation) ──
    if (!activate) {
      return NextResponse.json({ success: true });
    }

    const emailResult = await sendAccessActivatedEmail({
      email:      normalizedEmail,
      fullName:   resolvedName,
      accessType: col,
      loginUrl:   LOGIN_URLS[col],
    });

    // Enrichir le message d'erreur email pour guider le diagnostic
    let emailError: string | undefined;
    if (!emailResult.sent) {
      const raw = emailResult.reason ?? "Erreur inconnue";
      if (
        raw.toLowerCase().includes("invalid api key") ||
        raw.toLowerCase().includes("api key is invalid") ||
        raw.toLowerCase().includes("unauthorized") ||
        raw.includes("401")
      ) {
        emailError = `RESEND_API_KEY invalide ou non configurée dans Vercel. Clé utilisée : ${keyPreview}`;
      } else if (raw.includes("verify a domain") || raw.includes("own email address")) {
        emailError = `Domaine non vérifié dans Resend. Allez sur resend.com/domains et vérifiez djama.space`;
      } else {
        emailError = raw;
      }
    }

    return NextResponse.json({
      success:     true,
      email_sent:  emailResult.sent,
      email_error: emailError,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
