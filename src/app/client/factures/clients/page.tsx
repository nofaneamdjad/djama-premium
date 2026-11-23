"use client";

/**
 * Clients — mini-CRM Factures & Devis
 * Répertoire clients dédié avec CRUD complet, fiche, stats, import CSV.
 */

import {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import {
  Search, Plus, Users, Loader2, AlertCircle, X,
  MoreHorizontal, Building2, User, Mail, Phone,
  Globe, ChevronLeft, ChevronRight, Upload,
  ReceiptText, FileSignature, TrendingUp, TrendingDown,
  Archive, Edit3, ExternalLink, Filter,
  CheckCircle, AlertTriangle,
} from "lucide-react";

const YELLOW = "#FFB900";
const PAGE_SIZE = 50;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FClient {
  id:              string;
  type_client:     "particulier" | "entreprise";
  prenom:          string;
  nom_client:      string;
  raison_sociale:  string;
  nom_commercial:  string;
  email:           string;
  telephone:       string;
  indicatif_pays:  string;
  pays:            string;
  ville:           string;
  categorie:       string;
  statut:          "actif" | "archivé" | "prospect";
  notes:           string;
  tags:            string[];
  devise:          string;
  langue:          string;
  created_at:      string;
  // enrichi
  nbFactures:      number;
  nbDevis:         number;
  totalFacture:    number;
  totalEncaisse:   number;
}

interface ClientFormData {
  type_client:         string;
  prenom:              string;
  nom_client:          string;
  raison_sociale:      string;
  nom_commercial:      string;
  email:               string;
  telephone:           string;
  indicatif_pays:      string;
  site_web:            string;
  adresse:             string;
  ville:               string;
  region:              string;
  code_postal:         string;
  pays:                string;
  identifiant_legal:   string;
  num_tva:             string;
  regime_fiscal:       string;
  conditions_paiement: string;
  contact_facturation: string;
  langue:              string;
  devise:              string;
  categorie:           string;
  tags:                string;
  notes:               string;
  statut:              string;
}

const DEFAULT_FORM: ClientFormData = {
  type_client: "entreprise", prenom: "", nom_client: "", raison_sociale: "",
  nom_commercial: "", email: "", telephone: "", indicatif_pays: "", site_web: "",
  adresse: "", ville: "", region: "", code_postal: "", pays: "FR",
  identifiant_legal: "", num_tva: "", regime_fiscal: "",
  conditions_paiement: "net30", contact_facturation: "", langue: "fr",
  devise: "EUR", categorie: "", tags: "", notes: "", statut: "actif",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYS_AFRIQUE = [
  "DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CD","CG","CI","DJ",
  "EG","GQ","ER","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW",
  "ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN","SL","SO","ZA","SS",
  "SD","SZ","TZ","TG","TN","UG","ZM","ZW",
];

const PAYS_OPTIONS = [
  { code: "SN", label: "Sénégal" }, { code: "CM", label: "Cameroun" },
  { code: "CI", label: "Côte d'Ivoire" }, { code: "MA", label: "Maroc" },
  { code: "TN", label: "Tunisie" }, { code: "DZ", label: "Algérie" },
  { code: "NG", label: "Nigeria" }, { code: "GH", label: "Ghana" },
  { code: "KE", label: "Kenya" }, { code: "ET", label: "Éthiopie" },
  { code: "EG", label: "Égypte" }, { code: "ZA", label: "Afrique du Sud" },
  { code: "CD", label: "RD Congo" }, { code: "TZ", label: "Tanzanie" },
  { code: "ML", label: "Mali" }, { code: "BF", label: "Burkina Faso" },
  { code: "GN", label: "Guinée" }, { code: "BJ", label: "Bénin" },
  { code: "NE", label: "Niger" }, { code: "MG", label: "Madagascar" },
  { code: "FR", label: "France" }, { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" }, { code: "LU", label: "Luxembourg" },
  { code: "CA", label: "Canada" }, { code: "US", label: "États-Unis" },
  { code: "GB", label: "Royaume-Uni" }, { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" }, { code: "IT", label: "Italie" },
  { code: "PT", label: "Portugal" },
];

const ID_LABEL: Record<string, string> = {
  FR: "SIRET", SN: "NINEA", CM: "NIU", CI: "CCi / NIF", MA: "ICE",
  DZ: "NIF", TN: "MF", NG: "TIN", GH: "TIN", KE: "KRA PIN",
  ZA: "CIPC Reg.", EG: "Tax ID", default: "Identifiant légal",
};

const INDICATIFS: Record<string, string> = {
  SN: "+221", CM: "+237", CI: "+225", MA: "+212", DZ: "+213", TN: "+216",
  NG: "+234", GH: "+233", KE: "+254", ZA: "+27", EG: "+20", FR: "+33",
  BE: "+32", CH: "+41", CA: "+1", US: "+1", GB: "+44",
};

function idLabel(pays: string) { return ID_LABEL[pays] || ID_LABEL.default; }

function displayName(c: FClient) {
  if (c.raison_sociale) return c.raison_sociale;
  return [c.prenom, c.nom_client].filter(Boolean).join(" ") || "— Sans nom —";
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

function initials(c: FClient) {
  const name = displayName(c);
  return name.slice(0, 2).toUpperCase();
}

function StatutBadge({ statut }: { statut: string }) {
  const styles: Record<string, string> = {
    actif:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    prospect: `border-[${YELLOW}]/20`,
    archivé:  "bg-white/5 text-white/30 border-white/10",
  };
  const labels: Record<string, string> = { actif: "Actif", prospect: "Prospect", archivé: "Archivé" };
  const color = statut === "prospect" ? YELLOW : undefined;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[statut] || styles.actif}`}
      style={statut === "prospect" ? { color: YELLOW, background: `${YELLOW}15`, borderColor: `${YELLOW}30` } : undefined}
    >
      {labels[statut] || statut}
    </span>
  );
}

// ─── Composant modal Création / Édition ───────────────────────────────────────

function ClientModal({
  mode, initialData, onClose, onSaved, isDark,
}: {
  mode:        "create" | "edit";
  initialData: Partial<ClientFormData> & { id?: string };
  onClose:     () => void;
  onSaved:     (c: FClient) => void;
  isDark:      boolean;
}) {
  const [form, setForm] = useState<ClientFormData>({ ...DEFAULT_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [tab, setTab]       = useState<"identite" | "coordonnees" | "pro" | "meta">("identite");
  const clientId = initialData.id;

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function set(k: keyof ClientFormData, v: string) {
    setForm(f => {
      const nf = { ...f, [k]: v };
      if (k === "pays" && INDICATIFS[v]) nf.indicatif_pays = INDICATIFS[v];
      return nf;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };
      const url    = mode === "create" ? "/api/factures/clients" : `/api/factures/clients/${clientId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json() as { ok?: boolean; client?: FClient; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      onSaved(data.client!);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#FFB900]/40 transition";
  const sel = inp + " cursor-pointer";
  const lbl = "mb-1 block text-[11px] font-medium text-white/40 uppercase tracking-wider";

  const tabs = [
    { id: "identite",    label: "Identité"       },
    { id: "coordonnees", label: "Coordonnées"    },
    { id: "pro",         label: "Pro"             },
    { id: "meta",        label: "Infos+"          },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="relative flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.1]"
        style={{ background: isDark ? "#0f1117" : "#ffffff" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">{mode === "create" ? "Nouveau client" : "Modifier le client"}</h2>
            <p className="text-xs text-white/35">{mode === "create" ? "Ajoutez un client à votre répertoire" : "Mettez à jour les informations"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.07] hover:text-white/70">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.07] px-6 pt-3">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "text-white border-b-2" : "text-white/40 hover:text-white/60"}`}
              style={tab === t.id ? { borderColor: YELLOW, color: YELLOW } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={e => void handleSubmit(e)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {tab === "identite" && (
              <div className="space-y-4">
                {/* Type */}
                <div>
                  <label className={lbl}>Type de client</label>
                  <div className="flex gap-2">
                    {(["particulier", "entreprise"] as const).map(t => (
                      <button
                        type="button" key={t}
                        onClick={() => set("type_client", t)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition"
                        style={form.type_client === t
                          ? { borderColor: YELLOW, color: YELLOW, background: `${YELLOW}10` }
                          : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                      >
                        {t === "particulier" ? <User size={14} /> : <Building2 size={14} />}
                        {t === "particulier" ? "Particulier" : "Entreprise"}
                      </button>
                    ))}
                  </div>
                </div>

                {form.type_client === "particulier" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Prénom</label>
                      <input className={inp} value={form.prenom} onChange={e => set("prenom", e.target.value)} placeholder="Prénom" />
                    </div>
                    <div>
                      <label className={lbl}>Nom *</label>
                      <input className={inp} value={form.nom_client} onChange={e => set("nom_client", e.target.value)} placeholder="Nom de famille" required />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className={lbl}>Raison sociale *</label>
                      <input className={inp} value={form.raison_sociale} onChange={e => set("raison_sociale", e.target.value)} placeholder="Ex : Benali Consulting SARL" required={form.type_client === "entreprise"} />
                    </div>
                    <div>
                      <label className={lbl}>Nom commercial</label>
                      <input className={inp} value={form.nom_commercial} onChange={e => set("nom_commercial", e.target.value)} placeholder="Nom affiché si différent" />
                    </div>
                    <div>
                      <label className={lbl}>Contact principal</label>
                      <input className={inp} value={form.nom_client} onChange={e => set("nom_client", e.target.value)} placeholder="Prénom et nom du contact" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Pays</label>
                    <select className={sel} value={form.pays} onChange={e => set("pays", e.target.value)}>
                      <optgroup label="Afrique">
                        {PAYS_OPTIONS.filter(p => PAYS_AFRIQUE.includes(p.code)).map(p => (
                          <option key={p.code} value={p.code}>{p.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Autres">
                        {PAYS_OPTIONS.filter(p => !PAYS_AFRIQUE.includes(p.code)).map(p => (
                          <option key={p.code} value={p.code}>{p.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Langue préférée</label>
                    <select className={sel} value={form.langue} onChange={e => set("langue", e.target.value)}>
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                      <option value="pt">Português</option>
                      <option value="wo">Wolof</option>
                      <option value="ha">Hausa</option>
                      <option value="yo">Yoruba</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={lbl}>Devise préférée</label>
                  <select className={sel} value={form.devise} onChange={e => set("devise", e.target.value)}>
                    <option value="EUR">EUR — Euro</option>
                    <option value="XOF">XOF — Franc CFA UEMOA</option>
                    <option value="XAF">XAF — Franc CFA CEMAC</option>
                    <option value="MAD">MAD — Dirham marocain</option>
                    <option value="TND">TND — Dinar tunisien</option>
                    <option value="DZD">DZD — Dinar algérien</option>
                    <option value="NGN">NGN — Naira nigérian</option>
                    <option value="GHS">GHS — Cédi ghanéen</option>
                    <option value="KES">KES — Shilling kenyan</option>
                    <option value="ZAR">ZAR — Rand sud-africain</option>
                    <option value="USD">USD — Dollar américain</option>
                    <option value="GBP">GBP — Livre sterling</option>
                    <option value="CHF">CHF — Franc suisse</option>
                    <option value="CAD">CAD — Dollar canadien</option>
                  </select>
                </div>
              </div>
            )}

            {tab === "coordonnees" && (
              <div className="space-y-4">
                <div>
                  <label className={lbl}>E-mail</label>
                  <input className={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@exemple.com" />
                </div>

                <div className="grid grid-cols-[100px,1fr] gap-2">
                  <div>
                    <label className={lbl}>Indicatif</label>
                    <input className={inp} value={form.indicatif_pays} onChange={e => set("indicatif_pays", e.target.value)} placeholder="+33" />
                  </div>
                  <div>
                    <label className={lbl}>Téléphone</label>
                    <input className={inp} type="tel" value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="06 12 34 56 78" />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Site internet</label>
                  <input className={inp} type="url" value={form.site_web} onChange={e => set("site_web", e.target.value)} placeholder="https://www.exemple.com" />
                </div>

                <div>
                  <label className={lbl}>Adresse</label>
                  <input className={inp} value={form.adresse} onChange={e => set("adresse", e.target.value)} placeholder="Numéro et rue" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Ville</label>
                    <input className={inp} value={form.ville} onChange={e => set("ville", e.target.value)} placeholder="Dakar" />
                  </div>
                  <div>
                    <label className={lbl}>Région / Province</label>
                    <input className={inp} value={form.region} onChange={e => set("region", e.target.value)} placeholder="Dakar" />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Code postal</label>
                  <input className={inp} value={form.code_postal} onChange={e => set("code_postal", e.target.value)} placeholder="BP 123 / 10001" />
                </div>
              </div>
            )}

            {tab === "pro" && (
              <div className="space-y-4">
                <div>
                  <label className={lbl}>{idLabel(form.pays)}</label>
                  <input className={inp} value={form.identifiant_legal} onChange={e => set("identifiant_legal", e.target.value)}
                    placeholder={`${idLabel(form.pays)} de ${PAYS_OPTIONS.find(p => p.code === form.pays)?.label || form.pays}`} />
                </div>

                <div>
                  <label className={lbl}>N° TVA / Taxe (si applicable)</label>
                  <input className={inp} value={form.num_tva} onChange={e => set("num_tva", e.target.value)} placeholder="FR12345678901" />
                </div>

                <div>
                  <label className={lbl}>Régime fiscal</label>
                  <select className={sel} value={form.regime_fiscal} onChange={e => set("regime_fiscal", e.target.value)}>
                    <option value="">— Non précisé —</option>
                    <option value="assujetti">Assujetti à la TVA</option>
                    <option value="non_assujetti">Non assujetti</option>
                    <option value="franchise">Franchise en base</option>
                    <option value="auto_entrepreneur">Auto-entrepreneur</option>
                    <option value="exportateur">Exportateur / Exonéré</option>
                  </select>
                </div>

                <div>
                  <label className={lbl}>Conditions de paiement</label>
                  <select className={sel} value={form.conditions_paiement} onChange={e => set("conditions_paiement", e.target.value)}>
                    <option value="immediate">Paiement immédiat</option>
                    <option value="net15">Net 15 jours</option>
                    <option value="net30">Net 30 jours</option>
                    <option value="net45">Net 45 jours</option>
                    <option value="net60">Net 60 jours</option>
                    <option value="net90">Net 90 jours</option>
                    <option value="fin_mois">Fin de mois</option>
                  </select>
                </div>

                <div>
                  <label className={lbl}>Contact facturation</label>
                  <input className={inp} value={form.contact_facturation} onChange={e => set("contact_facturation", e.target.value)} placeholder="Nom et e-mail du service comptabilité" />
                </div>
              </div>
            )}

            {tab === "meta" && (
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Statut</label>
                  <div className="flex gap-2">
                    {(["actif", "prospect", "archivé"] as const).map(s => {
                      const colors: Record<string, string> = {
                        actif: "#22c55e", prospect: YELLOW, archivé: "rgba(255,255,255,0.3)",
                      };
                      const labels = { actif: "Actif", prospect: "Prospect", archivé: "Archivé" };
                      const active = form.statut === s;
                      return (
                        <button
                          type="button" key={s}
                          onClick={() => set("statut", s)}
                          className="flex-1 rounded-xl border py-2 text-xs font-semibold transition"
                          style={active
                            ? { borderColor: colors[s], color: colors[s], background: `${colors[s]}15` }
                            : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                        >
                          {labels[s]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={lbl}>Catégorie / Segment</label>
                  <input className={inp} value={form.categorie} onChange={e => set("categorie", e.target.value)} placeholder="Ex : PME, Grand compte, Startup…" />
                </div>

                <div>
                  <label className={lbl}>Tags (séparés par des virgules)</label>
                  <input className={inp} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="VIP, Prioritaire, Partenaire…" />
                </div>

                <div>
                  <label className={lbl}>Notes internes</label>
                  <textarea
                    className={inp + " h-24 resize-none"}
                    value={form.notes}
                    onChange={e => set("notes", e.target.value)}
                    placeholder="Informations internes, préférences, historique commercial…"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-medium text-white/50 transition hover:bg-white/[0.05] hover:text-white/80">
              Annuler
            </button>
            <div className="flex gap-2">
              {/* Navigation entre onglets */}
              {tab !== "identite" && (
                <button type="button"
                  onClick={() => setTab(t => ({ identite: "identite", coordonnees: "identite", pro: "coordonnees", meta: "pro" }[t] as typeof t))}
                  className="rounded-xl border border-white/[0.1] px-3 py-2 text-sm font-medium text-white/50 transition hover:bg-white/[0.05]">
                  ← Précédent
                </button>
              )}
              {tab !== "meta" ? (
                <button type="button"
                  onClick={() => setTab(t => ({ identite: "coordonnees", coordonnees: "pro", pro: "meta", meta: "meta" }[t] as typeof t))}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                  style={{ background: YELLOW }}>
                  Suivant →
                </button>
              ) : (
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: YELLOW }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {saving ? "Enregistrement…" : mode === "create" ? "Créer le client" : "Enregistrer"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Import CSV ─────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported, isDark }: { onClose: () => void; onImported: () => void; isDark: boolean }) {
  const [step,     setStep]     = useState<"upload" | "preview" | "done">("upload");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState<{ total: number; toImport: number; toSkip: number; errors: number; sample: unknown[] } | null>(null);
  const [file,     setFile]     = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f); setLoading(true); setError("");
    try {
      const form = new FormData(); form.append("file", f);
      const res  = await fetch("/api/factures/clients/import?preview=1", { method: "POST", body: form });
      const data = await res.json() as { preview?: boolean; toImport?: number; toSkip?: number; errors?: number; total?: number; sample?: unknown[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPreview({ total: data.total!, toImport: data.toImport!, toSkip: data.toSkip!, errors: data.errors!, sample: data.sample! });
      setStep("preview");
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const form = new FormData(); form.append("file", file);
      const res  = await fetch("/api/factures/clients/import?confirm=1", { method: "POST", body: form });
      const data = await res.json() as { ok?: boolean; imported?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStep("done");
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.1]"
        style={{ background: isDark ? "#0f1117" : "#ffffff" }}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <h2 className="text-base font-bold text-white">Importer des clients (CSV)</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.07]"><X size={16} /></button>
        </div>
        <div className="p-6">
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-white/50">
                Importez vos clients depuis un fichier CSV. Les colonnes reconnues : nom, prénom, société, email, téléphone, pays, ville, adresse, TVA, notes.
              </p>
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.15] py-10 transition hover:border-[#FFB900]/40"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={28} className="text-white/25" />
                <span className="text-sm text-white/40">Cliquez pour sélectionner un fichier CSV</span>
                <span className="text-xs text-white/20">Maximum 5 Mo · Encodage UTF-8</span>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
              </div>
              {loading && <div className="flex items-center gap-2 text-sm text-white/40"><Loader2 size={14} className="animate-spin" /> Analyse en cours…</div>}
              {error && <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: "rgba(248,113,113,0.1)" }}>{error}</div>}
            </div>
          )}

          {step === "preview" && preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "À importer", value: preview.toImport, color: "#22c55e" },
                  { label: "Doublons ignorés", value: preview.toSkip, color: YELLOW },
                  { label: "Erreurs", value: preview.errors, color: "#f87171" },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border border-white/[0.07] p-3 text-center">
                    <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
                    <div className="text-[11px] text-white/35">{k.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/35">{preview.total} ligne{preview.total !== 1 ? "s" : ""} analysées · Les doublons sont détectés par email et nom.</p>
              {error && <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: "rgba(248,113,113,0.1)" }}>{error}</div>}
              <div className="flex gap-2">
                <button onClick={() => setStep("upload")} className="flex-1 rounded-xl border border-white/[0.1] py-2 text-sm font-medium text-white/50 hover:bg-white/[0.05]">Retour</button>
                <button onClick={() => void handleImport()} disabled={loading || preview.toImport === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: YELLOW }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {loading ? "Import…" : `Importer ${preview.toImport} client${preview.toImport !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle size={36} style={{ color: "#22c55e" }} />
              <p className="text-base font-semibold text-white">Import terminé !</p>
              <p className="text-sm text-white/40">Les clients ont été ajoutés à votre répertoire.</p>
              <button onClick={() => { onImported(); onClose(); }}
                className="rounded-xl px-6 py-2 text-sm font-bold text-black"
                style={{ background: YELLOW }}>
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Menu contextuel ──────────────────────────────────────────────────────────

function ContextMenu({
  client, onEdit, onArchive, onNewDoc, onClose,
}: {
  client: FClient;
  onEdit:    () => void;
  onArchive: () => void;
  onNewDoc:  (type: "facture" | "devis") => void;
  onClose:   () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-8 z-40 min-w-[180px] rounded-xl border border-white/[0.12] py-1 shadow-2xl"
      style={{ background: "#1a1f2e", top: "50%" }}>
      <button onClick={() => { router.push(`/client/factures/clients/${client.id}`); onClose(); }}
        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.07] hover:text-white">
        <ExternalLink size={13} /> Voir la fiche
      </button>
      <button onClick={() => { onEdit(); onClose(); }}
        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.07] hover:text-white">
        <Edit3 size={13} /> Modifier
      </button>
      <div className="my-1 border-t border-white/[0.07]" />
      <button onClick={() => { onNewDoc("facture"); onClose(); }}
        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.07] hover:text-white">
        <ReceiptText size={13} /> Nouvelle facture
      </button>
      <button onClick={() => { onNewDoc("devis"); onClose(); }}
        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.07] hover:text-white">
        <FileSignature size={13} /> Nouveau devis
      </button>
      {client.statut !== "archivé" && (
        <>
          <div className="my-1 border-t border-white/[0.07]" />
          <button onClick={() => { onArchive(); onClose(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-white/[0.07]"
            style={{ color: "#f87171" }}>
            <Archive size={13} /> Archiver
          </button>
        </>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { isDark }  = useTheme();
  const router      = useRouter();

  const [clients,       setClients]       = useState<FClient[]>([]);
  const [count,         setCount]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [migPending,    setMigPending]    = useState(false);
  const [search,        setSearch]        = useState("");
  const [filterStatut,  setFilterStatut]  = useState("");
  const [filterPays,    setFilterPays]    = useState("");
  const [page,          setPage]          = useState(1);
  const [modal,         setModal]         = useState<null | "create" | "edit">(null);
  const [editingClient, setEditingClient] = useState<FClient | null>(null);
  const [showImport,    setShowImport]    = useState(false);
  const [menuClientId,  setMenuClientId]  = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position to avoid left-column being cut off on navigation back
  useEffect(() => {
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = 0;
  }, []);

  // ── Chargement ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams({
      page: String(page), limit: String(PAGE_SIZE),
      ...(search       && { q:        search }),
      ...(filterStatut && { statut:   filterStatut }),
      ...(filterPays   && { pays:     filterPays }),
    });
    try {
      const res  = await fetch(`/api/factures/clients?${params}`);
      const data = await res.json() as { clients?: FClient[]; count?: number; migrationPending?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      setClients(data.clients ?? []);
      setCount(data.count ?? 0);
      setMigPending(data.migrationPending ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatut, filterPays]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filterStatut, filterPays]);

  // ── Auto-open edit modal via ?edit=ID (depuis fiche client) ──────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    fetch(`/api/factures/clients/${editId}`)
      .then(r => r.json() as Promise<{ client?: FClient }>)
      .then(data => {
        if (data.client) {
          setEditingClient({ ...data.client, tags: (data.client.tags || []).join(", ") } as unknown as FClient);
          setModal("edit");
          // Nettoyer l'URL sans rechargement
          window.history.replaceState({}, "", window.location.pathname);
        }
      })
      .catch(console.error);
  }, []);

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    total:   count,
    actifs:  clients.filter(c => c.statut === "actif").length,
    ca:      clients.reduce((s, c) => s + (c.totalFacture || 0), 0),
    encaisse:clients.reduce((s, c) => s + (c.totalEncaisse || 0), 0),
  }), [clients, count]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  function handleSaved(c: FClient) {
    setModal(null);
    setEditingClient(null);
    void load();
    router.refresh();
  }

  async function handleArchive(id: string) {
    if (!confirm("Archiver ce client ? Il reste visible dans les filtres.")) return;
    await fetch(`/api/factures/clients/${id}`, { method: "DELETE" });
    void load();
  }

  function openNewDoc(type: "facture" | "devis", client: FClient) {
    const name = displayName(client);
    router.push(`/client/factures/documents?new=1&type=${type}&client=${encodeURIComponent(name)}&clientId=${client.id}`);
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const tbg      = isDark ? "bg-[#0f1117]"               : "bg-gray-50";
  const tbgCard  = isDark ? "bg-white/[0.03] border-white/[0.07]" : "bg-white border-gray-200";
  const ttext    = isDark ? "text-white"                  : "text-gray-900";
  const tsub     = isDark ? "text-white/40"               : "text-gray-500";
  const thbg     = isDark ? "bg-white/[0.03]"             : "bg-gray-50";
  const tinp     = isDark
    ? "border-white/[0.09] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-[#FFB900]/40"
    : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#FFB900]/60";

  return (
    <div className={`min-h-full ${tbg}`}>
      <div className="px-4 py-5 md:px-6 md:py-6">

        {/* ── Header ── */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${ttext}`}>Clients</h1>
            <p className={`mt-0.5 text-sm ${tsub}`}>
              {loading ? "Chargement…" : `${count} client${count !== 1 ? "s" : ""} dans votre répertoire`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${isDark ? "border-white/[0.1] text-white/60 hover:bg-white/[0.07] hover:text-white" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
            >
              <Upload size={13} /> Importer CSV
            </button>
            {count > 0 && (
              <a
                href="/api/factures/clients/export"
                download="clients-djama.csv"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${isDark ? "border-white/[0.1] text-white/60 hover:bg-white/[0.07] hover:text-white" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exporter CSV
              </a>
            )}
            <button
              onClick={() => { setEditingClient(null); setModal("create"); }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-black transition hover:opacity-90"
              style={{ background: YELLOW }}
            >
              <Plus size={14} /> Nouveau client
            </button>
          </div>
        </div>

        {/* ── Alerte migration ── */}
        {migPending && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/8 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-orange-400" />
            <div>
              <p className="text-sm font-semibold text-orange-400">Migration requise</p>
              <p className="text-xs text-orange-400/70">
                La table <code>factures_clients</code> n'existe pas encore. Appliquez la migration <strong>20261121000001</strong> pour activer le répertoire clients.
              </p>
            </div>
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Clients total",   value: String(kpi.total),  icon: Users,         color: YELLOW,     bg: `${YELLOW}12`,    border: `${YELLOW}25`    },
            { label: "Clients actifs",  value: String(kpi.actifs), icon: CheckCircle,   color: "#22c55e",  bg: "rgba(34,197,94,0.07)",  border: "rgba(34,197,94,0.2)"  },
            { label: "CA facturé",      value: fmt(kpi.ca),        icon: TrendingUp,    color: "#a78bfa",  bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.2)" },
            { label: "CA encaissé",     value: fmt(kpi.encaisse),  icon: TrendingDown,  color: "#34d399",  bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.2)"  },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border p-4"
                style={{ background: k.bg, borderColor: k.border }}>
                <div className="mb-2 flex items-center gap-1.5">
                  <Icon size={12} style={{ color: k.color }} />
                  <span className={`text-[11px] font-medium ${isDark ? "text-white/40" : "text-gray-500"}`}>{k.label}</span>
                </div>
                <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
              </div>
            );
          })}
        </div>

        {/* ── Recherche + filtres ── */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search size={13} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-gray-400"}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, société, e-mail, téléphone…"
              className={`w-full rounded-xl border py-2 pl-9 pr-9 text-sm outline-none transition ${tinp}`}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={12} className={isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"} />
              </button>
            )}
          </div>

          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className={`rounded-xl border py-2 pl-3 pr-7 text-sm outline-none transition ${tinp} cursor-pointer`}
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="prospect">Prospect</option>
            <option value="archivé">Archivé</option>
          </select>

          <select
            value={filterPays}
            onChange={e => setFilterPays(e.target.value)}
            className={`rounded-xl border py-2 pl-3 pr-7 text-sm outline-none transition ${tinp} cursor-pointer`}
          >
            <option value="">Tous les pays</option>
            {PAYS_OPTIONS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
          </select>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── Tableau ── */}
        <div className={`overflow-hidden rounded-2xl border ${tbgCard}`}>
          <div ref={tableScrollRef} className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
                  {[
                    { label: "",           cls: "w-12" },
                    { label: "Client",     cls: "min-w-[200px]" },
                    { label: "Contact",    cls: "min-w-[160px]" },
                    { label: "Docs",       cls: "w-16" },
                    { label: "CA facturé", cls: "min-w-[120px]" },
                    { label: "Statut",     cls: "w-24" },
                    { label: "",           cls: "w-12" },
                  ].map((col, i) => (
                    <th key={i} className={`px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${col.cls} ${isDark ? "text-white/30" : "text-gray-400"}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <Loader2 size={22} className={`mx-auto animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`} />
                  </td></tr>
                )}
                {!loading && clients.length === 0 && (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <Users size={32} className={`mx-auto mb-3 ${isDark ? "text-white/15" : "text-gray-300"}`} />
                    <p className={`text-sm ${tsub}`}>
                      {search || filterStatut || filterPays
                        ? "Aucun client ne correspond à votre recherche."
                        : migPending
                          ? "Le répertoire clients sera disponible après la migration."
                          : "Aucun client pour l'instant."}
                    </p>
                    {!search && !filterStatut && !filterPays && !migPending && (
                      <button
                        onClick={() => setModal("create")}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-black"
                        style={{ background: YELLOW }}
                      >
                        <Plus size={13} /> Créer votre premier client
                      </button>
                    )}
                  </td></tr>
                )}
                {!loading && clients.map(c => (
                  <tr
                    key={c.id}
                    className={`relative cursor-pointer border-b transition ${isDark ? "border-white/[0.05] hover:bg-white/[0.03]" : "border-gray-100 hover:bg-gray-50"}`}
                    onClick={() => router.push(`/client/factures/clients/${c.id}`)}
                  >
                    {/* Avatar */}
                    <td className="px-3 py-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black"
                        style={{
                          background: c.type_client === "entreprise"
                            ? `${YELLOW}cc`
                            : "rgba(167,139,250,0.7)",
                        }}
                      >
                        {initials(c)}
                      </div>
                    </td>

                    {/* Nom */}
                    <td className="overflow-hidden px-3 py-3">
                      <div className={`truncate text-sm font-semibold ${ttext}`} title={displayName(c)}>
                        {displayName(c)}
                      </div>
                      {(c.raison_sociale && c.nom_client) && (
                        <div className={`truncate text-[11px] ${tsub}`} title={c.nom_client}>{c.nom_client}</div>
                      )}
                      {c.pays && (
                        <div className={`flex items-center gap-1 text-[10px] ${isDark ? "text-white/20" : "text-gray-400"}`}>
                          <Globe size={9} /> {PAYS_OPTIONS.find(p => p.code === c.pays)?.label || c.pays}
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="overflow-hidden px-3 py-3">
                      {c.email && (
                        <div className={`flex items-center gap-1 truncate text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}
                          title={c.email}>
                          <Mail size={10} className="shrink-0" /> {c.email}
                        </div>
                      )}
                      {c.telephone && (
                        <div className={`flex items-center gap-1 truncate text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}
                          title={`${c.indicatif_pays} ${c.telephone}`}>
                          <Phone size={10} className="shrink-0" /> {c.indicatif_pays} {c.telephone}
                        </div>
                      )}
                    </td>

                    {/* Docs */}
                    <td className="px-3 py-3">
                      {(c.nbFactures > 0 || c.nbDevis > 0) ? (
                        <div className="space-y-0.5">
                          {c.nbFactures > 0 && (
                            <div className={`flex items-center gap-1 text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>
                              <ReceiptText size={10} /> {c.nbFactures}
                            </div>
                          )}
                          {c.nbDevis > 0 && (
                            <div className={`flex items-center gap-1 text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>
                              <FileSignature size={10} /> {c.nbDevis}
                            </div>
                          )}
                        </div>
                      ) : <span className={`text-xs ${isDark ? "text-white/15" : "text-gray-300"}`}>—</span>}
                    </td>

                    {/* CA */}
                    <td className="px-3 py-3">
                      {c.totalFacture > 0 ? (
                        <div>
                          <div className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-gray-800"}`}>{fmt(c.totalFacture)}</div>
                          {c.totalEncaisse > 0 && (
                            <div className="text-[10px]" style={{ color: "#34d399" }}>↗ {fmt(c.totalEncaisse)} encaissé</div>
                          )}
                        </div>
                      ) : <span className={`text-sm ${isDark ? "text-white/15" : "text-gray-300"}`}>—</span>}
                    </td>

                    {/* Statut */}
                    <td className="px-3 py-3"><StatutBadge statut={c.statut} /></td>

                    {/* Actions */}
                    <td className="relative px-2 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuClientId(prev => prev === c.id ? null : c.id)}
                        className={`rounded-lg p-1.5 transition ${isDark ? "text-white/30 hover:bg-white/[0.07] hover:text-white/70" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {menuClientId === c.id && (
                        <ContextMenu
                          client={c}
                          onEdit={() => { setEditingClient(c); setModal("edit"); }}
                          onArchive={() => void handleArchive(c.id)}
                          onNewDoc={type => openNewDoc(type, c)}
                          onClose={() => setMenuClientId(null)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between border-t px-4 py-3 ${isDark ? "border-white/[0.07]" : "border-gray-100"}`}>
              <span className={`text-xs ${tsub}`}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, count)} sur {count}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className={`rounded-lg border p-1.5 disabled:opacity-30 ${isDark ? "border-white/[0.09] text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
                  <ChevronLeft size={14} />
                </button>
                <span className={`px-2 text-xs ${tsub}`}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className={`rounded-lg border p-1.5 disabled:opacity-30 ${isDark ? "border-white/[0.09] text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom padding pour éviter chevauchement bouton bêta */}
        <div className="pb-24 md:pb-20" />
      </div>

      {/* ── Modals ── */}
      {modal && (
        <ClientModal
          mode={modal}
          initialData={modal === "edit" && editingClient
            ? { ...editingClient, id: editingClient.id, tags: (editingClient.tags || []).join(", ") }
            : {}}
          onClose={() => { setModal(null); setEditingClient(null); }}
          onSaved={handleSaved}
          isDark={isDark}
        />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={() => void load()} isDark={isDark} />
      )}
    </div>
  );
}
