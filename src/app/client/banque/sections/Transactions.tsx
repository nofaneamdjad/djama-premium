"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, Plus, X, ChevronDown, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, AlertCircle, Download, Tag, FileText, Pencil, Save,
} from "lucide-react";
import {
  tok, GOLD, fmtAmount, fmtDate, getCatColor, getCatLabel,
  INCOME_CATS, EXPENSE_CATS, type BankTransaction,
} from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
  orgId?: string | null;
  add: (msg: string, type?: "success" | "error") => void;
}

const RECON_LABELS: Record<string, { label: string; color: string }> = {
  reconciled:   { label: "Rapproché",   color: "#10b981" },
  unmatched:    { label: "Non rapproché", color: "#f59e0b" },
  pending:      { label: "En attente",  color: "#818cf8" },
  ignored:      { label: "Ignoré",      color: "#6b7280" },
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Validé", pending: "En attente", cancelled: "Annulé",
};

export default function Transactions({ userId, isDark, add }: Props) {
  const t = tok(isDark);
  const inp = {
    background: t.glass, border: `1px solid ${t.border}`,
    color: t.text, borderRadius: "0.75rem",
    padding: "0.55rem 0.875rem", fontSize: "0.875rem",
    outline: "none",
  } as React.CSSProperties;

  const [txs, setTxs]           = useState<BankTransaction[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(0);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BankTransaction>>({});
  const [saving, setSaving]     = useState(false);

  // Filtres
  const [q, setQ]               = useState("");
  const [type, setType]         = useState("");
  const [cat, setCat]           = useState("");
  const [recon, setRecon]       = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showNew, setShowNew]   = useState(false);

  // Formulaire nouvelle transaction
  const [newForm, setNewForm] = useState({
    type: "income", label: "", amount: "", category: "other_income",
    date: new Date().toISOString().slice(0, 10), notes: "",
    payment_method: "virement",
  });

  const LIMIT = 50;

  const load = useCallback(async (reset = false) => {
    if (!userId) return;
    setLoading(true);
    const p = reset ? 0 : page;
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(p * LIMIT),
    });
    if (q.trim())    params.set("q", q.trim());
    if (type)        params.set("type", type);
    if (cat)         params.set("category", cat);
    if (recon)       params.set("reconciliation_status", recon);
    if (dateFrom)    params.set("date_from", dateFrom);
    if (dateTo)      params.set("date_to", dateTo);

    const res = await fetch(`/api/banque/transactions?${params}`);
    const json = await res.json();
    if (reset) {
      setTxs(json.transactions ?? []);
      setPage(0);
    } else {
      setTxs(prev => [...prev, ...(json.transactions ?? [])]);
    }
    setTotal(json.count ?? 0);
    setLoading(false);
  }, [userId, q, type, cat, recon, dateFrom, dateTo, page]);

  useEffect(() => { load(true); }, [userId, q, type, cat, recon, dateFrom, dateTo]);

  async function handleCreate() {
    if (!newForm.label.trim()) { add("Libellé requis", "error"); return; }
    if (!newForm.amount || isNaN(parseFloat(newForm.amount))) { add("Montant invalide", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/banque/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newForm.type,
        label: newForm.label.trim(),
        amount: Math.abs(parseFloat(newForm.amount)),
        category: newForm.category,
        date: newForm.date,
        notes: newForm.notes.trim() || null,
        payment_method: newForm.payment_method,
      }),
    });
    if (res.ok) {
      add("Transaction créée");
      setShowNew(false);
      setNewForm({ type: "income", label: "", amount: "", category: "other_income",
        date: new Date().toISOString().slice(0, 10), notes: "", payment_method: "virement" });
      load(true);
    } else {
      const e = await res.json();
      add(e.error ?? "Erreur", "error");
    }
    setSaving(false);
  }

  async function handlePatch(id: string) {
    setSaving(true);
    const res = await fetch(`/api/banque/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    if (res.ok) { add("Transaction modifiée"); setEditId(null); setEditData({}); load(true); }
    else { const e = await res.json(); add(e.error ?? "Erreur", "error"); }
    setSaving(false);
  }

  function startEdit(tx: BankTransaction) {
    setEditId(tx.id);
    setEditData({ category: tx.category, notes: tx.notes ?? "", tags: tx.tags ?? [] });
  }

  function exportCSV() {
    const rows = [
      ["Date", "Libellé", "Type", "Montant", "Devise", "Catégorie", "Rapprochement"].join(";"),
      ...txs.map(tx => [
        tx.date, `"${tx.label.replace(/"/g, '""')}"`,
        tx.type === "income" ? "Entrée" : "Sortie",
        tx.type === "income" ? tx.amount : -tx.amount,
        tx.currency ?? "EUR",
        getCatLabel(tx.category),
        RECON_LABELS[tx.reconciliation_status ?? "unmatched"]?.label ?? "",
      ].join(";"))
    ].join("\n");
    const blob = new Blob(["﻿" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const allCats = [...INCOME_CATS, ...EXPENSE_CATS];
  const activeCats = type === "income" ? INCOME_CATS : type === "expense" ? EXPENSE_CATS : allCats;
  const hasFilters = type || cat || recon || dateFrom || dateTo;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 min-w-0 rounded-xl px-3 py-2.5"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <Search size={13} style={{ color: t.text3, flexShrink: 0 }} />
          <input className="flex-1 min-w-0 bg-transparent outline-none text-sm"
            style={{ color: t.text }} placeholder="Rechercher…"
            value={q} onChange={e => setQ(e.target.value)} />
          {q && <button onClick={() => setQ("")}><X size={12} style={{ color: t.text3 }} /></button>}
        </div>

        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={{
            background: hasFilters ? `${GOLD}18` : t.glass,
            border: `1px solid ${hasFilters ? GOLD + "50" : t.border}`,
            color: hasFilters ? GOLD : t.text2,
          }}>
          <Filter size={13} /> Filtres
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />}
        </button>

        <button onClick={exportCSV}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}>
          <Download size={13} /> Export
        </button>

        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Filtres étendus */}
      {showFilters && (
        <div className="rounded-2xl p-4 mb-5 grid grid-cols-2 sm:grid-cols-3 gap-3"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: `${GOLD}90` }}>Type</label>
            <select style={{ ...inp, width: "100%" }} value={type} onChange={e => { setType(e.target.value); setCat(""); }}>
              <option value="">Tous</option>
              <option value="income">Entrées</option>
              <option value="expense">Sorties</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: `${GOLD}90` }}>Catégorie</label>
            <select style={{ ...inp, width: "100%" }} value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">Toutes</option>
              {activeCats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: `${GOLD}90` }}>Rapprochement</label>
            <select style={{ ...inp, width: "100%" }} value={recon} onChange={e => setRecon(e.target.value)}>
              <option value="">Tous</option>
              {Object.entries(RECON_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: `${GOLD}90` }}>Du</label>
            <input type="date" style={{ ...inp, width: "100%" }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: `${GOLD}90` }}>Au</label>
            <input type="date" style={{ ...inp, width: "100%" }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setType(""); setCat(""); setRecon(""); setDateFrom(""); setDateTo(""); }}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: t.glassMd, border: `1px solid ${t.border}`, color: t.text3 }}>
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Compteur */}
      <p className="text-xs mb-3" style={{ color: t.text3 }}>
        {loading ? "Chargement…" : `${total} transaction${total !== 1 ? "s" : ""}`}
        {txs.length < total && ` — ${txs.length} affichées`}
      </p>

      {/* Liste */}
      <div className="space-y-1.5">
        {txs.map(tx => {
          const catColor = getCatColor(tx.category);
          const reconInfo = RECON_LABELS[tx.reconciliation_status ?? "unmatched"];
          const isEditing = editId === tx.id;

          return (
            <div key={tx.id}
              className="rounded-xl overflow-hidden"
              style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              {/* Ligne principale */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: (tx.type === "income" ? "#10b981" : "#ef4444") + "18" }}>
                  {tx.type === "income"
                    ? <ArrowUpRight size={12} style={{ color: "#10b981" }} />
                    : <ArrowDownRight size={12} style={{ color: "#ef4444" }} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: t.text }}>{tx.label}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: catColor + "18", color: catColor }}>
                      {getCatLabel(tx.category)}
                    </span>
                    <span className="text-[10px]" style={{ color: t.text4 }}>{fmtDate(tx.date)}</span>
                    {tx.reconciliation_status && (
                      <span className="text-[10px]" style={{ color: reconInfo?.color }}>
                        {reconInfo?.label}
                      </span>
                    )}
                    {tx.status === "pending" && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "#818cf8" }}>
                        <Clock size={9} /> En attente
                      </span>
                    )}
                    {tx.reconciliation_status === "reconciled" && (
                      <CheckCircle2 size={10} style={{ color: "#10b981" }} />
                    )}
                    {tx.tags && tx.tags.length > 0 && tx.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: `${GOLD}18`, color: GOLD }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <p className="text-sm font-bold tabular-nums"
                    style={{ color: tx.type === "income" ? "#10b981" : "#ef4444" }}>
                    {tx.type === "income" ? "+" : "-"}{fmtAmount(tx.amount, tx.currency)}
                  </p>
                  <button onClick={() => isEditing ? setEditId(null) : startEdit(tx)}
                    className="p-1.5 rounded-lg" style={{ color: t.text3 }}>
                    {isEditing ? <ChevronDown size={12} /> : <Pencil size={12} />}
                  </button>
                </div>
              </div>

              {/* Ligne d'édition */}
              {isEditing && (
                <div className="px-3 pb-3 pt-1 space-y-3"
                  style={{ borderTop: `1px solid ${t.border}` }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wide"
                        style={{ color: `${GOLD}80` }}>Catégorie</label>
                      <select style={{ ...inp, width: "100%", fontSize: "0.8rem", padding: "0.4rem 0.7rem" }}
                        value={editData.category ?? tx.category}
                        onChange={e => setEditData(p => ({ ...p, category: e.target.value }))}>
                        <optgroup label="Entrées">
                          {INCOME_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </optgroup>
                        <optgroup label="Sorties">
                          {EXPENSE_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold mb-1 uppercase tracking-wide"
                        style={{ color: `${GOLD}80` }}>Notes</label>
                      <input style={{ ...inp, width: "100%", fontSize: "0.8rem", padding: "0.4rem 0.7rem" }}
                        placeholder="Commentaire…"
                        value={editData.notes ?? tx.notes ?? ""}
                        onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditId(null); setEditData({}); }}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: t.glassMd, color: t.text3, border: `1px solid ${t.border}` }}>
                      Annuler
                    </button>
                    <button onClick={() => handlePatch(tx.id)} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
                      <Save size={11} /> Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charger plus */}
      {txs.length < total && !loading && (
        <button onClick={() => { setPage(p => p + 1); load(false); }}
          className="w-full mt-4 py-3 rounded-xl text-sm"
          style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text3 }}>
          Charger plus ({total - txs.length} restantes)
        </button>
      )}

      {!loading && txs.length === 0 && (
        <div className="py-16 text-center">
          <FileText size={32} className="mx-auto mb-3" style={{ color: `${GOLD}40` }} />
          <p className="text-sm" style={{ color: t.text3 }}>Aucune transaction</p>
        </div>
      )}

      {/* Modal nouvelle transaction */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowNew(false); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: isDark ? "#151520" : "#fff", border: `1px solid ${t.border}` }}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <p className="font-semibold text-sm" style={{ color: t.text }}>Nouvelle transaction manuelle</p>
              <button onClick={() => setShowNew(false)}><X size={16} style={{ color: t.text3 }} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                {["income", "expense"].map(opt => (
                  <button key={opt} onClick={() => setNewForm(p => ({ ...p, type: opt,
                    category: opt === "income" ? "other_income" : "other_expense" }))}
                    className="flex-1 py-2.5 text-sm font-medium"
                    style={{
                      background: newForm.type === opt ? (opt === "income" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                      color: newForm.type === opt ? (opt === "income" ? "#10b981" : "#ef4444") : t.text3,
                    }}>
                    {opt === "income" ? "Entrée" : "Sortie"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: `${GOLD}90` }}>Montant *</label>
                  <input type="number" step="0.01" min="0" style={{ ...inp, width: "100%" }}
                    placeholder="0.00" value={newForm.amount}
                    onChange={e => setNewForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: `${GOLD}90` }}>Date *</label>
                  <input type="date" style={{ ...inp, width: "100%" }} value={newForm.date}
                    onChange={e => setNewForm(p => ({ ...p, date: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Libellé *</label>
                <input style={{ ...inp, width: "100%" }} placeholder="Description de la transaction"
                  value={newForm.label} onChange={e => setNewForm(p => ({ ...p, label: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Catégorie</label>
                <select style={{ ...inp, width: "100%" }} value={newForm.category}
                  onChange={e => setNewForm(p => ({ ...p, category: e.target.value }))}>
                  {(newForm.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Notes</label>
                <input style={{ ...inp, width: "100%" }} placeholder="Optionnel"
                  value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4"
              style={{ borderTop: `1px solid ${t.border}` }}>
              <button onClick={() => setShowNew(false)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: t.glass, color: t.text2, border: `1px solid ${t.border}` }}>
                Annuler
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}50` }}>
                <Plus size={13} />
                {saving ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
