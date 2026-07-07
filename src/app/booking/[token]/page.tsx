"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Check, Loader2, Calendar, X } from "lucide-react";

const GOLD   = "#c9a55a";
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS   = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

interface PageConfig {
  title: string;
  description: string;
  duration_minutes: number;
  days_ahead: number;
  available_days: number[];
  advance_notice_hours: number;
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function BookingPage() {
  const { token } = useParams<{ token: string }>();

  const [config,    setConfig]    = useState<PageConfig | null>(null);
  const [loadErr,   setLoadErr]   = useState("");
  const [calMonth,  setCalMonth]  = useState(new Date());
  const [selected,  setSelected]  = useState<Date | null>(null);
  const [slots,     setSlots]     = useState<string[] | null>(null);
  const [loadSlots, setLoadSlots] = useState(false);
  const [chosenSlot, setChosenSlot] = useState<string | null>(null);

  // Form
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [done,    setDone]    = useState(false);
  const [bookErr, setBookErr] = useState("");

  // Load page config
  useEffect(() => {
    void fetch(`/api/booking?token=${token}`)
      .then(r => r.json())
      .then((d: { error?: string } & Partial<PageConfig>) => {
        if (d.error) { setLoadErr(d.error); return; }
        setConfig(d as PageConfig);
        // Set calendar to first available day
        const today = new Date();
        setCalMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      });
  }, [token]);

  const fetchSlots = useCallback(async (d: Date) => {
    setLoadSlots(true);
    setSlots(null);
    setChosenSlot(null);
    const r = await fetch(`/api/booking?token=${token}&date=${isoDate(d)}`);
    const data = await r.json() as { slots?: string[] };
    setSlots(data.slots ?? []);
    setLoadSlots(false);
  }, [token]);

  const handleDayClick = (d: Date) => {
    setSelected(d);
    void fetchSlots(d);
  };

  const handleBook = async () => {
    if (!selected || !chosenSlot || !name.trim() || !email.trim()) return;
    setBooking(true);
    setBookErr("");
    const r = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, date: isoDate(selected), time: chosenSlot, name: name.trim(), email: email.trim(), message }),
    });
    const d = await r.json() as { ok?: boolean; error?: string };
    setBooking(false);
    if (d.ok) { setDone(true); }
    else { setBookErr(d.error ?? "Erreur"); }
  };

  if (loadErr) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] flex items-center justify-center">
          <X size={22} className="text-white/30"/>
        </div>
        <p className="text-white/50 text-sm">{loadErr}</p>
      </div>
    </div>
  );

  if (!config) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <Loader2 size={28} className="animate-spin text-white/20"/>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background:`${GOLD}18`, border:`1px solid ${GOLD}40` }}>
          <Check size={28} style={{ color: GOLD }}/>
        </div>
        <h2 className="text-2xl font-bold text-white">Réservation confirmée !</h2>
        <p className="text-white/50 text-sm">
          Votre rendez-vous du{" "}
          <strong className="text-white">{selected?.toLocaleDateString("fr-FR", {weekday:"long",day:"numeric",month:"long"})}</strong>
          {" "}à <strong className="text-white">{chosenSlot}</strong> est confirmé.
        </p>
        <p className="text-white/30 text-xs">Un email de confirmation vous a été envoyé à <span className="text-white/50">{email}</span>.</p>
      </motion.div>
    </div>
  );

  // Calendar logic
  const today       = new Date(); today.setHours(0,0,0,0);
  const maxDate     = addDays(today, config.days_ahead);
  const firstDay    = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
  const lastDay     = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
  const startOffset = firstDay.getDay();
  const calDays: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) calDays.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) calDays.push(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));

  const isAvailable = (d: Date) => {
    if (d < today || d > maxDate) return false;
    return (config.available_days as number[]).includes(d.getDay());
  };

  const isSelected = (d: Date) => selected && isoDate(d) === isoDate(selected);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <div className="border-b border-white/6 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background:`${GOLD}18`, border:`1px solid ${GOLD}30` }}>
            <Calendar size={14} style={{ color: GOLD }}/>
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">{config.title}</h1>
            {config.description && <p className="text-xs text-white/40">{config.description}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
            <Clock size={12}/>
            {config.duration_minutes} min
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition">
                <ChevronLeft size={16}/>
              </button>
              <span className="text-sm font-bold text-white">
                {MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
              </span>
              <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition">
                <ChevronRight size={16}/>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-white/25 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map((d, i) => {
                if (!d) return <div key={i}/>;
                const avail = isAvailable(d);
                const sel   = isSelected(d);
                return (
                  <button key={i} onClick={() => avail && handleDayClick(d)} disabled={!avail}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all
                      ${sel ? "text-[#09090b] font-bold scale-105" : avail ? "text-white hover:bg-white/8" : "text-white/15 cursor-default"}`}
                    style={sel ? { background: GOLD } : undefined}>
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: slots + form */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/6 bg-white/[0.02] py-16 text-center">
                  <Calendar size={28} className="text-white/15"/>
                  <p className="text-sm text-white/30">Sélectionnez une date</p>
                </motion.div>
              ) : (
                <motion.div key={isoDate(selected)} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                  className="space-y-4">
                  {/* Date label */}
                  <p className="text-sm font-bold text-white">
                    {selected.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
                  </p>

                  {/* Slots */}
                  {loadSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-white/25"/>
                    </div>
                  ) : slots && slots.length === 0 ? (
                    <div className="rounded-xl border border-white/6 bg-white/[0.02] py-8 text-center">
                      <p className="text-sm text-white/30">Aucun créneau disponible</p>
                    </div>
                  ) : slots ? (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map(slot => (
                        <button key={slot} onClick={() => setChosenSlot(slot === chosenSlot ? null : slot)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border
                            ${chosenSlot === slot
                              ? "text-[#09090b] font-bold"
                              : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white"}`}
                          style={chosenSlot === slot ? { background: GOLD, border:`1px solid ${GOLD}` } : undefined}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* Booking form */}
                  <AnimatePresence>
                    {chosenSlot && (
                      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                        className="space-y-3 pt-2 border-t border-white/6">
                        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Vos informations</p>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom *"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"/>
                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Votre email *" type="email"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"/>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message (optionnel)" rows={2}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 resize-none"/>
                        {bookErr && <p className="text-xs text-red-400">{bookErr}</p>}
                        <button onClick={handleBook} disabled={booking || !name.trim() || !email.trim()}
                          className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                          style={{ background: GOLD, color: "#09090b" }}>
                          {booking ? <Loader2 size={16} className="inline animate-spin mr-1.5"/> : null}
                          Confirmer le rendez-vous
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
