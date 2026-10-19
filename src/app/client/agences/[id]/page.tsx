"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Briefcase, Building2, Mail, Phone, Globe, MapPin,
  Star, Pencil, Trash2, Loader2, Plus, X, Check, Calendar,
  FileText, MessageSquare, DollarSign, Clock, ChevronRight,
  Linkedin, ExternalLink,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import type { Vendor, VendorMission, VendorDocument, MissionStatus } from "@/lib/vendors/types";
import {
  VENDOR_TYPE_LABELS, VENDOR_RELATIONSHIP_LABELS,
  VENDOR_STATUS_LABELS, MISSION_STATUS_LABELS,
} from "@/lib/vendors/types";

const ease = [0.22, 1, 0.36, 1] as const;

const MISSION_STATUS_COLORS: Record<MissionStatus, string> = {
  prospect:  "#f59e0b",
  en_cours:  "#6366f1",
  terminee:  "#10b981",
  annulee:   "#6b7280",
};

type Tab = "info" | "missions" | "documents" | "notes";

interface MissionFormState {
  title: string;
  status: MissionStatus;
  start_date: string;
  end_date: string;
  amount: string;
  currency: string;
  description: string;
}

const EMPTY_MISSION: MissionFormState = {
  title: "", status: "en_cours", start_date: "", end_date: "",
  amount: "", currency: "EUR", description: "",
};

export default function VendorDetailPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [vendor, setVendor]     = useState<Vendor | null>(null);
  const [missions, setMissions] = useState<VendorMission[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<Tab>("info");

  const [missionModal, setMissionModal] = useState(false);
  const [missionForm, setMissionForm]   = useState<MissionFormState>(EMPTY_MISSION);
  const [savingMission, setSavingMission] = useState(false);
  const [deleteMissionId, setDeleteMissionId] = useState<string | null>(null);

  const [ratingUpdating, setRatingUpdating] = useState(false);

  const s = {
    page:  isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]",
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]" : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85" : "text-gray-800",
    muted: isDark ? "text-white/35" : "text-gray-400",
    sub:   isDark ? "text-white/55" : "text-gray-500",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"} focus:border-[#c9a55a]/60`,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, mRes] = await Promise.all([
        fetch(`/api/vendors/${id}`),
        fetch(`/api/vendors/${id}/missions`),
      ]);
      if (!vRes.ok) throw new Error("Prestataire introuvable");
      const vData = await vRes.json();
      const mData = mRes.ok ? await mRes.json() : { missions: [] };
      setVendor(vData.vendor);
      setMissions(mData.missions ?? []);
      setDocuments(vData.documents ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateRating(rating: number) {
    if (!vendor) return;
    setRatingUpdating(true);
    try {
      await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setVendor(v => v ? { ...v, rating } : v);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setRatingUpdating(false);
    }
  }

  async function saveMission() {
    if (!missionForm.title.trim()) return;
    setSavingMission(true);
    try {
      const payload = {
        title:       missionForm.title.trim(),
        status:      missionForm.status,
        start_date:  missionForm.start_date || null,
        end_date:    missionForm.end_date || null,
        amount:      missionForm.amount ? Number(missionForm.amount) : null,
        currency:    missionForm.currency,
        description: missionForm.description || null,
      };
      const res = await fetch(`/api/vendors/${id}/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMissions(prev => [data.mission, ...prev]);
      setMissionModal(false);
      setMissionForm(EMPTY_MISSION);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSavingMission(false);
    }
  }

  async function deleteMission(missionId: string) {
    try {
      await fetch(`/api/vendors/missions/${missionId}`, { method: "DELETE" });
      setMissions(prev => prev.filter(m => m.id !== missionId));
      setDeleteMissionId(null);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  async function updateMissionStatus(missionId: string, status: MissionStatus) {
    try {
      const res = await fetch(`/api/vendors/missions/${missionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setMissions(prev => prev.map(m => m.id === missionId ? data.mission : m));
    } catch (e: unknown) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className={`min-h-full flex items-center justify-center ${s.page}`}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#c9a55a" }} />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className={`min-h-full flex flex-col items-center justify-center gap-4 ${s.page}`}>
        <p className={`text-[13px] ${s.muted}`}>{error ?? "Prestataire introuvable"}</p>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px]" style={{ color: "#c9a55a" }}>
          <ArrowLeft size={14} /> Retour
        </button>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "info",      label: "Informations" },
    { key: "missions",  label: "Missions",  count: missions.length },
    { key: "documents", label: "Documents", count: documents.length },
    { key: "notes",     label: "Notes" },
  ];

  return (
    <div className={`min-h-full pb-20 ${s.page}`}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
            <ArrowLeft size={16} className={s.muted} />
          </button>
          <span className={`text-[11px] ${s.muted}`}>Prestataires & Partenaires</span>
        </div>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "#c9a55a18" }}>
              <Building2 size={22} style={{ color: "#c9a55a" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-[18px] font-black ${s.text} leading-tight`}>{vendor.name}</h1>
                <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                  style={{ background: vendor.status === "actif" ? "#10b98122" : vendor.status === "prospect" ? "#f59e0b22" : "#6b728022", color: vendor.status === "actif" ? "#10b981" : vendor.status === "prospect" ? "#f59e0b" : "#6b7280" }}>
                  {VENDOR_STATUS_LABELS[vendor.status]}
                </span>
              </div>
              <p className={`text-[12px] ${s.sub} mt-0.5`}>
                {VENDOR_TYPE_LABELS[vendor.type as keyof typeof VENDOR_TYPE_LABELS]}
                {vendor.country && ` · ${vendor.city ?? vendor.country}`}
              </p>
              {/* Rating */}
              <div className="flex items-center gap-1 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => updateRating(i + 1)} disabled={ratingUpdating}
                    className="transition hover:scale-110 active:scale-95">
                    <Star size={13}
                      fill={i < vendor.rating ? "#c9a55a" : "transparent"}
                      style={{ color: i < vendor.rating ? "#c9a55a" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-0 px-4 mb-3 border-b ${isDark ? "border-white/[0.07]" : "border-black/[0.07]"}`}>
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-3 py-2.5 text-[12px] font-semibold transition border-b-2 -mb-px ${
              tab === key
                ? "border-[#c9a55a] text-[#c9a55a]"
                : `border-transparent ${s.muted} hover:${s.sub}`
            }`}>
            {label}{count !== undefined && count > 0 ? ` (${count})` : ""}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {/* Tab: Informations */}
        {tab === "info" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
            className="space-y-3">
            {/* Contact principal */}
            {(vendor.contact_name || vendor.contact_email || vendor.contact_phone) && (
              <div className={`rounded-2xl border p-4 ${s.card}`}>
                <h3 className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted} mb-3`}>Contact principal</h3>
                <div className="space-y-2">
                  {vendor.contact_name && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#c9a55a18" }}>
                        <Briefcase size={12} style={{ color: "#c9a55a" }} />
                      </div>
                      <span className={`text-[13px] font-semibold ${s.text}`}>{vendor.contact_name}</span>
                      {vendor.contact_role && <span className={`text-[11px] ${s.muted}`}>· {vendor.contact_role}</span>}
                    </div>
                  )}
                  {vendor.contact_email && (
                    <a href={`mailto:${vendor.contact_email}`}
                      className={`flex items-center gap-2 text-[12.5px] ${s.sub} hover:text-[#c9a55a] transition`}>
                      <Mail size={13} /> {vendor.contact_email}
                    </a>
                  )}
                  {vendor.contact_phone && (
                    <a href={`tel:${vendor.contact_phone}`}
                      className={`flex items-center gap-2 text-[12.5px] ${s.sub} hover:text-[#c9a55a] transition`}>
                      <Phone size={13} /> {vendor.contact_phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Coordonnées */}
            <div className={`rounded-2xl border p-4 ${s.card}`}>
              <h3 className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted} mb-3`}>Coordonnées</h3>
              <div className="space-y-2">
                {vendor.website && (
                  <a href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 text-[12.5px] ${s.sub} hover:text-[#c9a55a] transition`}>
                    <Globe size={13} /> {vendor.website.replace(/^https?:\/\//, "")}
                    <ExternalLink size={10} />
                  </a>
                )}
                {vendor.linkedin && (
                  <a href={vendor.linkedin} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 text-[12.5px] ${s.sub} hover:text-[#c9a55a] transition`}>
                    <Linkedin size={13} /> LinkedIn
                    <ExternalLink size={10} />
                  </a>
                )}
                {(vendor.city || vendor.country) && (
                  <div className={`flex items-center gap-2 text-[12.5px] ${s.sub}`}>
                    <MapPin size={13} /> {[vendor.city, vendor.address, vendor.country].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Fiche */}
            <div className={`rounded-2xl border p-4 ${s.card}`}>
              <h3 className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted} mb-3`}>Fiche</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { label: "Relation", value: VENDOR_RELATIONSHIP_LABELS[vendor.relationship as keyof typeof VENDOR_RELATIONSHIP_LABELS] },
                  { label: "Statut", value: VENDOR_STATUS_LABELS[vendor.status] },

                  { label: "Depuis", value: vendor.since ? new Date(vendor.since).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "—" },
                  { label: "Missions", value: String(missions.length) },
                  { label: "Évaluation", value: vendor.rating > 0 ? `${vendor.rating}/5` : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className={`text-[10px] ${s.muted}`}>{label}</p>
                    <p className={`text-[12.5px] font-semibold ${s.text}`}>{value}</p>
                  </div>
                ))}
              </div>
              {Array.isArray(vendor.specialities) && vendor.specialities.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                  <p className={`text-[10px] ${s.muted} mb-1.5`}>Spécialités</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.specialities.map(sp => (
                      <span key={sp} className="rounded-lg px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ background: "#c9a55a18", color: "#c9a55a" }}>
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Missions */}
        {tab === "missions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
            className="space-y-2">
            <button onClick={() => setMissionModal(true)}
              className="w-full rounded-2xl py-3 text-[12px] font-bold flex items-center justify-center gap-2 text-white"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
              <Plus size={14} /> Nouvelle mission
            </button>

            {missions.length === 0 ? (
              <div className={`rounded-2xl border p-6 text-center ${s.card}`}>
                <Briefcase size={24} className="mx-auto mb-2 opacity-30" style={{ color: "#c9a55a" }} />
                <p className={`text-[12px] ${s.muted}`}>Aucune mission enregistrée</p>
              </div>
            ) : (
              missions.map(m => (
                <div key={m.id} className={`rounded-2xl border p-3.5 ${s.card}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[13px] font-bold ${s.text} truncate`}>{m.title}</span>
                        <select value={m.status}
                          onChange={e => updateMissionStatus(m.id, e.target.value as MissionStatus)}
                          onClick={e => e.stopPropagation()}
                          className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide border-0 outline-none cursor-pointer"
                          style={{ background: MISSION_STATUS_COLORS[m.status] + "22", color: MISSION_STATUS_COLORS[m.status] }}>
                          {Object.entries(MISSION_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      {m.description && <p className={`text-[11.5px] ${s.muted} mt-0.5`}>{m.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {m.start_date && (
                          <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                            <Calendar size={10} /> {new Date(m.start_date).toLocaleDateString("fr-FR")}
                            {m.end_date ? ` → ${new Date(m.end_date).toLocaleDateString("fr-FR")}` : ""}
                          </span>
                        )}
                        {m.amount != null && (
                          <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                            <DollarSign size={10} /> {m.amount.toLocaleString("fr-FR")} {m.currency}
                          </span>
                        )}
                        {m.project && (
                          <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                            <FileText size={10} /> {m.project.title}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setDeleteMissionId(m.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition shrink-0">
                      <Trash2 size={12} className="text-red-400/60" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Tab: Documents */}
        {tab === "documents" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
            className="space-y-2">
            {documents.length === 0 ? (
              <div className={`rounded-2xl border p-6 text-center ${s.card}`}>
                <FileText size={24} className="mx-auto mb-2 opacity-30" style={{ color: "#c9a55a" }} />
                <p className={`text-[12px] ${s.muted}`}>Aucun document associé</p>
                <p className={`text-[11px] ${s.muted} mt-1`}>Les contrats et devis liés apparaîtront ici</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className={`rounded-2xl border p-3.5 flex items-center gap-3 ${s.card}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#c9a55a18" }}>
                    <FileText size={16} style={{ color: "#c9a55a" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold ${s.text} truncate`}>{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] ${s.muted}`}>{doc.document_type}</span>
                      {doc.doc_date && <span className={`text-[11px] ${s.muted}`}>{new Date(doc.doc_date).toLocaleDateString("fr-FR")}</span>}
                    </div>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-[#c9a55a]/10 transition">
                      <ExternalLink size={13} style={{ color: "#c9a55a" }} />
                    </a>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Tab: Notes */}
        {tab === "notes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <VendorNotesEditor vendor={vendor} isDark={isDark} s={s} onSaved={setVendor} />
          </motion.div>
        )}
      </div>

      {/* Mission Create Modal */}
      <AnimatePresence>
        {missionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className={`w-full max-w-lg rounded-t-3xl overflow-hidden ${isDark ? "bg-[#0d0e15]" : "bg-white"}`}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouvelle mission</h2>
                <button onClick={() => setMissionModal(false)}
                  className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
                  <X size={16} className={s.muted} />
                </button>
              </div>
              <div className="px-5 pb-6 pt-4 space-y-3 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Titre *</label>
                  <input value={missionForm.title} onChange={e => setMissionForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex. Développement site vitrine" className={s.input} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Statut</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["prospect", "en_cours", "terminee"] as MissionStatus[]).map(st => (
                      <button key={st} onClick={() => setMissionForm(f => ({ ...f, status: st }))}
                        className="flex-1 rounded-xl py-2 text-[11px] font-semibold transition border min-w-[80px]"
                        style={missionForm.status === st
                          ? { background: MISSION_STATUS_COLORS[st] + "22", color: MISSION_STATUS_COLORS[st], borderColor: MISSION_STATUS_COLORS[st] + "60" }
                          : { background: "transparent", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" }}>
                        {MISSION_STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Début</label>
                    <input type="date" value={missionForm.start_date} onChange={e => setMissionForm(f => ({ ...f, start_date: e.target.value }))}
                      className={s.input} />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Fin</label>
                    <input type="date" value={missionForm.end_date} onChange={e => setMissionForm(f => ({ ...f, end_date: e.target.value }))}
                      className={s.input} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Montant</label>
                    <input type="number" value={missionForm.amount} onChange={e => setMissionForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0" className={s.input} />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Devise</label>
                    <select value={missionForm.currency} onChange={e => setMissionForm(f => ({ ...f, currency: e.target.value }))}
                      className={s.input}>
                      {["EUR", "USD", "CHF", "CAD", "MAD", "XOF"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Description</label>
                  <textarea value={missionForm.description} onChange={e => setMissionForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Détails de la mission..." rows={3} className={`${s.input} resize-none`} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setMissionModal(false)}
                    className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"}`}>
                    Annuler
                  </button>
                  <button onClick={saveMission} disabled={savingMission || !missionForm.title.trim()}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
                    {savingMission ? <Loader2 size={14} className="animate-spin" /> : null}
                    Créer la mission
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Mission Confirm */}
      <AnimatePresence>
        {deleteMissionId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-xs rounded-3xl p-6 ${isDark ? "bg-[#0d0e15]" : "bg-white"}`}>
              <h3 className={`text-[14px] font-black text-center ${s.text} mb-1`}>Supprimer cette mission ?</h3>
              <p className={`text-[11.5px] text-center ${s.muted} mb-5`}>Cette action est irréversible.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteMissionId(null)}
                  className={`flex-1 rounded-xl py-2.5 text-[12px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"}`}>
                  Annuler
                </button>
                <button onClick={() => deleteMission(deleteMissionId)}
                  className="flex-1 rounded-xl py-2.5 text-[12px] font-bold text-white bg-red-500">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sous-composant notes inline pour garder la page plus lisible
function VendorNotesEditor({
  vendor, isDark, s,
  onSaved,
}: {
  vendor: Vendor;
  isDark: boolean;
  s: Record<string, string>;
  onSaved: (v: Vendor) => void;
}) {
  const [notes, setNotes] = useState(vendor.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onSaved(data.vendor);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-4 ${s.card}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}>Notes internes</h3>
        {saved && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-500">
            <Check size={11} /> Enregistré
          </span>
        )}
      </div>
      <textarea
        value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Contexte de la relation, points importants, impressions, prochaines étapes..."
        rows={8}
        className={`${s.input} resize-none`} />
      <button onClick={save} disabled={saving || notes === (vendor.notes ?? "")}
        className="mt-3 w-full rounded-xl py-2.5 text-[12.5px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : null}
        Enregistrer les notes
      </button>
    </div>
  );
}
