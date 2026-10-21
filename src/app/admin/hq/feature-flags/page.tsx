"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle, AlertCircle, Loader2, X, Trash2 } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Flag = {
  id: string; key: string; label: string;
  description?: string; enabled: boolean; scope: string;
  created_at: string; updated_at: string;
};

const SCOPE_MAP: Record<string, { label: string; color: string }> = {
  global:   { label: "Global",   color: "#6b7280" },
  premium:  { label: "Premium",  color: GOLD      },
  beta:     { label: "Bêta",     color: "#f59e0b" },
  dev:      { label: "Dev",      color: "#8b5cf6" },
  internal: { label: "Interne",  color: "#3b82f6" },
};

const SYSTEM_KEYS = new Set([
  "chatbot_ia","website_builder","analytics_avances","carte_visite",
  "module_banque","module_signature","module_declarations","prestataires","coaching_ia",
]);

function Toggle({ enabled, onChange, loading }: { enabled: boolean; onChange: () => void; loading: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className="flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ background: enabled ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)" }}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin mx-auto text-white/60" />
      ) : (
        <span
          className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: enabled ? "translateX(22px)" : "translateX(2px)" }}
        />
      )}
    </button>
  );
}

export default function FeatureFlagsPage() {
  const [flags, setFlags]       = useState<Flag[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "ok"|"err"; text: string } | null>(null);

  const [form, setForm] = useState({ key: "", label: "", description: "", scope: "global", enabled: false });

  function load() {
    setLoading(true);
    fetch("/api/admin/hq/feature-flags")
      .then(r => r.json())
      .then(d => setFlags(d.flags ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggle(flag: Flag) {
    setToggling(flag.id);
    try {
      const res = await fetch(`/api/admin/hq/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      if (res.ok) {
        setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
      }
    } catch { /* ignore */ }
    finally { setToggling(null); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.key || !form.label) { setMsg({ type: "err", text: "Clé et libellé obligatoires." }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/hq/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setMsg({ type: "ok", text: "Flag créé." });
      setForm({ key: "", label: "", description: "", scope: "global", enabled: false });
      setShowForm(false);
      load();
    } catch { setMsg({ type: "err", text: "Erreur réseau." }); }
    finally { setSaving(false); }
  }

  async function handleDelete(flag: Flag) {
    if (!confirm(`Supprimer le flag "${flag.label}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/hq/feature-flags/${flag.id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setFlags(prev => prev.filter(f => f.id !== flag.id));
    } catch { setMsg({ type: "err", text: "Erreur réseau." }); }
  }

  const byScope = flags.reduce<Record<string, Flag[]>>((acc, f) => {
    (acc[f.scope] ??= []).push(f);
    return acc;
  }, {});

  const inputCls = "w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[0.85rem] text-white/85 outline-none placeholder:text-white/20 focus:border-white/20";
  const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: BORDER };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Feature Flags</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Feature Flags</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">{flags.filter(f => f.enabled).length}/{flags.length} activés</p>
        </div>
        <button
          onClick={() => setShowForm(o => !o)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-semibold transition-opacity hover:opacity-80"
          style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.25)`, color: GOLD }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Annuler" : "Nouveau flag"}
        </button>
      </div>

      {msg && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-[0.82rem]"
          style={{
            background: msg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            color: msg.type === "ok" ? "#22c55e" : "#ef4444",
          }}
        >
          {msg.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={e => void handleCreate(e)} className="rounded-2xl border p-6 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.8rem] font-bold text-white/60 uppercase tracking-[0.08em]">Nouveau flag</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Clé <span className="text-red-400">*</span></label>
              <input
                className={inputCls} style={inputStyle}
                value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))}
                placeholder="ma_feature"
              />
              <p className="text-[0.65rem] text-white/20">Lettres minuscules, chiffres, tirets bas</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Libellé <span className="text-red-400">*</span></label>
              <input className={inputCls} style={inputStyle} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ma Fonctionnalité" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Description</label>
            <input className={inputCls} style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de la fonctionnalité…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Portée</label>
              <select
                className={inputCls}
                style={{ ...inputStyle, color: "rgba(255,255,255,0.85)" }}
                value={form.scope}
                onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              >
                {Object.entries(SCOPE_MAP).map(([k, { label }]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Toggle enabled={form.enabled} onChange={() => setForm(f => ({ ...f, enabled: !f.enabled }))} loading={false} />
              <span className="text-[0.8rem] text-white/50">{form.enabled ? "Activé" : "Désactivé"}</span>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-semibold disabled:opacity-50"
              style={{ background: `rgba(${GOLDR},0.15)`, border: `1px solid rgba(${GOLDR},0.3)`, color: GOLD }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-16 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(SCOPE_MAP).map(([scope, { label: scopeLabel, color }]) => {
            const scopeFlags = byScope[scope] ?? [];
            if (scopeFlags.length === 0) return null;
            return (
              <div key={scope}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.12em]" style={{ color }}>{scopeLabel}</span>
                  <span className="text-[0.68rem] text-white/25">— {scopeFlags.filter(f => f.enabled).length}/{scopeFlags.length} actifs</span>
                </div>
                <div className="space-y-2">
                  {scopeFlags.map(flag => (
                    <div
                      key={flag.id}
                      className="flex items-center gap-4 rounded-2xl border px-5 py-3.5"
                      style={{ background: CARD, borderColor: flag.enabled ? "rgba(34,197,94,0.15)" : BORDER }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[0.85rem] font-bold text-white">{flag.label}</span>
                          <code className="text-[0.65rem] font-mono text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{flag.key}</code>
                        </div>
                        {flag.description && (
                          <p className="mt-0.5 text-[0.72rem] text-white/35">{flag.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-[0.68rem] text-white/25 sm:block">
                          {flag.enabled ? "Actif" : "Inactif"}
                        </span>
                        <Toggle
                          enabled={flag.enabled}
                          onChange={() => void toggle(flag)}
                          loading={toggling === flag.id}
                        />
                        {!SYSTEM_KEYS.has(flag.key) && (
                          <button
                            onClick={() => void handleDelete(flag)}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
