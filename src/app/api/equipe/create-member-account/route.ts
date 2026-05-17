import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { memberId, name, email, password, chefId } = await req.json();

    if (!memberId || !name || !email || !password || !chefId)
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });

    const admin = createSupabaseAdmin();

    const { data: authData, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        role: "member",
        team_id: chefId,
        member_id: memberId,
        name: name.trim(),
      },
    });

    if (createErr) {
      const msg = (createErr as { message?: string }).message ?? "";
      if (msg.includes("already been registered") || msg.includes("already exists"))
        return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const authUserId = authData.user!.id;

    await admin
      .from("team_members")
      .update({ auth_user_id: authUserId })
      .eq("id", memberId)
      .eq("user_id", chefId);

    return NextResponse.json({
      success: true,
      auth_user_id: authUserId,
      email: email.trim().toLowerCase(),
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

    const admin = createSupabaseAdmin();
    await admin.auth.admin.deleteUser(authUserId);
    await admin.from("team_members").update({ auth_user_id: null }).eq("id", memberId).eq("user_id", chefId);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
