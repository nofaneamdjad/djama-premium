"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save, Zap, ChevronDown } from "lucide-react";
import { tok, GOLD, INCOME_CATS, EXPENSE_CATS, type BankRule } from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
  add: (msg: string, type?: "success" | "error") => void;
}

const FIELD_OPTIONS = [
  { v: "label", label: "Libellé" },
  { v: "amount", label: "Montant" },
  { v: "type", label: "Type (entrée/sortie)" },
  { v: "category", label: "Catégorie" },
];

const OP_OPTIONS: Record<string, { v: string; label: string }[]> = {
  label: [
    { v: "contains", label: "contient" }, { v: "starts_with", label: "commence par" },
    { v: "equals", label: "égal à" },
  ],
  amount: [
    { v: "gt", label: "supérieur à" }, { v: "lt", label: "inférieur à" },
    { v: "between", label: "entre" },
  ],
  type: [{ v: "equals", label: "égal à" }],
  category: [{ v: "equals", label: "égal à" }],
};

const ACTION_FIELDS = [
  { v: "set_category", label: "Définir la catégorie" },
  { v: "add_tag", label: "Ajouter un tag" },
  { v: "set_notes", label: "Définir les notes" },
];

export default function Regles({ userId, isDark, add }: Props) {
  const t = tok(isDark);
  const inp = {
    background: t.glass, border: `1px solid ${t.border}`,
    color: t.text, borderRadius: "0.75rem",
    padding: "0.5rem 0.75rem", fontSize: "0.825rem",
    outline: "none", width: "100%",
  } as React.CSSProperties;

  const [rules, setRules]       = useState<BankRule[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<BankRule | null>(null);
  const [saving, setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  type FormActions = { set_category?: string; add_tag?: string; set_notes?: string };
  const [form, setForm] = useState<{
    name: string;
    conditions: { field: string; operator: string; value: string }[];
    actions: FormActions;
    priority: number;
  }>({
    name: "",
    conditions: [{ field: "label", operator: "contains", value: "" }],
    actions: { set_category: "" },
    priority: 100,
  });

  useEffect(() => { if (userId) load(); }, [userId]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/banque/rules");
    const json = await res.json();
    setRules(json.rules ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", conditions: [{ field: "label", operator: "contains", value: "" }],
      actions: { set_category: "" }, priority: 100 });
    setShowForm(true);
  }

  function openEdit(r: BankRule) {
    setEditing(r);
    setForm({
      name: r.name,
      conditions: (r.conditions as { field: string; operator: string; value: string }[]).length > 0
        ? r.conditions as { field: string; operator: string; value: string }[]
        : [{ field: "label", operator: "contains", value: "" }],
      actions: r.actions as { set_category?: string; add_tag?: string; set_notes?: string },
      priority: r.priority,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { add("Nom requis", "error"); return; }
    const cond = form.conditions.filter(c => c.value.trim());
    if (!cond.length) { add("Au moins une condition est requise", "error"); return; }
    setSaving(true);

    const payload = { name: form.name, conditions: cond, actions: form.actions, priority: form.priority };

    if (editing) {
      const res = await fetch("/api/banque/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
      if (res.ok) { add("Règle modifiée"); setShowForm(false); load(); }
      else { const e = await res.json(); add(e.error ?? "Erreur", "error"); }
    } else {
      const res = await fetch("/api/banque/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { add("Règle créée"); setShowForm(false); load(); }
      else { const e = await res.json(); add(e.error ?? "Erreur", "error"); }
    }
    setSaving(false);
  }

  async function toggleActive(r: BankRule) {
    const res = await fetch("/api/banque/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, active: !r.active }),
    });
    if (res.ok) { load(); }
    else add("Erreur", "error");
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/banque/rules?id=${id}`, { method: "DELETE" });
    if (res.ok) { add("Règle supprimée"); setConfirmDel(null); load(); }
    else add("Erreur", "error");
  }

  function addCondition() {
    setForm(p => ({ ...p, conditions: [...p.conditions, { field: "label", operator: "contains", value: "" }] }));
  }

  function removeCondition(i: number) {
    setForm(p => ({ ...p, conditions: p.conditions.filter((_, j) => j !== i) }));
  }

  const allCats = [...INCOME_CATS, ...EXPENSE_CATS];

  if (loading) return <div className="py-12 text-center text-sm" style={{ color: t.text3 }}>Chargement…</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold" style={{ color: t.text }}>Règles automatiques</h3>
          <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
            Catégorisez et taguez vos transactions automatiquement à l'import
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
          <Plus size={14} /> Nouvelle règle
        </button>
      </div>

      {/* Info */}
      <div className="rounded-2xl p-4 mb-5"
        style={{ background: "rgba(201,165,90,0.06)", border: `1px solid ${GOLD}25` }}>
        <div className="flex items-start gap-3">
          <Zap size={14} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
          <p className="text-xs" style={{ color: t.text3 }}>
            Les règles s'appliquent automatiquement lors de l'import CSV/OFX.
            Elles sont également disponibles pour recatégoriser vos transactions existantes.
            Les automatisations sont explicables, contrôlables et désactivables à tout moment.
          </p>
        </div>
      </div>

      {/* Empty */}
      {rules.length === 0 && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: t.glass, border: `1px dashed ${t.border}` }}>
          <Zap size={32} className="mx-auto mb-3" style={{ color: `${GOLD}40` }} />
          <p className="text-sm" style={{ color: t.text2 }}>Aucune règle configurée</p>
          <p className="text-xs mt-1 mb-4" style={{ color: t.text3 }}>
            Créez des règles pour automatiser la catégorisation de vos transactions
          </p>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
            style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}>
            <Plus size={14} /> Créer une règle
          </button>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {rules.map(r => (
          <div key={r.id} className="rounded-2xl p-4"
            style={{
              background: t.glass, border: `1px solid ${t.border}`,
              opacity: r.active ? 1 : 0.6,
            }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: t.text }}>{r.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    Priorité {r.priority}
                  </span>
                  {r.match_count > 0 && (
                    <span className="text-[10px]" style={{ color: t.text4 }}>
                      {r.match_count} application{r.match_count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: t.text3 }}>
                  {(r.conditions as { field: string; operator: string; value: string }[]).map((c, i) => (
                    <span key={i}>
                      {i > 0 && <span style={{ color: GOLD }}> ET </span>}
                      <span style={{ color: t.text2 }}>{c.field}</span>
                      {" "}{c.operator}{" "}
                      <span style={{ color: t.text }}>&laquo;{c.value}&raquo;</span>
                    </span>
                  ))}
                  {" → "}
                  {Object.entries(r.actions as Record<string, string>).map(([k, v]) => (
                    <span key={k} style={{ color: GOLD }}>{k.replace("_", " ")}: {v}</span>
                  ))}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(r)}>
                  {r.active
                    ? <ToggleRight size={20} style={{ color: "#10b981" }} />
                    : <ToggleLeft size={20} style={{ color: t.text3 }} />}
                </button>
                <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg" style={{ color: t.text3 }}>
                  <Pencil size={13} />
                </button>
                {confirmDel === r.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(r.id)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Oui</button>
                    <button onClick={() => setConfirmDel(null)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ color: t.text3 }}>Non</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDel(r.id)} className="p-1.5 rounded-lg" style={{ color: t.text3 }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
            style={{ background: isDark ? "#151520" : "#fff", border: `1px solid ${t.border}`, maxHeight: "90dvh" }}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <p className="font-semibold text-sm" style={{ color: t.text }}>
                {editing ? "Modifier la règle" : "Nouvelle règle"}
              </p>
              <button onClick={() => setShowForm(false)}><X size={16} style={{ color: t.text3 }} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Nom de la règle *</label>
                <input style={inp} placeholder="Ex : Catégoriser loyers"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: `${GOLD}90` }}>Conditions SI…</label>
                  <button onClick={addCondition}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: GOLD }}>
                    <Plus size={11} /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {form.conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select style={{ ...inp, flex: "none", width: "auto" }}
                        value={c.field}
                        onChange={e => setForm(p => {
                          const conds = [...p.conditions];
                          conds[i] = { field: e.target.value, operator: "contains", value: "" };
                          return { ...p, conditions: conds };
                        })}>
                        {FIELD_OPTIONS.map(f => <option key={f.v} value={f.v}>{f.label}</option>)}
                      </select>
                      <select style={{ ...inp, flex: "none", width: "auto" }}
                        value={c.operator}
                        onChange={e => setForm(p => {
                          const conds = [...p.conditions];
                          conds[i] = { ...conds[i], operator: e.target.value };
                          return { ...p, conditions: conds };
                        })}>
                        {(OP_OPTIONS[c.field] ?? [{ v: "equals", label: "égal à" }]).map(o => (
                          <option key={o.v} value={o.v}>{o.label}</option>
                        ))}
                      </select>
                      <input style={{ ...inp, flex: 1 }} placeholder="Valeur"
                        value={c.value}
                        onChange={e => setForm(p => {
                          const conds = [...p.conditions];
                          conds[i] = { ...conds[i], value: e.target.value };
                          return { ...p, conditions: conds };
                        })} />
                      {form.conditions.length > 1 && (
                        <button onClick={() => removeCondition(i)} style={{ color: t.text3, flexShrink: 0 }}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Action ALORS…</label>
                <div>
                  <p className="text-xs mb-1" style={{ color: t.text3 }}>Catégorie</p>
                  <select style={inp}
                    value={form.actions.set_category ?? ""}
                    onChange={e => setForm(p => ({ ...p, actions: { ...p.actions, set_category: e.target.value } }))}>
                    <option value="">— Ne pas changer —</option>
                    <optgroup label="Entrées">
                      {INCOME_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </optgroup>
                    <optgroup label="Sorties">
                      {EXPENSE_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div className="mt-3">
                  <p className="text-xs mb-1" style={{ color: t.text3 }}>Tag (optionnel)</p>
                  <input style={inp} placeholder="Ex : loyer, récurrent…"
                    value={form.actions.add_tag ?? ""}
                    onChange={e => setForm(p => ({ ...p, actions: { ...p.actions, add_tag: e.target.value } }))} />
                </div>
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: `${GOLD}90` }}>Priorité (1 = plus prioritaire)</label>
                <input type="number" min="1" max="999" style={inp}
                  value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 100 }))} />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4"
              style={{ borderTop: `1px solid ${t.border}` }}>
              <button onClick={() => setShowForm(false)}
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
