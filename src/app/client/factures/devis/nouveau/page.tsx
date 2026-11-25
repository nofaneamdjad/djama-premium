"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Save, FileDown, ChevronDown, ChevronUp,
  Plus, Trash2, Search, User, Building2, Check,
  FileText, Percent, Eye, Pencil, LayoutGrid,
  ZoomIn, ZoomOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import { TEMPLATE_CATALOG } from "@/lib/pdf/pdfThemes";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { ScaledA4 } from "@/components/invoice/TemplateSelector";
import { TemplateGalleryModal } from "@/components/invoice/TemplateGalleryModal";
import { fetchCompanySettings, fetchOrgSettings } from "@/lib/pdf/companySettings";
import type { TemplateType } from "@/lib/pdf/types";
import type { PreviewData } from "@/components/invoice/shared";
import { SUPPORTED_LANGUAGES } from "@/lib/invoice/docLang";
import { TAX_SYSTEMS, getTaxSystem } from "@/lib/invoice/taxSystems";
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

const UNITS = ["Pièce", "h", "j", "sem.", "mois", "kg", "m²", "L", "Forfait", "unité"];

const TAX_RATE_PRESETS: Record<string, number[]> = {
  tva:         [0, 2.1, 5.5, 8.5, 10, 20],
  vat:         [0, 5, 20],
  gst:         [0, 5, 10, 15, 18],
  hst:         [0, 5, 12, 13, 15],
  sales_tax:   [],
  withholding: [],
  none:        [0],
  custom:      [],
};

function newLine(pos: number): LineItem {
  return { id: crypto.randomUUID(), position: pos, description: "", sub_description: "", unit: "unité", quantity: 1, unit_price: 0, vat_rate: 20, remise_pct: 0 };
}

function r2(n: number) { return Math.round(n * 100) / 100; }

function calcTotals(items: LineItem[], remise_pct: number, remise_fixe: number, remise_type: "pct" | "fixe", acompte: number) {
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
  const remise  = remise_type === "fixe"
    ? Math.min(r2(remise_fixe), subtotal_ht)
    : r2(subtotal_ht * remise_pct / 100);
  const ht_net  = r2(subtotal_ht - remise);
  const tva_net = subtotal_ht > 0 ? r2(tva * ht_net / subtotal_ht) : 0;
  const finalTva = remise > 0 ? tva_net : tva;
  return { subtotal_ht, remise, ht_net, tva: finalTva, ttc: r2(ht_net + finalTva) };
}

export default function NouveauDevis() {
  const { isDark } = useTheme();
  const router     = useRouter();

  // ── form state ───────────────────────────────────────────────────────────────
  const [template,    setTemplate]    = useState<TemplateType>("min-ligne");
  const [couleur,     setCouleur]     = useState(GOLD);
  const [numero,      setNumero]      = useState("");
  const [dateDoc,     setDateDoc]     = useState(() => new Date().toISOString().slice(0, 10));
  const [dateVal,     setDateVal]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });
  const [sujet,       setSujet]       = useState("");
  const [items,       setItems]       = useState<LineItem[]>([newLine(1)]);
  const [remise_pct,    setRemisePct]    = useState(0);
  const [remiseType,    setRemiseType]   = useState<"pct" | "fixe">("pct");
  const [remiseFixe,    setRemiseFixe]   = useState(0);
  const [acompte,       setAcompte]      = useState(0);
  const [acompteType,   setAcompteType]  = useState("Acompte");
  const [modeReglement, setModeReglement] = useState("");
  const [devise,        setDevise]       = useState("EUR");
  const [docLang,       setDocLang]      = useState("fr");
  const [taxSystemId,   setTaxSystemId]  = useState("tva");
  const [notes,         setNotes]        = useState("");
  const [conditions,    setConditions]   = useState("");

  // client
  const [clientNom,       setClientNom]       = useState("");
  const [clientSoc,       setClientSoc]       = useState("");
  const [clientEmail,     setClientEmail]     = useState("");
  const [clientTel,       setClientTel]       = useState("");
  const [clientTelPrefix, setClientTelPrefix] = useState("+33");
  const [clientAdr,       setClientAdr]       = useState("");
  const [clientVille,     setClientVille]     = useState("");
  const [clientCP,        setClientCP]        = useState("");
  const [clientPays,      setClientPays]      = useState("France");
  const [clientTva,       setClientTva]       = useState("");
  const [clientType,      setClientType]      = useState<"particulier"|"entreprise"|"association"|"administration">("entreprise");

  // références
  const [refClient,   setRefClient]   = useState("");
  const [refCommande, setRefCommande] = useState("");
  const [refProjet,   setRefProjet]   = useState("");

  // émetteur
  const [emNom,   setEmNom]   = useState("");
  const [emEmail, setEmEmail] = useState("");
  const [emAdr,   setEmAdr]   = useState("");
  const [emVille, setEmVille] = useState("");
  const [emCP,    setEmCP]    = useState("");
  const [emPays,  setEmPays]  = useState("France");
  const [emSiret, setEmSiret] = useState("");
  const [emTva,   setEmTva]   = useState("");
  const [emLogo,  setEmLogo]  = useState("");

  // UI
  const [saving,       setSaving]       = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [error,        setError]        = useState("");
  const [saved,        setSaved]        = useState(false);
  const [openSection,  setOpenSection]  = useState<string>("infos");
  const [clientSearch, setClientSearch] = useState("");
  const [clients,      setClients]      = useState<FacturesClient[]>([]);
  const [showClients,  setShowClients]  = useState(false);
  const [coDefaults,   setCoDefaults]   = useState<CompanySettings | null>(null);
  const [orgId,        setOrgId]        = useState<string | null>(null);
  const [galleryOpen,  setGalleryOpen]  = useState(false);

  // plein écran
  const [isDirty,      setIsDirty]      = useState(false);
  const [activeTab,    setActiveTab]    = useState<"edit" | "preview">("edit");
  const [previewScale, setPreviewScale] = useState(0.55);
  const [zoomLevel,    setZoomLevel]    = useState(1.0);
  const initDone        = useRef(false);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  // ── theme ────────────────────────────────────────────────────────────────────
  const editorBg    = isDark ? "#0a0a12"                : "#f8f9fa";
  const headerBg    = isDark ? "#0d0d14"                : "#ffffff";
  const previewBg   = isDark ? "#07070d"                : "#edf0f3";
  const textPrimary = isDark ? "#ffffff"                : "#0a0a0a";
  const textSecond  = isDark ? "rgba(255,255,255,0.55)" : "#4b5563";
  const textTert    = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";
  const cardBg      = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder  = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const inputBd     = isDark ? "rgba(255,255,255,0.10)" : "#d1d5db";
  const labelCol    = isDark ? "rgba(255,255,255,0.40)" : "#6b7280";
  const divider     = isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6";
  const sectionBg   = isDark ? "rgba(255,255,255,0.025)" : "#f8f9fa";

  const inputCls  = "w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-yellow-400/30";
  const inputStyle = { background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary };

  // ── init ─────────────────────────────────────────────────────────────────────
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
        const res = await fetch("/api/factures/numero", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "devis" }),
        });
        if (res.ok) { const j = await res.json(); setNumero(j.numero ?? ""); }
      } catch (e) {
        console.error("[NouveauDevis init]", e);
      } finally {
        initDone.current = true;
      }
    })();
  }, []);

  // ── dirty tracking ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initDone.current) return;
    setIsDirty(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, couleur, numero, dateDoc, dateVal, sujet, items, remise_pct, remiseType, remiseFixe, acompte, acompteType, modeReglement, devise, taxSystemId, notes, conditions, clientNom, clientSoc, clientEmail, clientTel, clientTelPrefix, clientAdr, clientVille, clientCP, clientPays, clientTva, clientType, refClient, refCommande, refProjet, emNom, emEmail, emAdr, emVille, emCP, emPays, emSiret, emTva, emLogo]);

  // ── beforeunload ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── preview panel resize ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = previewPanelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const targetW = Math.min(w - 96, 560);
      setPreviewScale(Math.max(0.28, targetW / 794));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── clients search ───────────────────────────────────────────────────────────
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
    const rawTel = c.telephone || "";
    const prefixMatch = rawTel.match(/^(\+\d{1,4})\s*(.*)/);
    if (prefixMatch) { setClientTelPrefix(prefixMatch[1]); setClientTel(prefixMatch[2]); }
    else { setClientTel(rawTel); }
    setClientAdr(c.adresse || ""); setClientVille(c.ville || "");
    setClientCP(c.code_postal || ""); setClientPays(c.pays || "France"); setClientTva(c.tva || "");
    setShowClients(false); setClientSearch("");
  }

  // ── totals ───────────────────────────────────────────────────────────────────
  const totals = useMemo(() => calcTotals(items, remise_pct, remiseFixe, remiseType, acompte), [items, remise_pct, remiseFixe, remiseType, acompte]);

  // ── preview data ─────────────────────────────────────────────────────────────
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
    items: items.map(it => ({
      description: it.description || "Prestation",
      quantity:    it.quantity,
      unit_price:  it.unit_price,
      total:       r2(it.quantity * it.unit_price * (1 - (it.remise_pct || 0) / 100)),
    })),
    subtotal:      totals.subtotal_ht,
    discount_rate:  remiseType === "pct" && remise_pct > 0 ? remise_pct : null,
    discount:       totals.remise > 0 ? totals.remise : null,
    discount_label: remiseType === "fixe" ? "Remise" : remise_pct > 0 ? `Remise ${remise_pct}%` : null,
    tax_rate:       items[0]?.vat_rate ?? 0,
    tax_amount:     totals.tva,
    tax_label:      (() => {
      const sys = getTaxSystem(taxSystemId);
      if (taxSystemId === "none") return sys.short;
      const rates = [...new Set(items.map(it => it.vat_rate ?? 0).filter(r => r > 0))];
      if (rates.length === 0) return sys.short;
      return rates.length === 1 ? `${sys.short} ${rates[0]}%` : `${sys.short}`;
    })(),
    total:         totals.ttc,
    notes:         notes || null,
    color:         couleur,
    currency:      devise,
    lang:          docLang,
    company: {
      name:        emNom,
      email:       emEmail,
      address:     [emAdr, [emCP, emVille].filter(Boolean).join(" "), emPays].filter(Boolean).join("\n"),
      city:        emVille,
      postal_code: emCP,
      country:     emPays,
      siret:       emSiret,
      vat_number:  emTva,
      logoUrl:     emLogo || null,
      iban:        "",
      bic:         "",
      phone:       coDefaults?.phone || "",
      website:     coDefaults?.website || "",
      ape:         coDefaults?.ape || "",
      forme_juridique: coDefaults?.forme_juridique || "",
      capital_social:  coDefaults?.capital_social  || "",
      logoSize:    "md",
      logoHideName: false,
    },
  }), [numero, dateDoc, dateVal, clientNom, clientEmail, clientSoc, clientAdr, clientCP, clientVille, clientPays, sujet, items, totals, remise_pct, remiseType, remiseFixe, notes, couleur, devise, docLang, taxSystemId, emNom, emEmail, emAdr, emCP, emVille, emPays, emSiret, emTva, emLogo, coDefaults]);

  // ── navigation ───────────────────────────────────────────────────────────────
  function handleBack() {
    if (isDirty && !window.confirm("Vous avez des modifications non enregistrées. Quitter quand même ?")) return;
    router.push("/client/factures/devis");
  }

  // ── save ─────────────────────────────────────────────────────────────────────
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
        client_telephone: clientTel ? `${clientTelPrefix} ${clientTel}` : null,
        client_adresse: clientAdr, client_ville: clientVille,
        client_code_postal: clientCP, client_pays: clientPays, client_tva: clientTva,
        client_type: clientType,
        ref_client: refClient || null, ref_commande: refCommande || null, ref_projet: refProjet || null,
        remise_pct, remise_type: remiseType, remise_fixe: remiseFixe,
        acompte, acompte_type: acompteType,
        mode_reglement: modeReglement || null,
        notes, conditions,
        doc_lang: docLang, tax_system: taxSystemId,
        template, couleur,
        total_ht: totals.ht_net, total_tva: totals.tva, total_ttc: totals.ttc,
        organization_id: orgId,
        items: items.map((it, i) => ({ ...it, position: i + 1 })),
      };
      const res = await fetch("/api/factures/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur sauvegarde");
      const j = await res.json();
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => router.push(`/client/factures/documents?id=${j.id}`), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally { setSaving(false); }
  }

  // ── PDF ──────────────────────────────────────────────────────────────────────
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
        items: items.map(it => {
          const g  = r2(it.quantity * it.unit_price);
          const rm = r2(g * (it.remise_pct || 0) / 100);
          return { description: it.description || "Prestation", unit: it.unit, quantity: it.quantity, unit_price: it.unit_price, total: r2(g - rm), tax_rate: it.vat_rate, discount_pct: it.remise_pct > 0 ? it.remise_pct : null };
        }),
        subtotal: totals.subtotal_ht,
        discount_rate: remise_pct > 0 ? remise_pct : null,
        discount: totals.remise > 0 ? totals.remise : null,
        tax_rate: mainTaxRate, tax_amount: totals.tva, total: totals.ttc,
        notes: notes || null, currency: devise,
        company: {
          name: emNom, email: emEmail, phone: coDefaults?.phone || "", website: coDefaults?.website || "",
          address: [emAdr, [emCP, emVille].filter(Boolean).join(" "), emPays].filter(Boolean).join("\n"),
          city: emVille, postal_code: emCP, country: emPays, siret: emSiret, ape: coDefaults?.ape || "",
          vat_number: emTva, iban: "", bic: "",
          forme_juridique: coDefaults?.forme_juridique || "", capital_social: coDefaults?.capital_social || "",
          logoUrl: emLogo || null, logoSize: "md", logoHideName: false,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur génération PDF");
    } finally { setDownloading(false); }
  }

  // ── section toggle ────────────────────────────────────────────────────────────
  function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
    const open = openSection === id;
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <button type="button" onClick={() => setOpenSection(open ? "" : id)}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-black/[0.015]">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
            style={{ background: open ? "rgba(255,185,0,0.1)" : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6") }}>
            <Icon size={13} style={{ color: open ? GOLD : textTert }} />
          </div>
          <span className="flex-1 text-sm font-semibold" style={{ color: textPrimary }}>{title}</span>
          {open
            ? <ChevronUp size={14} style={{ color: textTert }} />
            : <ChevronDown size={14} style={{ color: textTert }} />}
        </button>
        {open && (
          <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: divider }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  const fmtC = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise || "EUR", maximumFractionDigits: 2 }).format(n);
  const taxSystem = getTaxSystem(taxSystemId);

  const computedScale = previewScale * zoomLevel;
  const thumbScale    = 48 / 794;
  const info = TEMPLATE_CATALOG.find(t => t.id === template);

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: editorBg }}>

      {/* ── TOP BAR ── */}
      <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-5"
        style={{ height: 56, background: headerBg, borderColor: cardBorder }}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button type="button" onClick={handleBack}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition hover:opacity-70"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <ArrowLeft size={15} style={{ color: textSecond }} />
          </button>
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: textPrimary }}>Nouveau devis</span>
            {numero && (
              <span className="hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                style={{ background: isDark ? "rgba(255,185,0,0.1)" : "rgba(255,185,0,0.08)", color: GOLD }}>
                {numero}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {isDirty && !saved && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: textTert }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#fb923c" }} />
              Non enregistré
            </div>
          )}
          {error && <div className="hidden sm:block max-w-[180px] truncate text-xs" style={{ color: "#f87171" }}>{error}</div>}
          {saved && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "#4ade80" }}>
              <Check size={12} /> Enregistré
            </div>
          )}
          <button onClick={handlePDF} disabled={downloading}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
            style={{ background: cardBg, color: textSecond, border: `1px solid ${cardBorder}` }}>
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-90 disabled:opacity-60"
            style={{ background: GOLD, color: "#000000" }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Enregistrer
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: form panel ── */}
        <div className={`${activeTab === "edit" ? "flex" : "hidden"} lg:flex w-full lg:w-[520px] lg:flex-shrink-0 flex-col overflow-y-auto`}
          style={{ borderRight: `1px solid ${cardBorder}`, background: editorBg }}>
          <div className="flex flex-col gap-3 p-4 sm:p-5 pb-24 lg:pb-8">

            {/* ── MODÈLE (compact) ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="flex items-center gap-3 p-3">
                {/* Real A4 thumbnail */}
                <div className="flex-shrink-0 overflow-hidden rounded-md"
                  style={{ width: 48, height: Math.round(thumbScale * 1122), border: `1px solid ${cardBorder}`, pointerEvents: "none", background: "#fff" }}>
                  <ScaledA4 scale={thumbScale}>
                    <InvoiceTemplate data={previewData} type={template} />
                  </ScaledA4>
                </div>

                {/* Template name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                    {info?.label ?? template}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: textTert }}>Modèle de document</div>
                </div>

                {/* Language selector */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <select
                    value={docLang}
                    onChange={e => setDocLang(e.target.value)}
                    style={{
                      width: 54,
                      height: 30,
                      borderRadius: 8,
                      border: `1px solid ${cardBorder}`,
                      fontSize: 11,
                      padding: "0 4px",
                      background: cardBg,
                      color: textSecond,
                      cursor: "pointer",
                    }}>
                    {SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>
                    ))}
                  </select>
                  <span className="text-[10px]" style={{ color: textTert }}>Langue</span>
                </div>

                {/* Color picker */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-xs hidden sm:block" style={{ color: textTert }}>Couleur</span>
                  <div className="relative">
                    <input
                      type="color"
                      value={couleur}
                      onChange={e => setCouleur(e.target.value)}
                      className="cursor-pointer"
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${cardBorder}`, padding: 2, background: "none" }}
                    />
                  </div>
                </div>

                {/* Change model button */}
                <button type="button" onClick={() => setGalleryOpen(true)}
                  className="hidden sm:flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                  style={{ background: isDark ? "rgba(255,185,0,0.1)" : "rgba(255,185,0,0.08)", color: GOLD, border: "1px solid rgba(255,185,0,0.2)", whiteSpace: "nowrap" }}>
                  Changer
                </button>
              </div>
              {/* Mobile "Changer" row */}
              <div className="sm:hidden border-t px-3 py-2.5" style={{ borderColor: divider }}>
                <button type="button" onClick={() => setGalleryOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition hover:opacity-80"
                  style={{ background: isDark ? "rgba(255,185,0,0.1)" : "rgba(255,185,0,0.08)", color: GOLD, border: "1px solid rgba(255,185,0,0.2)" }}>
                  Changer de modèle
                </button>
              </div>
            </div>

            {/* Gallery modal */}
            <TemplateGalleryModal
              open={galleryOpen}
              currentTemplate={template}
              currentCouleur={couleur}
              onApply={(t, c) => { setTemplate(t); setCouleur(c); }}
              onClose={() => setGalleryOpen(false)}
            />

            {/* ── INFOS GÉNÉRALES ── */}
            <Section id="infos" title="Informations générales" icon={LayoutGrid}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Numéro</label>
                  <input className={inputCls} style={inputStyle} value={numero} onChange={e => setNumero(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Date d&apos;émission</label>
                  <input type="date" className={inputCls} style={inputStyle} value={dateDoc} onChange={e => setDateDoc(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Valable jusqu&apos;au</label>
                  <input type="date" className={inputCls} style={inputStyle} value={dateVal} onChange={e => setDateVal(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Devise</label>
                  <select className={inputCls} style={inputStyle} value={devise} onChange={e => setDevise(e.target.value)}>
                    {["EUR","USD","GBP","MAD","CHF","CAD","DZD","TND","AED","XOF","XAF","MGA","MUR","KMF","ZAR","KES","BRL","JPY","CNY","INR","AUD"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Sujet / Objet</label>
                  <input className={inputCls} style={inputStyle} placeholder="Objet du devis..." value={sujet} onChange={e => setSujet(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Réf. client</label>
                  <input className={inputCls} style={inputStyle} placeholder="RC-2026-001" value={refClient} onChange={e => setRefClient(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>N° commande / BC</label>
                  <input className={inputCls} style={inputStyle} placeholder="PO-12345" value={refCommande} onChange={e => setRefCommande(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>N° projet / contrat</label>
                  <input className={inputCls} style={inputStyle} placeholder="PROJ-2026-X" value={refProjet} onChange={e => setRefProjet(e.target.value)} />
                </div>
              </div>
            </Section>

            {/* ── CLIENT ── */}
            <Section id="client" title="Client" icon={User}>
              {/* Search */}
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: textTert }} />
                <input className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }}
                  placeholder="Rechercher un client existant..."
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClients(true); }}
                  onFocus={() => setShowClients(true)} />
                {showClients && clients.length > 0 && (
                  <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl shadow-xl"
                    style={{ background: isDark ? "#1a1b23" : "#ffffff", border: `1px solid ${cardBorder}` }}>
                    {clients.map(c => (
                      <button key={c.id} type="button" onClick={() => pickClient(c)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-black/5"
                        style={{ borderBottom: `1px solid ${divider}` }}>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0"
                          style={{ background: "rgba(255,185,0,0.1)" }}>
                          <User size={12} style={{ color: GOLD }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: textPrimary }}>{c.nom}</div>
                          {c.societe && <div className="text-xs truncate" style={{ color: textTert }}>{c.societe}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Type de tiers */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {(["entreprise","particulier","association","administration"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setClientType(t)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition"
                    style={{
                      background: clientType === t ? GOLD : (isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6"),
                      color:      clientType === t ? "#000" : textSecond,
                      border:     clientType === t ? `1px solid ${GOLD}` : `1px solid ${cardBorder}`,
                    }}
                  >
                    {t === "entreprise" ? "Entreprise" : t === "particulier" ? "Particulier" : t === "association" ? "Association" : "Administration"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>
                    {clientType === "particulier" ? "Nom & Prénom" : "Nom du contact"}
                  </label>
                  <input className={inputCls} style={inputStyle} value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder={clientType === "particulier" ? "Jean Dupont" : "Prénom NOM"} />
                </div>
                {clientType !== "particulier" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>
                      {clientType === "association" ? "Nom de l'association" : clientType === "administration" ? "Organisme / Service" : "Société"}
                    </label>
                    <input className={inputCls} style={inputStyle} value={clientSoc} onChange={e => setClientSoc(e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Email</label>
                  <input type="email" className={inputCls} style={inputStyle} value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Téléphone</label>
                  <div className="flex gap-1.5">
                    <select
                      className="rounded-lg px-2 py-2 text-xs outline-none flex-shrink-0"
                      style={{ ...inputStyle, width: 76 }}
                      value={clientTelPrefix}
                      onChange={e => setClientTelPrefix(e.target.value)}
                    >
                      {["+33","+1","+44","+32","+41","+49","+39","+34","+351","+212","+213","+216","+269","+261","+230","+971","+966","+974","+965","+55","+81","+86","+91","+27","+254","+255","+234","+225","+237","+221","+32"].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input className={`${inputCls} flex-1`} style={inputStyle} placeholder="6 00 00 00 00" value={clientTel} onChange={e => setClientTel(e.target.value)} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Adresse</label>
                  <input className={inputCls} style={inputStyle} value={clientAdr} onChange={e => setClientAdr(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Code postal</label>
                  <input className={inputCls} style={inputStyle} value={clientCP} onChange={e => setClientCP(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Ville</label>
                  <input className={inputCls} style={inputStyle} value={clientVille} onChange={e => setClientVille(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Pays</label>
                  <input className={inputCls} style={inputStyle} value={clientPays} onChange={e => setClientPays(e.target.value)} />
                </div>
                {clientType !== "particulier" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>
                      {clientType === "administration" ? "N° SIRET / INSEE" : "N° TVA intracommunautaire"}
                    </label>
                    <input className={inputCls} style={inputStyle} value={clientTva} onChange={e => setClientTva(e.target.value)} />
                  </div>
                )}
              </div>
            </Section>

            {/* ── ARTICLES ── */}
            <Section id="articles" title="Articles & Prestations" icon={FileText}>
              {/* Système fiscal */}
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium shrink-0" style={{ color: labelCol }}>Système fiscal :</span>
                <div className="flex flex-wrap gap-1.5">
                  {TAX_SYSTEMS.map(ts => (
                    <button key={ts.id} type="button" title={ts.description}
                      onClick={() => {
                        setTaxSystemId(ts.id);
                        setItems(prev => prev.map(it => ({ ...it, vat_rate: ts.defaultRate })));
                      }}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium transition"
                      style={{
                        background: taxSystemId === ts.id ? GOLD : (isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6"),
                        color:      taxSystemId === ts.id ? "#000" : textSecond,
                        border:     taxSystemId === ts.id ? `1px solid ${GOLD}` : `1px solid ${cardBorder}`,
                      }}>
                      {ts.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="mb-3 overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-medium" style={{ color: textTert }}>Description</th>
                      <th className="pb-2 text-left font-medium w-20" style={{ color: textTert }}>Unité</th>
                      <th className="pb-2 text-right font-medium w-14" style={{ color: textTert }}>Qté</th>
                      <th className="pb-2 text-right font-medium w-20" style={{ color: textTert }}>P.U. HT</th>
                      {taxSystemId !== "none" && (
                        <th className="pb-2 text-right font-medium w-18" style={{ color: textTert }}>{taxSystem.short}</th>
                      )}
                      <th className="pb-2 text-right font-medium w-20" style={{ color: textTert }}>Total HT</th>
                      <th className="pb-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const lineHT  = r2(item.quantity * item.unit_price * (1 - (item.remise_pct || 0) / 100));
                      const presets = TAX_RATE_PRESETS[taxSystemId] ?? [];
                      return (
                        <tr key={item.id} className="group">
                          <td className="py-1.5 pr-2">
                            <input className="w-full rounded-md px-2 py-1.5 text-xs outline-none"
                              style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              placeholder="Description..." value={item.description}
                              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, description: e.target.value } : it))} />
                          </td>
                          <td className="py-1.5 pr-2">
                            <select className="w-full rounded-md px-1.5 py-1.5 text-xs outline-none"
                              style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              value={item.unit}
                              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, unit: e.target.value } : it))}>
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="py-1.5 pr-1">
                            <input type="number" min="0" step="0.01"
                              className="w-full rounded-md px-1.5 py-1.5 text-right text-xs outline-none"
                              style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              value={item.quantity}
                              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, quantity: parseFloat(e.target.value) || 0 } : it))} />
                          </td>
                          <td className="py-1.5 pr-1">
                            <input type="number" min="0" step="0.01"
                              className="w-full rounded-md px-1.5 py-1.5 text-right text-xs outline-none"
                              style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                              value={item.unit_price}
                              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, unit_price: parseFloat(e.target.value) || 0 } : it))} />
                          </td>
                          {taxSystemId !== "none" && (
                            <td className="py-1.5 pr-1">
                              {presets.length > 0 ? (
                                <select className="w-full rounded-md px-1 py-1.5 text-xs outline-none"
                                  style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                                  value={item.vat_rate}
                                  onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, vat_rate: parseFloat(e.target.value) } : it))}>
                                  {presets.map(r => <option key={r} value={r}>{r} %</option>)}
                                </select>
                              ) : (
                                <input type="number" min="0" max="100" step="0.1"
                                  className="w-full rounded-md px-1.5 py-1.5 text-right text-xs outline-none"
                                  style={{ background: inputBg, border: `1px solid ${inputBd}`, color: textPrimary }}
                                  value={item.vat_rate}
                                  onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, vat_rate: parseFloat(e.target.value) || 0 } : it))} />
                              )}
                            </td>
                          )}
                          <td className="py-1.5 pr-1 text-right font-medium tabular-nums" style={{ color: textPrimary }}>{fmtC(lineHT)}</td>
                          <td className="py-1.5">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition">
                              <button type="button" disabled={i === 0}
                                onClick={() => setItems(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; })}
                                className="rounded p-0.5 disabled:opacity-20" style={{ color: textTert }}>
                                <ChevronUp size={11} />
                              </button>
                              <button type="button" disabled={i === items.length - 1}
                                onClick={() => setItems(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; })}
                                className="rounded p-0.5 disabled:opacity-20" style={{ color: textTert }}>
                                <ChevronDown size={11} />
                              </button>
                              {items.length > 1 && (
                                <button type="button"
                                  onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                                  className="rounded p-0.5" style={{ color: "#f87171" }}>
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button type="button" onClick={() => setItems(prev => [...prev, newLine(prev.length + 1)])}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", color: textSecond, border: `1px solid ${cardBorder}` }}>
                <Plus size={12} /> Ajouter une ligne
              </button>

              {/* Totals */}
              <div className="mt-4 rounded-xl p-4" style={{ background: sectionBg, border: `1px solid ${cardBorder}` }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: textTert }}>Récapitulatif</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: textSecond }}>Sous-total HT</span>
                    <span className="tabular-nums" style={{ color: textPrimary }}>{fmtC(totals.subtotal_ht)}</span>
                  </div>
                  {remise_pct > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: textSecond }}>Remise ({remise_pct} %)</span>
                      <span className="tabular-nums" style={{ color: "#ef4444" }}>−{fmtC(totals.remise)}</span>
                    </div>
                  )}
                  {taxSystemId !== "none" && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: textSecond }}>{taxSystem.short}</span>
                      <span className="tabular-nums" style={{ color: textPrimary }}>{fmtC(totals.tva)}</span>
                    </div>
                  )}
                  {acompte > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: textSecond }}>Acompte versé</span>
                      <span className="tabular-nums" style={{ color: "#10b981" }}>−{fmtC(acompte)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t" style={{ borderColor: cardBorder }}>
                    <span className="text-sm font-bold" style={{ color: textPrimary }}>
                      {taxSystemId === "none" ? "Total HT" : "Total TTC"}
                    </span>
                    <span className="text-base font-bold tabular-nums" style={{ color: GOLD }}>{fmtC(totals.ttc)}</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── CONDITIONS DE PAIEMENT ── */}
            <Section id="conditions" title="Conditions de paiement" icon={Percent}>
              {/* Mode de règlement */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Mode de règlement</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Virement", "Chèque", "Espèces", "Carte", "Prélèvement", "Mobile Money"].map(m => (
                    <button key={m} type="button" onClick={() => setModeReglement(modeReglement === m ? "" : m)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition"
                      style={{
                        background: modeReglement === m ? GOLD : cardBg,
                        color:      modeReglement === m ? "#000" : textSecond,
                        border:     modeReglement === m ? `1px solid ${GOLD}` : `1px solid ${cardBorder}`,
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Remise globale avec toggle %/fixe */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium" style={{ color: labelCol }}>Remise globale</label>
                    <div className="flex overflow-hidden rounded border" style={{ borderColor: cardBorder }}>
                      {(["pct", "fixe"] as const).map(t => (
                        <button key={t} type="button" onClick={() => setRemiseType(t)}
                          className="px-2 py-0.5 text-xs font-medium transition"
                          style={{
                            background: remiseType === t ? GOLD : "transparent",
                            color:      remiseType === t ? "#000" : textTert,
                          }}>
                          {t === "pct" ? "%" : devise}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number" min="0" max={remiseType === "pct" ? 100 : undefined}
                    className={inputCls} style={inputStyle}
                    value={remiseType === "pct" ? remise_pct : remiseFixe}
                    onChange={e => remiseType === "pct"
                      ? setRemisePct(parseFloat(e.target.value) || 0)
                      : setRemiseFixe(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Acompte avec type pills */}
                <div>
                  <div className="mb-1.5 flex flex-wrap gap-1">
                    {["Acompte", "Avance", "Retenue de garantie"].map(t => (
                      <button key={t} type="button" onClick={() => setAcompteType(t)}
                        className="rounded-full px-2 py-0.5 text-xs font-medium transition"
                        style={{
                          background: acompteType === t ? GOLD : cardBg,
                          color:      acompteType === t ? "#000" : textTert,
                          border:     acompteType === t ? `1px solid ${GOLD}` : `1px solid ${cardBorder}`,
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number" min="0"
                    className={inputCls} style={inputStyle}
                    value={acompte}
                    onChange={e => setAcompte(parseFloat(e.target.value) || 0)}
                    placeholder={`${acompteType} versé (${devise})`}
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Conditions</label>
                  <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Paiement à 30 jours..." />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Notes / Mentions</label>
                  <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informations complémentaires..." />
                </div>
              </div>
            </Section>

            {/* ── MON ENTREPRISE ── */}
            <Section id="emetteur" title="Mon entreprise" icon={Building2}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Nom / Raison sociale</label>
                  <input className={inputCls} style={inputStyle} value={emNom} onChange={e => setEmNom(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Email</label>
                  <input type="email" className={inputCls} style={inputStyle} value={emEmail} onChange={e => setEmEmail(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Adresse</label>
                  <input className={inputCls} style={inputStyle} value={emAdr} onChange={e => setEmAdr(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Code postal</label>
                  <input className={inputCls} style={inputStyle} value={emCP} onChange={e => setEmCP(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>Ville</label>
                  <input className={inputCls} style={inputStyle} value={emVille} onChange={e => setEmVille(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>SIRET</label>
                  <input className={inputCls} style={inputStyle} value={emSiret} onChange={e => setEmSiret(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: labelCol }}>N° TVA</label>
                  <input className={inputCls} style={inputStyle} value={emTva} onChange={e => setEmTva(e.target.value)} />
                </div>
              </div>
              <p className="mt-3 text-xs" style={{ color: textTert }}>
                Modifiez vos coordonnées dans{" "}
                <Link href="/client/factures/entreprise" className="underline" style={{ color: GOLD }}>Mon entreprise</Link>.
              </p>
            </Section>

          </div>
        </div>

        {/* ── RIGHT: preview panel ── */}
        <div ref={previewPanelRef}
          className={`${activeTab === "preview" ? "flex" : "hidden"} lg:flex flex-1 flex-col overflow-hidden`}
          style={{ background: previewBg }}>
          {/* Preview header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b px-5 py-3"
            style={{ borderColor: cardBorder, background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.025)" }}>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: GOLD }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: textTert }}>Aperçu en direct</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs" style={{ color: textTert }}>A4 · 210×297 mm</span>
              <div className="flex items-center gap-1">
                <button type="button"
                  onClick={() => setZoomLevel(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))))}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition hover:opacity-70"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: textTert }}>
                  <ZoomOut size={11} />
                </button>
                <span className="w-10 text-center text-xs font-medium" style={{ color: textSecond }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button type="button"
                  onClick={() => setZoomLevel(z => Math.min(1.5, parseFloat((z + 0.1).toFixed(1))))}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition hover:opacity-70"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: textTert }}>
                  <ZoomIn size={11} />
                </button>
              </div>
            </div>
          </div>
          {/* A4 preview */}
          <div className="flex-1 overflow-y-auto flex justify-center p-6 lg:p-10">
            <div style={{ width: Math.max(200, computedScale * 794), flexShrink: 0 }}>
              <div className="overflow-hidden rounded-xl shadow-2xl" style={{ border: `1px solid ${cardBorder}` }}>
                <ScaledA4 scale={computedScale}>
                  <InvoiceTemplate data={previewData} type={template} />
                </ScaledA4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE TAB BAR ── */}
      <div className="lg:hidden flex flex-shrink-0 border-t"
        style={{ borderColor: cardBorder, background: headerBg }}>
        <button type="button" onClick={() => setActiveTab("edit")}
          className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors"
          style={{ color: activeTab === "edit" ? GOLD : textTert, borderTop: `2px solid ${activeTab === "edit" ? GOLD : "transparent"}` }}>
          <Pencil size={14} /> Modifier
        </button>
        <div style={{ width: 1, background: cardBorder }} />
        <button type="button" onClick={() => setActiveTab("preview")}
          className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors"
          style={{ color: activeTab === "preview" ? GOLD : textTert, borderTop: `2px solid ${activeTab === "preview" ? GOLD : "transparent"}` }}>
          <Eye size={14} /> Aperçu
        </button>
      </div>

    </div>
  );
}
