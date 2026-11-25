"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Save, FileDown, ChevronDown, ChevronUp,
  Plus, Trash2, Search, User, Building2, Check,
  FileSignature, Palette, Landmark, FileText, Percent,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import { TEMPLATE_CATALOG } from "@/lib/pdf/pdfThemes";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { ScaledA4 } from "@/components/invoice/TemplateSelector";
import { fetchCompanySettings, fetchOrgSettings } from "@/lib/pdf/companySettings";
import type { TemplateType } from "@/lib/pdf/types";
import type { PreviewData } from "@/components/invoice/shared";
import type { CompanySettings } from "@/lib/pdf/companySettings";

const GOLD = "#FFB900";

interface LineItem {
  id:              string;
  position:        number;
  description:     string;
  sub_description: string;
  unit:            string;
  quantity:        number;
  unit_price:      number;
  vat_rate:        number;
  remise_pct:      number;
}

interface FacturesClient {
  id:           string;
  nom:          string;
  societe?:     string;
  email?:       string;
  telephone?:   string;
  adresse?:     string;
  ville?:       string;
  code_postal?: string;
  pays?:        string;
  tva?:         string;
}

function newLine(pos: number): LineItem {
  return { id: crypto.randomUUID(), position: pos, description: "", sub_description: "", unit: "unité", quantity: 1, unit_price: 0, vat_rate: 20, remise_pct: 0 };
}

function r2(n: number) { return Math.round(n * 100) / 100; }

function calcTotals(items: LineItem[], remise_pct: number, acompte: number) {
  let subtotal_ht = 0, tva = 0;
  for (const it of items) {
    const gross = r2(it.quantity * it.unit_price);
    const rm    = r2(gross * (it.remise_pct || 0) / 100);
    const ht    = r2(gross - rm);
    subtotal_ht += ht;
    tva         += r2(ht * (it.vat_rate || 0) / 100);
  }
  subtotal_ht = r2(subtotal_ht);
  tva         = r2(tva);
  const remise = r2(subtotal_ht * remise_pct / 100);
  const ht_net = r2(subtotal_ht - remise);
  const tva_net = r2(ht_net * (items[0]?.vat_rate ?? 20) / 100);
  return { subtotal_ht, remise, ht_net, tva: remise_pct > 0 ? tva_net : tva, ttc: r2(ht_net + (remise_pct > 0 ? tva_net : tva)) };
}

export default function NouveauDevis() {
  const { isDark } = useTheme();
  const router     = useRouter();

  const [template,    setTemplate]    = useState<TemplateType>("modern");
  const [couleur,     setCouleur]     = useState(GOLD);
  const [numero,      setNumero]      = useState("");
  const [dateDoc,     setDateDoc]     = useState(() => new Date().toISOString().slice(0, 10));
  const [dateVal,     setDateVal]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });
  const [sujet,       setSujet]       = useState("");
  const [items,       setItems]       = useState<LineItem[]>([newLine(1)]);
  const [remise_pct,  setRemisePct]   = useState(0);
  const [acompte,     setAcompte]     = useState(0);
  const [devise,      setDevise]      = useState("EUR");
  const [notes,       setNotes]       = useState("");
  const [conditions,  setConditions]  = useState("");

  const [clientNom,   setClientNom]   = useState("");
  const [clientSoc,   setClientSoc]   = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTel,   setClientTel]   = useState("");
  const [clientAdr,   setClientAdr]   = useState("");
  const [clientVille, setClientVille] = useState("");
  const [clientCP,    setClientCP]    = useState("");
  const [clientPays,  setClientPays]  = useState("France");
  const [clientTva,   setClientTva]   = useState("");

  const [emNom,   setEmNom]   = useState("");
  const [emEmail, setEmEmail] = useState("");
  const [emAdr,   setEmAdr]   = useState("");
  const [emVille, setEmVille] = useState("");
  const [emCP,    setEmCP]    = useState("");
  const [emPays,  setEmPays]  = useState("France");
  const [emSiret, setEmSiret] = useState("");
  const [emTva,   setEmTva]   = useState("");
  const [emLogo,  setEmLogo]  = useState("");

  const [saving,        setSaving]        = useState(false);
  const [downloading,   setDownloading]   = useState(false);
  const [error,         setError]         = useState("");
  const [saved,         setSaved]         = useState(false);
  const [openSection,   setOpenSection]   = useState<string>("client");
  const [clientSearch,  setClientSearch]  = useState("");
  const [clients,       setClients]       = useState<FacturesClient[]>([]);
  const [showClients,   setShowClients]   = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [coDefaults,    setCoDefaults]    = useState<CompanySettings | null>(null);
  const [orgId,         setOrgId]         = useState<string | null>(null);

  const pageBg      = isDark ? "#0f1117"                : "#f8f9fa";
  const textPrimary = isDark ? "#ffffff"                : "#0a0a0a";
  const textSecond  = isDark ? "rgba(255,255,255,0.55)" : "#4b5563";
  const textTert    = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";
  const cardBg      = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder  = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const inputBd     = isDark ? "rgba(255,255,255,0.10)" : "#d1d5db";
  const labelCol    = isDark ? "rgba(255,255,255,0.40)" : "#6b7280";
  const divider     = isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6";

  const inputCls = `w-full rounded-lg px-3 py-2 text-sm outline-none transition`;
  const inputStyle = { background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary };

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: orgMember } = await supabase
          .from("organization_members").select("organization_id")
          .eq("user_id", user.id).in("role", ["owner", "admin"])
          .is("suspended_at", null).limit(1).maybeSingle();
        const oid = orgMember?.organization_id ?? null;
        setOrgId(oid);
        const co = oid ? await fetchOrgSettings(oid) : await fetchCompanySettings(user.id);
        if (co) {
          setCoDefaults(co);
          setEmNom(co.name || ""); setEmEmail(co.email || ""); setEmAdr(co.address || "");
          setEmVille(co.city || ""); setEmCP(co.postal_code || ""); setEmPays(co.country || "France");
          setEmSiret(co.siret || ""); setEmTva(co.vat_number || ""); setEmLogo(co.logoUrl || "");
        }
        const res = await fetch(`/api/factures/numero?type=devis&devise=EUR`);
        if (res.ok) { const j = await res.json(); setNumero(j.numero ?? ""); }
      } catch (e) { console.error("[NouveauDevis init]", e); }
    })();
  }, []);

  const searchClients = useCallback(async (q: string) => {
    if (q.length < 2) { setClients([]); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let query = supabase.from("factures_clients")
        .select("id,nom,societe,email,telephone,adresse,ville,code_postal,pays,tva")
        .or(`nom.ilike.%${q}%,societe.ilike.%${q}%,email.ilike.%${q}%`).limit(8);
      if (orgId) query = query.eq("organization_id", orgId);
      else       query = query.eq("user_id", user.id);
      const { data } = await query;
      setClients((data ?? []) as FacturesClient[]);
    } catch {}
  }, [orgId]);

  useEffect(() => {
    const t = setTimeout(() => searchClients(clientSearch), 300);
    return () => clearTimeout(t);
  }, [clientSearch, searchClients]);

  function pickClient(c: FacturesClient) {
    setClientNom(c.nom || ""); setClientSoc(c.societe || ""); setClientEmail(c.email || "");
    setClientTel(c.telephone || ""); setClientAdr(c.adresse || ""); setClientVille(c.ville || "");
    setClientCP(c.code_postal || ""); setClientPays(c.pays || "France"); setClientTva(c.tva || "");
    setShowClients(false); setClientSearch("");
  }

  const totals = useMemo(() => calcTotals(items, remise_pct, acompte), [items, remise_pct, acompte]);

  const previewData: PreviewData = useMemo(() => ({
    type:           "quote",
    reference:      numero || "DEV-2026-001",
    issue_date:     dateDoc,
    valid_until:    dateVal || null,
    due_date:       null,
    client_name:    clientNom || "Client",
    client_email:   clientEmail,
    client_company: clientSoc || null,
    client_address: [clientAdr, [clientCP, clientVille].filter(Boolean).join(" "), clientPays].filter(Boolean).join("\n") || null,
    subject:        sujet || "Devis",
    items: items.map(it => ({ description: it.description || "Prestation", quantity: it.quantity, unit_price: it.unit_price, total: r2(it.quantity * it.unit_price * (1 - (it.remise_pct || 0) / 100)) })),
    subtotal: totals.subtotal_ht,
    discount_rate: remise_pct > 0 ? remise_pct : null,
    discount: totals.remise > 0 ? totals.remise : null,
    tax_rate: items[0]?.vat_rate ?? 20,
    tax_amount: totals.tva,
    total: totals.ttc,
    notes: notes || null,
    color: couleur,
    company: {
      name: emNom, email: emEmail, phone: coDefaults?.phone || "", website: coDefaults?.website || "",
      address: [emAdr, [emCP, emVille].filter(Boolean).join(" "), emPays].filter(Boolean).join("\n"),
      city: emVille, postal_code: emCP, country: emPays, siret: emSiret, vat_number: emTva,
      logoUrl: emLogo || null, iban: "", bic: "", ape: coDefaults?.ape || "",
      forme_juridique: coDefaults?.forme_juridique || "", capital_social: coDefaults?.capital_social || "",
      logoSize: "md", logoHideName: false,
    },
  }), [numero, dateDoc, dateVal, clientNom, clientEmail, clientSoc, clientAdr, clientCP, clientVille, clientPays, sujet, items, totals, remise_pct, notes, couleur, emNom, emEmail, emAdr, emCP, emVille, emPays, emSiret, emTva, emLogo, coDefaults]);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      const body = {
        type: "devis", statut: "brouillon",
        numero, sujet, devise,
        date_document: dateDoc, date_echeance: dateVal,
        emetteur_nom: emNom, emetteur_email: emEmail, emetteur_adresse: emAdr,
        emetteur_ville: emVille, emetteur_code_postal: emCP, emetteur_pays: emPays,
        emetteur_siret: emSiret, emetteur_tva: emTva, emetteur_logo: emLogo,
        client_nom: clientNom, client_societe: clientSoc, client_email: clientEmail,
        client_telephone: clientTel, client_adresse: clientAdr, client_ville: clientVille,
        client_code_postal: clientCP, client_pays: clientPays, client_tva: clientTva,
        remise_pct, acompte, notes, conditions,
        template, couleur,
        total_ht: totals.ht_net, total_tva: totals.tva, total_ttc: totals.ttc,
        organization_id: orgId,
        items: items.map((it, i) => ({ ...it, position: i + 1 })),
      };
      const res = await fetch("/api/factures/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur sauvegarde");
      const j = await res.json();
      setSaved(true);
      setTimeout(() => router.push(`/client/factures/documents?id=${j.id}`), 800);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur inconnue"); }
    finally { setSaving(false); }
  }

  async function handlePDF() {
    setDownloading(true); setError("");
    try {
      const { generatePdf } = await import("@/lib/pdf/generatePdf");
      const mainTaxRate = items.find(it => (it.vat_rate ?? 0) > 0)?.vat_rate ?? 20;
      await generatePdf({
        type: "quote", template, accentColor: couleur,
        reference: numero || "DEVIS", issue_date: dateDoc, valid_until: dateVal || null, due_date: null,
        client_name: clientNom || "(Client)", client_company: clientSoc || null,
        client_email: clientEmail, client_phone: clientTel || null,
        client_address: [clientAdr, [clientCP, clientVille].filter(Boolean).join(" "), clientPays].filter(Boolean).join("\n") || null,
        client_vat: clientTva || null, subject: sujet || "Devis",
        items: items.map(it => { const g = r2(it.quantity * it.unit_price); const rm = r2(g * (it.remise_pct || 0) / 100); return { description: it.description || "Prestation", unit: it.unit, quantity: it.quantity, unit_price: it.unit_price, total: r2(g - rm), tax_rate: it.vat_rate, discount_pct: it.remise_pct > 0 ? it.remise_pct : null }; }),
        subtotal: totals.subtotal_ht,
        discount_rate: remise_pct > 0 ? remise_pct : null,
        discount: totals.remise > 0 ? totals.remise : null,
        tax_rate: mainTaxRate, tax_amount: totals.tva, total: totals.ttc,
        notes: notes || null, currency: devise,
        company: { name: emNom, email: emEmail, phone: coDefaults?.phone || "", website: coDefaults?.website || "", address: [emAdr, [emCP, emVille].filter(Boolean).join(" "), emPays].filter(Boolean).join("\n"), city: emVille, postal_code: emCP, country: emPays, siret: emSiret, ape: coDefaults?.ape || "", vat_number: emTva, iban: "", bic: "", forme_juridique: coDefaults?.forme_juridique || "", capital_social: coDefaults?.capital_social || "", logoUrl: emLogo || null, logoSize: "md", logoHideName: false },
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur génération PDF"); }
    finally { setDownloading(false); }
  }

  function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
    const open = openSection === id;
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <button type="button" onClick={() => setOpenSection(open ? "" : id)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:opacity-80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: open ? "rgba(255,185,0,0.12)" : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6") }}>
              <Icon size={15} style={{ color: open ? GOLD : textTert }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: textPrimary }}>{title}</span>
          </div>
          {open ? <ChevronUp size={16} style={{ color: textTert }} /> : <ChevronDown size={16} style={{ color: textTert }} />}
        </button>
        {open && <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: divider }}>{children}</div>}
      </div>
    );
  }

  const fmtC = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise || "EUR", maximumFractionDigits: 2 }).format(n);

  return (
    <div className="min-h-full" style={{ background: pageBg }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6"
        style={{ background: isDark ? "#0f1117" : "#ffffff", borderColor: cardBorder }}>
        <div className="flex items-center gap-3">
          <Link href="/client/factures/devis"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <ArrowLeft size={15} style={{ color: textSecond }} />
          </Link>
          <div>
            <div className="text-sm font-bold" style={{ color: textPrimary }}>Nouveau devis</div>
            {numero && <div className="text-xs" style={{ color: textTert }}>{numero}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && <div className="text-xs" style={{ color: "#f87171" }}>{error}</div>}
          {saved && <div className="flex items-center gap-1 text-xs" style={{ color: "#4ade80" }}><Check size={12} /> Enregistré</div>}
          <button onClick={handlePDF} disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
            style={{ background: cardBg, color: textSecond, border: `1px solid ${cardBorder}` }}>
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            PDF
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-black transition hover:opacity-90 disabled:opacity-60"
            style={{ background: GOLD }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex gap-6 xl:gap-8">
          {/* Form */}
          <div className="flex flex-1 min-w-0 flex-col gap-4">

            {/* Template */}
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <button type="button" onClick={() => setShowTemplates(v => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:opacity-80">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: showTemplates ? "rgba(255,185,0,0.12)" : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6") }}>
                    <Palette size={15} style={{ color: showTemplates ? GOLD : textTert }} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: textPrimary }}>Modèle</span>
                    <span className="ml-2 text-xs" style={{ color: textTert }}>{TEMPLATE_CATALOG.find(t => t.id === template)?.name ?? template}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-sm" style={{ background: couleur }} />
                  {showTemplates ? <ChevronUp size={16} style={{ color: textTert }} /> : <ChevronDown size={16} style={{ color: textTert }} />}
                </div>
              </button>
              {showTemplates && (
                <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: divider }}>
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Couleur d&apos;accent</label>
                    <input type="color" value={couleur} onChange={e => setCouleur(e.target.value)} className="h-8 w-16 cursor-pointer rounded border-0 p-0.5" style={{ background: "transparent" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {TEMPLATE_CATALOG.map(t => (
                      <button key={t.id} type="button" onClick={() => setTemplate(t.id as TemplateType)}
                        className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition hover:opacity-80"
                        style={{ background: template === t.id ? "rgba(255,185,0,0.12)" : (isDark ? "rgba(255,255,255,0.03)" : "#f9fafb"), border: `1px solid ${template === t.id ? "rgba(255,185,0,0.35)" : cardBorder}` }}>
                        <div className="h-16 w-full overflow-hidden rounded-md bg-white shadow-sm">
                          <ScaledA4 scale={0.08}>
                            <InvoiceTemplate data={previewData} template={t.id as TemplateType} />
                          </ScaledA4>
                        </div>
                        <span className="text-[9px] font-medium leading-tight" style={{ color: template === t.id ? GOLD : textTert }}>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Header */}
            <div className="rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
                <span className="text-sm font-semibold" style={{ color: textPrimary }}>Informations générales</span>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Numéro</label>
                  <input className={inputCls} style={inputStyle} value={numero} onChange={e => setNumero(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Date d&apos;émission</label>
                  <input type="date" className={inputCls} style={inputStyle} value={dateDoc} onChange={e => setDateDoc(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Valable jusqu&apos;au</label>
                  <input type="date" className={inputCls} style={inputStyle} value={dateVal} onChange={e => setDateVal(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Sujet / Objet</label>
                  <input className={inputCls} style={inputStyle} placeholder="Objet du devis..." value={sujet} onChange={e => setSujet(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Devise</label>
                  <select className={inputCls} style={inputStyle} value={devise} onChange={e => setDevise(e.target.value)}>
                    {["EUR","USD","GBP","MAD","CHF","CAD","DZD","TND"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Client */}
            <Section id="client" title="Client" icon={User}>
              <div className="relative mb-4">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: textTert }} />
                  <input className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }} placeholder="Rechercher un client existant..."
                    value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClients(true); }} onFocus={() => setShowClients(true)} />
                </div>
                {showClients && clients.length > 0 && (
                  <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl shadow-xl"
                    style={{ background: isDark ? "#1a1b23" : "#ffffff", border: `1px solid ${cardBorder}` }}>
                    {clients.map(c => (
                      <button key={c.id} type="button" onClick={() => pickClient(c)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:opacity-80"
                        style={{ borderBottom: `1px solid ${divider}` }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(255,185,0,0.12)" }}>
                          <User size={13} style={{ color: GOLD }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: textPrimary }}>{c.nom}</div>
                          {c.societe && <div className="text-xs" style={{ color: textTert }}>{c.societe}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Nom</label><input className={inputCls} style={inputStyle} value={clientNom} onChange={e => setClientNom(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Société</label><input className={inputCls} style={inputStyle} value={clientSoc} onChange={e => setClientSoc(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Email</label><input type="email" className={inputCls} style={inputStyle} value={clientEmail} onChange={e => setClientEmail(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Téléphone</label><input className={inputCls} style={inputStyle} value={clientTel} onChange={e => setClientTel(e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Adresse</label><input className={inputCls} style={inputStyle} value={clientAdr} onChange={e => setClientAdr(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Code postal</label><input className={inputCls} style={inputStyle} value={clientCP} onChange={e => setClientCP(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Ville</label><input className={inputCls} style={inputStyle} value={clientVille} onChange={e => setClientVille(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Pays</label><input className={inputCls} style={inputStyle} value={clientPays} onChange={e => setClientPays(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>N° TVA</label><input className={inputCls} style={inputStyle} value={clientTva} onChange={e => setClientTva(e.target.value)} /></div>
              </div>
            </Section>

            {/* Articles */}
            <Section id="articles" title="Articles & Prestations" icon={FileText}>
              <div className="mb-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: textTert }}>
                      <th className="pb-2 text-left font-medium">Description</th>
                      <th className="pb-2 text-right font-medium w-16">Qté</th>
                      <th className="pb-2 text-right font-medium w-24">P.U. HT</th>
                      <th className="pb-2 text-right font-medium w-16">TVA %</th>
                      <th className="pb-2 text-right font-medium w-20">Total HT</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const lineHT = r2(item.quantity * item.unit_price * (1 - (item.remise_pct || 0) / 100));
                      return (
                        <tr key={item.id} className="group">
                          <td className="py-1 pr-2">
                            <input className="w-full rounded-lg px-2 py-1.5 text-xs outline-none" style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              placeholder="Description..." value={item.description}
                              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, description: e.target.value } : it))} />
                          </td>
                          <td className="py-1 pr-2">
                            <input type="number" min="0" step="0.01" className="w-full rounded-lg px-2 py-1.5 text-right text-xs outline-none" style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              value={item.quantity} onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, quantity: parseFloat(e.target.value) || 0 } : it))} />
                          </td>
                          <td className="py-1 pr-2">
                            <input type="number" min="0" step="0.01" className="w-full rounded-lg px-2 py-1.5 text-right text-xs outline-none" style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              value={item.unit_price} onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, unit_price: parseFloat(e.target.value) || 0 } : it))} />
                          </td>
                          <td className="py-1 pr-2">
                            <select className="w-full rounded-lg px-2 py-1.5 text-right text-xs outline-none" style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              value={item.vat_rate} onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, vat_rate: parseFloat(e.target.value) } : it))}>
                              {[0,5.5,10,20].map(r => <option key={r} value={r}>{r} %</option>)}
                            </select>
                          </td>
                          <td className="py-1 pr-2 text-right font-medium" style={{ color: textPrimary }}>{fmtC(lineHT)}</td>
                          <td className="py-1 text-center">
                            {items.length > 1 && (
                              <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                                className="opacity-0 group-hover:opacity-100 transition rounded p-1" style={{ color: "#f87171" }}>
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setItems(prev => [...prev, newLine(prev.length + 1)])}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-70"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", color: textSecond, border: `1px solid ${cardBorder}` }}>
                <Plus size={12} /> Ajouter une ligne
              </button>
              <div className="mt-5 flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: textTert }}>Sous-total HT</span><span style={{ color: textPrimary }}>{fmtC(totals.subtotal_ht)}</span></div>
                  {remise_pct > 0 && <div className="flex justify-between"><span style={{ color: textTert }}>Remise ({remise_pct} %)</span><span style={{ color: "#f87171" }}>−{fmtC(totals.remise)}</span></div>}
                  <div className="flex justify-between"><span style={{ color: textTert }}>TVA</span><span style={{ color: textPrimary }}>{fmtC(totals.tva)}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold text-base" style={{ borderColor: divider }}>
                    <span style={{ color: textPrimary }}>Total TTC</span>
                    <span style={{ color: GOLD }}>{fmtC(totals.ttc)}</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Conditions */}
            <Section id="conditions" title="Conditions & Notes" icon={Percent}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Remise globale (%)</label><input type="number" min="0" max="100" className={inputCls} style={inputStyle} value={remise_pct} onChange={e => setRemisePct(parseFloat(e.target.value) || 0)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Acompte ({devise})</label><input type="number" min="0" className={inputCls} style={inputStyle} value={acompte} onChange={e => setAcompte(parseFloat(e.target.value) || 0)} /></div>
                <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Conditions</label><textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} value={conditions} onChange={e => setConditions(e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Notes</label><textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
              </div>
            </Section>

            {/* Emetteur */}
            <Section id="emetteur" title="Mon entreprise" icon={Building2}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Nom / Raison sociale</label><input className={inputCls} style={inputStyle} value={emNom} onChange={e => setEmNom(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Email</label><input type="email" className={inputCls} style={inputStyle} value={emEmail} onChange={e => setEmEmail(e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Adresse</label><input className={inputCls} style={inputStyle} value={emAdr} onChange={e => setEmAdr(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Code postal</label><input className={inputCls} style={inputStyle} value={emCP} onChange={e => setEmCP(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>Ville</label><input className={inputCls} style={inputStyle} value={emVille} onChange={e => setEmVille(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>SIRET</label><input className={inputCls} style={inputStyle} value={emSiret} onChange={e => setEmSiret(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs font-medium" style={{ color: labelCol }}>N° TVA</label><input className={inputCls} style={inputStyle} value={emTva} onChange={e => setEmTva(e.target.value)} /></div>
              </div>
              <p className="mt-3 text-xs" style={{ color: textTert }}>
                Modifiez vos coordonnées dans <Link href="/client/factures/entreprise" className="underline hover:opacity-80" style={{ color: GOLD }}>Mon entreprise</Link>.
              </p>
            </Section>

          </div>

          {/* Live preview */}
          <div className="hidden xl:block" style={{ width: 320, flexShrink: 0 }}>
            <div className="sticky top-20">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: textTert }}>Aperçu</span>
                <span className="text-xs" style={{ color: textTert }}>A4</span>
              </div>
              <div className="overflow-hidden rounded-xl shadow-xl" style={{ border: `1px solid ${cardBorder}` }}>
                <ScaledA4 scale={320 / 794}>
                  <InvoiceTemplate data={previewData} template={template} />
                </ScaledA4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
