"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText, Download, Eye, Calendar, Users, User, Hash,
  Search, Filter, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

type Doc = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  share_target: "all" | "group" | "member";
  can_download: boolean;
  can_edit: boolean;
  expires_at: string | null;
  created_at: string;
  shared_by: string;
};

function fileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function shareIcon(target: string) {
  if (target === "all")    return <Users size={13} style={{ color: GOLD }} />;
  if (target === "group")  return <Hash  size={13} style={{ color: "#60a5fa" }} />;
  return <User size={13} style={{ color: "#a78bfa" }} />;
}

function shareLabel(target: string) {
  if (target === "all")    return "Toute l'org";
  if (target === "group")  return "Groupe";
  return "Personnel";
}

export default function MembreDocuments() {
  const [orgId, setOrgId]       = useState<string | null>(null);
  const [docs, setDocs]         = useState<Doc[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "all_org" | "group" | "member">("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const id = user?.user_metadata?.active_org_id as string | undefined;
      if (id) setOrgId(id);
    });
  }, []);

  const loadDocs = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const res = await fetch(`/api/org/shared-docs?orgId=${orgId}&limit=50`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setDocs(data.docs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadDocs();
  }, [orgId, loadDocs]);

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase())
      || (d.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || d.share_target === filter
      || (filter === "all_org" && d.share_target === "all");
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex-1 p-6 md:p-8">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Documents partagés</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {total} document{total !== 1 ? "s" : ""} disponible{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 rounded-xl border px-3.5 py-2.5"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <Search size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as typeof filter)}
            className="rounded-xl border px-3 py-2.5 text-sm bg-transparent text-white outline-none cursor-pointer"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0a0e18" }}
          >
            <option value="all" style={{ background: "#0a0e18" }}>Tous</option>
            <option value="all_org" style={{ background: "#0a0e18" }}>Toute l&apos;org</option>
            <option value="group" style={{ background: "#0a0e18" }}>Groupes</option>
            <option value="member" style={{ background: "#0a0e18" }}>Personnels</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText size={40} style={{ color: "rgba(255,255,255,0.08)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            {search ? "Aucun document correspond à votre recherche." : "Aucun document partagé avec vous."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(doc => (
            <div key={doc.id}
              className="group flex flex-col rounded-2xl border transition-all hover:border-[rgba(201,165,90,0.3)]"
              style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>

              {/* Header doc */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(201,165,90,0.1)" }}>
                  <FileText size={18} style={{ color: GOLD }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                  {shareIcon(doc.share_target)}
                  {shareLabel(doc.share_target)}
                </span>
                {doc.file_name && (
                  <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                    {doc.file_name.split(".").pop()?.toUpperCase()}
                    {doc.file_size && ` · ${fileSize(doc.file_size)}`}
                  </span>
                )}
                {doc.expires_at && new Date(doc.expires_at) < new Date(Date.now() + 3 * 86400000) && (
                  <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium"
                    style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                    <AlertCircle size={10} />
                    Expire bientôt
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t px-4 py-3"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <Calendar size={10} />
                  {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                </span>
                <div className="flex items-center gap-1.5">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-white/10"
                      style={{ color: "rgba(255,255,255,0.55)" }}>
                      <Eye size={12} />Voir
                    </a>
                  )}
                  {doc.file_url && doc.can_download && (
                    <a href={doc.file_url} download={doc.file_name ?? true}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
                      style={{ background: "rgba(201,165,90,0.15)", color: GOLD }}>
                      <Download size={12} />DL
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
