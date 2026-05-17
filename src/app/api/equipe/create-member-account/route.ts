import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { memberId, name, email, password } = await req.json();

    if (!memberId || !name || !email || !password) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }

    // Récupérer le chef connecté
    const supabaseUser = await createSupabaseServer();
    const { data: { user: chef } } = await supabaseUser.auth.getUser();
    if (!chef) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createSupabaseAdmin();

    // Créer le compte Supabase Auth pour le membre
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        role: "member",
        team_id: chef.id,
        member_id: memberId,
        name: name.trim(),
      },
    });

    if (authErr) {
      if (authErr.message.includes("already been registered")) {
        return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
      }
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    const authUserId = authData.user.id;

    // Lier l'auth_user_id dans team_members (la colonne doit exister)
    const { error: updateErr } = await admin
      .from("team_members")
      .update({ auth_user_id: authUserId })
      .eq("id", memberId)
      .eq("user_id", chef.id);

    return NextResponse.json({
      success: true,
      auth_user_id: authUserId,
      member_linked: !updateErr,
      email: email.trim().toLowerCase(),
      login_url: "/membre/login",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { authUserId, memberId } = await req.json();
    if (!authUserId || !memberId) return NextResponse.json({ error: "Champs manquants." }, { status: 400 });

    const supabaseUser = await createSupabaseServer();
    const { data: { user: chef } } = await supabaseUser.auth.getUser();
    if (!chef) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createSupabaseAdmin();

    await admin.auth.admin.deleteUser(authUserId);
    await admin.from("team_members").update({ auth_user_id: null }).eq("id", memberId).eq("user_id", chef.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
