"use client";

/**
 * Pagination — navigation de pages cohérente pour toutes les listes.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page:         number;
  totalPages:   number;
  onPageChange: (p: number) => void;
  totalItems:   number;
  pageSize:     number;
  className?:   string;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalItems);

  // Génère les numéros de page à afficher (avec ellipsis)
  function pages(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const result: (number | "...")[] = [1];
    if (page > 3) result.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      result.push(i);
    }
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }

  const btnBase = "h-8 min-w-[2rem] px-2 rounded-lg text-xs font-semibold transition";

  return (
    <div className={`flex items-center justify-between gap-4 pt-3 ${className}`}>
      {/* Résumé */}
      <p className="text-xs text-white/30 shrink-0">
        {from}–{to} sur <span className="font-semibold text-white/50">{totalItems}</span>
      </p>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Page précédente"
          className={`${btnBase} flex items-center justify-center border border-white/[0.07] text-white/40 hover:border-white/15 hover:text-white/70 disabled:opacity-25 disabled:cursor-not-allowed`}
        >
          <ChevronLeft size={14} />
        </button>

        {pages().map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-xs text-white/20">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={`${btnBase} ${
                p === page
                  ? "bg-white/[0.09] border border-white/15 text-white"
                  : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Page suivante"
          className={`${btnBase} flex items-center justify-center border border-white/[0.07] text-white/40 hover:border-white/15 hover:text-white/70 disabled:opacity-25 disabled:cursor-not-allowed`}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
