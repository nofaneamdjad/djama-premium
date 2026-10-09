"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { CheckCircle2, PenLine, Eraser, AlertCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";

const GOLD = "#c9a55a";

interface SignerInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DocumentInfo {
  title: string;
  message: string;
  expires_at: string | null;
}

type PageStatus =
  | "loading"
  | "pending"
  | "already_signed"
  | "refused"
  | "completed"
  | "error";

export default function SigningForm({ token }: { token: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [signer, setSigner] = useState<SignerInfo | null>(null);
  const [document, setDocument] = useState<DocumentInfo | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [action, setAction] = useState<"sign" | "refuse">("sign");
  const [refuseReason, setRefuseReason] = useState("");
  const [done, setDone] = useState<"signed" | "refused" | null>(null);

  useEffect(() => {
    fetch(`/api/signature/sign/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "pending") {
          setSigner(data.signer);
          setDocument(data.document);
          setPageStatus("pending");
        } else if (data.status === "already_signed") {
          setPageStatus("already_signed");
        } else if (data.status === "refused") {
          setPageStatus("refused");
        } else if (data.status === "completed") {
          setPageStatus("completed");
        } else if (data.error) {
          setErrorMsg(data.error);
          setPageStatus("error");
        } else {
          setPageStatus("error");
          setErrorMsg("Lien de signature invalide ou expiré.");
        }
      })
      .catch(() => {
        setPageStatus("error");
        setErrorMsg("Impossible de charger le document. Vérifiez votre connexion.");
      });
  }, [token]);

  const getPointer = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = "touches" in e ? e.touches[0] : (e as React.MouseEvent<HTMLCanvasElement>);
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPointer(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
  }, [isDrawing]);

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

  async function handleSubmit() {
    setSubmitError("");
    setLoading(true);
    try {
      let body: Record<string, unknown> = { action };
      if (action === "sign") {
        const canvas = canvasRef.current;
        if (!canvas) { setSubmitError("Erreur canvas"); return; }
        body.signature_data = canvas.toDataURL("image/png");
      } else {
        body.refused_reason = refuseReason.trim() || "Refusé sans motif";
      }

      const res = await fetch(`/api/signature/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDone(action === "sign" ? "signed" : "refused");
      } else {
        const j = await res.json();
        setSubmitError(j.error ?? "Erreur lors de la soumission");
      }
    } catch {
      setSubmitError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const canSign = action === "sign"
    ? accepted && hasDrawn && !loading
    : accepted && refuseReason.trim().length > 3 && !loading;

  // ── Header ──
  const Header = () => (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      padding: "1rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 10,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
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
        }}>DJ</div>
        <span style={{ fontWeight: 800, color: "#111827", fontSize: "0.9rem" }}>
          Signature électronique
        </span>
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.35rem 0.8rem",
        borderRadius: 999,
        background: "rgba(201,165,90,0.08)",
        border: `1px solid rgba(201,165,90,0.25)`,
        fontSize: "0.7rem",
        fontWeight: 700,
        color: GOLD,
      }}>
        <ShieldCheck size={12} />
        Sécurisé DJAMA
      </div>
    </header>
  );

  // ── Loading ──
  if (pageStatus === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={32} style={{ color: GOLD, animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Chargement du document…</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ──
  if (pageStatus === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fb", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "2.5rem",
            textAlign: "center",
            maxWidth: 440,
            border: "1px solid #fecaca",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 1rem" }} />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", marginBottom: 8 }}>
              Lien invalide ou expiré
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {errorMsg || "Ce lien de signature n'est pas valide ou a expiré."}
            </p>
            <p style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "1.25rem" }}>
              Contactez l'expéditeur pour obtenir un nouveau lien.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Already signed / refused / completed ──
  if (pageStatus === "already_signed" || pageStatus === "refused" || pageStatus === "completed") {
    const isOk = pageStatus === "already_signed" || pageStatus === "completed";
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fb", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "2.5rem",
            textAlign: "center",
            maxWidth: 440,
            border: isOk ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.25)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            {isOk
              ? <CheckCircle2 size={48} style={{ color: "#22c55e", margin: "0 auto 1rem" }} />
              : <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 1rem" }} />
            }
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", marginBottom: 8 }}>
              {pageStatus === "already_signed" && "Vous avez déjà signé"}
              {pageStatus === "refused" && "Signature refusée"}
              {pageStatus === "completed" && "Document entièrement signé"}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              {pageStatus === "already_signed" && "Votre signature a été enregistrée pour ce document."}
              {pageStatus === "refused" && "Vous avez refusé de signer ce document."}
              {pageStatus === "completed" && "Tous les signataires ont signé ce document."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Post-submit success ──
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fb", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
          {done === "signed" && Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.06} />
          ))}
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "2.5rem",
            textAlign: "center",
            maxWidth: 460,
            width: "100%",
            border: done === "signed" ? "1px solid rgba(34,197,94,0.25)" : "1px solid #e5e7eb",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            position: "relative",
            zIndex: 1,
          }}>
            {done === "signed"
              ? <CheckCircle2 size={52} style={{ color: "#22c55e", margin: "0 auto 1.25rem" }} />
              : <XCircle size={52} style={{ color: "#9ca3af", margin: "0 auto 1.25rem" }} />
            }
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: 8 }}>
              {done === "signed" ? "Document signé !" : "Refus enregistré"}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {done === "signed"
                ? "Votre signature a été enregistrée avec succès. L'expéditeur a été notifié."
                : "Votre refus a été transmis à l'expéditeur du document."}
            </p>
            <div style={{
              padding: "0.9rem 1.1rem",
              borderRadius: 12,
              background: done === "signed" ? "rgba(34,197,94,0.06)" : "#f9fafb",
              border: done === "signed" ? "1px solid rgba(34,197,94,0.2)" : "1px solid #e5e7eb",
              fontSize: "0.78rem",
              color: done === "signed" ? "#16a34a" : "#6b7280",
              fontWeight: 600,
            }}>
              {done === "signed" ? `Signé le ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}` : "Refus transmis"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main signing form ──
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "system-ui, sans-serif" }}>
      <Header />

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
        {/* Document info */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          marginBottom: "1.25rem",
        }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>
            Document à signer
          </p>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827", marginBottom: signer?.name ? "0.5rem" : 0 }}>
            {document?.title}
          </h1>
          {signer && (
            <p style={{ fontSize: "0.82rem", color: "#6b7280" }}>
              Destinataire : <strong style={{ color: "#374151" }}>{signer.name}</strong>
              {signer.role && signer.role !== "signataire" && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", color: GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {signer.role}
                </span>
              )}
            </p>
          )}
          {document?.message && (
            <p style={{
              fontSize: "0.85rem",
              color: "#4b5563",
              lineHeight: 1.65,
              marginTop: "0.75rem",
              borderLeft: `3px solid ${GOLD}`,
              paddingLeft: "0.75rem",
            }}>
              {document.message}
            </p>
          )}
          {document?.expires_at && (
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
              Expire le {new Date(document.expires_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </p>
          )}
        </div>

        {/* Action toggle */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        }}>
          <button
            onClick={() => setAction("sign")}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: 12,
              border: action === "sign" ? `2px solid ${GOLD}` : "2px solid #e5e7eb",
              background: action === "sign" ? `rgba(201,165,90,0.08)` : "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: action === "sign" ? GOLD : "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
            }}
          >
            <PenLine size={15} /> Signer
          </button>
          <button
            onClick={() => setAction("refuse")}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: 12,
              border: action === "refuse" ? "2px solid #ef4444" : "2px solid #e5e7eb",
              background: action === "refuse" ? "rgba(239,68,68,0.06)" : "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: action === "refuse" ? "#ef4444" : "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
            }}
          >
            <XCircle size={15} /> Refuser
          </button>
        </div>

        {action === "sign" ? (
          <div style={{
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${GOLD}33`,
            padding: "1.5rem",
            boxShadow: `0 4px 20px rgba(201,165,90,0.08)`,
            marginBottom: "1rem",
          }}>
            {/* Canvas signature */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
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
              <div style={{
                borderRadius: 12,
                border: `1.5px dashed ${hasDrawn ? GOLD + "66" : "#d1d5db"}`,
                overflow: "hidden",
                background: "#fafafa",
                position: "relative",
                transition: "border-color 0.2s",
              }}>
                {!hasDrawn && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    color: "#c4c8d0",
                    fontSize: "0.82rem",
                    fontStyle: "italic",
                  }}>
                    Dessinez votre signature ici
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={160}
                  style={{ width: "100%", height: 160, cursor: "crosshair", display: "block", touchAction: "none" }}
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

            {/* Legal checkbox */}
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
              cursor: "pointer",
              padding: "0.75rem",
              borderRadius: 10,
              background: accepted ? "rgba(34,197,94,0.04)" : "#f9fafb",
              border: `1px solid ${accepted ? "rgba(34,197,94,0.2)" : "#e5e7eb"}`,
              transition: "all 0.2s",
            }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                style={{ marginTop: 2, accentColor: GOLD, width: 15, height: 15, flexShrink: 0 }}
              />
              <span style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.55 }}>
                Je confirme mon identité et reconnais que ma signature électronique a valeur légale
                conformément au règlement eIDAS (UE n° 910/2014).
              </span>
            </label>
          </div>
        ) : (
          <div style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid rgba(239,68,68,0.2)",
            padding: "1.5rem",
            marginBottom: "1rem",
          }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#374151", marginBottom: "0.5rem" }}>
              Motif du refus *
            </label>
            <textarea
              value={refuseReason}
              onChange={e => setRefuseReason(e.target.value)}
              placeholder="Indiquez la raison de votre refus…"
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: 10,
                border: "1.5px solid #e5e7eb",
                fontSize: "0.9rem",
                color: "#111827",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
              cursor: "pointer",
              padding: "0.75rem",
              borderRadius: 10,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              marginTop: "0.75rem",
            }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                style={{ marginTop: 2, accentColor: "#ef4444", width: 15, height: 15, flexShrink: 0 }}
              />
              <span style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.55 }}>
                Je confirme mon refus de signer ce document.
              </span>
            </label>
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div style={{
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
          }}>
            <AlertCircle size={14} />
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSign}
          style={{
            width: "100%",
            padding: "0.9rem 1.5rem",
            borderRadius: 12,
            border: "none",
            cursor: canSign ? "pointer" : "not-allowed",
            background: canSign
              ? action === "sign"
                ? `linear-gradient(135deg, ${GOLD}, #b08d45)`
                : "linear-gradient(135deg, #ef4444, #dc2626)"
              : "#e5e7eb",
            color: canSign ? (action === "sign" ? "#0a0a0a" : "#fff") : "#9ca3af",
            fontSize: "0.9rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
            boxShadow: canSign
              ? action === "sign"
                ? "0 4px 16px rgba(201,165,90,0.3)"
                : "0 4px 16px rgba(239,68,68,0.25)"
              : "none",
          }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Traitement…</>
            : action === "sign"
              ? <><CheckCircle2 size={16} /> Signer ce document</>
              : <><XCircle size={16} /> Confirmer le refus</>
          }
        </button>

        <p style={{ textAlign: "center", fontSize: "0.7rem", color: "#9ca3af", marginTop: "1.25rem" }}>
          Ce lien est personnel et ne doit pas être partagé.
          <br />Vos données sont transmises de manière sécurisée.
        </p>
      </main>

      <footer style={{
        borderTop: "1px solid #e5e7eb",
        padding: "1rem",
        textAlign: "center",
        fontSize: "0.7rem",
        color: "#9ca3af",
      }}>
        Powered by <span style={{ color: GOLD, fontWeight: 700 }}>DJAMA</span> — Signature électronique sécurisée
      </footer>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ConfettiParticle({ delay }: { delay: number }) {
  const colors = [GOLD, "#4ade80", "#60a5fa", "#f472b6", "#a78bfa"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 8;
  return (
    <div
      style={{
        position: "fixed",
        top: "-10px",
        left: `${left}vw`,
        width: size,
        height: size,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        background: color,
        pointerEvents: "none",
        zIndex: 9999,
        animation: `fall ${2 + Math.random() * 1.5}s ${delay}s ease-in forwards`,
      }}
    />
  );
}
