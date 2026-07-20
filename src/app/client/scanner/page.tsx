"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine, Upload, Camera, FileText, Trash2,
  ArrowLeft, Download, Plus, Sparkles, Copy, CheckCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const ease = [0.22, 1, 0.36, 1] as const;

interface ScannedDoc {
  id: string;
  title: string;
  preview: string; // base64 thumbnail or data url
  text: string;
  created_at: string;
  pages: number;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

export default function ScannerPage() {
  const [docs,    setDocs]    = useState<ScannedDoc[]>([]);
  const [active,  setActive]  = useState<ScannedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<"upload" | "ocr" | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userId,  setUserId]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("notes")
        .select("id, title, content, created_at")
        .eq("user_id", user.id)
        .eq("note_type", "scan")
        .order("created_at", { ascending: false });
      const parsed: ScannedDoc[] = (data ?? []).map((n: { id: string; title: string; content: string; created_at: string }) => {
        let c: Partial<ScannedDoc> = {};
        try { c = JSON.parse(n.content ?? "{}"); } catch {}
        return { id: n.id, title: n.title ?? "Document", preview: c.preview ?? "", text: c.text ?? "", created_at: n.created_at, pages: c.pages ?? 1 };
      });
      setDocs(parsed);
      setLoading(false);
    })();
  }, []);

  function handleFile(file: File) {
    if (!file || !userId) return;
    setScanning(true);
    setScanStep("upload");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const isPdf = file.type === "application/pdf";
      let extractedText = "";

      if (!isPdf) {
        setScanStep("ocr");
        try {
          // Strip the "data:<type>;base64," prefix
          const [header, b64] = dataUrl.split(",");
          const mediaType = header.replace("data:", "").replace(";base64", "");
          const res = await fetch("/api/scanner/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: b64, media_type: mediaType }),
          });
          if (res.ok) {
            const json = await res.json() as { text?: string };
            extractedText = json.text ?? "";
          }
        } catch { /* OCR optional — continue without */ }
      }

      const doc: ScannedDoc = {
        id: uid(),
        title: file.name.replace(/\.[^.]+$/, "") || "Document scanné",
        preview: isPdf ? "" : dataUrl,
        text: extractedText,
        created_at: new Date().toISOString(),
        pages: 1,
      };
      await supabase.from("notes").insert({
        id: doc.id, user_id: userId, title: doc.title,
        content: JSON.stringify({ preview: doc.preview, text: doc.text, pages: doc.pages }),
        note_type: "scan", updated_at: new Date().toISOString(),
      });
      setDocs(prev => [doc, ...prev]);
      setActive(doc);
      setScanning(false);
      setScanStep(null);
    };
    reader.readAsDataURL(file);
  }

  async function runOcrOnActive() {
    if (!active || !active.preview || extracting) return;
    setExtracting(true);
    try {
      const [header, b64] = active.preview.split(",");
      const mediaType = header.replace("data:", "").replace(";base64", "");
      const res = await fetch("/api/scanner/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: b64, media_type: mediaType }),
      });
      if (!res.ok) return;
      const json = await res.json() as { text?: string };
      const text = json.text ?? "";
      const updated = { ...active, text };
      setActive(updated);
      setDocs(prev => prev.map(d => d.id === active.id ? updated : d));
      await supabase.from("notes")
        .update({ content: JSON.stringify({ preview: updated.preview, text, pages: updated.pages }), updated_at: new Date().toISOString() })
        .eq("id", active.id);
    } finally {
      setExtracting(false);
    }
  }

  async function copyText() {
    if (!active?.text) return;
    await navigator.clipboard.writeText(active.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deleteDoc(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (active?.id === id) setActive(null);
    await supabase.from("notes").delete().eq("id", id);
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  function downloadDoc() {
    if (!active) return;
    if (active.preview) {
      const ext = active.preview.startsWith("data:image/png") ? "png" : "jpg";
      const a = document.createElement("a");
      a.href = active.preview;
      a.download = `${active.title}.${ext}`;
      a.click();
    } else if (active.text) {
      const blob = new Blob([active.text], { type: "text/plain;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${active.title}.txt`;
      a.click(); URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#07080e]">

      {/* ── Liste documents ── */}
      <div className={`flex flex-col w-full md:w-72 md:border-r border-white/6 shrink-0 ${active ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ScanLine size={18} style={{ color: "#0ea5e9" }} />
              <h1 className="text-[16px] font-black text-white">Scanner</h1>
            </div>
          </div>

          {/* Zone de scan principale */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="w-full rounded-2xl p-5 flex flex-col items-center gap-3 transition-all"
            style={{
              background: "linear-gradient(145deg, rgba(14,165,233,0.10), rgba(3,105,161,0.06))",
              border: "1.5px dashed rgba(14,165,233,0.35)",
            }}
          >
            {scanning ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <ScanLine size={28} style={{ color: "#38bdf8" }} />
                </motion.div>
                <p className="text-[11px] font-semibold text-sky-400">
                  {scanStep === "ocr" ? "Extraction du texte…" : "Import en cours…"}
                </p>
              </>
            ) : (
              <>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(14,165,233,0.12)" }}>
                    <Camera size={18} style={{ color: "#38bdf8" }} />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(14,165,233,0.08)" }}>
                    <Upload size={18} style={{ color: "#38bdf8" }} />
                  </div>
                </div>
                <p className="text-[11.5px] font-semibold text-sky-300">Scanner / Importer</p>
                <p className="text-[9.5px] text-white/25">Photo, PDF, image</p>
              </>
            )}
          </motion.button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>

        {/* Liste scans */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1.5">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 pt-10 text-center">
              <FileText size={32} className="text-white/8" />
              <p className="text-[11px] text-white/20">Aucun document scanné</p>
            </div>
          ) : (
            docs.map(doc => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setActive(doc)}
                className="group w-full rounded-2xl p-3 text-left transition-all flex items-center gap-3"
                style={{
                  background: active?.id === doc.id ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.03)",
                  border: active?.id === doc.id ? "1px solid rgba(14,165,233,0.30)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Miniature */}
                <div className="h-11 w-9 shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  {doc.preview ? (
                    <img src={doc.preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FileText size={16} className="text-white/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-semibold text-white/75 truncate">{doc.title}</p>
                  <p className="text-[9px] text-white/25">{fmtDate(doc.created_at)} · {doc.pages} page{doc.pages > 1 ? "s" : ""}</p>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* ── Visualiseur ── */}
      <div className={`flex-1 flex flex-col ${active ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-3 opacity-50">
              <ScanLine size={44} className="text-white/15" />
              <p className="text-[12px] text-white/20">Sélectionne un document</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-[12px] font-bold"
              style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: "#38bdf8" }}
            >
              <Plus size={14} /> Nouveau scan
            </motion.button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/5">
              <button onClick={() => setActive(null)} className="flex md:hidden h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <ArrowLeft size={14} className="text-white/60" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-[14px] font-black text-white truncate">{active.title}</h2>
                <p className="text-[9.5px] text-white/30">{fmtDate(active.created_at)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={downloadDoc}
                  disabled={!active.preview && !active.text}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:text-white/70 disabled:opacity-25"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Download size={13} />
                </button>
                <button onClick={() => deleteDoc(active.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 transition hover:bg-red-500/10"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Prévisualisation */}
            <div className="flex-1 overflow-y-auto p-4">
              {active.preview ? (
                <div className="flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <img src={active.preview} alt={active.title} className="w-full h-auto" />
                    {/* Overlay scan effect */}
                    <div className="absolute inset-0 pointer-events-none rounded-2xl"
                      style={{ background: "linear-gradient(to bottom, rgba(14,165,233,0.04) 0%, transparent 30%, transparent 70%, rgba(14,165,233,0.04) 100%)" }} />
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                  <FileText size={40} className="text-white/20" />
                  <p className="text-[12px] text-white/25">Aperçu non disponible</p>
                </div>
              )}

              {/* Zone texte extrait */}
              <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/30">Texte extrait (OCR)</p>
                  <div className="flex items-center gap-1.5">
                    {active.text && (
                      <button
                        onClick={copyText}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", color: copied ? "#4ade80" : "rgba(255,255,255,0.4)" }}
                      >
                        {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
                        {copied ? "Copié" : "Copier"}
                      </button>
                    )}
                    {active.preview && !active.preview.startsWith("data:application/pdf") && (
                      <button
                        onClick={runOcrOnActive}
                        disabled={extracting}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all"
                        style={{
                          background: "rgba(14,165,233,0.10)",
                          border: "1px solid rgba(14,165,233,0.25)",
                          color: extracting ? "rgba(56,189,248,0.4)" : "#38bdf8",
                        }}
                      >
                        {extracting ? (
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-flex">
                            <ScanLine size={11} />
                          </motion.span>
                        ) : (
                          <Sparkles size={11} />
                        )}
                        {extracting ? "Extraction…" : active.text ? "Relancer" : "Extraire"}
                      </button>
                    )}
                  </div>
                </div>
                {active.text ? (
                  <p className="px-4 pb-4 text-[12px] text-white/60 leading-relaxed whitespace-pre-wrap">{active.text}</p>
                ) : (
                  <p className="px-4 pb-4 text-[11px] text-white/20 italic">
                    {active.preview ? "Clique sur « Extraire » pour lancer l'OCR." : "Aperçu PDF non disponible pour l'OCR."}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
