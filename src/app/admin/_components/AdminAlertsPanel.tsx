"use client";

import { AlertTriangle, Info, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { V } from "@/components/hq";
import type { DashboardAlert } from "@/app/api/admin/dashboard/route";

interface AdminAlertsPanelProps {
  alerts:  DashboardAlert[];
  loading: boolean;
}

const SEVERITY_CONFIG: Record<DashboardAlert["severity"], {
  icon:       typeof AlertTriangle;
  iconColor:  string;
  iconBg:     string;
  borderLeft: string;
}> = {
  high:   { icon: AlertCircle,  iconColor: "#f87171", iconBg: "rgba(248,113,113,0.10)", borderLeft: "#f87171"  },
  medium: { icon: AlertTriangle, iconColor: "#f59e0b", iconBg: "rgba(245,158,11,0.10)",  borderLeft: "#f59e0b"  },
  low:    { icon: Info,          iconColor: "#60a5fa", iconBg: "rgba(96,165,250,0.10)",   borderLeft: "#60a5fa"  },
};

export function AdminAlertsPanel({ alerts, loading }: AdminAlertsPanelProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
        <div className="h-4 w-28 animate-pulse rounded" style={{ background: V.surface }} />
        <div className="mt-4 space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-8 w-8 rounded-xl" style={{ background: V.surface }} />
              <div className="h-3 flex-1 rounded" style={{ background: V.surface }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl border p-4"
        style={{ background: V.card, borderColor: V.border }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(52,211,153,0.09)" }}
        >
          <Info size={14} style={{ color: "#34d399" }} />
        </div>
        <p className="text-[0.8rem]" style={{ color: V.textMuted }}>
          Aucune alerte — tout fonctionne normalement
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} style={{ color: "#f59e0b" }} />
          <h2 className="text-[0.87rem] font-bold" style={{ color: V.text }}>
            Alertes
          </h2>
          <span
            className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[0.58rem] font-bold text-white"
            style={{ background: alerts.some(a => a.severity === "high") ? "#f87171" : "#f59e0b" }}
          >
            {alerts.length}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {alerts.map((alert, i) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          const Icon = cfg.icon;
          const inner = (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border-l-2 p-3 transition-all"
              style={{
                background:  cfg.iconBg,
                borderColor: cfg.borderLeft,
                borderLeftColor: cfg.borderLeft,
                borderTop:   `1px solid ${V.border}`,
                borderRight: `1px solid ${V.border}`,
                borderBottom:`1px solid ${V.border}`,
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: cfg.iconBg }}
              >
                <Icon size={13} style={{ color: cfg.iconColor }} />
              </div>
              <p className="flex-1 text-[0.79rem] font-medium" style={{ color: V.text }}>
                {alert.message}
              </p>
              {alert.href && (
                <ArrowRight size={12} style={{ color: V.textFaint }} className="shrink-0" />
              )}
            </div>
          );

          return alert.href ? (
            <Link key={i} href={alert.href} className="block hover:opacity-90 transition-opacity">
              {inner}
            </Link>
          ) : inner;
        })}
      </div>
    </div>
  );
}
