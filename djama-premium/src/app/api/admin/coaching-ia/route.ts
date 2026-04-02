import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCoachingIAEmail } from "@/lib/email";

/* ─────────────────────────────────────────────────────────────
   /api/admin/coaching-ia
   CRUD admin pour la gestion des accès Coaching IA.

   Toutes les routes nécessitent : x-admin-token: ADMIN_SECRET

   GET  ?email=xxx          → lister les clients (filtrable)
   POST { action, email }   → activate | deactivate | resend_email | confirm_transfer
─────────────────────────────────────────────────────────────── */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return !!token && token === process.env.ADMIN_SECRET;
}

/* ── GET ────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase     = getSupabaseAdmin();
  const emailFilter  = req.nextUrl.searchParams.get("email");
  const statusFilter = req.nextUrl.searchParams.get("status"); // "active" | "pending" | "all"

  let query = supabase
    .from("clients")
    .select(
      "user_id, email, full_name, coaching_ia_active, coaching_ia_expires, coaching_ia_payment_method, coaching_ia_pending_transfer, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (emailFilter) {
    query = query.ilike("email", `%${emailFilter}%`);
  }

  if (statusFilter === "active") {
    query = query.eq("coaching_ia_active", true);
  } else if (statusFilter === "pending") {
    query = query.eq("coaching_ia_pending_transfer", true).eq("coaching_ia_active", false);
  } else {
    /* Par défaut : seulement les clients avec un champ coaching */
    query = query.not("coaching_ia_payment_method", "is", null);
    if (!emailFilter) {
      query = query.or("coaching_ia_active.eq.true,coaching_ia_pending_transfer.eq.true");
    }
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data ?? [] });
}

/* ── POST ───────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { action, email } = await req.json() as {
    action: "activate" | "deactivate" | "resend_email" | "confirm_transfer";
    email:  string;
  };

  if (!email || !action) {
    return NextResponse.json({ error: "email et action requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  /* Trouver l'utilisateur Supabase Auth */
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUser = users.find((u) => u.email === email) ?? null;

  /* ── activate / confirm_transfer ── */
  if (action === "activate" || action === "confirm_transfer") {
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    let userId = authUser?.id;
    let isNewUser = false;

    if (!authUser) {
      /* Créer le compte si inexistant */
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { coaching_ia_active: true, coaching_ia_expires: expiresAt },
      });
      if (createErr || !created.user) {
        return NextResponse.json({ error: "Impossible de créer le compte" }, { status: 500 });
      }
      userId    = created.user.id;
      isNewUser = true;
    } else {
      await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          coaching_ia_active:  true,
          coaching_ia_expires: expiresAt,
        },
      });
    }

    await supabase.from("clients").update({
      user_id:                      userId,
      coaching_ia_active:           true,
      coaching_ia_expires:          expiresAt,
      coaching_ia_pending_transfer: false,
      updated_at:                   new Date().toISOString(),
    }).eq("email", email);

    /* Générer lien + envoyer email */
    let accessLink = `${SITE_URL}/coaching-ia/espace`;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type:    isNewUser ? "invite" : "magiclink",
        email,
        options: { redirectTo: `${SITE_URL}/coaching-ia/espace` },
      });
      if (linkData?.properties?.action_link) accessLink = linkData.properties.action_link;
    } catch { /* fallback */ }

    await sendCoachingIAEmail({
      email,
      fullName: authUser?.user_metadata?.full_name ?? null,
      accessLink,
      isNewUser,
    });

    console.log("[Admin] ✅ Coaching IA activé →", email);
    return NextResponse.json({ success: true, message: `Accès activé pour ${email}` });
  }

  /* ── deactivate ── */
  if (action === "deactivate") {
    if (authUser) {
      await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          coaching_ia_active: false,
        },
      });
    }

    await supabase.from("clients").update({
      coaching_ia_active: false,
      updated_at:         new Date().toISOString(),
    }).eq("email", email);

    console.log("[Admin] 🔴 Coaching IA désactivé →", email);
    return NextResponse.json({ success: true, message: `Accès désactivé pour ${email}` });
  }

  /* ── resend_email ── */
  if (action === "resend_email") {
    if (!authUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    let accessLink = `${SITE_URL}/coaching-ia/espace`;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type:    "magiclink",
        email,
        options: { redirectTo: `${SITE_URL}/coaching-ia/espace` },
      });
      if (linkData?.properties?.action_link) accessLink = linkData.properties.action_link;
    } catch { /* fallback */ }

    await sendCoachingIAEmail({
      email,
      fullName:  authUser.user_metadata?.full_name ?? null,
      accessLink,
      isNewUser: false,
    });

    console.log("[Admin] 📧 Email renvoyé →", email);
    return NextResponse.json({ success: true, message: `Email renvoyé à ${email}` });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
