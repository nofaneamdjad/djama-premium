/**
 * /api/admin/virements
 *
 * GET    — liste tous les virements
 * POST   — créer un nouveau virement client
 * PATCH  — marquer paiement reçu OU bloquer l'accès
 * DELETE — supprimer un virement
 */

import { NextResponse }   from "next/server";
import { createClient }   from "@supabase/supabase-js";
import { syncSubscriptionAccess } from "@/lib/subscription-helpers";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* Calcule le prochain prélèvement à partir du jour du mois */
function nextPaymentDate(jourPrelevement: number): string {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), jourPrelevement);
  if (d <= today) d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

/* ─── GET — liste ─────────────────────────────────────── */
export async function GET() {
  const sb = getAdmin();
  const { data, error } = await sb
    .from("virements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/* ─── POST — création ─────────────────────────────────── */
export async function POST(req: Request) {
  const body = await req.json() as {
    email: string; nom: string; montant?: number;
    jour_prelevement?: number; notes?: string;
  };

  const { email, nom, montant = 11.90, jour_prelevement = 1, notes } = body;
  if (!email || !nom) return NextResponse.json({ error: "email et nom requis" }, { status: 400 });

  const sb = getAdmin();
  const { data, error } = await sb.from("virements").insert({
    email:            email.trim().toLowerCase(),
    nom:              nom.trim(),
    montant,
    jour_prelevement,
    prochain_paiement: nextPaymentDate(jour_prelevement),
    acces_actif:       false,
    notes:             notes?.trim() || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

/* ─── PATCH — paiement reçu / bloquer ────────────────── */
export async function PATCH(req: Request) {
  const body = await req.json() as {
    id: string; action: "paye" | "bloquer"; email: string; nom?: string;
  };

  const { id, action, email, nom } = body;
  if (!id || !action || !email) {
    return NextResponse.json({ error: "id, action, email requis" }, { status: 400 });
  }

  const sb = getAdmin();
  const now  = new Date();
  const today = now.toISOString().split("T")[0];

  if (action === "paye") {
    /* 1. Trouver le jour de prélèvement pour calculer le prochain */
    const { data: row } = await sb
      .from("virements").select("jour_prelevement").eq("id", id).single();
    const jour = row?.jour_prelevement ?? 1;

    /* 2. Calculer prochain paiement = même jour, mois suivant */
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, jour);
    const prochain = nextDate.toISOString().split("T")[0];

    /* 3. Mettre à jour la ligne virements */
    await sb.from("virements").update({
      dernier_paiement:  today,
      prochain_paiement: prochain,
      acces_actif:       true,
      updated_at:        now.toISOString(),
    }).eq("id", id);

    /* 4. Débloquer l'accès dans user_access + user_metadata */
    try {
      // Trouver userId
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 });
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user) {
        await syncSubscriptionAccess({
          email,
          userId:   user.id,
          active:   true,
          provider: "paypal", // virement traité comme paiement manuel
          userData: user.user_metadata,
        });
      } else {
        /* Pas encore de compte — créer juste user_access */
        await sb.from("user_access").upsert({
          email:          email.toLowerCase(),
          name:           nom ?? "",
          outils_saas:    true,
          espace_premium: true,
          source:         "virement",
          updated_at:     now.toISOString(),
        }, { onConflict: "email" });
      }
    } catch (e) {
      console.error("[virements] sync error:", e);
    }

    return NextResponse.json({ success: true, action: "paye", prochain });

  } else {
    /* bloquer */
    await sb.from("virements").update({
      acces_actif: false,
      updated_at:  now.toISOString(),
    }).eq("id", id);

    /* Révoquer l'accès */
    try {
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 });
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user) {
        await syncSubscriptionAccess({
          email,
          userId:   user.id,
          active:   false,
          provider: "paypal",
          userData: user.user_metadata,
        });
      } else {
        await sb.from("user_access").update({
          outils_saas:    false,
          espace_premium: false,
          source:         "virement",
          updated_at:     now.toISOString(),
        }).eq("email", email.toLowerCase());
      }
    } catch (e) {
      console.error("[virements] revoke error:", e);
    }

    return NextResponse.json({ success: true, action: "bloquer" });
  }
}

/* ─── DELETE ──────────────────────────────────────────── */
export async function DELETE(req: Request) {
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb = getAdmin();
  const { error } = await sb.from("virements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
