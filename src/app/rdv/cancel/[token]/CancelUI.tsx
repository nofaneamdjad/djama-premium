"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Clock, Calendar, MapPin, Video, Phone, Loader2 } from "lucide-react";

const LOC_ICON: Record<string, React.ReactNode> = {
  visio:      <Video      size={14} />,
  phone:      <Phone      size={14} />,
  presential: <MapPin     size={14} />,
  custom:     <MapPin     size={14} />,
};
const LOC_LABEL: Record<string, string> = {
  visio:      "Visioconférence",
  phone:      "Téléphone",
  presential: "Présentiel",
  custom:     "Sur place",
};

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
    hour: "2-digit", minute: "2-digit",
    timeZone: "Indian/Mayotte",
  });
}

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
}

type UIState = "confirm" | "submitting" | "done" | "already" | "error";

export default function CancelUI({ token, appt }: { token: string; appt: ApptData }) {
  const [uiState, setUiState] = useState<UIState>(
    appt.status === "cancelled" ? "already" : "confirm",
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const accent = "#c9a55a"; // gold DJAMA par défaut pour la page d'annulation

  async function handleCancel() {
    setUiState("submitting");
    setApiError(null);
    try {
      const r = await fetch("/api/rdv/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (!r.ok) {
        setApiError(data.error ?? "Une erreur est survenue.");
        setUiState("error");
        return;
      }
      setUiState("done");
    } catch {
      setApiError("Problème réseau. Vérifiez votre connexion et réessayez.");
      setUiState("error");
    }
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: 12,
    border: "1px solid #e5e7eb", padding: "20px",
    maxWidth: 440, margin: "0 auto",
  };

  // ── Rendez-vous summary ──────────────────────────────────────────────────
  const summary = (
    <div style={{ ...cardStyle, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: appt.type_color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{appt.type_name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#6b7280" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={13} /> {apptDate(appt.start_at)}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={13} /> {apptTime(appt.start_at)} ({fmt(appt.type_duration)})
        </span>
        {appt.type_location_value && (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {LOC_ICON[appt.type_location_type] ?? <MapPin size={13} />}
            {LOC_LABEL[appt.type_location_type] ?? appt.type_location_type}
            {" — "}{appt.type_location_value}
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>Pour :</span> {appt.client_name}
        </span>
      </div>
    </div>
  );

  // ── États ────────────────────────────────────────────────────────────────
  if (uiState === "already") {
    return (
      <div style={{ textAlign: "center" }}>
        <XCircle size={52} style={{ color: "#9ca3af", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>
          Déjà annulé
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
          Ce rendez-vous a déjà été annulé.
        </p>
        {summary}
      </div>
    );
  }

  if (uiState === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <CheckCircle size={52} style={{ color: accent, margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          Rendez-vous annulé
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
          Votre annulation a bien été enregistrée.
        </p>
        {summary}
      </div>
    );
  }

  if (uiState === "error") {
    return (
      <div style={{ textAlign: "center" }}>
        <XCircle size={52} style={{ color: "#dc2626", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          Erreur
        </h2>
        <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 24 }}>{apiError}</p>
        <button
          onClick={() => setUiState("confirm")}
          style={{ fontSize: 14, color: accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ── confirm / submitting ──────────────────────────────────────────────────
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <AlertTriangle size={48} style={{ color: "#f59e0b", margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
          Annuler ce rendez-vous ?
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Cette action est irréversible.
        </p>
      </div>

      {summary}

      <div style={{ maxWidth: 440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={handleCancel}
          disabled={uiState === "submitting"}
          style={{
            padding: "11px", borderRadius: 8, border: "none",
            backgroundColor: uiState === "submitting" ? "#d1d5db" : "#dc2626",
            color: "white", fontWeight: 600, fontSize: 14,
            cursor: uiState === "submitting" ? "default" : "pointer",
            display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
          }}
        >
          {uiState === "submitting" && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
          {uiState === "submitting" ? "Annulation en cours…" : "Confirmer l'annulation"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
