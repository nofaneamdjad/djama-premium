"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Clock, MapPin, Video, Loader2, CalendarX, Zap, ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface Meeting {
  id: string; title: string; description: string;
  date_at: string; duration_minutes: number;
  location: string; meet_link: string; status: string;
}

type Filter = "upcoming" | "past";

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  planned:   { label: "Planifiée",  color: GOLD       },
  ongoing:   { label: "En cours",   color: "#10b981"  },
  completed: { label: "Terminée",   color: "#64748b"  },
  cancelled: { label: "Annulée",    color: "#f87171"  },
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString())    return "Aujourd'hui";
  if (d.toDateString() === tomorrow.toDateString()) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export default function MembreReunions() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>("upcoming");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const meta = user.user_metadata;
      const tid  = meta?.team_id ?? user.id;
      const sid  = meta?.space_id ?? null;
      let q = supabase.from("team_meetings")
        .select("id,title,description,date_at,duration_minutes,location,meet_link,status")
        .eq("user_id", tid);
      if (sid) q = q.eq("space_id", sid);
      const { data } = await q.order("date_at", { ascending: filter === "upcoming" });
      setMeetings((data ?? []) as Meeting[]);
      setLoading(false);
    })();
  }, [filter]);

  const now = new Date();
  const filtered = meetings.filter(m =>
    filter === "upcoming"
      ? new Date(m.date_at) >= now || m.status === "ongoing"
      : new Date(m.date_at) < now && m.status !== "planned" && m.status !== "ongoing"
  );

  const upcomingCount = meetings.filter(m => new Date(m.date_at) >= now || m.status === "ongoing").length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Header */}
      <div className="relative shrink-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(201,165,90,0.1)" }}>
            <CalendarDays size={16} style={{ color: GOLD }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-white">Réunions</p>
            <p className="text-[11px] text-white/35">
              {upcomingCount} à venir
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/[0.06]">
          {([
            { k: "upcoming", l: "À venir"  },
            { k: "past",     l: "Passées"  },
          ] as const).map(tab => (
            <button key={tab.k} onClick={() => setFilter(tab.k)}
              className="flex-1 py-2.5 text-xs font-medium relative transition-all"
              style={{ color: filter === tab.k ? GOLD : "rgba(255,255,255,0.35)" }}>
              {tab.l}
              {filter === tab.k && (
                <motion.div layoutId="reunion-tab"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ background: GOLD }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(201,165,90,0.07)", border: "1px solid rgba(201,165,90,0.14)" }}>
              <CalendarX size={28} style={{ color: GOLD, opacity: 0.6 }} />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-sm font-semibold">
                {filter === "upcoming" ? "Aucune réunion planifiée" : "Aucune réunion passée"}
              </p>
              <p className="text-white/20 text-xs mt-1">
                {filter === "upcoming" ? "Les prochaines réunions apparaîtront ici" : "L'historique s'affichera ici"}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((m, i) => {
              const d     = new Date(m.date_at);
              const isToday = d.toDateString() === now.toDateString();
              const st    = STATUS_CFG[m.status] ?? STATUS_CFG.planned;
              const open  = expanded === m.id;

              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border overflow-hidden transition-all"
                  style={{
                    borderColor: isToday ? `${GOLD}35` : "rgba(255,255,255,0.07)",
                    background: isToday ? `${GOLD}06` : "rgba(255,255,255,0.025)",
                  }}>

                  {/* Row principale */}
                  <button className="w-full flex items-center gap-3 px-4 py-4 text-left"
                    onClick={() => setExpanded(open ? null : m.id)}>

                    {/* Date bloc */}
                    <div className="shrink-0 w-12 text-center">
                      <p className="text-[9px] uppercase font-black tracking-widest text-white/30">
                        {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </p>
                      <p className="text-2xl font-extrabold leading-none mt-0.5"
                        style={{ color: isToday ? "#f59e0b" : GOLD }}>
                        {d.getDate()}
                      </p>
                      <p className="text-[9px] text-white/25 mt-0.5">
                        {d.toLocaleDateString("fr-FR", { month: "short" })}
                      </p>
                    </div>

                    <div className="w-px h-10 bg-white/[0.06] shrink-0" />

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isToday && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400">
                            Aujourd&apos;hui
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${st.color}12`, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-white/85 truncate">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-white/35 flex items-center gap-1">
                          <Clock size={10} />
                          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {" · "}{m.duration_minutes} min
                        </span>
                        {m.location && (
                          <span className="text-[11px] text-white/25 flex items-center gap-1">
                            <MapPin size={10} />{m.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
                      className="shrink-0 text-white/20">
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>

                  {/* Détails expandables */}
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 pt-0 border-t border-white/[0.05] space-y-3">
                          {m.description && (
                            <p className="text-[12px] text-white/40 leading-relaxed pt-3">
                              {m.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap pt-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                              <Clock size={11} />
                              {dayLabel(m.date_at)} à{" "}
                              {new Date(m.date_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            {m.location && (
                              <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                                <MapPin size={11} />{m.location}
                              </div>
                            )}
                          </div>
                          {m.meet_link && (
                            <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:brightness-110"
                              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                              <Video size={13} />Rejoindre la réunion
                              <Zap size={11} />
                            </a>
                          )}
                          {!m.meet_link && (
                            <div className="flex items-center gap-2 text-[11px] text-white/20">
                              <MapPin size={11} />
                              {m.location || "Lieu non précisé"}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
