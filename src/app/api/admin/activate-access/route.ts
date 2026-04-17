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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const LOGIN_URLS: Record<AccessCol, string> = {
  espace_premium:   `${SITE_URL}/client`,
  coaching_ia:      `${SITE_URL}/coaching-ia/espace`,
  soutien_scolaire: `${SITE_URL}/client`,
  outils_saas:      `${SITE_URL}/client`,
};

export async function POST(req: Request) {
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
      console.error("[activate-access] ❌ update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("[activate-access] ✅", activate ? "Activé" : "Désactivé", col, "→", normalizedEmail);

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

    return NextResponse.json({
      success:     true,
      email_sent:  emailResult.sent,
      email_error: emailResult.sent ? undefined : emailResult.reason,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[activate-access] ❌ Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
