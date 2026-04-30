import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* POST — enregistre un abonnement push */
export async function POST(req: NextRequest) {
  try {
    const { subscription, userId } = await req.json();
    if (!subscription?.endpoint || !userId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;

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
    console.error("push/subscribe POST:", e);
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
    console.error("push/subscribe DELETE:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
