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
   5. Charger le payload authentifié stocké (raw_payload)
      → 422 si absent (payload jamais reçu ou effacé)
   6. Vérifier déduplication event_id (autre livraison déjà traitée)
   7. Dispatcher depuis raw_payload (jamais de reconstruction)
   8. Mettre à jour le statut processed / failed
   9. Journaliser dans admin_audit_log

   Contrainte fondamentale :
   JAMAIS de reconstruction d'un événement financier.
   Si raw_payload est absent → 422 + instructions de récupération PayPal.
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

  // ── 4. Chargement du payload authentifié ────────────────────
  // Le payload a été stocké lors de la réception initiale après vérification
  // de signature. C'est la seule source autorisée pour le replay.
  const { data: storedRow } = await supabaseAdmin
    .from("paypal_webhook_events")
    .select("id, event_id, event_type, resource_id, raw_payload")
    .eq("id", transmission_id)
    .maybeSingle();

  if (!storedRow?.raw_payload) {
    // Payload absent — refus de reconstruire un événement financier
    log.warn(`raw_payload absent pour ${transmission_id} — replay refusé`);

    await supabaseAdmin
      .from("paypal_webhook_events")
      .update({ status: "failed", failed_at: new Date().toISOString(), error: "raw_payload absent — replay refusé" })
      .eq("id", transmission_id);

    await logAdminAction({
      admin,
      action:     "WEBHOOK_PAYPAL_RETRY_FAILED",
      resource:   "paypal_webhook_events",
      resourceId: transmission_id,
      ip, userAgent,
      details:    { reason: "raw_payload_missing", event_type: lease.event_type, attempt_count: lease.attempt_count },
      severity:   "warning",
    });

    return NextResponse.json({
      error:        "Payload original non disponible — replay refusé",
      detail:       "Le payload authentifié n'a pas été stocké lors de la réception initiale.",
      recovery:     "Utiliser 'Resend Webhook' depuis le dashboard PayPal Sandbox/Live pour re-livrer l'événement avec sa signature.",
      transmission_id,
      event_type:   lease.event_type,
    }, { status: 422 });
  }

  // ── 5. Déduplication event_id ────────────────────────────────
  // Si le même événement métier a déjà été traité par une autre livraison,
  // marquer comme processed sans redéclencher les effets financiers.
  if (storedRow.event_id) {
    const { data: alreadyProcessed } = await supabaseAdmin
      .from("paypal_webhook_events")
      .select("id, status")
      .eq("event_id", storedRow.event_id)
      .eq("status", "processed")
      .neq("id", transmission_id)
      .maybeSingle();

    if (alreadyProcessed) {
      await supabaseAdmin
        .from("paypal_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", transmission_id);

      log.info(`event_id ${storedRow.event_id} déjà traité par ${alreadyProcessed.id} — livraison ${transmission_id} marquée processed`);

      await logAdminAction({
        admin,
        action:     "WEBHOOK_PAYPAL_RETRY_SUCCESS",
        resource:   "paypal_webhook_events",
        resourceId: transmission_id,
        ip, userAgent,
        details:    { event_type: lease.event_type, attempt_count: lease.attempt_count, reason: "duplicate_delivery_dedup" },
        severity:   "info",
      });

      return NextResponse.json({
        ok:            true,
        skipped:       true,
        reason:        "event_already_processed_by_other_delivery",
        processed_by:  alreadyProcessed.id,
        transmission_id,
      });
    }
  }

  // ── 6. Dispatch depuis le payload authentifié ───────────────
  interface PayPalWebhookEvent {
    id?: string;
    event_type: string;
    resource: {
      id: string;
      status?: string;
      custom_id?: string;
      plan_id?: string;
      subscriber?: { email_address?: string; name?: { given_name?: string; surname?: string } };
      payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
    };
  }

  try {
    await dispatchPayPalEvent(storedRow.raw_payload as PayPalWebhookEvent);

    await supabaseAdmin
      .from("paypal_webhook_events")
      .update({
        status:       "processed",
        processed_at: new Date().toISOString(),
        failed_at:    null,
        error:        null,
      })
      .eq("id", transmission_id);

    log.info(`PayPal tx ${transmission_id} retraité avec succès (tentative #${lease.attempt_count})`);

    await logAdminAction({
      admin,
      action:     "WEBHOOK_PAYPAL_RETRY_SUCCESS",
      resource:   "paypal_webhook_events",
      resourceId: transmission_id,
      ip, userAgent,
      details:    { event_type: lease.event_type, attempt_count: lease.attempt_count, resource_id: storedRow.resource_id ?? undefined },
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
