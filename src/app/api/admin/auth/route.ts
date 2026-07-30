import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken } from "@/lib/admin-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTOTP, isTOTPEnabled } from "@/lib/totp";

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
    const { password, totpCode } = await req.json() as {
      password?: string;
      totpCode?: string;
    };
    const ADMIN_PASS = process.env.ADMIN_PASS;

    if (!ADMIN_PASS) {
      return NextResponse.json(
        { error: "Configuration admin manquante." },
        { status: 503 }
      );
    }

    if (!password || password !== ADMIN_PASS) {
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // ── 2FA TOTP (si ADMIN_TOTP_SECRET configuré) ────────────
    if (isTOTPEnabled()) {
      const secret = process.env.ADMIN_TOTP_SECRET!;
      if (!totpCode) {
        return NextResponse.json(
          { error: "Code 2FA requis", require2fa: true },
          { status: 401 }
        );
      }
      const valid = await verifyTOTP(secret, totpCode);
      if (!valid) {
        await new Promise((r) => setTimeout(r, 600));
        return NextResponse.json(
          { error: "Code 2FA invalide ou expiré", require2fa: true },
          { status: 401 }
        );
      }
    }

    const token = await generateAdminToken(ADMIN_PASS);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("djama_admin_tok", token, {
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
