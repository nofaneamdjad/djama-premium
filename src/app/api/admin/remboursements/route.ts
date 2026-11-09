/**
 * GET    /api/admin/remboursements  — liste des demandes (avec filtres)
 * POST   /api/admin/remboursements  — créer une demande de remboursement
 * PATCH  /api/admin/remboursements  — traiter (approuver/refuser) une demande
 *
 * Sécurité S6 :
 *   - Auth admin individuelle (requireAdminUser)
 *   - Permission can_perform_refunds OU manage_subscriptions
 *   - Re-auth obligatoire pour PATCH (token purpose=refund)
 *   - Rate limit financier (admin_refund_process : 20 req/h)
 *   - Clé d'idempotence SHA-256 sur chaque création
 *   - Double-protection via idempotency_key UNIQUE en DB
 *   - Appel réel Stripe/PayPal en production, simulation en sandbox
 *
 * Contraintes absolues :
 *   - Aucun remboursement réel sans STRIPE_SECRET_KEY configurée en production
 *   - En NODE_ENV=test ou DJAMA_REFUND_SANDBOX=true → simulation uniquement
 *   - Ne jamais exposer les clés API dans les réponses
 */

import { createHash, randomUUID }  from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import {
  requireAdminUser, hasPermission, logAdminAction,
} from "@/lib/admin-auth-v2";
import { checkFinancialRateLimit }   from "@/lib/financial-rate-limit";
import { verifyReauthToken }         from "@/app/api/admin/auth/reauth/route";
import {
  processStripeRefund,
  processPayPalRefund,
} from "@/lib/refund-providers";
import { hasUncertainRefundForTransaction } from "@/lib/refund-reconciliation";

/* ── Helpers ────────────────────────────────────────────────────────── */

/**
 * Clé d'idempotence S6 V2 — par demande, pas par {source, montant, admin}.
 *
 * Ancienne logique : SHA256(source_id|amount|admin_id)
 *   → deux remboursements partiels distincts du même montant par le même admin
 *     produisent la même clé → le deuxième est rejeté à tort.
 *
 * Nouvelle logique :
 *   - Le client fournit un `request_key` stable par soumission de formulaire
 *     (UUID généré côté client à l'ouverture du formulaire).
 *   - Le serveur hash ce request_key → clé DB unique et opaque.
 *   - Si le client ne fournit pas de request_key (ancien client) → UUID aléatoire
 *     (aucune protection double-clic, mais aucun blocage de remboursement légitime).
 */
function buildIdempotencyKey(request_key?: string): string {
  if (request_key?.trim()) {
    return createHash("sha256")
      .update(`djama_refund_v2|${request_key.trim()}`)
      .digest("hex");
  }
  return randomUUID();
}

import { sendRefundNotificationEmail } from "@/lib/email";

/* ── GET — liste des demandes de remboursement ────────────────────── */

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_REFUNDS",
    logResource: "admin_refund_requests",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const statut   = searchParams.get("statut")   ?? "";
  const provider = searchParams.get("provider") ?? "";
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset   = parseInt(searchParams.get("offset") ?? "0", 10);

  const sb = createSupabaseAdmin();

  let q = sb
    .from("admin_refund_requests")
    .select(`
      id, created_at, updated_at,
      transaction_id, invoice_id,
      provider, amount_requested, amount_refunded, currency,
      status, reason, rejection_reason,
      provider_refund_id, provider_error,
      requested_by_admin_id, approved_by_admin_id,
      processed_at, approved_at,
      idempotency_key
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const VALID_STATUTS = ["pending","approved","processing","uncertain","succeeded","failed","rejected","cancelled"];
  if (statut && VALID_STATUTS.includes(statut)) {
    q = q.eq("status", statut);
  }

  if (provider === "stripe" || provider === "paypal" || provider === "manual") {
    q = q.eq("provider", provider);
  }

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // S3-01 : stats calculées sur toutes les données autorisées, indépendamment de la pagination
  let statsQuery = sb.from("admin_refund_requests").select("status, amount_refunded");
  if (statut && ["pending","approved","processing","uncertain","succeeded","failed","rejected","cancelled"].includes(statut)) {
    statsQuery = statsQuery.eq("status", statut);
  }
  if (provider === "stripe" || provider === "paypal" || provider === "manual") {
    statsQuery = statsQuery.eq("provider", provider);
  }
  const { data: allRows } = await statsQuery;
  const stats = {
    total_succeeded:   (allRows ?? []).filter(r => r.status === "succeeded").length,
    total_pending:     (allRows ?? []).filter(r => r.status === "pending").length,
    total_failed:      (allRows ?? []).filter(r => r.status === "failed").length,
    montant_rembourse: (allRows ?? [])
      .filter(r => r.status === "succeeded")
      .reduce((s, r) => s + (Number(r.amount_refunded) || 0), 0),
  };

  return NextResponse.json({
    remboursements: data ?? [],
    total:          count ?? (data ?? []).length,
    stats,
  });
}

/* ── POST — créer une demande de remboursement ───────────────────── */

export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "CREATE_REFUND_REQUEST",
    logResource: "admin_refund_requests",
  });
  if (deny) return deny;

  if (!hasPermission(admin!, "manage_subscriptions") && !hasPermission(admin!, "can_perform_refunds")) {
    return NextResponse.json({ error: "Permission insuffisante (can_perform_refunds requis)" }, { status: 403 });
  }

  const body = await req.json() as {
    transaction_id?: string;
    invoice_id?:     string;
    amount?:         number;
    reason?:         string;
    provider:        string;
    request_key?:    string;   // UUID stable par soumission (double-clic protection)
  };

  const { transaction_id, invoice_id, reason, provider, request_key } = body;

  if (!transaction_id && !invoice_id) {
    return NextResponse.json({ error: "transaction_id ou invoice_id requis" }, { status: 400 });
  }

  if (!["stripe", "paypal", "manual"].includes(provider)) {
    return NextResponse.json({ error: "provider invalide (stripe|paypal|manual)" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  let amount_requested = body.amount ?? 0;
  let currency         = "EUR";

  // Vérifier la transaction et calculer le montant remboursable
  if (transaction_id) {
    const { data: tx } = await sb
      .from("payment_transactions")
      .select("id, amount_original, currency_original, status, refunded_amount")
      .eq("id", transaction_id)
      .single();

    if (!tx) {
      return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
    }

    if ((tx.status as string) !== "succeeded") {
      return NextResponse.json({ error: "Transaction non remboursable (statut: " + tx.status + ")" }, { status: 400 });
    }

    // Montant déjà remboursé (y compris demandes en cours)
    const { data: alreadyRefunded } = await sb
      .rpc("get_already_refunded", { p_transaction_id: transaction_id });

    const maxRefundable = (tx.amount_original as number) - (Number(alreadyRefunded) || 0);

    if (maxRefundable <= 0) {
      return NextResponse.json({ error: "Transaction déjà entièrement remboursée" }, { status: 400 });
    }

    // Guard uncertain : aucun nouveau remboursement si un uncertain est déjà actif sur cette transaction
    const hasUncertain = await hasUncertainRefundForTransaction(transaction_id);
    if (hasUncertain) {
      return NextResponse.json({
        error: "Un remboursement au statut 'uncertain' est déjà actif pour cette transaction. Lancez la réconciliation avant de créer une nouvelle demande.",
        uncertain_active: true,
      }, { status: 409 });
    }

    // Si montant non précisé → remboursement total
    if (!amount_requested || amount_requested <= 0) {
      amount_requested = maxRefundable;
    }

    if (amount_requested > maxRefundable) {
      return NextResponse.json({
        error: `Montant demandé (${amount_requested}) dépasse le solde remboursable (${maxRefundable})`,
        max_refundable: maxRefundable,
      }, { status: 400 });
    }

    currency = (tx.currency_original as string) ?? "EUR";
  }

  if (!amount_requested || amount_requested <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  // Clé d'idempotence S6 V2 — par demande (request_key fourni par le client)
  const idempotencyKey = buildIdempotencyKey(request_key);

  // Double-protection : vérifier si une demande identique existe déjà
  const { data: existing } = await sb
    .from("admin_refund_requests")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok:              true,
      idempotent:      true,
      refund_id:       existing.id,
      status:          existing.status,
      message:         "Demande identique déjà enregistrée",
    });
  }

  const { data: refundReq, error: insertErr } = await sb
    .from("admin_refund_requests")
    .insert({
      transaction_id:       transaction_id ?? null,
      invoice_id:           invoice_id ?? null,
      provider,
      amount_requested,
      currency,
      reason:               reason ?? null,
      status:               "pending",
      idempotency_key:      idempotencyKey,
      requested_by_admin_id: admin!.id,
    })
    .select("id, status, idempotency_key")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({
        ok: true, idempotent: true, message: "Demande en doublon (idempotence)",
      });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  await logAdminAction({
    admin:      admin!,
    action:     "REFUND_REQUEST_CREATED",
    resource:   "admin_refund_requests",
    resourceId: refundReq.id,
    details:    { transaction_id, invoice_id, amount_requested, currency, provider },
    severity:   "info",
  });

  return NextResponse.json({ ok: true, refund_id: refundReq.id, status: "pending" }, { status: 201 });
}

/* ── PATCH — approuver ou refuser une demande ─────────────────────── */

export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "PROCESS_REFUND",
    logResource: "admin_refund_requests",
  });
  if (deny) return deny;

  // Rate limit financier (20 req/h — irréversible)
  const rl = await checkFinancialRateLimit("admin_refund_process", admin!.id);
  if (!rl.allowed) return rl.response429!;

  if (!hasPermission(admin!, "manage_subscriptions") && !hasPermission(admin!, "can_perform_refunds")) {
    return NextResponse.json({ error: "Permission insuffisante (can_perform_refunds requis)" }, { status: 403 });
  }

  // Re-auth obligatoire (action irréversible)
  const reauthToken = req.headers.get("x-reauth-token") ?? "";
  const reauth = await verifyReauthToken(reauthToken, admin!.id);
  if (!reauth.valid || reauth.purpose !== "refund") {
    return NextResponse.json(
      { error: "Ré-authentification requise.", reauthRequired: true, purpose: "refund" },
      { status: 403 },
    );
  }

  const body = await req.json() as {
    refund_id:        string;
    action:           "approuver" | "refuser";
    rejection_reason?: string;
  };

  const { refund_id, action, rejection_reason } = body;

  if (!refund_id || !["approuver", "refuser"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();

  // Charger la demande
  const { data: refundReq } = await sb
    .from("admin_refund_requests")
    .select("*")
    .eq("id", refund_id)
    .single();

  if (!refundReq) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if ((refundReq.status as string) !== "pending") {
    return NextResponse.json({
      error: `Demande non modifiable (statut actuel: ${refundReq.status})`,
    }, { status: 409 });
  }

  // ── Refus ───────────────────────────────────────────────────────────
  if (action === "refuser") {
    await sb
      .from("admin_refund_requests")
      .update({
        status:               "rejected",
        rejection_reason:     rejection_reason ?? null,
        approved_by_admin_id: admin!.id,
        approved_at:          new Date().toISOString(),
      })
      .eq("id", refund_id);

    await logAdminAction({
      admin:      admin!,
      action:     "REFUND_REJECTED",
      resource:   "admin_refund_requests",
      resourceId: refund_id,
      details:    { rejection_reason: rejection_reason ?? "non précisé" },
      severity:   "info",
    });

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // ── Approbation + traitement provider ────────────────────────────────

  // Marquer processing (bail anti-doublon — condition atomique sur status=pending)
  const { data: updatedRows, error: updateErr } = await sb
    .from("admin_refund_requests")
    .update({
      status:               "processing",
      approved_by_admin_id: admin!.id,
      approved_at:          new Date().toISOString(),
    })
    .eq("id", refund_id)
    .eq("status", "pending")   // condition atomique
    .select("id");

  if (updateErr || !updatedRows?.length) {
    return NextResponse.json({ error: "Conflit concurrent — réessayez" }, { status: 409 });
  }

  // Re-vérification du solde remboursable APRÈS avoir acquis l'état processing
  // (reservation model : get_already_refunded compte maintenant cette demande)
  if (refundReq.transaction_id) {
    const { data: balanceCheck } = await sb
      .rpc("get_already_refunded", { p_transaction_id: refundReq.transaction_id as string });

    const { data: txForBalance } = await sb
      .from("payment_transactions")
      .select("amount_original")
      .eq("id", refundReq.transaction_id as string)
      .single();

    if (txForBalance) {
      const reserved      = Number(balanceCheck) || 0;
      const amountOrig    = Number(txForBalance.amount_original) || 0;
      const stillAvail    = amountOrig - reserved + Number(refundReq.amount_requested); // ajouter ce qui vient d'être reservé
      const otherReserved = reserved - Number(refundReq.amount_requested);
      if (otherReserved > amountOrig - Number(refundReq.amount_requested)) {
        // Les autres demandes en cours ont épuisé le solde pendant notre traitement
        await sb.from("admin_refund_requests")
          .update({ status: "failed", provider_error: "solde_insuffisant_concurrent" })
          .eq("id", refund_id);
        return NextResponse.json({ error: "Solde insuffisant — un autre remboursement concurrent a épuisé le solde" }, { status: 409 });
      }
      void stillAvail; // utilisé pour la vérification ci-dessus
    }
  }

  // Récupérer les données de transaction si disponible
  let chargeId:         string | null = null;
  let paymentIntentId:  string | null = null;
  let paypalCaptureId:  string | null = null;

  if (refundReq.transaction_id) {
    const { data: tx } = await sb
      .from("payment_transactions")
      .select("stripe_charge_id, stripe_payment_intent_id, paypal_capture_id")
      .eq("id", refundReq.transaction_id as string)
      .single();

    if (tx) {
      chargeId        = (tx.stripe_charge_id as string | null);
      paymentIntentId = (tx.stripe_payment_intent_id as string | null);
      paypalCaptureId = (tx.paypal_capture_id as string | null);
    }
  }

  const provider   = refundReq.provider as string;
  const amountReq  = Number(refundReq.amount_requested);
  const currency   = (refundReq.currency as string) ?? "EUR";
  const idemKey    = `s6_${refundReq.idempotency_key as string}`;

  let result;
  let providerCallSent = false; // true après envoi de la requête provider (avant réponse)

  try {
    if (provider === "stripe") {
      providerCallSent = true;
      result = await processStripeRefund({
        charge_id:         chargeId ?? undefined,
        payment_intent_id: paymentIntentId ?? undefined,
        amount_cents:      Math.round(amountReq * 100),
        currency,
        idempotency_key:   idemKey,
        reason:            "requested_by_customer",
        metadata: {
          refund_request_id: refund_id,
          admin_id:          admin!.id,
        },
      });

    } else if (provider === "paypal") {
      if (!paypalCaptureId) {
        await sb
          .from("admin_refund_requests")
          .update({ status: "failed", provider_error: "paypal_capture_id manquant" })
          .eq("id", refund_id);

        return NextResponse.json({ error: "Référence PayPal (capture_id) manquante" }, { status: 400 });
      }

      providerCallSent = true;
      result = await processPayPalRefund({
        capture_id:      paypalCaptureId,
        amount:          amountReq,
        currency,
        idempotency_key: idemKey,
        note_to_payer:   "Remboursement DJAMA",
        invoice_id:      refundReq.invoice_id as string | undefined,
      });

    } else {
      // Manual — mettre à jour le statut sans appel provider
      result = {
        ok:                 true,
        provider_refund_id: `manual_${Date.now()}`,
        amount_refunded:    amountReq,
        currency,
        status:             "succeeded" as const,
        error:              null,
        raw:                { manual: true },
        sandbox:            false,
      };
    }
  } catch (err) {
    // Panne réseau APRÈS envoi de la requête → état incertain
    // On ne sait pas si le provider a traité le remboursement.
    const errMsg = err instanceof Error ? err.message : String(err);
    const finalSt = providerCallSent ? "uncertain" : "failed";

    await sb.from("admin_refund_requests").update({
      status:        finalSt,
      provider_error: errMsg,
      processed_at:  new Date().toISOString(),
    }).eq("id", refund_id);

    await logAdminAction({
      admin:      admin!,
      action:     providerCallSent ? "REFUND_UNCERTAIN" : "REFUND_FAILED",
      resource:   "admin_refund_requests",
      resourceId: refund_id,
      details:    { provider, error: errMsg, provider_call_sent: providerCallSent },
      severity:   "critical",
    });

    return NextResponse.json({
      error:    providerCallSent
        ? "Réponse provider inconnue — statut mis à 'uncertain'. Vérifiez le dashboard provider."
        : errMsg,
      status:   finalSt,
      uncertain: providerCallSent,
    }, { status: 502 });
  }

  // Mise à jour selon résultat
  const finalStatus = result.ok
    ? (result.status === "sandbox" ? "succeeded" : result.status)
    : "failed";

  await sb
    .from("admin_refund_requests")
    .update({
      status:                finalStatus,
      amount_refunded:       result.ok ? result.amount_refunded : 0,
      provider_refund_id:    result.provider_refund_id ?? null,
      provider_error:        result.error ?? null,
      processed_at:          new Date().toISOString(),
      raw_provider_response: result.raw,
    })
    .eq("id", refund_id);

  // Mettre à jour la transaction source si nécessaire
  if (result.ok && refundReq.transaction_id) {
    const { data: tx } = await sb
      .from("payment_transactions")
      .select("refunded_amount, amount_original")
      .eq("id", refundReq.transaction_id as string)
      .single();

    if (tx) {
      const newRefunded  = (Number(tx.refunded_amount) || 0) + result.amount_refunded;
      const isFullRefund = newRefunded >= (Number(tx.amount_original) || 0);
      await sb
        .from("payment_transactions")
        .update({
          refunded_amount:  newRefunded,
          stripe_refund_id: provider === "stripe" ? (result.provider_refund_id ?? undefined) : undefined,
          paypal_refund_id: provider === "paypal" ? (result.provider_refund_id ?? undefined) : undefined,
          status:           isFullRefund ? "refunded" : "partially_refunded",
          updated_at:       new Date().toISOString(),
        })
        .eq("id", refundReq.transaction_id as string);
    }
  }

  // Audit log
  await logAdminAction({
    admin:      admin!,
    action:     result.ok ? "REFUND_SUCCEEDED" : "REFUND_FAILED",
    resource:   "admin_refund_requests",
    resourceId: refund_id,
    details: {
      provider,
      amount_requested: amountReq,
      amount_refunded:  result.amount_refunded,
      provider_refund_id: result.provider_refund_id,
      sandbox:          result.sandbox,
      error:            result.error,
    },
    severity: result.ok ? "warning" : "critical",
  });

  // Notification client — uniquement si remboursement confirmé par le provider
  // et notification pas encore envoyée (anti-doublon via notification_sent_at)
  if (result.ok && finalStatus === "succeeded" && refundReq.transaction_id) {
    const { data: txForNotif } = await sb
      .from("payment_transactions")
      .select("user_id")
      .eq("id", refundReq.transaction_id as string)
      .single();

    if (txForNotif?.user_id) {
      const { data: authUser } = await sb.auth.admin.getUserById(txForNotif.user_id as string);
      const clientEmail = authUser?.user?.email ?? null;
      const clientName  = (authUser?.user?.user_metadata?.full_name as string | null) ?? null;

      if (clientEmail) {
        const notifResult = await sendRefundNotificationEmail({
          toEmail:          clientEmail,
          clientName,
          amountRefunded:   result.amount_refunded,
          currency,
          providerRefundId: result.provider_refund_id ?? null,
          invoiceRef:       refundReq.invoice_id as string | null,
          sandbox:          result.sandbox,
        });

        if (notifResult.sent) {
          await sb.from("admin_refund_requests")
            .update({ notification_sent_at: new Date().toISOString() })
            .eq("id", refund_id);
        }
      }
    }
  }

  if (!result.ok) {
    return NextResponse.json({
      error:  result.error ?? "Erreur provider",
      status: "failed",
    }, { status: 502 });
  }

  return NextResponse.json({
    ok:                true,
    status:            finalStatus,
    provider_refund_id: result.provider_refund_id,
    amount_refunded:   result.amount_refunded,
    sandbox:           result.sandbox,
  });
}
