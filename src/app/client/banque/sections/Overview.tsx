"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight, ArrowDownRight, Wallet, AlertCircle,
  TrendingUp, Clock, CheckCircle2, RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD, fmtAmount, fmtDateShort, getCatColor, type BankAccount, type BankTransaction } from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
  orgId?: string | null;
  onGoTo: (section: string) => void;
}

export default function Overview({ userId, isDark, orgId, onGoTo }: Props) {
  const t = tok(isDark);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [recentTx, setRecentTx] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    let accQ = supabase.from("treasury_accounts").select("*").order("is_default", { ascending: false });
    if (orgId) accQ = accQ.eq("organization_id", orgId);
    else accQ = accQ.eq("user_id", userId!);

    const [{ data: accs }, { data: txs }] = await Promise.all([
      accQ,
      supabase.from("treasury_transactions")
        .select("*")
        .eq("user_id", userId!)
        .gte("date", since)
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(100),
    ]);

    setAccounts((accs ?? []) as BankAccount[]);
    setRecentTx((txs ?? []) as BankTransaction[]);
    setLoading(false);
  }

  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const income30  = recentTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense30 = recentTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const unmatched = recentTx.filter(t => t.reconciliation_status === "unmatched").length;
  const pending   = recentTx.filter(t => t.status === "pending").length;

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ color: t.text3 }}>
      <RefreshCw size={20} className="animate-spin mr-2" />
      Chargement…
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Solde total + KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Solde total */}
        <div className="md:col-span-1 rounded-2xl p-5"
          style={{ background: t.glassLg, border: `1px solid ${t.border}` }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: t.text3 }}>
            Solde total
          </p>
          <p className="text-3xl font-black tabular-nums"
            style={{ color: totalBalance >= 0 ? "#10b981" : "#ef4444" }}>
            {fmtAmount(totalBalance)}
          </p>
          <p className="text-xs mt-1" style={{ color: t.text3 }}>
            {accounts.length} compte{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Entrées 30j */}
        <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={14} style={{ color: "#10b981" }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.text3 }}>
              Entrées (30j)
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "#10b981" }}>
            +{fmtAmount(income30)}
          </p>
          <p className="text-xs mt-1" style={{ color: t.text3 }}>
            {recentTx.filter(t => t.type === "income").length} transactions
          </p>
        </div>

        {/* Sorties 30j */}
        <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownRight size={14} style={{ color: "#ef4444" }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.text3 }}>
              Sorties (30j)
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "#ef4444" }}>
            -{fmtAmount(expense30)}
          </p>
          <p className="text-xs mt-1" style={{ color: t.text3 }}>
            {recentTx.filter(t => t.type === "expense").length} transactions
          </p>
        </div>
      </div>

      {/* Alertes */}
      {(unmatched > 0 || pending > 0) && (
        <div className="space-y-2">
          {unmatched > 10 && (
            <button
              onClick={() => onGoTo("rapprochement")}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <AlertCircle size={15} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <span className="text-sm" style={{ color: "#f59e0b" }}>
                {unmatched} transaction{unmatched !== 1 ? "s" : ""} non rapprochée{unmatched !== 1 ? "s" : ""}
              </span>
              <span className="ml-auto text-xs" style={{ color: "#f59e0b" }}>Rapprocher →</span>
            </button>
          )}
          {pending > 0 && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Clock size={15} style={{ color: "#818cf8", flexShrink: 0 }} />
              <span className="text-sm" style={{ color: "#818cf8" }}>
                {pending} transaction{pending !== 1 ? "s" : ""} en attente de validation
              </span>
            </div>
          )}
        </div>
      )}

      {/* Comptes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: t.text2 }}>Mes comptes</h3>
          <button onClick={() => onGoTo("comptes")} className="text-xs" style={{ color: GOLD }}>
            Gérer →
          </button>
        </div>
        {accounts.length === 0 ? (
          <button
            onClick={() => onGoTo("comptes")}
            className="w-full rounded-2xl p-6 text-center"
            style={{ background: t.glass, border: `1px dashed ${t.border}` }}
          >
            <Wallet size={28} className="mx-auto mb-2" style={{ color: `${GOLD}60` }} />
            <p className="text-sm font-medium" style={{ color: t.text2 }}>Aucun compte configuré</p>
            <p className="text-xs mt-1" style={{ color: t.text3 }}>Ajoutez votre premier compte bancaire</p>
          </button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map(acc => (
              <div key={acc.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: t.glass, border: `1px solid ${t.border}` }}
              >
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: (acc.color ?? GOLD) + "22" }}>
                  <Wallet size={14} style={{ color: acc.color ?? GOLD }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{acc.name}</p>
                  <p className="text-xs truncate" style={{ color: t.text3 }}>
                    {acc.bank || "Banque"} {acc.iban ? `· ${acc.iban.slice(-4)}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold tabular-nums"
                    style={{ color: acc.balance >= 0 ? "#10b981" : "#ef4444" }}>
                    {fmtAmount(acc.balance, acc.currency)}
                  </p>
                  <p className="text-xs" style={{ color: t.text4 }}>{acc.currency}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dernières transactions */}
      {recentTx.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: t.text2 }}>Dernières transactions</h3>
            <button onClick={() => onGoTo("transactions")} className="text-xs" style={{ color: GOLD }}>
              Voir tout →
            </button>
          </div>
          <div className="space-y-1.5">
            {recentTx.slice(0, 8).map(tx => {
              const catColor = getCatColor(tx.category);
              return (
                <div key={tx.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: (tx.type === "income" ? "#10b981" : "#ef4444") + "18" }}>
                    {tx.type === "income"
                      ? <TrendingUp size={12} style={{ color: "#10b981" }} />
                      : <ArrowDownRight size={12} style={{ color: "#ef4444" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: t.text }}>{tx.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: catColor + "18", color: catColor }}>
                        {tx.category}
                      </span>
                      <span className="text-[10px]" style={{ color: t.text4 }}>{fmtDateShort(tx.date)}</span>
                      {tx.reconciliation_status === "reconciled" && (
                        <CheckCircle2 size={10} style={{ color: "#10b981" }} />
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-bold tabular-nums flex-shrink-0"
                    style={{ color: tx.type === "income" ? "#10b981" : "#ef4444" }}>
                    {tx.type === "income" ? "+" : "-"}{fmtAmount(tx.amount, tx.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
