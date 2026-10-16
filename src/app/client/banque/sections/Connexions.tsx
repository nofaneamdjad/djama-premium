"use client";

import { useState, useRef } from "react";
import {
  Upload, FileText, AlertCircle, CheckCircle2, RefreshCw,
  Plug, Lock, Clock, ChevronDown,
} from "lucide-react";
import { tok, GOLD } from "../banque-utils";

interface Props {
  userId: string | null;
  isDark: boolean;
  orgId?: string | null;
  add: (msg: string, type?: "success" | "error") => void;
}

const PROVIDERS = [
  { id: "gocardless", name: "GoCardless (Open Banking)", country: "EU", description: "Connexion sécurisée à +2000 banques européennes via PSD2.", available: false },
  { id: "bridge", name: "Bridge by Bankin'", country: "FR", description: "Agrégateur bancaire français, certifié ACPR.", available: false },
  { id: "powens", name: "Powens (ex-Budget Insight)", country: "FR", description: "API bancaire professionnelle pour TPE/PME.", available: false },
  { id: "plaid", name: "Plaid", country: "US/UK", description: "Connexion aux banques nord-américaines et britanniques.", available: false },
];

type ImportStatus = "idle" | "parsing" | "done" | "error";

export default function Connexions({ userId, isDark, orgId, add }: Props) {
  const t = tok(isDark);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab]           = useState<"import" | "providers">("import");
  const [file, setFile]         = useState<File | null>(null);
  const [format, setFormat]     = useState("csv");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus]     = useState<ImportStatus>("idle");
  const [result, setResult]     = useState<{
    imported: number; skipped: number; total: number;
  } | null>(null);

  const inp = {
    background: t.glass, border: `1px solid ${t.border}`,
    color: t.text, borderRadius: "0.75rem",
    padding: "0.55rem 0.875rem", fontSize: "0.875rem",
    outline: "none", width: "100%",
  } as React.CSSProperties;

  async function loadAccounts() {
    if (accountsLoaded || !userId) return;
    const params = new URLSearchParams();
    if (orgId) params.set("org_id", orgId);
    const res = await fetch(`/api/banque/accounts?${params}`);
    const json = await res.json();
    setAccounts((json.accounts ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
    if (json.accounts?.length) setAccountId(json.accounts[0].id);
    setAccountsLoaded(true);
  }

  function handleFilePick(f: File | null) {
    setFile(f);
    setStatus("idle");
    setResult(null);
    // Auto-detect format
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext === "ofx" || ext === "qfx") setFormat("ofx");
      else if (ext === "qif") setFormat("qif");
      else setFormat("csv");
    }
  }

  async function handleImport() {
    if (!file || !accountId) { add("Sélectionnez un compte et un fichier", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { add("Fichier trop grand (max 5 Mo)", "error"); return; }

    setImporting(true);
    setStatus("parsing");

    const form = new FormData();
    form.append("file", file);
    form.append("account_id", accountId);
    form.append("format", format);

    const res = await fetch("/api/banque/import", { method: "POST", body: form });
    const json = await res.json();

    if (res.ok) {
      setResult({ imported: json.imported, skipped: json.skipped, total: json.total });
      setStatus("done");
      add(`${json.imported} transaction${json.imported !== 1 ? "s" : ""} importée${json.imported !== 1 ? "s" : ""}`);
    } else {
      setStatus("error");
      add(json.error ?? "Erreur d'import", "error");
    }
    setImporting(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold" style={{ color: t.text }}>Connexions bancaires</h3>
          <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
            Importez vos relevés ou connectez votre banque via Open Banking
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { v: "import" as const, label: "Import fichier" },
          { v: "providers" as const, label: "Connexion directe" },
        ].map(opt => (
          <button key={opt.v} onClick={() => { setTab(opt.v); if (opt.v === "import") loadAccounts(); }}
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              background: tab === opt.v ? `${GOLD}18` : t.glass,
              border: `1px solid ${tab === opt.v ? GOLD + "50" : t.border}`,
              color: tab === opt.v ? GOLD : t.text2,
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tab Import */}
      {tab === "import" && (
        <div className="space-y-5">
          {/* Info */}
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(201,165,90,0.06)", border: `1px solid ${GOLD}25` }}>
            <div className="flex items-start gap-3">
              <FileText size={15} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: GOLD }}>Formats supportés</p>
                <p className="text-xs mt-1" style={{ color: t.text3 }}>
                  <strong>CSV</strong> — Export de votre espace bancaire en ligne (séparateur ; ou ,)<br />
                  <strong>OFX / QFX</strong> — Standard bancaire international<br />
                  <strong>QIF</strong> — Format Quicken (certaines banques)
                </p>
                <p className="text-xs mt-2" style={{ color: t.text3 }}>
                  Limite : 5 000 transactions par fichier, 5 Mo maximum.
                  Les doublons sont détectés automatiquement.
                </p>
              </div>
            </div>
          </div>

          {/* Compte de destination */}
          <div onClick={loadAccounts}>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: `${GOLD}90` }}>Compte de destination *</label>
            <select style={inp} value={accountId} onChange={e => setAccountId(e.target.value)}>
              {accounts.length === 0
                ? <option value="">Chargement…</option>
                : accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
              }
            </select>
            {accounts.length === 0 && accountsLoaded && (
              <p className="text-xs mt-1" style={{ color: "#f87171" }}>
                Aucun compte. Créez d'abord un compte dans « Comptes ».
              </p>
            )}
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: `${GOLD}90` }}>Format du fichier</label>
            <select style={inp} value={format} onChange={e => setFormat(e.target.value)}>
              <option value="csv">CSV (auto-détection des colonnes)</option>
              <option value="ofx">OFX / QFX</option>
              <option value="qif">QIF</option>
            </select>
          </div>

          {/* Zone de dépôt */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: `${GOLD}90` }}>Fichier *</label>
            <div
              className="rounded-2xl p-6 text-center cursor-pointer transition-all"
              style={{
                border: `2px dashed ${file ? GOLD + "80" : t.border}`,
                background: file ? `${GOLD}06` : t.glass,
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFilePick(e.dataTransfer.files[0] ?? null); }}>
              <Upload size={24} className="mx-auto mb-2" style={{ color: file ? GOLD : t.text3 }} />
              {file ? (
                <>
                  <p className="text-sm font-medium" style={{ color: t.text }}>{file.name}</p>
                  <p className="text-xs mt-1" style={{ color: t.text3 }}>
                    {(file.size / 1024).toFixed(1)} Ko — Cliquer pour changer
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm" style={{ color: t.text2 }}>
                    Glissez votre fichier ici ou cliquez pour parcourir
                  </p>
                  <p className="text-xs mt-1" style={{ color: t.text3 }}>CSV, OFX, QFX, QIF</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden"
              accept=".csv,.ofx,.qfx,.qif"
              onChange={e => handleFilePick(e.target.files?.[0] ?? null)} />
          </div>

          {/* Résultat */}
          {status === "done" && result && (
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <CheckCircle2 size={16} style={{ color: "#10b981", marginTop: 2, flexShrink: 0 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#10b981" }}>Import terminé</p>
                <p className="text-xs mt-1" style={{ color: t.text3 }}>
                  {result.imported} transaction{result.imported !== 1 ? "s" : ""} importée{result.imported !== 1 ? "s" : ""}
                  {result.skipped > 0 && ` · ${result.skipped} doublon${result.skipped !== 1 ? "s" : ""} ignoré${result.skipped !== 1 ? "s" : ""}`}
                  {" "} sur {result.total} au total
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertCircle size={16} style={{ color: "#ef4444", marginTop: 2, flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "#ef4444" }}>Erreur lors de l'import. Vérifiez le format du fichier.</p>
            </div>
          )}

          {/* Bouton import */}
          <button onClick={handleImport}
            disabled={!file || !accountId || importing}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-all"
            style={{
              background: file && accountId ? `${GOLD}18` : t.glassMd,
              border: `1px solid ${file && accountId ? GOLD + "40" : t.border}`,
              color: file && accountId ? GOLD : t.text3,
            }}>
            {importing ? <><RefreshCw size={14} className="animate-spin" /> Import en cours…</> :
              status === "done" ? <><Upload size={14} /> Importer un autre fichier</> :
              <><Upload size={14} /> Importer les transactions</>}
          </button>
        </div>
      )}

      {/* Tab Fournisseurs */}
      {tab === "providers" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="flex items-start gap-3">
              <Lock size={15} style={{ color: "#818cf8", marginTop: 2, flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#818cf8" }}>Sécurité des connexions Open Banking</p>
                <p className="text-xs mt-1" style={{ color: t.text3 }}>
                  Aucun identifiant bancaire n'est jamais stocké dans DJAMA.
                  Les connexions directes utilisent OAuth2 via des fournisseurs agréés PSP.
                  Chaque connexion nécessite votre consentement explicite et est limitée dans le temps.
                </p>
              </div>
            </div>
          </div>

          {PROVIDERS.map(p => (
            <div key={p.id}
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: `${GOLD}15` }}>
                <Plug size={16} style={{ color: GOLD }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: t.text }}>{p.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    {p.country}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: t.text3 }}>{p.description}</p>
              </div>
              <div className="flex-shrink-0">
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <Clock size={11} /> Bientôt
                </span>
              </div>
            </div>
          ))}

          <p className="text-xs text-center py-2" style={{ color: t.text4 }}>
            Les connexions Open Banking sont en cours d'intégration.
            L'import de fichiers CSV/OFX est disponible dès maintenant.
          </p>
        </div>
      )}
    </div>
  );
}
