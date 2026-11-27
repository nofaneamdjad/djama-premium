/**
 * POST /api/test-pdf
 * Route de test temporaire — génère un PDF côté serveur et le retourne.
 * DEV ONLY — ne pas déployer en production.
 */
import { NextRequest, NextResponse } from "next/server";
import { generatePdfBuffer } from "@/lib/pdf/generatePdfBuffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const buffer = await generatePdfBuffer(data);
    const ref = (data.reference as string) || "document";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${ref}.pdf"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
