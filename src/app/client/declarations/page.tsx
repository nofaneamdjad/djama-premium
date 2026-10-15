"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, ListChecks, Calendar,
  FilePen, Paperclip, History, Settings,
  CheckCircle2, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD } from "./decl-utils";
import type { SectionId, FiscalProfile } from "./decl-types";

import OverviewSection    from "./sections/Overview";
import ObligationsSection from "./sections/Obligations";
import CalendrierSection  from "./sections/Calendrier";
import PreparerSection    from "./sections/Preparer";
import DocumentsSection   from "./sections/Documents";
import HistoriqueSection  from "./sections/Historique";
import ParametresWrapper  from "./sections/ParametresWrapper";

const ease = [0.22, 1, 0.36, 1] as const;

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "overview",    label: "Vue d'ensemble",  icon: LayoutDashboard },
  { id: "obligations", label: "Obligations",      icon: ListChecks      },
  { id: "calendrier",  label: "Calendrier",       icon: Calendar        },
  { id: "preparer",    label: "Préparer",         icon: FilePen         },
  { id: "documents",   label: "Documents",        icon: Paperclip       },
  { id: "historique",  label: "Historique",       icon: History         },
  { id: "parametres",  label: "Paramètres",       icon: Settings        },
];

interface Toast { id: number; msg: string; type: "success" | "error" }

export default function DeclarationsPage() {
  const [isDark, setIsDark]       = useState(true);
  const [section, setSection]     = useState<SectionId>("overview");
  const [userId, setUserId]       = useState<string | null>(null);
  const [profile, setProfile]     = useState<FiscalProfile | null>(null);
  const [toasts, setToasts]       = useState<Toast[]>([]);

  const t = tok(isDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("decl_fiscal_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as FiscalProfile); });
  }, [userId]);

  function addToast(msg: string, type: "success" | "error" = "success") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  const profileSubtitle = profile?.raison_sociale
    ? profile.raison_sociale
    : profile
    ? `${profile.pays_constitution} · ${profile.regime_tva}`
    : "Configurez votre profil fiscal";

  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg, color: t.text }}>

      {/* Gradient strip accent */}
      <div className="h-0.5 w-full" style={{
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}60 30%, ${GOLD} 50%, ${GOLD}60 70%, transparent 100%)`
      }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-7">

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30`, letterSpacing: "0.15em" }}
            >
              DJAMA
            </span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: t.text4 }}>
              Gestion déclarative
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: t.text }}>
                Déclarations
              </h1>
              <p className="text-sm mt-1" style={{ color: t.text3 }}>{profileSubtitle}</p>
            </div>
            {profile && (
              <div
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full shrink-0"
                style={{ background: "rgba(34,197,94,0.10)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <CheckCircle2 size={11} /> Profil configuré
              </div>
            )}
          </div>
        </div>

        {/* Navigation horizontale — 7 onglets */}
        <div className="relative mb-7">
          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all shrink-0"
                  style={isActive
                    ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }
                    : { background: t.glass, color: t.text2, border: `1px solid ${t.border}` }
                  }
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease }}
          >
            {section === "overview" && (
              <OverviewSection
                userId={userId}
                isDark={isDark}
                profile={profile}
                onNavigate={setSection}
              />
            )}
            {section === "obligations" && (
              <ObligationsSection
                userId={userId}
                isDark={isDark}
                profile={profile}
                add={addToast}
              />
            )}
            {section === "calendrier" && (
              <CalendrierSection
                userId={userId}
                isDark={isDark}
                profile={profile}
                add={addToast}
              />
            )}
            {section === "preparer" && (
              <PreparerSection
                userId={userId}
                isDark={isDark}
                profile={profile}
                add={addToast}
              />
            )}
            {section === "documents" && (
              <DocumentsSection
                userId={userId}
                isDark={isDark}
                add={addToast}
              />
            )}
            {section === "historique" && (
              <HistoriqueSection
                userId={userId}
                isDark={isDark}
                add={addToast}
              />
            )}
            {section === "parametres" && (
              <ParametresWrapper
                userId={userId}
                isDark={isDark}
                profile={profile}
                onProfileChange={setProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto"
              style={{
                background: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: toast.type === "success" ? "#4ade80" : "#f87171",
                backdropFilter: "blur(12px)",
              }}
            >
              <CheckCircle2 size={14} />
              <span className="text-sm font-medium">{toast.msg}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-1 opacity-60 hover:opacity-100"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
