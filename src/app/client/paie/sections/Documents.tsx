"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen, Upload, FileText, Download, Trash2, X,
  Search, Filter, CheckCircle2, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employe, RhDocument } from "../rh-types";
import { avatarGradient, fmtDateShort } from "../rh-utils";

interface Props {
  userId: string | null;
  employes: Employe[];
  add: (msg: string, type?: "success" | "error") => void;
  isDark: boolean;
}

const DOC_TYPES = ["contrat", "avenant", "bulletin", "attestation", "justificatif", "courrier", "autre"] as const;
const DOC_LABELS: Record<string, string> = {
  contrat: "Contrat", avenant: "Avenant", bulletin: "Bulletin",
  attestation: "Attestation", justificatif: "Justificatif",
  courrier: "Courrier", autre: "Autre",
};
const DOC_COLORS: Record<string, string> = {
  contrat: "#10b981", avenant: "#f59e0b", bulletin: "#c9a55a",
  attestation: "#60a5fa", justificatif: "#a855f7", courrier: "#f43f5e", autre: "#6b7280",
};

const BUCKET = "rh-documents";

export default function DocumentsSection({ userId, employes, add, isDark }: Props) {
  const [documents,  setDocuments]  = useState<RhDocument[]>([]);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [empFilter,  setEmpFilter]  = useState<string>("all");
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [form, setForm] = useState({
    titre: "", type: "autre", employe_id: "",
    file: null as File | null,
  });

  const card  = isDark ? "border border-white/[0.06] bg-white/[0.04]" : "border border-black/[0.08] bg-white shadow-sm";
  const pri   = isDark ? "text-white"    : "text-gray-900";
  const sec   = isDark ? "text-white/70" : "text-gray-600";
  const mut   = isDark ? "text-white/40" : "text-gray-400";
  const faint = isDark ? "text-white/20" : "text-gray-300";
  const inp   = isDark
    ? "border-white/[0.08] bg-white/[0.06] text-white placeholder-white/20 focus:border-white/20 [color-scheme:dark]"
    : "border-black/[0.08] bg-black/[0.03] text-gray-900 placeholder-gray-400 focus:border-black/20";

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from("rh_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setDocuments((data as RhDocument[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const empName = (id?: string | null) =>
    id ? employes.find(e => e.id === id)?.nom ?? "—" : "—";

  const filtered = documents.filter(d => {
    const matchSearch = !search.trim() ||
      d.titre.toLowerCase().includes(search.toLowerCase()) ||
      empName(d.employe_id).toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;
    const matchEmp  = empFilter === "all" || d.employe_id === empFilter;
    return matchSearch && matchType && matchEmp;
  });

  const upload = async () => {
    if (!userId || !form.titre.trim()) { add("Titre requis", "error"); return; }
    setUploading(true);
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    if (form.file) {
      const ext  = form.file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, form.file, { upsert: false });
      if (upErr) { add("Erreur upload : " + upErr.message, "error"); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      fileUrl  = urlData.publicUrl;
      fileName = form.file.name;
      fileSize = form.file.size;
    }

    const { error } = await supabase.from("rh_documents").insert({
      user_id:    userId,
      employe_id: form.employe_id || null,
      type:       form.type,
      titre:      form.titre.trim(),
      file_url:   fileUrl,
      file_name:  fileName,
      file_size:  fileSize,
    });
    setUploading(false);
    if (error) { add("Erreur : " + error.message, "error"); return; }
    add("Document ajouté", "success");
    setForm({ titre: "", type: "autre", employe_id: "", file: null });
    setShowForm(false);
    await load();
  };

  const deleteDoc = async (doc: RhDocument) => {
    if (!confirm(`Supprimer "${doc.titre}" ?`)) return;
    if (doc.file_url) {
      const path = doc.file_url.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    await supabase.from("rh_documents").delete().eq("id", doc.id);
    add("Document supprimé", "success");
    await load();
  };

  const fmtSize = (s?: number) => {
    if (!s) return "";
    if (s < 1024)       return `${s} o`;
    if (s < 1024 * 1024) return `${Math.round(s / 1024)} Ko`;
    return `${(s / 1024 / 1024).toFixed(1)} Mo`;
  };

  const countByType = (t: string) => documents.filter(d => d.type === t).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${faint}`}>Ressources Humaines</p>
          <h2 className={`mt-1 text-2xl font-black ${pri}`}>Documents RH</h2>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-xl py-2.5 px-4 text-sm font-bold transition hover:brightness-110 self-start"
          style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
          <Upload size={14} /> Ajouter un document
        </button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-white/[0.08] bg-white/[0.04]" : "border-black/[0.08] bg-black/[0.02]"}`}>
          <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <p className={`font-bold ${pri}`}>Nouveau document</p>
            <button onClick={() => setShowForm(false)} className={`h-7 w-7 flex items-center justify-center rounded-lg ${isDark ? "text-white/30 hover:bg-white/8" : "text-gray-400 hover:bg-black/5"}`}>
              <X size={13} />
            </button>
          </div>
          <div className="space-y-4 px-5 py-5">
            <input type="text" placeholder="Titre du document *" value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Type */}
              <div>
                <p className={`mb-2 text-xs font-semibold ${mut}`}>Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {DOC_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className="rounded-lg border px-2.5 py-1 text-xs font-bold transition"
                      style={form.type === t
                        ? { background: DOC_COLORS[t] + "20", borderColor: DOC_COLORS[t] + "40", color: DOC_COLORS[t] }
                        : isDark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }
                                 : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "#6b7280" }}>
                      {DOC_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Salarié */}
              <div>
                <p className={`mb-2 text-xs font-semibold ${mut}`}>Salarié (optionnel)</p>
                <select value={form.employe_id} onChange={e => setForm(f => ({ ...f, employe_id: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`}>
                  <option value="">Aucun (document général)</option>
                  {employes.filter(e => e.actif).map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                </select>
              </div>
            </div>
            <div>
              <p className={`mb-2 text-xs font-semibold ${mut}`}>Fichier (optionnel)</p>
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.png,.odt"
                onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp}`} />
              {form.file && <p className={`mt-1 text-xs ${mut}`}>{form.file.name} ({fmtSize(form.file.size)})</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? "border-white/8 text-white/40" : "border-black/8 text-gray-400"}`}>
                Annuler
              </button>
              <button onClick={upload} disabled={uploading}
                className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                {uploading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats par type */}
      <div className="flex flex-wrap gap-2">
        {DOC_TYPES.map(t => countByType(t) > 0 && (
          <button key={t} onClick={() => setTypeFilter(f => f === t ? "all" : t)}
            className="rounded-xl border px-3 py-1.5 text-xs font-bold transition"
            style={typeFilter === t
              ? { background: DOC_COLORS[t] + "20", borderColor: DOC_COLORS[t] + "40", color: DOC_COLORS[t] }
              : isDark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }
                       : { background: "rgba(0,0,0,0.03)", borderColor: "rgba(0,0,0,0.08)", color: "#9ca3af" }}>
            {DOC_LABELS[t]} · {countByType(t)}
          </button>
        ))}
      </div>

      {/* Recherche + filtre salarié */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={13} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${mut}`} />
          <input type="text" placeholder="Rechercher un document…" value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none ${inp}`} />
        </div>
        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
          className={`rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inp} sm:w-56`}>
          <option value="all">Tous les salariés</option>
          <option value="">Sans salarié</option>
          {employes.filter(e => e.actif).map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className={`animate-spin ${mut}`} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FolderOpen size={32} className={faint} />
          <p className={`font-bold ${mut}`}>{documents.length === 0 ? "Aucun document" : "Aucun résultat"}</p>
          <p className={`text-sm ${faint}`}>{documents.length === 0 ? "Ajoutez votre premier document RH" : "Modifiez les filtres"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const color = DOC_COLORS[doc.type] ?? "#6b7280";
            const emp   = doc.employe_id ? employes.find(e => e.id === doc.employe_id) : null;
            return (
              <div key={doc.id} className={`flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 ${card}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: color + "15" }}>
                  <FileText size={16} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold ${pri}`}>{doc.titre}</p>
                    <span className="rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: color + "15", color }}>
                      {DOC_LABELS[doc.type] ?? doc.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {emp && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded flex items-center justify-center text-[9px] font-black text-white shrink-0"
                          style={{ background: avatarGradient(emp.id) }}>
                          {emp.nom[0].toUpperCase()}
                        </div>
                        <span className={`text-xs ${mut}`}>{emp.nom}</span>
                      </div>
                    )}
                    {!emp && <span className={`text-xs ${faint}`}>Document général</span>}
                    <span className={`text-xs ${faint}`}>{fmtDateShort(doc.created_at)}</span>
                    {doc.file_name && <span className={`text-xs ${faint}`}>{doc.file_name} {doc.file_size ? `· ${fmtSize(doc.file_size)}` : ""}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isDark ? "text-white/30 hover:bg-white/8 hover:text-white/70" : "text-gray-400 hover:bg-black/5 hover:text-gray-700"}`}>
                      <Download size={14} />
                    </a>
                  )}
                  <button onClick={() => deleteDoc(doc)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isDark ? "text-white/20 hover:bg-red-500/10 hover:text-red-400" : "text-gray-300 hover:bg-red-50 hover:text-red-400"}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
