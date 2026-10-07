export default function BookNotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#f3f4f6", fontFamily: "system-ui,-apple-system,sans-serif",
      padding: 24, textAlign: "center",
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 320 }}>
        Cette page de réservation n&apos;existe pas ou n&apos;est plus active.
        Veuillez vérifier le lien ou contacter l&apos;organisateur.
      </p>
    </div>
  );
}
