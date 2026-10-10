"use client";

import { useState, useEffect } from "react";
import { FileCheck2, RefreshCw, Search, Download, Filter, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, fmt, fmtDate, periodeLabel, GOLD, DECL_STATUT_CFG } from "../decl-utils";
import { generateDeclPDF } from "../decl-pdf";
import type { Declaration, DeclStatut } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  add: (msg: string, type?: "success" | "error") => void;
}

const ALL_STATUTS: DeclStatut[] = ["brouillon","en_preparation","a_valider","validee","deposee","accusee","rejetee"];

export default function HistoriqueSection({ userId, isDark, add }: Props) {
  const t = tok(isDark);
  const [decls, setDecls] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<DeclStatut | "toutes">("toutes");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase.from("decl_declarations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setDecls((data as Declaration[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function deleteDecl(id: string) {
    const { error } = await supabase.from("decl_declarations").delete().eq("id", id);
    if (error) { add("Erreur suppression : " + error.message, "error"); return; }
    setDecls(prev => prev.filter(d => d.id !== id));
    add("Déclaration supprimée", "success");
  }

  function exportCsv() {
    const rows = [
      ["Libellé","Type","Période","Échéance","Montant","Devise","Statut"],
      ...filtered.map(d => [
        d.libelle,
        d.type_declaration,
        periodeLabel(d.periode_debut, d.periode_fin),
        d.date_echeance ?? "",
        d.montant_principal?.toString() ?? "",
        d.devise,
        DECL_STATUT_CFG[d.statut].label,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "declarations.csv";
    a.click(); URL.revokeObjectURL(url);
  }

  const filtered = decls.filter(d => {
    const matchSearch = !search || d.libelle.toLowerCase().includes(search.toLowerCase()) || d.type_declaration.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "toutes" || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const inputStyle = { background: t.glassMd, border: `1px solid ${t.border}`, color: t.text };

  return (
    <div className="space-y-5">
      {/* Barre de recherche + filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.text3 }} />
          <input
            className="w-full rounded-xl pl-8 pr-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="Rechercher…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: t.text3 }} />
          <select
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            value={filterStatut}
            onChange={e => { setFilterStatut(e.target.value as DeclStatut | "toutes"); setPage(0); }}
          >
            <option value="toutes">Tous les statuts</option>
            {ALL_STATUTS.map(s => (
              <option key={s} value={s}>{DECL_STATUT_CFG[s].label}</option>
            ))}
          </select>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
          >
            <Download size={12} /> Export CSV
          </button>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center">
          <RefreshCw size={18} className="animate-spin mx-auto" style={{ color: t.text3 }} />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl py-12 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <FileCheck2 size={20} className="mx-auto mb-3" style={{ color: t.text3 }} />
          <p className="text-sm" style={{ color: t.text3 }}>
            {decls.length === 0 ? "Aucune déclaration enregistrée" : "Aucun résultat pour ces filtres"}
          </p>
        </div>
      )}

      {!loading && paged.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
            <span className="text-xs" style={{ color: t.text3 }}>
              {filtered.length} déclaration{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
          {paged.map((d, i) => {
            const cfg = DECL_STATUT_CFG[d.statut];
            const isExpanded = expanded === d.id;
            return (
              <div key={d.id} style={{ borderBottom: i < paged.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : d.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:bg-white/5"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg.color}15` }}>
                    <FileCheck2 size={14} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: t.text }}>{d.libelle}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: t.text3 }}>{periodeLabel(d.periode_debut, d.periode_fin)}</span>
                      {d.date_echeance && (
                        <span className="text-xs" style={{ color: t.text4 }}>· Ech. {fmtDate(d.date_echeance)}</span>
                      )}
                    </div>
                  </div>
                  {d.montant_principal != null && (
                    <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: t.text }}>
                      {fmt(d.montant_principal, d.devise)}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="rounded-xl p-4" style={{ background: t.glassMd, border: `1px solid ${t.borderSoft}` }}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
                        <div><span style={{ color: t.text3 }}>Type</span><br /><strong style={{ color: t.text }}>{d.type_declaration}</strong></div>
                        <div><span style={{ color: t.text3 }}>Pays</span><br /><strong style={{ color: t.text }}>{d.pays}</strong></div>
                        {d.canal_transmission && (
                          <div><span style={{ color: t.text3 }}>Canal</span><br /><strong style={{ color: t.text }}>{d.canal_transmission}</strong></div>
                        )}
                        {d.date_transmission && (
                          <div><span style={{ color: t.text3 }}>Transmis le</span><br /><strong style={{ color: t.text }}>{fmtDate(d.date_transmission)}</strong></div>
                        )}
                        {d.reference_transmission && (
                          <div><span style={{ color: t.text3 }}>Référence</span><br /><strong style={{ color: t.text }}>{d.reference_transmission}</strong></div>
                        )}
                      </div>
                      {d.notes && (
                        <p className="text-xs mb-3" style={{ color: t.text2 }}>{d.notes}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateDeclPDF(d)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95"
                          style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30`, color: GOLD }}
                        >
                          <FileText size={11} /> PDF
                        </button>
                        <button
                          onClick={() => deleteDecl(d.id)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95"
                          style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-2 rounded-xl disabled:opacity-40"
            style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
          >Précédent</button>
          <span className="text-xs" style={{ color: t.text3 }}>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs px-3 py-2 rounded-xl disabled:opacity-40"
            style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
          >Suivant</button>
        </div>
      )}
    </div>
  );
}
