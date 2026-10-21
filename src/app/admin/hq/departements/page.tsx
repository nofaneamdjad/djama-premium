"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Users, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Dept = {
  id: string; name: string; slug: string; description?: string; color: string;
  employee_count?: { count: number }[];
  hq_employees?: { id: string; first_name: string; last_name: string } | null;
};

const PRESET_COLORS = ["#c9a55a","#3b82f6","#22c55e","#8b5cf6","#f59e0b","#06b6d4","#ec4899","#ef4444","#14b8a6"];

function DeptCard({ dept, onUpdated }: { dept: Dept; onUpdated: () => void }) {
  const count = dept.employee_count?.[0]?.count ?? 0;
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ background: CARD, borderColor: BORDER, borderLeft: `3px solid ${dept.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.9rem] font-bold text-white">{dept.name}</p>
          {dept.description && <p className="mt-0.5 text-[0.74rem] text-white/35 line-clamp-2">{dept.description}</p>}
        </div>
        <div className="h-4 w-4 shrink-0 rounded-full mt-0.5" style={{ background: dept.color }} />
      </div>
      <div className="flex items-center gap-3 text-[0.72rem] text-white/35">
        <span className="flex items-center gap-1"><Users size={11} />{count} employé{count > 1 ? "s" : ""}</span>
        {dept.hq_employees && (
          <span>Chef : {dept.hq_employees.first_name} {dept.hq_employees.last_name}</span>
        )}
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const [depts, setDepts]       = useState<Dept[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "ok"|"err"; text: string } | null>(null);

  const [form, setForm] = useState({ name: "", slug: "", description: "", color: "#c9a55a" });

  function load() {
    setLoading(true);
    fetch("/api/admin/hq/departments")
      .then(r => r.json())
      .then(d => setDepts(d.departments ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function autoSlug(name: string) {
    return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function setName(val: string) {
    setForm(f => ({ ...f, name: val, slug: autoSlug(val) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) { setMsg({ type: "err", text: "Nom et slug sont obligatoires." }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/hq/departments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setMsg({ type: "ok", text: "Département créé." });
      setForm({ name: "", slug: "", description: "", color: "#c9a55a" });
      setShowForm(false);
      load();
    } catch { setMsg({ type: "err", text: "Erreur réseau." }); }
    finally { setSaving(false); }
  }

  const inputCls = "w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[0.85rem] text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/20";
  const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: BORDER };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Départements</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Départements</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">{depts.length} département{depts.length > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(o => !o)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-semibold transition-opacity hover:opacity-80"
          style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.25)`, color: GOLD }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Annuler" : "Nouveau département"}
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
          <h2 className="text-[0.82rem] font-bold text-white/60 uppercase tracking-[0.08em]">Nouveau département</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Nom <span className="text-red-400">*</span></label>
              <input className={inputCls} style={inputStyle} value={form.name} onChange={e => setName(e.target.value)} placeholder="Ex : Marketing" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Slug <span className="text-red-400">*</span></label>
              <input className={inputCls} style={inputStyle} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="marketing" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Description</label>
            <input className={inputCls} style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Rôle du département…" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">Couleur</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: form.color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                />
              ))}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {depts.map(d => <DeptCard key={d.id} dept={d} onUpdated={load} />)}
        </div>
      )}
    </div>
  );
}
