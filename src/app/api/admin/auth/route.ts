import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const ADMIN_PASS = process.env.ADMIN_PASS ?? process.env.NEXT_PUBLIC_ADMIN_PASS ?? "djama2024";

    if (password !== ADMIN_PASS) {
      await new Promise(r => setTimeout(r, 600));
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("djama_admin_tok", ADMIN_PASS, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("djama_admin_tok", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return res;
}
