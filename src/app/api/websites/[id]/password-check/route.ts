import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as { password?: string };
  const password = body.password;

  if (!password || typeof password !== "string") {
    return NextResponse.json({ ok: false, error: "Mot de passe requis" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: site } = await admin
    .from("websites")
    .select("theme")
    .eq("id", id)
    .single();

  if (!site) {
    return NextResponse.json({ ok: false, error: "Site introuvable" }, { status: 404 });
  }

  const themeExt = (site.theme ?? {}) as Record<string, unknown>;

  if (!themeExt.passwordEnabled || !themeExt.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const hash = createHash("sha256").update(password).digest("hex");
  if (hash !== (themeExt.passwordHash as string)) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
  }

  const cookieName = `djama_pw_${id}`;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, hash, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
