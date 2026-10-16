"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { tok, GOLD, fmtAmount, getCatColor, getCatLabel, INCOME_CATS, EXPENSE_CATS, type BankTransaction } from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
  orgId?: string | null;
}

type Period = "30" | "90" | "180" | "365";

interface MonthBucket {
  month: string; // "2025-01"
  income: number;
  expense: number;
}

interface CatBucket {
  category: string;
  total: number;
  count: number;
}

function buildMonthlyBuckets(txs: BankTransaction[], days: number): MonthBucket[] {
  const since = new Date(Date.now() - days * 86400000);
  const map: Record<string, MonthBucket> = {};

  for (const tx of txs) {
    const d = new Date(tx.date);
    if (d < since) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
    if (tx.type === "income") map[key].income += tx.amount;
    else map[key].expense += tx.amount;
  }

  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

function buildCatBuckets(txs: BankTransaction[], txType: "income" | "expense", days: number): CatBucket[] {
  const since = new Date(Date.now() - days * 86400000);
  const map: Record<string, CatBucket> = {};

  for (const tx of txs) {
    if (tx.type !== txType) continue;
    if (new Date(tx.date) < since) continue;
    if (!map[tx.category]) map[tx.category] = { category: tx.category, total: 0, count: 0 };
    map[tx.category].total += tx.amount;
    map[tx.category].count += 1;
  }

  return Object.values(map).sort((a, b) => b.total - a.total);
}

export default function Analyse({ userId, isDark }: Props) {
  const t = tok(isDark);
  const [txs, setTxs]       = useState<BankTransaction[]>([]);
  const [period, setPeriod] = useState<Period>("90");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
    const { data } = await supabase.from("treasury_transactions")
      .select("*").eq("user_id", userId!).gte("date", since)
      .eq("status", "completed").order("date", { ascending: true }).limit(2000);
    setTxs((data ?? []) as BankTransaction[]);
    setLoading(false);
  }

  const days = parseInt(period);
  const monthly = buildMonthlyBuckets(txs, days);
  const catBuckets = buildCatBuckets(txs, catType, days);
  const catTotal = catBuckets.reduce((s, c) => s + c.total, 0);

  // Balance évolution — solde cumulatif
  const since = new Date(Date.now() - days * 86400000);
  const filteredTxs = txs.filter(tx => new Date(tx.date) >= since);
  const incomeTotal = filteredTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseTotal = filteredTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netFlow = incomeTotal - expenseTotal;

  // Bar chart dimensions
  const BAR_W = 56;
  const BAR_GAP = 8;
  const BAR_MAX_H = 120;
  const chartW = monthly.length * (BAR_W + BAR_GAP);
  const maxVal = monthly.reduce((m, b) => Math.max(m, b.income, b.expense), 1);

  function monthLabel(m: string) {
    const [y, mo] = m.split("-");
    const names = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    return names[parseInt(mo) - 1] + " " + y.slice(2);
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: t.text }}>Analyse financière</h3>
        <div className="flex gap-1.5">
          {(["30", "90", "180", "365"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-xl text-xs"
              style={{
                background: period === p ? `${GOLD}18` : t.glass,
                border: `1px solid ${period === p ? GOLD + "50" : t.border}`,
                color: period === p ? GOLD : t.text3,
              }}>
              {p === "365" ? "1 an" : `${p}j`}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-center py-10" style={{ color: t.text3 }}>Chargement…</p>}

      {!loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: t.text3 }}>Entrées</p>
              <p className="text-xl font-black tabular-nums" style={{ color: "#10b981" }}>+{fmtAmount(incomeTotal)}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: t.text3 }}>Sorties</p>
              <p className="text-xl font-black tabular-nums" style={{ color: "#ef4444" }}>-{fmtAmount(expenseTotal)}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: t.text3 }}>Flux net</p>
              <p className="text-xl font-black tabular-nums"
                style={{ color: netFlow >= 0 ? "#10b981" : "#ef4444" }}>
                {netFlow >= 0 ? "+" : ""}{fmtAmount(netFlow)}
              </p>
            </div>
          </div>

          {/* Graphique mensuel */}
          {monthly.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              <p className="text-sm font-semibold mb-4" style={{ color: t.text }}>Flux par mois</p>
              <div className="overflow-x-auto pb-2">
                <svg width={Math.max(chartW, 300)} height={180} style={{ display: "block" }}>
                  {/* Grille */}
                  {[0, 0.25, 0.5, 0.75, 1].map(f => {
                    const y = 10 + (1 - f) * BAR_MAX_H;
                    return (
                      <line key={f} x1={0} x2={chartW || 300} y1={y} y2={y}
                        stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={1} />
                    );
                  })}

                  {/* Barres */}
                  {monthly.map((b, i) => {
                    const x = i * (BAR_W + BAR_GAP);
                    const incH = Math.max(2, (b.income / maxVal) * BAR_MAX_H);
                    const expH = Math.max(2, (b.expense / maxVal) * BAR_MAX_H);
                    const bw = (BAR_W - 4) / 2;

                    return (
                      <g key={b.month}>
                        {/* Entrée */}
                        <rect x={x + 2} y={10 + BAR_MAX_H - incH}
                          width={bw} height={incH} rx={3}
                          fill={`rgba(16,185,129,0.7)`} />
                        {/* Sortie */}
                        <rect x={x + 2 + bw + 2} y={10 + BAR_MAX_H - expH}
                          width={bw} height={expH} rx={3}
                          fill={`rgba(239,68,68,0.6)`} />
                        {/* Label */}
                        <text x={x + BAR_W / 2} y={175}
                          textAnchor="middle" fontSize={9}
                          fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}>
                          {monthLabel(b.month)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              {/* Légende */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: "rgba(16,185,129,0.7)" }} />
                  <span className="text-xs" style={{ color: t.text3 }}>Entrées</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: "rgba(239,68,68,0.6)" }} />
                  <span className="text-xs" style={{ color: t.text3 }}>Sorties</span>
                </div>
              </div>
            </div>
          )}

          {/* Répartition par catégorie */}
          <div className="rounded-2xl p-4" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: t.text }}>Répartition par catégorie</p>
              <div className="flex gap-1.5">
                {(["expense", "income"] as const).map(ty => (
                  <button key={ty} onClick={() => setCatType(ty)}
                    className="px-3 py-1.5 rounded-xl text-xs"
                    style={{
                      background: catType === ty ? (ty === "expense" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)") : "transparent",
                      border: `1px solid ${catType === ty ? (ty === "expense" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)") : t.border}`,
                      color: catType === ty ? (ty === "expense" ? "#ef4444" : "#10b981") : t.text3,
                    }}>
                    {ty === "expense" ? "Sorties" : "Entrées"}
                  </button>
                ))}
              </div>
            </div>

            {catBuckets.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: t.text3 }}>Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {catBuckets.slice(0, 8).map(c => {
                  const pct = catTotal > 0 ? (c.total / catTotal) * 100 : 0;
                  const color = getCatColor(c.category);
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-xs" style={{ color: t.text2 }}>{getCatLabel(c.category)}</span>
                          <span className="text-[10px]" style={{ color: t.text4 }}>× {c.count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tabular-nums" style={{ color: t.text }}>
                            {fmtAmount(c.total)}
                          </span>
                          <span className="text-[10px] w-8 text-right" style={{ color: t.text3 }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: color + "20" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
