"use client";

import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Star, X, Save, Wallet, Check,
} from "lucide-react";
import { tok, GOLD, fmtAmount, CURRENCIES, type BankAccount } from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
  orgId?: string | null;
  add: (msg: string, type?: "success" | "error") => void;
}

const ACCOUNT_COLORS = [
  "#c9a55a", "#10b981", "#3b82f6", "#8b5cf6",
  "#ef4444", "#f59e0b", "#06b6d4", "#ec4899",
];

type FormData = Omit<BankAccount, "id" | "user_id" | "organization_id" | "created_at" | "updated_at">;

const EMPTY: FormData = {
  name: "", bank: "", iban: "",
  balance: 0, initial_balance: 0,
  currency: "EUR", color: GOLD,
  is_default: false,
};

export default function Comptes({ userId, isDark, orgId, add }: Props) {
  const t = tok(isDark);
  const inp = {
    background: t.glass, border: `1px solid ${t.border}`,
    color: t.text, borderRadius: "0.75rem",
    padding: "0.55rem 0.875rem", fontSize: "0.875rem",
    width: "100%", outline: "none",
  } as React.CSSProperties;

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<BankAccount | null>(null);
  const [form, setForm]         = useState<FormData>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (orgId) params.set("org_id", orgId);
    const res = await fetch(`/api/banque/accounts?${params}`);
    const { accounts: data } = await res.json();
    setAccounts(data ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(acc: BankAccount) {
    setEditing(acc);
    setForm({
      name: acc.name, bank: acc.bank, iban: acc.iban,
      balance: acc.balance, initial_balance: acc.initial_balance,
      currency: acc.currency, color: acc.color, is_default: acc.is_default,
    });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY); }

  async function handleSave() {
    if (!form.name.trim()) { add("Nom requis", "error"); return; }
    setSaving(true);

    if (editing) {
      const res = await fetch(`/api/banque/accounts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { add("Compte modifié"); closeForm(); load(); }
      else { const e = await res.json(); add(e.error ?? "Erreur", "error"); }
    } else {
      const res = await fetch("/api/banque/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organization_id: orgId }),
      });
      if (res.ok) { add("Compte créé"); closeForm(); load(); }
      else { const e = await res.json(); add(e.error ?? "Erreur", "error"); }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/banque/accounts/${id}`, { method: "DELETE" });
    if (res.ok) { add("Compte supprimé"); setConfirmDel(null); load(); }
    else { const e = await res.json(); add(e.error ?? "Erreur", "error"); }
  }

  if (loading) return <div className="py-16 text-center text-sm" style={{ color: t.text3 }}>Chargement…</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold" style={{ color: t.text }}>Mes comptes bancaires</h3>
          <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
            Comptes professionnels, comptes en devises, comptes manuels
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Empty */}
      {accounts.length === 0 && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: t.glass, border: `1px dashed ${t.border}` }}>
          <Wallet size={36} className="mx-auto mb-3" style={{ color: `${GOLD}60` }} />
          <p className="font-semibold text-sm" style={{ color: t.text }}>Aucun compte</p>
          <p className="text-xs mt-1 mb-4" style={{ color: t.text3 }}>
            Ajoutez vos comptes professionnels pour suivre vos soldes
          </p>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
            style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
            <Plus size={14} /> Ajouter un compte
          </button>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {accounts.map(acc => (
          <div key={acc.id}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: (acc.color ?? GOLD) + "20" }}>
              <Wallet size={16} style={{ color: acc.color ?? GOLD }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm" style={{ color: t.text }}>{acc.name}</p>
                {acc.is_default && (
                  <Star size={11} fill={GOLD} style={{ color: GOLD }} />
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
                {acc.bank || "—"}
                {acc.iban ? ` · IBAN ****${acc.iban.slice(-4)}` : ""}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold tabular-nums text-sm"
                style={{ color: acc.balance >= 0 ? "#10b981" : "#ef4444" }}>
                {fmtAmount(acc.balance, acc.currency)}
              </p>
              <p className="text-xs" style={{ color: t.text4 }}>{acc.currency}</p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => openEdit(acc)}
                className="p-1.5 rounded-lg" style={{ color: t.text3 }}>
                <Pencil size={13} />
              </button>
              {confirmDel === acc.id ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleDelete(acc.id)}
                    className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
                    Oui
                  </button>
                  <button onClick={() => setConfirmDel(null)}
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: t.glass, color: t.text3 }}>
                    Non
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(acc.id)}
                  className="p-1.5 rounded-lg" style={{ color: t.text3 }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
            style={{ background: isDark ? "#151520" : "#fff", border: `1px solid ${t.border}`, maxHeight: "90dvh" }}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <p className="font-semibold text-sm" style={{ color: t.text }}>
                {editing ? "Modifier le compte" : "Nouveau compte"}
              </p>
              <button onClick={closeForm}><X size={16} style={{ color: t.text3 }} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Nom du compte *</label>
                <input style={inp} placeholder="Ex : Compte BNP Pro"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              {/* Banque */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Établissement bancaire</label>
                <input style={inp} placeholder="Ex : BNP Paribas, CIC, Revolut…"
                  value={form.bank} onChange={e => setForm(p => ({ ...p, bank: e.target.value }))} />
              </div>

              {/* IBAN */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>IBAN (optionnel)</label>
                <input style={inp} placeholder="FR76 …"
                  value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
              </div>

              {/* Solde initial + devise */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: `${GOLD}90` }}>Solde initial</label>
                  <input type="number" step="0.01" style={inp}
                    value={form.initial_balance}
                    onChange={e => setForm(p => ({ ...p, initial_balance: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                    style={{ color: `${GOLD}90` }}>Devise</label>
                  <select style={inp} value={form.currency}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {ACCOUNT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                      style={{ background: c, border: form.color === c ? "2px solid white" : "2px solid transparent",
                        boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none" }}>
                      {form.color === c && <Check size={12} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compte par défaut */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                  style={{ background: form.is_default ? GOLD : isDark ? "#374151" : "#d1d5db" }}
                  onClick={() => setForm(p => ({ ...p, is_default: !p.is_default }))}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: form.is_default ? "translateX(20px)" : "translateX(2px)" }} />
                </div>
                <span className="text-sm" style={{ color: t.text2 }}>Compte par défaut</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4"
              style={{ borderTop: `1px solid ${t.border}` }}>
              <button onClick={closeForm}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: t.glass, color: t.text2, border: `1px solid ${t.border}` }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}50` }}>
                <Save size={13} />
                {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
