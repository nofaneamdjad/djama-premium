"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText, Plus, Pencil, Trash2, X, Loader2, Download,
  ArrowRight, RefreshCw, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { QuoteRow, QuoteItemRow, QuoteStatus } from "@/types/db";
import { generatePdf } from "@/lib/pdf/generatePdf";
import { fetchCompanySettings } from "@/lib/pdf/companySettings";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const TODAY = () => new Date().toISOString().split("T")[0];
const YEAR  = () => new Date().getFullYear();

type StatusCfg = { label: string; cls: string };
const STATUS_CFG: Record<string, StatusCfg> = {
  brouillon: { label: "Brouillon",  cls: "text-white/40 bg-white/[0.06]"           },
  "envoyé":  { label: "Envoyé",     cls: "text-[#60a5fa] bg-[rgba(96,165,250,0.1)]"  },
  accepté:   { label: "Accepté",    cls: "text-[#4ade80] bg-[rgba(74,222,128,0.1)]"  },
  refusé:    { label: "Refusé",     cls: "text-[#f87171] bg-[rgba(248,113,113,0.1)]" },
  converti:  { label: "Converti",   cls: "text-[#c9a55a] bg-[rgba(201,165,90,0.1)]"  },
  expiré:    { label: "Expiré",     cls: "text-white/30 bg-white/[0.04]"             },
};
const ALL_STATUSES = Object.keys(STATUS_CFG) as QuoteStatus[];

function Badge({ s }: { s: string }) {
  const c = STATUS_CFG[s] ?? STATUS_CFG.brouillon;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${c.cls}`}>
      {c.label}
    </span>
  );
}

function fmtDate(d: string | null | undefined) {
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
  _key:       string;
  id?:        string;
  description: string;
  quantity:   number;
  unit_price: number;
  total:      number;
};

type QuoteForm = {
  client_name:    string;
  client_email:   string;
  client_phone:   string;
  client_company: string;
  client_address: string;
  subject:        string;
  description:    string;
  budget:         string;
  status:         QuoteStatus;
  issue_date:     string;
  valid_until:    string;
  tax_rate:       number;
  notes:          string;
  items:          FormItem[];
};

const EMPTY_FORM: QuoteForm = {
  client_name: "", client_email: "", client_phone: "", client_company: "",
  client_address: "", subject: "", description: "", budget: "",
  status: "brouillon", issue_date: TODAY(), valid_until: "", tax_rate: 20,
  notes: "", items: [],
};

function newItem(): FormItem {
  return { _key: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0 };
}

// ─────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────
export default function AdminDevis() {
  const [quotes,    setQuotes]    = useState<QuoteRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<QuoteStatus | "tous">("tous");
  const [modal,     setModal]     = useState<"add" | "edit" | null>(null);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState<QuoteForm>(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);
  const loadedRef = useRef(false);

  // ── Chargement ──────────────────────────────────────────────
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("*, quote_items(*)")
      .order("created_at", { ascending: false });
    if (error) { console.error("[AdminDevis] fetch error:", error); }
    else       { setQuotes((data ?? []) as QuoteRow[]); }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Référence auto ─────────────────────────────────────────
  async function nextRef(): Promise<string> {
    const yr = YEAR();
    const { count } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .like("reference", `DEV-${yr}-%`);
    const n = String((count ?? 0) + 1).padStart(4, "0");
    return `DEV-${yr}-${n}`;
  }

  // ── Ouvrir modal ───────────────────────────────────────────
  function openAdd() {
    setForm({ ...EMPTY_FORM, items: [newItem()] });
    setEditId(null);
    setModal("add");
    setSaveErr(null);
  }

  function openEdit(q: QuoteRow) {
    const items: FormItem[] = (q.quote_items ?? [])
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
      client_name:    q.client_name,
      client_email:   q.client_email,
      client_phone:   q.client_phone    ?? "",
      client_company: q.client_company  ?? "",
      client_address: q.client_address  ?? "",
      subject:        q.subject,
      description:    q.description     ?? "",
      budget:         q.budget          ?? "",
      status:         q.status,
      issue_date:     q.issue_date      ?? TODAY(),
      valid_until:    q.valid_until     ?? "",
      tax_rate:       q.tax_rate,
      notes:          q.notes           ?? "",
      items,
    });
    setEditId(q.id);
    setModal("edit");
    setSaveErr(null);
  }

  // ── Items helpers ──────────────────────────────────────────
  function setItem(key: string, field: keyof FormItem, val: string | number) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(it => {
        if (it._key !== key) return it;
        const updated = { ...it, [field]: val };
        if (field === "quantity" || field === "unit_price") {
          updated.total = Number(updated.quantity) * Number(updated.unit_price);
        }
        return updated;
      }),
    }));
  }

  const subtotal   = form.items.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const tax_amount = subtotal * form.tax_rate / 100;
  const total      = subtotal + tax_amount;

  // ── Sauvegarde ─────────────────────────────────────────────
  async function save() {
    if (!form.client_name.trim() || !form.subject.trim()) {
      setSaveErr("Nom client et sujet requis.");
      return;
    }
    setSaving(true);
    setSaveErr(null);
    try {
      let quoteId = editId;
      const payload = {
        client_name:    form.client_name.trim(),
        client_email:   form.client_email.trim(),
        client_phone:   form.client_phone.trim()   || null,
        client_company: form.client_company.trim() || null,
        client_address: form.client_address.trim() || null,
        subject:        form.subject.trim(),
        description:    form.description.trim()    || null,
        budget:         form.budget.trim()         || null,
        status:         form.status,
        issue_date:     form.issue_date            || null,
        valid_until:    form.valid_until           || null,
        tax_rate:       form.tax_rate,
        subtotal,
        tax_amount,
        total,
        notes:          form.notes.trim()          || null,
        updated_at:     new Date().toISOString(),
      };

      if (modal === "add") {
        const ref = await nextRef();
        const { data, error } = await supabase
          .from("quotes")
          .insert([{ ...payload, reference: ref }])
          .select("id")
          .single();
        if (error) throw error;
        quoteId = data.id;
      } else {
        const { error } = await supabase
          .from("quotes")
          .update(payload)
          .eq("id", editId!);
        if (error) throw error;
        // Supprimer les anciens items
        await supabase.from("quote_items").delete().eq("quote_id", editId!);
      }

      // Insérer les items
      if (form.items.length > 0 && quoteId) {
        const itemsPayload = form.items
          .filter(i => i.description.trim())
          .map((i, idx) => ({
            quote_id:    quoteId!,
            description: i.description.trim(),
            quantity:    Number(i.quantity),
            unit_price:  Number(i.unit_price),
            total:       Number(i.total),
            sort_order:  idx,
          }));
        if (itemsPayload.length > 0) {
          const { error } = await supabase.from("quote_items").insert(itemsPayload);
          if (error) throw error;
        }
      }

      setModal(null);
      showToast(modal === "add" ? "Devis créé ✓" : "Devis mis à jour ✓");
      load();
    } catch (err) {
      console.error("[AdminDevis] save error:", err);
      setSaveErr("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  // ── Suppression ────────────────────────────────────────────
  async function deleteQuote(id: string) {
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) { console.error("[AdminDevis] delete error:", error); return; }
    setConfirmDel(null);
    showToast("Devis supprimé");
    load();
  }

  // ── Changement statut rapide ───────────────────────────────
  async function setStatus(id: string, status: QuoteStatus) {
    await supabase.from("quotes").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  // ── Télécharger PDF ────────────────────────────────────────
  async function downloadPdf(q: QuoteRow) {
    const [company, items] = await Promise.all([
      fetchCompanySettings(),
      Promise.resolve((q.quote_items ?? []).map(i => ({
        description: i.description,
        quantity:    i.quantity,
        unit_price:  i.unit_price,
        total:       i.total,
      }))),
    ]);
    await generatePdf({
      type:           "quote",
      reference:      q.reference,
      issue_date:     q.issue_date    ?? TODAY(),
      valid_until:    q.valid_until   ?? undefined,
      client_name:    q.client_name,
      client_email:   q.client_email,
      client_phone:   q.client_phone,
      client_company: q.client_company,
      client_address: q.client_address,
      subject:        q.subject,
      items,
      subtotal:   q.subtotal,
      tax_rate:   q.tax_rate,
      tax_amount: q.tax_amount,
      total:      q.total,
      notes:      q.notes,
      company,
    });
  }

  // ── Convertir en facture ───────────────────────────────────
  async function convertToInvoice(q: QuoteRow) {
    try {
      // Référence facture
      const yr = YEAR();
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .like("reference", `FAC-${yr}-%`);
      const n   = String((count ?? 0) + 1).padStart(4, "0");
      const ref = `FAC-${yr}-${n}`;

      // Créer facture
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert([{
          reference:      ref,
          quote_id:       q.id,
          client_name:    q.client_name,
          client_email:   q.client_email,
          client_phone:   q.client_phone,
          client_company: q.client_company,
          client_address: q.client_address,
          subject:        q.subject,
          description:    q.description,
          status:         "brouillon",
          issue_date:     TODAY(),
          subtotal:       q.subtotal,
          tax_rate:       q.tax_rate,
          tax_amount:     q.tax_amount,
          total:          q.total,
          notes:          q.notes,
        }])
        .select("id")
        .single();
      if (invErr) throw invErr;

      // Copier les items
      const items = (q.quote_items ?? []).map((i, idx) => ({
        invoice_id:  inv.id,
        description: i.description,
        quantity:    i.quantity,
        unit_price:  i.unit_price,
        total:       i.total,
        sort_order:  idx,
      }));
      if (items.length > 0) {
        await supabase.from("invoice_items").insert(items);
      }

      // Marquer devis converti
      await supabase.from("quotes").update({ status: "converti", updated_at: new Date().toISOString() }).eq("id", q.id);

      showToast(`Facture ${ref} créée ✓`);
      load();
    } catch (err) {
      console.error("[AdminDevis] convert error:", err);
      showToast("Erreur lors de la conversion.");
    }
  }

  // ── Filtrage ───────────────────────────────────────────────
  const displayed = filter === "tous" ? quotes : quotes.filter(q => q.status === filter);

  // ─────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.1)] px-4 py-3 text-[0.82rem] font-semibold text-[#4ade80]">
          <Check size={14} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Devis</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/30">{quotes.length} devis total</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-2xl bg-[#c9a55a] px-4 py-2.5 text-[0.83rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> Nouveau devis
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
            {s === "tous" ? "Tous" : STATUS_CFG[s]?.label}
            {s !== "tous" && (
              <span className="ml-1.5 text-white/20">
                {quotes.filter(q => q.status === s).length}
              </span>
            )}
          </button>
        ))}
        <button onClick={() => { loadedRef.current = false; load(); }} className="ml-auto text-white/20 hover:text-white/50 transition-colors">
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
            <FileText size={28} />
            <p className="text-[0.83rem]">Aucun devis</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Référence", "Client", "Sujet", "Total", "Date", "Statut", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {displayed.map(q => (
                  <tr key={q.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-mono text-[0.74rem] text-[#c9a55a]">{q.reference}</td>
                    <td className="px-5 py-4">
                      <p className="text-[0.83rem] font-semibold text-white/80">{q.client_name}</p>
                      <p className="text-[0.7rem] text-white/30">{q.client_email}</p>
                    </td>
                    <td className="px-5 py-4 text-[0.81rem] text-white/55">{q.subject}</td>
                    <td className="px-5 py-4 text-[0.81rem] font-semibold text-white/70">{fmtEur(q.total)}</td>
                    <td className="px-5 py-4 text-[0.78rem] text-white/30">{fmtDate(q.issue_date)}</td>
                    <td className="px-5 py-4"><Badge s={q.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openEdit(q)} title="Modifier" className="text-white/25 hover:text-[#60a5fa] transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => downloadPdf(q)} title="PDF" className="text-white/25 hover:text-[#c9a55a] transition-colors">
                          <Download size={13} />
                        </button>
                        {q.status !== "converti" && (
                          <button onClick={() => convertToInvoice(q)} title="Convertir en facture" className="text-white/25 hover:text-[#4ade80] transition-colors">
                            <ArrowRight size={13} />
                          </button>
                        )}
                        <button onClick={() => setConfirmDel(q.id)} title="Supprimer" className="text-white/25 hover:text-[#f87171] transition-colors">
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

      {/* ── Modal Add / Edit ─────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 shadow-2xl">
            {/* Header modal */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[1rem] font-black text-white">
                {modal === "add" ? "Nouveau devis" : "Modifier le devis"}
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
                  <Field label="Nom *"    value={form.client_name}    onChange={v => setForm(f => ({ ...f, client_name: v }))} placeholder="Jean Dupont" />
                  <Field label="Email *"  value={form.client_email}   onChange={v => setForm(f => ({ ...f, client_email: v }))} placeholder="jean@email.com" type="email" />
                  <Field label="Téléphone" value={form.client_phone}  onChange={v => setForm(f => ({ ...f, client_phone: v }))} placeholder="+33 6 …" />
                  <Field label="Société"  value={form.client_company} onChange={v => setForm(f => ({ ...f, client_company: v }))} placeholder="Entreprise SAS" />
                </div>
                <Field label="Adresse" value={form.client_address} onChange={v => setForm(f => ({ ...f, client_address: v }))} placeholder="12 rue de la Paix, 75001 Paris" />
              </fieldset>

              {/* Sujet + dates + statut */}
              <fieldset className="space-y-3">
                <legend className="mb-2 text-[0.72rem] font-black uppercase tracking-[0.1em] text-[#c9a55a]">Devis</legend>
                <Field label="Sujet *" value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))} placeholder="Création site web premium" />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Date d'émission" value={form.issue_date}  onChange={v => setForm(f => ({ ...f, issue_date: v }))}  type="date" />
                  <Field label="Valable jusqu'au" value={form.valid_until} onChange={v => setForm(f => ({ ...f, valid_until: v }))} type="date" />
                  <div>
                    <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Statut</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as QuoteStatus }))}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s} className="bg-[#0f0f12]">{STATUS_CFG[s].label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Lignes de prestations */}
              <fieldset>
                <div className="mb-2 flex items-center justify-between">
                  <legend className="text-[0.72rem] font-black uppercase tracking-[0.1em] text-[#c9a55a]">Prestations</legend>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, items: [...f.items, newItem()] }))}
                    className="flex items-center gap-1 text-[0.74rem] font-bold text-[#c9a55a] hover:opacity-80"
                  >
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
                            <input
                              value={item.description}
                              onChange={e => setItem(item._key, "description", e.target.value)}
                              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-[0.82rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.3)]"
                              placeholder="Description de la prestation"
                            />
                          </td>
                          <td className="px-2 py-2 w-16">
                            <input
                              type="number" min="1" step="0.5"
                              value={item.quantity}
                              onChange={e => setItem(item._key, "quantity", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2 py-1.5 text-center text-[0.82rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.3)]"
                            />
                          </td>
                          <td className="px-2 py-2 w-28">
                            <input
                              type="number" min="0" step="0.01"
                              value={item.unit_price}
                              onChange={e => setItem(item._key, "unit_price", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-white/[0.05] bg-white/[0.03] px-2 py-1.5 text-right text-[0.82rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.3)]"
                            />
                          </td>
                          <td className="px-2 py-2 w-24 text-right text-[0.82rem] font-semibold text-white/60">
                            {fmtEur(item.total)}
                          </td>
                          <td className="px-2 py-2 w-8 text-center">
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, items: f.items.filter(i => i._key !== item._key) }))}
                              className="text-white/15 hover:text-[#f87171] transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totaux */}
                <div className="mt-3 space-y-1.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-[0.83rem]">
                  <div className="flex justify-between text-white/40">
                    <span>Sous-total HT</span>
                    <span>{fmtEur(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/40">
                    <div className="flex items-center gap-2">
                      <span>TVA</span>
                      <input
                        type="number" min="0" max="100" step="1"
                        value={form.tax_rate}
                        onChange={e => setForm(f => ({ ...f, tax_rate: parseFloat(e.target.value) || 0 }))}
                        className="w-14 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-center text-[0.8rem] text-white/70 outline-none"
                      />
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

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">Notes (optionnel)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[0.84rem] text-white/80 outline-none focus:border-[rgba(201,165,90,0.4)]"
                  placeholder="Conditions de paiement, remarques…"
                />
              </div>

              {/* Erreur + Boutons */}
              {saveErr && (
                <p className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-[0.78rem] text-[#f87171]">
                  {saveErr}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 hover:text-white/70 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c9a55a] py-2.5 text-[0.83rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {modal === "add" ? "Créer le devis" : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ─── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0f0f12] p-6 text-center">
            <Trash2 size={24} className="mx-auto mb-3 text-[#f87171]" />
            <p className="mb-1 font-bold text-white">Supprimer ce devis ?</p>
            <p className="mb-5 text-[0.8rem] text-white/35">Les lignes associées seront également supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 rounded-2xl border border-white/[0.08] py-2.5 text-[0.83rem] font-bold text-white/40 hover:text-white/70 transition-colors">Annuler</button>
              <button onClick={() => deleteQuote(confirmDel)} className="flex-1 rounded-2xl bg-[rgba(248,113,113,0.15)] py-2.5 text-[0.83rem] font-bold text-[#f87171] hover:bg-[rgba(248,113,113,0.25)] transition-colors">Supprimer</button>
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
function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.07em] text-white/30">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[0.84rem] text-white/80 placeholder:text-white/20 outline-none focus:border-[rgba(201,165,90,0.4)]"
      />
    </div>
  );
}
