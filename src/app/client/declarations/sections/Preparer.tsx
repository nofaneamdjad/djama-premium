"use client";

import { useState } from "react";
import { TrendingUp, Users, Bot, AlertCircle } from "lucide-react";
import { tok, GOLD } from "../decl-utils";
import type { FiscalProfile } from "../decl-types";

import DeclarationsFiscalesSection from "./DeclarationsFiscales";
import DeclarationsSocialesSection from "./DeclarationsSociales";
import AssistantIASection          from "./AssistantIA";

interface Props {
  userId: string | null;
  isDark: boolean;
  profile: FiscalProfile | null;
  add: (msg: string, type?: "success" | "error") => void;
}

type SubTab = "fiscales" | "sociales" | "ia";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id:    "fiscales",
    label: "Fiscales",
    icon:  TrendingUp,
    desc:  "TVA, IS, acomptes, CFE",
  },
  {
    id:    "sociales",
    label: "Sociales",
    icon:  Users,
    desc:  "URSSAF, DSN, cotisations",
  },
  {
    id:    "ia",
    label: "DJAMA IA",
    icon:  Bot,
    desc:  "Assistant déclaratif",
  },
];

export default function PreparerSection({ userId, isDark, profile, add }: Props) {
  const [sub, setSub] = useState<SubTab>("fiscales");
  const t = tok(isDark);

  return (
    <div>
      {/* Disclaimer permanent */}
      <div
        className="flex items-start gap-3 rounded-xl p-3.5 mb-6 text-xs"
        style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}25`, color: t.text2 }}
      >
        <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
        <span>
          Les documents générés ici sont des <strong style={{ color: t.text }}>documents de préparation — non officiels</strong>.
          Ils ne remplacent pas un dépôt réglementaire auprès de l&apos;administration.
          Aucune déclaration n&apos;est transmise automatiquement.
        </span>
      </div>

      {/* Sous-navigation */}
      <div className="flex gap-2 mb-7 flex-wrap">
        {SUB_TABS.map(({ id, label, icon: Icon, desc }) => {
          const active = sub === id;
          return (
            <button
              key={id}
              onClick={() => setSub(id)}
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all text-left"
              style={active
                ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }
                : { background: t.glass, color: t.text2, border: `1px solid ${t.border}` }
              }
            >
              <Icon size={14} />
              <span>{label}</span>
              <span
                className="text-[11px] font-normal hidden sm:block"
                style={{ color: active ? `${GOLD}99` : t.text4 }}
              >
                {desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sous-sections */}
      {sub === "fiscales" && (
        <DeclarationsFiscalesSection
          userId={userId}
          isDark={isDark}
          profile={profile}
          add={add}
        />
      )}
      {sub === "sociales" && (
        <DeclarationsSocialesSection
          userId={userId}
          isDark={isDark}
          profile={profile}
          add={add}
        />
      )}
      {sub === "ia" && (
        <AssistantIASection
          userId={userId}
          isDark={isDark}
          profile={profile}
        />
      )}
    </div>
  );
}
