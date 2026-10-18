"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Contact2, Plus, ExternalLink, Pencil, Copy, Archive,
  Trash2, Power, PowerOff, MoreVertical, Globe, Check,
  BarChart2, Users, QrCode, X, Loader2,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { tok } from "@/lib/website-builder/theme-utils";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import type { BusinessCard } from "@/lib/cards/types";
import { CARD_TEMPLATES } from "@/lib/cards/templates";

const STATUS_LABEL: Record<string, string> = {
  active: "Active", draft: "Brouillon", archived: "Archivée", disabled: "Désactivée",
};
const STATUS_COLOR: Record<string, string> = {
  active: "#10B981", draft: "#6B7280", archived: "#F59E0B", disabled: "#EF4444",
};

export default function CarteVisite() {
  const { isDark } = useTheme();
  const t          = tok(isDark);
  const router     = useRouter();

  const [cards,   setCards]   = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copyMsg,  setCopyMsg]  = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Onglets
  const [tab, setTab] = useState<"cards" | "contacts" | "stats">("cards");

  useEffect(() => {
    fetch("/api/cards")
      .then(r => r.json())
      .then((d: { cards?: BusinessCard[] }) => { setCards(d.cards ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Fermer menu sur clic extérieur
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  async function createCard() {
    setCreating(true);
    const res  = await fetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json() as { card?: BusinessCard };
    if (res.ok && data.card) router.push(`/client/carte-visite/${data.card.id}/edit`);
    else setCreating(false);
  }

  async function patchCard(id: string, patch: Partial<BusinessCard>) {
    setActionLoading(id);
    const res  = await fetch(`/api/cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json() as { card?: BusinessCard };
    if (res.ok && data.card) setCards(cs => cs.map(c => c.id === id ? data.card! : c));
    setActionLoading(null);
    setMenuOpen(null);
  }

  async function duplicateCard(id: string) {
    setActionLoading(id);
    const res  = await fetch(`/api/cards/${id}/duplicate`, { method: "POST" });
    const data = await res.json() as { card?: BusinessCard };
    if (res.ok && data.card) setCards(cs => [data.card!, ...cs]);
    setActionLoading(null);
    setMenuOpen(null);
  }

  async function deleteCard(id: string) {
    if (!confirm("Supprimer définitivement cette carte ?")) return;
    setActionLoading(id);
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    setCards(cs => cs.filter(c => c.id !== id));
    setActionLoading(null);
    setMenuOpen(null);
  }

  function copyLink(card: BusinessCard) {
    navigator.clipboard.writeText(`https://djama.space/c/${card.slug}`).catch(() => {});
    setCopyMsg(card.id);
    setTimeout(() => setCopyMsg(null), 2000);
    setMenuOpen(null);
  }

  const gold = "#c9a55a";

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.45rem 1rem", borderRadius: 9999, fontWeight: 600, fontSize: "0.82rem",
    border: active ? `1px solid ${gold}40` : `1px solid ${t.border}`,
    background: active ? `${gold}18` : "none",
    color: active ? gold : t.text, cursor: "pointer",
  });

  const cardBase: React.CSSProperties = {
    background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem",
    overflow: "hidden",
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text }}>
      {/* ── Header ── */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ModuleHeaderIcon icon={Contact2} color={gold} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Carte de visite</h1>
            <p style={{ margin: 0, fontSize: "0.72rem", opacity: 0.45 }}>Identité professionnelle numérique</p>
          </div>
        </div>
        <button onClick={createCard} disabled={creating}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: gold, color: "#000", border: "none", borderRadius: "0.65rem", padding: "0.6rem 1.1rem", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", opacity: creating ? 0.7 : 1 }}>
          {creating ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
          Nouvelle carte
        </button>
      </div>

      {/* ── Onglets ── */}
      <div style={{ padding: "0.85rem 1.5rem", display: "flex", gap: "0.5rem", borderBottom: `1px solid ${t.border}` }}>
        {([
          { id: "cards",    label: "Mes cartes",   icon: <Contact2 size={13} /> },
          { id: "contacts", label: "Contacts reçus", icon: <Users size={13} /> },
          { id: "stats",    label: "Statistiques", icon: <BarChart2 size={13} /> },
        ] as const).map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={btnStyle(tab === tb.id)}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>{tb.icon}{tb.label}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>

        {/* ── Onglet Cartes ── */}
        {tab === "cards" && (
          <>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <Loader2 size={26} color={gold} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : cards.length === 0 ? (
              <EmptyState onCreate={createCard} creating={creating} isDark={isDark} gold={gold} t={t} />
            ) : (
              <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {cards.map(card => {
                  const tpl = CARD_TEMPLATES.find(t => t.id === card.template_id) ?? CARD_TEMPLATES[0];
                  const initials = [card.first_name, card.last_name].filter(Boolean).map(s => s![0]).join("") || (card.name ?? "?")[0];
                  const isLoading = actionLoading === card.id;

                  return (
                    <motion.div key={card.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardBase, position: "relative" }}>
                      {/* Bande de couleur du template */}
                      <div style={{ height: 6, background: `linear-gradient(90deg, ${tpl.theme.primaryColor}, ${tpl.theme.accentColor ?? tpl.theme.primaryColor})` }} />

                      <div style={{ padding: "1rem" }}>
                        {/* En-tête carte */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
                          <div style={{ width: 40, height: 40, borderRadius: card.theme?.avatarShape === "square" ? "4px" : "50%", background: `${tpl.theme.primaryColor}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                            {card.avatar_url
                              ? <img src={card.avatar_url} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontWeight: 800, color: tpl.theme.primaryColor, fontSize: "0.9rem" }}>{initials.toUpperCase()}</span>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.name || "Sans titre"}</p>
                            <p style={{ margin: 0, fontSize: "0.74rem", opacity: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.job_title || card.company || tpl.name}</p>
                          </div>
                          <div style={{ position: "relative" }}>
                            <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === card.id ? null : card.id); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: t.text, opacity: 0.5, padding: "0.25rem" }}>
                              {isLoading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <MoreVertical size={15} />}
                            </button>

                            {menuOpen === card.id && (
                              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", right: 0, zIndex: 50, background: isDark ? "#1a1c26" : "#fff", border: `1px solid ${t.border}`, borderRadius: "0.65rem", boxShadow: "0 8px 30px rgba(0,0,0,0.18)", minWidth: 170, overflow: "hidden" }}>
                                {[
                                  { label: "Modifier",    icon: <Pencil size={13} />,  action: () => router.push(`/client/carte-visite/${card.id}/edit`) },
                                  { label: "Voir publique", icon: <ExternalLink size={13} />, action: () => window.open(`https://djama.space/c/${card.slug}`, "_blank") },
                                  { label: "Copier le lien", icon: copyMsg === card.id ? <Check size={13} /> : <Copy size={13} />, action: () => copyLink(card) },
                                  { label: "QR Code",     icon: <QrCode size={13} />,  action: () => window.open(`/api/cards/${card.id}/qr`, "_blank") },
                                  { label: "Dupliquer",   icon: <Copy size={13} />,    action: () => duplicateCard(card.id) },
                                  { label: card.status === "active" ? "Désactiver" : "Activer",
                                    icon: card.status === "active" ? <PowerOff size={13} /> : <Power size={13} />,
                                    action: () => patchCard(card.id, { status: card.status === "active" ? "disabled" : "active" }) },
                                  { label: card.status === "archived" ? "Restaurer" : "Archiver",
                                    icon: <Archive size={13} />,
                                    action: () => patchCard(card.id, { status: card.status === "archived" ? "draft" : "archived" }) },
                                  { label: "Supprimer",   icon: <Trash2 size={13} />,  action: () => deleteCard(card.id), danger: true },
                                ].map(item => (
                                  <button key={item.label} onClick={item.action}
                                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.55rem", padding: "0.6rem 0.9rem", background: "none", border: "none", cursor: "pointer", color: item.danger ? "#EF4444" : t.text, fontSize: "0.82rem", fontWeight: 500, textAlign: "left" }}>
                                    {item.icon} {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Statut + URL */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", fontWeight: 700, color: STATUS_COLOR[card.status], background: `${STATUS_COLOR[card.status]}18`, padding: "0.2rem 0.6rem", borderRadius: 9999 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[card.status] }} />
                            {STATUS_LABEL[card.status]}
                          </span>
                          {card.status === "active" && (
                            <a href={`https://djama.space/c/${card.slug}`} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: gold, textDecoration: "none", opacity: 0.8 }}>
                              <Globe size={10} />{card.slug}
                            </a>
                          )}
                        </div>

                        {/* Compteurs */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.85rem" }}>
                          {[
                            { label: "Vues",    val: card.view_count },
                            { label: "Contacts", val: card.contact_count },
                            { label: "Modèle",  val: tpl.name, small: true },
                          ].map(stat => (
                            <div key={stat.label} style={{ background: isDark ? "#ffffff06" : "#f8fafc", borderRadius: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
                              <p style={{ margin: 0, fontSize: stat.small ? "0.65rem" : "1rem", fontWeight: 800, color: gold }}>{stat.val ?? 0}</p>
                              <p style={{ margin: 0, fontSize: "0.62rem", opacity: 0.45 }}>{stat.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Boutons rapides */}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => router.push(`/client/carte-visite/${card.id}/edit`)}
                            style={{ flex: 1, padding: "0.5rem", background: gold, color: "#000", border: "none", borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                            Modifier
                          </button>
                          {card.status !== "active" ? (
                            <button onClick={() => patchCard(card.id, { status: "active" })}
                              style={{ flex: 1, padding: "0.5rem", background: "#10B98118", color: "#10B981", border: `1px solid #10B98130`, borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                              Publier
                            </button>
                          ) : (
                            <a href={`https://djama.space/c/${card.slug}`} target="_blank" rel="noopener noreferrer"
                              style={{ flex: 1, padding: "0.5rem", background: isDark ? "#ffffff08" : "#f3f4f6", border: `1px solid ${t.border}`, borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", color: t.text, textDecoration: "none", textAlign: "center" }}>
                              Voir
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Onglet Contacts ── */}
        {tab === "contacts" && (
          <ContactsTab cards={cards} isDark={isDark} t={t} gold={gold} />
        )}

        {/* ── Onglet Statistiques ── */}
        {tab === "stats" && (
          <StatsTab cards={cards} isDark={isDark} t={t} gold={gold} />
        )}
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ onCreate, creating, isDark, gold, t }: {
  onCreate: () => void; creating: boolean; isDark: boolean;
  gold: string; t: ReturnType<typeof tok>;
}) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${gold}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
        <Contact2 size={26} color={gold} />
      </div>
      <p style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 0.4rem", color: isDark ? "#e4ddd4" : "#1a1a1a" }}>Créez votre première carte</p>
      <p style={{ fontSize: "0.82rem", opacity: 0.5, margin: "0 0 1.5rem" }}>Partagez votre identité professionnelle en un lien.</p>
      <button onClick={onCreate} disabled={creating}
        style={{ background: gold, color: "#000", border: "none", borderRadius: "0.65rem", padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
        {creating ? "Création…" : "Créer ma carte"}
      </button>
    </div>
  );
}

// ── ContactsTab ───────────────────────────────────────────────────────────────

function ContactsTab({ cards, isDark, t, gold }: { cards: BusinessCard[]; isDark: boolean; t: ReturnType<typeof tok>; gold: string }) {
  const [selectedCard, setSelectedCard] = useState(cards[0]?.id ?? "");
  const [contacts, setContacts] = useState<Array<{ id: string; name?: string; email?: string; phone?: string; message?: string; company?: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCard) return;
    setLoading(true);
    fetch(`/api/cards/${selectedCard}/contact`)
      .then(r => r.json())
      .then((d: { contacts?: typeof contacts }) => { setContacts(d.contacts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedCard]);

  if (cards.length === 0) return <p style={{ opacity: 0.5, textAlign: "center", padding: "3rem" }}>Aucune carte créée.</p>;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)}
          style={{ padding: "0.6rem 0.85rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.6rem", color: t.text, fontSize: "0.82rem", cursor: "pointer" }}>
          {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {loading ? <p style={{ opacity: 0.5 }}>Chargement…</p>
        : contacts.length === 0 ? <p style={{ opacity: 0.5, textAlign: "center", padding: "2rem" }}>Aucun contact reçu pour cette carte.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {contacts.map(c => (
              <div key={c.id} style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.75rem", padding: "0.9rem 1rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${gold}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, color: gold, fontSize: "0.85rem" }}>{(c.name ?? c.email ?? "?")[0].toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem" }}>{c.name ?? "Anonyme"}</p>
                    {c.email   && <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6 }}>{c.email}</p>}
                    {c.phone   && <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6 }}>{c.phone}</p>}
                    {c.company && <p style={{ margin: 0, fontSize: "0.72rem", opacity: 0.45 }}>{c.company}</p>}
                    {c.message && <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", opacity: 0.7, fontStyle: "italic" }}>{c.message}</p>}
                  </div>
                  <span style={{ fontSize: "0.68rem", opacity: 0.4, whiteSpace: "nowrap" }}>
                    {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── StatsTab ──────────────────────────────────────────────────────────────────

function StatsTab({ cards, isDark, t, gold }: { cards: BusinessCard[]; isDark: boolean; t: ReturnType<typeof tok>; gold: string }) {
  const [selectedCard, setSelectedCard] = useState(cards[0]?.id ?? "");
  const [period, setPeriod]   = useState<"7d" | "30d" | "90d">("30d");
  const [stats, setStats]     = useState<Record<string, number> | null>(null);
  const [daily, setDaily]     = useState<{ date: string; views: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCard) return;
    setLoading(true);
    fetch(`/api/cards/${selectedCard}/stats?period=${period}`)
      .then(r => r.json())
      .then((d: Record<string, unknown>) => {
        const { daily: dl, ...rest } = d;
        setStats(rest as Record<string, number>);
        setDaily((dl as { date: string; views: number }[]) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCard, period]);

  if (cards.length === 0) return <p style={{ opacity: 0.5, textAlign: "center", padding: "3rem" }}>Aucune carte créée.</p>;

  const kpis = stats ? [
    { label: "Vues",        val: stats.totalViews,       color: "#2563EB" },
    { label: "VCF",         val: stats.vcfDownloads,     color: "#10B981" },
    { label: "QR scans",    val: stats.qrScans,          color: "#7C3AED" },
    { label: "Contacts",    val: stats.contactsReceived, color: gold },
    { label: "Clics tél.",  val: stats.clicksPhone,      color: "#F59E0B" },
    { label: "Clics email", val: stats.clicksEmail,      color: "#EC4899" },
  ] : [];

  const maxViews = Math.max(...daily.map(d => d.views), 1);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)}
          style={{ padding: "0.55rem 0.85rem", background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.6rem", color: t.text, fontSize: "0.82rem" }}>
          {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {(["7d", "30d", "90d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: "0.5rem 0.85rem", borderRadius: "0.5rem", border: `1px solid ${period === p ? gold : t.border}`, background: period === p ? `${gold}18` : "none", color: period === p ? gold : t.text, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p style={{ opacity: 0.5 }}>Chargement…</p> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.65rem", marginBottom: "1.25rem" }}>
            {kpis.map(k => (
              <div key={k.label} style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: k.color }}>{k.val ?? 0}</p>
                <p style={{ margin: 0, fontSize: "0.68rem", opacity: 0.5 }}>{k.label}</p>
              </div>
            ))}
          </div>

          {daily.length > 0 && (
            <div style={{ background: t.glass, border: `1px solid ${t.border}`, borderRadius: "0.85rem", padding: "1.25rem" }}>
              <p style={{ margin: "0 0 1rem", fontWeight: 700, fontSize: "0.85rem" }}>Vues par jour</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 80 }}>
                {daily.map(d => (
                  <div key={d.date} title={`${d.date}: ${d.views}`} style={{ flex: 1, background: `${gold}${d.views > 0 ? "cc" : "22"}`, borderRadius: "2px 2px 0 0", height: `${(d.views / maxViews) * 100}%`, minHeight: 2 }} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
