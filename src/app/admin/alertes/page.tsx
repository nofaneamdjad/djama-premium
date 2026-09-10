"use client";

import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

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
      const sb = getSupabase();
      const built: Alert[] = [];

      const [msgRes, invRes, payRes] = await Promise.all([
        sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "nouveau"),
        sb.from("invoices").select("id", { count: "exact", head: true }).in("payment_status", ["échoué", "en retard"]),
        sb.from("user_access").select("id", { count: "exact", head: true }).lt("expires_at", new Date().toISOString()).not("expires_at", "is", null),
      ]);

      if ((msgRes.count ?? 0) > 0) {
        built.push({ type: "warning", title: "Messages non lus", description: `${msgRes.count} message${(msgRes.count ?? 0) > 1 ? "s" : ""} en attente de réponse`, count: msgRes.count ?? 0, href: "/admin/messages" });
      }
      if ((invRes.count ?? 0) > 0) {
        built.push({ type: "error", title: "Paiements échoués", description: `${invRes.count} facture${(invRes.count ?? 0) > 1 ? "s" : ""} avec paiement échoué ou en retard`, count: invRes.count ?? 0, href: "/admin/paiements" });
      }
      if ((payRes.count ?? 0) > 0) {
        built.push({ type: "warning", title: "Accès expirés", description: `${payRes.count} accès ont dépassé leur date d'expiration`, count: payRes.count ?? 0, href: "/admin/acces" });
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
          style={{ borderColor: BORDER }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ background: CARD }} />
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
