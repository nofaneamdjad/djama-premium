"use client";

import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { V } from "@/components/hq";

interface Alert {
  type: "error" | "warning" | "info" | "success";
  title: string;
  description: string;
  count?: number;
  href?: string;
}

export default function AlertesPage() {
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/alertes");
      if (!res.ok) throw new Error("Erreur serveur");
      const { messages_non_lus, paiements_echoues, acces_expires } = await res.json() as {
        messages_non_lus: number; paiements_echoues: number; acces_expires: number;
      };

      const built: Alert[] = [];
      if (messages_non_lus > 0) {
        built.push({ type: "warning", title: "Messages non lus", description: `${messages_non_lus} message${messages_non_lus > 1 ? "s" : ""} en attente de réponse`, count: messages_non_lus, href: "/admin/messages" });
      }
      if (paiements_echoues > 0) {
        built.push({ type: "error", title: "Paiements échoués", description: `${paiements_echoues} facture${paiements_echoues > 1 ? "s" : ""} avec paiement échoué ou en retard`, count: paiements_echoues, href: "/admin/paiements" });
      }
      if (acces_expires > 0) {
        built.push({ type: "warning", title: "Accès expirés", description: `${acces_expires} accès ont dépassé leur date d'expiration`, count: acces_expires, href: "/admin/acces" });
      }
      if (built.length === 0) {
        built.push({ type: "success", title: "Tout est en ordre", description: "Aucune alerte active. La plateforme fonctionne normalement." });
      }
      setAlerts(built);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const Icon = (type: string) => {
    if (type === "error")   return <XCircle size={16} className="text-red-400" />;
    if (type === "warning") return <AlertTriangle size={16} className="text-amber-400" />;
    if (type === "success") return <CheckCircle size={16} className="text-emerald-400" />;
    return <Info size={16} className="text-blue-400" />;
  };

  const colorCls = (type: string) => {
    if (type === "error")   return "border-red-500/20 bg-red-500/5";
    if (type === "warning") return "border-amber-500/20 bg-amber-500/5";
    if (type === "success") return "border-emerald-500/20 bg-emerald-500/5";
    return "border-blue-500/20 bg-blue-500/5";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.15rem] font-black tracking-tight text-white">Alertes</h1>
          <p className="mt-0.5 text-[0.75rem] text-white/35">État de la plateforme en temps réel</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium text-white/40 transition hover:border-white/20 hover:text-white/70"
          style={{ borderColor: V.border }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ background: V.card }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 rounded-2xl border p-5 ${colorCls(a.type)}`}
            >
              <div className="mt-0.5 shrink-0">{Icon(a.type)}</div>
              <div className="flex-1">
                <p className="text-[0.88rem] font-bold text-white/85">{a.title}</p>
                <p className="mt-0.5 text-[0.78rem] text-white/45">{a.description}</p>
              </div>
              {a.count && (
                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-[0.75rem] font-bold text-white/60">{a.count}</span>
              )}
              {a.href && (
                <a href={a.href} className="shrink-0 text-[0.74rem] font-medium underline decoration-dotted text-white/35 hover:text-white/60">Voir →</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
