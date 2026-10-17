"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Globe, Plus, Trash2, RefreshCw, CheckCircle,
  Clock, AlertCircle, Copy, Loader2, ExternalLink, Shield,
} from "lucide-react";
import { tok } from "@/lib/website-builder/theme-utils";
import { useTheme } from "@/lib/theme-context";

interface DomainRow {
  id:           string;
  domain:       string;
  verified:     boolean;
  ssl_status:   string;
  dns_target:   string;
  verify_token: string;
  created_at:   string;
}

export default function SiteDomainsPage() {
  const { isDark } = useTheme();
  const t = tok(isDark);
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [domains,     setDomains]     = useState<DomainRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [siteName,    setSiteName]    = useState("Site");
  const [subdomain,   setSubdomain]   = useState("");
  const [newDomain,   setNewDomain]   = useState("");
  const [adding,      setAdding]      = useState(false);
  const [addError,    setAddError]    = useState<string | null>(null);
  const [verifying,   setVerifying]   = useState<string | null>(null);
  const [verifyMsg,   setVerifyMsg]   = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/websites/${siteId}`)
      .then(r => r.json())
      .then(d => {
        if (d.website?.name)      setSiteName(d.website.name as string);
        if (d.website?.subdomain) setSubdomain(d.website.subdomain as string);
      })
      .catch(() => {});

    fetch(`/api/websites/${siteId}/domains`)
      .then(r => r.json())
      .then(d => setDomains(d.domains ?? []))
      .finally(() => setLoading(false));
  }, [siteId]);

  async function handleAdd() {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch(`/api/websites/${siteId}/domains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: d }),
    });
    const json = await res.json() as { domain?: DomainRow; error?: string };
    if (res.ok && json.domain) {
      setDomains(prev => [...prev, json.domain!]);
      setNewDomain("");
    } else {
      setAddError(json.error ?? "Erreur");
    }
    setAdding(false);
  }

  async function handleVerify(domainId: string) {
    setVerifying(domainId);
    setVerifyMsg(null);
    const res = await fetch(`/api/websites/${siteId}/domains/${domainId}/verify`, { method: "POST" });
    const json = await res.json() as { verified?: boolean; message?: string };
    setVerifyMsg({ id: domainId, ok: json.verified ?? false, msg: json.message ?? "" });
    if (json.verified) {
      setDomains(prev => prev.map(d => d.id === domainId ? { ...d, verified: true, ssl_status: "active" } : d));
    }
    setVerifying(null);
  }

  async function handleDelete(domainId: string) {
    if (!confirm("Supprimer ce domaine ?")) return;
    setDeletingId(domainId);
    await fetch(`/api/websites/${siteId}/domains?domain_id=${domainId}`, { method: "DELETE" });
    setDomains(prev => prev.filter(d => d.id !== domainId));
    setDeletingId(null);
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token).catch(() => {});
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "0.65rem 1rem",
    background: isDark ? "#ffffff08" : "#f9fafb",
    border: `1px solid ${t.border}`,
    borderRadius: "0.6rem", color: t.text,
    fontSize: "0.875rem", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${t.border}`, background: t.glass }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => router.push(`/client/site-web/${siteId}/edit`)} style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.6 }}>
            <ArrowLeft size={17} />
          </button>
          <Globe size={15} color="#2563EB" />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{siteName}</span>
          <span style={{ opacity: 0.4, fontSize: "0.8rem" }}>· Domaines</span>
        </div>
        <button onClick={() => router.push(`/client/site-web/${siteId}/edit`)}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: `1px solid ${t.border}`, borderRadius: "0.55rem", padding: "0.4rem 0.85rem", cursor: "pointer", color: t.text, fontSize: "0.78rem", fontWeight: 600 }}>
          <ExternalLink size={12} /> Éditeur
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* URL par défaut */}
        <div style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Shield size={15} color="#10B981" />
            <span style={{ fontWeight: 700 }}>URL gratuite DJAMA</span>
            <span style={{ background: "#10B98120", color: "#10B981", fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: 9999 }}>HTTPS actif</span>
          </div>
          {subdomain ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <code style={{ background: isDark ? "#ffffff10" : "#f3f4f6", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.9rem", flex: 1 }}>
                https://{subdomain}.djama.site
              </code>
              <button onClick={() => window.open(`https://${subdomain}.djama.site`, "_blank")}
                style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 0.85rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <ExternalLink size={13} /> Voir
              </button>
            </div>
          ) : <p style={{ opacity: 0.5, fontSize: "0.875rem" }}>Aucun sous-domaine configuré</p>}
        </div>

        {/* Ajouter un domaine */}
        <div style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 1rem" }}>Ajouter un domaine personnalisé</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={newDomain}
              onChange={e => { setNewDomain(e.target.value); setAddError(null); }}
              placeholder="exemple.com ou www.exemple.com"
              style={inputStyle}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <button onClick={handleAdd} disabled={adding || !newDomain.trim()}
              style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.6rem", padding: "0.65rem 1.1rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: adding ? 0.7 : 1 }}>
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
            </button>
          </div>
          {addError && <p style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>{addError}</p>}
          <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.75rem", lineHeight: 1.5 }}>
            Après ajout, ajoutez un enregistrement TXT dans votre DNS pour vérifier la propriété du domaine. Ensuite, ajoutez un enregistrement CNAME pointant vers <strong>sites.djama.site</strong>.
          </p>
        </div>

        {/* Liste des domaines */}
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Domaines configurés</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", opacity: 0.4 }}><Loader2 size={24} /></div>
        ) : domains.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "1rem", opacity: 0.7 }}>
            <Globe size={32} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>Aucun domaine personnalisé</p>
            <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>Ajoutez votre premier domaine ci-dessus.</p>
          </div>
        ) : (
          <AnimatePresence>
            {domains.map(d => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: deletingId === d.id ? 0.4 : 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", padding: "1.25rem", marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{d.domain}</span>
                      {d.verified ? (
                        <span style={{ background: "#10B98120", color: "#10B981", fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 9999, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <CheckCircle size={10} /> Vérifié
                        </span>
                      ) : (
                        <span style={{ background: "#F59E0B20", color: "#F59E0B", fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 9999, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Clock size={10} /> En attente
                        </span>
                      )}
                      {d.ssl_status === "active" && (
                        <span style={{ background: "#2563EB20", color: "#2563EB", fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 9999, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Shield size={10} /> SSL actif
                        </span>
                      )}
                    </div>

                    {!d.verified && (
                      <div style={{ background: isDark ? "#F59E0B10" : "#FFFBEB", border: `1px solid #F59E0B40`, borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "0.75rem", fontSize: "0.8rem" }}>
                        <p style={{ fontWeight: 600, marginBottom: "0.4rem", color: "#D97706" }}>Étapes de configuration DNS :</p>
                        <ol style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 2, opacity: 0.85 }}>
                          <li>Ajoutez un enregistrement <strong>TXT</strong> sur <code>{d.domain}</code> avec la valeur ci-dessous</li>
                          <li>Ajoutez un enregistrement <strong>CNAME</strong> pointant vers <code>sites.djama.site</code></li>
                          <li>Cliquez sur "Vérifier" après la propagation DNS (peut prendre quelques minutes)</li>
                        </ol>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <code style={{ background: isDark ? "#ffffff10" : "#fff", padding: "0.35rem 0.75rem", borderRadius: "0.35rem", fontSize: "0.75rem", flex: 1, wordBreak: "break-all" }}>
                            {d.verify_token}
                          </code>
                          <button onClick={() => copyToken(d.verify_token)}
                            style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "0.35rem", padding: "0.35rem 0.6rem", cursor: "pointer", color: t.text, display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                            <Copy size={12} /> Copier
                          </button>
                        </div>
                      </div>
                    )}

                    {verifyMsg?.id === d.id && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: verifyMsg.ok ? "#10B981" : "#EF4444", marginBottom: "0.5rem" }}>
                        {verifyMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {verifyMsg.msg}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    {!d.verified && (
                      <button onClick={() => handleVerify(d.id)} disabled={verifying === d.id}
                        style={{ background: "#2563EB20", color: "#2563EB", border: "none", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        {verifying === d.id ? <Loader2 size={12} /> : <RefreshCw size={12} />} Vérifier
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id)}
                      style={{ background: "#EF444420", color: "#EF4444", border: "none", borderRadius: "0.5rem", padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Documentation */}
        <div style={{ marginTop: "2rem", padding: "1.25rem", background: isDark ? "#2563EB10" : "#EFF6FF", border: `1px solid #2563EB30`, borderRadius: "0.85rem" }}>
          <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem", color: "#2563EB" }}>Comment configurer votre domaine</p>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8rem", lineHeight: 2, opacity: 0.8 }}>
            <li>Achetez un domaine chez OVH, Gandi, Cloudflare ou votre registrar</li>
            <li>Ajoutez un TXT de vérification dans la zone DNS de votre domaine</li>
            <li>Ajoutez un CNAME <code>www</code> (ou racine <code>@</code>) pointant vers <code>sites.djama.site</code></li>
            <li>Attendez la propagation DNS (5 min à 48h) puis cliquez "Vérifier"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
