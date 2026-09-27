"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Pen, Edit2, Shield, FileSignature } from "lucide-react";
import type { Signer } from "./types";
import { gold } from "./constants";
import { inp } from "./ui";

export function SignModal({
  signer, contractTitle, onClose, onSign,
}: {
  signer: Signer; contractTitle: string; onClose: () => void; onSign: (sigData: string, cert: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [typedName, setTypedName] = useState("");
  const [mode, setMode] = useState<"draw" | "type">("draw");

  const startDraw = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (x: number, y: number) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#c9a55a";
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stopDraw = () => { isDrawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const confirm = () => {
    let sigData = "";
    if (mode === "draw") {
      sigData = canvasRef.current?.toDataURL() ?? "";
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 400; canvas.height = 120;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0a0f1e";
      ctx.fillRect(0, 0, 400, 120);
      ctx.font = "italic 42px Georgia, serif";
      ctx.fillStyle = "#c9a55a";
      ctx.textAlign = "center";
      ctx.fillText(typedName || signer.signer_name, 200, 70);
      sigData = canvas.toDataURL();
    }
    const now = new Date();
    const cert = `Certifié signé électroniquement le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")} par ${signer.signer_name} — Réf: ${signer.id.substring(0, 8).toUpperCase()}`;
    onSign(sigData, cert);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        className="w-full max-w-lg bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white/90">Signer électroniquement</h3>
            <p className="text-[11px] text-white/35 mt-0.5">{contractTitle} — {signer.signer_name}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {(["draw", "type"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${mode === m ? "border-transparent" : "border-white/10 text-white/40 hover:border-white/20"}`}
                style={mode === m ? { background: gold + "20", color: gold, border: `1px solid ${gold}40` } : {}}>
                {m === "draw" ? <><Pen size={12}/>Dessiner</> : <><Edit2 size={12}/>Taper mon nom</>}
              </button>
            ))}
          </div>
          {mode === "draw" ? (
            <div className="relative">
              <canvas ref={canvasRef} width={460} height={140}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl cursor-crosshair"
                style={{ touchAction: "none" }}
                onMouseDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); startDraw(e.clientX - r.left, e.clientY - r.top); }}
                onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); draw(e.clientX - r.left, e.clientY - r.top); }}
                onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; const r = e.currentTarget.getBoundingClientRect(); startDraw(t.clientX - r.left, t.clientY - r.top); }}
                onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; const r = e.currentTarget.getBoundingClientRect(); draw(t.clientX - r.left, t.clientY - r.top); }}
                onTouchEnd={stopDraw}
              />
              <p className="text-center text-[10px] text-white/25 mt-2">Signez dans la zone ci-dessus</p>
              <button onClick={clear} className="absolute top-2 right-2 text-[10px] text-white/30 hover:text-white/60 border border-white/10 rounded-lg px-2 py-1 transition-colors">Effacer</button>
            </div>
          ) : (
            <div>
              <input value={typedName} onChange={(e) => setTypedName(e.target.value)}
                placeholder={signer.signer_name}
                className={inp("font-serif italic text-base text-amber-300 placeholder:italic")}
                style={{ fontFamily: "Georgia, serif", color: gold }}/>
              <p className="text-[10px] text-white/25 mt-1.5 text-center">Votre nom en cursive fait office de signature électronique</p>
            </div>
          )}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[10px] text-white/40 leading-relaxed">
              <Shield size={10} className="inline mr-1 text-white/30"/>
              En confirmant, vous apposez votre paraphe numérique sur ce document. Un certificat d&apos;horodatage local sera enregistré. Cette signature n&apos;est pas une signature électronique qualifiée au sens du règlement eIDAS — conservez une copie papier signée pour les engagements importants.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">Annuler</button>
            <button onClick={confirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{ background: gold, color: "#0a0f1e" }}>
              <FileSignature size={15}/> Signer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
