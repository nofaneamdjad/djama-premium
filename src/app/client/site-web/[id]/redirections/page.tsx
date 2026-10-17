"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, RefreshCw, ArrowRight, ToggleLeft, ToggleRight, Pencil
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";

interface Redirection {
  id: string;
  from_path: string;
  to_url: string;
  status_code: number;
  enabled: boolean;
  created_at: string;
}

export default function RedirectionsPage() {
  const { id } = useParams<{ id: string }>();
  const router   = useRouter();
  const { isDark } = useTheme();
  const t = tok(isDark);

  const [items, setItems]         = useState<Redirection[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [formOpen, setFormOpen]   = useState(false);
  const [editItem, setEditItem]   = useState<Redirection | null>(null);

  const [fromPath, setFromPath]   = useState("");
  const [toUrl, setToUrl]         = useState("");
  const [statusCode, setStatus]   = useState<301 | 302 | 307 | 308>(301);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/websites/${id}/redirections`);
    const json = await res.json() as { redirections: Redirection[] };
    setItems(json.redirections ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  function openAdd() {
    setEditItem(null);
    setFromPath("");
    setToUrl("");
    setStatus(301);
    setError("");
    setFormOpen(true);
  }

  function openEdit(r: Redirection) {
    setEditItem(r);
    setFromPath(r.from_path);
    setToUrl(r.to_url);
    setStatus(r.status_code as 301 | 302 | 307 | 308);
    setError("");
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (editItem) {
      const res = await fetch(`/api/websites/${id}/redirections?redirection_id=${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_url: toUrl, status_code: statusCode }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? "Erreur"); setSaving(false); return; }
    } else {
      const res = await fetch(`/api/websites/${id}/redirections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_path: fromPath, to_url: toUrl, status_code: statusCode }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? "Erreur"); setSaving(false); return; }
    }

    setSaving(false);
    setFormOpen(false);
    void load();
  }

  async function toggleEnabled(r: Redirection) {
    await fetch(`/api/websites/${id}/redirections?redirection_id=${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !r.enabled }),
    });
    void load();
  }

  async function handleDelete(redirectionId: string) {
    if (!confirm("Supprimer cette redirection ?")) return;
    await fetch(`/api/websites/${id}/redirections?redirection_id=${redirectionId}`, { method: "DELETE" });
    void load();
  }

  const STATUS_LABELS: Record<number, string> = { 301: "301 Permanent", 302: "302 Temporaire", 307: "307 Temporaire", 308: "308 Permanent" };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: "2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

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
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Redirections</h1>
              <p style={{ margin: 0, opacity: 0.5, fontSize: "0.8rem" }}>{items.length} redirection{items.length !== 1 ? "s" : ""} configurée{items.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => void load()} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", border: `1px solid ${t.border}`, borderRadius: "0.6rem", background: "none", color: t.text, cursor: "pointer", fontSize: "0.875rem" }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.6rem", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <AnimatePresence>
          {formOpen && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={e => void handleSubmit(e)}
              style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.5rem" }}
            >
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700 }}>
                {editItem ? "Modifier la redirection" : "Nouvelle redirection"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, display: "block", marginBottom: "0.3rem" }}>Chemin source</label>
                  <input
                    value={fromPath}
                    onChange={e => setFromPath(e.target.value)}
                    placeholder="/ancienne-page"
                    required
                    disabled={!!editItem}
                    style={{ width: "100%", padding: "0.65rem 0.875rem", border: `1px solid ${t.border}`, borderRadius: "0.55rem", background: t.bg, color: t.text, fontSize: "0.875rem", fontFamily: "monospace", boxSizing: "border-box", opacity: editItem ? 0.5 : 1 }}
                  />
                </div>
                <ArrowRight size={18} style={{ opacity: 0.4, marginTop: "1.4rem" }} />
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, display: "block", marginBottom: "0.3rem" }}>URL de destination</label>
                  <input
                    value={toUrl}
                    onChange={e => setToUrl(e.target.value)}
                    placeholder="/nouvelle-page ou https://..."
                    required
                    style={{ width: "100%", padding: "0.65rem 0.875rem", border: `1px solid ${t.border}`, borderRadius: "0.55rem", background: t.bg, color: t.text, fontSize: "0.875rem", fontFamily: "monospace", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, display: "block", marginBottom: "0.3rem" }}>Type</label>
                  <select
                    value={statusCode}
                    onChange={e => setStatus(Number(e.target.value) as 301 | 302 | 307 | 308)}
                    style={{ padding: "0.6rem 0.875rem", border: `1px solid ${t.border}`, borderRadius: "0.55rem", background: t.bg, color: t.text, fontSize: "0.875rem" }}
                  >
                    <option value={301}>301 — Permanent (SEO recommandé)</option>
                    <option value={302}>302 — Temporaire</option>
                    <option value={307}>307 — Temporaire (méthode conservée)</option>
                    <option value={308}>308 — Permanent (méthode conservée)</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                  <button type="submit" disabled={saving} style={{ padding: "0.6rem 1.25rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.55rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
                    {saving ? "…" : editItem ? "Modifier" : "Ajouter"}
                  </button>
                  <button type="button" onClick={() => setFormOpen(false)} style={{ padding: "0.6rem 1rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", cursor: "pointer", color: t.text, fontSize: "0.875rem" }}>
                    Annuler
                  </button>
                </div>
              </div>
              {error && <p style={{ color: "#EF4444", fontSize: "0.8rem", margin: "0.75rem 0 0" }}>{error}</p>}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", opacity: 0.4 }}>Chargement…</div>
        ) : !items.length ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "5rem 2rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "1.5rem" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>↩️</div>
            <h2 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.5rem" }}>Aucune redirection</h2>
            <p style={{ opacity: 0.55, lineHeight: 1.6, marginBottom: "1.5rem" }}>Redirigez d'anciennes URLs vers de nouvelles pages.</p>
            <button onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.5rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.75rem", cursor: "pointer", fontWeight: 600 }}>
              <Plus size={15} /> Créer une redirection
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {items.map(r => (
              <motion.div
                key={r.id}
                layout
                style={{
                  background: t.glass,
                  border: `1px solid ${r.enabled ? t.border : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  borderRadius: "0.75rem",
                  padding: "0.875rem 1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  opacity: r.enabled ? 1 : 0.5,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 600, flex: 1, minWidth: 120 }}>{r.from_path}</span>
                <ArrowRight size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
                <span style={{ fontFamily: "monospace", fontSize: "0.875rem", flex: 2, minWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.to_url}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.35rem", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                  {STATUS_LABELS[r.status_code] ?? r.status_code}
                </span>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button onClick={() => void toggleEnabled(r)} title={r.enabled ? "Désactiver" : "Activer"} style={{ background: "none", border: "none", cursor: "pointer", color: r.enabled ? "#10B981" : "#6B7280", display: "flex" }}>
                    {r.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => openEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.5, display: "flex" }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => void handleDelete(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", opacity: 0.7, display: "flex" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info */}
        <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", background: isDark ? "rgba(37,99,235,0.08)" : "#EFF6FF", borderRadius: "0.75rem", fontSize: "0.8rem", opacity: 0.8, lineHeight: 1.6 }}>
          <strong>💡 Conseil :</strong> Utilisez les redirections 301 pour préserver votre référencement SEO lors de changements d'URL. La migration de domaine est gérée dans l'onglet <em>Domaines</em>.
        </div>
      </div>
    </div>
  );
}
