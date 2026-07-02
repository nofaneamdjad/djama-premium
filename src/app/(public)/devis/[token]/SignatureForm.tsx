"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, PenLine, Eraser, AlertCircle } from "lucide-react";

interface Props {
  doc: Record<string, unknown>;
  items: Record<string, unknown>[];
  token: string;
}

const GOLD = "#c9a55a";

const fmtEur = (n: unknown) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    Number(n) || 0
  );

const fmtDate = (d: unknown) => {
  if (!d || typeof d !== "string") return "—";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
};

// Confetti particle
function ConfettiParticle({ delay }: { delay: number }) {
  const colors = [GOLD, "#4ade80", "#60a5fa", "#f472b6", "#a78bfa", "#34d399"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 8;
  return (
    <motion.div
      initial={{ y: -20, x: left + "vw", opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: "110vh",
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
        opacity: [1, 1, 0],
        scale: [1, 1.2, 0.8],
      }}
      transition={{ duration: 2.5 + Math.random() * 1.5, delay, ease: "easeIn" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        background: color,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}

// Helper to safely get a string field from a Record<string,unknown>
function s(v: unknown): string { return v ? String(v) : ""; }
function b(v: unknown): boolean { return Boolean(v); }

export default function SignatureForm({ doc, items, token }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signedBy, setSignedBy] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);

  // Already signed
  const alreadySigned = b(doc.signed_at);

  // Totals
  const totalHt = Number(doc.total_ht) || 0;
  const totalTva = Number(doc.total_tva) || 0;
  const totalTtc = Number(doc.total_ttc) || 0;

  // Canvas pointer helpers
  const getPointer = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const src =
      "touches" in e
        ? (e as React.TouchEvent<HTMLCanvasElement>).touches[0]
        : (e as React.MouseEvent<HTMLCanvasElement>);
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setIsDrawing(true);
      lastPos.current = getPointer(e, canvas);
    },
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !canvasRef.current || !lastPos.current) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getPointer(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = pos;
      setHasDrawn(true);
    },
    [isDrawing]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  async function handleSign() {
    if (!signedBy.trim() || !accepted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signature_data = canvas.toDataURL("image/png");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/devis/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_by: signedBy.trim(), signature_data }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const j = await res.json();
        setError(j.error ?? "Erreur lors de la signature");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f9fb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Confetti */}
        {Array.from({ length: 40 }).map((_, i) => (
          <ConfettiParticle key={i} delay={i * 0.05} />
        ))}

        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "3rem 2.5rem",
            textAlign: "center",
            maxWidth: 480,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.1)",
              border: "2px solid rgba(34,197,94,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <CheckCircle2 size={36} style={{ color: "#22c55e" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", marginBottom: 8 }}>
            Devis accepté !
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Votre signature a bien été enregistrée.
            <br />
            Le prestataire a été notifié de votre accord.
          </p>
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem 1.25rem",
              borderRadius: 12,
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.2)",
              fontSize: "0.8rem",
              color: "#16a34a",
              fontWeight: 600,
            }}
          >
            Signé le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            {" "}par {signedBy}
          </div>
        </motion.div>

        <p style={{ marginTop: "2rem", fontSize: "0.72rem", color: "#9ca3af" }}>
          Powered by{" "}
          <span style={{ color: GOLD, fontWeight: 700 }}>DJAMA</span>
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "0.75rem",
              color: "#0a0a0a",
              letterSpacing: "0.05em",
            }}
          >
            DJ
          </div>
          <div>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Devis en ligne
            </p>
            <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827" }}>
              {String(doc.numero || "—")}
            </p>
          </div>
        </div>

        {/* Statut badge */}
        {alreadySigned ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.85rem",
              borderRadius: 999,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#16a34a",
            }}
          >
            <CheckCircle2 size={13} />
            Signé le {fmtDate(doc.signed_at)}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.85rem",
              borderRadius: 999,
              background: "rgba(201,165,90,0.1)",
              border: `1px solid rgba(201,165,90,0.3)`,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: GOLD,
            }}
          >
            <PenLine size={13} />
            En attente de signature
          </div>
        )}
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        {/* Infos émetteur / client */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Émetteur */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.25rem",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#9ca3af",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Prestataire
            </p>
            <p style={{ fontWeight: 800, color: "#111827", fontSize: "0.9rem" }}>
              {String(doc.emetteur_nom || "—")}
            </p>
            {b(doc.emetteur_siret) && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                SIRET : {s(doc.emetteur_siret)}
              </p>
            )}
            {b(doc.emetteur_email) && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                {s(doc.emetteur_email)}
              </p>
            )}
            {b(doc.emetteur_adresse) && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                {s(doc.emetteur_adresse)}
                {b(doc.emetteur_ville) && `, ${s(doc.emetteur_ville)}`}
              </p>
            )}
          </div>

          {/* Client */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.25rem",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#9ca3af",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Client
            </p>
            <p style={{ fontWeight: 800, color: "#111827", fontSize: "0.9rem" }}>
              {String(doc.client_nom || "—")}
            </p>
            {b(doc.client_societe) && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                {s(doc.client_societe)}
              </p>
            )}
            {b(doc.client_email) && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                {s(doc.client_email)}
              </p>
            )}
            {b(doc.client_adresse) && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                {s(doc.client_adresse)}
                {b(doc.client_ville) && `, ${s(doc.client_ville)}`}
              </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "1rem 1.25rem",
            border: "1px solid #e5e7eb",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Date d&apos;émission
            </p>
            <p style={{ fontWeight: 700, color: "#374151", fontSize: "0.85rem", marginTop: 2 }}>
              {fmtDate(doc.date_document as string)}
            </p>
          </div>
          {b(doc.date_echeance) && (
            <div>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Valable jusqu&apos;au
              </p>
              <p style={{ fontWeight: 700, color: "#374151", fontSize: "0.85rem", marginTop: 2 }}>
                {fmtDate(doc.date_echeance)}
              </p>
            </div>
          )}
          {b(doc.sujet) && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Objet
              </p>
              <p style={{ fontWeight: 700, color: "#374151", fontSize: "0.85rem", marginTop: 2 }}>
                {s(doc.sujet)}
              </p>
            </div>
          )}
        </div>

        {/* Table des prestations */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* En-tête coloré */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD}, #b08d45)` }} />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Description
                  </th>
                  <th style={{ padding: "0.75rem 0.75rem", textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                    Qté
                  </th>
                  <th style={{ padding: "0.75rem 0.75rem", textAlign: "right", fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                    PU HT
                  </th>
                  <th style={{ padding: "0.75rem 1.25rem", textAlign: "right", fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                    Total HT
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const qty = Number(item.quantity) || 0;
                  const pu = Number(item.unit_price) || 0;
                  const remise = Number(item.remise_pct) || 0;
                  const lineHt = qty * pu * (1 - remise / 100);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < items.length - 1 ? "1px solid #f9fafb" : "none",
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td style={{ padding: "0.85rem 1.25rem", color: "#374151", fontSize: "0.85rem" }}>
                        <p style={{ fontWeight: 600 }}>{String(item.description || "")}</p>
                        {Boolean(item.sub_description) && (
                          <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 2 }}>
                            {String(item.sub_description ?? "")}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 0.75rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>
                        {qty}{item.unit ? ` ${String(item.unit)}` : ""}
                      </td>
                      <td style={{ padding: "0.85rem 0.75rem", textAlign: "right", color: "#6b7280", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {fmtEur(pu)}
                      </td>
                      <td style={{ padding: "0.85rem 1.25rem", textAlign: "right", color: "#111827", fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {fmtEur(lineHt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sous-totaux */}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              padding: "1rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.35rem",
            }}
          >
            <div style={{ display: "flex", gap: "2rem", fontSize: "0.82rem", color: "#6b7280" }}>
              <span>Total HT</span>
              <span style={{ fontWeight: 600, color: "#374151", minWidth: 90, textAlign: "right" }}>{fmtEur(totalHt)}</span>
            </div>
            <div style={{ display: "flex", gap: "2rem", fontSize: "0.82rem", color: "#6b7280" }}>
              <span>TVA</span>
              <span style={{ fontWeight: 600, color: "#374151", minWidth: 90, textAlign: "right" }}>{fmtEur(totalTva)}</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: "2rem",
                fontSize: "1rem",
                fontWeight: 800,
                color: "#111827",
                marginTop: "0.25rem",
                paddingTop: "0.5rem",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <span>Total TTC</span>
              <span style={{ color: GOLD, minWidth: 90, textAlign: "right" }}>{fmtEur(totalTtc)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {b(doc.notes) && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.25rem",
              border: "1px solid #e5e7eb",
              marginBottom: "1.5rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
              Notes
            </p>
            <p style={{ fontSize: "0.85rem", color: "#4b5563", lineHeight: 1.65, whiteSpace: "pre-line" }}>
              {s(doc.notes)}
            </p>
          </div>
        )}

        {/* Zone signature */}
        {!alreadySigned && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{
              background: "#fff",
              borderRadius: 16,
              border: `1px solid ${GOLD}33`,
              padding: "1.5rem",
              boxShadow: `0 4px 20px rgba(201,165,90,0.08)`,
            }}
          >
            {/* Titre section */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${GOLD}18`,
                  border: `1px solid ${GOLD}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PenLine size={14} style={{ color: GOLD }} />
              </div>
              <div>
                <p style={{ fontWeight: 800, color: "#111827", fontSize: "0.95rem" }}>
                  Signer ce devis
                </p>
                <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                  Votre signature électronique a valeur légale
                </p>
              </div>
            </div>

            {/* Nom complet */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="signedBy"
                style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#374151", marginBottom: "0.4rem" }}
              >
                Votre prénom et nom complet *
              </label>
              <input
                id="signedBy"
                type="text"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                placeholder="ex : Jean Dupont"
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  borderRadius: 10,
                  border: `1.5px solid ${signedBy ? GOLD + "55" : "#e5e7eb"}`,
                  fontSize: "0.9rem",
                  color: "#111827",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = GOLD + "88")}
                onBlur={(e) => (e.target.style.borderColor = signedBy ? GOLD + "55" : "#e5e7eb")}
              />
            </div>

            {/* Canvas signature */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151" }}>
                  Votre signature *
                </label>
                <button
                  onClick={clearCanvas}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#6b7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem 0.5rem",
                    borderRadius: 6,
                  }}
                >
                  <Eraser size={12} /> Effacer
                </button>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  border: `1.5px dashed ${hasDrawn ? GOLD + "55" : "#d1d5db"}`,
                  overflow: "hidden",
                  background: "#fafafa",
                  position: "relative",
                  transition: "border-color 0.2s",
                }}
              >
                {!hasDrawn && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                      color: "#c4c8d0",
                      fontSize: "0.82rem",
                      fontStyle: "italic",
                    }}
                  >
                    Dessinez votre signature ici
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={150}
                  style={{ width: "100%", height: 150, cursor: "crosshair", display: "block", touchAction: "none" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              </div>
            </div>

            {/* Checkbox légale */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.65rem",
                cursor: "pointer",
                marginBottom: "1.25rem",
                padding: "0.75rem",
                borderRadius: 10,
                background: accepted ? "rgba(34,197,94,0.04)" : "#f9fafb",
                border: `1px solid ${accepted ? "rgba(34,197,94,0.2)" : "#e5e7eb"}`,
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                style={{ marginTop: 2, accentColor: GOLD, width: 15, height: 15, flexShrink: 0 }}
              />
              <span style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.5 }}>
                J&apos;accepte ce devis et reconnais que ma signature électronique a valeur légale
                conformément aux dispositions du règlement eIDAS.
              </span>
            </label>

            {/* Erreur */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: 10,
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#dc2626",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    marginBottom: "1rem",
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton signer */}
            <button
              onClick={handleSign}
              disabled={loading || !signedBy.trim() || !accepted || !hasDrawn}
              style={{
                width: "100%",
                padding: "0.85rem 1.5rem",
                borderRadius: 12,
                border: "none",
                cursor: loading || !signedBy.trim() || !accepted || !hasDrawn ? "not-allowed" : "pointer",
                background:
                  loading || !signedBy.trim() || !accepted || !hasDrawn
                    ? "#e5e7eb"
                    : `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                color:
                  loading || !signedBy.trim() || !accepted || !hasDrawn ? "#9ca3af" : "#0a0a0a",
                fontSize: "0.9rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
                boxShadow:
                  loading || !signedBy.trim() || !accepted || !hasDrawn
                    ? "none"
                    : "0 4px 16px rgba(201,165,90,0.3)",
              }}
            >
              {loading ? (
                <>
                  <svg
                    style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity={0.3} />
                    <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
                  </svg>
                  Enregistrement…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Signer et accepter ce devis
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Bandeau "Déjà signé" */}
        {alreadySigned && (
          <div
            style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 16,
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <CheckCircle2 size={24} style={{ color: "#22c55e", flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 800, color: "#16a34a", fontSize: "0.9rem" }}>
                Ce devis a été signé
              </p>
              <p style={{ fontSize: "0.78rem", color: "#4b5563", marginTop: 2 }}>
                Signé le {fmtDate(doc.signed_at)}
                {b(doc.signed_by) && ` par ${s(doc.signed_by)}`}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "1rem",
          textAlign: "center",
          fontSize: "0.72rem",
          color: "#9ca3af",
        }}
      >
        Powered by{" "}
        <span style={{ color: GOLD, fontWeight: 700 }}>DJAMA</span>
        {" "}— Signature électronique sécurisée
      </footer>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
