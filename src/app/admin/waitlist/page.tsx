"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw, Search, Users, X } from "lucide-react";

const GOLD   = "#c9a55a";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#131620";

const COUNTRIES_FILTER = [
  "", "France", "Belgique", "Suisse", "Canada", "Maroc", "Sénégal", "Côte d'Ivoire",
  "Cameroun", "Madagascar", "Comores", "Île Maurice", "Tunisie", "Algérie",
  "Gabon", "Burkina Faso", "Togo", "Bénin", "Mali", "Niger", "Guinée",
  "République Démocratique du Congo", "La Réunion", "Mayotte", "Autre",
];

interface WaitlistEntry {
  id:          string;
  nom:         string;
  email:       string;
  entreprise:  string | null;
  pays:        string | null;
  created_at:  string;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function exportCsv(entries: WaitlistEntry[]) {
  const header = "Nom,Email,Entreprise,Pays,Date inscription\n";
  const rows   = entries.map(e =>
    [e.nom, e.email, e.entreprise ?? "", e.pays ?? "", fmtDate(e.created_at)]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  ).join("\n");

  const blob = new Blob(["﻿" + header + rows], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `djama-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WaitlistAdminPage() {
  const [entries, setEntries]     = useState<WaitlistEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [pays, setPays]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (pays)           params.set("pays", pays);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res  = await fetch(`/api/admin/waitlist?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setEntries(data.entries ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [pays, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "32px 24px", color: "#e8e2d6", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Liste d'attente</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            Inscriptions pré-lancement djama.space
          </p>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`,
              borderRadius: 8, color: "#ccc", fontSize: 13, cursor: "pointer" }}
          >
            <RefreshCw size={14} /> Actualiser
          </button>
          <button
            onClick={() => exportCsv(entries)}
            disabled={entries.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              background: GOLD, border: "none", borderRadius: 8,
              color: "#0a0a0a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={14} /> Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "10px 18px", background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 10, marginBottom: 28,
      }}>
        <Users size={16} color={GOLD} />
        <span style={{ fontSize: 13, color: "#aaa" }}>Total inscrits :</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>{entries.length}</span>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flexGrow: 1, maxWidth: 340 }}>
          <Search size={14} color="#666" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher nom, email, entreprise…"
            style={{
              width: "100%", paddingLeft: 32, padding: "9px 12px 9px 32px",
              background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
              borderRadius: 8, color: "#e8e2d6", fontSize: 14, outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#666", padding: 2,
            }}>
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={pays}
          onChange={e => setPays(e.target.value)}
          style={{
            padding: "9px 14px", background: "rgba(255,255,255,0.04)",
            border: `1px solid ${BORDER}`, borderRadius: 8,
            color: "#e8e2d6", fontSize: 14, outline: "none", cursor: "pointer",
          }}
        >
          <option value="">Tous les pays</option>
          {COUNTRIES_FILTER.filter(Boolean).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(200,60,60,0.12)",
          border: "1px solid rgba(200,60,60,0.3)", borderRadius: 8, color: "#e08080",
          marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Nom", "Email", "Entreprise", "Pays", "Date d'inscription"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontWeight: 600, color: "#888", fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: `1px solid ${BORDER}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "#666" }}>
                  Chargement…
                </td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "#666" }}>
                  Aucune inscription pour ces critères.
                </td></tr>
              ) : (
                entries.map((e, i) => (
                  <tr key={e.id} style={{
                    borderBottom: i < entries.length - 1 ? `1px solid ${BORDER}` : "none",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={ev => (ev.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "12px 16px", color: "#e8e2d6", fontWeight: 500 }}>{e.nom}</td>
                    <td style={{ padding: "12px 16px", color: "#aaa" }}>{e.email}</td>
                    <td style={{ padding: "12px 16px", color: "#888" }}>{e.entreprise ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {e.pays
                        ? <span style={{ padding: "3px 9px", background: "rgba(201,165,90,0.12)",
                            border: "1px solid rgba(201,165,90,0.25)", borderRadius: 6,
                            color: GOLD, fontSize: 12, fontWeight: 500 }}>{e.pays}</span>
                        : <span style={{ color: "#555" }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px", color: "#666", whiteSpace: "nowrap" }}>
                      {fmtDate(e.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
