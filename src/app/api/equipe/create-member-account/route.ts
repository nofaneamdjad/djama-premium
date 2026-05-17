import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

async function getChef(req: NextRequest) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return null;
  const admin = createSupabaseAdmin();
  const { data: { user } } = await admin.auth.getUser(token);
  return user ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { memberId, name, email, password } = await req.json();
    if (!memberId || !name || !email || !password)
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });

    const chef = await getChef(req);
    if (!chef) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createSupabaseAdmin();

    const { data: authData, error: createErr } = await admin.auth.admin.createUser({
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

    if (createErr) {
      const msg = (createErr as { message?: string }).message ?? "";
      if (msg.includes("already been registered"))
        return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const authUserId = authData.user!.id;

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
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { authUserId, memberId } = await req.json();
    if (!authUserId || !memberId)
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });

    const chef = await getChef(req);
    if (!chef) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createSupabaseAdmin();
    await admin.auth.admin.deleteUser(authUserId);
    await admin.from("team_members").update({ auth_user_id: null }).eq("id", memberId).eq("user_id", chef.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
