"use client";

import { useState, useEffect } from "react";
import {
  Landmark, LayoutDashboard, Wallet, ArrowLeftRight, Link2,
  BarChart2, Zap, Sparkles, ChevronRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { supabase } from "@/lib/supabase";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import { tok, GOLD } from "./banque-utils";

import Overview       from "./sections/Overview";
import Comptes        from "./sections/Comptes";
import Transactions   from "./sections/Transactions";
import Rapprochement  from "./sections/Rapprochement";
import Connexions     from "./sections/Connexions";
import Analyse        from "./sections/Analyse";
import Regles         from "./sections/Regles";
import AssistantIA    from "./sections/AssistantIA";

type Section =
  | "overview" | "comptes" | "transactions" | "rapprochement"
  | "connexions" | "analyse" | "regles" | "assistant";

interface Toast { id: number; msg: string; type: "success" | "error" }

const NAV: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "overview",      label: "Vue d'ensemble",   icon: LayoutDashboard },
  { id: "comptes",       label: "Comptes",           icon: Wallet },
  { id: "transactions",  label: "Transactions",      icon: ArrowLeftRight },
  { id: "rapprochement", label: "Rapprochement",     icon: Link2 },
  { id: "connexions",    label: "Connexions",        icon: Landmark },
  { id: "analyse",       label: "Analyse",           icon: BarChart2 },
  { id: "regles",        label: "Règles auto",       icon: Zap },
  { id: "assistant",     label: "Assistant IA",      icon: Sparkles },
];

export default function BanquePage() {
  const { isDark } = useTheme();
  const t = tok(isDark);

  const [section, setSection] = useState<Section>("overview");
  const [userId, setUserId]   = useState<string | null>(null);
  const [orgId, setOrgId]     = useState<string | null>(null);
  const [toasts, setToasts]   = useState<Toast[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  let toastId = 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        // Récupérer org_id depuis le profil
        supabase.from("profiles").select("organization_id")
          .eq("user_id", data.user.id).single()
          .then(({ data: p }) => { if (p?.organization_id) setOrgId(p.organization_id); });
      }
    });
  }, []);

  function add(msg: string, type: "success" | "error" = "success") {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  function goTo(s: string) {
    setSection(s as Section);
    setMenuOpen(false);
  }

  const current = NAV.find(n => n.id === section)!;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: isDark ? "#0d0d14" : "#f8f8fc" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{ background: isDark ? "rgba(13,13,20,0.9)" : "rgba(248,248,252,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <ModuleHeaderIcon icon={Landmark} color={GOLD} />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black tracking-tight" style={{ color: t.text }}>Banque</h1>
            <p className="text-xs" style={{ color: t.text3 }}>Gestion bancaire professionnelle</p>
          </div>
          {/* Breadcrumb section actuelle */}
          <div className="hidden sm:flex items-center gap-1.5">
            <current.icon size={13} style={{ color: GOLD }} />
            <span className="text-xs font-medium" style={{ color: GOLD }}>{current.label}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 pb-8 gap-6 mt-2">

        {/* Nav latérale — desktop */}
        <nav className="hidden md:flex flex-col gap-1 w-44 flex-shrink-0 pt-1">
          {NAV.map(item => {
            const active = section === item.id;
            return (
              <button key={item.id}
                onClick={() => setSection(item.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                style={{
                  background: active ? `${GOLD}14` : "transparent",
                  border: `1px solid ${active ? GOLD + "40" : "transparent"}`,
                  color: active ? GOLD : t.text2,
                  fontWeight: active ? 600 : 400,
                }}>
                <item.icon size={14} />
                {item.label}
                {active && <ChevronRight size={11} className="ml-auto" style={{ color: GOLD }} />}
              </button>
            );
          })}
        </nav>

        {/* Nav mobile — barre horizontale */}
        <div className="md:hidden w-full">
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {NAV.map(item => {
                const active = section === item.id;
                return (
                  <button key={item.id}
                    onClick={() => setSection(item.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs flex-shrink-0"
                    style={{
                      background: active ? `${GOLD}14` : t.glass,
                      border: `1px solid ${active ? GOLD + "40" : t.border}`,
                      color: active ? GOLD : t.text2,
                      fontWeight: active ? 600 : 400,
                    }}>
                    <item.icon size={13} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 min-w-0">
          <div className="rounded-2xl p-5" style={{ background: t.glassMd, border: `1px solid ${t.border}` }}>
            {section === "overview" && (
              <Overview userId={userId} isDark={isDark} orgId={orgId} onGoTo={goTo} />
            )}
            {section === "comptes" && (
              <Comptes userId={userId} isDark={isDark} orgId={orgId} add={add} />
            )}
            {section === "transactions" && (
              <Transactions userId={userId} isDark={isDark} orgId={orgId} add={add} />
            )}
            {section === "rapprochement" && (
              <Rapprochement userId={userId} isDark={isDark} add={add} />
            )}
            {section === "connexions" && (
              <Connexions userId={userId} isDark={isDark} orgId={orgId} add={add} />
            )}
            {section === "analyse" && (
              <Analyse userId={userId} isDark={isDark} orgId={orgId} />
            )}
            {section === "regles" && (
              <Regles userId={userId} isDark={isDark} add={add} />
            )}
            {section === "assistant" && (
              <AssistantIA userId={userId} isDark={isDark} />
            )}
          </div>
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg pointer-events-auto"
            style={{
              background: toast.type === "success"
                ? (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.12)")
                : (isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.12)"),
              border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`,
              color: toast.type === "success" ? "#10b981" : "#ef4444",
              backdropFilter: "blur(8px)",
            }}>
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: toast.type === "success" ? "#10b981" : "#ef4444" }} />
            {toast.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
