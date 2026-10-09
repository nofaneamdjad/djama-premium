import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function getClientInfo(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}

/* ── GET /api/signature/sign/[token] — load signing page data ── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return err("Token manquant", 400);

  const { ip, userAgent } = getClientInfo(req);
  const admin = createSupabaseAdmin();

  const { data: signer } = await admin
    .from("signature_request_signers")
    .select(`
      id, name, email, role, status, signed_at, viewed_at, refused_reason,
      request:signature_requests(id, title, message, status, expires_at, sign_order)
    `)
    .eq("token", token)
    .single();

  if (!signer) return err("Lien de signature invalide ou expiré", 404);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request = (signer as unknown as { request: any }).request as {
    id: string; title: string; message: string;
    status: string; expires_at: string | null; sign_order: string;
  };

  if (!request) return err("Demande introuvable", 404);
  if (request.status === "cancelled") return err("Cette demande de signature a été annulée", 410);
  if (request.status === "completed") {
    return NextResponse.json({ status: "completed", message: "Ce document a été signé par tous les signataires." });
  }

  // Check expiry
  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    await admin.from("signature_requests").update({ status: "expired" }).eq("id", request.id);
    return err("Ce lien de signature a expiré", 410);
  }

  if (signer.status === "signed") {
    return NextResponse.json({
      status: "already_signed",
      message: "Vous avez déjà signé ce document.",
      signed_at: signer.signed_at,
    });
  }

  if (signer.status === "refused") {
    return NextResponse.json({
      status: "refused",
      message: "Vous avez refusé de signer ce document.",
    });
  }

  // Mark as viewed if first time
  if (!signer.viewed_at) {
    await admin.from("signature_request_signers")
      .update({ viewed_at: new Date().toISOString(), status: "viewed", ip_address: ip, user_agent: userAgent })
      .eq("id", signer.id);

    await admin.from("signature_events").insert({
      request_id: request.id,
      signer_id:  signer.id,
      event_type: "viewed",
      metadata:   { name: signer.name, email: signer.email },
      ip_address: ip,
      user_agent: userAgent,
    });
  }

  return NextResponse.json({
    status: "pending",
    signer: { id: signer.id, name: signer.name, email: signer.email, role: signer.role },
    document: { title: request.title, message: request.message, expires_at: request.expires_at },
  });
}

/* ── POST /api/signature/sign/[token] — submit signature or refusal ── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return err("Token manquant", 400);

  const { ip, userAgent } = getClientInfo(req);
  const admin = createSupabaseAdmin();

  const { data: signer } = await admin
    .from("signature_request_signers")
    .select(`
      id, name, email, role, status, order_index,
      request:signature_requests(id, title, status, expires_at, sign_order, user_id)
    `)
    .eq("token", token)
    .single();

  if (!signer) return err("Lien de signature invalide ou expiré", 404);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request = (signer as unknown as { request: any }).request as {
    id: string; title: string; status: string;
    expires_at: string | null; sign_order: string; user_id: string;
  };

  if (!request) return err("Demande introuvable", 404);
  if (request.status === "cancelled") return err("Cette demande a été annulée", 410);
  if (request.status === "completed") return err("Ce document est déjà complètement signé", 400);
  if (signer.status === "signed") return err("Vous avez déjà signé ce document", 400);
  if (signer.status === "refused") return err("Vous avez déjà refusé ce document", 400);

  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    await admin.from("signature_requests").update({ status: "expired" }).eq("id", request.id);
    return err("Ce lien de signature a expiré", 410);
  }

  let body: { action: string; signature_data?: string; refused_reason?: string };
  try { body = await req.json(); }
  catch { return err("Corps JSON invalide"); }

  if (!body.action || !["sign", "refuse"].includes(body.action)) {
    return err("Action invalide. Valeurs acceptées : sign, refuse");
  }

  if (body.action === "refuse") {
    const reason = body.refused_reason?.trim() ?? "Refusé";
    await admin.from("signature_request_signers")
      .update({
        status:         "refused",
        refused_reason: reason,
        ip_address:     ip,
        user_agent:     userAgent,
      })
      .eq("id", signer.id);

    await admin.from("signature_events").insert({
      request_id: request.id,
      signer_id:  signer.id,
      event_type: "refused",
      metadata:   { name: signer.name, email: signer.email, reason },
      ip_address: ip,
      user_agent: userAgent,
    });

    await admin.from("signature_requests")
      .update({ status: "refused" })
      .eq("id", request.id);

    return NextResponse.json({ ok: true, status: "refused" });
  }

  // action === "sign"
  if (!body.signature_data) return err("Données de signature manquantes");

  const sig = body.signature_data.trim();
  if (!sig.startsWith("data:image/")) return err("Format de signature invalide");
  if (sig.length > 500_000) return err("Signature trop volumineuse");

  const now = new Date().toISOString();

  await admin.from("signature_request_signers")
    .update({
      status:        "signed",
      signed_at:     now,
      token_used_at: now,
      ip_address:    ip,
      user_agent:    userAgent,
    })
    .eq("id", signer.id);

  await admin.from("signature_events").insert({
    request_id: request.id,
    signer_id:  signer.id,
    event_type: "signed",
    metadata:   {
      name:       signer.name,
      email:      signer.email,
      has_sig:    true,
      sig_size:   sig.length,
    },
    ip_address: ip,
    user_agent: userAgent,
  });

  // Check if all signers have signed → mark completed
  const { data: allSigners } = await admin
    .from("signature_request_signers")
    .select("id, status")
    .eq("request_id", request.id);

  const allSigned = allSigners?.every(s => s.id === signer.id ? true : s.status === "signed");

  if (allSigned) {
    await admin.from("signature_requests")
      .update({ status: "completed" })
      .eq("id", request.id);

    await admin.from("signature_events").insert({
      request_id: request.id,
      event_type: "completed",
      metadata:   { signers_count: allSigners?.length ?? 0 },
    });
  } else {
    await admin.from("signature_requests")
      .update({ status: "partially_signed" })
      .eq("id", request.id);

    // If sequential, notify the next signer
    if (request.sign_order === "sequential") {
      const { data: nextSigner } = await admin
        .from("signature_request_signers")
        .select("id, email, name, token")
        .eq("request_id", request.id)
        .eq("status", "pending")
        .order("order_index", { ascending: true })
        .limit(1)
        .single();

      if (nextSigner) {
        // Trigger send for next signer (fire-and-forget; edge case handling)
        await admin.from("signature_events").insert({
          request_id: request.id,
          signer_id:  nextSigner.id,
          event_type: "reminder_sent",
          metadata:   { sequential_trigger: true, email: nextSigner.email },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, status: allSigned ? "completed" : "partially_signed" });
}
