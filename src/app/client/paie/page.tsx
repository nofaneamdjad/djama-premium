"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FileText, CalendarDays, Clock,
  Banknote, FolderOpen, Briefcase, BarChart2, Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";
import type { Employe, SectionId } from "./rh-types";

import OverviewSection    from "./sections/Overview";
import SalariesSection    from "./sections/Salaries";
import ContratsSection    from "./sections/Contrats";
import CongesSection      from "./sections/Conges";
import TempsSection       from "./sections/Temps";
import PaieSection        from "./sections/Paie";
import DocumentsSection   from "./sections/Documents";
import RecrutementSection from "./sections/Recrutement";
import RapportsSection    from "./sections/Rapports";
import ParametresSection  from "./sections/Parametres";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;

function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#111111"                : "#f8f8f5",
    glass:      isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
    border:     isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    borderSoft: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    text:       isDark ? "#e8e2d6"                : "#1a1a1a",
    text2:      isDark ? "#a09880"                : "#4a4a4a",
    text3:      isDark ? "#6b6256"                : "#7a7a7a",
    text4:      isDark ? "#4a4540"                : "#9a9a9a",
  };
}

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "overview",    label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "salaries",    label: "Salariés",        icon: Users           },
  { id: "contrats",    label: "Contrats",        icon: FileText        },
  { id: "conges",      label: "Congés",          icon: CalendarDays    },
  { id: "temps",       label: "Temps",           icon: Clock           },
  { id: "paie",        label: "Paie",            icon: Banknote        },
  { id: "documents",   label: "Documents",       icon: FolderOpen      },
  { id: "recrutement", label: "Recrutement",     icon: Briefcase       },
  { id: "rapports",    label: "Rapports",        icon: BarChart2       },
  { id: "parametres",  label: "Paramètres",      icon: Settings        },
];

export default function PaieRHPage() {
  const { isDark } = useTheme();
  const { toasts, add, remove } = useToastStack();
  const t = tok(isDark);

  const [userId,   setUserId]  = useState<string | null>(null);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [section,  setSection] = useState<SectionId>("overview");

  const loadEmployes = useCallback(async (uid?: string | null) => {
    const id = uid ?? userId;
    if (!id) return;
    const { data } = await supabase
      .from("employes")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setEmployes((data as Employe[]) ?? []);
  }, [userId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await loadEmployes(user.id);
    })();
  }, []);

  const sharedProps = { userId, employes, add, isDark };

  const activeCount = employes.filter(e => e.actif).length;

  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>
      <ToastStack toasts={toasts} remove={remove} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="mb-7"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: GOLD }}>DJAMA</p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.text }}>
            Paie &amp; RH
          </h1>
          <p className="text-sm mt-1.5" style={{ color: t.text3 }}>
            {activeCount > 0
              ? `${activeCount} salarié${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""} — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
              : "Gérez vos salariés, contrats, paie et recrutement."
            }
          </p>
        </motion.div>

        {/* ── Navigation horizontale ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease }}
          className="mb-8"
        >
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className="flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 shrink-0"
                  style={{
                    background: active ? `${GOLD}18` : t.glass,
                    border:     `1px solid ${active ? `${GOLD}40` : t.border}`,
                    color:      active ? GOLD : t.text3,
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Contenu de la section ────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease }}
          >
            {section === "overview"    && <OverviewSection    {...sharedProps} onNavigate={setSection} />}
            {section === "salaries"    && <SalariesSection    {...sharedProps} refresh={loadEmployes} />}
            {section === "contrats"    && <ContratsSection    {...sharedProps} />}
            {section === "conges"      && <CongesSection      {...sharedProps} />}
            {section === "temps"       && <TempsSection       {...sharedProps} />}
            {section === "paie"        && <PaieSection        {...sharedProps} />}
            {section === "documents"   && <DocumentsSection   {...sharedProps} />}
            {section === "recrutement" && <RecrutementSection {...sharedProps} />}
            {section === "rapports"    && <RapportsSection    {...sharedProps} />}
            {section === "parametres"  && <ParametresSection  {...sharedProps} />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
