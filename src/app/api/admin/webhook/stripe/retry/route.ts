import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";
import { createLogger } from "@/lib/logger";
import { dispatchStripeEvent } from "@/app/api/webhook/stripe/route";

const log = createLogger("admin/webhook/stripe/retry");

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/webhook/stripe/retry
   Rejoue atomiquement un event Stripe failed ou processing-expiré.

   Body : { event_id: string, lease_secs?: number }
   Auth : requireAdminUser — permission can_manage_payments obligatoire

   Ordre de sécurité (invariant) :
   1. Authentifier + vérifier session + MFA si requis
   2. Vérifier permission can_manage_payments → 403 sinon
   3. Valider les paramètres → 400 si invalides
   4. Acquérir atomiquement le bail → 0 effet DB si auth échoue
   5. Récupérer l'event depuis Stripe
   6. Dispatcher via dispatchStripeEvent
   7. Mettre à jour le statut processed / failed
   8. Journaliser le résultat dans admin_audit_log
─────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const ip        = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";

  // ── 1. Auth + Permission + MFA (AVANT toute opération DB) ────────
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_manage_payments",
    logAction:          "WEBHOOK_STRIPE_RETRY_ATTEMPT",
    logResource:        "stripe_webhook_events",
  });
  if (deny) return deny;

  // ── Validation du body ──────────────────────────────────────────
  let event_id: string;
  let lease_secs: number = 300;
  try {
    const body = await req.json() as { event_id?: string; lease_secs?: number };
    if (!body.event_id || typeof body.event_id !== "string") {
      return NextResponse.json({ error: "event_id requis" }, { status: 400 });
    }
    event_id = body.event_id.trim();
    if (body.lease_secs && typeof body.lease_secs === "number") {
      lease_secs = body.lease_secs;
    }
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // ── Acquisition atomique du bail ─────────────────────────────────
  const { data: leaseRows, error: leaseErr } = await supabaseAdmin.rpc(
    "acquire_webhook_lease",
    { p_event_id: event_id, p_lease_secs: lease_secs }
  );

  if (leaseErr) {
    log.error("acquire_webhook_lease error", leaseErr.message);
    return NextResponse.json(
      { error: "Erreur DB lors de l'acquisition du bail", detail: leaseErr.message },
      { status: 503 }
    );
  }

  if (!leaseRows || leaseRows.length === 0) {
    // Event introuvable, déjà traité, ou bail actif non expiré
    const { data: existing } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("id, status, attempt_count, processing_since")
      .eq("id", event_id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Event introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      skipped: true,
      reason:  `Event en statut '${existing.status}' — non repris (bail actif ou déjà traité)`,
      current_status: existing.status,
      attempt_count:  existing.attempt_count,
    }, { status: 409 });
  }

  const lease = leaseRows[0] as {
    id:              string;
    event_type:      string;
    attempt_count:   number;
    previous_status: string;
    previous_error:  string | null;
  };

  log.info(`Bail acquis pour ${event_id} (tentative #${lease.attempt_count}, type=${lease.event_type})`);

  // ── Récupération de l'event depuis Stripe ────────────────────────
  const stripe = getStripe();
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = await stripe.events.retrieve(event_id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("stripe.events.retrieve error", msg);

    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status:    "failed",
        failed_at: new Date().toISOString(),
        error:     `stripe.events.retrieve: ${msg}`.slice(0, 500),
      })
      .eq("id", event_id);

    return NextResponse.json(
      { error: "Impossible de récupérer l'event depuis Stripe", detail: msg },
      { status: 502 }
    );
  }

  // ── Dispatch ─────────────────────────────────────────────────────
  try {
    await dispatchStripeEvent(stripeEvent);

    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status:       "processed",
        processed_at: new Date().toISOString(),
        failed_at:    null,
        error:        null,
      })
      .eq("id", event_id);

    log.info(`Event ${event_id} retraité avec succès (tentative #${lease.attempt_count})`);

    // ── 8. Journaliser le succès ──────────────────────────────────
    await logAdminAction({
      admin,
      action:     "WEBHOOK_STRIPE_RETRY_SUCCESS",
      resource:   "stripe_webhook_events",
      resourceId: event_id,
      ip, userAgent,
      details:    { event_type: lease.event_type, attempt_count: lease.attempt_count },
      severity:   "info",
    });

    return NextResponse.json({
      ok:            true,
      event_id,
      event_type:    lease.event_type,
      attempt_count: lease.attempt_count,
      status:        "processed",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Erreur dispatch retry ${event_id}`, msg);

    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status:    "failed",
        failed_at: new Date().toISOString(),
        error:     msg.slice(0, 500),
      })
      .eq("id", event_id);

    // ── 8. Journaliser l'échec ────────────────────────────────────
    await logAdminAction({
      admin,
      action:     "WEBHOOK_STRIPE_RETRY_FAILED",
      resource:   "stripe_webhook_events",
      resourceId: event_id,
      ip, userAgent,
      details:    { event_type: lease.event_type, attempt_count: lease.attempt_count, error: msg.slice(0, 200) },
      severity:   "warning",
    });

    return NextResponse.json(
      {
        error:         "Erreur lors du retraitement",
        event_id,
        event_type:    lease.event_type,
        attempt_count: lease.attempt_count,
        detail:        msg,
      },
      { status: 500 }
    );
  }
}
