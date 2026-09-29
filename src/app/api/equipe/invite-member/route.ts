/**
 * POST /api/equipe/invite-member
 *
 * Invite un membre par email via Supabase Auth inviteUserByEmail.
 * Pas de mot de passe affiché au chef — le membre reçoit un email
 * avec un lien "Définir mon mot de passe" pour rejoindre l'espace membre.
 *
 * Corps : { memberId, email, name? }
 *
 * Sécurité :
 *   - caller.id déterminé côté serveur (jamais depuis le body)
 *   - Vérifie que le membre appartient bien à l'organisation du chef
 *   - Rate limit 10 invitations/heure/chef
 */

import { NextRequest, NextResponse }  from "next/server";
import { createClient }               from "@supabase/supabase-js";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { checkRateLimit }             from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user: caller } } = await supabaseAuth.auth.getUser();
  if (!caller) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { allowed } = checkRateLimit(caller.id, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Limite atteinte : 10 invitations par heure." }, { status: 429 });
  }

  let body: { memberId?: string; email?: string; name?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const { memberId, email, name } = body;
  if (!memberId || !email?.trim())
    return NextResponse.json({ error: "memberId et email requis." }, { status: 400 });

  const emailNorm = email.trim().toLowerCase();
  const admin = createSupabaseAdmin();

  /* ── Vérifier que le membre appartient à l'organisation du chef ── */
  const { data: memberRow } = await admin
    .from("team_members")
    .select("id, name, organization_id, auth_user_id")
    .eq("id", memberId)
    .eq("user_id", caller.id)
    .single();

  if (!memberRow)
    return NextResponse.json({ error: "Membre introuvable ou accès refusé." }, { status: 404 });

  /* ── Si un compte Auth existe déjà ── */
  if (memberRow.auth_user_id) {
    return NextResponse.json({
      success: true,
      already_exists: true,
      message: "Ce membre a déjà un compte DJAMA.",
    });
  }

  /* ── Trouver l'organisation du chef ── */
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("owner_id", caller.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  /* ── Service role key requise pour inviteUserByEmail ── */
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const svcValid = svcKey.length > 100 && svcKey.startsWith("eyJ");

  if (!svcValid) {
    /* Fallback : créer le compte avec un token temporaire plutôt que mot de passe */
    return NextResponse.json({
      error: "Invitation par email requiert SUPABASE_SERVICE_ROLE_KEY configurée.",
      fallback: "Utilisez la création de compte avec mot de passe temporaire.",
    }, { status: 503 });
  }

  const adminAuthClient = createClient(url, svcKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const memberName = (name ?? memberRow.name ?? "").trim();
  const redirectTo = (process.env.NEXT_PUBLIC_APP_URL ?? "https://djama.space") + "/membre/login";

  const { data: invited, error: inviteErr } = await adminAuthClient.auth.admin.inviteUserByEmail(
    emailNorm,
    {
      data: {
        role:      "member",
        team_id:   caller.id,
        member_id: memberId,
        name:      memberName,
        ...(org ? { org_id: org.id, org_name: org.name } : {}),
      },
      redirectTo,
    },
  );

  if (inviteErr) {
    const msg = inviteErr.message ?? "";
    if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
      /* Email déjà dans Supabase Auth — on essaie de lier le compte */
      return NextResponse.json({ error: "Cet email est déjà enregistré dans DJAMA." }, { status: 409 });
    }
    return NextResponse.json({ error: msg || "Erreur lors de l'invitation." }, { status: 500 });
  }

  const authUserId = invited.user?.id;

  /* ── Lier auth_user_id dans team_members ── */
  if (authUserId) {
    await admin.from("team_members").update({ auth_user_id: authUserId }).eq("id", memberId).eq("user_id", caller.id);

    if (org) {
      await admin.from("team_members").update({ organization_id: org.id }).eq("id", memberId).eq("user_id", caller.id);

      await admin.from("organization_members").upsert({
        organization_id: org.id,
        user_id: authUserId,
        role: "member",
        invite_email: emailNorm,
      }, { onConflict: "organization_id,user_id", ignoreDuplicates: true });

      const { data: channels } = await admin
        .from("org_message_groups")
        .select("id")
        .eq("organization_id", org.id)
        .eq("is_direct", false)
        .in("name", ["général", "annonces", "projets", "ressources"]);

      if (channels?.length) {
        await admin.from("org_message_group_members").upsert(
          channels.map((ch: { id: string }) => ({
            group_id: ch.id, organization_id: org.id, user_id: authUserId,
          })),
          { onConflict: "group_id,user_id", ignoreDuplicates: true },
        );
      }
    }
  }

  return NextResponse.json({
    success: true,
    invited: true,
    auth_user_id: authUserId ?? null,
    email: emailNorm,
    message: `Invitation envoyée à ${emailNorm}`,
  });
}
