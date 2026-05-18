import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { memberId, name, email, password, chefId } = await req.json();
    if (!memberId || !name || !email || !password || !chefId)
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });

    const url     = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY     ?? "";

    const metadata = {
      role: "member",
      team_id: chefId,
      member_id: memberId,
      name: name.trim(),
    };

    let authUserId: string | null = null;
    let needsConfirmation = false;

    // Essai 1 : admin.createUser via service_role — envoie un email de confirmation
    const svcValid = svcKey.length > 100 && svcKey.startsWith("eyJ");
    if (svcValid) {
      const adminClient = createClient(url, svcKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true, // compte actif immédiatement, pas d'email requis
        user_metadata: metadata,
      });
      if (!error && data.user) {
        authUserId = data.user.id;
        needsConfirmation = false;
      } else if (error) {
        const msg = (error as { message?: string }).message ?? "";
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
          return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
      }
    }

    // Essai 2 : signUp via anon key, puis confirmation immédiate via service_role si dispo
    if (!authUserId) {
      const anonClient = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await anonClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: metadata },
      });
      if (error) {
        const msg = (error as { message?: string }).message ?? "";
        if (msg.includes("already") || msg.includes("registered"))
          return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
        return NextResponse.json({ error: msg || "Erreur création compte." }, { status: 500 });
      }
      if (!data.user)
        return NextResponse.json({ error: "Impossible de créer le compte." }, { status: 500 });
      authUserId = data.user.id;
      // Confirmer l'email immédiatement via service_role si disponible
      if (svcValid) {
        const adminClient = createClient(url, svcKey, { auth: { autoRefreshToken: false, persistSession: false } });
        await adminClient.auth.admin.updateUserById(authUserId, { email_confirm: true });
        needsConfirmation = false;
      } else {
        needsConfirmation = true;
      }
    }

    // Lier auth_user_id dans team_members
    const admin = createSupabaseAdmin();
    await admin.from("team_members").update({ auth_user_id: authUserId }).eq("id", memberId).eq("user_id", chefId);

    return NextResponse.json({
      success: true,
      auth_user_id: authUserId,
      email: email.trim().toLowerCase(),
      needs_confirmation: needsConfirmation,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { authUserId, memberId, chefId } = await req.json();
    if (!authUserId || !memberId || !chefId)
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });

    const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const url     = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
    const svcValid = svcKey.length > 100 && svcKey.startsWith("eyJ");
    if (!svcValid) return NextResponse.json({ error: "Service role key requise pour supprimer." }, { status: 403 });

    const adminClient = createClient(url, svcKey, { auth: { autoRefreshToken: false, persistSession: false } });
    await adminClient.auth.admin.deleteUser(authUserId);

    const admin = createSupabaseAdmin();
    await admin.from("team_members").update({ auth_user_id: null }).eq("id", memberId).eq("user_id", chefId);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
