"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, Calendar, MapPin, Video, Phone,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

const LOC_ICON: Record<string, React.ReactNode> = {
  visio:      <Video      size={13} />,
  phone:      <Phone      size={13} />,
  presential: <MapPin     size={13} />,
  custom:     <MapPin     size={13} />,
};
const LOC_LABEL: Record<string, string> = {
  visio: "Visioconférence", phone: "Téléphone",
  presential: "Présentiel",  custom: "Sur place",
};

export interface ApptData {
  client_name: string;
  start_at: string;
  end_at: string;
  status: string;
  type_name: string;
  type_color: string;
  type_duration: number;
  type_location_type: string;
  type_location_value: string;
  reschedule_token: string;
}

interface DaySlots { date: string; times: string[] }

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
function apptDate(utcIso: string): string {
  return new Date(utcIso).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Indian/Mayotte",
  });
}
function apptTime(utcIso: string): string {
  return new Date(utcIso).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mayotte",
  });
}
function toUTC(ymd: string, hhmm: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, m]     = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 3, m)).toISOString();
}
function monthLabel(y: number, mo: number): string {
  return new Date(y, mo, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function daysInMonth(y: number, mo: number): number { return new Date(y, mo + 1, 0).getDate(); }
function firstDOW(y: number, mo: number): number { return (new Date(y, mo, 1).getDay() + 6) % 7; }
function fmtDate(ymd: string): string {
  return new Date(ymd + "T12:00:00Z").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

type UIState = "pick" | "done" | "cancelled" | "error";

export default function RescheduleUI({ appt }: { appt: ApptData }) {
  const accent = appt.type_color || "#c9a55a";

  const [uiState,  setUiState]  = useState<UIState>(
    appt.status === "cancelled" ? "cancelled" : "pick",
  );
  const [slots,    setSlots]    = useState<DaySlots[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selDate,  setSelDate]  = useState<string | null>(null);
  const [selTime,  setSelTime]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [newAppt,    setNewAppt]    = useState<{ start_at: string; end_at: string } | null>(null);

  // ── Fetch slots ────────────────────────────────────────────────────────
  const fetchSlots = useCallback(async (y: number, mo: number) => {
    setLoading(true);
    setSlots([]);
    try {
      const lastDay = daysInMonth(y, mo);
      const from = `${y}-${String(mo + 1).padStart(2, "0")}-01`;
      const to   = `${y}-${String(mo + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const r = await fetch(
        `/api/rdv/slots-reschedule?token=${appt.reschedule_token}&from=${from}&to=${to}`,
      );
      if (r.ok) setSlots((await r.json()).slots ?? []);
    } catch { /* affichera "aucune dispo" */ }
    finally  { setLoading(false); }
  }, [appt.reschedule_token]);

  // Charger le mois courant au montage
  useEffect(() => { fetchSlots(calYear, calMonth); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMonthNav(dir: 1 | -1) {
    let mo = calMonth + dir, y = calYear;
    if (mo > 11) { mo = 0; y++; }
    if (mo < 0)  { mo = 11; y--; }
    setCalMonth(mo); setCalYear(y);
    setSelDate(null); setSelTime(null);
    fetchSlots(y, mo);
  }

  async function handleSubmit() {
    if (!selDate || !selTime) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const r = await fetch("/api/rdv/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token:        appt.reschedule_token,
          new_start_at: toUTC(selDate, selTime),
        }),
      });
      const data = await r.json();
      if (!r.ok) { setApiError(data.error ?? "Erreur."); return; }
      setNewAppt(data.appointment);
      setUiState("done");
    } catch {
      setApiError("Problème réseau. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Calendar data ──────────────────────────────────────────────────────
  const today        = new Date().toISOString().slice(0, 10);
  const nowY         = new Date().getFullYear();
  const nowMo        = new Date().getMonth();
  const prevDisabled = calYear === nowY && calMonth === nowMo;
  const availDates   = new Set(slots.map(s => s.date));
  const timesForDay  = selDate ? (slots.find(s => s.date === selDate)?.times ?? []) : [];
  const firstDow     = firstDOW(calYear, calMonth);
  const numDays      = daysInMonth(calYear, calMonth);
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // ── Shared styles ──────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    backgroundColor: "white", borderRadius: 12,
    border: "1px solid #e5e7eb", padding: "16px 20px",
  };

  // ── Appointment summary (current) ──────────────────────────────────────
  const currentSummary = (
    <div style={{ ...card, borderColor: "#e5e7eb", marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        Rendez-vous actuel
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: appt.type_color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{appt.type_name}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 13, color: "#6b7280" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={13} /> {apptDate(appt.start_at)}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={13} /> {apptTime(appt.start_at)} ({fmt(appt.type_duration)})
        </span>
      </div>
    </div>
  );

  // ── États finaux ───────────────────────────────────────────────────────
  if (uiState === "cancelled") {
    return (
      <div style={{ textAlign: "center" }}>
        <XCircle size={52} style={{ color: "#9ca3af", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>
          Rendez-vous annulé
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Ce rendez-vous a été annulé et ne peut plus être reprogrammé.
        </p>
      </div>
    );
  }

  if (uiState === "done" && newAppt) {
    return (
      <div style={{ textAlign: "center" }}>
        <CheckCircle size={52} style={{ color: accent, margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          Rendez-vous reprogrammé !
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
          Votre rendez-vous a bien été mis à jour.
        </p>
        <div style={{ ...card, maxWidth: 380, margin: "0 auto", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: appt.type_color }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{appt.type_name}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#6b7280" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={13} /> {apptDate(newAppt.start_at)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={13} /> {apptTime(newAppt.start_at)} ({fmt(appt.type_duration)})
            </span>
            {appt.type_location_value && (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {LOC_ICON[appt.type_location_type]} {LOC_LABEL[appt.type_location_type]}
                {" — "}{appt.type_location_value}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Sélection date + heure ─────────────────────────────────────────────
  return (
    <div>
      {currentSummary}

      <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
        Choisissez un nouveau créneau
      </p>

      {/* Calendrier */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button
            onClick={() => handleMonthNav(-1)} disabled={prevDisabled}
            style={{ background: "none", border: "none", cursor: prevDisabled ? "default" : "pointer", padding: 4, color: prevDisabled ? "#d1d5db" : "#6b7280", display: "flex" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>
            {monthLabel(calYear, calMonth)}
          </span>
          <button onClick={() => handleMonthNav(1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#6b7280", display: "flex" }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
          {["Lu","Ma","Me","Je","Ve","Sa","Di"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", color: "#9ca3af" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const ymd     = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isAvail = availDates.has(ymd);
              const isPast  = ymd < today;
              const isToday = ymd === today;
              const isSel   = ymd === selDate;
              return (
                <button
                  key={i}
                  disabled={!isAvail || isPast}
                  onClick={() => { setSelDate(ymd); setSelTime(null); }}
                  style={{
                    padding: "7px 0", borderRadius: 8,
                    fontSize: 13, fontWeight: isAvail ? 700 : 400,
                    border: isToday && !isSel ? `2px solid ${accent}66` : "2px solid transparent",
                    cursor: isAvail && !isPast ? "pointer" : "default",
                    backgroundColor: isSel ? accent : isAvail && !isPast ? `${accent}18` : "transparent",
                    color: isSel ? "white" : isAvail && !isPast ? accent : "#d1d5db",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}

        {!loading && slots.length === 0 && (
          <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>
            Aucune disponibilité ce mois-ci
          </p>
        )}
      </div>

      {/* Créneaux horaires */}
      {selDate && (
        <div style={{ ...card, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            {fmtDate(selDate)}
          </p>
          {timesForDay.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Aucun créneau disponible ce jour.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {timesForDay.map(t => (
                <button
                  key={t} onClick={() => setSelTime(t)}
                  style={{
                    padding: "9px 4px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: `1.5px solid ${selTime === t ? accent : "#e5e7eb"}`,
                    backgroundColor: selTime === t ? accent : "white",
                    color: selTime === t ? "white" : "#374151",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {apiError && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 12,
          backgroundColor: "#fef2f2", border: "1px solid #fecaca",
          color: "#dc2626", fontSize: 13,
        }}>
          {apiError}
        </div>
      )}

      {selDate && selTime && (
        <button
          onClick={handleSubmit} disabled={submitting}
          style={{
            padding: "11px", borderRadius: 8, border: "none", width: "100%",
            backgroundColor: submitting ? "#d1d5db" : accent,
            color: "white", fontWeight: 600, fontSize: 14,
            cursor: submitting ? "default" : "pointer",
            display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
          }}
        >
          {submitting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
          {submitting ? "Reprogrammation en cours…" : `Confirmer pour le ${fmtDate(selDate)} à ${selTime}`}
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
