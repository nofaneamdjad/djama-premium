"use client";

/**
 * CollaboraEditor — Composant React pour l'édition via Collabora Online
 *
 * Usage :
 *   <CollaboraEditor noteId={id} onClose={() => router.push('/client/bloc-notes')} />
 *
 * Ce composant :
 *  1. Demande un token WOPI à /api/notes/editor-token
 *  2. Affiche l'iframe Collabora avec l'URL signée
 *  3. Écoute les PostMessage Collabora → notifie le parent (onClose, onSaved, etc.)
 *
 * Note : ne remplace PAS encore TiptapEditor — les deux coexistent pendant la migration.
 * Utilisé uniquement pour les documents avec editor_mode = 'collabora'.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CollaboraEditorProps {
  noteId:    string;
  className?: string;
  style?:     React.CSSProperties;
  onClose?:  () => void;
  onSaved?:  () => void;
  onError?:  (msg: string) => void;
}

type EditorStatus = "loading" | "ready" | "error";

// PostMessage reçus de Collabora
interface CollaboraMessage {
  MessageId: string;
  Status?:   string;
  Saved?:    boolean;
  [key: string]: unknown;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CollaboraEditor({
  noteId,
  className,
  style,
  onClose,
  onSaved,
  onError,
}: CollaboraEditorProps) {
  const [status,    setStatus]    = useState<EditorStatus>("loading");
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Origine Collabora pour filtrer les PostMessage
  const collaboraOrigin = process.env.NEXT_PUBLIC_COLLABORA_URL ?? "";

  // ── 1. Récupérer l'URL éditeur + token WOPI ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchEditorToken() {
      try {
        const res = await fetch("/api/notes/editor-token", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ noteId }),
          cache:   "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `Erreur ${res.status}`);
        }

        const data = await res.json() as { editorUrl: string };

        if (!cancelled) {
          setEditorUrl(data.editorUrl);
          // Status reste 'loading' jusqu'à App_LoadingStatus de Collabora
        }
      } catch (e) {
        if (!cancelled) {
          const msg = (e as Error).message;
          setErrorMsg(msg);
          setStatus("error");
          onError?.(msg);
        }
      }
    }

    fetchEditorToken();

    // Timeout 45s — Collabora non disponible
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setStatus(s => {
          if (s === "loading") {
            const msg = "Collabora Online ne répond pas (timeout 45s). Vérifiez que l'instance est démarrée.";
            setErrorMsg(msg);
            onError?.(msg);
            return "error";
          }
          return s;
        });
      }
    }, 45_000);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [noteId, onError]);

  // ── 2. Écouter les PostMessage Collabora ─────────────────────────────────
  const handleMessage = useCallback(
    (e: MessageEvent) => {
      // Filtrer les messages d'origines inconnues
      // En dev (localhost) on accepte les deux origins possibles de Collabora
      if (collaboraOrigin && e.origin !== collaboraOrigin) {
        // Accepter aussi les variations http/https en développement local
        const isLocalhost = e.origin.includes("localhost") || e.origin.includes("127.0.0.1");
        const isAllowedOrigin = collaboraOrigin.includes("localhost") || collaboraOrigin.includes("127.0.0.1");
        if (!(isLocalhost && isAllowedOrigin)) return;
      }

      const msg = e.data as CollaboraMessage | null;
      if (!msg?.MessageId) return;

      switch (msg.MessageId) {
        case "App_LoadingStatus":
          if (msg.Status === "Document_Loaded") setStatus("ready");
          break;

        case "Action_Save_Resp":
          if (msg.Saved) onSaved?.();
          break;

        case "UI_Close":
        case "close":
          onClose?.();
          break;

        case "Doc_ModifiedStatus":
          // Document modifié — peut être utilisé pour afficher un indicateur
          break;
      }
    },
    [collaboraOrigin, onClose, onSaved],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <div
        className={className}
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          height:         "100%",
          gap:            "8px",
          color:          "var(--muted, #888)",
          fontFamily:     "system-ui",
          fontSize:       "14px",
          ...style,
        }}
      >
        <span style={{ color: "var(--red, #dc2626)", fontWeight: 600 }}>
          Impossible d&apos;ouvrir l&apos;éditeur
        </span>
        {errorMsg && (
          <span style={{ fontSize: "12px", opacity: 0.7 }}>{errorMsg}</span>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop:    "8px",
            padding:      "6px 16px",
            borderRadius: "6px",
            border:       "1px solid var(--border, #ddd)",
            cursor:       "pointer",
            background:   "transparent",
            fontSize:     "13px",
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width:    "100%",
        height:   "100%",
        ...style,
      }}
      className={className}
    >
      {/* Loader affiché pendant le chargement Collabora */}
      {status === "loading" && (
        <div
          style={{
            position:       "absolute",
            inset:          0,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            background:     "var(--bg, #f4f6fb)",
            zIndex:         10,
            gap:            "12px",
            fontSize:       "13px",
            color:          "var(--muted, #888)",
            fontFamily:     "system-ui",
          }}
        >
          <svg
            width="24" height="24" viewBox="0 0 24 24"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="12" cy="12" r="10" stroke="var(--border,#ddd)" strokeWidth="3" fill="none" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent,#2150c2)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <span>Chargement de DJAMA Doc…</span>
        </div>
      )}

      {/* Iframe Collabora */}
      {editorUrl && (
        <iframe
          ref={iframeRef}
          src={editorUrl}
          allow="fullscreen"
          title="DJAMA Document Editor"
          style={{
            width:   "100%",
            height:  "100%",
            border:  "none",
            display: "block",
          }}
        />
      )}
    </div>
  );
}
