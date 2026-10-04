"use client";

import React from "react";
import type { ContractStatus } from "./types";
import { STATUS_CFG } from "./constants";

export function StatusBadge({ status }: { status: ContractStatus }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.brouillon;
  return (
    <span className={`text-[10.5px] px-2 py-0.5 rounded-full border font-semibold ${s.text} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

export function inp(extra = "") {
  return `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.18] transition-colors ${extra}`;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-white/35">{children}</label>;
}
