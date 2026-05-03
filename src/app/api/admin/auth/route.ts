import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/admin-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // ── Rate limiting : 10 tentatives / 15 min par IP ───────────
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip, 10, 15 * 60 * 1000);
  if (!allowed) {
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const { password } = await req.json();
    const ADMIN_PASS =
      process.env.ADMIN_PASS ??
      process.env.NEXT_PUBLIC_ADMIN_PASS ??
      "djama2024";

    if (!password || password !== ADMIN_PASS) {
      // Délai anti-brute-force
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Générer un token HMAC — le mot de passe brut ne va jamais dans le cookie
    const token = await generateAdminToken(ADMIN_PASS);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("djama_admin_tok", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
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
