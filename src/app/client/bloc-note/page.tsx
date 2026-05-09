"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Square, Play, Pause, Download, Copy, Trash2,
  Sparkles, FileText, CheckSquare, ClipboardList, Loader2,
  Clock, Volume2, ChevronDown, Check, AlertCircle, Wand2,
  BookOpen, RotateCcw,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────── */
type RecordState = "idle" | "recording" | "paused" | "stopped";
type SummaryMode = "resume" | "actions" | "minutes";
interface Chunk { index: number; text: string; duration: string; }

/* ─── Utilitaires ───────────────────────────────── */
function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const CHUNK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes par chunk

/* ─── Composant principal ───────────────────────── */
export default function BlocNotePage() {
  /* ─ Enregistrement ─ */
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [elapsed, setElapsed]         = useState(0);
  const [chunks, setChunks]           = useState<Chunk[]>([]);
  const [liveChunkIdx, setLiveChunkIdx] = useState(0);

  /* ─ Transcription ─ */
  const [fullTranscript, setFullTranscript] = useState("");
  const [transcribing, setTranscribing]     = useState(false);
  const [transcribeError, setTranscribeError] = useState("");

  /* ─ Résumé ─ */
  const [summary, setSummary]           = useState("");
  const [summaryMode, setSummaryMode]   = useState<SummaryMode>("resume");
  const [summarizing, setSummarizing]   = useState(false);
  const [summaryError, setSummaryError] = useState("");

  /* ─ UI ─ */
  const [copied, setCopied]   = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "summary">("transcript");

  /* ─ Refs ─ */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef       = useRef(0);
  const chunkCountRef    = useRef(0);
  const transcriptRef    = useRef("");

  /* ─── Transcription d'un blob audio ─────────────── */
  const transcribeBlob = useCallback(async (blob: Blob, chunkIdx: number, chunkDuration: string) => {
    setTranscribing(true);
    setTranscribeError("");
    try {
      const formData = new FormData();
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
      formData.append("audio", new File([blob], `chunk-${chunkIdx}.${ext}`, { type: blob.type }));

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await res.json() as { text?: string; error?: string };

      if (!res.ok || data.error) throw new Error(data.error ?? "Erreur transcription");

      const text = data.text?.trim() ?? "";
      if (!text) return;

      const newChunk: Chunk = { index: chunkIdx, text, duration: chunkDuration };
      setChunks((prev) => {
        const updated = [...prev.filter((c) => c.index !== chunkIdx), newChunk].sort((a, b) => a.index - b.index);
        const full = updated.map((c) => c.text).join(" ");
        setFullTranscript(full);
        transcriptRef.current = full;
        return updated;
      });
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : "Erreur transcription");
    } finally {
      setTranscribing(false);
    }
  }, []);

  /* ─── Finaliser le chunk en cours ───────────────── */
  const flushCurrentChunk = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    const currentBlobs = [...audioChunksRef.current];
    audioChunksRef.current = [];
    const idx = chunkCountRef.current;
    chunkCountRef.current += 1;
    setLiveChunkIdx(chunkCountRef.current);

    if (currentBlobs.length === 0) return;

    const blob = new Blob(currentBlobs, { type: currentBlobs[0].type });
    const duration = fmtSeconds(Math.round(elapsedRef.current));
    transcribeBlob(blob, idx, duration);
  }, [transcribeBlob]);

  /* ─── Démarrer l'enregistrement ─────────────────── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"]
        .find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      chunkCountRef.current = 0;
      elapsedRef.current = 0;
      transcriptRef.current = "";
      setChunks([]);
      setFullTranscript("");
      setSummary("");
      setTranscribeError("");
      setSummaryError("");

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.start(1000); // collecte toutes les secondes
      setRecordState("recording");
      setElapsed(0);

      // Timer d'affichage
      timerRef.current = setInterval(() => {
        setElapsed((p) => { elapsedRef.current = p + 1; return p + 1; });
      }, 1000);

      // Auto-transcription toutes les 5 minutes
      chunkTimerRef.current = setInterval(() => {
        flushCurrentChunk();
      }, CHUNK_INTERVAL_MS);

    } catch {
      setTranscribeError("Accès au micro refusé. Vérifiez les permissions du navigateur.");
    }
  }, [flushCurrentChunk]);

  /* ─── Pause ──────────────────────────────────────── */
  const pauseRecording = useCallback(() => {
    mediaRecorderRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordState("paused");
  }, []);

  /* ─── Reprendre ──────────────────────────────────── */
  const resumeRecording = useCallback(() => {
    mediaRecorderRef.current?.resume();
    timerRef.current = setInterval(() => {
      setElapsed((p) => { elapsedRef.current = p + 1; return p + 1; });
    }, 1000);
    setRecordState("recording");
  }, []);

  /* ─── Arrêter ────────────────────────────────────── */
  const stopRecording = useCallback(() => {
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const mr = mediaRecorderRef.current;
    if (!mr) return;

    mr.onstop = () => {
      // Transcrit le dernier chunk
      const remaining = [...audioChunksRef.current];
      audioChunksRef.current = [];
      if (remaining.length > 0) {
        const blob = new Blob(remaining, { type: remaining[0].type });
        const duration = fmtSeconds(Math.round(elapsedRef.current));
        const idx = chunkCountRef.current;
        transcribeBlob(blob, idx, duration);
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };

    mr.stop();
    setRecordState("stopped");
  }, [transcribeBlob]);

  /* ─── Résumer ────────────────────────────────────── */
  const summarize = useCallback(async () => {
    const transcript = transcriptRef.current || fullTranscript;
    if (!transcript.trim()) return;
    setSummarizing(true);
    setSummaryError("");
    setSummary("");
    setActiveTab("summary");
    try {
      const res = await fetch("/api/summarize-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, mode: summaryMode }),
      });
      const data = await res.json() as { summary?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Erreur résumé");
      setSummary(data.summary ?? "");
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Erreur résumé");
    } finally {
      setSummarizing(false);
    }
  }, [fullTranscript, summaryMode]);

  /* ─── Copier ─────────────────────────────────────── */
  const copyText = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  /* ─── Exporter TXT ───────────────────────────────── */
  const exportTxt = useCallback((text: string, name: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }, []);

  /* ─── Reset ──────────────────────────────────────── */
  const reset = useCallback(() => {
    setRecordState("idle");
    setElapsed(0);
    setChunks([]);
    setFullTranscript("");
    setSummary("");
    setTranscribeError("");
    setSummaryError("");
    setActiveTab("transcript");
    transcriptRef.current = "";
    chunkCountRef.current = 0;
    elapsedRef.current = 0;
  }, []);

  /* ─── Cleanup ────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const hasTranscript = fullTranscript.trim().length > 0;
  const isRecording   = recordState === "recording";
  const isPaused      = recordState === "paused";
  const isStopped     = recordState === "stopped";
  const isIdle        = recordState === "idle";

  const MODE_LABELS: Record<SummaryMode, { label: string; icon: React.ElementType; desc: string }> = {
    resume:  { label: "Résumé complet",     icon: BookOpen,      desc: "Résumé + décisions + actions + questions ouvertes" },
    actions: { label: "Plan d'actions",     icon: CheckSquare,   desc: "Uniquement les actions concrètes à réaliser" },
    minutes: { label: "Compte-rendu officiel", icon: ClipboardList, desc: "Format compte-rendu formel" },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">

      {/* ─── Header ─────────────────────────────────── */}
      <div>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.08)] px-3 py-1 text-xs font-bold text-[#a78bfa]">
          <Mic size={11} /> Bloc Note Vocal
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-[var(--ink)]">Enregistrement & Transcription</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Enregistrez vos réunions (même 2h+), obtenez la transcription automatique et un résumé IA en 1 clic.
        </p>
      </div>

      {/* ─── Zone d'enregistrement ───────────────────── */}
      <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">

        {/* Visualiseur / timer */}
        <div className="mb-6 flex flex-col items-center gap-4">
          {/* Orbe animé */}
          <div className="relative flex h-28 w-28 items-center justify-center">
            <AnimatePresence>
              {isRecording && (
                <>
                  <motion.div key="ring1" className="absolute inset-0 rounded-full border-2 border-[#a78bfa]/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                  <motion.div key="ring2" className="absolute inset-0 rounded-full border-2 border-[#a78bfa]/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
                </>
              )}
            </AnimatePresence>
            <div className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 ${
              isRecording ? "bg-gradient-to-br from-[#a78bfa] to-[#7c6fcd] shadow-[0_0_40px_rgba(167,139,250,0.4)]"
              : isPaused ? "bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] shadow-[0_0_30px_rgba(251,191,36,0.3)]"
              : isStopped ? "bg-gradient-to-br from-[#34d399] to-[#10b981] shadow-[0_0_30px_rgba(52,211,153,0.3)]"
              : "bg-[var(--border)] "
            }`}>
              {isRecording ? <Volume2 size={32} className="text-white animate-pulse" />
                : isPaused ? <Pause size={32} className="text-white" />
                : isStopped ? <CheckSquare size={32} className="text-white" />
                : <Mic size={32} className="text-[var(--muted)]" />}
            </div>
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className={`text-4xl font-extrabold tabular-nums tracking-tight ${
              isRecording ? "text-[#a78bfa]" : isPaused ? "text-[#fbbf24]" : "text-[var(--ink)]"
            }`}>{fmtSeconds(elapsed)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {isRecording ? "Enregistrement en cours" : isPaused ? "En pause" : isStopped ? "Terminé" : "Prêt à enregistrer"}
            </p>
            {(isRecording || isPaused) && chunks.length > 0 && (
              <p className="mt-1 text-[0.65rem] text-[#a78bfa]">
                {chunks.length} segment{chunks.length > 1 ? "s" : ""} transcrit{chunks.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isIdle && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={startRecording}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(167,139,250,0.35)] transition hover:shadow-[0_6px_28px_rgba(167,139,250,0.5)]">
              <Mic size={16} /> Démarrer l&apos;enregistrement
            </motion.button>
          )}

          {isRecording && (
            <>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={pauseRecording}
                className="flex items-center gap-2 rounded-2xl border border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.08)] px-6 py-3 text-sm font-bold text-[#fbbf24] transition hover:bg-[rgba(251,191,36,0.15)]">
                <Pause size={15} /> Pause
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-2xl bg-[#ef4444] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)]">
                <Square size={15} /> Terminer
              </motion.button>
            </>
          )}

          {isPaused && (
            <>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={resumeRecording}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] px-6 py-3 text-sm font-bold text-white">
                <Play size={15} /> Reprendre
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-2xl bg-[#ef4444] px-6 py-3 text-sm font-bold text-white">
                <Square size={15} /> Terminer
              </motion.button>
            </>
          )}

          {isStopped && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={reset}
              className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-bold text-[var(--muted)] transition hover:border-[rgba(var(--gold),0.4)]">
              <RotateCcw size={15} /> Nouvel enregistrement
            </motion.button>
          )}
        </div>

        {/* Transcription en cours */}
        {transcribing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 flex items-center justify-center gap-2 text-xs text-[#a78bfa]">
            <Loader2 size={13} className="animate-spin" />
            Transcription du segment {liveChunkIdx + 1} en cours…
          </motion.div>
        )}

        {/* Erreur */}
        {transcribeError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-4 py-2.5 text-xs text-[#ef4444]">
            <AlertCircle size={13} /> {transcribeError}
          </motion.div>
        )}

        {/* Info chunking */}
        {(isRecording || isPaused) && (
          <p className="mt-4 text-center text-[0.6rem] text-[var(--muted)]">
            Transcription automatique toutes les 5 min · Jusqu&apos;à 2h de réunion supportées
          </p>
        )}
      </div>

      {/* ─── Résumé IA ───────────────────────────────── */}
      {(hasTranscript || isStopped) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">

          <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-[var(--ink)]">
            <Wand2 size={18} className="text-[#a78bfa]" />
            Résumé IA
          </h2>

          {/* Mode selector */}
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(Object.entries(MODE_LABELS) as [SummaryMode, typeof MODE_LABELS[SummaryMode]][]).map(([key, { label, icon: Icon, desc }]) => (
              <button key={key} type="button" onClick={() => setSummaryMode(key)}
                className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                  summaryMode === key
                    ? "border-[rgba(167,139,250,0.5)] bg-[rgba(167,139,250,0.08)] text-[#a78bfa]"
                    : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[rgba(167,139,250,0.3)]"
                }`}>
                <Icon size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">{label}</p>
                  <p className="mt-0.5 text-[0.6rem] leading-tight opacity-70">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          <motion.button whileHover={{ scale: hasTranscript ? 1.02 : 1 }} whileTap={{ scale: hasTranscript ? 0.98 : 1 }}
            onClick={summarize}
            disabled={!hasTranscript || summarizing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c6fcd] py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(167,139,250,0.25)] transition hover:shadow-[0_6px_28px_rgba(167,139,250,0.4)] disabled:cursor-not-allowed disabled:opacity-50">
            {summarizing ? <><Loader2 size={15} className="animate-spin" /> Génération du résumé…</> : <><Sparkles size={15} /> Générer le résumé IA</>}
          </motion.button>

          {summaryError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-4 py-2.5 text-xs text-[#ef4444]">
              <AlertCircle size={13} /> {summaryError}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ─── Onglets Transcription / Résumé ─────────── */}
      {(hasTranscript || summary) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {([
              { key: "transcript", label: "Transcription", icon: FileText },
              { key: "summary",    label: "Résumé IA",     icon: Sparkles },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold transition-all border-b-2 ${
                  activeTab === key
                    ? "border-[#a78bfa] text-[#a78bfa] bg-[rgba(167,139,250,0.04)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}>
                <Icon size={14} />
                {label}
                {key === "transcript" && hasTranscript && (
                  <span className="rounded-full bg-[rgba(167,139,250,0.15)] px-1.5 py-0.5 text-[0.55rem] font-bold text-[#a78bfa]">
                    {fullTranscript.split(" ").length} mots
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "transcript" && hasTranscript && (
                <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Actions */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => copyText(fullTranscript)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition hover:border-[rgba(var(--gold),0.4)] hover:text-[rgb(var(--gold))]">
                      {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
                    </button>
                    <button type="button" onClick={() => exportTxt(fullTranscript, `transcription-${Date.now()}.txt`)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition hover:border-[rgba(var(--gold),0.4)] hover:text-[rgb(var(--gold))]">
                      <Download size={12} /> Exporter .txt
                    </button>
                    {chunks.length > 1 && (
                      <span className="flex items-center gap-1.5 rounded-xl bg-[rgba(167,139,250,0.08)] px-3 py-1.5 text-xs font-bold text-[#a78bfa]">
                        <Clock size={12} /> {chunks.length} segments · {fmtSeconds(elapsed)} total
                      </span>
                    )}
                  </div>

                  {/* Segments */}
                  {chunks.length > 1 ? (
                    <div className="space-y-3">
                      {chunks.map((chunk) => (
                        <div key={chunk.index} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-[rgba(167,139,250,0.1)] px-2 py-0.5 text-[0.6rem] font-bold text-[#a78bfa]">
                              Segment {chunk.index + 1}
                            </span>
                            <span className="text-[0.6rem] text-[var(--muted)]">@ {chunk.duration}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-[var(--ink)]">{chunk.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[var(--bg)] p-5">
                      <p className="text-sm leading-relaxed text-[var(--ink)] whitespace-pre-wrap">{fullTranscript}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "summary" && (
                <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {summarizing && (
                    <div className="flex flex-col items-center gap-3 py-12 text-[var(--muted)]">
                      <Loader2 size={24} className="animate-spin text-[#a78bfa]" />
                      <p className="text-sm">Analyse de la réunion en cours…</p>
                    </div>
                  )}
                  {!summarizing && summary && (
                    <>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => copyText(summary)}
                          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition hover:border-[rgba(var(--gold),0.4)] hover:text-[rgb(var(--gold))]">
                          {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
                        </button>
                        <button type="button" onClick={() => exportTxt(summary, `resume-reunion-${Date.now()}.txt`)}
                          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition hover:border-[rgba(var(--gold),0.4)] hover:text-[rgb(var(--gold))]">
                          <Download size={12} /> Exporter .txt
                        </button>
                        <button type="button" onClick={summarize}
                          className="flex items-center gap-1.5 rounded-xl border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.06)] px-3 py-1.5 text-xs font-bold text-[#a78bfa] transition hover:bg-[rgba(167,139,250,0.12)]">
                          <RotateCcw size={12} /> Régénérer
                        </button>
                      </div>
                      <div className="rounded-2xl bg-[var(--bg)] p-5">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--ink)]">{summary}</pre>
                      </div>
                    </>
                  )}
                  {!summarizing && !summary && (
                    <div className="flex flex-col items-center gap-3 py-12 text-[var(--muted)]">
                      <Sparkles size={24} className="opacity-30" />
                      <p className="text-sm">Cliquez sur &quot;Générer le résumé IA&quot; pour analyser votre réunion</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ─── Aide ────────────────────────────────────── */}
      {isIdle && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Mic,         color: "#a78bfa", title: "Enregistrement illimité", desc: "Jusqu'à 2h+ de réunion. Transcription automatique toutes les 5 minutes." },
            { icon: FileText,    color: "#34d399", title: "Transcription précise",   desc: "Whisper d'OpenAI — reconnu comme le meilleur modèle de transcription au monde." },
            { icon: Sparkles,    color: "#f59e0b", title: "Résumé IA sur demande",   desc: "Claude analyse la réunion et produit : résumé, actions, ou compte-rendu officiel." },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: color + "18" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="mb-1 text-sm font-bold text-[var(--ink)]">{title}</p>
              <p className="text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
