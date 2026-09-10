"use client";

import { useState } from "react";
import { Tag, Plus, Copy, Check, Trash2 } from "lucide-react";

const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";
const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";

interface Coupon {
  code: string;
  discount: string;
  type: "percent" | "fixed";
  uses: number;
  maxUses: number | null;
  active: boolean;
  expiresAt: string | null;
}

const DEMO_COUPONS: Coupon[] = [
  { code: "DJAMA10", discount: "10", type: "percent", uses: 3, maxUses: null,  active: true,  expiresAt: null },
  { code: "PROMO20", discount: "20", type: "percent", uses: 1, maxUses: 50,    active: true,  expiresAt: "2025-12-31" },
  { code: "FREE1M",  discount: "11.90", type: "fixed", uses: 0, maxUses: 10,   active: false, expiresAt: "2025-06-30" },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] text-white/35 transition hover:bg-white/[0.12] hover:text-white/70"
    >
      {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
    </button>
  );
}

export default function CouponsPage() {
  const [coupons] = useState<Coupon[]>(DEMO_COUPONS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.15rem] font-black tracking-tight text-white">Coupons</h1>
          <p className="mt-0.5 text-[0.75rem] text-white/35">Codes promo et réductions</p>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[0.78rem] font-semibold text-black transition hover:opacity-90"
          style={{ background: GOLD }}
        >
          <Plus size={13} /> Nouveau coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Actifs", value: coupons.filter(c => c.active).length, color: "#4ade80" },
          { label: "Utilisations totales", value: coupons.reduce((s, c) => s + c.uses, 0), color: GOLD },
          { label: "Inactifs", value: coupons.filter(c => !c.active).length, color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border p-4 text-center" style={{ background: CARD, borderColor: BORDER }}>
            <p className="text-[1.4rem] font-black text-white tabular-nums">{value}</p>
            <p className="mt-0.5 text-[0.72rem] font-semibold text-white/30">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: BORDER }}>
              {["Code", "Réduction", "Utilisations", "Expiration", "Statut", ""].map(h => (
                <th key={h} className="px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-white/25">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.map((c, i) => (
              <tr key={c.code} className="group border-b transition hover:bg-white/[0.02]" style={{ borderColor: i === coupons.length - 1 ? "transparent" : BORDER }}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `rgba(${GOLDR},0.10)` }}>
                      <Tag size={11} style={{ color: GOLD }} />
                    </div>
                    <code className="rounded-lg bg-white/[0.07] px-2 py-0.5 text-[0.8rem] font-bold text-white/80">{c.code}</code>
                    <CopyBtn text={c.code} />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[0.85rem] font-bold text-white/70">
                  {c.type === "percent" ? `${c.discount}%` : `${c.discount} €`}
                </td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/45">
                  {c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="px-5 py-3.5 text-[0.78rem] text-white/30">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-FR") : "Aucune"}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${c.active ? "text-emerald-400 bg-emerald-400/10" : "text-white/25 bg-white/[0.05]"}`}>
                    {c.active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/5 text-red-400 transition hover:bg-red-500/15">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <p className="text-center text-[0.72rem] text-white/20">
        Les coupons sont gérés via Stripe. Connectez Stripe pour les créer dynamiquement.
      </p>
    </div>
  );
}
