"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, Plus, Search, X, RefreshCw, Trash2, Edit2, Check,
  AlertTriangle, CheckCircle, XCircle, Clock, Star, Download,
  FileText, Package, DollarSign, Calendar, AlertOctagon,
  ShoppingCart, BarChart2, ChevronRight, ChevronLeft, Building2, Globe,
  CreditCard, Shield, Activity, Zap, TrendingUp, Eye,
  Wrench, Monitor, Factory,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fmtDate, fmtEur } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";

type OrderStatus   = "draft"|"sent"|"confirmed"|"in_delivery"|"received"|"partial"|"cancelled";
type InvoiceStatus = "unpaid"|"partial"|"paid"|"overdue"|"disputed";
type FournCat      = "produits"|"services"|"logiciels"|"matieres"|"transport"|"autre";

interface Fournisseur {
  id: string; user_id: string; company_name: string; contact_name: string;
  email: string; phone: string; address: string; city: string; country: string;
  website: string; siret: string; vat_number: string; iban: string;
  payment_method: string; payment_terms: string; currency: string; credit_limit: number;
  category: FournCat; notes: string; is_active: boolean;
  score_reliability: number; score_quality: number; score_price: number; score_delays: number;
  total_orders: number; total_late_orders: number; contract_expires_at: string | null;
  created_at: string; updated_at: string;
}

interface CatalogItem {
  id: string; user_id: string; fournisseur_id: string; name: string; reference: string;
  description: string; category: string; unit: string; unit_price: number; currency: string;
  discount_percent: number; min_quantity: number; lead_time_days: number; is_active: boolean;
  created_at: string;
}

interface FOrder {
  id: string; user_id: string; fournisseur_id: string | null; fournisseur_name: string;
  order_number: string; status: OrderStatus; order_date: string; expected_date: string | null;
  received_date: string | null; tracking_number: string; shipped_at: string | null;
  subtotal: number; vat_amount: number; total_amount: number; currency: string;
  payment_status: string; quality_issues: string; reception_notes: string; notes: string;
  created_at: string;
}

interface FInvoice {
  id: string; user_id: string; fournisseur_id: string | null; fournisseur_name: string;
  order_id: string | null; invoice_number: string; issue_date: string; due_date: string | null;
  subtotal: number; vat_amount: number; total_amount: number; paid_amount: number; currency: string;
  status: InvoiceStatus; payment_date: string | null; payment_method: string; notes: string;
  created_at: string;
}

interface FRating {
  id: string; fournisseur_id: string; reliability: number; quality: number;
  price: number; delays: number; comment: string; created_at: string;
}

const violet = "#8b5cf6";
const gold   = "#c9a55a";
const ease   = [0.16, 1, 0.3, 1] as const;

const CATEGORIES: { value: FournCat; label: string; icon: LucideIcon }[] = [
  { value: "produits",  label: "Produits",           icon: Package },
  { value: "services",  label: "Services",            icon: Wrench },
  { value: "logiciels", label: "Logiciels/SaaS",      icon: Monitor },
  { value: "matieres",  label: "Matières premières",  icon: Factory },
  { value: "transport", label: "Transport/Logistique", icon: Truck },
  { value: "autre",     label: "Autre",               icon: FileText },
];

const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  draft:       { label: "Brouillon",         color: "text-white/40",    bg: "bg-white/[0.05]" },
  sent:        { label: "Envoyée",           color: "text-sky-400",     bg: "bg-sky-500/10" },
  confirmed:   { label: "Confirmée",         color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  in_delivery: { label: "En livraison",      color: "text-blue-400",    bg: "bg-blue-500/10" },
  received:    { label: "Reçue",             color: "text-emerald-400", bg: "bg-emerald-500/10" },
  partial:     { label: "Partiellement reçue",color: "text-orange-400", bg: "bg-orange-500/10" },
  cancelled:   { label: "Annulée",           color: "text-red-400",     bg: "bg-red-500/10" },
};

const INV_STATUS: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  unpaid:   { label: "Non payée",   color: "text-orange-400",  bg: "bg-orange-500/10" },
  partial:  { label: "Partielle",   color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  paid:     { label: "Payée",       color: "text-emerald-400", bg: "bg-emerald-500/10" },
  overdue:  { label: "En retard",   color: "text-red-400",     bg: "bg-red-500/10" },
  disputed: { label: "Contestée",   color: "text-purple-400",  bg: "bg-purple-500/10" },
};

const PAYMENT_METHODS = ["virement", "chèque", "prélèvement", "carte", "PayPal", "autre"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "MAD", "CAD"];
const COUNTRIES = [
  "France", "Belgique", "Suisse", "Luxembourg", "Canada", "Maroc", "International",
  "Allemagne", "Autriche", "Espagne", "Italie", "Portugal", "Pays-Bas", "Pologne",
  "Suède", "Norvège", "Danemark", "Finlande", "Irlande", "Royaume-Uni", "Grèce",
  "Turquie", "Ukraine", "Russie", "République Tchèque", "Hongrie", "Roumanie",
  "Bulgarie", "Croatie", "Serbie", "Slovaquie", "Slovénie", "Lituanie", "Lettonie",
  "Estonie", "Chypre", "Malte", "Islande", "Albanie", "Macédoine du Nord",
  "Bosnie-Herzégovine", "Monténégro", "Kosovo", "Moldova", "Biélorussie",
  "Algérie", "Tunisie", "Égypte", "Sénégal", "Côte d'Ivoire", "Mali",
  "Burkina Faso", "Niger", "Guinée", "Cameroun", "Congo", "RD Congo",
  "Madagascar", "Mozambique", "Tanzanie", "Kenya", "Éthiopie", "Nigeria",
  "Ghana", "Afrique du Sud", "Angola", "Zambie", "Zimbabwe", "Namibie",
  "Botswana", "Rwanda", "Ouganda", "Tchad", "Soudan", "Libye",
  "Mauritanie", "Togo", "Bénin", "Gabon", "Centrafrique", "Djibouti",
  "États-Unis", "Mexique", "Brésil", "Argentine", "Chili", "Colombie",
  "Pérou", "Venezuela", "Équateur", "Bolivie", "Paraguay", "Uruguay",
  "Cuba", "Haïti", "République Dominicaine", "Panama", "Costa Rica",
  "Guatemala", "Honduras", "Salvador", "Nicaragua", "Jamaïque",
  "Chine", "Japon", "Inde", "Corée du Sud", "Indonésie", "Philippines",
  "Viêt Nam", "Thaïlande", "Malaisie", "Singapour", "Myanmar", "Cambodge",
  "Bangladesh", "Pakistan", "Sri Lanka", "Népal", "Iran", "Irak",
  "Arabie Saoudite", "Émirats Arabes Unis", "Qatar", "Koweït", "Bahreïn",
  "Oman", "Yémen", "Jordanie", "Liban", "Israël", "Palestine",
  "Kazakhstan", "Ouzbékistan", "Azerbaïdjan", "Arménie", "Géorgie",
  "Mongolie", "Taïwan", "Hong Kong",
  "Australie", "Nouvelle-Zélande", "Papouasie-Nouvelle-Guinée", "Fidji",
];
const UNITS = ["pièce", "kg", "g", "litre", "ml", "m²", "m", "boîte", "palette", "heure", "jour"];

const EMPTY_FOURN = (): Partial<Fournisseur> => ({
  company_name: "", contact_name: "", email: "", phone: "", address: "", city: "",
  country: "France", website: "", siret: "", vat_number: "", iban: "",
  payment_method: "virement", payment_terms: "30 jours", currency: "EUR", credit_limit: 0,
  category: "produits", notes: "", is_active: true,
});

const EMPTY_ORDER = (): Partial<FOrder> => ({
  order_number: `BC-${Date.now().toString().slice(-6)}`,
  status: "draft", order_date: new Date().toISOString().split("T")[0],
  expected_date: null, tracking_number: "", subtotal: 0, vat_amount: 0,
  total_amount: 0, currency: "EUR", payment_status: "unpaid", notes: "",
});

const EMPTY_INVOICE = (): Partial<FInvoice> => ({
  invoice_number: "", issue_date: new Date().toISOString().split("T")[0],
  due_date: null, subtotal: 0, vat_amount: 0, total_amount: 0, paid_amount: 0,
  currency: "EUR", status: "unpaid", payment_method: "", notes: "",
});

const DarkCtx = createContext(true);
const useDark = () => useContext(DarkCtx);

function useInp() {
  const isDark = useDark();
  return (extra = "") => isDark
    ? `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.18] transition-colors ${extra}`
    : `w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors ${extra}`;
}

function selStyle(isDark: boolean): React.CSSProperties {
  return {
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
    colorScheme: isDark ? "dark" : "light",
  };
}

function Lbl({ children }: { children: React.ReactNode }) {
  const isDark = useDark();
  return <label className={`mb-1.5 block text-[0.65rem] font-medium ${isDark ? "text-white/35" : "text-gray-500"}`}>{children}</label>;
}
function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const isDark = useDark();
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={`text-base transition-all ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          style={{ color: n <= value ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}>
          <Star size={16} fill="currentColor" strokeWidth={1}/>
        </button>
      ))}
    </div>
  );
}

function FournModal({ data, onSave, onClose }: {
  data: Partial<Fournisseur>; onSave: (f: Partial<Fournisseur>) => Promise<void>; onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState<Partial<Fournisseur>>(data);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const set = (k: keyof Fournisseur, v: string | number | boolean | null) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: violet + "18", border: `1px solid ${violet}30` }}>
              <Truck size={14} style={{ color: violet }}/>
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{form.id ? "Modifier fournisseur" : "Nouveau fournisseur"}</h3>
              <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>Étape {step} / 3</p>
            </div>
          </div>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="flex gap-1 px-6 pt-4">
          {[1,2,3].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: s <= step ? violet : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}/>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
          {step === 1 && (
            <>
              <div><Lbl>Nom de l'entreprise *</Lbl>
                <input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} placeholder="ACME Fournisseurs SARL" className={inp()}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>Contact principal</Lbl>
                  <input value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} placeholder="Prénom Nom" className={inp()}/>
                </div>
                <div><Lbl>Catégorie</Lbl>
                  <select value={form.category ?? "produits"} onChange={(e) => set("category", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>Email</Lbl>
                  <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="contact@fournisseur.com" className={inp()}/>
                </div>
                <div><Lbl>Téléphone</Lbl>
                  <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+33 1 00 00 00 00" className={inp()}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>Adresse</Lbl>
                  <input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="123 rue de la Paix" className={inp()}/>
                </div>
                <div><Lbl>Ville</Lbl>
                  <input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Paris" className={inp()}/>
                </div>
              </div>
              <div><Lbl>Pays</Lbl>
                <select value={form.country ?? "France"} onChange={(e) => set("country", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Lbl>Site web</Lbl>
                <input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://fournisseur.com" className={inp()}/>
              </div>
            </>
          )}

          {/* Step 2: Légal & Finance */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>SIRET</Lbl>
                  <input value={form.siret ?? ""} onChange={(e) => set("siret", e.target.value)} placeholder="123 456 789 00012" className={inp()}/>
                </div>
                <div><Lbl>N° TVA</Lbl>
                  <input value={form.vat_number ?? ""} onChange={(e) => set("vat_number", e.target.value)} placeholder="FR 12 345678901" className={inp()}/>
                </div>
              </div>
              <div><Lbl>IBAN</Lbl>
                <input value={form.iban ?? ""} onChange={(e) => set("iban", e.target.value)} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" className={inp()}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Lbl>Mode de paiement</Lbl>
                  <select value={form.payment_method ?? "virement"} onChange={(e) => set("payment_method", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                    {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><Lbl>Conditions</Lbl>
                  <input value={form.payment_terms ?? "30 jours"} onChange={(e) => set("payment_terms", e.target.value)} placeholder="30 jours" className={inp()}/>
                </div>
                <div><Lbl>Devise</Lbl>
                  <select value={form.currency ?? "EUR"} onChange={(e) => set("currency", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><Lbl>Limite de crédit (€)</Lbl>
                <input type="number" value={form.credit_limit ?? 0} onChange={(e) => set("credit_limit", parseFloat(e.target.value))} className={inp()}/>
              </div>
              <div><Lbl>Expiration contrat</Lbl>
                <input type="date" value={form.contract_expires_at ?? ""} onChange={(e) => set("contract_expires_at", e.target.value || null)} className={inp()}/>
              </div>
            </>
          )}

          {/* Step 3: Notes */}
          {step === 3 && (
            <>
              <div><Lbl>Notes internes</Lbl>
                <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Informations importantes sur ce fournisseur…" className={inp("resize-none")}/>
              </div>
              <div className={`rounded-2xl p-4 space-y-3 border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
                <p className={`text-xs font-bold ${isDark ? "text-white/50" : "text-gray-500"}`}>Récapitulatif</p>
                <div className={`grid grid-cols-2 gap-2 text-xs ${isDark ? "text-white/60" : "text-gray-700"}`}>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Société : </span>{form.company_name}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Catégorie : </span>{CATEGORIES.find((c) => c.value === form.category)?.label}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Email : </span>{form.email || "—"}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Paiement : </span>{form.payment_terms}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>SIRET : </span>{form.siret || "—"}</div>
                  <div><span className={isDark ? "text-white/30" : "text-gray-400"}>Devise : </span>{form.currency}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2">
          {step > 1 && <button onClick={() => setStep((s) => s - 1)} className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}><ChevronLeft size={14}/>Retour</button>}
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!form.company_name}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              Suivant <ChevronRight size={14} className="inline-block"/>
            </button>
          ) : (
            <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }} disabled={saving || !form.company_name}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={14}/>}
              {form.id ? "Enregistrer" : "Créer le fournisseur"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── ORDER MODAL ───────────────────────────

function OrderModal({ fournisseurs, order, onSave, onClose }: {
  fournisseurs: Fournisseur[]; order: Partial<FOrder>;
  onSave: (o: Partial<FOrder>) => Promise<void>; onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState<Partial<FOrder>>(order);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FOrder, v: string | number | null) => setForm((p) => ({ ...p, [k]: v }));

  const selectedF = fournisseurs.find((f) => f.id === form.fournisseur_id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{form.id ? "Modifier la commande" : "Nouvelle commande fournisseur"}</h3>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto max-h-[70vh]">
          <div><Lbl>Fournisseur *</Lbl>
            <select value={form.fournisseur_id ?? ""} onChange={(e) => {
              const f = fournisseurs.find((f) => f.id === e.target.value);
              set("fournisseur_id", e.target.value || null);
              set("fournisseur_name", f?.company_name ?? "");
            }} className={inp("appearance-none")} style={selStyle(isDark)}>
              <option value="">Sélectionner…</option>
              {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.company_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>N° de commande</Lbl>
              <input value={form.order_number ?? ""} onChange={(e) => set("order_number", e.target.value)} className={inp()}/>
            </div>
            <div><Lbl>Statut</Lbl>
              <select value={form.status ?? "draft"} onChange={(e) => set("status", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Date commande</Lbl>
              <input type="date" value={form.order_date ?? ""} onChange={(e) => set("order_date", e.target.value)} className={inp()}/>
            </div>
            <div><Lbl>Livraison prévue</Lbl>
              <input type="date" value={form.expected_date ?? ""} onChange={(e) => set("expected_date", e.target.value || null)} className={inp()}/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Lbl>HT (€)</Lbl>
              <input type="number" min={0} step={0.01} value={form.subtotal ?? 0} onChange={(e) => {
                const ht = parseFloat(e.target.value) || 0;
                const tva = ht * 0.2;
                setForm((p) => ({ ...p, subtotal: ht, vat_amount: tva, total_amount: ht + tva }));
              }} className={inp()}/>
            </div>
            <div><Lbl>TVA (€)</Lbl>
              <input type="number" readOnly value={(form.vat_amount ?? 0).toFixed(2)} className={inp("opacity-50 cursor-not-allowed")}/>
            </div>
            <div><Lbl>TTC (€)</Lbl>
              <input type="number" readOnly value={(form.total_amount ?? 0).toFixed(2)} className={inp("opacity-50 cursor-not-allowed")}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>N° de suivi</Lbl>
              <input value={form.tracking_number ?? ""} onChange={(e) => set("tracking_number", e.target.value)} placeholder="DHL12345…" className={inp()}/>
            </div>
            <div><Lbl>Date réception</Lbl>
              <input type="date" value={form.received_date ?? ""} onChange={(e) => set("received_date", e.target.value || null)} className={inp()}/>
            </div>
          </div>
          <div><Lbl>Notes / Problèmes qualité</Lbl>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp("resize-none")}/>
          </div>
          {selectedF && (
            <div className={`rounded-xl px-3 py-2 text-xs border border-violet-500/15 bg-violet-500/5 ${isDark ? "text-white/50" : "text-gray-500"}`}>
              <span className="text-violet-400 font-semibold">{selectedF.company_name}</span> · {selectedF.payment_terms} · délai {selectedF.total_orders > 0 ? `${selectedF.total_late_orders}/${selectedF.total_orders} retards` : "nouveau fournisseur"}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
          <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }} disabled={saving || !form.fournisseur_id}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin"/> : <Check size={13}/>}
            {form.id ? "Enregistrer" : "Créer la commande"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── INVOICE MODAL ───────────────────────────

function InvoiceModal({ fournisseurs, invoice, onSave, onClose }: {
  fournisseurs: Fournisseur[]; invoice: Partial<FInvoice>;
  onSave: (i: Partial<FInvoice>) => Promise<void>; onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState<Partial<FInvoice>>(invoice);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FInvoice, v: string | number | null) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{form.id ? "Modifier facture" : "Nouvelle facture fournisseur"}</h3>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto max-h-[70vh]">
          <div><Lbl>Fournisseur *</Lbl>
            <select value={form.fournisseur_id ?? ""} onChange={(e) => {
              const f = fournisseurs.find((f) => f.id === e.target.value);
              set("fournisseur_id", e.target.value || null);
              set("fournisseur_name", f?.company_name ?? "");
            }} className={inp("appearance-none")} style={selStyle(isDark)}>
              <option value="">Sélectionner…</option>
              {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.company_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>N° de facture</Lbl>
              <input value={form.invoice_number ?? ""} onChange={(e) => set("invoice_number", e.target.value)} placeholder="FAC-2026-001" className={inp()}/>
            </div>
            <div><Lbl>Statut</Lbl>
              <select value={form.status ?? "unpaid"} onChange={(e) => set("status", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                {Object.entries(INV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Date d'émission</Lbl>
              <input type="date" value={form.issue_date ?? ""} onChange={(e) => set("issue_date", e.target.value)} className={inp()}/>
            </div>
            <div><Lbl>Échéance</Lbl>
              <input type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} className={inp()}/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Lbl>Montant HT</Lbl>
              <input type="number" min={0} step={0.01} value={form.subtotal ?? 0} onChange={(e) => {
                const ht = parseFloat(e.target.value) || 0;
                const tva = ht * 0.2;
                setForm((p) => ({ ...p, subtotal: ht, vat_amount: tva, total_amount: ht + tva }));
              }} className={inp()}/>
            </div>
            <div><Lbl>TVA</Lbl>
              <input readOnly value={(form.vat_amount ?? 0).toFixed(2)} className={inp("opacity-50")}/>
            </div>
            <div><Lbl>Total TTC</Lbl>
              <input readOnly value={(form.total_amount ?? 0).toFixed(2)} className={inp("opacity-50")}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Montant payé</Lbl>
              <input type="number" min={0} step={0.01} value={form.paid_amount ?? 0} onChange={(e) => set("paid_amount", parseFloat(e.target.value))} className={inp()}/>
            </div>
            <div><Lbl>Mode de paiement</Lbl>
              <select value={form.payment_method ?? ""} onChange={(e) => set("payment_method", e.target.value)} className={inp("appearance-none")} style={selStyle(isDark)}>
                <option value="">Non défini</option>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div><Lbl>Notes</Lbl>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp("resize-none")}/>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "text-white/50 border-white/10 hover:bg-white/[0.04]" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>Annuler</button>
          <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }} disabled={saving || !form.fournisseur_id}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin"/> : <Check size={13}/>}
            {form.id ? "Enregistrer" : "Créer la facture"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RatingModal({ fournisseur, onSave, onClose }: {
  fournisseur: Fournisseur; onSave: (r: { reliability: number; quality: number; price: number; delays: number; comment: string }) => Promise<void>; onClose: () => void;
}) {
  const isDark = useDark();
  const inp = useInp();
  const [form, setForm] = useState({ reliability: 3, quality: 3, price: 3, delays: 3, comment: "" });
  const [saving, setSaving] = useState(false);
  const criteria = [
    { key: "reliability" as const, label: "Fiabilité" },
    { key: "quality"     as const, label: "Qualité" },
    { key: "price"       as const, label: "Prix" },
    { key: "delays"      as const, label: "Délais" },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>Évaluer — {fournisseur.company_name}</h3>
          <button onClick={onClose} className={`h-7 w-7 flex items-center justify-center rounded-lg border ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          {criteria.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? "text-white/70" : "text-gray-600"}`}>{label}</span>
              <Stars value={form[key]} onChange={(n) => setForm((p) => ({ ...p, [key]: n }))}/>
            </div>
          ))}
          <div><Lbl>Commentaire</Lbl>
            <textarea value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} rows={3} placeholder="Observations…" className={inp("resize-none")}/>
          </div>
          <div className={`text-center p-3 rounded-xl border ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
            <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-gray-400"}`}>Score moyen</p>
            <p className="text-2xl font-bold" style={{ color: violet }}>
              {((form.reliability + form.quality + form.price + form.delays) / 4).toFixed(1)}/5
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm border ${isDark ? "text-white/50 border-white/10" : "text-gray-500 border-gray-200"}`}>Annuler</button>
          <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
            {saving ? <RefreshCw size={13} className="animate-spin"/> : <Star size={13}/>} Enregistrer l'évaluation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── DASHBOARD VIEW ───────────────────────────

function DashboardView({ fournisseurs, orders, invoices, onNew, onNewOrder, onNewInvoice }: {
  fournisseurs: Fournisseur[]; orders: FOrder[]; invoices: FInvoice[];
  onNew: () => void; onNewOrder: () => void; onNewInvoice: () => void;
}) {
  const isDark = useDark();
  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const actifs = fournisseurs.filter((f) => f.is_active).length;
  const ordersActive = orders.filter((o) => !["received", "cancelled"].includes(o.status)).length;
  const unpaidInv = invoices.filter((i) => i.status !== "paid" && i.status !== "disputed");
  const totalDue = unpaidInv.reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);
  const overdue = invoices.filter((i) => i.due_date && i.due_date < today && i.status !== "paid").length;
  const contractsExpiring = fournisseurs.filter((f) => f.contract_expires_at && f.contract_expires_at <= in30).length;

  const kpis = [
    { label: "Fournisseurs actifs",   value: actifs,           icon: Truck,         color: violet, bg: "bg-violet-500/10" },
    { label: "Commandes en cours",    value: ordersActive,     icon: ShoppingCart,  color: "#3b82f6", bg: "bg-blue-500/10" },
    { label: "Montant dû",            value: fmtEur(totalDue), icon: DollarSign,    color: "#f97316", bg: "bg-orange-500/10", isStr: true },
    { label: "Factures en retard",    value: overdue,          icon: AlertOctagon,  color: "#ef4444", bg: "bg-red-500/10" },
    { label: "Contrats expirant bientôt", value: contractsExpiring, icon: Calendar, color: "#f59e0b", bg: "bg-amber-500/10" },
    { label: "Fournisseurs total",    value: fournisseurs.length, icon: Building2,  color: "#8b5cf6", bg: "bg-violet-500/10" },
  ];

  // Top fournisseurs par score
  const topFourn = [...fournisseurs]
    .filter((f) => f.score_reliability > 0 || f.score_quality > 0)
    .sort((a, b) => ((b.score_reliability + b.score_quality + b.score_price + b.score_delays) / 4) - ((a.score_reliability + a.score_quality + a.score_price + a.score_delays) / 4))
    .slice(0, 5);

  // Alertes
  const alerts: { text: string; color: string; icon: React.ElementType }[] = [];
  if (overdue > 0) alerts.push({ text: `${overdue} facture${overdue > 1 ? "s" : ""} en retard de paiement`, color: "#ef4444", icon: AlertOctagon });
  if (contractsExpiring > 0) alerts.push({ text: `${contractsExpiring} contrat${contractsExpiring > 1 ? "s" : ""} fournisseur expirent dans 30 jours`, color: "#f59e0b", icon: Calendar });
  orders.filter((o) => o.expected_date && o.expected_date < today && o.status === "sent").slice(0, 2).forEach((o) => {
    alerts.push({ text: `Livraison en retard : commande ${o.order_number || o.id.slice(0,8)} — ${o.fournisseur_name}`, color: "#f97316", icon: Truck });
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-4 flex flex-col gap-2 ${isDark ? "border-white/[0.06] bg-white/[0.025]" : "border-gray-200 bg-white"}`}>
            <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon size={15} style={{ color: k.color }}/>
            </div>
            <div>
              <div className={`font-bold ${isDark ? "text-white/90" : "text-gray-800"} ${k.isStr ? "text-sm" : "text-xl"}`}>{k.value}</div>
              <div className={`text-[10px] mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-2.5 border" style={{ background: a.color + "08", borderColor: a.color + "25" }}>
              <a.icon size={13} style={{ color: a.color }}/>
              <span className={`text-xs ${isDark ? "text-white/70" : "text-gray-600"}`}>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top fournisseurs */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}><Star size={12} style={{ color: violet }}/> Top fournisseurs</h3>
          <div className={`rounded-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
            {topFourn.length === 0 ? (
              <p className={`text-center text-sm py-8 ${isDark ? "text-white/25" : "text-gray-300"}`}>Aucune évaluation — notez vos fournisseurs</p>
            ) : topFourn.map((f, i) => {
              const score = ((f.score_reliability + f.score_quality + f.score_price + f.score_delays) / 4);
              const cat = CATEGORIES.find((c) => c.value === f.category);
              return (
                <div key={f.id} className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                  <span className={`text-xs font-semibold w-4 shrink-0 ${isDark ? "text-white/20" : "text-gray-300"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{f.company_name}</p>
                    <p className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>{cat?.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: score >= 4 ? "#10b981" : score >= 3 ? violet : "#f97316" }}>{score.toFixed(1)}/5</p>
                    <Stars value={Math.round(score)}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commandes récentes */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}><ShoppingCart size={12} className="text-blue-400"/> Commandes récentes</h3>
          <div className={`rounded-2xl overflow-hidden border ${isDark ? "bg-white/[0.025] border-white/[0.06]" : "bg-white border-gray-200"}`}>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className={`text-sm ${isDark ? "text-white/25" : "text-gray-300"}`}>Aucune commande</p>
                <button onClick={onNewOrder} className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ background: violet + "20", color: violet, border: `1px solid ${violet}40` }}><Plus size={11} className="inline mr-1"/>Créer</button>
              </div>
            ) : orders.slice(0, 6).map((o) => {
              const s = ORDER_STATUS[o.status];
              return (
                <div key={o.id} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{o.fournisseur_name}</p>
                    <p className={`text-[10px] ${isDark ? "text-white/35" : "text-gray-400"}`}>{o.order_number} · {fmtDate(o.order_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                    <p className={`text-xs font-bold mt-0.5 ${isDark ? "text-white/60" : "text-gray-500"}`}>{fmtEur(o.total_amount)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {fournisseurs.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: violet + "15", border: `1px solid ${violet}30` }}>
            <Truck size={24} style={{ color: violet }}/>
          </div>
          <p className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>Aucun fournisseur — ajoutez votre premier partenaire</p>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: violet + "20", color: violet, border: `1px solid ${violet}40` }}>
            <Plus size={13}/> Ajouter un fournisseur
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── FOURNISSEURS LIST ───────────────────────────

function FournisseursView({ fournisseurs, orders, invoices, onNew, onEdit, onDelete, onRate }: {
  fournisseurs: Fournisseur[]; orders: FOrder[]; invoices: FInvoice[];
  onNew: () => void; onEdit: (f: Fournisseur) => void; onDelete: (id: string) => void; onRate: (f: Fournisseur) => void;
}) {
  const isDark = useDark();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = fournisseurs.filter((f) => {
    if (catFilter !== "all" && f.category !== catFilter) return false;
    if (search && !f.company_name.toLowerCase().includes(search.toLowerCase()) && !f.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className="relative flex-1 min-w-[180px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher fournisseur…"
            className={`w-full border rounded-xl px-3 py-2 text-sm pl-8 focus:outline-none transition-colors ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-white/[0.18]" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-gray-400"}`}/>
          <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none"
          style={selStyle(isDark)}>
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouveau
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 auto-rows-min">
        {filtered.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center gap-3 py-16 text-center">
            <Truck size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun fournisseur</p>
          </div>
        ) : filtered.map((f) => {
          const score = f.score_reliability > 0 ? ((f.score_reliability + f.score_quality + f.score_price + f.score_delays) / 4) : null;
          const cat = CATEGORIES.find((c) => c.value === f.category);
          const fOrders = orders.filter((o) => o.fournisseur_id === f.id);
          const fInvoices = invoices.filter((i) => i.fournisseur_id === f.id);
          const totalDue = fInvoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);
          const contractExpiring = f.contract_expires_at && f.contract_expires_at <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

          return (
            <motion.div key={f.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`group border rounded-2xl p-5 transition-all flex flex-col gap-3 ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 flex items-center justify-center rounded-xl text-sm font-semibold shrink-0" style={{ background: violet + "18", color: violet, border: `1px solid ${violet}30` }}>
                    {f.company_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-gray-800"}`}>{f.company_name}</p>
                    <p className={`text-[10px] ${isDark ? "text-white/40" : "text-gray-400"}`}>{cat?.label}{f.city ? ` · ${f.city}` : ""}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                  <button onClick={() => onRate(f)} title="Évaluer" className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-amber-500/10 hover:text-amber-400 transition-all ${isDark ? "text-white/30" : "text-gray-400"}`}><Star size={12}/></button>
                  <button onClick={() => onEdit(f)} className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Edit2 size={12}/></button>
                  <button onClick={() => onDelete(f.id)} className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all ${isDark ? "text-white/30" : "text-gray-400"}`}><Trash2 size={12}/></button>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-0.5">
                {f.email && <p className={`text-xs truncate ${isDark ? "text-white/40" : "text-gray-500"}`}>{f.email}</p>}
                {f.phone && <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-500"}`}>{f.phone}</p>}
                {f.contact_name && <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-500"}`}>Contact : {f.contact_name}</p>}
              </div>

              {/* Score */}
              {score !== null && (
                <div className="flex items-center gap-2">
                  <Stars value={Math.round(score)}/>
                  <span className="text-xs font-bold" style={{ color: score >= 4 ? "#10b981" : score >= 3 ? violet : "#f97316" }}>{score.toFixed(1)}/5</span>
                </div>
              )}

              {/* Stats */}
              <div className={`flex items-center gap-3 pt-3 border-t flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
                <div className={`flex items-center gap-1 text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}><ShoppingCart size={10}/> {fOrders.length} commande{fOrders.length > 1 ? "s" : ""}</div>
                {totalDue > 0 && <div className="flex items-center gap-1 text-[10px] text-orange-400"><DollarSign size={10}/> {fmtEur(totalDue)} dû</div>}
                <div className={`text-[10px] ml-auto ${isDark ? "text-white/25" : "text-gray-300"}`}>{f.payment_terms}</div>
              </div>

              {/* Alerts */}
              {contractExpiring && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/15 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle size={10}/> Contrat expire le {fmtDate(f.contract_expires_at)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────── ORDERS VIEW ───────────────────────────

function OrdersView({ orders, fournisseurs, onNew, onEdit, onDelete }: {
  orders: FOrder[]; fournisseurs: Fournisseur[];
  onNew: () => void; onEdit: (o: FOrder) => void; onDelete: (id: string) => void;
}) {
  const isDark = useDark();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
          className="border rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none flex-1 max-w-xs"
          style={selStyle(isDark)}>
          <option value="all">Tous statuts</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouvelle commande
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShoppingCart size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune commande</p>
          </div>
        ) : filtered.map((o) => {
          const s = ORDER_STATUS[o.status];
          const today = new Date().toISOString().split("T")[0];
          const isLate = o.expected_date && o.expected_date < today && !["received", "cancelled"].includes(o.status);
          return (
            <motion.div key={o.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`group flex items-center gap-3 border rounded-2xl px-4 py-3 transition-all ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{o.fournisseur_name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                  {isLate && <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold"><AlertTriangle size={9}/>En retard</span>}
                </div>
                <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
                  {o.order_number} · Commandé le {fmtDate(o.order_date)}
                  {o.expected_date ? ` · Attendu le ${fmtDate(o.expected_date)}` : ""}
                  {o.tracking_number ? ` · Suivi : ${o.tracking_number}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isDark ? "text-white/80" : "text-gray-700"}`}>{fmtEur(o.total_amount)}</p>
                <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>HT : {fmtEur(o.subtotal)}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all shrink-0">
                <button onClick={() => onEdit(o)} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Edit2 size={12}/></button>
                <button onClick={() => onDelete(o.id)} className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 ${isDark ? "text-white/30" : "text-gray-400"}`}><Trash2 size={12}/></button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────── INVOICES VIEW ───────────────────────────

function InvoicesView({ invoices, fournisseurs, onNew, onEdit, onDelete }: {
  invoices: FInvoice[]; fournisseurs: Fournisseur[];
  onNew: () => void; onEdit: (i: FInvoice) => void; onDelete: (id: string) => void;
}) {
  const isDark = useDark();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const filtered = invoices.filter((i) => statusFilter === "all" || i.status === statusFilter);
  const totalDue = filtered.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b flex-wrap ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}
          className="border rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none flex-1 max-w-xs"
          style={selStyle(isDark)}>
          <option value="all">Tous statuts</option>
          {Object.entries(INV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {totalDue > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle size={12} className="text-orange-400"/>
            <span className="text-xs font-bold text-orange-400">{fmtEur(totalDue)} à payer</span>
          </div>
        )}
        <button onClick={onNew} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Plus size={13}/> Nouvelle facture
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText size={28} className={isDark ? "text-white/20" : "text-gray-300"}/>
            <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune facture</p>
          </div>
        ) : filtered.map((inv) => {
          const s = INV_STATUS[inv.status];
          const remaining = inv.total_amount - inv.paid_amount;
          const today = new Date().toISOString().split("T")[0];
          const overdue = inv.due_date && inv.due_date < today && inv.status !== "paid";
          return (
            <motion.div key={inv.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`group flex items-center gap-3 border rounded-2xl px-4 py-3 transition-all ${isDark ? "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.14]" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{inv.fournisseur_name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color} ${s.bg}`}>{s.label}</span>
                  {overdue && <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold"><AlertTriangle size={9}/>Échue</span>}
                </div>
                <p className={`text-xs ${isDark ? "text-white/35" : "text-gray-400"}`}>
                  {inv.invoice_number || "N° non défini"} · Émise le {fmtDate(inv.issue_date)}
                  {inv.due_date ? ` · Échéance : ${fmtDate(inv.due_date)}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isDark ? "text-white/80" : "text-gray-700"}`}>{fmtEur(inv.total_amount)}</p>
                {remaining > 0 && remaining < inv.total_amount && (
                  <p className="text-xs text-orange-400">Restant : {fmtEur(remaining)}</p>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all shrink-0">
                <button onClick={() => onEdit(inv)} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "hover:bg-white/[0.08] text-white/30 hover:text-white/70" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Edit2 size={12}/></button>
                <button onClick={() => onDelete(inv.id)} className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 hover:text-red-400 ${isDark ? "text-white/30" : "text-gray-400"}`}><Trash2 size={12}/></button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────── MAIN PAGE ───────────────────────────

export default function FournisseursPage() {
  const { isDark } = useTheme();
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard"|"list"|"orders"|"invoices">("dashboard");

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [orders, setOrders] = useState<FOrder[]>([]);
  const [invoices, setInvoices] = useState<FInvoice[]>([]);

  const [showFournModal, setShowFournModal] = useState(false);
  const [editFourn, setEditFourn] = useState<Partial<Fournisseur>>(EMPTY_FOURN());
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editOrder, setEditOrder] = useState<Partial<FOrder>>(EMPTY_ORDER());
  const [showInvModal, setShowInvModal] = useState(false);
  const [editInv, setEditInv] = useState<Partial<FInvoice>>(EMPTY_INVOICE());
  const [ratingFourn, setRatingFourn] = useState<Fournisseur | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"fourn"|"order"|"invoice">("fourn");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/login"); return; }
        setUserId(user.id);
        const [fRes, oRes, iRes] = await Promise.all([
          supabase.from("fournisseurs").select("*").eq("user_id", user.id).order("company_name").limit(500),
          supabase.from("fournisseur_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
          supabase.from("fournisseur_invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        ]);
        if (!fRes.error && fRes.data) setFournisseurs(fRes.data as Fournisseur[]);
        if (!oRes.error && oRes.data) setOrders(oRes.data as FOrder[]);
        if (!iRes.error && iRes.data) setInvoices(iRes.data as FInvoice[]);
      } catch {
        toast("Erreur réseau — impossible de charger les fournisseurs", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveFourn = useCallback(async (form: Partial<Fournisseur>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseurs").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setFournisseurs((prev) => prev.map((f) => f.id === form.id ? data as Fournisseur : f));
      toast("Fournisseur mis à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseurs").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setFournisseurs((prev) => [...prev, data as Fournisseur].sort((a, b) => a.company_name.localeCompare(b.company_name)));
      toast("Fournisseur créé", "success");
    }
    setShowFournModal(false);
    setEditFourn(EMPTY_FOURN());
  }, [userId, toast]);

  const saveOrder = useCallback(async (form: Partial<FOrder>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseur_orders").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setOrders((prev) => prev.map((o) => o.id === form.id ? data as FOrder : o));
      toast("Commande mise à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseur_orders").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setOrders((prev) => [data as FOrder, ...prev]);
      toast("Commande créée", "success");
      // Update total_orders on fournisseur
      if (form.fournisseur_id) {
        const f = fournisseurs.find((f) => f.id === form.fournisseur_id);
        if (f) await supabase.from("fournisseurs").update({ total_orders: (f.total_orders ?? 0) + 1 }).eq("id", f.id);
      }
    }
    setShowOrderModal(false);
    setEditOrder(EMPTY_ORDER());
  }, [userId, toast, fournisseurs]);

  const saveInvoice = useCallback(async (form: Partial<FInvoice>) => {
    if (!userId) return;
    if (form.id) {
      const { data, error } = await supabase.from("fournisseur_invoices").update({ ...form, updated_at: new Date().toISOString() }).eq("id", form.id).select().single();
      if (error) { toast(error.message, "error"); return; }
      setInvoices((prev) => prev.map((i) => i.id === form.id ? data as FInvoice : i));
      toast("Facture mise à jour", "success");
    } else {
      const { data, error } = await supabase.from("fournisseur_invoices").insert({ ...form, user_id: userId }).select().single();
      if (error) { toast(error.message, "error"); return; }
      setInvoices((prev) => [data as FInvoice, ...prev]);
      toast("Facture créée", "success");
    }
    setShowInvModal(false);
    setEditInv(EMPTY_INVOICE());
  }, [userId, toast]);

  const saveRating = useCallback(async (r: { reliability: number; quality: number; price: number; delays: number; comment: string }) => {
    if (!userId || !ratingFourn) return;
    const { error: insErr } = await supabase.from("fournisseur_ratings").insert({ ...r, user_id: userId, fournisseur_id: ratingFourn.id });
    if (insErr) { toast("Erreur enregistrement évaluation", "error"); return; }
    // Update average scores on fournisseur
    const { data: ratings } = await supabase.from("fournisseur_ratings").select("reliability,quality,price,delays").eq("fournisseur_id", ratingFourn.id);
    if (ratings && ratings.length > 0) {
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const upd = {
        score_reliability: avg(ratings.map((r) => r.reliability)),
        score_quality: avg(ratings.map((r) => r.quality)),
        score_price: avg(ratings.map((r) => r.price)),
        score_delays: avg(ratings.map((r) => r.delays)),
      };
      const { data } = await supabase.from("fournisseurs").update(upd).eq("id", ratingFourn.id).select().single();
      if (data) setFournisseurs((prev) => prev.map((f) => f.id === ratingFourn.id ? data as Fournisseur : f));
    }
    toast("Évaluation enregistrée", "success");
    setRatingFourn(null);
  }, [userId, ratingFourn, toast]);

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const table = deleteType === "fourn" ? "fournisseurs" : deleteType === "order" ? "fournisseur_orders" : "fournisseur_invoices";
    const { error } = await supabase.from(table).delete().eq("id", confirmDeleteId);
    setDeleting(false); setConfirmDeleteId(null);
    if (error) { toast(error.message, "error"); return; }
    if (deleteType === "fourn") setFournisseurs((prev) => prev.filter((f) => f.id !== confirmDeleteId));
    else if (deleteType === "order") setOrders((prev) => prev.filter((o) => o.id !== confirmDeleteId));
    else setInvoices((prev) => prev.filter((i) => i.id !== confirmDeleteId));
    toast("Supprimé", "info");
  }, [confirmDeleteId, deleteType, toast]);

  const exportCSV = useCallback(() => {
    const rows = [
      ["Entreprise","Contact","Email","Téléphone","Catégorie","Paiement","Score"].join(";"),
      ...fournisseurs.map((f) => [f.company_name, f.contact_name, f.email, f.phone, f.category, f.payment_terms, ((f.score_reliability+f.score_quality+f.score_price+f.score_delays)/4).toFixed(1)].join(";")),
    ];
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "fournisseurs.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [fournisseurs]);

  const TABS = [
    { key: "dashboard" as const, label: "Dashboard",    icon: BarChart2 },
    { key: "list"      as const, label: "Fournisseurs", icon: Truck },
    { key: "orders"    as const, label: "Commandes",    icon: ShoppingCart },
    { key: "invoices"  as const, label: "Factures",     icon: FileText },
  ];

  return (
    <DarkCtx.Provider value={isDark}>
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#07080e] text-white" : "bg-gray-50 text-gray-900"}`}>
      <ToastStack toasts={toasts} remove={removeToast}/>

      {/* Animated header */}
      <div className="relative overflow-hidden shrink-0 sticky top-0 z-10" style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117,#07080e)" : "linear-gradient(160deg,#ffffff,#f8fafc,#ffffff)" }}>
        {/* Orbs */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#c9a55a,transparent)" }}/>
        <div className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#6366f1,transparent)" }}/>

        {/* Main row */}
        <div className="relative px-5 pt-4 pb-3 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
                className={`h-10 w-10 flex items-center justify-center rounded-xl border ${isDark ? "border-white/[0.08] bg-white/[0.04]" : "border-gray-200 bg-white"}`}>
                <Truck size={18} style={{ color: gold }}/>
              </motion.div>
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <h1 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Fournisseurs</h1>
                <p className={`text-[0.62rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>Fiches · Commandes · Factures · Évaluation</p>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} title="Exporter CSV" className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-all ${isDark ? "border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04]" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                <Download size={14}/>
              </button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setEditFourn(EMPTY_FOURN()); setShowFournModal(true); }}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a", boxShadow: "0 4px 16px rgba(201,165,90,0.35)" }}>
                <Plus size={13}/> Nouveau fournisseur
              </motion.button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="relative px-5 pb-3 sm:px-8">
          <div className="mx-auto max-w-7xl grid grid-cols-4 gap-2">
            {[
              { label: "Total",      value: fournisseurs.length,                                                             icon: Building2 },
              { label: "Actifs",     value: fournisseurs.filter((f) => f.is_active).length,                                  icon: CheckCircle },
              { label: "Commandes",  value: orders.filter((o) => !["received","cancelled"].includes(o.status)).length,      icon: ShoppingCart },
              { label: "Montant dû", value: fmtEur(invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.total_amount - i.paid_amount), 0)), icon: DollarSign },
            ].map((kpi, i) => {
              const KpiIcon = kpi.icon;
              return (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
                  <KpiIcon size={13} style={{ color: gold }} className="shrink-0"/>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold leading-none truncate ${isDark ? "text-white" : "text-gray-800"}`}>{kpi.value}</p>
                    <p className={`text-[0.58rem] uppercase tracking-wide mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>{kpi.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="relative px-5 sm:px-8 flex gap-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all ${tab === key ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-white/35 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}`}>
              <Icon size={12}/>
              {label}
              {key === "invoices" && invoices.filter((i) => i.status !== "paid").length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: gold + "30", color: gold }}>
                  {invoices.filter((i) => i.status !== "paid").length}
                </span>
              )}
              {tab === key && (
                <motion.div layoutId="fourn-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: gold }}/>
              )}
            </button>
          ))}
        </div>

        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: isDark ? "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" : "linear-gradient(90deg,transparent,rgba(201,165,90,0.3),transparent)" }}/>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={22} className={`animate-spin ${isDark ? "text-white/30" : "text-gray-300"}`}/>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === "dashboard" && <DashboardView fournisseurs={fournisseurs} orders={orders} invoices={invoices} onNew={() => { setEditFourn(EMPTY_FOURN()); setShowFournModal(true); }} onNewOrder={() => { setEditOrder(EMPTY_ORDER()); setShowOrderModal(true); }} onNewInvoice={() => { setEditInv(EMPTY_INVOICE()); setShowInvModal(true); }}/>}
          {tab === "list"      && <FournisseursView fournisseurs={fournisseurs} orders={orders} invoices={invoices} onNew={() => { setEditFourn(EMPTY_FOURN()); setShowFournModal(true); }} onEdit={(f) => { setEditFourn(f); setShowFournModal(true); }} onDelete={(id) => { setDeleteType("fourn"); setConfirmDeleteId(id); }} onRate={(f) => setRatingFourn(f)}/>}
          {tab === "orders"    && <OrdersView orders={orders} fournisseurs={fournisseurs} onNew={() => { setEditOrder(EMPTY_ORDER()); setShowOrderModal(true); }} onEdit={(o) => { setEditOrder(o); setShowOrderModal(true); }} onDelete={(id) => { setDeleteType("order"); setConfirmDeleteId(id); }}/>}
          {tab === "invoices"  && <InvoicesView invoices={invoices} fournisseurs={fournisseurs} onNew={() => { setEditInv(EMPTY_INVOICE()); setShowInvModal(true); }} onEdit={(i) => { setEditInv(i); setShowInvModal(true); }} onDelete={(id) => { setDeleteType("invoice"); setConfirmDeleteId(id); }}/>}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showFournModal && <FournModal data={editFourn} onSave={saveFourn} onClose={() => { setShowFournModal(false); setEditFourn(EMPTY_FOURN()); }}/>}
        {showOrderModal && <OrderModal fournisseurs={fournisseurs} order={editOrder} onSave={saveOrder} onClose={() => { setShowOrderModal(false); setEditOrder(EMPTY_ORDER()); }}/>}
        {showInvModal && <InvoiceModal fournisseurs={fournisseurs} invoice={editInv} onSave={saveInvoice} onClose={() => { setShowInvModal(false); setEditInv(EMPTY_INVOICE()); }}/>}
        {ratingFourn && <RatingModal fournisseur={ratingFourn} onSave={saveRating} onClose={() => setRatingFourn(null)}/>}
      </AnimatePresence>

      <ConfirmModal open={confirmDeleteId !== null}
        title={`Supprimer ${deleteType === "fourn" ? "ce fournisseur" : deleteType === "order" ? "cette commande" : "cette facture"} ?`}
        description="Cette action est irréversible."
        confirmLabel="Supprimer" loading={deleting}
        onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)}/>
    </div>
    </DarkCtx.Provider>
  );
}
