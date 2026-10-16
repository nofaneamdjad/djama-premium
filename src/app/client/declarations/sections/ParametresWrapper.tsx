"use client";

import { useState } from "react";
import { Settings, UserCheck, Building2 } from "lucide-react";
import { tok, GOLD } from "../decl-utils";
import type { FiscalProfile } from "../decl-types";

import ParametresSection    from "./Parametres";
import CollaborationSection from "./Collaboration";
import EtablissementsSection from "./Etablissements";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  onProfileChange: (p: FiscalProfile) => void;
}

type SubTab = "profil" | "collaboration" | "etablissements";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "profil",          label: "Profil fiscal",    icon: Settings   },
  { id: "collaboration",   label: "Collaboration",    icon: UserCheck  },
  { id: "etablissements",  label: "Établissements",   icon: Building2  },
];

export default function ParametresWrapper({ userId, isDark, profile, onProfileChange }: Props) {
  const [sub, setSub] = useState<SubTab>("profil");
  const t = tok(isDark);

  // addToast stub — Parametres doesn't expose one, Collaboration does
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" }[]>([]);
  function addToast(msg: string, type: "success" | "error" = "success") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  return (
    <div>
      {/* Sub-navigation */}
      <div className="flex gap-2 mb-7">
        {SUB_TABS.map(({ id, label, icon: Icon }) => {
          const active = sub === id;
          return (
            <button
              key={id}
              onClick={() => setSub(id)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={active
                ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }
                : { background: t.glass, color: t.text2, border: `1px solid ${t.border}` }
              }
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {sub === "profil" && (
        <ParametresSection
          userId={userId}
          isDark={isDark}
          profile={profile}
          onProfileChange={onProfileChange}
        />
      )}
      {sub === "collaboration" && (
        <CollaborationSection
          userId={userId}
          isDark={isDark}
          add={addToast}
        />
      )}
      {sub === "etablissements" && (
        <EtablissementsSection
          userId={userId}
          isDark={isDark}
          profile={profile}
          add={addToast}
        />
      )}

      {/* Inline toasts for Collaboration */}
      {toasts.length > 0 && (
        <div className="mt-4 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: toast.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                color: toast.type === "success" ? "#4ade80" : "#f87171",
              }}
            >
              {toast.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
