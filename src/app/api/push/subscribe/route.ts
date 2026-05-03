import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("push/subscribe");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SubscribeSchema = z.object({
  userId: z.string().uuid(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth:   z.string().min(1),
    }),
  }),
});

/* POST — enregistre un abonnement push */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = SubscribeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { userId, subscription: { endpoint, keys } } = parsed.data;

    await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id:  userId,
        endpoint,
        p256dh:   keys.p256dh,
        auth_key: keys.auth,
      },
      { onConflict: "endpoint" }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    log.error("POST error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* DELETE — supprime un abonnement push */
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 });

    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    return NextResponse.json({ ok: true });
  } catch (e) {
    log.error("DELETE error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
