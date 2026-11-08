import { NextRequest, NextResponse }     from "next/server";
import { createClient }                   from "@supabase/supabase-js";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";
import { createLogger }                   from "@/lib/logger";
import { dispatchPayPalEvent }             from "@/app/api/webhook/paypal/route";

const log = createLogger("admin/webhook/paypal/retry");

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/webhook/paypal/retry
   Rejoue atomiquement un event PayPal failed ou processing-expiré.

   Body : { transmission_id: string, lease_secs?: number }
   Auth : requireAdminUser — permission can_manage_payments obligatoire

   Ordre de sécurité (invariant) :
   1. Authentifier + vérifier session + MFA si requis
   2. Vérifier permission can_manage_payments → 403 sinon
   3. Valider les paramètres → 400 si invalides
   4. Acquérir atomiquement le bail → 0 effet DB si auth échoue
   5. Re-dispatcher via dispatchPayPalEvent
   6. Mettre à jour le statut processed / failed
   7. Journaliser le résultat dans admin_audit_log
─────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const ip        = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";

  // ── 1. Auth + Permission + MFA (AVANT toute opération DB) ───
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_manage_payments",
    logAction:          "WEBHOOK_PAYPAL_RETRY_ATTEMPT",
    logResource:        "paypal_webhook_events",
  });
  if (deny) return deny;

  // ── 2. Validation du body ────────────────────────────────────
  let transmission_id: string;
  let lease_secs: number = 300;
  try {
    const body = await req.json() as { transmission_id?: string; lease_secs?: number };
    if (!body.transmission_id || typeof body.transmission_id !== "string") {
      return NextResponse.json({ error: "transmission_id requis" }, { status: 400 });
    }
    transmission_id = body.transmission_id.trim();
    if (body.lease_secs && typeof body.lease_secs === "number") {
      lease_secs = body.lease_secs;
    }
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // ── 3. Acquisition atomique du bail ─────────────────────────
  const { data: leaseRows, error: leaseErr } = await supabaseAdmin.rpc(
    "acquire_paypal_webhook_lease",
    { p_transmission_id: transmission_id, p_lease_secs: lease_secs }
  );

  if (leaseErr) {
    log.error("acquire_paypal_webhook_lease error", leaseErr.message);
    return NextResponse.json(
      { error: "Erreur DB lors de l'acquisition du bail", detail: leaseErr.message },
      { status: 503 }
    );
  }

  if (!leaseRows || leaseRows.length === 0) {
    // Event introuvable, déjà traité, ou bail actif non expiré
    const { data: existing } = await supabaseAdmin
      .from("paypal_webhook_events")
      .select("id, status, attempt_count, processing_since, event_type")
      .eq("id", transmission_id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Event introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      skipped:        true,
      reason:         `Event en statut '${existing.status}' — non repris (bail actif ou déjà traité)`,
      current_status: existing.status,
      attempt_count:  existing.attempt_count,
    }, { status: 409 });
  }

  const lease = leaseRows[0] as {
    id:              string;
    event_id:        string | null;
    event_type:      string;
    attempt_count:   number;
    previous_status: string;
    previous_error:  string | null;
  };

  log.info(`Bail acquis pour ${transmission_id} (tentative #${lease.attempt_count}, type=${lease.event_type})`);

  // ── 4. Récupération de l'event depuis Supabase (raw_body non stocké) ──
  // PayPal ne fournit pas d'API équivalente à stripe.events.retrieve.
  // La reprise doit être déclenchée depuis le dashboard PayPal (Resend Webhook)
  // ou via le corps de l'event original stocké en DB si disponible.
  // Ici on reconstruit un event minimal depuis les données stockées pour
  // permettre un re-dispatch partiel sur les types supportés.
  const { data: storedEvent } = await supabaseAdmin
    .from("paypal_webhook_events")
    .select("id, event_id, event_type, raw_body_hash")
    .eq("id", transmission_id)
    .maybeSingle();

  // ── 5. Dispatch ────────────────────────────────────────────
  // Note : sans le corps original, le dispatch ne peut réactiver que les
  // types qui n'ont pas besoin du payload complet (ex: subscription status).
  // Le corps original n'est pas stocké pour des raisons de taille/sécurité.
  // Les types BILLING.SUBSCRIPTION.* utilisent resource.id = subscriptionId.
  // Pour PAYMENT.CAPTURE.COMPLETED, le replay nécessite le corps original.
  try {
    // Construire un event minimal depuis les données stockées
    // Pour la reprise complète, utiliser le "Resend Webhook" PayPal Dashboard.
    const minimalEvent = {
      id:         storedEvent?.event_id ?? undefined,
      event_type: lease.event_type,
      resource:   { id: storedEvent?.event_id ?? transmission_id },
    };

    await dispatchPayPalEvent(minimalEvent);

    await supabaseAdmin
      .from("paypal_webhook_events")
      .update({
        status:       "processed",
        processed_at: new Date().toISOString(),
        failed_at:    null,
        error:        null,
      })
      .eq("id", transmission_id);

    log.info(`PayPal event ${transmission_id} retraité avec succès (tentative #${lease.attempt_count})`);

    await logAdminAction({
      admin,
      action:     "WEBHOOK_PAYPAL_RETRY_SUCCESS",
      resource:   "paypal_webhook_events",
      resourceId: transmission_id,
      ip, userAgent,
      details:    { event_type: lease.event_type, attempt_count: lease.attempt_count },
      severity:   "info",
    });

    return NextResponse.json({
      ok:            true,
      transmission_id,
      event_type:    lease.event_type,
      attempt_count: lease.attempt_count,
      status:        "processed",
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Erreur dispatch retry PayPal ${transmission_id}`, msg);

    await supabaseAdmin
      .from("paypal_webhook_events")
      .update({
        status:    "failed",
        failed_at: new Date().toISOString(),
        error:     msg.slice(0, 500),
      })
      .eq("id", transmission_id);

    await logAdminAction({
      admin,
      action:     "WEBHOOK_PAYPAL_RETRY_FAILED",
      resource:   "paypal_webhook_events",
      resourceId: transmission_id,
      ip, userAgent,
      details:    { event_type: lease.event_type, attempt_count: lease.attempt_count, error: msg.slice(0, 200) },
      severity:   "warning",
    });

    return NextResponse.json(
      {
        error:          "Erreur lors du retraitement",
        transmission_id,
        event_type:     lease.event_type,
        attempt_count:  lease.attempt_count,
        detail:         msg,
      },
      { status: 500 }
    );
  }
}
