import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// GET /api/cards/[id]/qr?format=png|svg&size=300
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const url     = new URL(req.url);
  const format  = url.searchParams.get("format") ?? "png";
  const size    = parseInt(url.searchParams.get("size") ?? "300", 10);

  const admin = createSupabaseAdmin();
  const { data: card } = await admin
    .from("business_cards")
    .select("slug, status")
    .eq("id", id)
    .single();

  if (!card) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });

  const cardUrl = `https://djama.space/c/${card.slug}`;

  const opts = {
    color: { dark: "#0e1420", light: "#ffffff" },
    margin: 2,
    width: Math.min(Math.max(size, 100), 1000),
  };

  if (format === "svg") {
    const svg = await QRCode.toString(cardUrl, { type: "svg", ...opts });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="qr-${card.slug}.svg"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // PNG (buffer)
  const buffer = await QRCode.toBuffer(cardUrl, { type: "png", ...opts });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${card.slug}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
