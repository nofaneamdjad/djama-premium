import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── GET /api/signature/requests/[id]/proof ── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: request } = await admin
    .from("signature_requests")
    .select(`
      *,
      signers:signature_request_signers(
        id, name, email, role, status, order_index,
        signed_at, viewed_at, token_used_at, ip_address, user_agent, refused_reason
      ),
      events:signature_events(
        id, event_type, metadata, ip_address, user_agent, created_at, signer_id
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!request) return err("Demande introuvable", 404);

  // Get profile for sender name
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  const senderName = profile?.full_name ?? profile?.email ?? user.email ?? "—";

  // Build PDF
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.on("data", chunk => chunks.push(chunk));

  const GOLD_RGB: [number, number, number] = [201, 165, 90];
  const DARK_RGB: [number, number, number] = [17, 24, 39];
  const GRAY_RGB: [number, number, number] = [107, 114, 128];
  const LIGHT_RGB: [number, number, number] = [249, 250, 251];

  const pageW = doc.page.width - 100;

  // ── Header bar ──
  doc.rect(0, 0, doc.page.width, 70).fill(`rgb(${DARK_RGB.join(",")})`);
  doc.fillColor(`rgb(${GOLD_RGB.join(",")})`)
     .fontSize(18).font("Helvetica-Bold")
     .text("DJAMA", 50, 24);
  doc.fillColor("white").fontSize(10).font("Helvetica")
     .text("Dossier de preuve — Signature électronique", 50, 46);

  // ── Title ──
  doc.moveDown(3.5);
  doc.fillColor(`rgb(${DARK_RGB.join(",")})`)
     .fontSize(16).font("Helvetica-Bold")
     .text(request.title, 50, doc.y, { width: pageW });

  // ── Status badge ──
  const statusLabels: Record<string, string> = {
    completed: "Signé", sent: "Envoyé", draft: "Brouillon",
    partially_signed: "Partiellement signé", refused: "Refusé",
    expired: "Expiré", cancelled: "Annulé",
  };
  const statusLabel = statusLabels[request.status] ?? request.status;
  doc.moveDown(0.5);
  doc.fillColor(`rgb(${GRAY_RGB.join(",")})`)
     .fontSize(10).font("Helvetica")
     .text(`Statut : ${statusLabel}`, { continued: true })
     .text(`  |  Créé le : ${fmtDate(request.created_at)}`, { continued: true })
     .text(`  |  Ordre : ${request.sign_order === "sequential" ? "Séquentiel" : "Simultané"}`);

  if (request.expires_at) {
    doc.text(`Date d'expiration : ${fmtDate(request.expires_at)}`);
  }

  // ── Section separator ──
  function sectionTitle(title: string) {
    doc.moveDown(1);
    doc.rect(50, doc.y, pageW, 24).fill(`rgb(${LIGHT_RGB.join(",")})`);
    doc.fillColor(`rgb(${GOLD_RGB.join(",")})`)
       .fontSize(10).font("Helvetica-Bold")
       .text(title, 58, doc.y - 17);
    doc.moveDown(0.8);
  }

  // ── Expéditeur ──
  sectionTitle("EXPÉDITEUR");
  doc.fillColor(`rgb(${DARK_RGB.join(",")})`)
     .fontSize(10).font("Helvetica-Bold")
     .text(senderName);
  doc.fillColor(`rgb(${GRAY_RGB.join(",")})`)
     .fontSize(9).font("Helvetica")
     .text(user.email ?? "—");

  // ── Message ──
  if (request.message) {
    sectionTitle("MESSAGE");
    doc.fillColor(`rgb(${DARK_RGB.join(",")})`)
       .fontSize(9).font("Helvetica")
       .text(request.message, { width: pageW });
  }

  // ── Signataires ──
  type Signer = {
    name: string; email: string; role: string; status: string;
    signed_at: string | null; viewed_at: string | null;
    ip_address: string | null; user_agent: string | null;
    refused_reason: string | null;
  };

  const signers: Signer[] = (request.signers ?? []).sort(
    (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index,
  );

  sectionTitle(`SIGNATAIRES (${signers.length})`);

  for (const [i, sg] of signers.entries()) {
    if (i > 0) doc.moveDown(0.5);

    const signerStatusLabels: Record<string, string> = {
      pending: "En attente", sent: "Email envoyé", viewed: "Consulté",
      signed: "Signé", refused: "Refusé",
    };
    const sgStatus = signerStatusLabels[sg.status] ?? sg.status;

    doc.fillColor(`rgb(${DARK_RGB.join(",")})`)
       .fontSize(10).font("Helvetica-Bold")
       .text(`${i + 1}. ${sg.name}`, { continued: true })
       .fillColor(`rgb(${GRAY_RGB.join(",")})`)
       .font("Helvetica")
       .text(`  (${sg.role})  —  ${sgStatus}`);

    doc.fillColor(`rgb(${GRAY_RGB.join(",")})`)
       .fontSize(9)
       .text(`Email : ${sg.email}`);

    if (sg.viewed_at) doc.text(`Consulté le : ${fmtDate(sg.viewed_at)}`);
    if (sg.signed_at) {
      doc.fillColor("#059669").text(`Signé le : ${fmtDate(sg.signed_at)}`);
      if (sg.ip_address) doc.fillColor(`rgb(${GRAY_RGB.join(",")})`)
        .text(`IP : ${sg.ip_address}`);
    }
    if (sg.refused_reason) {
      doc.fillColor("#dc2626").text(`Motif de refus : ${sg.refused_reason}`);
    }
  }

  // ── Journal d'événements ──
  type Event = { event_type: string; metadata: Record<string, unknown>; ip_address: string | null; created_at: string; };
  const events: Event[] = (request.events ?? []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  sectionTitle(`JOURNAL D'ÉVÉNEMENTS (${events.length})`);

  const evtLabels: Record<string, string> = {
    created: "Demande créée", sent: "Invitation envoyée", viewed: "Document consulté",
    signed: "Document signé", refused: "Signature refusée", cancelled: "Demande annulée",
    completed: "Tous signataires ont signé", expired: "Demande expirée",
    reminder_sent: "Rappel envoyé", error: "Erreur d'envoi",
  };

  for (const evt of events) {
    const label = evtLabels[evt.event_type] ?? evt.event_type;
    const line = `${fmtDate(evt.created_at)}  —  ${label}`;
    doc.fillColor(`rgb(${DARK_RGB.join(",")})`)
       .fontSize(9).font("Helvetica")
       .text(line, { width: pageW });
    if (evt.ip_address) {
      doc.fillColor(`rgb(${GRAY_RGB.join(",")})`)
         .fontSize(8)
         .text(`   IP : ${evt.ip_address}`);
    }
  }

  // ── Hash de référence ──
  sectionTitle("RÉFÉRENCE DOSSIER");
  doc.fillColor(`rgb(${GRAY_RGB.join(",")})`)
     .fontSize(9).font("Courier")
     .text(`ID demande : ${request.id}`)
     .text(`Généré le  : ${fmtDate(new Date().toISOString())}`)
     .text(`Expéditeur : ${user.id}`);

  // ── Footer ──
  doc.moveDown(2);
  doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(`rgb(${DARK_RGB.join(",")})`);
  doc.fillColor(`rgb(${GOLD_RGB.join(",")})`)
     .fontSize(8).font("Helvetica-Bold")
     .text("DJAMA", 50, doc.page.height - 26, { continued: true })
     .fillColor("white").font("Helvetica")
     .text("  —  Signature électronique sécurisée  —  djama.space");

  doc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const filename = `preuve-signature-${id.slice(0, 8)}.pdf`;
  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
