"use client";

import { type LucideIcon, Construction } from "lucide-react";

const GOLD   = "#c9a55a";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#131620";

interface ComingSoonProps {
  icon?:        LucideIcon;
  title:        string;
  description:  string;
  features?:    string[];
}

export function ComingSoon({ icon: Icon = Construction, title, description, features }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: `rgba(201,165,90,0.08)`, border: `1px solid rgba(201,165,90,0.18)` }}
      >
        <Icon size={24} style={{ color: GOLD }} />
      </div>

      <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-white/40 max-w-md mb-8">{description}</p>

      {features && features.length > 0 && (
        <div
          className="rounded-xl p-5 text-left max-w-md w-full"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Fonctionnalités prévues
          </p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-white/50">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: GOLD }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="mt-6 rounded-full px-4 py-1.5 text-xs font-semibold"
        style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.18)", color: "#fbbf24" }}
      >
        En développement
      </div>
    </div>
  );
}
