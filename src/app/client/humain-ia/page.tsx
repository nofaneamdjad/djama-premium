"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Video, Mic, Languages, Sparkles, ChevronRight,
  RotateCcw, Download, Loader2, CheckCircle2, AlertCircle,
  Clock, Film, Upload, ImageIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { ALL_ASSISTANTS, Portrait } from "@/app/client/factures/agent/gallery";
import type { Voice, StatusResponse } from "@/lib/humain-ia/types";

const GOLD  = "#FFB900";
const NOIR  = "#0a0a12";
const CARD  = "#131620";

const LANGUAGE_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
];

type Step = "select" | "configure" | "generating" | "done";

export default function HumainIAPage() {
  const { isDark } = useTheme();

  const [step,          setStep]          = useState<Step>("select");
  const [assistant,     setAssistant]     = useState<typeof ALL_ASSISTANTS[0] | null>(null);
  const [portraitUrl,   setPortraitUrl]   = useState<string | null>(null);
  const [portraitThumb, setPortraitThumb] = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [script,        setScript]        = useState("");
  const [language,      setLanguage]      = useState("fr");
  const [voices,        setVoices]        = useState<Voice[]>([]);
  const [voiceId,       setVoiceId]       = useState("");
  const [useLp,         setUseLp]         = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [jobId,         setJobId]         = useState<string | null>(null);
  const [status,        setStatus]        = useState<StatusResponse | null>(null);
  const [videoUrl,      setVideoUrl]      = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Charger les voix
  useEffect(() => {
    fetch("/api/humain-ia/voices")
      .then(r => r.json())
      .then(d => setVoices(d.voices ?? []))
      .catch(() => {});
  }, []);

  // Mettre à jour la voix par défaut quand la langue change
  useEffect(() => {
    const def = voices.find(v => v.language === language && v.gender === "F" && v.id !== "");
    if (def) setVoiceId(def.id);
  }, [language, voices]);

  // Polling statut
  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/humain-ia/status/${id}`);
        const d = await r.json() as StatusResponse;
        setStatus(d);
        if (d.status === "completed") {
          clearInterval(pollRef.current!);
          setVideoUrl(d.videoUrl ?? null);
          setStep("done");
        } else if (d.status === "failed") {
          clearInterval(pollRef.current!);
          setError(d.error ?? "Génération échouée");
          setStep("configure");
        }
      } catch {}
    }, 3000);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function handlePortraitUpload(file: File) {
    setUploading(true);
    setError(null);
    const thumb = URL.createObjectURL(file);
    setPortraitThumb(thumb);
    const form = new FormData();
    form.append("portrait", file);
    try {
      const r = await fetch("/api/humain-ia/upload-portrait", { method: "POST", body: form });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Upload échoué"); setPortraitThumb(null); return; }
      setPortraitUrl(d.url);
    } catch {
      setError("Erreur réseau lors de l'upload");
      setPortraitThumb(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    if (!assistant || !script.trim() || !portraitUrl) return;
    setSubmitting(true);
    setError(null);

    try {
      const r = await fetch("/api/humain-ia/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          portrait_url:     portraitUrl!,
          script:           script.trim(),
          voice_id:         voiceId,
          language,
          use_liveportrait: useLp,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "Erreur génération");
        return;
      }
      setJobId(d.jobId);
      setStep("generating");
      startPolling(d.jobId);
    } catch (e) {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep("select");
    setAssistant(null);
    setPortraitUrl(null);
    setPortraitThumb(null);
    setScript("");
    setJobId(null);
    setStatus(null);
    setVideoUrl(null);
    setError(null);
  }

  const bg = isDark ? NOIR : "#f5f5f8";
  const fg = isDark ? "#e8e8f0" : "#0a0a12";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, padding: "24px 16px" }}>
      {/* En-tête */}
      <div style={{ maxWidth: 900, margin: "0 auto 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${GOLD}22`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Video size={20} color={GOLD} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Humain Numérique</h1>
            <p style={{ fontSize: 13, opacity: 0.5, margin: 0 }}>
              Générez une vidéo d'avatar IA en 60 secondes
            </p>
          </div>
        </div>

        {/* Étapes */}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {(["select", "configure", "generating", "done"] as Step[]).map((s, i) => {
            const labels = ["1. Choisir", "2. Script", "3. Génération", "4. Résultat"];
            const done = ["select","configure","generating","done"].indexOf(step) > i;
            const active = step === s;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: active ? GOLD : done ? `${GOLD}33` : isDark ? "#1e2030" : "#e8e8f0",
                  color: active ? NOIR : done ? GOLD : fg,
                  opacity: active ? 1 : done ? 0.8 : 0.5,
                }}>
                  {labels[i]}
                </div>
                {i < 3 && <ChevronRight size={12} opacity={0.3} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Étape 1 : Sélection assistant ── */}
        {step === "select" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, opacity: 0.7 }}>
              Choisissez votre assistant IA
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 12,
            }}>
              {ALL_ASSISTANTS.slice(0, 12).map(a => (
                <button
                  key={a.id}
                  onClick={() => { setAssistant(a); setStep("configure"); }}
                  style={{
                    background: isDark ? CARD : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    borderRadius: 12, padding: "12px 8px",
                    cursor: "pointer", textAlign: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "none";
                  }}
                >
                  <Portrait type={a.portrait} size={72} />
                  <div style={{ marginTop: 8, fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>{a.country}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 4 }}>
                    {a.langs.slice(0, 3).map(l => (
                      <span key={l} style={{
                        fontSize: 9, padding: "1px 4px", borderRadius: 4,
                        background: `${GOLD}22`, color: GOLD,
                      }}>{l}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Étape 2 : Configuration ── */}
        {step === "configure" && assistant && (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "start" }}>
            {/* Portrait sélectionné */}
            <div style={{
              background: isDark ? CARD : "#fff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: 16, padding: 20, textAlign: "center", minWidth: 160,
            }}>
              <Portrait type={assistant.portrait} size={120} />
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15 }}>{assistant.name}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>{assistant.country}</div>
              <button
                onClick={() => setStep("select")}
                style={{
                  marginTop: 12, background: "none", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: fg,
                }}
              >
                Changer
              </button>
            </div>

            {/* Formulaire */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Upload portrait */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  <ImageIcon size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                  Photo portrait <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
                  <span style={{ opacity: 0.45, fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
                    JPG / PNG · visage centré · 5 MB max
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePortraitUpload(f); }}
                />
                {portraitThumb ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={portraitThumb}
                      alt="portrait"
                      style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover",
                        border: `2px solid ${portraitUrl ? GOLD : "#ef4444"}` }}
                    />
                    <div>
                      {uploading && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.7 }}>
                          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                          Upload en cours…
                        </div>
                      )}
                      {portraitUrl && !uploading && (
                        <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 4 }}>
                          ✓ Portrait prêt
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          fontSize: 11, padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                          background: "transparent",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                          color: fg,
                        }}
                      >Changer</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "16px 20px", borderRadius: 10, cursor: "pointer",
                      background: isDark ? "#0d0f1a" : "#f8f8fc",
                      border: `2px dashed ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                      color: fg, fontSize: 13,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"; }}
                  >
                    <Upload size={18} color={GOLD} />
                    <span>Téléverser une photo portrait…</span>
                  </button>
                )}
              </div>

              {/* Langue */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  <Languages size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                  Langue
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {LANGUAGE_OPTIONS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code)}
                      style={{
                        padding: "6px 12px", borderRadius: 8, fontSize: 12,
                        border: `1px solid ${language === l.code ? GOLD : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        background: language === l.code ? `${GOLD}22` : "transparent",
                        color: language === l.code ? GOLD : fg,
                        cursor: "pointer",
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Script */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  <Mic size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                  Script ({script.length}/2000 caractères)
                </label>
                <textarea
                  value={script}
                  onChange={e => setScript(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Bonjour, je suis votre assistant DJAMA. Comment puis-je vous aider aujourd'hui ?"
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: isDark ? "#0d0f1a" : "#f8f8fc",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    borderRadius: 10, color: fg, fontSize: 14,
                    resize: "vertical", outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Voix */}
              {voices.filter(v => v.language === language).length > 0 && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    <Mic size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                    Voix
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {voices.filter(v => v.language === language).map(v => (
                      <button
                        key={v.id}
                        onClick={() => setVoiceId(v.id)}
                        style={{
                          padding: "6px 12px", borderRadius: 8, fontSize: 12,
                          border: `1px solid ${voiceId === v.id ? GOLD : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                          background: voiceId === v.id ? `${GOLD}22` : "transparent",
                          color: voiceId === v.id ? GOLD : fg,
                          cursor: "pointer",
                        }}
                      >
                        {v.gender === "F" ? "♀ " : "♂ "}{v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Option LivePortrait */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={useLp}
                  onChange={e => setUseLp(e.target.checked)}
                  style={{ accentColor: GOLD, width: 15, height: 15 }}
                />
                <span style={{ fontSize: 13 }}>
                  Animation tête (LivePortrait) <span style={{ opacity: 0.5 }}>+7s</span>
                </span>
              </label>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 10,
                  background: "#ef444422", border: "1px solid #ef444444",
                  color: "#ef4444", fontSize: 13,
                }}>
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!script.trim() || !portraitUrl || submitting || uploading}
                style={{
                  padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: script.trim() && portraitUrl && !submitting && !uploading ? GOLD : isDark ? "#2a2a3a" : "#ddd",
                  color: script.trim() && portraitUrl && !submitting && !uploading ? NOIR : fg,
                  border: "none", cursor: script.trim() && portraitUrl && !submitting && !uploading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 8,
                  opacity: submitting || uploading ? 0.7 : 1,
                }}
              >
                {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={16} />}
                {submitting ? "Soumission..." : !portraitUrl ? "Téléversez un portrait d'abord" : "Générer la vidéo"}
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Génération ── */}
        {step === "generating" && (
          <div style={{
            background: isDark ? CARD : "#fff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            borderRadius: 20, padding: 40, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `${GOLD}22`, display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <Loader2 size={32} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Génération en cours…
            </h2>
            <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
              MuseTalk V1.5 sur RTX 4090 · ~60 secondes
            </p>

            {/* Barre de progression */}
            <div style={{
              height: 6, background: isDark ? "#1e2030" : "#e8e8f0",
              borderRadius: 3, overflow: "hidden", maxWidth: 400, margin: "0 auto 16px",
            }}>
              <div style={{
                height: "100%", background: GOLD,
                width: `${status?.progress ?? 10}%`,
                transition: "width 0.5s ease",
                borderRadius: 3,
              }} />
            </div>

            <div style={{ fontSize: 12, opacity: 0.5 }}>
              {status?.status === "in_queue"    && "En file d'attente RunPod…"}
              {status?.status === "in_progress" && "Pipeline MuseTalk en cours…"}
              {(!status || status.status === "pending") && "Soumission au serveur GPU…"}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}>
              <div style={{ fontSize: 12, opacity: 0.4 }}>
                <Clock size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                Job : {jobId?.slice(0, 8)}…
              </div>
            </div>
          </div>
        )}

        {/* ── Étape 4 : Résultat ── */}
        {step === "done" && videoUrl && (
          <div>
            <div style={{
              background: isDark ? CARD : "#fff",
              border: `1px solid ${GOLD}44`,
              borderRadius: 20, padding: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <CheckCircle2 size={20} color={GOLD} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Vidéo générée</div>
                  {status && (
                    <div style={{ fontSize: 12, opacity: 0.5 }}>
                      {status.duration_s?.toFixed(1)}s · {status.frames} frames · {status.total_s?.toFixed(0)}s pipeline
                    </div>
                  )}
                </div>
              </div>

              {/* Vidéo */}
              <video
                src={videoUrl}
                controls
                autoPlay
                style={{
                  width: "100%", maxWidth: 512,
                  borderRadius: 12,
                  display: "block", margin: "0 auto 20px",
                  background: "#000",
                }}
              />

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href={videoUrl}
                  download={`djama-${assistant?.id ?? "avatar"}.mp4`}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 10,
                    background: GOLD, color: NOIR,
                    textDecoration: "none", fontWeight: 700, fontSize: 13,
                  }}
                >
                  <Download size={15} />
                  Télécharger
                </a>
                <button
                  onClick={reset}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 10,
                    background: "transparent",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                    color: fg, cursor: "pointer", fontSize: 13,
                  }}
                >
                  <RotateCcw size={15} />
                  Nouvelle vidéo
                </button>
              </div>
            </div>

            {/* Métriques */}
            {status && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                {[
                  { icon: Clock, label: "Pipeline total", value: `${status.total_s?.toFixed(0)}s` },
                  { icon: Film, label: "Frames", value: String(status.frames ?? "—") },
                  { icon: Mic, label: "Durée audio", value: `${status.duration_s?.toFixed(2)}s` },
                ].map(m => (
                  <div key={m.label} style={{
                    background: isDark ? CARD : "#fff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    <m.icon size={14} color={GOLD} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{m.value}</div>
                    <div style={{ fontSize: 11, opacity: 0.5 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea:focus { border-color: ${GOLD} !important; }
      `}</style>
    </div>
  );
}
