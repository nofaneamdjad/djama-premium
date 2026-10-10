"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Paperclip, Trash2, RefreshCw, FileText, Download, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { tok, fmtDate, GOLD } from "../decl-utils";
import type { Justificatif } from "../decl-types";

interface Props {
  userId: string | null;
  isDark: boolean;
  add: (msg: string, type?: "success" | "error") => void;
}

const BUCKET = "decl-justificatifs";
const DOC_TYPES = ["bilan","liasse_fiscale","facture","releve_bancaire","attestation","contrat","autre"];
const CONSERVATION: Record<string, number> = { bilan: 10, liasse_fiscale: 10, facture: 10, releve_bancaire: 5, attestation: 5, contrat: 10, autre: 6 };

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

export default function DocumentsSection({ userId, isDark, add }: Props) {
  const t = tok(isDark);
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Justificatif[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("autre");
  const [titre, setTitre] = useState("");
  const [filterType, setFilterType] = useState("tous");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase.from("decl_justificatifs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDocs((data as Justificatif[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function upload(file: File) {
    if (!userId) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
    if (upErr) {
      setUploading(false);
      add("Erreur upload : " + upErr.message, "error");
      return;
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { error: insErr } = await supabase.from("decl_justificatifs").insert({
      user_id: userId,
      titre: titre.trim() || file.name,
      type_document: docType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      duree_conservation_ans: CONSERVATION[docType] ?? 6,
    });
    setUploading(false);
    if (insErr) { add("Erreur enregistrement : " + insErr.message, "error"); return; }
    add("Document ajouté", "success");
    setTitre("");
    const { data } = await supabase.from("decl_justificatifs").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setDocs((data as Justificatif[]) ?? []);
  }

  async function deleteDoc(doc: Justificatif) {
    if (doc.file_url) {
      const path = doc.file_url.split(`${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    await supabase.from("decl_justificatifs").delete().eq("id", doc.id);
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    add("Document supprimé", "success");
  }

  const filtered = filterType === "tous" ? docs : docs.filter(d => d.type_document === filterType);

  const inputStyle = { background: t.glassMd, border: `1px solid ${t.border}`, color: t.text };

  return (
    <div className="space-y-5">
      {/* Zone d'upload */}
      <div
        className="rounded-2xl p-5"
        style={{ background: t.glass, border: `2px dashed ${t.border}` }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start mb-4">
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Titre</label>
            <input
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="ex. Bilan 2025"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: t.text3 }}>Type</label>
            <select className="w-full rounded-xl px-3 py-2.5 text-sm outline-none capitalize" style={inputStyle}
              value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.jpg,.png"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: GOLD, color: "#111" }}
        >
          {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Chargement…" : "Choisir un fichier"}
        </button>
        <p className="text-[11px] mt-2" style={{ color: t.text4 }}>
          ou glissez-déposez ici · PDF, Word, Excel, images
        </p>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {["tous", ...DOC_TYPES].map(ft => (
          <button key={ft} onClick={() => setFilterType(ft)}
            className="text-xs px-3 py-1.5 rounded-full capitalize transition-all"
            style={filterType === ft
              ? { background: GOLD, color: "#111" }
              : { background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}>
            {ft.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Note conservation */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
        <Info size={12} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
        <p className="text-[11px]" style={{ color: t.text3 }}>
          Durées légales indicatives : bilans/liasses et factures 10 ans, relevés bancaires 5 ans, contrats 10 ans.
          Vérifiez les durées applicables à votre situation avec votre expert-comptable.
        </p>
      </div>

      {loading && (
        <div className="py-12 text-center"><RefreshCw size={18} className="animate-spin mx-auto" style={{ color: t.text3 }} /></div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl py-12 text-center" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          <Paperclip size={20} className="mx-auto mb-3" style={{ color: t.text3 }} />
          <p className="text-sm" style={{ color: t.text3 }}>
            {docs.length === 0 ? "Aucun document stocké" : "Aucun document de ce type"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
          {filtered.map((doc, i) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${GOLD}15` }}>
                <FileText size={15} style={{ color: GOLD }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: t.text }}>{doc.titre}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] capitalize px-1.5 py-0.5 rounded" style={{ background: t.glassMd, color: t.text3 }}>
                    {doc.type_document.replace("_", " ")}
                  </span>
                  {doc.file_size != null && (
                    <span className="text-[10px]" style={{ color: t.text4 }}>{fmtSize(doc.file_size)}</span>
                  )}
                  <span className="text-[10px]" style={{ color: t.text4 }}>{fmtDate(doc.created_at)}</span>
                  <span className="text-[10px]" style={{ color: t.text4 }}>· Conservation {doc.duree_conservation_ans} ans</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: t.glassMd, border: `1px solid ${t.border}` }}
                  >
                    <Download size={13} style={{ color: t.text2 }} />
                  </a>
                )}
                <button
                  onClick={() => deleteDoc(doc)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <Trash2 size={13} style={{ color: "#ef4444" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
