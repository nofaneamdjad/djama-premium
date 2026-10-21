"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Dept = { id: string; name: string; color: string };
type Role = { id: string; name: string; level: number; hq_departments?: { name: string } | null };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/40">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-[0.85rem] text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/20";
const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: BORDER };

export default function NewEmployeePage() {
  const router = useRouter();
  const [depts, setDepts]   = useState<Dept[]>([]);
  const [roles, setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]   = useState("");

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", job_title: "",
    department_id: "", role_id: "", phone: "", started_at: "",
    send_invite: true,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/hq/departments").then(r => r.json()),
      fetch("/api/admin/hq/roles").then(r => r.json()),
    ]).then(([d, r]) => {
      setDepts(d.departments ?? []);
      setRoles(r.roles ?? []);
    }).catch(console.error);
  }, []);

  function set(key: string, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.first_name || !form.last_name || !form.email) {
      setError("Prénom, nom et email sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hq/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          department_id: form.department_id || undefined,
          role_id: form.role_id || undefined,
          started_at: form.started_at || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setSuccess(true);
      setTimeout(() => router.push("/admin/hq/employes"), 2000);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  const levelLabel: Record<number, string> = { 1: "Direction", 2: "Responsable", 3: "Employé" };
  const byLevel = roles.reduce<Record<number, Role[]>>((acc, r) => {
    (acc[r.level] ??= []).push(r);
    return acc;
  }, {});

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <CheckCircle size={40} color="#22c55e" />
        <p className="text-[1rem] font-bold text-white">Employé créé avec succès</p>
        <p className="text-[0.8rem] text-white/40">Redirection vers la liste…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
          <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
          <span>/</span>
          <Link href="/admin/hq/employes" className="hover:text-white/60 transition-colors">Employés</Link>
          <span>/</span>
          <span className="text-white/60">Nouveau</span>
        </div>
        <h1 className="text-[1.3rem] font-black text-white">Nouvel employé</h1>
        <p className="mt-0.5 text-[0.78rem] text-white/35">L'employé recevra une invitation par email pour créer son compte.</p>
      </div>

      <form onSubmit={e => void handleSubmit(e)} className="space-y-5">
        {/* Identité */}
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.8rem] font-bold text-white/60 uppercase tracking-[0.08em]">Identité</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" required>
              <input className={inputCls} style={inputStyle} value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="Prénom" />
            </Field>
            <Field label="Nom" required>
              <input className={inputCls} style={inputStyle} value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Nom de famille" />
            </Field>
          </div>
          <Field label="Email professionnel" required>
            <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={e => set("email", e.target.value)} placeholder="prenom.nom@djama.pro" />
          </Field>
          <Field label="Téléphone">
            <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+33 6 00 00 00 00" />
          </Field>
        </div>

        {/* Poste */}
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.8rem] font-bold text-white/60 uppercase tracking-[0.08em]">Poste & organisation</h2>
          <Field label="Intitulé du poste">
            <input className={inputCls} style={inputStyle} value={form.job_title} onChange={e => set("job_title", e.target.value)} placeholder="Ex : Commercial Senior" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Département">
              <select
                className={inputCls}
                style={{ ...inputStyle, color: form.department_id ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)" }}
                value={form.department_id}
                onChange={e => set("department_id", e.target.value)}
              >
                <option value="">Sélectionner…</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Date d'entrée">
              <input type="date" className={inputCls} style={inputStyle} value={form.started_at} onChange={e => set("started_at", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Rôle */}
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.8rem] font-bold text-white/60 uppercase tracking-[0.08em]">Rôle et permissions</h2>
          <Field label="Rôle initial">
            <select
              className={inputCls}
              style={{ ...inputStyle, color: form.role_id ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)" }}
              value={form.role_id}
              onChange={e => set("role_id", e.target.value)}
            >
              <option value="">Sélectionner un rôle…</option>
              {[1, 2, 3].map(lvl => byLevel[lvl] ? (
                <optgroup key={lvl} label={levelLabel[lvl]}>
                  {byLevel[lvl].map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </optgroup>
              ) : null)}
            </select>
          </Field>
          {form.role_id && (
            <p className="text-[0.72rem] text-white/35">
              Les permissions de ce rôle seront appliquées automatiquement.
            </p>
          )}
        </div>

        {/* Invitation */}
        <div className="rounded-2xl border p-5 flex items-center justify-between gap-4" style={{ background: CARD, borderColor: BORDER }}>
          <div>
            <p className="text-[0.82rem] font-semibold text-white">Envoyer l'invitation par email</p>
            <p className="text-[0.72rem] text-white/35">L'employé recevra un lien sécurisé valable 7 jours pour créer son compte.</p>
          </div>
          <button
            type="button"
            onClick={() => set("send_invite", !form.send_invite)}
            className="flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
            style={{ background: form.send_invite ? `rgba(${GOLDR},0.6)` : "rgba(255,255,255,0.1)" }}
          >
            <span
              className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: form.send_invite ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[0.82rem] text-red-400" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/admin/hq/employes"
            className="rounded-xl px-4 py-2.5 text-[0.8rem] font-medium text-white/40 transition-colors hover:text-white/70"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.82rem] font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: `rgba(${GOLDR},0.15)`, border: `1px solid rgba(${GOLDR},0.3)`, color: GOLD }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : (form.send_invite ? <Send size={14} /> : <UserPlus size={14} />)}
            {loading ? "Création…" : form.send_invite ? "Créer et inviter" : "Créer l'employé"}
          </button>
        </div>
      </form>
    </div>
  );
}
