"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ReceiptText, Users, CreditCard, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import { APP_REGISTRY } from "@/lib/app-registry";

const GOLD = "#c9a55a";

type SearchHit = {
  id: string;
  group: string;
  HitIcon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  href: string;
};

const CP_QUICK_ACTIONS = [
  { label: "Créer une facture",    href: "/client/factures",  QIcon: ReceiptText, color: "#22c55e" },
  { label: "Ajouter un client",    href: "/client/crm",       QIcon: Users,       color: "#60a5fa" },
  { label: "Nouvelle dépense",     href: "/client/depenses",  QIcon: CreditCard,  color: "#f97316" },
  { label: "Ouvrir le calendrier", href: "/client/planning",  QIcon: Calendar,    color: "#a78bfa" },
] as const;

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [query,   setQuery]   = useState("");
  const [hits,    setHits]    = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selIdx,  setSelIdx]  = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowsRef  = useRef<Record<number, HTMLElement | null>>({});

  const c = isDark
    ? { bg: "#161718", sur: "#1e2022", bdr: "rgba(255,255,255,0.08)", tx: "rgba(255,255,255,0.90)", tx2: "rgba(255,255,255,0.52)", tx3: "rgba(255,255,255,0.28)", hov: "rgba(255,255,255,0.045)", sel: "rgba(201,165,90,0.09)" }
    : { bg: "#ffffff", sur: "#f6f7f9", bdr: "rgba(0,0,0,0.09)",       tx: "rgba(0,0,0,0.85)",       tx2: "rgba(0,0,0,0.50)",       tx3: "rgba(0,0,0,0.35)",       hov: "rgba(0,0,0,0.030)",      sel: "rgba(201,165,90,0.07)" };

  const close = useCallback(() => {
    setQuery(""); setHits([]); setSelIdx(0); onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 60); setSelIdx(0); }
    else { setQuery(""); setHits([]); }
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) { setHits([]); setLoading(false); return; }
    setSelIdx(0);
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const q = query.trim();
        const fmt   = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
        const fmtDt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

        const [docsRes, clientsRes, expRes, evtRes] = await Promise.all([
          supabase.from("documents")
            .select("id, numero, client_nom, type, total_ttc, statut")
            .or(`numero.ilike.%${q}%,client_nom.ilike.%${q}%`)
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .limit(5),
          supabase.from("clients_crm")
            .select("id, nom, email, telephone")
            .or(`nom.ilike.%${q}%,email.ilike.%${q}%`)
            .eq("user_id", user.id)
            .limit(4),
          supabase.from("expenses")
            .select("id, description, amount, category, date")
            .or(`description.ilike.%${q}%,category.ilike.%${q}%`)
            .eq("user_id", user.id)
            .limit(4),
          supabase.from("agenda_events")
            .select("id, title, event_date")
            .ilike("title", `%${q}%`)
            .eq("user_id", user.id)
            .limit(3),
        ]);

        if (cancelled) return;
        const results: SearchHit[] = [];

        for (const d of docsRes.data ?? []) {
          const isDevis = (d.type as string) === "devis";
          const statut  = (d.statut as string) ?? "";
          results.push({
            id: d.id as string, group: isDevis ? "DEVIS" : "FACTURES",
            HitIcon: ReceiptText,
            iconBg:    isDevis ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.12)",
            iconColor: isDevis ? "#fbbf24" : "#22c55e",
            title: `${(d.numero as string) || "—"}  ·  ${(d.client_nom as string) || "Client"}`,
            sub:   fmt((d.total_ttc as number) ?? 0),
            badge: statut,
            badgeColor: statut === "payé" ? "#22c55e" : statut === "en_retard" ? "#ef4444" : GOLD,
            href: "/client/factures",
          });
        }
        for (const cl of clientsRes.data ?? []) {
          results.push({
            id: cl.id as string, group: "CLIENTS",
            HitIcon: Users, iconBg: "rgba(96,165,250,0.12)", iconColor: "#60a5fa",
            title: cl.nom as string,
            sub:   (cl.email as string) || (cl.telephone as string) || "Contact",
            href: "/client/crm",
          });
        }
        for (const e of expRes.data ?? []) {
          results.push({
            id: e.id as string, group: "DÉPENSES",
            HitIcon: CreditCard, iconBg: "rgba(239,68,68,0.10)", iconColor: "#ef4444",
            title: (e.description as string) || (e.category as string) || "Dépense",
            sub:   `${fmt((e.amount as number) ?? 0)} · ${fmtDt(e.date as string)}`,
            href: "/client/depenses",
          });
        }
        for (const ev of evtRes.data ?? []) {
          results.push({
            id: ev.id as string, group: "AGENDA",
            HitIcon: Calendar, iconBg: "rgba(167,139,250,0.12)", iconColor: "#a78bfa",
            title: ev.title as string,
            sub:   fmtDt(ev.event_date as string),
            href: "/client/planning",
          });
        }
        const qLow = q.toLowerCase();
        let appCount = 0;
        for (const app of APP_REGISTRY) {
          if (appCount >= 3) break;
          if (
            app.name.toLowerCase().includes(qLow) ||
            app.keywords.some(k => k.includes(qLow))
          ) {
            results.push({
              id: app.id, group: "APPLICATIONS",
              HitIcon: app.icon, iconBg: `${GOLD}14`, iconColor: GOLD,
              title: app.name, sub: app.route.replace("/client/", "djama/"),
              href: app.route,
            });
            appCount++;
          }
        }
        setHits(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, open]);

  const groups = useMemo(() => {
    const map = new Map<string, SearchHit[]>();
    for (const h of hits) {
      if (!map.has(h.group)) map.set(h.group, []);
      map.get(h.group)!.push(h);
    }
    return map;
  }, [hits]);

  function hitIdx(group: string, localIdx: number) {
    let offset = 0;
    for (const [g, arr] of groups.entries()) {
      if (g === group) return offset + localIdx;
      offset += arr.length;
    }
    return localIdx;
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { close(); return; }
      if (hits.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelIdx(i => { const next = (i + 1) % hits.length; rowsRef.current[next]?.scrollIntoView({ block: "nearest" }); return next; });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelIdx(i => { const next = (i - 1 + hits.length) % hits.length; rowsRef.current[next]?.scrollIntoView({ block: "nearest" }); return next; });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const h = hits[selIdx];
        if (h) { router.push(h.href); close(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hits, selIdx, close, router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-0 z-[60]"
            style={{ background: isDark ? "rgba(0,0,0,0.58)" : "rgba(0,0,0,0.25)", backdropFilter: "blur(3px)" }}
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.975, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.975, y: -6 }}
            transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[10vh] z-[61] w-full -translate-x-1/2 px-4 sm:px-0"
            style={{ maxWidth: 660 }}
          >
            <div className="overflow-hidden rounded-2xl" style={{
              background: c.bg,
              border: `1px solid ${c.bdr}`,
              boxShadow: isDark
                ? "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)"
                : "0 16px 48px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.05)",
            }}>
              {/* Input */}
              <div className="flex items-center gap-3 px-4" style={{ height: 54, borderBottom: `1px solid ${c.bdr}` }}>
                <Search size={16} style={{ color: c.tx3, flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher dans DJAMA…"
                  className="flex-1 bg-transparent text-[0.92rem] font-medium outline-none"
                  style={{ color: c.tx, caretColor: GOLD }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {loading ? (
                  <motion.div className="h-[15px] w-[15px] shrink-0 rounded-full"
                    style={{ borderWidth: 1.5, borderStyle: "solid", borderTopColor: GOLD, borderRightColor: c.bdr, borderBottomColor: c.bdr, borderLeftColor: c.bdr }}
                    animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <kbd className="hidden shrink-0 rounded-md px-1.5 py-0.5 text-[0.52rem] font-mono sm:block"
                    style={{ background: c.sur, border: `1px solid ${c.bdr}`, color: c.tx3 }}>
                    ESC
                  </kbd>
                )}
              </div>

              {/* Body */}
              <div className="max-h-[58vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                {query.trim() && !loading && hits.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-12">
                    <Search size={22} style={{ color: c.tx3 }} />
                    <p className="text-[0.875rem] font-semibold" style={{ color: c.tx2 }}>Aucun résultat</p>
                    <p className="text-[0.70rem]" style={{ color: c.tx3 }}>Essayez un autre mot-clé</p>
                  </div>
                )}

                {hits.length > 0 && (
                  <div className="py-1.5">
                    {Array.from(groups.entries()).map(([group, groupHits]) => (
                      <div key={group}>
                        <p className="px-4 pb-1 pt-3 text-[0.53rem] font-bold uppercase tracking-[0.14em]" style={{ color: c.tx3 }}>
                          {group}
                        </p>
                        {groupHits.map((h, li) => {
                          const fi  = hitIdx(group, li);
                          const sel = fi === selIdx;
                          return (
                            <Link
                              key={h.id}
                              href={h.href}
                              onClick={close}
                              ref={el => { rowsRef.current[fi] = el as HTMLElement | null; }}
                              className="flex items-center gap-3 px-4 py-[9px] transition-colors"
                              style={{
                                background: sel ? c.sel : "transparent",
                                borderLeft: sel ? `2px solid ${GOLD}` : "2px solid transparent",
                              }}
                              onMouseEnter={() => setSelIdx(fi)}
                            >
                              <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-lg" style={{ background: h.iconBg }}>
                                <h.HitIcon size={13} style={{ color: h.iconColor }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[0.80rem] font-semibold leading-tight" style={{ color: c.tx }}>{h.title}</p>
                                <p className="truncate text-[0.63rem] leading-tight mt-0.5" style={{ color: c.tx2 }}>{h.sub}</p>
                              </div>
                              {h.badge && (
                                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.50rem] font-bold uppercase tracking-wide"
                                  style={{ background: `${h.badgeColor}14`, color: h.badgeColor, border: `1px solid ${h.badgeColor}25` }}>
                                  {h.badge}
                                </span>
                              )}
                              <ArrowRight size={11} style={{ color: sel ? GOLD : c.tx3, flexShrink: 0 }} />
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {!query.trim() && (
                  <div className="py-2">
                    <p className="px-4 pb-1 pt-3 text-[0.53rem] font-bold uppercase tracking-[0.14em]" style={{ color: c.tx3 }}>
                      Actions rapides
                    </p>
                    {CP_QUICK_ACTIONS.map(({ label, href, QIcon, color }) => (
                      <Link key={href} href={href} onClick={close}
                        className="flex items-center gap-3 px-4 py-[9px] transition-colors"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.hov; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}12` }}>
                          <QIcon size={13} style={{ color }} />
                        </div>
                        <span className="flex-1 text-[0.80rem] font-medium" style={{ color: c.tx }}>{label}</span>
                        <ArrowRight size={11} style={{ color: c.tx3, flexShrink: 0 }} />
                      </Link>
                    ))}
                    <div className="mx-4 mt-3 pt-3" style={{ borderTop: `1px solid ${c.bdr}` }}>
                      <p className="mb-1.5 text-[0.53rem] font-bold uppercase tracking-[0.14em]" style={{ color: c.tx3 }}>
                        Sources disponibles
                      </p>
                      <div className="flex flex-wrap gap-1.5 pb-2">
                        {[
                          { label: "Factures", color: "#22c55e" },
                          { label: "Clients",  color: "#60a5fa" },
                          { label: "Dépenses", color: "#ef4444" },
                          { label: "Agenda",   color: "#a78bfa" },
                          { label: "Apps",     color: GOLD      },
                        ].map(({ label, color }) => (
                          <span key={label} className="rounded-full px-2 py-0.5 text-[0.58rem] font-semibold"
                            style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-2" style={{ borderTop: `1px solid ${c.bdr}` }}>
                {[["↑↓","naviguer"], ["↵","ouvrir"], ["Esc","fermer"]].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1">
                    <kbd className="rounded px-1 py-0.5 text-[0.46rem] font-mono"
                      style={{ background: c.sur, border: `1px solid ${c.bdr}`, color: c.tx3 }}>{key}</kbd>
                    <span className="text-[0.52rem]" style={{ color: c.tx3 }}>{label}</span>
                  </div>
                ))}
                <span className="ml-auto text-[0.52rem] font-bold tracking-wider" style={{ color: `${GOLD}70` }}>DJAMA</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
