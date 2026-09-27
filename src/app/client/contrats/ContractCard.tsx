"use client";

import { motion } from "framer-motion";
import { ChevronRight, Trash2 } from "lucide-react";
import type { Contract } from "./types";
import { gold, ease, CONTRACT_TYPES } from "./constants";
import { StatusBadge } from "./ui";
import { fmtEur } from "@/lib/format";

export function ContractCard({ contract, isSelected, onSelect, onDelete, isDark }: {
  contract: Contract; isSelected: boolean; onSelect: () => void; onDelete: (id: string) => void; isDark: boolean;
}) {
  const t = CONTRACT_TYPES.find((x) => x.value === contract.contract_type);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }} onClick={onSelect}
      className={`group relative flex flex-col gap-2 rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${
        isSelected
          ? isDark ? "border-white/[0.14] bg-white/[0.025]" : "border-gray-300 bg-white"
          : isDark ? "border-white/[0.06] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                   : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      }`}>
      <div className="h-[2px] w-full" style={{ background: isSelected ? `linear-gradient(90deg, ${gold}80, transparent)` : "transparent" }}/>
      <div className="px-4 pb-4 pt-2">
        {isSelected && <div className="absolute left-0 top-6 bottom-3 w-[2px] rounded-full" style={{ backgroundColor: gold }}/>}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${isDark ? "text-white/90" : "text-gray-900"}`}>{contract.title}</p>
            <p className={`text-xs truncate ${isDark ? "text-white/45" : "text-gray-500"}`}>{contract.client_name}{contract.client_company ? ` · ${contract.client_company}` : ""}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={contract.status}/>
            <button onClick={(e) => { e.stopPropagation(); onDelete(contract.id); }}
              className={`opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/10 hover:text-red-400 transition-all ${isDark ? "text-white/30" : "text-gray-400"}`}>
              <Trash2 size={11}/>
            </button>
            <ChevronRight size={13} className={isDark ? "text-white/20" : "text-gray-400"}/>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] px-2 py-0.5 rounded-full border font-medium"
            style={{ color: gold + "cc", borderColor: gold + "30", background: gold + "0d" }}>
            {t?.label ?? contract.contract_type}
          </span>
          {contract.amount != null && (
            <span className={`text-xs ${isDark ? "text-white/35" : "text-gray-500"}`}>{fmtEur(contract.amount)}</span>
          )}
          <span className={`text-xs ml-auto ${isDark ? "text-white/20" : "text-gray-400"}`}>
            {new Date(contract.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
