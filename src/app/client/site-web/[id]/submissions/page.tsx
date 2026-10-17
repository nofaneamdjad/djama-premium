"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, Trash2, RefreshCw, Mail, Filter, ChevronLeft, ChevronRight
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";

interface Submission {
  id: string;
  created_at: string;
  page_slug: string | null;
  data: Record<string, unknown>;
}

interface SubmissionsResponse {
  submissions: Submission[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
  site_name: string;
}

const SKIP_KEYS = new Set(["__formId", "website"]);

export default function SubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { isDark } = useTheme();
  const t = tok(isDark);

  const [data, setData]         = useState<SubmissionsResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/websites/${id}/submissions?page=${p}&per_page=50`);
    const json = await res.json() as SubmissionsResponse;
    setData(json);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(page); }, [load, page]);

  async function handleDelete(subId: string) {
    if (!confirm("Supprimer cette soumission ?")) return;
    setDeleting(subId);
    await fetch(`/api/websites/${id}/submissions?submission_id=${subId}`, { method: "DELETE" });
    setDeleting(null);
    void load(page);
  }

  function exportCsv() {
    window.open(`/api/websites/${id}/submissions?format=csv`, "_blank");
  }

  const allKeys = data?.submissions.length
    ? Array.from(
        data.submissions.reduce<Set<string>>((acc, s) => {
          Object.keys(s.data ?? {}).forEach(k => { if (!SKIP_KEYS.has(k)) acc.add(k); });
          return acc;
        }, new Set())
      )
    : [];

  const fieldLabel = (k: string) => {
    const map: Record<string, string> = {
      name: "Nom", email: "E-mail", phone: "Téléphone",
      message: "Message", subject: "Sujet",
    };
    return map[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: "2rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => router.push(`/client/site-web/${id}/edit`)}
              style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem" }}
            >
              <ArrowLeft size={16} /> Retour
            </button>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
                Soumissions
              </h1>
              {data && (
                <p style={{ margin: 0, opacity: 0.55, fontSize: "0.8rem" }}>
                  {data.site_name} — {data.total} soumission{data.total !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => void load(page)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", border: `1px solid ${t.border}`, borderRadius: "0.6rem", background: "none", color: t.text, cursor: "pointer", fontSize: "0.875rem" }}
            >
              <RefreshCw size={14} /> Actualiser
            </button>
            <button
              onClick={exportCsv}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.6rem", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
            >
              <Download size={14} /> Exporter CSV
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", opacity: 0.4 }}>Chargement…</div>
        ) : !data?.submissions.length ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "5rem 2rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "1.5rem" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <h2 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.5rem" }}>Aucune soumission</h2>
            <p style={{ opacity: 0.55, lineHeight: 1.6 }}>Les formulaires de votre site enverront les données ici.</p>
          </motion.div>
        ) : (
          <>
            {/* Table */}
            <div style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "1rem", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <th style={{ padding: "0.875rem 1rem", textAlign: "left", fontWeight: 600, opacity: 0.6, whiteSpace: "nowrap" }}>Date</th>
                      <th style={{ padding: "0.875rem 1rem", textAlign: "left", fontWeight: 600, opacity: 0.6, whiteSpace: "nowrap" }}>Page</th>
                      {allKeys.slice(0, 4).map(k => (
                        <th key={k} style={{ padding: "0.875rem 1rem", textAlign: "left", fontWeight: 600, opacity: 0.6, whiteSpace: "nowrap" }}>{fieldLabel(k)}</th>
                      ))}
                      <th style={{ padding: "0.875rem 1rem", width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.submissions.map(sub => {
                      const isExp = expanded === sub.id;
                      const extraKeys = allKeys.slice(4);
                      return [
                        <tr
                          key={sub.id}
                          style={{
                            borderBottom: `1px solid ${t.border}`,
                            opacity: deleting === sub.id ? 0.4 : 1,
                            cursor: "pointer",
                            background: isExp ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(37,99,235,0.03)") : "transparent",
                          }}
                          onClick={() => setExpanded(isExp ? null : sub.id)}
                        >
                          <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap", opacity: 0.65 }}>
                            {new Date(sub.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td style={{ padding: "0.875rem 1rem", opacity: 0.5, fontFamily: "monospace", fontSize: "0.8rem" }}>
                            {sub.page_slug ?? "/"}
                          </td>
                          {allKeys.slice(0, 4).map(k => (
                            <td key={k} style={{ padding: "0.875rem 1rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {String(sub.data?.[k] ?? "")}
                            </td>
                          ))}
                          <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                            <button
                              onClick={e => { e.stopPropagation(); void handleDelete(sub.id); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "0.25rem", opacity: 0.7 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>,
                        isExp && (
                          <tr key={`${sub.id}_exp`} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderBottom: `1px solid ${t.border}` }}>
                            <td colSpan={allKeys.slice(0, 4).length + 3} style={{ padding: "1rem 1.5rem" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                                {Object.entries(sub.data ?? {})
                                  .filter(([k]) => !SKIP_KEYS.has(k))
                                  .map(([k, v]) => (
                                    <div key={k}>
                                      <div style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{fieldLabel(k)}</div>
                                      <div style={{ fontSize: "0.875rem", lineHeight: 1.5, wordBreak: "break-word" }}>{String(v ?? "—")}</div>
                                    </div>
                                  ))}
                                {typeof sub.data?.__formId === "string" && (
                                  <div>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Formulaire</div>
                                    <div style={{ fontSize: "0.8rem", fontFamily: "monospace", opacity: 0.6 }}>{sub.data.__formId as string}</div>
                                  </div>
                                )}
                              </div>
                              {typeof sub.data?.email === "string" && (
                                <a
                                  href={`mailto:${sub.data.email as string}`}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "1rem", color: "#2563EB", fontWeight: 600, fontSize: "0.8rem", textDecoration: "none" }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Mail size={13} /> Répondre par e-mail
                                </a>
                              )}
                            </td>
                          </tr>
                        ),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.5rem 1rem", border: `1px solid ${t.border}`, borderRadius: "0.5rem", background: "none", color: t.text, cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: "0.875rem" }}
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                <span style={{ fontSize: "0.875rem", opacity: 0.6 }}>Page {page} / {data.pages}</span>
                <button
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.5rem 1rem", border: `1px solid ${t.border}`, borderRadius: "0.5rem", background: "none", color: t.text, cursor: page === data.pages ? "default" : "pointer", opacity: page === data.pages ? 0.4 : 1, fontSize: "0.875rem" }}
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
