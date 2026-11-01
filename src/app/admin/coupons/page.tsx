"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Tag, Plus, Copy, Check, Trash2, RefreshCw, Loader2,
  ToggleLeft, ToggleRight, Calendar, X, AlertTriangle,
} from "lucide-react";
import { V } from "@/components/hq";

interface Coupon {
  id: string; code: string; discount: number; type: "percent" | "fixed";
  uses: number; max_uses: number | null; active: boolean;
  expires_at: string | null; created_by: string | null; created_at: string;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function discountLabel(c: Coupon) {
  return c.type === "percent" ? `${c.discount}%` : `${c.discount}€`;
}

function isExpired(c: Coupon) {
  return c.expires_at ? new Date(c.expires_at) < new Date() : false;
}

export default function CouponsPage() {
  const [coupons,  setCoupons]  = useState<Coupon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState<string | null>(null);
  const [copied,   setCopied]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Formulaire
  const [showForm,    setShowForm]    = useState(false);
  const [fCode,       setFCode]       = useState("");
  const [fDiscount,   setFDiscount]   = useState("10");
  const [fType,       setFType]       = useState<"percent"|"fixed">("percent");
  const [fMaxUses,    setFMaxUses]    = useState("");
  const [fExpires,    setFExpires]    = useState("");
  const [fSaving,     setFSaving]     = useState(false);
  const [fErr,        setFErr]        = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/coupons");
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      setCoupons((await r.json()).coupons ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function copy(code: string) {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  async function toggle(c: Coupon) {
    setToggling(c.id);
    try {
      const r = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      if (r.ok) await load(true);
    } finally { setToggling(null); }
  }

  async function del(id: string) {
    if (!confirm("Supprimer ce coupon ?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (r.ok) await load(true);
      else setErr((await r.json()).error ?? "Erreur");
    } finally { setDeleting(null); }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFSaving(true); setFErr(null);
    try {
      const r = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code:       fCode.toUpperCase(),
          discount:   parseFloat(fDiscount) || 0,
          type:       fType,
          max_uses:   fMaxUses ? parseInt(fMaxUses) : null,
          expires_at: fExpires ? new Date(fExpires).toISOString() : null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      setShowForm(false);
      setFCode(""); setFDiscount("10"); setFType("percent"); setFMaxUses(""); setFExpires("");
      await load(true);
    } catch (e) { setFErr(e instanceof Error ? e.message : "Erreur"); }
    finally { setFSaving(false); }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[1.3rem] font-black tracking-tight" style={{ color: V.text }}>
            <Tag size={18} style={{ color: V.gold }} />
            Codes promo
          </h1>
          <p className="mt-0.5 text-[0.78rem]" style={{ color: V.textMuted }}>
            {coupons.length} code{coupons.length !== 1 ? "s" : ""} configuré{coupons.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[0.78rem] font-medium transition"
            style={{ borderColor: V.border, color: V.textMuted }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[0.78rem] font-semibold transition"
            style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}>
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? "Annuler" : "Nouveau coupon"}
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={create} className="rounded-2xl border p-5 space-y-4"
          style={{ background: V.card, borderColor: V.goldBorder }}>
          <p className="text-[0.82rem] font-bold" style={{ color: V.text }}>Nouveau code promo</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block mb-1 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Code *
              </label>
              <input type="text" required value={fCode}
                onChange={e => setFCode(e.target.value.toUpperCase())}
                placeholder="DJAMA10"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] font-mono uppercase outline-none"
                style={{ borderColor: V.border, color: V.text }} />
            </div>
            <div>
              <label className="block mb-1 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Réduction *
              </label>
              <input type="number" required value={fDiscount}
                onChange={e => setFDiscount(e.target.value)}
                min="0" max={fType === "percent" ? "100" : undefined} step="0.01"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
            </div>
            <div>
              <label className="block mb-1 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Type *
              </label>
              <select value={fType} onChange={e => setFType(e.target.value as "percent"|"fixed")}
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }}>
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
                Max utilisations
              </label>
              <input type="number" value={fMaxUses} onChange={e => setFMaxUses(e.target.value)}
                placeholder="Illimité"
                className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
                style={{ borderColor: V.border, color: V.text }} />
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block mb-1 text-[0.74rem] font-semibold" style={{ color: V.textFaint }}>
              <Calendar size={11} className="inline mr-1" /> Expiration
            </label>
            <input type="date" value={fExpires} onChange={e => setFExpires(e.target.value)}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-[0.82rem] outline-none"
              style={{ borderColor: V.border, color: V.text }} />
          </div>
          {fErr && (
            <p className="text-[0.78rem] text-[#f87171]"><AlertTriangle size={12} className="inline mr-1" />{fErr}</p>
          )}
          <button type="submit" disabled={fSaving}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.82rem] font-bold transition disabled:opacity-50"
            style={{ background: V.goldDim, color: V.gold, border: `1px solid ${V.goldBorder}` }}>
            {fSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Créer le coupon
          </button>
        </form>
      )}

      {/* Erreur */}
      {err && (
        <div className="rounded-xl border px-4 py-3 text-[0.82rem]"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#f87171" }}>
          {err}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <Tag size={28} style={{ color: V.textFaint }} />
          <p className="mt-3 text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>
            Aucun coupon configuré
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                {["Code", "Réduction", "Utilisations", "Expiration", "Statut", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em]"
                    style={{ color: V.textFaint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {coupons.map(c => {
                const expired = isExpired(c);
                return (
                  <tr key={c.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    className="transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.88rem] font-bold" style={{ color: V.text }}>
                          {c.code}
                        </span>
                        <button onClick={() => copy(c.code)}
                          className="rounded-lg p-1 transition hover:opacity-70"
                          style={{ color: copied === c.code ? "#4ade80" : V.textFaint }}>
                          {copied === c.code ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[0.88rem] font-bold" style={{ color: V.gold }}>
                        {discountLabel(c)}
                      </span>
                      <span className="ml-1 text-[0.72rem]" style={{ color: V.textFaint }}>
                        {c.type === "percent" ? "remise" : "fixe"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[0.82rem]" style={{ color: V.textSub }}>
                      {c.uses}{c.max_uses ? `/${c.max_uses}` : ""}
                      {c.max_uses && c.uses >= c.max_uses && (
                        <span className="ml-2 text-[0.72rem] text-[#f87171]">épuisé</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[0.8rem]"
                      style={{ color: expired ? "#f87171" : V.textSub }}>
                      {expired && <AlertTriangle size={11} className="inline mr-1" />}
                      {fmt(c.expires_at)}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggle(c)} disabled={toggling === c.id}
                        className="flex items-center gap-1.5 text-[0.78rem] font-semibold transition"
                        style={{ color: c.active && !expired ? "#4ade80" : V.textFaint }}>
                        {toggling === c.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : c.active && !expired
                            ? <ToggleRight size={16} />
                            : <ToggleLeft size={16} />
                        }
                        {c.active && !expired ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => del(c.id)} disabled={deleting === c.id}
                        className="rounded-lg p-1.5 transition hover:opacity-70"
                        style={{ color: "#f87171", background: "rgba(248,113,113,0.08)" }}>
                        {deleting === c.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
