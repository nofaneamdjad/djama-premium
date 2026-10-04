/**
 * GET /api/payment-links/[id]/qr
 * Génère un QR code PNG pointant vers la vraie URL publique /pay/[slug]
 */
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: link } = await supabaseAdmin
    .from("payment_links")
    .select("slug,title,status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!link) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const url = `${APP_URL}/pay/${link.slug as string}`;

  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#c9a55a", light: "#07080e" },
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "image/png",
      "Content-Disposition": `attachment; filename="qr-${link.slug as string}.png"`,
      "Cache-Control":       "no-store",
    },
  });
}
