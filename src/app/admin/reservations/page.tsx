"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar, CheckCircle, XCircle, Clock,
  Loader2, RefreshCw, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Reservation = {
  id:           string;
  client_name:  string;
  client_email: string;
  service:      string;
  scheduled_at: string;
  duration_min: number;
  status:       string;
  notes:        string;
  created_at:   string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusStyle(s: string) {
  if (s === "confirmé")   return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "en attente") return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  if (s === "annulé")     return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  if (s === "terminé")    return "text-white/35 bg-white/[0.06]";
  return "text-white/40 bg-white/[0.06]";
}

function serviceColor(t: string) {
  if (t.toLowerCase().includes("découverte")) return "#c9a55a";
  if (t.toLowerCase().includes("coaching"))   return "#a78bfa";
  if (t.toLowerCase().includes("soutien"))    return "#60a5fa";
  return "#4ade80";
}

function formatScheduledAt(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return { date, time };
  } catch {
    return { date: iso, time: "" };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [updating,     setUpdating]     = useState<string | null>(null);

  const loadRef = useRef(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchReservations(silent = false) {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("scheduled_at", { ascending: false });

      if (error) {
        console.error("[Admin Reservations] fetch error:", error);
        setLoadError("Impossible de charger les réservations.");
        return;
      }

      console.log("[Admin Reservations] fetched rows count:", (data ?? []).length);
      setReservations((data ?? []) as Reservation[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    fetchReservations();
  }, []);

  // ── Update status ────────────────────────────────────────────────────────

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("[Admin Reservations] update error:", error);
    } else {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
    setUpdating(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const confirmed  = reservations.filter(r => r.status === "confirmé").length;
  const pending    = reservations.filter(r => r.status === "en attente").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Réservations</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">
            {confirmed} confirmée{confirmed !== 1 ? "s" : ""} · {pending} en attente
          </p>
        </div>
        <button
          onClick={() => fetchReservations(false)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#18181c] px-3.5 py-2.5 text-[0.8rem] text-white/40 hover:text-white/70 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Error */}
      {loadError && (
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-5 py-4 text-[0.84rem] text-[#f87171]">
          <X size={15} /> {loadError}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#c9a55a]" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#18181c] py-16">
          <Calendar size={32} className="text-white/15" />
          <p className="text-sm text-white/30">Aucune réservation pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reservations.map(r => {
            const { date, time } = formatScheduledAt(r.scheduled_at);
            const color = serviceColor(r.service);
            const isUpdating = updating === r.id;

            return (
              <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-5">

                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${color}14` }}
                    >
                      <Calendar size={15} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[0.84rem] font-bold text-white/85">{r.client_name}</p>
                      <p className="text-[0.72rem]" style={{ color }}>{r.service}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.66rem] font-bold ${statusStyle(r.status)}`}>
                    {r.status}
                  </span>
                </div>

                {/* Date / heure */}
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                  <Clock size={13} className="text-white/25" />
                  <span className="text-[0.8rem] text-white/50">
                    {date}{time ? ` à ${time}` : ""}
                  </span>
                </div>

                {/* Email */}
                <p className="mb-1 text-[0.73rem] text-white/30">{r.client_email}</p>

                {/* Notes */}
                {r.notes && (
                  <p className="mb-3 text-[0.7rem] text-white/20 line-clamp-2">{r.notes}</p>
                )}

                {/* Actions */}
                {r.status === "en attente" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(r.id, "confirmé")}
                      disabled={isUpdating}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[rgba(74,222,128,0.12)] py-2 text-[0.78rem] font-bold text-[#4ade80] transition-colors hover:bg-[rgba(74,222,128,0.18)] disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                      Confirmer
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "annulé")}
                      disabled={isUpdating}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[rgba(248,113,113,0.10)] py-2 text-[0.78rem] font-bold text-[#f87171] transition-colors hover:bg-[rgba(248,113,113,0.16)] disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
