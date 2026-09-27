"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Brain, Loader2, AlertTriangle, AlertOctagon, Lightbulb, Check, CheckCircle, XCircle, Shield } from "lucide-react";
import type { Contract, AIAnalysisResult } from "./types";
import { gold } from "./constants";

export function AIModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const [loading, setLoading]   = useState(true);
  const [result,  setResult]    = useState<AIAnalysisResult | null>(null);
  const [error,   setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAnalysis() {
      setLoading(true);
      setError(null);
      try {
        const res  = await fetch("/api/contrats/analyse", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ contract_id: contract.id }),
        });
        const json = await res.json() as AIAnalysisResult & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Le service d'analyse n'est pas disponible.");
        } else {
          setResult(json);
        }
      } catch {
        if (!cancelled) setError("Erreur réseau — vérifiez votre connexion.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchAnalysis();
    return () => { cancelled = true; };
  }, [contract.id]);

  const retry = () => {
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        const res  = await fetch("/api/contrats/analyse", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contract_id: contract.id }),
        });
        const json = await res.json() as AIAnalysisResult & { error?: string };
        if (!res.ok) setError(json.error ?? "Service indisponible.");
        else setResult(json);
      } catch { setError("Erreur réseau."); }
      finally { setLoading(false); }
    })();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        className="w-full max-w-xl bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#0a0f1e]/90 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <Brain size={14} style={{ color: gold }}/>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Assistance IA — Points d&apos;attention</h3>
              <p className="text-[11px] text-white/35">{contract.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 size={28} className="animate-spin" style={{ color: gold }}/>
              <div className="text-sm text-white/50">Analyse en cours…</div>
              <div className="text-[11px] text-white/25">Appel au service IA</div>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={20} className="text-red-400"/>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/80">Analyse indisponible</p>
                <p className="text-xs text-white/40 mt-1.5 max-w-xs leading-relaxed">{error}</p>
              </div>
              <button onClick={retry}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-white/50 hover:text-white/70 hover:border-white/20 transition-colors">
                Réessayer
              </button>
            </div>
          )}

          {!loading && result && (
            <>
              <div className="flex items-center gap-4 bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                    <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke={gold} strokeWidth="3"
                      strokeLinecap="round" strokeDasharray="100" initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - result.score }} transition={{ duration: 1.2, ease: "easeOut" }}/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: gold }}>{result.score}%</div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80">Score de complétude</p>
                  <p className="text-[11px] text-white/45 mt-1 leading-relaxed">{result.summary}</p>
                </div>
              </div>

              {result.risks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertOctagon size={12} className="text-red-400"/> Points d&apos;attention
                  </h4>
                  <div className="space-y-1.5">
                    {result.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2">
                        <AlertTriangle size={11} className="text-red-400 mt-0.5 shrink-0"/>
                        <span className="text-xs text-white/70">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.suggestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb size={12} style={{ color: gold }}/> Suggestions
                  </h4>
                  <div className="space-y-1.5">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2 bg-white/[0.03] border border-white/[0.06]">
                        <Check size={11} className="text-emerald-400 mt-0.5 shrink-0"/>
                        <span className="text-xs text-white/70">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.compliance.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield size={12} className="text-emerald-400"/> Éléments structurels
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {result.compliance.map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-xs ${item.ok ? "bg-emerald-500/5 border-emerald-500/10 text-white/70" : "bg-red-500/5 border-red-500/10 text-white/40"}`}>
                        {item.ok ? <CheckCircle size={11} className="text-emerald-400 shrink-0"/> : <XCircle size={11} className="text-red-400 shrink-0"/>}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
                <p className="text-[10px] text-white/30 leading-relaxed">
                  <Shield size={9} className="inline mr-1 text-white/20"/>
                  {result.disclaimer}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
