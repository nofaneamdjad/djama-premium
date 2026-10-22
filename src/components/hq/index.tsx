"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS DJAMA HQ
   Source unique de vérité — importer depuis @/components/hq
───────────────────────────────────────────────────────────── */
export const HQ = {
  /* Fonds */
  bg:         "#0B0D12",
  sidebar:    "#0F1117",
  card:       "#141720",
  surface:    "#171A22",
  surfaceHov: "#1C2030",

  /* Bordures */
  border:     "rgba(255,255,255,0.07)",
  borderHov:  "rgba(255,255,255,0.13)",

  /* Accent doré */
  gold:       "#C9A55A",
  goldR:      "201,165,90",
  goldDim:    "rgba(201,165,90,0.10)",
  goldBorder: "rgba(201,165,90,0.18)",
  goldHov:    "rgba(201,165,90,0.16)",

  /* Textes */
  text:       "#F5F5F3",
  textSub:    "#87909E",
  textMuted:  "rgba(255,255,255,0.38)",
  textFaint:  "rgba(255,255,255,0.20)",

  /* Rayons */
  r: { xs: "6px", sm: "8px", md: "12px", lg: "16px", xl: "20px", "2xl": "24px" },

  /* Dimensions layout */
  sidebarW:        260,
  sidebarCompactW: 64,
  headerH:         60,
} as const;

/* ─────────────────────────────────────────────────────────────
   CSS VARIABLE REFS — pour supporter dark + light dans toute l'admin
   Thème-sensibles → var(--hq-xxx)  |  Invariants (or) → valeur directe
───────────────────────────────────────────────────────────── */
export const V = {
  bg:              "var(--hq-bg)",
  sidebar:         "var(--hq-sidebar)",
  card:            "var(--hq-card)",
  surface:         "var(--hq-surface)",
  surfaceHov:      "var(--hq-surface-hov)",
  border:          "var(--hq-border)",
  borderHov:       "var(--hq-border-hov)",
  text:            "var(--hq-text)",
  textSub:         "var(--hq-text-sub)",
  textMuted:       "var(--hq-text-muted)",
  textFaint:       "var(--hq-text-faint)",
  gold:            "#C9A55A",
  goldR:           "201,165,90",
  goldDim:         "rgba(201,165,90,0.10)",
  goldBorder:      "rgba(201,165,90,0.18)",
  goldHov:         "rgba(201,165,90,0.16)",
  r:               HQ.r,
  sidebarW:        HQ.sidebarW,
  sidebarCompactW: HQ.sidebarCompactW,
  headerH:         HQ.headerH,
} as const;

/* ─────────────────────────────────────────────────────────────
   THEME STYLE — injecte les variables CSS dans :root
───────────────────────────────────────────────────────────── */
const DARK_VARS  = `--hq-bg:#0B0D12;--hq-sidebar:#0F1117;--hq-card:#141720;--hq-surface:#171A22;--hq-surface-hov:#1C2030;--hq-border:rgba(255,255,255,0.07);--hq-border-hov:rgba(255,255,255,0.13);--hq-text:#F5F5F3;--hq-text-sub:#87909E;--hq-text-muted:rgba(255,255,255,0.38);--hq-text-faint:rgba(255,255,255,0.20)`;
const LIGHT_VARS = `--hq-bg:#F7F8FA;--hq-sidebar:#FFFFFF;--hq-card:#FFFFFF;--hq-surface:#EEF0F4;--hq-surface-hov:#E4E7ED;--hq-border:#E6E8EC;--hq-border-hov:#CDD0D9;--hq-text:#171A21;--hq-text-sub:#667085;--hq-text-muted:rgba(23,26,33,0.60);--hq-text-faint:rgba(23,26,33,0.38)`;

/* Correctifs globaux mode clair : remplace les classes Tailwind text-white/* hardcodées dark-only */
const LIGHT_OVERRIDES = `
[data-hq-theme=light] .text-white,[data-hq-theme=light] .text-white\\/80,[data-hq-theme=light] .text-white\\/70{color:var(--hq-text)!important}
[data-hq-theme=light] .text-white\\/60,[data-hq-theme=light] .text-white\\/50{color:var(--hq-text-sub)!important}
[data-hq-theme=light] .text-white\\/40,[data-hq-theme=light] .text-white\\/35{color:var(--hq-text-muted)!important}
[data-hq-theme=light] .text-white\\/30,[data-hq-theme=light] .text-white\\/25,[data-hq-theme=light] .text-white\\/20,[data-hq-theme=light] .text-white\\/15,[data-hq-theme=light] .text-white\\/10{color:var(--hq-text-faint)!important}
[data-hq-theme=light] .placeholder\\:text-white\\/20::placeholder,[data-hq-theme=light] .placeholder\\:text-white\\/30::placeholder{color:var(--hq-text-faint)!important}
[data-hq-theme=light] .hover\\:text-white\\/60:hover{color:var(--hq-text-sub)!important}
`;

export function HQThemeStyle({ theme }: { theme: "dark" | "light" }) {
  const vars  = theme === "dark" ? DARK_VARS : LIGHT_VARS;
  const extra = theme === "light" ? LIGHT_OVERRIDES : "";
  return (
    <style dangerouslySetInnerHTML={{ __html: `:root{${vars}}${extra}` }} />
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  actif:          { label: "Actif",          bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  active:         { label: "Actif",          bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  inactif:        { label: "Inactif",        bg: V.surface,               color: V.textSub },
  suspendu:       { label: "Suspendu",       bg: "rgba(251,191,36,0.12)",  color: "#fbbf24" },
  en_attente:     { label: "En attente",     bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
  approuvé:       { label: "Approuvé",       bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  refusé:         { label: "Refusé",         bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  nouveau:        { label: "Nouveau",        bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
  lu:             { label: "Lu",             bg: V.surface,               color: V.textSub },
  traité:         { label: "Traité",         bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  archivé:        { label: "Archivé",        bg: V.surface,               color: V.textSub },
  critique:       { label: "Critique",       bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  majeur:         { label: "Majeur",         bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  mineur:         { label: "Mineur",         bg: V.surface,               color: V.textSub },
  ouvert:         { label: "Ouvert",         bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  résolu:         { label: "Résolu",         bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  premium:        { label: "Premium",        bg: "rgba(201,165,90,0.12)",  color: "#C9A55A" },
  gratuit:        { label: "Gratuit",        bg: V.surface,               color: V.textSub },
  payé:           { label: "Payé",           bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  impayé:         { label: "Impayé",         bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  annulé:         { label: "Annulé",         bg: V.surface,               color: V.textSub },
  brouillon:      { label: "Brouillon",      bg: V.surface,               color: V.textSub },
};

export function HQStatusBadge({
  status,
  custom,
}: {
  status: string;
  custom?: { label: string; bg: string; color: string };
}) {
  const s = custom ?? STATUS_MAP[status.toLowerCase()] ?? {
    label: status,
    bg:    V.surface,
    color: V.textSub,
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.05em]"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD — KPI
───────────────────────────────────────────────────────────── */
export function HQStatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
  href,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: string;
  trend?: { v: number; up: boolean } | null;
  href?: string;
  loading?: boolean;
}) {
  const inner = (
    <div
      className="group flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-150"
      style={{ background: V.card, borderColor: V.border }}
      onMouseEnter={e => href && ((e.currentTarget as HTMLDivElement).style.borderColor = V.borderHov)}
      onMouseLeave={e => href && ((e.currentTarget as HTMLDivElement).style.borderColor = V.border)}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-[0.7rem] font-bold uppercase tracking-[0.09em]"
          style={{ color: V.textMuted }}
        >
          {label}
        </span>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>

      {loading ? (
        <div className="h-9 w-28 animate-pulse rounded-lg" style={{ background: V.border }} />
      ) : (
        <div>
          <p
            className="text-[1.85rem] font-black leading-none tabular-nums"
            style={{ color: V.text }}
          >
            {value}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {sub && <span className="text-[0.73rem]" style={{ color: V.textMuted }}>{sub}</span>}
            {trend !== undefined && trend !== null && (
              <span
                className="flex items-center gap-0.5 text-[0.7rem] font-semibold"
                style={{ color: trend.up ? "#34d399" : "#ef4444" }}
              >
                {trend.up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                {trend.v}%
              </span>
            )}
            {trend === null && (
              <span className="flex items-center gap-0.5 text-[0.7rem]" style={{ color: V.textFaint }}>
                <Minus size={9} />stable
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : inner;
}

/* ─────────────────────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────────────────────── */
export function HQPageHeader({
  title,
  description,
  icon: Icon,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span className="text-[0.63rem]" style={{ color: V.textFaint }}>
                  /
                </span>
              )}
              {bc.href ? (
                <Link
                  href={bc.href}
                  className="text-[0.73rem] font-medium transition-colors"
                  style={{ color: V.textMuted }}
                >
                  {bc.label}
                </Link>
              ) : (
                <span className="text-[0.73rem] font-semibold" style={{ color: V.textSub }}>
                  {bc.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: V.goldDim, border: `1px solid ${V.goldBorder}` }}
            >
              <Icon size={17} style={{ color: V.gold }} />
            </div>
          )}
          <div>
            <h1
              className="text-[1.2rem] font-black leading-tight tracking-tight"
              style={{ color: V.text }}
            >
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-[0.8rem]" style={{ color: V.textSub }}>
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────── */
export function HQEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: V.goldDim, border: `1px solid ${V.goldBorder}` }}
        >
          <Icon size={22} style={{ color: V.gold }} />
        </div>
      )}
      <p className="text-[1rem] font-bold" style={{ color: V.text }}>
        {title}
      </p>
      <p className="mt-1.5 max-w-sm text-[0.82rem]" style={{ color: V.textSub }}>
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────────────────────────── */
export function HQLoadingSkeleton({
  rows = 5,
  cols = 4,
  height = "h-8",
}: {
  rows?: number;
  cols?: number;
  height?: string;
}) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={`${height} flex-1 animate-pulse rounded-lg`}
              style={{
                background: V.border,
                animationDelay: `${(r * cols + c) * 40}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────────────────────────── */
export function HQConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ background: V.surface, borderColor: V.borderHov }}
      >
        <h3 className="text-[0.95rem] font-bold" style={{ color: V.text }}>
          {title}
        </h3>
        <p className="mt-2 text-[0.82rem]" style={{ color: V.textSub }}>
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-1.5 text-[0.8rem] font-medium transition-colors"
            style={{ borderColor: V.border, color: V.textSub }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg border px-4 py-1.5 text-[0.8rem] font-bold transition-opacity hover:opacity-80"
            style={
              danger
                ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", borderColor: "rgba(239,68,68,0.22)" }
                : { background: V.goldDim, color: V.gold, borderColor: V.goldBorder }
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FILTER BAR — tabs + optional right slot
───────────────────────────────────────────────────────────── */
export function HQFilterBar({
  tabs,
  active,
  onChange,
  right,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1">
        {tabs.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-medium transition-all duration-100"
              style={{
                background: isActive ? `rgba(${V.goldR},0.10)` : "transparent",
                color: isActive ? V.gold : V.textMuted,
                border: `1px solid ${isActive ? V.goldBorder : "transparent"}`,
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums"
                  style={{
                    background: isActive ? `rgba(${V.goldR},0.15)` : V.border,
                    color: isActive ? V.gold : V.textMuted,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NOTIFICATION PANEL — utilisé dans le header
───────────────────────────────────────────────────────────── */
export function HQNotificationPanel({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: { id: string; title: string; body: string; time: string; type: "info" | "warning" | "error" }[];
}) {
  if (!open) return null;
  const colorMap = { info: "#60a5fa", warning: "#f59e0b", error: "#ef4444" };
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border shadow-2xl"
        style={{ background: V.surface, borderColor: V.borderHov }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: V.border }}>
          <span className="text-[0.8rem] font-bold" style={{ color: V.text }}>
            Notifications
          </span>
          {items.length > 0 && (
            <span className="rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
              {items.length}
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-[0.8rem]" style={{ color: V.textMuted }}>Aucune notification</p>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="border-b px-4 py-3 transition-colors"
                style={{ borderColor: V.border }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = V.surfaceHov}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: colorMap[item.type] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.78rem] font-semibold" style={{ color: V.text }}>{item.title}</p>
                    <p className="mt-0.5 text-[0.73rem]" style={{ color: V.textSub }}>{item.body}</p>
                    <p className="mt-1 text-[0.65rem]" style={{ color: V.textFaint }}>{item.time}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
