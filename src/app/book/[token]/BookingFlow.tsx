"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import {
  CheckCircle, Clock, Video, Phone, MapPin,
  Calendar, ChevronLeft, ChevronRight, ArrowLeft,
  User, Mail, Building2, MessageSquare, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface PageInfo {
  id: string;
  token: string;
  page_title: string;
  page_description: string;
  accent_color: string;
}

interface Question {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox";
  required?: boolean;
  options?: string[];
}

interface RdvType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  color: string;
  location_type: string;
  location_value: string;
  advance_notice_hours: number;
  booking_window_days: number;
  questions: Question[];
  payment_required: boolean;
  payment_amount_cents: number;
  payment_mode: string;
}

interface DaySlots {
  date: string;
  times: string[];
}

type Step = "type" | "datetime" | "info" | "payment" | "done";

// ── Helpers ────────────────────────────────────────────────────────────────

const LOC_ICON: Record<string, React.ReactNode> = {
  visio:       <Video       size={13} />,
  phone:       <Phone       size={13} />,
  presential:  <MapPin      size={13} />,
  custom:      <MapPin      size={13} />,
};
const LOC_LABEL: Record<string, string> = {
  visio:       "Visioconférence",
  phone:       "Téléphone",
  presential:  "Présentiel",
  custom:      "Sur place",
};

function fmt(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** "2026-10-07" + "09:30" → UTC ISO (Indian/Mayotte = UTC+3) */
function toUTC(ymd: string, hhmm: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, m]     = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 3, m)).toISOString();
}

function monthLabel(y: number, mo: number): string {
  return new Date(y, mo, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function daysInMonth(y: number, mo: number): number {
  return new Date(y, mo + 1, 0).getDate();
}
/** Monday-first day index (0=Mon … 6=Sun). */
function firstDOW(y: number, mo: number): number {
  return (new Date(y, mo, 1).getDay() + 6) % 7;
}

function fmtDate(ymd: string): string {
  return new Date(ymd + "T12:00:00Z").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BookingFlow({
  page,
  types,
}: {
  page: PageInfo;
  types: RdvType[];
}) {
  const accent = page.accent_color || "#c9a55a";

  const [step,         setStep]         = useState<Step>("type");
  const [selType,      setSelType]      = useState<RdvType | null>(null);
  const [slots,        setSlots]        = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calYear,      setCalYear]      = useState(() => new Date().getFullYear());
  const [calMonth,     setCalMonth]     = useState(() => new Date().getMonth());
  const [selDate,      setSelDate]      = useState<string | null>(null);
  const [selTime,      setSelTime]      = useState<string | null>(null);

  // form
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [company, setCompany] = useState("");
  const [notes,   setNotes]   = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [submitting,     setSubmitting]     = useState(false);
  const [booking,        setBooking]        = useState<{ start_at: string; end_at: string; status: string } | null>(null);
  const [apiError,       setApiError]       = useState<string | null>(null);
  const [clientSecret,   setClientSecret]   = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError,   setPaymentError]   = useState<string | null>(null);
  const [paymentDone,    setPaymentDone]    = useState(false);

  const stripeRef   = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const mountedRef  = useRef(false);

  // ── Fetch slots for a given month ────────────────────────────────────────
  const fetchSlots = useCallback(async (type: RdvType, y: number, mo: number) => {
    setLoadingSlots(true);
    setSlots([]);
    try {
      const lastDay = daysInMonth(y, mo);
      const from = `${y}-${String(mo + 1).padStart(2, "0")}-01`;
      const to   = `${y}-${String(mo + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const r = await fetch(
        `/api/rdv/slots?token=${page.token}&rdv_type_id=${type.id}&from=${from}&to=${to}`,
      );
      if (r.ok) setSlots((await r.json()).slots ?? []);
    } catch { /* réseau — l'UI affiche simplement "aucune dispo" */ }
    finally  { setLoadingSlots(false); }
  }, [page.token]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleSelectType(t: RdvType) {
    setSelType(t);
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setSelDate(null);
    setSelTime(null);
    fetchSlots(t, now.getFullYear(), now.getMonth());
    setStep("datetime");
  }

  function handleMonthNav(dir: 1 | -1) {
    let mo = calMonth + dir, y = calYear;
    if (mo > 11) { mo = 0; y++; }
    if (mo < 0)  { mo = 11; y--; }
    setCalMonth(mo);
    setCalYear(y);
    setSelDate(null);
    setSelTime(null);
    if (selType) fetchSlots(selType, y, mo);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selType || !selDate || !selTime) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const r = await fetch("/api/rdv/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token:          page.token,
          rdv_type_id:    selType.id,
          start_at:       toUTC(selDate, selTime),
          client_name:    name.trim(),
          client_email:   email.trim(),
          client_phone:   phone.trim(),
          client_company: company.trim(),
          client_notes:   notes.trim(),
          answers,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setApiError(data.error ?? "Une erreur est survenue."); return; }
      setBooking(data.appointment);
      if (data.requires_payment && data.client_secret) {
        setClientSecret(data.client_secret);
        mountedRef.current = false; // allow Stripe to mount fresh
        setStep("payment");
      } else {
        setStep("done");
      }
    } catch {
      setApiError("Problème réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Stripe Elements mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "payment" || !clientSecret || mountedRef.current) return;
    mountedRef.current = true;

    const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pubKey) return;

    import("@stripe/stripe-js").then(({ loadStripe }) => {
      loadStripe(pubKey).then(stripe => {
        if (!stripe) return;
        stripeRef.current = stripe;
        const elements = stripe.elements({ clientSecret, locale: "fr" });
        elementsRef.current = elements;
        const pe = elements.create("payment", { layout: "tabs" });
        pe.mount("#stripe-payment-element");
      });
    });

    return () => {
      elementsRef.current?.getElement("payment")?.unmount();
    };
  }, [step, clientSecret]);

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripeRef.current || !elementsRef.current) return;
    setPaymentLoading(true);
    setPaymentError(null);
    const { error } = await stripeRef.current.confirmPayment({
      elements:      elementsRef.current,
      confirmParams: { return_url: typeof window !== "undefined" ? window.location.href : "" },
      redirect:      "if_required",
    });
    if (error) {
      setPaymentError(error.message ?? "Erreur de paiement.");
      setPaymentLoading(false);
    } else {
      setPaymentDone(true);
      setStep("done");
    }
  }

  // ── Calendar data ─────────────────────────────────────────────────────────
  const today     = new Date().toISOString().slice(0, 10);
  const nowY      = new Date().getFullYear();
  const nowMo     = new Date().getMonth();
  const prevDisabled = calYear === nowY && calMonth === nowMo;

  const availDates = new Set(slots.map(s => s.date));
  const timesForDay = selDate ? (slots.find(s => s.date === selDate)?.times ?? []) : [];

  const firstDow  = firstDOW(calYear, calMonth);
  const numDays   = daysInMonth(calYear, calMonth);
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: 12,
    border: "1px solid #e5e7eb", padding: "16px 20px",
  };
  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8,
    border: "1px solid #d1d5db", fontSize: 14,
    outline: "none", width: "100%", boxSizing: "border-box",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: "#374151",
    display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
  };
  const btnPrimary: React.CSSProperties = {
    padding: "11px 20px", borderRadius: 8, border: "none",
    backgroundColor: accent, color: "white",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
    width: "100%", transition: "opacity 0.15s",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
            {page.page_title}
          </h1>
          {page.page_description && (
            <p style={{ fontSize: 14, color: "#6b7280", margin: "6px 0 0" }}>
              {page.page_description}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 48px" }}>

        {/* ── ÉTAPE 1 : Choisir un type ─────────────────────────────── */}
        {step === "type" && (
          <div>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
              Choisissez le type de rendez-vous souhaité.
            </p>
            {types.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                Aucun type de rendez-vous disponible pour le moment.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {types.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectType(t)}
                    style={{
                      ...cardStyle, padding: "16px 20px",
                      display: "flex", alignItems: "flex-start", gap: 14,
                      textAlign: "left", cursor: "pointer",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = accent;
                      el.style.boxShadow  = `0 0 0 3px ${accent}22`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "#e5e7eb";
                      el.style.boxShadow   = "none";
                    }}
                  >
                    {/* Color dot */}
                    <div style={{
                      width: 10, height: 10, borderRadius: 9999,
                      backgroundColor: t.color, marginTop: 5, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: 15 }}>{t.name}</div>
                      {t.description && (
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3, whiteSpace: "pre-wrap" }}>
                          {t.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280" }}>
                          <Clock size={12} /> {fmt(t.duration_minutes)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280" }}>
                          {LOC_ICON[t.location_type] ?? <MapPin size={12} />}
                          {LOC_LABEL[t.location_type] ?? t.location_type}
                          {t.location_value && <span style={{ color: "#9ca3af" }}>— {t.location_value}</span>}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: "#9ca3af", flexShrink: 0, marginTop: 2 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 2 : Date + Heure ────────────────────────────────── */}
        {step === "datetime" && selType && (
          <div>
            {/* Retour */}
            <button
              onClick={() => setStep("type")}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16 }}
            >
              <ArrowLeft size={14} /> Retour
            </button>

            {/* Type sélectionné */}
            <div style={{ ...cardStyle, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: selType.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{selType.name}</span>
              <span style={{ fontSize: 13, color: "#6b7280", marginLeft: "auto" }}>{fmt(selType.duration_minutes)}</span>
            </div>

            {/* Calendrier */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              {/* Navigation mois */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <button
                  onClick={() => handleMonthNav(-1)}
                  disabled={prevDisabled}
                  style={{ background: "none", border: "none", cursor: prevDisabled ? "default" : "pointer", padding: 4, color: prevDisabled ? "#d1d5db" : "#6b7280", display: "flex" }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>
                  {monthLabel(calYear, calMonth)}
                </span>
                <button
                  onClick={() => handleMonthNav(1)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#6b7280", display: "flex" }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* En-têtes jours */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
                {["Lu","Ma","Me","Je","Ve","Sa","Di"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "2px 0" }}>{d}</div>
                ))}
              </div>

              {loadingSlots ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "24px 0", color: "#9ca3af" }}>
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {cells.map((day, i) => {
                    if (day === null) return <div key={i} />;
                    const ymd      = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isAvail  = availDates.has(ymd);
                    const isPast   = ymd < today;
                    const isToday  = ymd === today;
                    const isSel    = ymd === selDate;
                    return (
                      <button
                        key={i}
                        disabled={!isAvail || isPast}
                        onClick={() => { setSelDate(ymd); setSelTime(null); }}
                        style={{
                          padding: "7px 0",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isAvail ? 700 : 400,
                          border: isToday && !isSel ? `2px solid ${accent}66` : "2px solid transparent",
                          cursor: isAvail && !isPast ? "pointer" : "default",
                          backgroundColor: isSel ? accent : isAvail && !isPast ? `${accent}18` : "transparent",
                          color: isSel ? "white" : isAvail && !isPast ? accent : "#d1d5db",
                          transition: "background-color 0.1s",
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              )}

              {!loadingSlots && slots.length === 0 && (
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>
                  Aucune disponibilité ce mois-ci
                </p>
              )}
            </div>

            {/* Créneaux horaires */}
            {selDate && (
              <div style={cardStyle}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                  {fmtDate(selDate)}
                </p>
                {timesForDay.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>Aucun créneau disponible ce jour.</p>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                      {timesForDay.map(t => (
                        <button
                          key={t}
                          onClick={() => setSelTime(t)}
                          style={{
                            padding: "9px 4px", borderRadius: 8,
                            fontSize: 13, fontWeight: 500,
                            border: `1.5px solid ${selTime === t ? accent : "#e5e7eb"}`,
                            backgroundColor: selTime === t ? accent : "white",
                            color: selTime === t ? "white" : "#374151",
                            cursor: "pointer", transition: "all 0.1s",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {selTime && (
                      <button
                        onClick={() => setStep("info")}
                        style={{ ...btnPrimary, marginTop: 16 }}
                      >
                        Continuer →
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 3 : Coordonnées ─────────────────────────────────── */}
        {step === "info" && selType && selDate && selTime && (
          <div>
            <button
              onClick={() => setStep("datetime")}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16 }}
            >
              <ArrowLeft size={14} /> Retour
            </button>

            {/* Récapitulatif créneau */}
            <div style={{ ...cardStyle, borderColor: `${accent}44`, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 8 }}>{selType.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: "#6b7280" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} /> {fmtDate(selDate)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={13} /> {selTime} ({fmt(selType.duration_minutes)})
                </span>
                {selType.location_value && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {LOC_ICON[selType.location_type]} {selType.location_value}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Nom */}
              <div>
                <label style={labelStyle}><User size={13} /> Nom complet *</label>
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jean Dupont" style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}><Mail size={13} /> Adresse email *</label>
                <input
                  required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="jean@exemple.com" style={inputStyle}
                />
              </div>

              {/* Téléphone */}
              <div>
                <label style={labelStyle}><Phone size={13} /> Téléphone</label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+262 639 …" style={inputStyle}
                />
              </div>

              {/* Entreprise */}
              <div>
                <label style={labelStyle}><Building2 size={13} /> Entreprise</label>
                <input
                  value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="Nom de votre entreprise (optionnel)" style={inputStyle}
                />
              </div>

              {/* Questions personnalisées */}
              {selType.questions?.length > 0 && selType.questions.map(q => (
                <div key={q.id}>
                  <label style={labelStyle}>{q.label}{q.required && " *"}</label>
                  {q.type === "select" ? (
                    <select
                      required={q.required}
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">— Sélectionner —</option>
                      {q.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : q.type === "checkbox" ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={answers[q.id] === "true"}
                        onChange={e => setAnswers(p => ({ ...p, [q.id]: String(e.target.checked) }))}
                      />
                      {q.label}
                    </label>
                  ) : (
                    <input
                      required={q.required}
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}

              {/* Message libre */}
              <div>
                <label style={labelStyle}><MessageSquare size={13} /> Message (optionnel)</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Précisez votre demande si nécessaire…"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {apiError && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                  color: "#dc2626", fontSize: 13,
                }}>
                  {apiError}
                </div>
              )}

              <button
                type="submit" disabled={submitting}
                style={{ ...btnPrimary, opacity: submitting ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
              >
                {submitting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                {submitting ? "Envoi en cours…" : "Confirmer le rendez-vous"}
              </button>
            </form>
          </div>
        )}

        {/* ── ÉTAPE 4 : Paiement Stripe ─────────────────────────────── */}
        {step === "payment" && selType && selDate && selTime && (
          <div>
            <button
              onClick={() => setStep("info")}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16 }}
            >
              <ArrowLeft size={14} /> Retour
            </button>

            {/* Récapitulatif créneau */}
            <div style={{ ...cardStyle, borderColor: `${accent}44`, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 6 }}>{selType.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} /> {fmtDate(selDate)} à {selTime}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                {selType.payment_mode === "deposit" ? "Acompte" : "Total"} :{" "}
                {(selType.payment_amount_cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div id="stripe-payment-element" style={{ minHeight: 120 }} />

              {paymentError && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                  color: "#dc2626", fontSize: 13,
                }}>
                  {paymentError}
                </div>
              )}

              <button
                type="submit"
                disabled={paymentLoading}
                style={{ ...btnPrimary, opacity: paymentLoading ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
              >
                {paymentLoading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                {paymentLoading
                  ? "Traitement en cours…"
                  : `Payer ${(selType.payment_amount_cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`}
              </button>

              <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: 0 }}>
                Paiement sécurisé — votre rendez-vous sera confirmé après validation du paiement.
              </p>
            </form>
          </div>
        )}

        {/* ── ÉTAPE 5 : Confirmation ────────────────────────────────── */}
        {step === "done" && booking && selType && selDate && selTime && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <CheckCircle size={60} style={{ color: accent, margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
              {paymentDone
                ? "Paiement reçu !"
                : booking.status === "confirmed" ? "Rendez-vous confirmé !" : "Demande envoyée !"}
            </h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
              {paymentDone
                ? "Vous recevrez un email de confirmation une fois le paiement validé."
                : booking.status === "confirmed"
                  ? "Votre rendez-vous a bien été enregistré."
                  : "Votre demande est en attente de confirmation par notre équipe."}
            </p>

            <div style={{ ...cardStyle, maxWidth: 380, margin: "0 auto", textAlign: "left" }}>
              <div style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 10 }}>
                {selType.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13, color: "#6b7280" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={13} /> {fmtDate(selDate)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={13} /> {selTime} ({fmt(selType.duration_minutes)})
                </span>
                {selType.location_value && (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {LOC_ICON[selType.location_type]} {selType.location_value}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
