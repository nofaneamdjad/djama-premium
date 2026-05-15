"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, Copy, Check, Plus, Trash2, X, RefreshCw,
  Edit2, ChevronRight, ChevronLeft, Download, Eye, Send, Receipt, Users,
  Clock, CheckCircle, XCircle, AlertTriangle, Shield, Brain,
  Activity, MessageSquare, Calendar, TrendingUp, Pen, DollarSign,
  AlertOctagon, Lightbulb, Award, BarChart2, FileSignature,
  ChevronDown, Globe, Lock, Star, Wrench, Monitor, ShoppingCart,
  Cloud, Home, Briefcase, File,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { downloadContractPDF, openContractPDF } from "@/lib/contract-pdf";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { fmtDate, fmtEur } from "@/lib/format";

// ─────────────────────────── TYPES ───────────────────────────

type ContractType = "prestation" | "freelance" | "nda" | "partenariat" | "vente" | "saas" | "location" | "cdi" | "cdd" | "devis" | "autre";
type ContractStatus = "brouillon" | "validation" | "envoyé" | "vu" | "signé" | "refusé" | "expiré" | "actif";
type SignerStatus = "pending" | "sent" | "viewed" | "signed" | "refused";

interface Contract {
  id: string;
  user_id: string;
  title: string;
  client_name: string;
  client_email: string;
  client_company: string;
  contract_type: ContractType;
  content: string;
  status: ContractStatus;
  amount: number | null;
  currency?: string;
  start_date: string | null;
  end_date: string | null;
  jurisdiction?: string;
  language?: string;
  duration_months?: number;
  specific_clauses?: string;
  ai_summary?: string;
  ai_risks?: string;
  validation_manager?: boolean;
  validation_legal?: boolean;
  validation_finance?: boolean;
  is_recurring?: boolean;
  invoice_ref?: string;
  project?: string;
  sent_at?: string | null;
  viewed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
}

interface Signer {
  id: string;
  contract_id: string;
  user_id: string;
  signer_name: string;
  signer_email: string;
  signer_role: string;
  order_index: number;
  status: SignerStatus;
  signed_at: string | null;
  signature_data: string;
  certificate: string;
  created_at: string;
}

interface CActivity {
  id: string;
  contract_id: string;
  action: string;
  details: string;
  created_at: string;
}

interface CComment {
  id: string;
  contract_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

type DraftForm = {
  title: string;
  client_name: string;
  client_email: string;
  client_company: string;
  type: ContractType;
  amount: string;
  currency: string;
  duration_months: string;
  start_date: string;
  end_date: string;
  jurisdiction: string;
  language: string;
  specifics: string;
  selected_clauses: string[];
};

// ─────────────────────────── CONSTANTS ───────────────────────────

const gold = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

const CONTRACT_TYPES: { value: ContractType; label: string; icon: LucideIcon; desc: string }[] = [
  { value: "prestation", label: "Prestation",    icon: Wrench,       desc: "Mission, livrables" },
  { value: "freelance",  label: "Freelance",      icon: Monitor,      desc: "Indépendant, TJM" },
  { value: "nda",        label: "NDA",            icon: Lock,         desc: "Confidentialité" },
  { value: "partenariat",label: "Partenariat",    icon: Users,        desc: "Co-business" },
  { value: "vente",      label: "Vente",          icon: ShoppingCart, desc: "Biens, livraison" },
  { value: "saas",       label: "SaaS",           icon: Cloud,        desc: "Abonnement logiciel" },
  { value: "location",   label: "Location",       icon: Home,         desc: "Bien, loyer" },
  { value: "cdi",        label: "CDI",            icon: Briefcase,    desc: "Contrat permanent" },
  { value: "cdd",        label: "CDD",            icon: Calendar,     desc: "Contrat temporaire" },
  { value: "devis",      label: "Devis",          icon: FileText,     desc: "Bon de commande" },
  { value: "autre",      label: "Autre",          icon: File,         desc: "Personnalisé" },
];

const TYPE_MAP: Record<ContractType, string> = Object.fromEntries(
  CONTRACT_TYPES.map((t) => [t.value, t.label])
) as Record<ContractType, string>;

const STATUS_CFG: Record<ContractStatus, { label: string; text: string; bg: string; border: string }> = {
  brouillon:  { label: "Brouillon",   text: "text-white/40",    bg: "bg-white/[0.05]",    border: "border-white/10" },
  validation: { label: "Validation",  text: "text-yellow-400",  bg: "bg-yellow-500/10",   border: "border-yellow-500/20" },
  "envoyé":   { label: "Envoyé",      text: "text-sky-400",     bg: "bg-sky-500/10",      border: "border-sky-500/20" },
  vu:         { label: "Vu",          text: "text-purple-400",  bg: "bg-purple-500/10",   border: "border-purple-500/20" },
  "signé":    { label: "Signé",       text: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20" },
  "refusé":   { label: "Refusé",      text: "text-red-400",     bg: "bg-red-500/10",      border: "border-red-500/20" },
  "expiré":   { label: "Expiré",      text: "text-orange-400",  bg: "bg-orange-500/10",   border: "border-orange-500/20" },
  actif:      { label: "Actif",       text: "text-emerald-300", bg: "bg-emerald-400/10",  border: "border-emerald-400/20" },
};

const STATUS_FLOW: ContractStatus[] = ["brouillon", "validation", "envoyé", "vu", "signé", "actif"];

const JURISDICTIONS = ["France", "Belgique", "Suisse", "Luxembourg", "Canada", "Maroc", "International"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "MAD", "CAD"];

const SUGGESTED_CLAUSES: Record<ContractType, string[]> = {
  prestation:  ["Acompte 30% à la signature", "Révisions illimitées incluses", "Propriété intellectuelle transférée", "Pénalités de retard 3%/mois", "Non-concurrence 6 mois"],
  freelance:   ["TJM avec dépassement 20% max", "Frais de déplacement remboursés", "Non-débauchage 12 mois", "Droit moral conservé", "Facturation bi-mensuelle"],
  nda:         ["Durée confidentialité 3 ans", "Pénalité €50 000 si violation", "Exclusions : informations publiques", "Restitution documents à la fin", "Étendue mondiale"],
  partenariat: ["Partage revenus 50/50", "Clause de rachat à prix fixé", "Droit de préemption", "Gouvernance deux voix égales", "Non-sollicitation employés"],
  vente:       ["Garantie légale de conformité", "Réserve propriété jusqu'au paiement", "Délai rétractation 14 jours", "Force majeure définie", "Livraison DAP Incoterms"],
  saas:        ["SLA 99.9% uptime", "Backup quotidien des données", "Portabilité données à résiliation", "Sous-traitants RGPD listés", "Limitation responsabilité x3 abonnement"],
  location:    ["Dépôt de garantie 2 mois", "État des lieux contradictoire", "Assurance locataire obligatoire", "Interdiction sous-location", "Révision annuelle IRL"],
  cdi:         ["Période d'essai 3 mois renouvelable", "Clause non-concurrence 1 an", "Télétravail 2 jours/semaine", "Plan épargne entreprise", "Voiture de fonction"],
  cdd:         ["Renouvellement possible 1 fois", "Indemnité fin de contrat 10%", "Formation incluse", "Clause de rupture anticipée", "Motif de recours précisé"],
  devis:       ["Validité devis 30 jours", "Acompte 30% à la commande", "Pénalités retard légales", "Clause révision prix", "Droit applicable : droit français"],
  autre:       ["Confidentialité mutuelle", "Résiliation avec préavis 30 jours", "Arbitrage avant recours judiciaire", "Force majeure incluse", "Droit applicable défini"],
};

const EMPTY_FORM = (): DraftForm => ({
  title: "", client_name: "", client_email: "", client_company: "",
  type: "prestation", amount: "", currency: "EUR", duration_months: "12",
  start_date: "", end_date: "", jurisdiction: "France", language: "fr",
  specifics: "", selected_clauses: [],
});

// ─────────────────────────── AI ANALYSIS ───────────────────────────

function analyzeContract(c: Contract): {
  score: number;
  summary: string;
  risks: string[];
  suggestions: string[];
  compliance: { label: string; ok: boolean }[];
} {
  const summaries: Partial<Record<ContractType, string>> = {
    prestation: `Contrat de prestation d'une valeur de ${c.amount ? fmtEur(c.amount) : "montant non défini"} sur ${c.duration_months ?? 12} mois. Obligations et propriété intellectuelle définis.`,
    freelance:  `Mission freelance de ${c.duration_months ?? 12} mois pour ${c.amount ? fmtEur(c.amount) : "montant à définir"}. Statut indépendant précisé, limitant le risque de requalification.`,
    nda:        `Accord de confidentialité bilatéral. Durée des obligations et exclusions bien définies. Protection des informations sensibles assurée.`,
    partenariat:`Partenariat valorisé à ${c.amount ? fmtEur(c.amount) : "non défini"}. Gouvernance et modalités de partage nécessitent validation juridique.`,
    saas:       `Abonnement SaaS de ${c.amount ? fmtEur(c.amount) : "non défini"}/an. Clauses SLA et RGPD présentes mais à détailler selon volume de données.`,
    cdi:        `CDI avec rémunération annuelle de ${c.amount ? fmtEur(c.amount) : "non défini"}. Période d'essai et clauses sociales conformes au Code du travail.`,
  };
  const summary = summaries[c.contract_type] ??
    `Contrat de type ${TYPE_MAP[c.contract_type]} pour ${c.client_name}. Valeur : ${c.amount ? fmtEur(c.amount) : "non défini"}.`;

  const risks: string[] = [];
  if (!c.amount) risks.push("Montant non défini — risque de litige sur la rémunération");
  if (!c.end_date) risks.push("Date de fin non précisée — ambiguïté sur la durée d'engagement");
  if (c.contract_type === "partenariat") risks.push("Pas de clause de sortie visible — prévoir dissolution");
  if (c.contract_type === "saas") risks.push("Vérifier conformité DPA avec sous-traitants européens");
  if ((c.amount ?? 0) > 50000) risks.push("Montant élevé — recommande validation par un juriste");
  if (!c.specific_clauses && !c.content.includes("Article")) risks.push("Contenu incomplet — articles manquants");
  if (risks.length === 0) risks.push("Aucun risque majeur détecté — contrat bien structuré");

  const suggestions = [
    "Faire signer avec horodatage certifié pour valeur probante maximale",
    c.amount && c.amount > 5000 ? "Prévoir acompte 30% à la signature" : "Définir les jalons de paiement",
    "Ajouter clause de médiation avant tout recours judiciaire",
    c.contract_type === "saas" ? "Joindre un DPA (Data Processing Agreement) en annexe" : "Préciser les livrables attendus avec dates",
    "Conserver une copie signée dans un coffre-fort électronique",
  ];

  const compliance = [
    { label: "Parties identifiées",        ok: !!(c.client_name && c.client_email) },
    { label: "Objet du contrat défini",     ok: c.content.length > 100 },
    { label: "Montant précisé",             ok: !!c.amount },
    { label: "Durée déterminée",            ok: !!c.end_date },
    { label: "Juridiction définie",         ok: !!(c.jurisdiction || c.content.includes("droit")) },
    { label: "Clause de confidentialité",   ok: c.content.toLowerCase().includes("confidenti") },
    { label: "Conformité RGPD",             ok: c.contract_type === "saas" || c.content.toLowerCase().includes("données") },
    { label: "Signature prévue",            ok: true },
  ];

  const score = Math.round((compliance.filter((x) => x.ok).length / compliance.length) * 100);
  return { score, summary, risks, suggestions, compliance };
}

// ─────────────────────────── TEMPLATE GENERATOR ───────────────────────────

function buildContractText(f: DraftForm): string {
  const today = new Date().toLocaleDateString("fr-FR");
  const clauses = [...f.selected_clauses, ...(f.specifics ? [f.specifics] : [])];
  const clauseText = clauses.length ? clauses.map((c) => `• ${c}`).join("\n") : "Aucune clause spécifique ajoutée.";

  const header = `${f.title.toUpperCase()}
═══════════════════════════════════════════════════

Entre les soussignés :

LE PRESTATAIRE / PARTIE A
Représenté par l'utilisateur de la plateforme Djama

${f.client_company ? `LE CLIENT / PARTIE B\nSociété : ${f.client_company}\n` : "LE CLIENT / PARTIE B\n"}Représentant : ${f.client_name}${f.client_email ? `\nEmail : ${f.client_email}` : ""}

Ci-après dénommés ensemble « les Parties ».

───────────────────────────────────────────────────
ARTICLE 1 – OBJET
───────────────────────────────────────────────────
Le présent contrat a pour objet : « ${f.title} ».

───────────────────────────────────────────────────
ARTICLE 2 – DURÉE
───────────────────────────────────────────────────
Durée : ${f.duration_months} mois${f.start_date ? `, du ${f.start_date}` : ""}${f.end_date ? ` au ${f.end_date}` : ""}.

───────────────────────────────────────────────────
ARTICLE 3 – CONDITIONS FINANCIÈRES
───────────────────────────────────────────────────
Montant : ${f.amount ? parseFloat(f.amount).toLocaleString("fr-FR") : "À définir"} ${f.currency} HT
Paiement : virement bancaire sous 30 jours à réception de facture.

───────────────────────────────────────────────────
ARTICLE 4 – OBLIGATIONS DES PARTIES
───────────────────────────────────────────────────
Partie A : réaliser la mission avec diligence, respecter les délais, informer de tout obstacle.
Partie B : fournir les éléments nécessaires, régler les factures, désigner un interlocuteur.

───────────────────────────────────────────────────
ARTICLE 5 – CONFIDENTIALITÉ
───────────────────────────────────────────────────
Chaque Partie s'engage à maintenir la confidentialité de toutes les informations échangées pendant la durée du contrat et 3 ans après son expiration.

───────────────────────────────────────────────────
ARTICLE 6 – PROPRIÉTÉ INTELLECTUELLE
───────────────────────────────────────────────────
Les travaux réalisés dans le cadre de ce contrat seront la propriété exclusive du Client après règlement intégral des sommes dues.

───────────────────────────────────────────────────
ARTICLE 7 – RÉSILIATION
───────────────────────────────────────────────────
Résiliation possible en cas de manquement grave, après mise en demeure restée sans effet pendant 15 jours calendaires.

───────────────────────────────────────────────────
ARTICLE 8 – CLAUSES SPÉCIFIQUES
───────────────────────────────────────────────────
${clauseText}

───────────────────────────────────────────────────
ARTICLE 9 – LOI APPLICABLE
───────────────────────────────────────────────────
Le présent contrat est soumis au droit de : ${f.jurisdiction}.
En cas de litige, les Parties conviennent de rechercher une solution amiable avant tout recours judiciaire.

───────────────────────────────────────────────────
SIGNATURES
───────────────────────────────────────────────────
Fait le ${today}, en deux exemplaires originaux.

Partie A                               Partie B (${f.client_name})
_______________________                _______________________`;

  return header;
}

// ─────────────────────────── SUB-COMPONENTS ───────────────────────────

function StatusBadge({ status }: { status: ContractStatus }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.brouillon;
  return (
    <span className={`text-[10.5px] px-2 py-0.5 rounded-full border font-semibold ${s.text} ${s.bg} ${s.border}`}>
      {s.label}
    </span>
  );
}

function inp(extra = "") {
  return `w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.18] transition-colors ${extra}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">{children}</label>;
}

// ─────────────────────────── SIGNATURE MODAL ───────────────────────────

function SignModal({
  signer, contractTitle, onClose, onSign,
}: {
  signer: Signer; contractTitle: string; onClose: () => void; onSign: (sigData: string, cert: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [typedName, setTypedName] = useState("");
  const [mode, setMode] = useState<"draw" | "type">("draw");

  const startDraw = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (x: number, y: number) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#c9a55a";
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stopDraw = () => { isDrawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const confirm = () => {
    let sigData = "";
    if (mode === "draw") {
      sigData = canvasRef.current?.toDataURL() ?? "";
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 400; canvas.height = 120;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0a0f1e";
      ctx.fillRect(0, 0, 400, 120);
      ctx.font = "italic 42px Georgia, serif";
      ctx.fillStyle = "#c9a55a";
      ctx.textAlign = "center";
      ctx.fillText(typedName || signer.signer_name, 200, 70);
      sigData = canvas.toDataURL();
    }
    const now = new Date();
    const cert = `Certifié signé électroniquement le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")} par ${signer.signer_name} — Réf: ${signer.id.substring(0, 8).toUpperCase()}`;
    onSign(sigData, cert);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        className="w-full max-w-lg bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white/90">Signer électroniquement</h3>
            <p className="text-[11px] text-white/35 mt-0.5">{contractTitle} — {signer.signer_name}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {(["draw", "type"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${mode === m ? "border-transparent" : "border-white/10 text-white/40 hover:border-white/20"}`}
                style={mode === m ? { background: gold + "20", color: gold, border: `1px solid ${gold}40` } : {}}>
                {m === "draw" ? <><Pen size={12}/>Dessiner</> : <><Edit2 size={12}/>Taper mon nom</>}
              </button>
            ))}
          </div>
          {mode === "draw" ? (
            <div className="relative">
              <canvas ref={canvasRef} width={460} height={140}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl cursor-crosshair"
                style={{ touchAction: "none" }}
                onMouseDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); startDraw(e.clientX - r.left, e.clientY - r.top); }}
                onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); draw(e.clientX - r.left, e.clientY - r.top); }}
                onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; const r = e.currentTarget.getBoundingClientRect(); startDraw(t.clientX - r.left, t.clientY - r.top); }}
                onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; const r = e.currentTarget.getBoundingClientRect(); draw(t.clientX - r.left, t.clientY - r.top); }}
                onTouchEnd={stopDraw}
              />
              <p className="text-center text-[10px] text-white/25 mt-2">Signez dans la zone ci-dessus</p>
              <button onClick={clear} className="absolute top-2 right-2 text-[10px] text-white/30 hover:text-white/60 border border-white/10 rounded-lg px-2 py-1 transition-colors">Effacer</button>
            </div>
          ) : (
            <div>
              <input value={typedName} onChange={(e) => setTypedName(e.target.value)}
                placeholder={signer.signer_name}
                className={inp("font-serif italic text-base text-amber-300 placeholder:italic")}
                style={{ fontFamily: "Georgia, serif", color: gold }}/>
              <p className="text-[10px] text-white/25 mt-1.5 text-center">Votre nom en cursive fait office de signature électronique</p>
            </div>
          )}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[10px] text-white/40 leading-relaxed">
              <Shield size={10} className="inline mr-1 text-emerald-400"/>
              En confirmant, vous signez électroniquement ce contrat. Un certificat horodaté sera généré. Cette signature a valeur contractuelle.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">Annuler</button>
            <button onClick={confirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{ background: gold, color: "#0a0f1e" }}>
              <FileSignature size={15}/> Signer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── AI ANALYSIS MODAL ───────────────────────────

function AIModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReturnType<typeof analyzeContract> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setResult(analyzeContract(contract)); setLoading(false); }, 1400);
    return () => clearTimeout(t);
  }, [contract]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        className="w-full max-w-xl bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-white/[0.025]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <Brain size={14} style={{ color: gold }}/>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Analyse IA Juridique</h3>
              <p className="text-[11px] text-white/35">{contract.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                <Sparkles size={28} style={{ color: gold }}/>
              </motion.div>
              <div className="text-sm text-white/50">Analyse en cours…</div>
              <div className="text-[11px] text-white/25">Détection des risques · Conformité · Suggestions</div>
            </div>
          ) : result ? (
            <>
              {/* Score */}
              <div className="flex items-center gap-4 bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                    <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke={gold} strokeWidth="3"
                      strokeLinecap="round" strokeDasharray="100" initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - result.score }} transition={{ duration: 1.2, ease: "easeOut" }}/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: gold }}>{result.score}%</div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80">Score de conformité</p>
                  <p className="text-[11px] text-white/45 mt-1 leading-relaxed">{result.summary}</p>
                </div>
              </div>

              {/* Risks */}
              <div>
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertOctagon size={12} className="text-red-400"/> Risques détectés</h4>
                <div className="space-y-1.5">
                  {result.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2">
                      <AlertTriangle size={11} className="text-red-400 mt-0.5 shrink-0"/>
                      <span className="text-xs text-white/70">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Lightbulb size={12} style={{ color: gold }}/> Suggestions</h4>
                <div className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2 bg-white/[0.03] border border-white/[0.06]">
                      <Check size={11} className="text-emerald-400 mt-0.5 shrink-0"/>
                      <span className="text-xs text-white/70">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance */}
              <div>
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={12} className="text-emerald-400"/> Conformité</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {result.compliance.map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-xs ${item.ok ? "bg-emerald-500/5 border-emerald-500/10 text-white/70" : "bg-red-500/5 border-red-500/10 text-white/40"}`}>
                      {item.ok ? <CheckCircle size={11} className="text-emerald-400 shrink-0"/> : <XCircle size={11} className="text-red-400 shrink-0"/>}
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── CONTRACT CARD ───────────────────────────

function ContractCard({ contract, isSelected, onSelect, onDelete }: {
  contract: Contract; isSelected: boolean; onSelect: () => void; onDelete: (id: string) => void;
}) {
  const t = CONTRACT_TYPES.find((x) => x.value === contract.contract_type);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }} onClick={onSelect}
      className={`group relative flex flex-col gap-2 rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden
        ${isSelected ? "border-white/[0.14] bg-white/[0.025]" : "border-white/[0.06] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"}`}>
      <div className="h-[2px] w-full" style={{ background: isSelected ? `linear-gradient(90deg, ${gold}80, transparent)` : "transparent" }}/>
      <div className="px-4 pb-4 pt-2">
        {isSelected && <div className="absolute left-0 top-6 bottom-3 w-[2px] rounded-full" style={{ backgroundColor: gold }}/>}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white/90 truncate">{contract.title}</p>
            <p className="text-xs text-white/45 truncate">{contract.client_name}{contract.client_company ? ` · ${contract.client_company}` : ""}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={contract.status}/>
            <button onClick={(e) => { e.stopPropagation(); onDelete(contract.id); }}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
              <Trash2 size={11}/>
            </button>
            <ChevronRight size={13} className="text-white/20"/>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] px-2 py-0.5 rounded-full border font-medium"
            style={{ color: gold + "cc", borderColor: gold + "30", background: gold + "0d" }}>
            {t?.label ?? contract.contract_type}
          </span>
          {contract.amount != null && (
            <span className="text-xs text-white/35">{fmtEur(contract.amount)}</span>
          )}
          <span className="text-xs text-white/20 ml-auto">
            {new Date(contract.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────── DASHBOARD VIEW ───────────────────────────

function DashboardView({ contracts, onNew, onSelect }: {
  contracts: Contract[]; onNew: () => void; onSelect: (c: Contract) => void;
}) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const actifs = contracts.filter((c) => c.status === "actif" || c.status === "signé").length;
  const enAttente = contracts.filter((c) => c.status === "envoyé" || c.status === "vu").length;
  const expirentBientot = contracts.filter((c) => c.expires_at && new Date(c.expires_at) <= in30 && c.status !== "expiré" && c.status !== "signé" && c.status !== "actif").length;
  const signesMois = contracts.filter((c) => c.status === "signé" && c.created_at && new Date(c.created_at) >= startOfMonth).length;
  const valeurTotale = contracts.filter((c) => c.status === "actif" || c.status === "signé").reduce((s, c) => s + (c.amount ?? 0), 0);
  const brouillons = contracts.filter((c) => c.status === "brouillon").length;

  const kpis = [
    { label: "Contrats actifs",     value: actifs,            icon: Star,          color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "En attente signature",value: enAttente,         icon: Clock,         color: "text-sky-400",     bg: "bg-sky-500/10" },
    { label: "Expirent bientôt",    value: expirentBientot,   icon: AlertTriangle, color: "text-orange-400",  bg: "bg-orange-500/10" },
    { label: "Signés ce mois",      value: signesMois,        icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Valeur totale",       value: fmtEur(valeurTotale), icon: DollarSign, color: "text-amber-400",   bg: "bg-amber-500/10", isStr: true },
    { label: "Brouillons IA",       value: brouillons,        icon: FileText,      color: "text-purple-400",  bg: "bg-purple-500/10" },
  ];

  const pipeline: ContractStatus[] = ["brouillon", "validation", "envoyé", "vu", "signé", "actif"];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 flex flex-col gap-2">
            <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon size={15} className={k.color}/>
            </div>
            <div>
              <div className={`text-xl font-bold ${k.isStr ? "text-base" : ""} text-white/90`}>
                {k.isStr ? k.value : k.value}
              </div>
              <div className="text-[10px] text-white/35 mt-0.5">{k.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Pipeline des contrats</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {pipeline.map((stage) => {
            const stageContracts = contracts.filter((c) => c.status === stage);
            const s = STATUS_CFG[stage];
            return (
              <div key={stage} className="min-w-[180px] flex-1 bg-white/[0.025] rounded-2xl border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>{stageContracts.length}</span>
                </div>
                <div className="space-y-1.5">
                  {stageContracts.slice(0, 3).map((c) => (
                    <button key={c.id} onClick={() => onSelect(c)}
                      className="w-full text-left bg-white/[0.03] rounded-xl px-2.5 py-2 hover:bg-white/[0.06] transition-colors">
                      <p className="text-xs font-semibold text-white/80 truncate">{c.title}</p>
                      <p className="text-[10px] text-white/35 truncate">{c.client_name}</p>
                    </button>
                  ))}
                  {stageContracts.length === 0 && <p className="text-[10px] text-white/20 text-center py-2">Aucun contrat</p>}
                  {stageContracts.length > 3 && <p className="text-[10px] text-white/30 text-center">+{stageContracts.length - 3} autres</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming deadlines */}
      {contracts.filter((c) => c.expires_at && new Date(c.expires_at) <= in30 && c.status !== "expiré").length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5">
            <Calendar size={12} className="text-orange-400"/> Échéances dans 30 jours
          </h3>
          <div className="space-y-2">
            {contracts.filter((c) => c.expires_at && new Date(c.expires_at) <= in30 && c.status !== "expiré").map((c) => (
              <button key={c.id} onClick={() => onSelect(c)}
                className="w-full flex items-center justify-between bg-orange-500/5 border border-orange-500/10 rounded-xl px-4 py-3 hover:bg-orange-500/10 transition-colors text-left">
                <div>
                  <p className="text-sm font-semibold text-white/80">{c.title}</p>
                  <p className="text-xs text-white/40">{c.client_name}</p>
                </div>
                <div className="text-xs text-orange-400 font-semibold shrink-0">{fmtDate(c.expires_at ?? null)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {contracts.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
            <FileText size={24} style={{ color: gold }}/>
          </div>
          <p className="text-white/50 text-sm">Aucun contrat — créez votre premier</p>
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
            <Plus size={13}/> Créer un contrat
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── DETAIL PANEL ───────────────────────────

function DetailPanel({
  contract, signers, activities, comments,
  editContent, saving, onContentChange, onStatusChange,
  onDownloadPDF, onViewPDF, onSendToClient, onToFacture,
  onCopy, copied, userId, userName,
  onAddSigner, onDeleteSigner, onSignContract,
  onAddComment, onShowAI,
  onClose,
}: {
  contract: Contract; signers: Signer[]; activities: CActivity[]; comments: CComment[];
  editContent: string; saving: boolean; onContentChange: (v: string) => void;
  onStatusChange: (s: ContractStatus) => void;
  onDownloadPDF: () => void; onViewPDF: () => void; onSendToClient: () => void; onToFacture: () => void;
  onCopy: () => void; copied: boolean; userId: string | null; userName: string;
  onAddSigner: (name: string, email: string, role: string) => void;
  onDeleteSigner: (id: string) => void; onSignContract: (signer: Signer) => void;
  onAddComment: (text: string) => void; onShowAI: () => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<"content" | "signers" | "ai" | "activity">("content");
  const [signerForm, setSignerForm] = useState({ name: "", email: "", role: "signataire" });
  const [commentText, setCommentText] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const t = CONTRACT_TYPES.find((x) => x.value === contract.contract_type);

  const allTimeline = [
    ...activities.map((a) => ({ type: "activity" as const, date: a.created_at, text: a.action, detail: a.details })),
    ...comments.map((c) => ({ type: "comment" as const, date: c.created_at, text: c.author_name || "Vous", detail: c.content })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabs = [
    { key: "content",  label: "Contenu",     icon: FileText },
    { key: "signers",  label: "Signataires", icon: Users },
    { key: "ai",       label: "IA Juridique",icon: Brain },
    { key: "activity", label: "Activité",    icon: Activity },
  ] as const;

  return (
    <motion.div key="detail" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.4, ease }}
      className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.06] gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <button onClick={onClose} className="md:hidden rounded-lg p-1 text-white/40 hover:text-white/70 transition-colors"><X size={15}/></button>
            <span className="text-[10.5px] px-2.5 py-0.5 rounded-full border font-bold"
              style={{ color: gold, borderColor: gold + "35", background: gold + "12" }}>
              {t?.label}
            </span>
            <div className="relative">
              <button onClick={() => setShowStatusMenu((v) => !v)}
                className={`flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border font-semibold transition-all ${STATUS_CFG[contract.status].text} ${STATUS_CFG[contract.status].bg} ${STATUS_CFG[contract.status].border}`}>
                {STATUS_CFG[contract.status].label} <ChevronDown size={10}/>
              </button>
              <AnimatePresence>
                {showStatusMenu && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full left-0 mt-1 z-20 bg-white/[0.025] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl min-w-[140px]">
                    {STATUS_FLOW.concat(["refusé", "expiré"] as ContractStatus[]).map((s) => (
                      <button key={s} onClick={() => { onStatusChange(s); setShowStatusMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-white/[0.05] transition-colors ${STATUS_CFG[s].text}`}>
                        {STATUS_CFG[s].label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <h2 className="text-[15px] font-semibold text-white/90 truncate">{contract.title}</h2>
          <p className="mt-0.5 text-xs text-white/45">
            {contract.client_name}
            {contract.client_company && <> · {contract.client_company}</>}
            {contract.amount != null && <span className="text-white/60 font-semibold"> · {fmtEur(contract.amount)}</span>}
            {contract.start_date && <> · {fmtDate(contract.start_date)}</>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {saving && <RefreshCw size={13} className="animate-spin text-white/25"/>}
          <button onClick={onCopy} className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all">
            {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} className="text-white/45"/>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] px-5 gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${tab === key ? "border-b-2 text-white/90" : "border-transparent text-white/35 hover:text-white/60"}`}
            style={tab === key ? { borderBottomColor: gold, color: gold } : {}}>
            <Icon size={12}/> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* CONTENT TAB */}
        {tab === "content" && (
          <>
            <div className="flex items-center gap-2 px-5 py-2 border-b border-white/[0.06] bg-white/[0.015] flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/20 mr-1">PDF</span>
              {[
                { label: "Aperçu", icon: Eye, onClick: onViewPDF },
                { label: "Télécharger", icon: Download, onClick: onDownloadPDF, gold: true },
                { label: "Envoyer", icon: Send, onClick: onSendToClient },
              ].map(({ label, icon: Icon, onClick, gold: isGold }) => (
                <motion.button key={label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isGold ? "" : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07]"}`}
                  style={isGold ? { background: gold + "18", color: gold, border: `1px solid ${gold}35` } : {}}>
                  <Icon size={11}/> {label}
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onToFacture}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.07] transition-all">
                <Receipt size={11}/> Facture
              </motion.button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {/* Validation checkboxes */}
              {(contract.validation_manager != null || contract.validation_legal != null) && (
                <div className="flex gap-3 mb-4 flex-wrap">
                  {[
                    { label: "Manager", val: contract.validation_manager },
                    { label: "Juridique", val: contract.validation_legal },
                    { label: "Finance", val: contract.validation_finance },
                  ].map(({ label, val }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${val ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.03] border-white/10 text-white/35"}`}>
                      {val ? <CheckCircle size={11}/> : <Clock size={11}/>} {label}
                    </div>
                  ))}
                </div>
              )}
              <textarea value={editContent} onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-full min-h-[360px] bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 font-mono text-sm text-white/80 leading-relaxed resize-none focus:outline-none focus:border-white/15 focus:bg-white/[0.04] transition-colors placeholder:text-white/20"
                placeholder="Le contenu du contrat apparaît ici. Utilisez « Générer avec l'IA » pour rédiger automatiquement."/>
            </div>
          </>
        )}

        {/* SIGNERS TAB */}
        {tab === "signers" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {signers.length > 0 ? (
              <div className="space-y-2">
                {signers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.05] text-sm font-bold text-white/60">
                      {s.signer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80">{s.signer_name}</p>
                      <p className="text-xs text-white/40">{s.signer_email} · {s.signer_role}</p>
                      {s.certificate && <p className="text-[10px] text-emerald-400 mt-1">{s.certificate}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.status === "signed" ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11}/> Signé</span>
                      ) : (
                        <>
                          <button onClick={() => onSignContract(s)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                            style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                            <Pen size={11}/> Signer
                          </button>
                          <button onClick={() => onDeleteSigner(s.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                            <Trash2 size={12}/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-white/30 text-sm">Aucun signataire ajouté</div>
            )}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-white/60">+ Ajouter un signataire</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={signerForm.name} onChange={(e) => setSignerForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nom complet" className={inp()}/>
                <input value={signerForm.email} onChange={(e) => setSignerForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email" type="email" className={inp()}/>
              </div>
              <select value={signerForm.role} onChange={(e) => setSignerForm((p) => ({ ...p, role: e.target.value }))}
                className={inp("appearance-none")}>
                <option value="signataire">Signataire</option>
                <option value="validateur">Validateur</option>
                <option value="témoin">Témoin</option>
              </select>
              <button onClick={() => { if (signerForm.name) { onAddSigner(signerForm.name, signerForm.email, signerForm.role); setSignerForm({ name: "", email: "", role: "signataire" }); }}}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                <Plus size={13} className="inline mr-1.5"/> Ajouter
              </button>
            </div>
          </div>
        )}

        {/* AI TAB */}
        {tab === "ai" && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center gap-4">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
              <Brain size={24} style={{ color: gold }}/>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white/80">Analyse IA Juridique</p>
              <p className="text-xs text-white/40 mt-1.5 max-w-[260px] leading-relaxed">
                Détection des risques, score de conformité, suggestions d'amélioration et vérification RGPD.
              </p>
            </div>
            <button onClick={onShowAI}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: gold, color: "#0a0f1e", boxShadow: `0 4px 16px ${gold}40` }}>
              <Sparkles size={15}/> Analyser le contrat
            </button>
            {contract.ai_summary && (
              <div className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <p className="text-xs font-bold text-white/50 mb-2">Dernière analyse</p>
                <p className="text-xs text-white/70 leading-relaxed">{contract.ai_summary}</p>
                {contract.ai_risks && <p className="text-xs text-red-400 mt-2 leading-relaxed">{contract.ai_risks}</p>}
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {tab === "activity" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {allTimeline.length === 0 && <p className="text-center text-white/30 text-sm py-8">Aucune activité</p>}
              {allTimeline.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-0.5 h-6 w-6 flex items-center justify-center rounded-full shrink-0 ${item.type === "comment" ? "bg-blue-500/20" : "bg-white/[0.06]"}`}>
                    {item.type === "comment" ? <MessageSquare size={10} className="text-blue-400"/> : <Activity size={10} className="text-white/40"/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-white/70">{item.text}</span>
                      <span className="text-[10px] text-white/25">{fmtDate(item.date)}</span>
                    </div>
                    {item.detail && <p className="text-xs text-white/45 mt-0.5">{item.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.06] p-4 flex gap-2">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) { onAddComment(commentText.trim()); setCommentText(""); }}}
                placeholder="Ajouter un commentaire… (Entrée pour envoyer)"
                className={inp("flex-1")}/>
              <button onClick={() => { if (commentText.trim()) { onAddComment(commentText.trim()); setCommentText(""); }}}
                className="h-[42px] w-[42px] flex items-center justify-center rounded-xl shrink-0 transition-all"
                style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                <Send size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────── CREATE MODAL ───────────────────────────

function CreateModal({
  onClose, onGenerate, onCreateBlank, generating, creating,
}: {
  onClose: () => void;
  onGenerate: (f: DraftForm) => void;
  onCreateBlank: (f: DraftForm) => void;
  generating: boolean; creating: boolean;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM());
  const set = (k: keyof DraftForm, v: string | string[]) => setForm((p) => ({ ...p, [k]: v }));

  const toggleClause = (c: string) => {
    set("selected_clauses", form.selected_clauses.includes(c)
      ? form.selected_clauses.filter((x) => x !== c)
      : [...form.selected_clauses, c]);
  };

  const canNext = step === 1 ? !!form.type
    : step === 2 ? !!(form.title && form.client_name)
    : true;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.4, ease }}
        className="w-full max-w-lg bg-white/[0.025] border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <FileText size={14} style={{ color: gold }}/>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Nouveau contrat IA</h3>
              <p className="text-[10px] text-white/30">Étape {step} / 3</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"><X size={14}/></button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: s <= step ? gold : "rgba(255,255,255,0.08)" }}/>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Step 1: Type */}
          {step === 1 && (
            <div>
              <p className="text-sm font-bold text-white/70 mb-4">Quel type de contrat ?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONTRACT_TYPES.map((t) => {
                  const TIcon = t.icon;
                  return (
                  <button key={t.value} onClick={() => set("type", t.value)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all ${form.type === t.value ? "border-transparent" : "border-white/[0.06] hover:border-white/[0.14] bg-white/[0.025]"}`}
                    style={form.type === t.value ? { background: gold + "14", border: `1px solid ${gold}40` } : {}}>
                    <TIcon size={18} className="text-white/50 mb-0.5"/>
                    <span className="text-xs font-bold text-white/80">{t.label}</span>
                    <span className="text-[10px] text-white/35">{t.desc}</span>
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-3">
              <div><Label>Intitulé *</Label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Mission développement web" className={inp()}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Client *</Label>
                  <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Nom du client" className={inp()}/>
                </div>
                <div><Label>Société</Label>
                  <input value={form.client_company} onChange={(e) => set("client_company", e.target.value)} placeholder="Entreprise" className={inp()}/>
                </div>
              </div>
              <div><Label>Email client</Label>
                <input type="email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} placeholder="client@email.com" className={inp()}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Montant</Label>
                  <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="5000" className={inp()}/>
                </div>
                <div><Label>Devise</Label>
                  <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inp("appearance-none")}>
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Durée (mois)</Label>
                  <input type="number" value={form.duration_months} onChange={(e) => set("duration_months", e.target.value)} placeholder="12" className={inp()}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Début</Label>
                  <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inp()}/>
                </div>
                <div><Label>Fin</Label>
                  <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inp()}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Juridiction</Label>
                  <select value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} className={inp("appearance-none")}>
                    {JURISDICTIONS.map((j) => <option key={j}>{j}</option>)}
                  </select>
                </div>
                <div><Label>Langue</Label>
                  <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inp("appearance-none")}>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Clauses */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-white/60 mb-2">Clauses suggérées pour {TYPE_MAP[form.type]}</p>
                <div className="space-y-1.5">
                  {SUGGESTED_CLAUSES[form.type].map((clause) => (
                    <button key={clause} onClick={() => toggleClause(clause)}
                      className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${form.selected_clauses.includes(clause) ? "border-transparent" : "border-white/[0.06] text-white/50 hover:border-white/[0.14]"}`}
                      style={form.selected_clauses.includes(clause) ? { background: gold + "12", border: `1px solid ${gold}35`, color: gold } : {}}>
                      <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${form.selected_clauses.includes(clause) ? "" : "border-white/20"}`}
                        style={form.selected_clauses.includes(clause) ? { background: gold, border: "none" } : {}}>
                        {form.selected_clauses.includes(clause) && <Check size={9} color="#0a0f1e"/>}
                      </div>
                      {clause}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Clauses supplémentaires (optionnel)</Label>
                <textarea value={form.specifics} onChange={(e) => set("specifics", e.target.value)}
                  placeholder="Autres conditions spécifiques à votre contrat…"
                  rows={3} className={inp("resize-none")}/>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors">
              <ChevronLeft size={14} className="inline-block"/>Retour
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: gold, color: "#0a0f1e" }}>
              Suivant <ChevronRight size={14} className="inline-block"/>
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onGenerate(form)} disabled={generating || creating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                style={{ background: gold, color: "#0a0f1e", boxShadow: `0 4px 16px ${gold}40` }}>
                {generating ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles size={15}/></motion.div>Génération…</> : <><Sparkles size={15}/> Générer IA</>}
              </motion.button>
              <button onClick={() => onCreateBlank(form)} disabled={generating || creating}
                className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.04] transition-colors disabled:opacity-40">
                {creating ? <RefreshCw size={13} className="animate-spin"/> : "Vide"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────── MAIN PAGE ───────────────────────────

export default function ContratsPage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userName, setUserName] = useState("");

  const [view, setView] = useState<"list" | "dashboard">("list");
  const [selected, setSelected] = useState<Contract | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [activities, setActivities] = useState<CActivity[]>([]);
  const [comments, setComments] = useState<CComment[]>([]);

  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">("all");
  const [filterType, setFilterType] = useState<ContractType | "all">("all");

  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [signerToSign, setSignerToSign] = useState<Signer | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  // Load contracts
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? undefined);
      const meta = user.user_metadata as Record<string, string> | undefined;
      setUserName(meta?.full_name ?? meta?.name ?? "");

      const { data, error } = await supabase.from("contracts").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
      if (!error && data) setContracts(data as Contract[]);
      setLoading(false);
    })();
  }, []);

  // Load detail data when contract selected
  useEffect(() => {
    if (!selected || !userId) return;
    setEditContent(selected.content ?? "");
    setSigners([]);
    setActivities([]);
    setComments([]);
    Promise.all([
      supabase.from("contract_signatures").select("*").eq("contract_id", selected.id).eq("user_id", userId).order("order_index"),
      supabase.from("contract_activities").select("*").eq("contract_id", selected.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("contract_comments").select("*").eq("contract_id", selected.id).eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    ]).then(([sigRes, actRes, comRes]) => {
      if (!sigRes.error && sigRes.data) setSigners(sigRes.data as Signer[]);
      if (!actRes.error && actRes.data) setActivities(actRes.data as CActivity[]);
      if (!comRes.error && comRes.data) setComments(comRes.data as CComment[]);
    });
  }, [selected?.id, userId]);

  const logActivity = useCallback(async (contractId: string, action: string, details = "") => {
    if (!userId) return;
    const { data } = await supabase.from("contract_activities").insert({ contract_id: contractId, user_id: userId, action, details }).select().single();
    if (data) setActivities((prev) => [data as CActivity, ...prev]);
  }, [userId]);

  const selectContract = useCallback((c: Contract) => { setSelected(c); }, []);

  // Auto-save
  const handleContentChange = useCallback((value: string) => {
    setEditContent(value);
    if (!selected) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase.from("contracts").update({ content: value }).eq("id", selected.id);
      setSaving(false);
      if (!error) {
        setContracts((prev) => prev.map((c) => c.id === selected.id ? { ...c, content: value } : c));
        setSelected((prev) => prev ? { ...prev, content: value } : prev);
      }
    }, 2000);
  }, [selected]);

  const handleStatusChange = useCallback(async (newStatus: ContractStatus) => {
    if (!selected) return;
    const { error } = await supabase.from("contracts").update({ status: newStatus }).eq("id", selected.id);
    if (!error) {
      setContracts((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: newStatus } : c));
      setSelected((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast(`Statut : ${STATUS_CFG[newStatus].label}`, "success");
      await logActivity(selected.id, "status_changed", `→ ${STATUS_CFG[newStatus].label}`);
    }
  }, [selected, toast, logActivity]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(editContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Copié !", "success");
  }, [editContent, toast]);

  const getPDFData = useCallback(() => {
    if (!selected) return null;
    return {
      title: selected.title, client_name: selected.client_name,
      type: selected.contract_type, content: editContent,
      amount: selected.amount, start_date: selected.start_date,
      end_date: selected.end_date, created_at: selected.created_at,
      prestataire_nom: userName, prestataire_email: userEmail,
    };
  }, [selected, editContent, userName, userEmail]);

  const handleDownloadPDF = useCallback(() => {
    const data = getPDFData();
    if (!data) return;
    if (!data.content.trim()) { toast("Contrat vide — ajoutez du contenu d'abord", "error"); return; }
    try { downloadContractPDF(data); toast("PDF téléchargé", "success"); }
    catch (e) { console.error(e); toast("Erreur PDF", "error"); }
  }, [getPDFData, toast]);

  const handleViewPDF = useCallback(() => {
    const data = getPDFData();
    if (!data) return;
    if (!data.content.trim()) { toast("Contrat vide", "error"); return; }
    try { openContractPDF(data); }
    catch (e) { console.error(e); toast("Erreur PDF", "error"); }
  }, [getPDFData, toast]);

  const handleSendToClient = useCallback(() => {
    if (!selected) return;
    const subject = encodeURIComponent(`Contrat : ${selected.title}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver en pièce jointe le contrat « ${selected.title} ».\n\nCordialement`);
    window.open(`mailto:${selected.client_email ?? ""}?subject=${subject}&body=${body}`, "_blank");
    toast("Téléchargez le PDF puis joignez-le à votre email", "info");
  }, [selected, toast]);

  const handleToFacture = useCallback(() => {
    if (!selected) return;
    const params = new URLSearchParams({ from: "contrat", title: selected.title, client: selected.client_name, ...(selected.amount != null ? { amount: String(selected.amount) } : {}) });
    window.location.href = `/client/factures?${params}`;
  }, [selected]);

  const handleCreateContract = useCallback(async (form: DraftForm, generatedContent = "") => {
    if (!form.title || !form.client_name) { toast("Titre et client requis", "error"); return; }
    if (!userId) return;
    setCreating(true);
    try {
      const payload = {
        user_id: userId, title: form.title, client_name: form.client_name,
        client_email: form.client_email, client_company: form.client_company,
        contract_type: form.type, content: generatedContent, status: "brouillon",
        amount: form.amount ? parseFloat(form.amount) : null,
        currency: form.currency, duration_months: parseInt(form.duration_months) || 12,
        start_date: form.start_date || null, end_date: form.end_date || null,
        jurisdiction: form.jurisdiction, language: form.language,
        specific_clauses: [...form.selected_clauses, form.specifics].filter(Boolean).join("\n"),
      };
      const { data, error } = await supabase.from("contracts").insert(payload).select().single();
      if (error) throw new Error(error.message);
      const newC = data as Contract;
      setContracts((prev) => [newC, ...prev]);
      setShowModal(false);
      selectContract(newC);
      toast(generatedContent ? "Contrat généré" : "Brouillon créé", "success");
      await logActivity(newC.id, "created", `Type : ${TYPE_MAP[form.type]}`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erreur création", "error");
    } finally { setCreating(false); }
  }, [userId, toast, selectContract, logActivity]);

  const handleGenerate = useCallback(async (form: DraftForm) => {
    if (!form.title || !form.client_name) { toast("Titre et client requis", "error"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/contrats/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, client_name: form.client_name, title: form.title,
          amount: form.amount ? parseFloat(form.amount) : undefined,
          start_date: form.start_date || undefined, end_date: form.end_date || undefined,
          specifics: [...form.selected_clauses, form.specifics].filter(Boolean).join("; ") || undefined,
          prestataire_nom: userName }),
      });
      const json = await res.json() as { content?: string; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Erreur de génération");
      await handleCreateContract(form, json.content ?? "");
    } catch (err: unknown) {
      // Fallback to template if API unavailable
      const templateContent = buildContractText(form);
      await handleCreateContract(form, templateContent);
    } finally { setGenerating(false); }
  }, [toast, handleCreateContract, userName]);

  const handleAddSigner = useCallback(async (name: string, email: string, role: string) => {
    if (!selected || !userId) return;
    const { data, error } = await supabase.from("contract_signatures").insert({
      contract_id: selected.id, user_id: userId,
      signer_name: name, signer_email: email, signer_role: role,
      order_index: signers.length, status: "pending",
    }).select().single();
    if (!error && data) {
      setSigners((prev) => [...prev, data as Signer]);
      toast("Signataire ajouté", "success");
      await logActivity(selected.id, "signer_added", `${name} (${role})`);
    }
  }, [selected, userId, signers.length, toast, logActivity]);

  const handleDeleteSigner = useCallback(async (id: string) => {
    await supabase.from("contract_signatures").delete().eq("id", id);
    setSigners((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSignContract = useCallback(async (sigData: string, cert: string) => {
    if (!signerToSign || !selected) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("contract_signatures").update({
      status: "signed", signed_at: now, signature_data: sigData, certificate: cert,
    }).eq("id", signerToSign.id);
    if (!error) {
      setSigners((prev) => prev.map((s) => s.id === signerToSign.id ? { ...s, status: "signed", signed_at: now, signature_data: sigData, certificate: cert } : s));
      toast("Contrat signé", "success");
      await logActivity(selected.id, "signed", `Signé par ${signerToSign.signer_name}`);
      const allSigned = signers.every((s) => s.id === signerToSign.id || s.status === "signed");
      if (allSigned) await handleStatusChange("signé");
    }
    setSignerToSign(null);
  }, [signerToSign, selected, signers, toast, logActivity, handleStatusChange]);

  const handleAddComment = useCallback(async (text: string) => {
    if (!selected || !userId) return;
    const { data, error } = await supabase.from("contract_comments").insert({
      contract_id: selected.id, user_id: userId, author_name: userName || "Vous", content: text,
    }).select().single();
    if (!error && data) {
      setComments((prev) => [data as CComment, ...prev]);
      await logActivity(selected.id, "commented", text.substring(0, 60));
    }
  }, [selected, userId, userName, logActivity]);

  const handleDelete = useCallback((id: string) => { setConfirmDeleteId(id); }, []);
  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("contracts").delete().eq("id", confirmDeleteId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (!error) {
      setContracts((prev) => prev.filter((c) => c.id !== confirmDeleteId));
      if (selected?.id === confirmDeleteId) setSelected(null);
      toast("Contrat supprimé", "info");
    } else { toast("Erreur suppression", "error"); }
  }, [confirmDeleteId, selected, toast]);

  const exportCSV = useCallback(() => {
    const rows = [["Titre","Client","Société","Type","Statut","Montant","Début","Fin"].join(";"),
      ...contracts.map((c) => [c.title,c.client_name,c.client_company,TYPE_MAP[c.contract_type],STATUS_CFG[c.status].label,c.amount??0,c.start_date??"",c.end_date??""].join(";"))];
    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "contrats.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [contracts]);

  const filtered = contracts.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterType !== "all" && c.contract_type !== filterType) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.client_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <ToastStack toasts={toasts} remove={removeToast}/>

      {/* Sub-header */}
      <div className="border-b border-white/[0.06] bg-white/[0.025] px-5 py-4 backdrop-blur-xl sm:px-8 sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
              <FileText size={16} style={{ color: gold }}/>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Contrats IA</h1>
              <p className="text-[0.65rem] text-white/30">Génération · Signature · Suivi juridique</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-xl border border-white/[0.07] overflow-hidden">
              {(["list", "dashboard"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-all ${view === v ? "text-[#0a0f1e]" : "text-white/40 hover:text-white/60"}`}
                  style={view === v ? { background: gold } : {}}>
                  {v === "list" ? "Liste" : "Dashboard"}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all" title="Exporter CSV">
              <Download size={14}/>
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-[#0a0f1e] transition-all hover:opacity-90"
              style={{ background: gold, boxShadow: `0 4px 16px ${gold}40` }}>
              <Plus size={13}/> Nouveau
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {view === "dashboard" ? (
        <DashboardView contracts={contracts} onNew={() => setShowModal(true)} onSelect={(c) => { setView("list"); selectContract(c); }}/>
      ) : (
        <div className="flex h-[calc(100vh-73px)]">
          {/* Left: list */}
          <div className={`flex flex-col border-r border-white/[0.06] overflow-hidden ${selected ? "hidden md:flex md:w-[340px] lg:w-[380px]" : "flex w-full md:w-[340px] lg:w-[380px]"}`}>
            {/* Filters */}
            <div className="p-3 border-b border-white/[0.06] space-y-2">
              <div className="relative">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/[0.18] transition-colors pl-8"/>
                <Eye size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"/>
              </div>
              <div className="flex gap-2">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ContractStatus | "all")}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white/70 focus:outline-none appearance-none">
                  <option value="all">Tous statuts</option>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as ContractType | "all")}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2 py-1.5 text-xs text-white/70 focus:outline-none appearance-none">
                  <option value="all">Tous types</option>
                  {CONTRACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-32"><RefreshCw size={20} className="animate-spin text-white/30"/></div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="h-16 w-16 flex items-center justify-center rounded-2xl" style={{ background: gold + "15", border: `1px solid ${gold}30` }}>
                    <FileText size={28} style={{ color: gold }}/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/80">Aucun contrat</p>
                    <p className="text-xs text-white/35 mt-1.5 max-w-[200px] leading-relaxed">Créez votre premier contrat et laissez l'IA le rédiger en quelques secondes.</p>
                  </div>
                  <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: gold + "20", color: gold, border: `1px solid ${gold}40` }}>
                    <Sparkles size={13}/> Générer un contrat
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map((c) => (
                    <ContractCard key={c.id} contract={c} isSelected={selected?.id === c.id}
                      onSelect={() => selectContract(c)} onDelete={handleDelete}/>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right: detail */}
          <AnimatePresence>
            {selected ? (
              <DetailPanel
                contract={selected} signers={signers} activities={activities} comments={comments}
                editContent={editContent} saving={saving} onContentChange={handleContentChange}
                onStatusChange={handleStatusChange} onDownloadPDF={handleDownloadPDF}
                onViewPDF={handleViewPDF} onSendToClient={handleSendToClient} onToFacture={handleToFacture}
                onCopy={handleCopy} copied={copied} userId={userId} userName={userName}
                onAddSigner={handleAddSigner} onDeleteSigner={handleDeleteSigner}
                onSignContract={(signer) => setSignerToSign(signer)}
                onAddComment={handleAddComment} onShowAI={() => setShowAIModal(true)}
                onClose={() => setSelected(null)}
              />
            ) : (
              contracts.length > 0 && (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 50% 35% at 50% 50%, ${gold}05 0%, transparent 70%)` }}/>
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl" style={{ background: gold + "0f", border: `1px solid ${gold}20` }}>
                    <Edit2 size={18} style={{ color: gold + "80" }}/>
                  </div>
                  <p className="text-sm font-semibold text-white/25">Sélectionnez un contrat</p>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <CreateModal onClose={() => setShowModal(false)}
            onGenerate={handleGenerate} onCreateBlank={(f) => handleCreateContract(f)}
            generating={generating} creating={creating}/>
        )}
        {signerToSign && selected && (
          <SignModal signer={signerToSign} contractTitle={selected.title}
            onClose={() => setSignerToSign(null)}
            onSign={(sigData, cert) => handleSignContract(sigData, cert)}/>
        )}
        {showAIModal && selected && (
          <AIModal contract={selected} onClose={() => setShowAIModal(false)}/>
        )}
      </AnimatePresence>

      <ConfirmModal open={confirmDeleteId !== null} title="Supprimer ce contrat ?"
        description="Le contrat et toutes ses données seront définitivement supprimés."
        confirmLabel="Supprimer" loading={deleting}
        onConfirm={confirmDelete} onCancel={() => setConfirmDeleteId(null)}/>
    </div>
  );
}
