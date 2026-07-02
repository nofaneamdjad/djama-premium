"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { Trash2, Plus, FileText, Eye, Printer, X } from "lucide-react";

/* ─── Constante couleur or DJAMA ─── */
const GOLD = "#c9a55a";

/* ─── Types ─── */
interface Item {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface FormData {
  /* Émetteur */
  emetteur_nom: string;
  emetteur_siret: string;
  emetteur_adresse: string;
  emetteur_email: string;
  /* Client */
  client_nom: string;
  client_adresse: string;
  client_email: string;
  /* Document */
  type: "facture" | "devis";
  numero: string;
  date_emission: string;
  date_echeance: string;
  tva: number;
  notes: string;
}

/* ─── Helpers ─── */
function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function in30days() {
  return new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
}

function genNumero(type: "facture" | "devis") {
  const prefix = type === "facture" ? "FAC" : "DEV";
  return `${prefix}-${new Date().getFullYear()}-001`;
}

/* ─── Styles partagés ─── */
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#c9a55a] focus:ring-2 focus:ring-[rgba(201,165,90,0.15)]";

const labelCls = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

/* ─── Composant section formulaire ─── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gray-700">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Page principale ─── */
export default function CreerMaFacturePage() {
  const uid = useId();

  const [form, setForm] = useState<FormData>({
    emetteur_nom: "",
    emetteur_siret: "",
    emetteur_adresse: "",
    emetteur_email: "",
    client_nom: "",
    client_adresse: "",
    client_email: "",
    type: "facture",
    numero: genNumero("facture"),
    date_emission: today(),
    date_echeance: in30days(),
    tva: 0,
    notes: "",
  });

  const [items, setItems] = useState<Item[]>([
    { id: "1", description: "", quantity: 1, unit_price: 0 },
  ]);

  const [showPreview, setShowPreview] = useState(false);

  /* ── Calculs ── */
  const totalHT = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalTVA = totalHT * (form.tva / 100);
  const totalTTC = totalHT + totalTVA;

  /* ── Handlers form ── */
  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTypeChange(t: "facture" | "devis") {
    setForm((prev) => ({ ...prev, type: t, numero: genNumero(t) }));
  }

  /* ── Handlers items ── */
  function addItem() {
    if (items.length >= 10) return;
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        description: "",
        quantity: 1,
        unit_price: 0,
      },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem<K extends keyof Item>(id: string, key: K, value: Item[K]) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [key]: value } : i))
    );
  }

  /* ── Print ── */
  function handlePrint() {
    window.print();
  }

  /* ── Contenu de la facture (réutilisé dans aperçu et impression) ── */
  function FactureContent() {
    const docLabel = form.type === "facture" ? "FACTURE" : "DEVIS";

    return (
      <div
        className="max-w-[210mm] mx-auto bg-white p-10 text-gray-900"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* En-tête */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <div
              className="text-2xl font-black mb-1"
              style={{ color: GOLD }}
            >
              {form.emetteur_nom || "Votre nom / raison sociale"}
            </div>
            {form.emetteur_siret && (
              <div className="text-xs text-gray-500">
                SIRET : {form.emetteur_siret}
              </div>
            )}
            <div
              className="text-xs text-gray-500 mt-1 whitespace-pre-line"
            >
              {form.emetteur_adresse || "Votre adresse"}
            </div>
            {form.emetteur_email && (
              <div className="text-xs text-gray-500">{form.emetteur_email}</div>
            )}
          </div>

          <div className="text-right">
            <div
              className="text-3xl font-black tracking-wider"
              style={{ color: GOLD }}
            >
              {docLabel}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              N° {form.numero}
            </div>
            <div className="text-xs text-gray-500">
              Émise le : {form.date_emission}
            </div>
            {form.type === "facture" && (
              <div className="text-xs text-gray-500">
                Échéance : {form.date_echeance}
              </div>
            )}
          </div>
        </div>

        {/* Séparateur doré */}
        <div
          className="h-px mb-8"
          style={{
            background: `linear-gradient(90deg, ${GOLD}, transparent)`,
          }}
        />

        {/* Destinataire */}
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Facturé à
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="font-bold text-gray-900">
              {form.client_nom || "Nom du client"}
            </div>
            <div
              className="text-xs text-gray-500 mt-0.5 whitespace-pre-line"
            >
              {form.client_adresse}
            </div>
            {form.client_email && (
              <div className="text-xs text-gray-500">{form.client_email}</div>
            )}
          </div>
        </div>

        {/* Table des prestations */}
        <table className="w-full mb-6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}10)`,
              }}
            >
              <th
                className="text-left text-xs font-bold uppercase tracking-widest text-gray-600 py-3 px-3"
                style={{ width: "50%" }}
              >
                Description
              </th>
              <th className="text-center text-xs font-bold uppercase tracking-widest text-gray-600 py-3 px-3">
                Qté
              </th>
              <th className="text-right text-xs font-bold uppercase tracking-widest text-gray-600 py-3 px-3">
                PU HT
              </th>
              <th className="text-right text-xs font-bold uppercase tracking-widest text-gray-600 py-3 px-3">
                Total HT
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                style={{
                  background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <td className="py-3 px-3 text-sm text-gray-800">
                  {item.description || "—"}
                </td>
                <td className="py-3 px-3 text-sm text-center text-gray-600">
                  {item.quantity}
                </td>
                <td className="py-3 px-3 text-sm text-right text-gray-600">
                  {fmtEur(item.unit_price)}
                </td>
                <td className="py-3 px-3 text-sm text-right font-semibold text-gray-900">
                  {fmtEur(item.quantity * item.unit_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm text-gray-600">
              <span>Total HT</span>
              <span className="font-semibold">{fmtEur(totalHT)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm text-gray-600">
              <span>TVA ({form.tva}%)</span>
              <span className="font-semibold">{fmtEur(totalTVA)}</span>
            </div>
            <div
              className="flex justify-between py-3 px-4 rounded-xl mt-1 text-base font-black"
              style={{
                background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}10)`,
                color: "#1a1a1a",
              }}
            >
              <span>Total TTC</span>
              <span style={{ color: GOLD }}>{fmtEur(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* TVA franchise */}
        {form.tva === 0 && (
          <p className="text-xs text-gray-400 mb-6 italic">
            TVA non applicable – article 293 B du CGI (franchise en base de TVA)
          </p>
        )}

        {/* Notes */}
        {form.notes && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Notes / conditions
            </div>
            <p className="text-xs text-gray-600 whitespace-pre-line">
              {form.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          className="h-px mb-4"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />
        <div className="text-center text-xs text-gray-400">
          Document généré via DJAMA · djama.fr
        </div>
      </div>
    );
  }

  /* ─── Rendu ─── */
  return (
    <>
      {/* ── Styles print ── */}
      <style>{`
        @media print {
          body > *:not(#facture-preview-root) { display: none !important; }
          #facture-preview-root { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; overflow: auto; }
          .print\\:hidden { display: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>

      {/* ── Zone print cachée (toujours dans le DOM) ── */}
      {showPreview && (
        <div id="facture-preview-root" className="fixed inset-0 z-50 bg-white overflow-auto">
          {/* Barre d'actions (masquée à l'impression) */}
          <div
            className="print:hidden sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm"
          >
            <span className="text-sm font-bold text-gray-700">
              Aperçu — {form.type === "facture" ? "Facture" : "Devis"} N° {form.numero}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-black transition hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                  boxShadow: "0 3px 14px rgba(201,165,90,0.35)",
                }}
              >
                <Printer size={14} />
                Télécharger PDF
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <X size={14} />
                Fermer
              </button>
            </div>
          </div>

          {/* Contenu facture */}
          <div className="py-8 px-4 bg-gray-100 min-h-screen">
            <div className="shadow-xl rounded-2xl overflow-hidden">
              <FactureContent />
            </div>
          </div>
        </div>
      )}

      {/* ── Page principale ── */}
      <div style={{ background: "#f8f9fc", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div
          className="border-b border-gray-200 bg-white px-6 py-5 shadow-sm"
        >
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <span
                  className="text-xl font-black tracking-tight"
                  style={{ color: GOLD }}
                >
                  DJAMA
                </span>
              </Link>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2 text-gray-700">
                <FileText size={16} style={{ color: GOLD }} />
                <span className="text-sm font-bold">Générateur de factures gratuit</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["Gratuit", "Sans compte", "PDF immédiat"] as const).map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600"
                >
                  ✓ {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Titre ── */}
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-2">
          <h1 className="text-2xl font-black text-gray-900">
            Créez votre{" "}
            <span style={{ color: GOLD }}>
              {form.type === "facture" ? "facture" : "devis"}
            </span>{" "}
            en quelques secondes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Remplissez le formulaire, prévisualisez et téléchargez votre PDF gratuitement — aucun compte requis.
          </p>
        </div>

        {/* ── Formulaire ── */}
        <div className="mx-auto max-w-6xl px-6 py-6 grid gap-5 lg:grid-cols-2">

          {/* ── Colonne gauche ── */}
          <div className="flex flex-col gap-5">

            {/* Type document */}
            <Section title="Type de document">
              <div className="grid grid-cols-2 gap-3">
                {(["facture", "devis"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`rounded-xl border py-3 text-sm font-bold transition-all duration-200 ${
                      form.type === t
                        ? "border-[rgba(201,165,90,0.5)] bg-[rgba(201,165,90,0.08)] text-gray-900"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t === "facture" ? "Facture" : "Devis"}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelCls} htmlFor={`${uid}-numero`}>
                    Numéro
                  </label>
                  <input
                    id={`${uid}-numero`}
                    className={inputCls}
                    value={form.numero}
                    onChange={(e) => set("numero", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${uid}-date-emission`}>
                    Date d&apos;émission
                  </label>
                  <input
                    id={`${uid}-date-emission`}
                    type="date"
                    className={inputCls}
                    value={form.date_emission}
                    onChange={(e) => set("date_emission", e.target.value)}
                  />
                </div>
                {form.type === "facture" && (
                  <div>
                    <label className={labelCls} htmlFor={`${uid}-date-echeance`}>
                      Échéance
                    </label>
                    <input
                      id={`${uid}-date-echeance`}
                      type="date"
                      className={inputCls}
                      value={form.date_echeance}
                      onChange={(e) => set("date_echeance", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Vos informations */}
            <Section title="Vos informations (émetteur)">
              <div className="grid gap-3">
                <div>
                  <label className={labelCls} htmlFor={`${uid}-emetteur-nom`}>
                    Nom / Raison sociale *
                  </label>
                  <input
                    id={`${uid}-emetteur-nom`}
                    className={inputCls}
                    placeholder="Jean Dupont / DJAMA SAS"
                    value={form.emetteur_nom}
                    onChange={(e) => set("emetteur_nom", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${uid}-emetteur-siret`}>
                    SIRET (facultatif)
                  </label>
                  <input
                    id={`${uid}-emetteur-siret`}
                    className={inputCls}
                    placeholder="000 000 000 00000"
                    value={form.emetteur_siret}
                    onChange={(e) => set("emetteur_siret", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${uid}-emetteur-adresse`}>
                    Adresse
                  </label>
                  <textarea
                    id={`${uid}-emetteur-adresse`}
                    className={`${inputCls} resize-none`}
                    rows={2}
                    placeholder={"12 rue de la Paix\n75001 Paris"}
                    value={form.emetteur_adresse}
                    onChange={(e) => set("emetteur_adresse", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${uid}-emetteur-email`}>
                    Email
                  </label>
                  <input
                    id={`${uid}-emetteur-email`}
                    type="email"
                    className={inputCls}
                    placeholder="contact@monentreprise.fr"
                    value={form.emetteur_email}
                    onChange={(e) => set("emetteur_email", e.target.value)}
                  />
                </div>
              </div>
            </Section>

            {/* Informations client */}
            <Section title="Informations client">
              <div className="grid gap-3">
                <div>
                  <label className={labelCls} htmlFor={`${uid}-client-nom`}>
                    Nom / Société *
                  </label>
                  <input
                    id={`${uid}-client-nom`}
                    className={inputCls}
                    placeholder="Entreprise ABC"
                    value={form.client_nom}
                    onChange={(e) => set("client_nom", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${uid}-client-adresse`}>
                    Adresse
                  </label>
                  <textarea
                    id={`${uid}-client-adresse`}
                    className={`${inputCls} resize-none`}
                    rows={2}
                    placeholder={"5 avenue Victor Hugo\n69001 Lyon"}
                    value={form.client_adresse}
                    onChange={(e) => set("client_adresse", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`${uid}-client-email`}>
                    Email client
                  </label>
                  <input
                    id={`${uid}-client-email`}
                    type="email"
                    className={inputCls}
                    placeholder="client@entreprise.fr"
                    value={form.client_email}
                    onChange={(e) => set("client_email", e.target.value)}
                  />
                </div>
              </div>
            </Section>
          </div>

          {/* ── Colonne droite ── */}
          <div className="flex flex-col gap-5">

            {/* Lignes de prestation */}
            <Section title="Prestations / Lignes">
              <div className="flex flex-col gap-2">
                {/* En-tête colonnes */}
                <div className="hidden sm:grid grid-cols-[1fr_60px_90px_80px_36px] gap-2 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Description
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
                    Qté
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">
                    PU HT (€)
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">
                    Total HT
                  </span>
                  <span />
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_60px_90px_80px_36px] gap-2 items-center"
                  >
                    <input
                      className={inputCls}
                      placeholder="Développement site web…"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                    />
                    <input
                      className={`${inputCls} text-center`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          Math.max(1, Number(e.target.value))
                        )
                      }
                    />
                    <input
                      className={`${inputCls} text-right`}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0,00"
                      value={item.unit_price === 0 ? "" : item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "unit_price",
                          Number(e.target.value)
                        )
                      }
                    />
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 text-right text-sm font-semibold text-gray-700">
                      {fmtEur(item.quantity * item.unit_price)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Supprimer la ligne"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addItem}
                  disabled={items.length >= 10}
                  className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:border-[#c9a55a] hover:text-[#c9a55a] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  Ajouter une ligne
                  {items.length >= 10 && (
                    <span className="ml-auto text-xs text-gray-400">
                      (max 10)
                    </span>
                  )}
                </button>
              </div>
            </Section>

            {/* TVA & totaux */}
            <Section title="TVA & Totaux">
              <div className="mb-4">
                <label className={labelCls} htmlFor={`${uid}-tva`}>
                  Taux de TVA
                </label>
                <select
                  id={`${uid}-tva`}
                  className={inputCls}
                  value={form.tva}
                  onChange={(e) => set("tva", Number(e.target.value))}
                >
                  <option value={0}>0% — Franchise en base / exonéré</option>
                  <option value={10}>10% — Taux réduit</option>
                  <option value={20}>20% — Taux normal</option>
                </select>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex justify-between py-1.5 text-sm text-gray-600">
                  <span>Total HT</span>
                  <span className="font-semibold">{fmtEur(totalHT)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm text-gray-600">
                  <span>TVA ({form.tva}%)</span>
                  <span className="font-semibold">{fmtEur(totalTVA)}</span>
                </div>
                <div
                  className="flex justify-between rounded-lg mt-2 px-3 py-2.5 text-base font-black"
                  style={{ background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}10)` }}
                >
                  <span className="text-gray-900">Total TTC</span>
                  <span style={{ color: GOLD }}>{fmtEur(totalTTC)}</span>
                </div>
              </div>
            </Section>

            {/* Notes */}
            <Section title="Notes / Conditions (facultatif)">
              <textarea
                className={`${inputCls} resize-none`}
                rows={4}
                placeholder={
                  "Paiement à 30 jours. Pénalités de retard : 3× le taux légal.\nMerci de votre confiance."
                }
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Section>
          </div>
        </div>

        {/* ── Boutons d'action ── */}
        <div className="mx-auto max-w-6xl px-6 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow"
            >
              <Eye size={15} />
              Aperçu
            </button>
            <button
              onClick={() => {
                setShowPreview(true);
                // Petit délai pour que le DOM s'affiche avant d'imprimer
                setTimeout(() => window.print(), 300);
              }}
              className="flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-bold text-black transition hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                boxShadow: "0 4px 18px rgba(201,165,90,0.35)",
              }}
            >
              <Printer size={15} />
              Imprimer / Télécharger PDF
            </button>
            <span className="text-xs text-gray-400">
              Conseil : dans la boîte de dialogue d&apos;impression, choisissez
              &quot;Enregistrer en PDF&quot; comme destination.
            </span>
          </div>
        </div>

        {/* ── CTA DJAMA ── */}
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div
            style={{
              background: "linear-gradient(135deg, #1a0c35, #0d0821)",
              borderRadius: 24,
              padding: "32px 40px",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Vous avez aimé ? Passez à la vitesse supérieure avec DJAMA
            </p>
            <h3
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 14,
                lineHeight: 1.3,
              }}
            >
              Gérez toutes vos factures, relancez les impayés, suivez votre trésorerie
            </h3>
            <ul
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                marginBottom: 22,
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <li>✓ Sauvegarde automatique de toutes vos factures</li>
              <li>✓ Envoi par email + signature électronique</li>
              <li>✓ Relances automatiques des impayés</li>
              <li>✓ Tableau de bord trésorerie en temps réel</li>
            </ul>
            <a
              href="/register"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #b08d45)`,
                color: "#000",
                padding: "14px 32px",
                borderRadius: 16,
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-block",
                fontSize: 14,
              }}
            >
              Créer mon compte gratuit →
            </a>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                marginTop: 12,
              }}
            >
              Gratuit · Sans carte bancaire · 2 minutes
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
