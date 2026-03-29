"use client";

import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import {
  Upload, Trash2, Plus, X, Download, Save,
  Building2, User, FileText, StickyNote, Hash,
  Sparkles, CheckCircle2, AlertCircle, ReceiptText,
} from "lucide-react";
import { FadeReveal } from "@/components/ui/WordReveal";

const ease = [0.16, 1, 0.3, 1] as const;
const PRESET_COLORS = ["#b08d57", "#0f172a", "#0f4c75", "#1b4332", "#6d28d9", "#be123c"];

type LineItem = { description: string; quantity: number; unitPrice: number; vatRate: number };

/* ═══════════════════════════════════════════════
   SOUS-COMPOSANTS UI
═══════════════════════════════════════════════ */

function SectionCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay }}
      className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_2px_12px_rgba(9,9,11,0.05)]"
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 border-b border-[var(--border)] pb-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)]">
        <Icon size={13} className="text-[#c9a55a]" />
      </div>
      <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--ink)]">{title}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[0.62rem] font-bold uppercase tracking-widest text-[var(--muted)]">
      {children}
    </label>
  );
}

function PInput({
  value, onChange, placeholder, type = "text", col2,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; col2?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative ${col2 ? "sm:col-span-2" : ""}`}>
      <motion.div
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: "0 0 0 2px rgba(201,165,90,0.45)" }}
      />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors duration-200 hover:border-[rgba(201,165,90,0.4)] focus:bg-white"
      />
    </div>
  );
}

function PTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: "0 0 0 2px rgba(201,165,90,0.45)" }}
      />
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none transition-colors duration-200 hover:border-[rgba(201,165,90,0.4)] focus:bg-white"
      />
    </div>
  );
}

/* ── Upload logo premium ── */
function LogoUpload({ preview, onFile }: { preview: string; onFile: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function read(file: File) {
    if (!file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = (e) => onFile(e.target?.result as string);
    r.readAsDataURL(file);
  }

  return (
    <div className="sm:col-span-2">
      <FieldLabel>Logo de l&apos;entreprise</FieldLabel>
      <motion.div
        animate={{
          borderColor: drag ? "rgba(201,165,90,0.7)" : "rgba(9,9,11,0.1)",
          backgroundColor: drag ? "rgba(201,165,90,0.04)" : "var(--surface)",
        }}
        whileHover={{ borderColor: "rgba(201,165,90,0.5)", backgroundColor: "rgba(201,165,90,0.025)" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) read(f); }}
        className="flex h-20 cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-4 transition-all"
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.img
              key="preview"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              src={preview}
              alt="logo"
              // eslint-disable-next-line @next/next/no-img-element
              className="h-14 w-14 shrink-0 rounded-xl border border-[var(--border)] bg-white object-contain p-1.5 shadow-sm"
            />
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)]"
            >
              <Upload size={17} className="text-[#c9a55a]" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)] truncate">
            {preview ? "Logo chargé — cliquer pour changer" : "Importer le logo"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {preview ? "PNG, JPG, SVG acceptés" : "Glisser ou cliquer · PNG, JPG, SVG"}
          </p>
        </div>

        {preview && (
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            type="button"
            onClick={(e) => { e.stopPropagation(); onFile(""); }}
            className="shrink-0 rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={12} />
          </motion.button>
        )}
      </motion.div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════ */
export default function ClientFacturesPage() {
  /* ── États ── */
  const [documentType,    setDocumentType]    = useState<"Facture" | "Devis">("Facture");
  const [primaryColor,    setPrimaryColor]    = useState("#b08d57");
  const [companyName,     setCompanyName]     = useState("DJAMA");
  const [companyLogo,     setCompanyLogo]     = useState("");
  const [companyAddress,  setCompanyAddress]  = useState("");
  const [companyEmail,    setCompanyEmail]    = useState("");
  const [companyPhone,    setCompanyPhone]    = useState("");
  const [companySiret,    setCompanySiret]    = useState("");
  const [companyVatNumber,setCompanyVatNumber]= useState("");
  const [clientName,      setClientName]      = useState("");
  const [clientAddress,   setClientAddress]   = useState("");
  const [clientEmail,     setClientEmail]     = useState("");
  const [docNumber,       setDocNumber]       = useState("FAC-001");
  const [issueDate,       setIssueDate]       = useState("");
  const [dueDate,         setDueDate]         = useState("");
  const [notes,           setNotes]           = useState("");
  const [paymentTerms,    setPaymentTerms]    = useState("");
  const [items,           setItems]           = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, vatRate: 20 },
  ]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [feedback,    setFeedback]    = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showFeedback(type: "ok" | "err", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  /* ── Lignes ── */
  function updateItem(idx: number, key: keyof LineItem, val: string | number) {
    const c = [...items]; c[idx] = { ...c[idx], [key]: val }; setItems(c);
  }
  const addItem    = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0, vatRate: 20 }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  /* ── Totaux ── */
  const totals = useMemo(() => {
    let ht = 0, vat = 0;
    for (const it of items) { const h = it.quantity * it.unitPrice; ht += h; vat += h * (it.vatRate / 100); }
    return { ht, vat, ttc: ht + vat };
  }, [items]);

  /* ── Utilitaires ── */
  function hexToRgb(hex: string) {
    const n = parseInt(hex.replace("#", ""), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /* ── Télécharger PDF ── */
  async function downloadPDF() {
    const pdf = new jsPDF("p", "mm", "a4");
    const { r, g, b } = hexToRgb(primaryColor);
    let y = 20;

    pdf.setFont("helvetica", "bold"); pdf.setFontSize(26); pdf.setTextColor(r, g, b);
    pdf.text(documentType, 15, y);
    pdf.setFontSize(11); pdf.setTextColor(100, 100, 100); pdf.setFont("helvetica", "normal");
    pdf.text(docNumber || "—", 15, y + 8);
    pdf.text(`Date : ${issueDate || "—"}`, 148, y);
    pdf.text(`Échéance : ${dueDate || "—"}`, 148, y + 7);
    y += 20;

    if (companyLogo) {
      try {
        const img = new window.Image();
        img.crossOrigin = "anonymous"; img.src = companyLogo;
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); });
        const cvs = document.createElement("canvas");
        cvs.width = img.width; cvs.height = img.height;
        cvs.getContext("2d")?.drawImage(img, 0, 0);
        pdf.addImage(cvs.toDataURL("image/png"), "PNG", 155, 14, 36, 36);
      } catch { /* ignore */ }
    }

    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(r, g, b);
    pdf.text("ÉMETTEUR", 15, y); y += 5;
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(0, 0, 0); pdf.setFontSize(10);
    [companyName, companyAddress, companyPhone, companyEmail, companySiret, companyVatNumber]
      .filter(Boolean).forEach(l => { pdf.text(String(l), 15, y); y += 5; });

    let ry = 42;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(r, g, b);
    pdf.text("CLIENT", 110, ry); ry += 5;
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(0, 0, 0); pdf.setFontSize(10);
    [clientName, clientAddress, clientEmail].filter(Boolean).forEach(l => { pdf.text(String(l), 110, ry); ry += 5; });
    y = Math.max(y, ry) + 8;

    pdf.setFillColor(r, g, b); pdf.setTextColor(255, 255, 255);
    pdf.rect(15, y, 180, 9, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
    ["Description", "Qté", "PU HT", "TVA", "Total TTC"].forEach((h, i) => {
      pdf.text(h, [18, 105, 122, 147, 165][i], y + 6);
    });
    y += 13; pdf.setTextColor(0, 0, 0); pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
    items.forEach((it, i) => {
      if (y > 265) { pdf.addPage(); y = 20; }
      if (i % 2 === 0) { pdf.setFillColor(249, 249, 249); pdf.rect(15, y - 3, 180, 8, "F"); }
      const ttc = it.quantity * it.unitPrice * (1 + it.vatRate / 100);
      pdf.text(it.description || "—", 18, y); pdf.text(String(it.quantity), 105, y);
      pdf.text(`${it.unitPrice.toFixed(2)} €`, 122, y); pdf.text(`${it.vatRate}%`, 147, y);
      pdf.text(`${ttc.toFixed(2)} €`, 165, y);
      pdf.setDrawColor(235, 235, 235); pdf.line(15, y + 4, 195, y + 4); y += 9;
    });
    y += 6;
    pdf.setFontSize(10); pdf.setFont("helvetica", "normal");
    pdf.text("Total HT :", 138, y); pdf.text(`${totals.ht.toFixed(2)} €`, 193, y, { align: "right" }); y += 6;
    pdf.text("Total TVA :", 138, y); pdf.text(`${totals.vat.toFixed(2)} €`, 193, y, { align: "right" }); y += 7;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(r, g, b);
    pdf.text("Total TTC :", 136, y); pdf.text(`${totals.ttc.toFixed(2)} €`, 193, y, { align: "right" });
    pdf.setTextColor(0, 0, 0);
    y += 14; pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); pdf.text("Notes :", 15, y);
    pdf.setFont("helvetica", "normal"); y += 5; pdf.text(notes || "—", 15, y, { maxWidth: 180 }); y += 10;
    pdf.setFont("helvetica", "bold"); pdf.text("Conditions de paiement :", 15, y);
    pdf.setFont("helvetica", "normal"); y += 5; pdf.text(paymentTerms || "—", 15, y, { maxWidth: 180 });
    pdf.save(`${documentType}-${docNumber || "document"}.pdf`);
  }

  /* ── Enregistrer ── */
  async function saveInvoice() {
    setLoadingSave(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showFeedback("err", "Vous devez être connecté pour enregistrer.");
      setLoadingSave(false); return;
    }
    const { error } = await supabase.from("factures").insert({
      user_id: user.id, numero: docNumber, type_document: documentType,
      client_nom: clientName, client_email: clientEmail, client_adresse: clientAddress,
      entreprise_nom: companyName, entreprise_email: companyEmail,
      entreprise_adresse: companyAddress, entreprise_telephone: companyPhone,
      entreprise_siret: companySiret, entreprise_tva: companyVatNumber,
      date_emission: issueDate || null, date_echeance: dueDate || null,
      notes, conditions_paiement: paymentTerms,
      total_ht: totals.ht, total_tva: totals.vat, total_ttc: totals.ttc,
      couleur: primaryColor, logo_url: companyLogo,
    });
    setLoadingSave(false);
    error
      ? showFeedback("err", error.message)
      : showFeedback("ok", "Document enregistré avec succès !");
  }

  /* ═══════════════════════════════════════════════
     RENDU
  ═══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[var(--surface)]">

      {/* ══ HERO ══════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-16 pt-28">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[400px] w-[600px] rounded-full bg-[rgba(176,141,87,0.07)] blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute right-[10%] top-[20%] h-[250px] w-[250px] rounded-full bg-[rgba(59,157,255,0.05)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <ReceiptText size={11} />
            Outil professionnel
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.08 }}
            className="text-4xl font-extrabold leading-tight text-white md:text-5xl"
          >
            Générateur de{" "}
            <span className="text-[#c9a55a]">factures</span>
            {" "}&amp;{" "}
            <span className="text-[#c9a55a]">devis</span>
          </motion.h1>

          <FadeReveal delay={0.22} as="p" className="mt-4 max-w-xl text-base leading-relaxed text-white/50">
            Créez des documents professionnels en quelques minutes — votre logo, vos couleurs, calculs automatiques, export PDF.
          </FadeReveal>

          {/* Toggle Facture / Devis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.3 }}
            className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-sm"
          >
            {(["Facture", "Devis"] as const).map((t) => (
              <motion.button
                key={t}
                onClick={() => setDocumentType(t)}
                whileTap={{ scale: 0.96 }}
                className="relative rounded-xl px-6 py-2.5 text-sm font-bold transition-colors"
                style={{ color: documentType === t ? "#0a0a0a" : "rgba(255,255,255,0.4)" }}
              >
                {documentType === t && (
                  <motion.div
                    layoutId="type-pill"
                    className="absolute inset-0 rounded-xl bg-[#c9a55a]"
                    transition={{ duration: 0.25, ease }}
                  />
                )}
                <span className="relative">{t}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--surface)] to-transparent" />
      </section>

      {/* ── Toast ── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            className="fixed left-1/2 top-6 z-50 -translate-x-1/2"
          >
            <div className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
              feedback.type === "ok"
                ? "border-green-300/20 bg-green-950/90 text-green-200"
                : "border-red-300/20 bg-red-950/90 text-red-200"
            }`}>
              {feedback.type === "ok"
                ? <CheckCircle2 size={15} className="text-green-400" />
                : <AlertCircle size={15} className="text-red-400" />
              }
              {feedback.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CONTENU ══════════════════════════════ */}
      <div className="mx-auto max-w-[1380px] px-4 py-8 xl:px-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_440px]">

          {/* ════ FORMULAIRE ════ */}
          <div className="space-y-5">

            {/* — Document — */}
            <SectionCard delay={0.05}>
              <SectionLabel icon={Hash} title="Document" />
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel>Numéro</FieldLabel>
                  <PInput value={docNumber} onChange={setDocNumber} placeholder="FAC-001" />
                </div>
                <div>
                  <FieldLabel>Date d&apos;émission</FieldLabel>
                  <PInput type="date" value={issueDate} onChange={setIssueDate} />
                </div>
                <div>
                  <FieldLabel>Date d&apos;échéance</FieldLabel>
                  <PInput type="date" value={dueDate} onChange={setDueDate} />
                </div>
              </div>

              {/* Couleur */}
              <div className="mt-5">
                <FieldLabel>Couleur du document</FieldLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color" value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-[var(--border)] p-0.5"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <motion.button
                        key={c} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setPrimaryColor(c)}
                        className="h-7 w-7 rounded-full transition-all"
                        style={{
                          background: c,
                          boxShadow: primaryColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-[var(--muted)]">{primaryColor}</span>
                </div>
              </div>
            </SectionCard>

            {/* — Entreprise — */}
            <SectionCard delay={0.1}>
              <SectionLabel icon={Building2} title="Votre entreprise" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Nom de l&apos;entreprise</FieldLabel>
                  <PInput value={companyName} onChange={setCompanyName} placeholder="DJAMA" />
                </div>
                <div>
                  <FieldLabel>E-mail</FieldLabel>
                  <PInput type="email" value={companyEmail} onChange={setCompanyEmail} placeholder="contact@djama.fr" />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Adresse complète</FieldLabel>
                  <PInput value={companyAddress} onChange={setCompanyAddress} placeholder="12 rue de la Paix, 75001 Paris" />
                </div>
                <div>
                  <FieldLabel>Téléphone</FieldLabel>
                  <PInput value={companyPhone} onChange={setCompanyPhone} placeholder="+33 6 00 00 00 00" />
                </div>
                <div>
                  <FieldLabel>SIRET / SIREN</FieldLabel>
                  <PInput value={companySiret} onChange={setCompanySiret} placeholder="XXX XXX XXX XXXXX" />
                </div>
                <div>
                  <FieldLabel>N° TVA intracommunautaire</FieldLabel>
                  <PInput value={companyVatNumber} onChange={setCompanyVatNumber} placeholder="FR XX XXX XXX XXX" />
                </div>
                <LogoUpload preview={companyLogo} onFile={setCompanyLogo} />
              </div>
            </SectionCard>

            {/* — Client — */}
            <SectionCard delay={0.15}>
              <SectionLabel icon={User} title="Client / Destinataire" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>Nom ou raison sociale</FieldLabel>
                  <PInput value={clientName} onChange={setClientName} placeholder="Nom ou société" />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Adresse</FieldLabel>
                  <PInput value={clientAddress} onChange={setClientAddress} placeholder="Adresse complète du client" />
                </div>
                <div>
                  <FieldLabel>E-mail</FieldLabel>
                  <PInput type="email" value={clientEmail} onChange={setClientEmail} placeholder="client@exemple.com" />
                </div>
              </div>
            </SectionCard>

            {/* — Prestations — */}
            <SectionCard delay={0.2}>
              <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.1)]">
                    <FileText size={13} className="text-[#c9a55a]" />
                  </div>
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--ink)]">Prestations</h2>
                </div>
                <motion.button
                  onClick={addItem} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-3 py-1.5 text-xs font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.15)]"
                >
                  <Plus size={12} /> Ajouter une ligne
                </motion.button>
              </div>

              {/* En-têtes */}
              <div className="mb-2 hidden grid-cols-[1fr_60px_90px_60px_36px] gap-2 px-1 sm:grid">
                {["Description", "Qté", "Prix HT €", "TVA %", ""].map((h) => (
                  <p key={h} className="text-[0.58rem] font-bold uppercase tracking-wider text-[var(--muted)]">{h}</p>
                ))}
              </div>

              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-2 grid grid-cols-1 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[1fr_60px_90px_60px_36px] sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                  >
                    <PInput value={item.description} onChange={(v) => updateItem(i, "description", v)} placeholder="Description de la prestation" />
                    <PInput type="number" value={String(item.quantity)} onChange={(v) => updateItem(i, "quantity", Number(v))} placeholder="1" />
                    <PInput type="number" value={String(item.unitPrice)} onChange={(v) => updateItem(i, "unitPrice", Number(v))} placeholder="0.00" />
                    <PInput type="number" value={String(item.vatRate)} onChange={(v) => updateItem(i, "vatRate", Number(v))} placeholder="20" />
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => removeItem(i)}
                      className="flex h-10 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <X size={13} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Totaux */}
              <div className="mt-5 flex justify-end">
                <div className="w-56 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                  {[
                    { label: "Total HT", val: totals.ht },
                    { label: "Total TVA", val: totals.vat },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">{label}</span>
                      <span className="font-semibold text-[var(--ink)]">{val.toFixed(2)} €</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm font-extrabold">
                    <span className="text-[var(--ink)]">Total TTC</span>
                    <span style={{ color: primaryColor }}>{totals.ttc.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* — Notes — */}
            <SectionCard delay={0.25}>
              <SectionLabel icon={StickyNote} title="Notes &amp; conditions" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Notes / Remarques</FieldLabel>
                  <PTextarea value={notes} onChange={setNotes} placeholder="Informations complémentaires…" rows={4} />
                </div>
                <div>
                  <FieldLabel>Conditions de paiement</FieldLabel>
                  <PTextarea value={paymentTerms} onChange={setPaymentTerms} placeholder="Ex : Paiement à 30 jours, virement bancaire." rows={4} />
                </div>
              </div>
            </SectionCard>

            {/* — Boutons d'action (mobile) — */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease }}
              className="flex flex-wrap gap-3 xl:hidden"
            >
              <motion.button
                onClick={saveInvoice} disabled={loadingSave}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)] py-3.5 text-sm font-bold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.18)] disabled:opacity-60"
              >
                <Save size={14} />
                {loadingSave ? "Enregistrement…" : "Enregistrer"}
              </motion.button>
              <motion.button
                onClick={downloadPDF}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--ink)] py-3.5 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(9,9,11,0.2)]"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Download size={14} />
                Télécharger PDF
              </motion.button>
            </motion.div>
          </div>

          {/* ════ APERÇU + ACTIONS ════ */}
          <div className="hidden xl:block">
            <div className="sticky top-6 space-y-4">

              {/* Boutons d'action */}
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.1 }}
                className="flex gap-3"
              >
                <motion.button
                  onClick={saveInvoice} disabled={loadingSave}
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[rgba(201,165,90,0.3)] bg-white py-3 text-sm font-bold text-[#c9a55a] shadow-sm transition hover:border-[rgba(201,165,90,0.5)] hover:bg-[rgba(201,165,90,0.06)] disabled:opacity-60"
                >
                  <Save size={14} />
                  {loadingSave ? "Enregistrement…" : "Enregistrer"}
                </motion.button>
                <motion.button
                  onClick={downloadPDF}
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--ink)] py-3 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(9,9,11,0.2)] hover:shadow-[0_8px_28px_rgba(9,9,11,0.3)]"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Download size={14} />
                  PDF
                </motion.button>
              </motion.div>

              {/* Aperçu facture */}
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.15 }}
              >
                <p className="mb-2 flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-widest text-[var(--muted)]">
                  <Sparkles size={9} className="text-[#c9a55a]" />
                  Aperçu du document
                </p>

                <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-[0_8px_40px_rgba(9,9,11,0.08)]">
                  {/* Barre de couleur en haut */}
                  <div className="h-1.5 w-full" style={{ background: primaryColor }} />

                  <div className="p-6 text-[10.5px] leading-relaxed">

                    {/* En-tête facture */}
                    <div className="flex items-start justify-between gap-3 pb-5" style={{ borderBottom: `1.5px solid ${primaryColor}30` }}>
                      <div className="flex items-start gap-3">
                        {companyLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={companyLogo} alt="logo" className="h-12 w-12 rounded-xl border border-gray-100 bg-white object-contain p-1 shadow-sm" />
                        )}
                        <div>
                          <p className="text-xl font-extrabold leading-none" style={{ color: primaryColor }}>
                            {documentType}
                          </p>
                          <p className="mt-1 text-[var(--muted)]">{docNumber || "—"}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-[var(--muted)]">
                        <p>Date : <span className="font-semibold text-[var(--ink)]">{issueDate || "—"}</span></p>
                        <p className="mt-0.5">Échéance : <span className="font-semibold text-[var(--ink)]">{dueDate || "—"}</span></p>
                      </div>
                    </div>

                    {/* Émetteur / Client */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[0.5rem] font-extrabold uppercase tracking-widest" style={{ color: primaryColor }}>Émetteur</p>
                        <p className="mt-1 font-bold text-[var(--ink)]">{companyName || "—"}</p>
                        <p className="mt-0.5 whitespace-pre-line text-[var(--muted)]">
                          {[companyAddress, companyPhone, companyEmail, companySiret, companyVatNumber].filter(Boolean).join("\n") || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.5rem] font-extrabold uppercase tracking-widest" style={{ color: primaryColor }}>Client</p>
                        <p className="mt-1 font-bold text-[var(--ink)]">{clientName || "—"}</p>
                        <p className="mt-0.5 whitespace-pre-line text-[var(--muted)]">
                          {[clientAddress, clientEmail].filter(Boolean).join("\n") || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Tableau prestations */}
                    <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)]">
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: primaryColor }}>
                            {["Description", "Qté", "HT", "TVA", "TTC"].map((h) => (
                              <th key={h} className="px-2.5 py-2 text-left text-[0.5rem] font-extrabold uppercase tracking-wider text-white">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, i) => {
                            const ttc = it.quantity * it.unitPrice * (1 + it.vatRate / 100);
                            return (
                              <tr key={i} className="border-t border-[var(--border)]" style={{ background: i % 2 === 1 ? "var(--surface)" : "white" }}>
                                <td className="px-2.5 py-2 text-[var(--ink)]">{it.description || "—"}</td>
                                <td className="px-2.5 py-2 text-[var(--muted)]">{it.quantity}</td>
                                <td className="px-2.5 py-2 text-[var(--muted)]">{it.unitPrice.toFixed(2)} €</td>
                                <td className="px-2.5 py-2 text-[var(--muted)]">{it.vatRate}%</td>
                                <td className="px-2.5 py-2 font-semibold text-[var(--ink)]">{ttc.toFixed(2)} €</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Totaux */}
                    <div className="mt-4 flex justify-end">
                      <div className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[10px]">
                        {[
                          { label: "Total HT", val: totals.ht },
                          { label: "Total TVA", val: totals.vat },
                        ].map(({ label, val }) => (
                          <div key={label} className="flex justify-between gap-8">
                            <span className="text-[var(--muted)]">{label}</span>
                            <span className="font-semibold">{val.toFixed(2)} €</span>
                          </div>
                        ))}
                        <div className="flex justify-between gap-8 border-t border-[var(--border)] pt-1.5 font-extrabold">
                          <span>Total TTC</span>
                          <span style={{ color: primaryColor }}>{totals.ttc.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {(notes || paymentTerms) && (
                      <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        {notes && (
                          <div>
                            <p className="text-[0.5rem] font-extrabold uppercase tracking-widest text-[var(--muted)]">Notes</p>
                            <p className="mt-1 text-[var(--ink)]">{notes}</p>
                          </div>
                        )}
                        {paymentTerms && (
                          <div>
                            <p className="text-[0.5rem] font-extrabold uppercase tracking-widest text-[var(--muted)]">Conditions</p>
                            <p className="mt-1 text-[var(--ink)]">{paymentTerms}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
