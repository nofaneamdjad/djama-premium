"use client";

/**
 * Fiche client — vue complète : identité, stats, documents liés, actions rapides
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import {
  ArrowLeft, Building2, User, Mail, Phone, Globe, MapPin,
  Edit3, Loader2, AlertCircle, ReceiptText, FileSignature,
  TrendingUp, TrendingDown, AlertTriangle, Calendar,
  ExternalLink, Archive, ChevronRight, Plus,
  CheckCircle, Clock, XCircle,
} from "lucide-react";

const YELLOW = "#FFB900";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FClient {
  id: string;
  type_client: "particulier" | "entreprise";
  prenom: string;
  nom_client: string;
  raison_sociale: string;
  nom_commercial: string;
  email: string;
  telephone: string;
  indicatif_pays: string;
  site_web: string;
  adresse: string;
  ville: string;
  region: string;
  code_postal: string;
  pays: string;
  identifiant_legal: string;
  num_tva: string;
  regime_fiscal: string;
  conditions_paiement: string;
  contact_facturation: string;
  langue: string;
  devise: string;
  categorie: string;
  tags: string[];
  notes: string;
  statut: "actif" | "archivé" | "prospect";
  created_at: string;
}

interface Document {
  id: string;
  type: "facture" | "devis" | "avoir";
  numero: string;
  statut: string;
  date_document: string;
  date_echeance: string | null;
  total_ttc: number;
  montant_paye: number;
  sujet: string | null;
}

interface Stats {
  nbFactures: number;
  nbDevis: number;
  totalFacture: number;
  totalEncaisse: number;
  totalImpaye: number;
  facturesEnRetard: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYS_OPTIONS: Record<string, string> = {
  SN: "Sénégal", CM: "Cameroun", CI: "Côte d'Ivoire", MA: "Maroc",
  TN: "Tunisie", DZ: "Algérie", NG: "Nigeria", GH: "Ghana",
  KE: "Kenya", ET: "Éthiopie", EG: "Égypte", ZA: "Afrique du Sud",
  CD: "RD Congo", TZ: "Tanzanie", ML: "Mali", BF: "Burkina Faso",
  GN: "Guinée", BJ: "Bénin", NE: "Niger", MG: "Madagascar",
  FR: "France", BE: "Belgique", CH: "Suisse", LU: "Luxembourg",
  CA: "Canada", US: "États-Unis", GB: "Royaume-Uni", DE: "Allemagne",
  ES: "Espagne", IT: "Italie", PT: "Portugal",
};

const CONDITIONS_LABEL: Record<string, string> = {
  immediate: "Paiement immédiat", net15: "Net 15 j", net30: "Net 30 j",
  net45: "Net 45 j", net60: "Net 60 j", net90: "Net 90 j", fin_mois: "Fin de mois",
};

const LANGUE_LABEL: Record<string, string> = {
  fr: "Français", en: "English", ar: "العربية", pt: "Português",
  wo: "Wolof", ha: "Hausa", yo: "Yoruba", sw: "Swahili",
};

function displayName(c: FClient) {
  if (c.raison_sociale) return c.raison_sociale;
  return [c.prenom, c.nom_client].filter(Boolean).join(" ") || "— Sans nom —";
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(c: FClient) {
  return displayName(c).slice(0, 2).toUpperCase();
}

function DocStatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    brouillon:  { icon: Clock,        color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)", label: "Brouillon" },
    envoyé:     { icon: CheckCircle,  color: "#60a5fa",               bg: "rgba(96,165,250,0.1)",   label: "Envoyé"    },
    payé:       { icon: CheckCircle,  color: "#34d399",               bg: "rgba(52,211,153,0.1)",   label: "Payé"      },
    en_retard:  { icon: AlertTriangle,color: "#f87171",               bg: "rgba(248,113,113,0.1)",  label: "En retard" },
    annulé:     { icon: XCircle,      color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)", label: "Annulé"    },
    accepté:    { icon: CheckCircle,  color: "#34d399",               bg: "rgba(52,211,153,0.1)",   label: "Accepté"   },
    refusé:     { icon: XCircle,      color: "#f87171",               bg: "rgba(248,113,113,0.1)",  label: "Refusé"    },
    expiré:     { icon: Clock,        color: "#fbbf24",               bg: "rgba(251,191,36,0.1)",   label: "Expiré"    },
  };
  const s = map[statut] ?? map.brouillon;
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: s.color, background: s.bg }}>
      <Icon size={9} /> {s.label}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientFichePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [client,    setClient]    = useState<FClient | null>(null);
  const [docs,      setDocs]      = useState<Document[]>([]);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [archiving, setArchiving] = useState(false);
  const [tab,       setTab]       = useState<"factures" | "devis">("factures");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/factures/clients/${id}`);
      const data = await res.json() as { client?: FClient; documents?: Document[]; stats?: Stats; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      setClient(data.client!);
      setDocs(data.documents ?? []);
      setStats(data.stats!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function handleArchive() {
    if (!client) return;
    if (!confirm("Archiver ce client ? Il restera visible dans les filtres.")) return;
    setArchiving(true);
    await fetch(`/api/factures/clients/${id}`, { method: "DELETE" });
    router.push("/client/factures/clients");
  }

  function goNewDoc(type: "facture" | "devis") {
    if (!client) return;
    const name = displayName(client);
    router.push(`/client/factures/documents?new=1&type=${type}&client=${encodeURIComponent(name)}&clientId=${id}`);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const tbg      = isDark ? "bg-[#0f1117]"                           : "bg-gray-50";
  const tbgCard  = isDark ? "bg-white/[0.03] border-white/[0.07]"    : "bg-white border-gray-200";
  const ttext    = isDark ? "text-white"                              : "text-gray-900";
  const tsub     = isDark ? "text-white/40"                          : "text-gray-500";
  const tdivider = isDark ? "border-white/[0.07]"                    : "border-gray-100";

  if (loading) {
    return (
      <div className={`flex min-h-full items-center justify-center ${tbg}`}>
        <Loader2 size={24} className={`animate-spin ${isDark ? "text-white/20" : "text-gray-300"}`} />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className={`flex min-h-full flex-col items-center justify-center gap-4 ${tbg}`}>
        <AlertCircle size={28} className="text-red-400" />
        <p className={`text-sm ${tsub}`}>{error || "Client introuvable"}</p>
        <Link href="/client/factures/clients"
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium ${isDark ? "text-white/60 hover:text-white/80" : "text-gray-500 hover:text-gray-700"}`}>
          <ArrowLeft size={14} /> Retour aux clients
        </Link>
      </div>
    );
  }

  const factures = docs.filter(d => d.type === "facture");
  const devis    = docs.filter(d => d.type === "devis");
  const displayDocs = tab === "factures" ? factures : devis;

  return (
    <div className={`min-h-full ${tbg}`}>
      <div className="px-4 py-5 md:px-6 md:py-6">

        {/* ── Back ── */}
        <Link href="/client/factures/clients"
          className={`mb-5 inline-flex items-center gap-1.5 text-sm transition ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-500 hover:text-gray-700"}`}>
          <ArrowLeft size={13} /> Retour aux clients
        </Link>

        {/* ── Header ── */}
        <div className={`mb-5 overflow-hidden rounded-2xl border ${tbgCard}`}>
          <div className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-black"
                style={{ background: client.type_client === "entreprise" ? `${YELLOW}cc` : "rgba(167,139,250,0.7)" }}
              >
                {initials(client)}
              </div>

              {/* Identité + Actions */}
              <div className="min-w-0 flex-1">
                {/* Nom complet — jamais tronqué */}
                <h1 className={`text-xl font-bold leading-tight ${ttext}`} style={{ wordBreak: "break-word" }}>
                  {displayName(client)}
                </h1>

                {/* Badges statut */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {client.statut === "actif"    && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Actif</span>}
                  {client.statut === "prospect" && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${YELLOW}15`, color: YELLOW }}>Prospect</span>}
                  {client.statut === "archivé"  && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? "bg-white/[0.06] text-white/30" : "bg-gray-100 text-gray-400"}`}>Archivé</span>}

                  {/* Type + pays + catégorie */}
                  <span className={`flex items-center gap-1 text-xs ${tsub}`}>
                    {client.type_client === "entreprise"
                      ? <><Building2 size={10} /> Entreprise</>
                      : <><User size={10} /> Particulier</>}
                  </span>
                  {client.pays && (
                    <span className={`flex items-center gap-1 text-xs ${tsub}`}>
                      <Globe size={10} /> {PAYS_OPTIONS[client.pays] || client.pays}
                    </span>
                  )}
                  {client.categorie && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] opacity-60 ${isDark ? "border-white/20 text-white/60" : "border-gray-300 text-gray-500"}`}>
                      {client.categorie}
                    </span>
                  )}
                </div>

                {client.raison_sociale && client.nom_client && (
                  <p className={`mt-1 text-xs ${tsub}`}>Contact : {client.nom_client}</p>
                )}

                {(client.tags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {client.tags.map(t => (
                      <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${YELLOW}15`, color: YELLOW }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions — sur une ligne dédiée, toujours lisibles */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push(`/client/factures/clients?edit=${id}`)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${isDark ? "border-white/[0.1] text-white/60 hover:bg-white/[0.07] hover:text-white" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                  >
                    <Edit3 size={13} /> Modifier
                  </button>
                  <button
                    onClick={() => goNewDoc("facture")}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-black transition hover:opacity-90"
                    style={{ background: YELLOW }}
                  >
                    <Plus size={13} /> Facture
                  </button>
                  <button
                    onClick={() => goNewDoc("devis")}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${isDark ? "border-white/[0.1] text-white/60 hover:bg-white/[0.07]" : "border-gray-200 text-gray-500 hover:bg-gray-100"}`}
                  >
                    <Plus size={13} /> Devis
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── KPIs ── */}
          {stats && (
            <div className={`grid grid-cols-2 gap-px border-t sm:grid-cols-4 ${tdivider}`}>
              {[
                { label: "Factures",      value: String(stats.nbFactures),  color: YELLOW,                   icon: ReceiptText   },
                { label: "CA facturé",    value: fmt(stats.totalFacture),   color: "#a78bfa",                icon: TrendingUp    },
                { label: "CA encaissé",   value: fmt(stats.totalEncaisse),  color: "#34d399",                icon: TrendingDown  },
                { label: "Impayé",        value: fmt(stats.totalImpaye),    color: stats.totalImpaye > 0 ? "#f87171" : "#34d399", icon: AlertTriangle },
              ].map(k => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className={`p-4 ${isDark ? "bg-white/[0.015]" : "bg-gray-50"}`}>
                    <div className={`mb-1 flex items-center gap-1.5 text-[11px] ${tsub}`}>
                      <Icon size={11} style={{ color: k.color }} /> {k.label}
                    </div>
                    <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

          {/* ── Documents ── */}
          <div className={`overflow-hidden rounded-2xl border ${tbgCard}`}>
            {/* Tabs */}
            <div className={`flex gap-1 border-b p-3 ${tdivider}`}>
              {(["factures", "devis"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                  style={tab === t
                    ? { background: `${YELLOW}15`, color: YELLOW }
                    : { color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280" }}
                >
                  {t === "factures" ? `Factures (${factures.length})` : `Devis (${devis.length})`}
                </button>
              ))}
            </div>

            {displayDocs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                {tab === "factures"
                  ? <ReceiptText size={28} className={isDark ? "text-white/15" : "text-gray-300"} />
                  : <FileSignature size={28} className={isDark ? "text-white/15" : "text-gray-300"} />}
                <p className={`text-sm ${tsub}`}>Aucun{tab === "devis" ? " devis" : "e facture"} lié{tab === "devis" ? "" : "e"} à ce client.</p>
                <button
                  onClick={() => goNewDoc(tab === "factures" ? "facture" : "devis")}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-black"
                  style={{ background: YELLOW }}>
                  <Plus size={13} /> {tab === "factures" ? "Créer une facture" : "Créer un devis"}
                </button>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
                {displayDocs.map(doc => {
                  const isOverdue = doc.statut === "en_retard" ||
                    (doc.statut === "envoyé" && doc.date_echeance && new Date(doc.date_echeance) < new Date());
                  return (
                    <Link
                      key={doc.id}
                      href={`/client/factures/documents?id=${doc.id}`}
                      className={`flex items-center justify-between gap-3 px-4 py-3 transition ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${ttext}`}>{doc.numero}</span>
                          <DocStatutBadge statut={doc.statut} />
                          {isOverdue && <span className="text-[10px] font-bold text-red-400">EN RETARD</span>}
                        </div>
                        {doc.sujet && (
                          <div className={`mt-0.5 truncate text-xs ${tsub}`}>{doc.sujet}</div>
                        )}
                        <div className={`flex items-center gap-3 text-[11px] ${isDark ? "text-white/25" : "text-gray-400"}`}>
                          <span className="flex items-center gap-1">
                            <Calendar size={9} /> {fmtDate(doc.date_document)}
                          </span>
                          {doc.date_echeance && (
                            <span className="flex items-center gap-1" style={{ color: isOverdue ? "#f87171" : undefined }}>
                              <Clock size={9} /> Éch. {fmtDate(doc.date_echeance)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${ttext}`}>{fmt(doc.total_ttc)}</div>
                        {doc.montant_paye > 0 && doc.montant_paye < doc.total_ttc && (
                          <div className="text-[10px]" style={{ color: "#34d399" }}>↗ {fmt(doc.montant_paye)} payé</div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Colonne droite : infos ── */}
          <div className="space-y-4">

            {/* Contact */}
            <div className={`rounded-2xl border p-4 ${tbgCard}`}>
              <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>Contact</h3>
              <div className="space-y-2.5">
                {client.email && (
                  <a href={`mailto:${client.email}`}
                    className={`flex items-center gap-2.5 text-sm transition ${isDark ? "text-white/60 hover:text-white/80" : "text-gray-600 hover:text-gray-900"}`}>
                    <Mail size={13} className="shrink-0" style={{ color: YELLOW }} />
                    <span className="truncate">{client.email}</span>
                  </a>
                )}
                {client.telephone && (
                  <a href={`tel:${client.indicatif_pays}${client.telephone}`}
                    className={`flex items-center gap-2.5 text-sm ${isDark ? "text-white/60" : "text-gray-600"}`}>
                    <Phone size={13} className="shrink-0" style={{ color: YELLOW }} />
                    {client.indicatif_pays} {client.telephone}
                  </a>
                )}
                {client.site_web && (
                  <a href={client.site_web} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 text-sm transition ${isDark ? "text-white/60 hover:text-white/80" : "text-gray-600 hover:text-gray-900"}`}>
                    <ExternalLink size={13} className="shrink-0" style={{ color: YELLOW }} />
                    <span className="truncate">{client.site_web.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
                {(client.adresse || client.ville) && (
                  <div className={`flex items-start gap-2.5 text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>
                    <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: YELLOW }} />
                    <div>
                      {client.adresse && <div>{client.adresse}</div>}
                      <div>{[client.code_postal, client.ville].filter(Boolean).join(" ")}{client.region ? `, ${client.region}` : ""}</div>
                      {client.pays && <div>{PAYS_OPTIONS[client.pays] || client.pays}</div>}
                    </div>
                  </div>
                )}
                {!client.email && !client.telephone && !client.site_web && !client.adresse && (
                  <p className={`text-xs ${tsub}`}>Aucune coordonnée renseignée.</p>
                )}
              </div>
            </div>

            {/* Infos professionnelles */}
            {(client.identifiant_legal || client.num_tva || client.conditions_paiement || client.regime_fiscal) && (
              <div className={`rounded-2xl border p-4 ${tbgCard}`}>
                <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>Profil commercial</h3>
                <div className="space-y-2">
                  {client.identifiant_legal && (
                    <InfoRow label="Identifiant légal" value={client.identifiant_legal} isDark={isDark} />
                  )}
                  {client.num_tva && (
                    <InfoRow label="N° TVA" value={client.num_tva} isDark={isDark} />
                  )}
                  {client.conditions_paiement && (
                    <InfoRow label="Paiement" value={CONDITIONS_LABEL[client.conditions_paiement] || client.conditions_paiement} isDark={isDark} />
                  )}
                  {client.regime_fiscal && (
                    <InfoRow label="Régime fiscal" value={client.regime_fiscal} isDark={isDark} />
                  )}
                  {client.devise && (
                    <InfoRow label="Devise" value={client.devise} isDark={isDark} />
                  )}
                  {client.langue && (
                    <InfoRow label="Langue" value={LANGUE_LABEL[client.langue] || client.langue} isDark={isDark} />
                  )}
                  {client.contact_facturation && (
                    <InfoRow label="Contact fact." value={client.contact_facturation} isDark={isDark} />
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className={`rounded-2xl border p-4 ${tbgCard}`}>
                <h3 className={`mb-2 text-xs font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>Notes internes</h3>
                <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? "text-white/50" : "text-gray-500"}`}>{client.notes}</p>
              </div>
            )}

            {/* Alerte retard */}
            {stats && stats.facturesEnRetard > 0 && (
              <div className="rounded-2xl border border-red-500/20 p-4" style={{ background: "rgba(248,113,113,0.06)" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">
                    {stats.facturesEnRetard} facture{stats.facturesEnRetard !== 1 ? "s" : ""} en retard
                  </p>
                </div>
                <p className="mt-1 text-xs text-red-400/60">
                  Montant impayé : {fmt(stats.totalImpaye)}
                </p>
              </div>
            )}

            {/* Archiver */}
            {client.statut !== "archivé" && (
              <button
                onClick={() => void handleArchive()}
                disabled={archiving}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${isDark ? "border-white/[0.08] text-white/30 hover:border-red-500/30 hover:text-red-400" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500"}`}
              >
                {archiving ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                Archiver ce client
              </button>
            )}

            {/* Date création */}
            <p className={`text-center text-[11px] ${isDark ? "text-white/15" : "text-gray-300"}`}>
              Client créé le {fmtDate(client.created_at)}
            </p>
          </div>
        </div>

        <div className="pb-24 md:pb-20" />
      </div>
    </div>
  );
}

function InfoRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className={`shrink-0 text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>{label}</span>
      <span className={`text-right text-xs font-medium ${isDark ? "text-white/60" : "text-gray-600"}`}>{value}</span>
    </div>
  );
}
