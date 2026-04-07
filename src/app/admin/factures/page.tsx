"use client";

import { useEffect, useRef, useState } from "react";
import {
  Receipt, Plus, Pencil, Trash2, X, Loader2, Download,
  RefreshCw, Check, CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { InvoiceRow, InvoiceStatus, InvoicePaymentStatus } from "@/types/db";
import { generatePdf } from "@/lib/pdf/generatePdf";
import { fetchCompanySettings } from "@/lib/pdf/companySettings";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const TODAY = () => new Date().toISOString().split("T")[0];
const YEAR  = () => new Date().getFullYear();

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  brouillon:   { label: "Brouillon",  cls: "text-white/40 bg-white/[0.06]"              },
  "envoyée":   { label: "Envoyée",    cls: "text-[#60a5fa] bg-[rgba(96,165,250,0.1)]"   },
  "payée":     { label: "Payée",      cls: "text-[#4ade80] bg-[rgba(74,222,128,0.1)]"   },
  "en retard": { label: "En retard",  cls: "text-[#f87171] bg-[rgba(248,113,113,0.1)]"  },
  "annulée":   { label: "Annulée",    cls: "text-white/30 bg-white/[0.04]"              },
};
const PAY_CFG: Record<string, { label: string; cls: string }> = {
  "non payée": { label: "Non payée", cls: "text-[#f87171] bg-[rgba(248,113,113,0.08)]" },
  payée:       { label: "Payée",     cls: "text-[#4ade80] bg-[rgba(74,222,128,0.08)]"  },
  partielle:   { label: "Partielle", cls: "text-[#fbbf24] bg-[rgba(251,191,36,0.08)]"  },
};
const ALL_STATUSES: InvoiceStatus[] = ["brouillon","envoyée","payée","en retard","annulée"];

function Badge({ s, cfg }: { s: string; cfg: Record<string, { label: string; cls: string }> }) {
  const c = cfg[s] ?? cfg.brouillon ?? { label: s, cls: "text-white/30 bg-white/[0.04]" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${c.cls}`}>
      {c.label}
    </span>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

// ─────────────────────────────────────────────────────────────
// Types formulaire
// ─────────────────────────────────────────────────────────────
type FormItem = {
  _key:        string;
  id?:         string;
  description: string;
  quantity:    number;
  unit_price:  number;
  total:       number;
};

type InvForm = {
  client_name:    string;
  client_email:   string;
  client_phone:   string;
  client_company: string;
  client_address: string;
  subject:        string;
  description:    string;
  status:         InvoiceStatus;
  payment_status: InvoicePaymentStatus;
  payment_method: string;
  issue_date:     string;
  due_date:       string;
  tax_rate:       number;
  notes:          string;
  footer_text:    string;
  items:          FormItem[];
};

const EMPTY: InvForm = {
  client_name: "", client_email: "", client_phone: "", client_company: "",
  client_address: "", subject: "", description: "", status: "brouillon",
  payment_status: "non payée", payment_method: "", issue_date: TODAY(),
  due_date: "", tax_rate: 20, notes: "", footer_text: "", items: [],
};

function newItem(): FormItem {
  return { _key: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0 };
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────
export default function AdminFactures() {
  const [invoices,   setInvoices]   = useState<InvoiceRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<InvoiceStatus | "tous">("tous");
  const [modal,      setModal]      = useState<"add" | "edit" | null>(null);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<InvForm>(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [toast,      setToast]      = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .order("created_at", { ascending: false });
    if (error) { console.error("[AdminFactures] fetch error:", error); }
    else       { setInvoices((data ?? []) as InvoiceRow[]); }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Référence auto ──────────────────────────────────────────
  async function nextRef(): Promise<string> {
    const yr = YEAR();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .like("reference", `FAC-${yr}-%`);
    const n = String((count ?? 0) + 1).padStart(4, "0");
    return `FAC-${yr}-${n}`;
  }

  // ── Modals ──────────────────────────────────────────────────
  function openAdd() {
    setForm({ ...EMPTY, items: [newItem()] });
    setEditId(null);
    setModal("add");
    setSaveErr(null);
  }

  function openEdit(inv: InvoiceRow) {
    const items: FormItem[] = (inv.invoice_items ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => ({
        _key:        crypto.randomUUID(),
        id:          i.id,
        description: i.description,
        quantity:    i.quantity,
        unit_price:  i.unit_price,
        total:       i.total,
      }));
    setForm({
      client_name:    inv.client_name,
      client_email:   inv.client_email,
      client_phone:   inv.client_phone    ?? "",
      client_company: inv.client_company  ?? "",
      client_address: inv.client_address  ?? "",
      subject:        inv.subject,
      description:    inv.description     ?? "",
      status:         inv.status,
      payment_status: inv.payment_status,
      payment_method: inv.payment_method  ?? "",
      issue_date:     inv.issue_date      ?? TODAY(),
      due_date:       inv.due_date        ?? "",
      tax_rate:       inv.tax_rate,
      notes:          inv.notes           ?? "",
      footer_text:    inv.footer_text     ?? "",
      items,
    });
    setEditId(inv.id);
    setModal("edit");
    setSaveErr(null);
  }

  // ── Items ───────────────────────────────────────────────────
  function setItem(key: string, field: keyof FormItem, val: string | number) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(it => {
        if (it._key !== key) return it;
        const u = { ...it, [field]: val };
        if (field === "quantity" || field === "unit_price") {
          u.total = Number(u.quantity) * Number(u.unit_price);
        }
        return u;
      }),
    }));
  }

  const subtotal   = form.items.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const tax_amount = subtotal * form.tax_rate / 100;
  const total      = subtotal + tax_amount;

  // ── Sauvegarde ──────────────────────────────────────────────
  async function save() {
    if (!form.client_name.trim() || !form.subject.trim()) {
      setSaveErr("Nom client et sujet requis.");
      return;
    }
    setSaving(true);
    setSaveErr(null);
    try {
      let invId = editId;
      const payload = {
        client_name:    form.client_name.trim(),
        client_email:   form.client_email.trim(),
        client_phone:   form.client_phone.trim()   || null,
        client_company: form.client_company.trim() || null,
        client_address: form.client_address.trim() || null,
        subject:        form.subject.trim(),
        description:    form.description.trim()    || null,
        status:         form.status,
        payment_status: form.payment_status,
        payment_method: form.payment_method.trim() || null,
        issue_date:     form.issue_date            || null,
        due_date:       form.due_date              || null,
        tax_rate:       form.tax_rate,
        subtotal,
        tax_amount,
        total,
        notes:          form.notes.trim()          || null,
        footer_text:    form.footer_text.trim()    || null,
        updated_at:     new Date().toISOString(),
      };

      if (modal === "add") {
        const ref = await nextRef();
        const { data, error } = await supabase
          .from("invoices")
          .insert([{ ...payload, reference: ref }])
          .select("id")
          .single();
        if (error) throw error;
        invId = data.id;
      } else {
        const { error } = await supabase.from("invoices").update(payload).eq("id", editId!);
        if (error) throw error;
        await supabase.from("invoice_items").delete().eq("invoice_id", editId!);
      }

      if (form.items.length > 0 && invId) {
        const rows = form.items
          .filter(i => i.description.trim())
          .map((i, idx) => ({
            invoice_id:  invId!,
            description: i.description.trim(),
            quantity:    Number(i.quantity),
            unit_price:  Number(i.unit_price),
            total:       Number(i.total),
            sort_order:  idx,
          }));
        if (rows.length > 0) {
          const { error } = await supabase.from("invoice_items").insert(rows);
          if (error) throw error;
        }
      }

      setModal(null);
      showToast(modal === "add" ? "Facture créée ✓" : "Facture mise à jour ✓");
      load();
    } catch (err) {
      console.error("[AdminFactures] save error:", err);
      setSaveErr("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  // ── Suppression ─────────────────────────────────────────────
  async function deleteInvoice(id: string) {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) { console.error("[AdminFactures] delete error:", error); return; }
    setConfirmDel(null);
    showToast("Facture supprimée");
    load();
  }

  // ── Paiement rapide ─────────────────────────────────────────
  async function togglePaid(inv: InvoiceRow) {
    const payment_status: InvoicePaymentStatus = inv.payment_status === "payée" ? "non payée" : "payée";
    const status: InvoiceStatus                = payment_status === "payée" ? "payée" : inv.status === "payée" ? "envoyée" : inv.status;
    await supabase.from("invoices").update({ payment_status, status, updated_at: new Date().toISOString() }).eq("id", inv.id);
    load();
  }

  // ── PDF ─────────────────────────────────────────────────────
  async function downloadPdf(inv: InvoiceRow) {
    const company = await fetchCompanySettings();
    await generatePdf({
      type:           "invoice",
      reference:      inv.reference,
      issue_date:     inv.issue_date    ?? TODAY(),
      due_date:       inv.due_date      ?? undefined,
      client_name:    inv.client_name,
      client_email:   inv.client_email,
      client_phone:   inv.client_phone,
      client_company: inv.client_company,
      client_address: inv.client_address,
      subject:        inv.subject,
      items:          (inv.invoice_items ?? []).map(i => ({
        description: i.description, quantity: i.quantity,
        unit_price:  i.unit_price,  total:    i.total,
      })),
      subtotal:    inv.subtotal,
      tax_rate:    inv.tax_rate,
      tax_amount:  inv.tax_amount,
      total:       inv.total,
      notes:       inv.notes,
      company,
    });
  }

  const displayed = filter === "tous" ? invoices : invoices.filter(i => i.status === filter);

  // ─────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.1)] px-4 py-3 text-[0.82rem] font-semibold text-[#4ade80]">
          <Check size={14} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Factures</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/30">
            {invoices.length} facture{invoices.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-[#c9a55a]">
              {fmtEur(invoices.filter(i => i.payment_status === "payée").reduce((s, i) => s + i.total, 0))}
            </span>{" "}
            encaissé
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-2xl bg-[#c9a55a] px-4 py-2.5 text-[0.83rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> Nouvelle facture
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        {(["tous", ...ALL_STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-[0.74rem] font-bold transition-all ${
              filter === s
                ? "bg-[rgba(201,165,90,0.15)] text-[#c9a55a]"
                : "bg-white/[0.04] text-white/30 hover:text-white/60"
            }`}
          >
            {s === "tous" ? "Toutes" : STATUS_CFG[s]?.label}
            {s !== "tous" && (
              <span className="ml-1.5 text-white/20">
                {invoices.filter(i => i.status === s).length}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => { loadedRef.current = false; load(); }}
          className="ml-auto text-white/20 hover:text-white/50 transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#18181c]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/20">
            <Receipt size={28} />
            <p className="text-[0.83rem]">Aucune facture</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Référence", "Client", "Sujet", "Total", "Échéance", "Statut", "Paiement", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {displayed.map(inv => (
                  <tr key={inv.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-mono text-[0.74rem] text-[#c9a55a]">{inv.reference}</td>
                    <td className="px-5 py-4">
                      <p className="text-[0.83rem] font-semibold text-white/80">{inv.client_name}</p>
                      <p className="text-[0.7rem] text-white/30">{inv.client_email}</p>
                    </td>
                    <td className="px-5 py-4 text-[0.81rem] text-white/55">{inv.subject}</td>
                    <td className="px-5 py-4 text-[0.81rem] font-semibold text-white/70">{fmtEur(inv.total)}</td>
                    <td className="px-5 py-4 text-[0.78rem] text-white/30">{fmtDate(inv.due_date)}</td>
                    <td className="px-5 py-4"><Badge s={inv.status} cfg={STATUS_CFG} /></td>
                    <td className="px-5 py-4"><Badge s={inv.payment_status} cfg={PAY_CFG} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openEdit(inv)} title="Modifier" className="text-white/25 hover:text-[#60a5fa] transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => downloadPdf(inv)} title="Télécharger PDF" className="text-white/25 hover:text-[#c9a55a] transition-colors">
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => togglePaid(inv)}
                          title={inv.payment_status === "payée" ? "Marquer non payée" : "Marquer payée"}
                          className="text-white/25 hover:text-[#4ade80] transition-colors"
                        >
                          <CreditCard size={13} />
                        </button>
                        <button onClick={() => setConfirmDel(inv.id)} title="Supprimer" className="text-white/25 hover:text-[#f87171] transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Add / Edit ──────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[1rem] font-black text-white">
                {modal === "add" ? "Nouvelle facture" : "Modifier la facture"}
              </h2>
              <button onClick={() => setModal(null)} className="text-white/30 hover:text-white/70">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Client */}
              <fieldset className="space-y-3">
                <legend className="mb-2 text-[0.72rem] font-black uppercase tracking-[0.1em] text-[#c9a55a]">Client</legend>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nom *"      value={form.client_name}    onChange={v => setForm(f => ({ ...f, client_name: v }))}    placeholder="Jean Dupont" />
                  <Field label="Email *"    value={form.client_email}   onChange={v => setForm(f => ({ ...f, client_email: v }))}   placeholder="jean@email.com" type="email" />
                  <Field label="Téléphone"  value={form.client_phone}   onChange={v => setForm(f => ({ ...f, client_phone: v }))}   placeholder="+33 6 …" />
                  <Field label="Société"    value={form.client_company} onChange={v => setForm(f => ({ ...f, client_company: v }))} placeholder="Entreprise SAS" />
                </div>
                <Field label="Adresse" value={form.client_address} onChange={v => setForm(f => ({ ...f, client_address: v }))} placeholder="12 rue de la Paix, 75001 Paris" />
              </fieldset>

              {/* Facture */}
              <fieldset className="space-y-3">
                <legend className="mb-2 text-[0.72rem] font-black uppercase tracking-[0.1em] text-[#c9a55a]">Facture</legend>
                <Field label="Sujet *" value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))} placeholder="Création site web premium" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date d'émission" value={form.issue_date} onChange={v => setForm(f => ({ ...f, issue_date: v }))} type="date" />
                  <Field label="Date d'échéance" value={form.due_date}   onChange={v => setForm(f => ({ ...f, due_date: v }))}   type="date" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Statut</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as InvoiceStatus }))}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]">
                      {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#0f0f12]">{STATUS_CFG[s].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Paiement</label>
                    <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as InvoicePaymentStatus }))}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]">
                      {(["non payée","payée","partielle"] as const).map(s => <option key={s} value={s} className="bg-[#0f0f12]">{PAY_CFG[s].label}</option>)}
                    </select>
                  </div>
                  <Field label="Mode paiement" value={form.payment_method} onChange={v => setForm(f => ({ ...f, payment_method: v }))} placeholder="Virement, CB…" />
                </div>
              </fieldset>

              {/* Lignes */}
              <fieldset>
                <div className="mb-2 flex items-center justify-between">
                  <legend className="text-[0.72rem] font-black uppercase tracking-[0.1em] text-[#c9a55a]">Prestations</legend>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, newItem()] }))}
                    className="flex items-center gap-1 text-[0.74rem] font-bold text-[#c9a55a] hover:opacity-80">
                    <Plus size={11} /> Ajouter une ligne
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.03]">
                      <tr>
                        {["Description", "Qté", "Prix U. (€)", "Total", ""].map(h => (
                          <th key={h} className="px-3 py-2.5 text-[0.67rem] font-bold uppercase tracking-[0.07em] text-white/20">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {form.items.map(item => (
                        <tr key={item._key}>
                          <td className="px-2 py-2">
                            <input value={item.description} onChange={e => setItem(item._key, "description", e.target.value)}
                              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-[0.82rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.3)]"
                              placeholder="Description de la prestation" />
                          </td>
                          <td className="w-16 px-2 py-2">
                            <input type="number" min="1" step="0.5" value={item.quantity} onChange={e => setItem(item._key, "quantity", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2 py-1.5 text-center text-[0.82rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.3)]" />
                          </td>
                          <td className="w-28 px-2 py-2">
                            <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => setItem(item._key, "unit_price", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2 py-1.5 text-right text-[0.82rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.3)]" />
                          </td>
                          <td className="w-24 px-2 py-2 text-right text-[0.82rem] font-semibold text-white/60">{fmtEur(item.total)}</td>
                          <td className="w-8 px-2 py-2 text-center">
                            <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter(i => i._key !== item._key) }))}
                              className="text-white/15 hover:text-[#f87171] transition-colors"><X size={12} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totaux */}
                <div className="mt-3 space-y-1.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-[0.83rem]">
                  <div className="flex justify-between text-white/40">
                    <span>Sous-total HT</span><span>{fmtEur(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/40">
                    <div className="flex items-center gap-2">
                      <span>TVA</span>
                      <input type="number" min="0" max="100" step="1" value={form.tax_rate}
                        onChange={e => setForm(f => ({ ...f, tax_rate: parseFloat(e.target.value) || 0 }))}
                        className="w-14 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-center text-[0.8rem] text-white/70 outline-none" />
                      <span>%</span>
                    </div>
                    <span>{fmtEur(tax_amount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.06] pt-1.5 text-[0.88rem] font-black text-white">
                    <span>Total TTC</span>
                    <span className="text-[#c9a55a]">{fmtEur(total)}</span>
                  </div>
                </div>
              </fieldset>

              {/* Notes + footer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                    placeholder="Conditions de paiement…" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Pied de page PDF</label>
                  <textarea value={form.footer_text} onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))} rows={3}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                    placeholder="IBAN, mentions légales…" />
                </div>
              </div>

              {saveErr && (
                <p className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[0.78rem] text-[#f87171]">{saveErr}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(null)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 hover:text-white/70 transition-colors">
                  Annuler
                </button>
                <button onClick={save} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c9a55a] py-2.5 text-[0.83rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {modal === "add" ? "Créer la facture" : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 text-center">
            <Trash2 size={24} className="mx-auto mb-3 text-[#f87171]" />
            <p className="mb-1 font-bold text-white">Supprimer cette facture ?</p>
            <p className="mb-5 text-[0.8rem] text-white/35">Les lignes associées seront également supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 hover:text-white/70 transition-colors">Annuler</button>
              <button onClick={() => deleteInvoice(confirmDel)} className="flex-1 rounded-2xl bg-[rgba(248,113,113,0.15)] py-2.5 text-[0.83rem] font-bold text-[#f87171] hover:bg-[rgba(248,113,113,0.25)] transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Composant Field
// ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none focus:border-[rgba(201,165,90,0.4)]" />
    </div>
  );
}
