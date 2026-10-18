import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ publicId: string }> };

// GET /api/widget/[publicId]/config — config publique (sans clé API ni données sensibles)
export async function GET(_req: Request, { params }: Params) {
  const { publicId } = await params;
  const admin = createSupabaseAdmin();

  const { data: bot } = await admin
    .from("chatbots")
    .select(
      "name, welcome_message, widget_config, require_consent",
    )
    .eq("public_id", publicId)
    .eq("status", "active")
    .single();

  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  return NextResponse.json({ bot }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
