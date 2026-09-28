"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScanLine, X, RefreshCw, Camera } from "lucide-react";
import { gold } from "./constants";

export function ScannerOverlay({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const stopped = useRef(false);

  const stopStream = () => {
    stopped.current = true;
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleScan = (code: string) => { stopStream(); onScan(code); };

  useEffect(() => {
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped.current) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
        setStatus("scanning");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ("BarcodeDetector" in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({ formats: ["ean_13","ean_8","code_128","code_39","qr_code","upc_a","upc_e"] });
          const loop = async () => {
            if (stopped.current) return;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const barcodes = await detector.detect(videoRef.current!);
              if (barcodes.length > 0) { handleScan(barcodes[0].rawValue); return; }
            } catch { /* ignore */ }
            animRef.current = requestAnimationFrame(loop);
          };
          animRef.current = requestAnimationFrame(loop);
        } else {
          setStatus("error");
          setErrorMsg("Scanner automatique non supporté sur ce navigateur.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Accès caméra refusé — vérifiez les permissions.");
      }
    }
    start();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ("BarcodeDetector" in window) {
        const img = await createImageBitmap(file);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) { handleScan(barcodes[0].rawValue); return; }
      }
      setErrorMsg("Aucun code-barres détecté dans l'image.");
    } catch { setErrorMsg("Erreur lors de l'analyse de l'image."); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ScanLine size={16} style={{ color: gold }}/>
            <h3 className="text-sm font-bold text-white">Scanner code-barres</h3>
          </div>
          <button onClick={() => { stopStream(); onClose(); }} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={22} className="animate-spin text-white/30"/>
          </div>
        )}

        {status === "scanning" && (
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-black border border-white/[0.08]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-3/4 h-3/4 rounded-xl" style={{ border: `2px solid ${gold}60` }}>
                <motion.div className="absolute left-3 right-3 h-0.5 rounded-full" style={{ background: gold }}
                  animate={{ top: ["8%", "88%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "linear" }}/>
                {[["top-0 left-0","border-t-2 border-l-2"],["top-0 right-0","border-t-2 border-r-2"],["bottom-0 left-0","border-b-2 border-l-2"],["bottom-0 right-0","border-b-2 border-r-2"]].map(([pos, cls]) => (
                  <div key={pos} className={`absolute h-5 w-5 ${pos} ${cls} rounded-sm`} style={{ borderColor: gold }}/>
                ))}
              </div>
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40">Pointez la caméra vers le code-barres</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-3 py-4">
            <div className="h-12 w-12 mx-auto flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
              <Camera size={20} style={{ color: gold }}/>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="mt-3 text-center">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden"/>
          <button onClick={() => fileRef.current?.click()}
            className="text-xs underline underline-offset-2 transition-colors"
            style={{ color: gold + "80" }}>
            Ou analyser une photo
          </button>
        </div>
      </div>
    </motion.div>
  );
}
