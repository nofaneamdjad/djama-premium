"use client";

import { type LucideIcon, Construction } from "lucide-react";
import { HQ } from "@/components/hq";

interface ComingSoonProps {
  icon?:       LucideIcon;
  title:       string;
  description: string;
  features?:   string[];
}

export function ComingSoon({ icon: Icon = Construction, title, description, features }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: HQ.goldDim, border: `1px solid ${HQ.goldBorder}` }}
      >
        <Icon size={24} style={{ color: HQ.gold }} />
      </div>

      <h1 className="text-[1.15rem] font-bold mb-2" style={{ color: HQ.text }}>{title}</h1>
      <p className="text-[0.85rem] max-w-md mb-8" style={{ color: HQ.textSub }}>{description}</p>

      {features && features.length > 0 && (
        <div
          className="rounded-xl p-5 text-left max-w-md w-full"
          style={{ background: HQ.card, border: `1px solid ${HQ.border}` }}
        >
          <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.1em]" style={{ color: HQ.gold }}>
            Fonctionnalités prévues
          </p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.8rem]" style={{ color: HQ.textSub }}>
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full" style={{ background: HQ.gold }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="mt-6 rounded-full px-4 py-1.5 text-[0.73rem] font-semibold"
        style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)", color: "#fbbf24" }}
      >
        En développement
      </div>
    </div>
  );
}
