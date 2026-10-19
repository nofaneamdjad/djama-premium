"use client";

import { useEffect, useState } from "react";
import { Send, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const GOLD   = "#c9a55a";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#131620";

interface PingResult {
  ok:          boolean;
  key_preview?: string;
  from?:       string;
  domains?:    { name: string; status: string }[];
  djama_domain_status?: string;
  error?:      string;
  fix?:        string;
}

interface SendResult {
  ok:         boolean;
  message?:   string;
  resend_id?: string;
  error?:     string;
  fix?:       string;
}

export default function EmailsPage() {
  const [ping, setPing]           = useState<PingResult | null>(null);
  const [pinging, setPinging]     = useState(false);
  const [to, setTo]               = useState("");
  const [sending, setSending]     = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  const doPing = async () => {
    setPinging(true);
    try {
      const res  = await fetch("/api/admin/resend-ping");
      const data = await res.json() as PingResult;
      setPing(data);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => { void doPing(); }, []);

  const sendTest = async () => {
    if (!to.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res  = await fetch(`/api/admin/test-email?to=${encodeURIComponent(to.trim())}`);
      const data = await res.json() as SendResult;
      setSendResult(data);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Send size={18} style={{ color: GOLD }} />
          Diagnostic emails
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Vérifiez la configuration Resend et testez l&apos;envoi d&apos;emails transactionnels
        </p>
      </div>

      {/* Status Resend */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Statut Resend</h2>
          <button
            onClick={doPing}
            disabled={pinging}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition hover:text-white disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}
          >
            <RefreshCw size={11} className={pinging ? "animate-spin" : ""} />
            Vérifier
          </button>
        </div>

        {pinging && <p className="text-sm text-white/30">Vérification en cours...</p>}

        {ping && (
          <div className="space-y-3">
            {/* Badge statut */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={ping.ok
                ? { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }
                : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }
              }
            >
              {ping.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {ping.ok ? "Resend configuré et fonctionnel" : "Problème de configuration"}
            </div>

            {/* Infos */}
            <div className="grid gap-2 text-xs">
              {ping.key_preview && (
                <Row label="Clé API" value={ping.key_preview} />
              )}
              {ping.from && <Row label="Expéditeur (FROM)" value={ping.from} />}
              {ping.djama_domain_status && (
                <Row label="Domaine djama.space" value={ping.djama_domain_status} />
              )}
              {ping.domains && ping.domains.length > 0 && (
                <div className="mt-1">
                  <p className="mb-1 text-white/30">Domaines Resend :</p>
                  <div className="space-y-1 pl-2">
                    {ping.domains.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[0.65rem] font-medium"
                          style={d.status === "verified"
                            ? { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
                            : { background: "rgba(255,170,0,0.1)", color: "#fbbf24" }
                          }
                        >
                          {d.status}
                        </span>
                        <span className="text-white/50">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Erreur */}
            {!ping.ok && ping.error && (
              <div
                className="rounded-lg px-3 py-2.5 space-y-1"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <p className="text-xs font-medium" style={{ color: "#fca5a5" }}>{ping.error}</p>
                {ping.fix && <p className="text-xs text-white/40">{ping.fix}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Envoi de test */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <h2 className="text-sm font-semibold text-white">Envoyer un email de test</h2>

        <div className="flex gap-2">
          <input
            type="email"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="destinataire@exemple.com"
            className="flex-1 rounded-lg px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/25"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
            onKeyDown={e => { if (e.key === "Enter") void sendTest(); }}
          />
          <button
            onClick={sendTest}
            disabled={sending || !to.trim()}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-40"
            style={{ background: `rgba(201,165,90,0.15)`, border: `1px solid rgba(201,165,90,0.3)`, color: GOLD }}
          >
            {sending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
            Envoyer
          </button>
        </div>

        {sendResult && (
          <div
            className="rounded-lg px-3 py-2.5 space-y-1"
            style={sendResult.ok
              ? { background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }
              : { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }
            }
          >
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: sendResult.ok ? "#4ade80" : "#fca5a5" }}>
              {sendResult.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
              {sendResult.ok ? sendResult.message : sendResult.error}
            </div>
            {sendResult.ok && sendResult.resend_id && (
              <p className="text-xs text-white/30 font-mono">ID Resend : {sendResult.resend_id}</p>
            )}
            {!sendResult.ok && sendResult.fix && (
              <p className="text-xs text-white/40">{sendResult.fix}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/30 shrink-0">{label}</span>
      <span className="text-white/60 text-right break-all">{value}</span>
    </div>
  );
}
