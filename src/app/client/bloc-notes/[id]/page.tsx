"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, Check, AlertCircle, Sparkles, RefreshCw,
  Star, Download, Share2, Link2, ZoomIn, ZoomOut, Save, X,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import Toast, { type ToastData, type ToastType } from "@/components/ui/Toast";
import { TiptapEditor, type TiptapEditorRef, type Editor } from "@/components/notes/TiptapEditor";
import { EditorToolbar } from "@/components/notes/EditorToolbar";
import { CollaboraEditor } from "@/components/notes/CollaboraEditor";

// ── Constantes ────────────────────────────────────────────────────────────────
const GOLD = "#c9a55a";
const MM   = 3.7795275591;  // 1 mm en px à 96 dpi

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [794, 1123], A3: [1123, 1587], Letter: [816, 1056],
};

// ── Templates prédéfinis ──────────────────────────────────────────────────────
const TODAY = new Date().toLocaleDateString("fr-FR");
const TEMPLATE_CONTENT: Record<string, object> = {
  blank: { type: "doc", content: [{ type: "paragraph" }] },

  rapport: { type: "doc", content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "RAPPORT PROFESSIONNEL" }] },
    { type: "paragraph", content: [{ type: "text", text: `Date : ${TODAY}` }] },
    { type: "paragraph", content: [{ type: "text", text: "Auteur : " }] },
    { type: "paragraph", content: [{ type: "text", text: "Organisation : " }] },
    { type: "horizontalRule" },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Résumé exécutif" }] },
    { type: "paragraph", content: [{ type: "text", text: "Synthèse du rapport en 2-3 phrases." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "1. Introduction" }] },
    { type: "paragraph", content: [{ type: "text", text: "Contexte et objectifs du rapport." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "2. Analyse" }] },
    { type: "paragraph", content: [{ type: "text", text: "Développez votre analyse ici." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "3. Recommandations" }] },
    { type: "paragraph", content: [{ type: "text", text: "Vos recommandations opérationnelles." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "4. Conclusion" }] },
    { type: "paragraph", content: [{ type: "text", text: "Synthèse et perspectives." }] },
    { type: "horizontalRule" },
    { type: "paragraph", content: [{ type: "text", marks: [{ type: "italic" }], text: "Confidentiel — Document interne" }] },
  ]},

  "compte-rendu": { type: "doc", content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "COMPTE RENDU DE RÉUNION" }] },
    { type: "paragraph", content: [{ type: "text", text: `Date : ${TODAY}  |  Lieu :   |  Durée : ` }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Participants" }] },
    { type: "bulletList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Prénom NOM — Rôle" }] }] },
    ]},
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Ordre du jour" }] },
    { type: "orderedList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Point 1" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Point 2" }] }] },
    ]},
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Discussions et décisions" }] },
    { type: "paragraph", content: [{ type: "text", text: "Résumé des échanges et décisions prises." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Actions à mener" }] },
    { type: "taskList", content: [
      { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Action — Responsable — Échéance" }] }] },
    ]},
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Prochaine réunion" }] },
    { type: "paragraph", content: [{ type: "text", text: "Date :   |  Lieu : " }] },
  ]},

  lettre: { type: "doc", content: [
    { type: "paragraph", attrs: { textAlign: "right" }, content: [{ type: "text", text: "Ville, le " + TODAY }] },
    { type: "paragraph", content: [] },
    { type: "paragraph", content: [{ type: "text", text: "Prénom NOM" }] },
    { type: "paragraph", content: [{ type: "text", text: "Adresse" }] },
    { type: "paragraph", content: [{ type: "text", text: "Code postal — Ville" }] },
    { type: "paragraph", content: [] },
    { type: "paragraph", attrs: { textAlign: "right" }, content: [{ type: "text", text: "À l'attention de M./Mme DESTINATAIRE" }] },
    { type: "paragraph", attrs: { textAlign: "right" }, content: [{ type: "text", text: "Fonction" }] },
    { type: "paragraph", attrs: { textAlign: "right" }, content: [{ type: "text", text: "Organisation" }] },
    { type: "paragraph", content: [] },
    { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Objet : " }] },
    { type: "paragraph", content: [] },
    { type: "paragraph", content: [{ type: "text", text: "Madame, Monsieur," }] },
    { type: "paragraph", content: [] },
    { type: "paragraph", content: [{ type: "text", text: "Corps de la lettre." }] },
    { type: "paragraph", content: [] },
    { type: "paragraph", content: [{ type: "text", text: "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées." }] },
    { type: "paragraph", content: [] },
    { type: "paragraph", attrs: { textAlign: "right" }, content: [{ type: "text", text: "Prénom NOM" }] },
    { type: "paragraph", attrs: { textAlign: "right" }, content: [{ type: "text", text: "Signature" }] },
  ]},

  proposition: { type: "doc", content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "PROPOSITION COMMERCIALE" }] },
    { type: "paragraph", content: [{ type: "text", text: `Réf : PC-${TODAY.replace(/\//g,"")}  |  Date : ${TODAY}` }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "À propos de nous" }] },
    { type: "paragraph", content: [{ type: "text", text: "Présentation de votre entreprise et de votre expertise." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Votre besoin" }] },
    { type: "paragraph", content: [{ type: "text", text: "Reformulation du besoin identifié chez le client." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Notre solution" }] },
    { type: "paragraph", content: [{ type: "text", text: "Description détaillée de la prestation proposée." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Planning & livrables" }] },
    { type: "paragraph", content: [{ type: "text", text: "Calendrier de réalisation et livrables attendus." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Investissement" }] },
    { type: "table", content: [
      { type: "tableRow", content: [
        { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Prestation" }] }] },
        { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Qté" }] }] },
        { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "P.U. HT" }] }] },
        { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Total HT" }] }] },
      ]},
      { type: "tableRow", content: [
        { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Prestation 1" }] }] },
        { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1" }] }] },
        { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "0,00 €" }] }] },
        { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "0,00 €" }] }] },
      ]},
    ]},
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Conditions" }] },
    { type: "paragraph", content: [{ type: "text", text: "Conditions de paiement, délais de validité, etc." }] },
  ]},

  university: { type: "doc", content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "RAPPORT UNIVERSITAIRE" }] },
    { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text: "Université / École — Département" }] },
    { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text: `Année universitaire ${new Date().getFullYear()}-${new Date().getFullYear()+1}` }] },
    { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text: "Étudiant(e) : Prénom NOM" }] },
    { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text: "Encadrant(e) : M./Mme ENCADRANT" }] },
    { type: "horizontalRule" },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Résumé" }] },
    { type: "paragraph", content: [{ type: "text", text: "Résumé du rapport (150-200 mots)." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Mots-clés" }] },
    { type: "paragraph", content: [{ type: "text", text: "mot-clé 1 ; mot-clé 2 ; mot-clé 3" }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Table des matières" }] },
    { type: "orderedList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Introduction ........................ 3" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "I. Première partie ................. 5" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "II. Deuxième partie ................ 8" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Conclusion ......................... 12" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Bibliographie ...................... 14" }] }] },
    ]},
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Introduction" }] },
    { type: "paragraph", content: [{ type: "text", text: "Contexte, problématique et plan du rapport." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "I. Première partie" }] },
    { type: "paragraph", content: [{ type: "text", text: "Développement de la première partie." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "II. Deuxième partie" }] },
    { type: "paragraph", content: [{ type: "text", text: "Développement de la deuxième partie." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Conclusion" }] },
    { type: "paragraph", content: [{ type: "text", text: "Bilan et perspectives." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Bibliographie" }] },
    { type: "orderedList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "AUTEUR, Prénom. Titre de l'ouvrage. Éditeur, Année." }] }] },
    ]},
  ]},

  meeting: { type: "doc", content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "NOTES DE RÉUNION" }] },
    { type: "paragraph", content: [{ type: "text", text: `📅 ${TODAY}  |  🕐 Heure :   |  📍 Lieu : ` }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Présents" }] },
    { type: "bulletList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Participant" }] }] },
    ]},
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Points abordés" }] },
    { type: "paragraph", content: [{ type: "text", text: "Notes libres de la réunion." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Décisions" }] },
    { type: "bulletList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Décision prise" }] }] },
    ]},
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Actions" }] },
    { type: "taskList", content: [
      { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Action — Responsable — Échéance" }] }] },
    ]},
  ]},

  cdc: { type: "doc", content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "CAHIER DES CHARGES" }] },
    { type: "paragraph", content: [{ type: "text", text: `Version 1.0  |  Date : ${TODAY}  |  Statut : Brouillon` }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "1. Présentation du projet" }] },
    { type: "paragraph", content: [{ type: "text", text: "Description du projet, contexte et objectifs." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "2. Périmètre fonctionnel" }] },
    { type: "paragraph", content: [{ type: "text", text: "Liste des fonctionnalités attendues." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "3. Exigences techniques" }] },
    { type: "paragraph", content: [{ type: "text", text: "Technologies, contraintes de performance et sécurité." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "4. Livrables" }] },
    { type: "paragraph", content: [{ type: "text", text: "Liste et description des livrables attendus." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "5. Planning" }] },
    { type: "paragraph", content: [{ type: "text", text: "Jalons et calendrier de réalisation." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "6. Budget" }] },
    { type: "paragraph", content: [{ type: "text", text: "Estimation budgétaire et conditions." }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "7. Critères de réception" }] },
    { type: "paragraph", content: [{ type: "text", text: "Critères de validation et de recette." }] },
  ]},
};

// ── Interface NoteDoc ─────────────────────────────────────────────────────────
interface NoteDoc {
  id: string; user_id: string; title: string;
  content: string; content_json: string | null;
  note_type: string | null; doc_type: string;
  folder_id: string | null; is_archived: boolean | null;
  is_favorite: boolean | null; word_count: number | null;
  page_format: string; page_orientation: string;
  page_margin_top: number; page_margin_bottom: number;
  page_margin_left: number; page_margin_right: number;
  created_at: string; updated_at: string;
  editor_mode?: string | null;
  storage_path?: string | null;
}
interface Version { id: string; title: string; saved_at: string; }

const AI_ACTIONS = [
  { id: "correct",   label: "Corriger",         icon: "✓" },
  { id: "rephrase",  label: "Reformuler",        icon: "↺" },
  { id: "improve",   label: "Améliorer",         icon: "✦" },
  { id: "summarize", label: "Résumer",           icon: "∑" },
  { id: "expand",    label: "Développer",        icon: "↔" },
  { id: "translate", label: "Traduire (EN→FR)",  icon: "⇄" },
  { id: "simplify",  label: "Simplifier",        icon: "✂" },
  { id: "chat",      label: "Instruction libre", icon: "✎" },
];

// ── Composant Règle ───────────────────────────────────────────────────────────
function Ruler({ width, marginLeft, marginRight, zoom, isDark }: {
  width: number; marginLeft: number; marginRight: number; zoom: number; isDark: boolean;
}) {
  const totalMM  = width / MM;
  const ticksMM  = Array.from({ length: Math.floor(totalMM) + 1 }, (_, i) => i);
  const pxPerMM  = MM * zoom / 100;
  const ml       = marginLeft * pxPerMM;
  const mr       = marginRight * pxPerMM;

  return (
    <div className={`relative shrink-0 overflow-hidden select-none ${isDark?"bg-[#1e1e1e] border-b border-white/8":"bg-[#f0f0f0] border-b border-gray-300"}`}
      style={{ width, height: 22 }}>
      {/* Zone marges */}
      <div className="absolute top-0 bottom-0 left-0" style={{ width: ml, background: isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)" }}/>
      <div className="absolute top-0 bottom-0 right-0" style={{ width: mr, background: isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)" }}/>
      {/* Indicateurs marges */}
      <div className="absolute top-0 bottom-0 w-px" style={{ left: ml, background: GOLD, opacity: 0.6 }}/>
      <div className="absolute top-0 bottom-0 w-px" style={{ right: mr, background: GOLD, opacity: 0.6 }}/>
      {/* Graduations */}
      {ticksMM.map(mm => {
        const x = Math.round(mm * pxPerMM);
        const isMajor = mm % 10 === 0;
        const isMid   = mm % 5  === 0;
        if (x > width) return null;
        return (
          <div key={mm} className="absolute bottom-0" style={{ left: x, width: 1, height: isMajor?10:isMid?7:4, background: isDark?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.3)" }}>
            {isMajor && mm > 0 && (
              <span className="absolute bottom-full left-0.5 text-[7px]" style={{ color: isDark?"rgba(255,255,255,0.3)":"rgba(0,0,0,0.4)", lineHeight:1 }}>{mm}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function DocumentEditor() {
  const router   = useRouter();
  const params   = useParams();
  const docId    = params?.id as string;
  const { isDark } = useTheme();

  // Doc state
  const [doc,        setDoc]        = useState<NoteDoc | null>(null);
  const [versions,   setVersions]   = useState<Version[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState<string | null>(null);
  const [title,      setTitle]      = useState("Document sans titre");
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [toast,      setToast]      = useState<ToastData | null>(null);
  const [editorContent, setEditorContent] = useState<object | null>(null);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [editorMode, setEditorMode] = useState<"tiptap" | "collabora">("tiptap");

  // Refs
  const editorRef        = useRef<TiptapEditorRef | null>(null);
  const tiptapRef        = useRef<Editor | null>(null);
  const dirtyRef         = useRef(false);
  const debounceRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef         = useRef(title);
  const canvasRef        = useRef<HTMLDivElement>(null);
  const layoutReadyRef   = useRef(false); // évite save sur chargement initial
  const editorReadyRef   = useRef(false); // pour appliquer template au bon moment
  titleRef.current       = title;

  // UI state
  const [zoom,        setZoom]      = useState(() => {
    // Auto-zoom sur petit écran
    if (typeof window === "undefined") return 100;
    const vw = window.innerWidth;
    if (vw < 600)  return 50;
    if (vw < 900)  return 75;
    return 100;
  });
  const [pageFormat,  setPageFormat]= useState("A4");
  const [pageOrient,  setPageOrient]= useState("portrait");
  const [marginTop,   setMarginTop]   = useState(20);
  const [marginBottom,setMarginBottom]= useState(20);
  const [marginLeft,  setMarginLeft]  = useState(25);
  const [marginRight, setMarginRight] = useState(25);
  const [wordCount,   setWordCount]   = useState(0);
  const [charCount,   setCharCount]   = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  // Panels & menus
  const [activePanel, setActivePanel] = useState<null|"ai"|"versions"|"layout"|"share"|"find">(null);
  const [openMenu,    setOpenMenu]    = useState<string|null>(null);
  const togglePanel = (p: typeof activePanel) => setActivePanel(a => a===p ? null : p);

  // Find/replace
  const [findText,    setFindText]    = useState("");
  const [replaceText, setReplaceText] = useState("");

  // AI
  const [aiAction,  setAiAction]  = useState("improve");
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string|null>(null);

  function showToast(type: ToastType, msg: string) { setToast({ type, msg }); }

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!docId) return;
    void (async () => {
      const res = await fetch(`/api/notes/document/${docId}`).catch(() => null);
      if (!res?.ok) {
        const { error: e } = await res?.json().catch(() => ({})) ?? {};
        setPageError(e ?? "Erreur chargement"); setLoading(false); return;
      }
      const { document: d, versions: v } = await res.json();
      setDoc(d); setVersions(v ?? []);
      setEditorMode(d.editor_mode === "collabora" ? "collabora" : "tiptap");
      // Si éditeur déjà prêt, appliquer template
      if (editorReadyRef.current) applyTemplateIfEmpty(d);
      setTitle(d.title ?? "Document sans titre");
      setPageFormat(d.page_format ?? "A4");
      setPageOrient(d.page_orientation ?? "portrait");
      setMarginTop(d.page_margin_top ?? 20);
      setMarginBottom(d.page_margin_bottom ?? 20);
      setMarginLeft(d.page_margin_left ?? 25);
      setMarginRight(d.page_margin_right ?? 25);
      // Délai pour éviter que le useEffect layout ne se déclenche au montage
      setTimeout(() => { layoutReadyRef.current = true; }, 500);

      if (d.content_json) {
        try {
          const parsed = JSON.parse(d.content_json as string);
          // Support format wrapper {header, footer, body}
          if (parsed.body) {
            setEditorContent(parsed.body);
            setHeaderText(parsed.header ?? "");
            setFooterText(parsed.footer ?? "");
          } else {
            setEditorContent(parsed);
          }
        } catch { /**/ }
      } else if (d.content) {
        setEditorContent({ type: "doc", content: d.content.split("\n").filter(Boolean).map((l: string) => ({ type: "paragraph", content: [{ type: "text", text: l }] })) });
      }
      setLoading(false);
    })();
  }, [docId]);

  // Appliquer template si le doc est vide (résolution de la race condition via ref)
  function applyTemplateIfEmpty(d: NoteDoc) {
    if (d.doc_type === "document" && !d.content && !d.content_json) {
      const tmplKey = d.note_type ?? "blank";
      const tmplContent = TEMPLATE_CONTENT[tmplKey] ?? TEMPLATE_CONTENT.blank;
      // Attendre que l'éditeur soit prêt
      if (editorReadyRef.current && editorRef.current) {
        editorRef.current.setContent(tmplContent);
      }
    }
  }

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  const save = useCallback(async (opts: { version?: boolean; layout?: boolean } = {}) => {
    if (!docId || !editorRef.current || editorMode === "collabora") return;
    setSaveStatus("saving");
    try {
      const json  = editorRef.current.getJSON();
      const text  = editorRef.current.getText();
      const wJson = { header: headerText, footer: footerText, body: json };
      const body: Record<string, unknown> = {
        title:          titleRef.current,
        content:        text.slice(0, 50000),
        content_json:   JSON.stringify(wJson),
        thumbnail_text: text.slice(0, 300),
        word_count:     editorRef.current.getWordCount(),
        save_version:   opts.version ?? false,
      };
      if (opts.layout) {
        body.page_format       = pageFormat;
        body.page_orientation  = pageOrient;
        body.page_margin_top    = marginTop;
        body.page_margin_bottom = marginBottom;
        body.page_margin_left   = marginLeft;
        body.page_margin_right  = marginRight;
      }
      const res = await fetch(`/api/notes/document/${docId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      setSaveStatus("saved");
      dirtyRef.current = false;
      if (opts.version) {
        const r2 = await fetch(`/api/notes/document/${docId}`).catch(()=>null);
        if (r2?.ok) { const { versions: v2 } = await r2.json(); if(v2) setVersions(v2); }
      }
      setTimeout(() => setSaveStatus(s => s === "saved" ? "idle" : s), 2500);
    } catch (e) {
      setSaveStatus("error");
      showToast("error", (e as Error).message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, editorMode, pageFormat, pageOrient, marginTop, marginBottom, marginLeft, marginRight, headerText, footerText]);

  function scheduleSave() {
    dirtyRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void save(), 2000);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleEditorChange(json: object, _html: string, _text: string) {
    setEditorContent(json);
    setWordCount(editorRef.current?.getWordCount() ?? 0);
    setCharCount(editorRef.current?.getCharacterCount() ?? 0);
    scheduleSave();
    // Calcul pages
    updatePageCount();
  }

  // Mise en page — sauvegarde déclenchée quand les marges/format changent (pas au chargement initial)
  useEffect(() => {
    if (!doc || !layoutReadyRef.current) return;
    void save({ layout: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageFormat, pageOrient, marginTop, marginBottom, marginLeft, marginRight]);

  // Ctrl+S, Ctrl+F, Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey) && e.key==="s") { e.preventDefault(); void save({ version: true }); }
      if ((e.ctrlKey||e.metaKey) && e.key==="f") { e.preventDefault(); togglePanel("find"); }
      // Ctrl+Z/Y : Tiptap gère déjà ces raccourcis en interne via ProseMirror history
      if (e.key==="Escape") { setOpenMenu(null); setActivePanel(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  // ── Calcul nombre de pages ──────────────────────────────────────────────────
  function updatePageCount() {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
    const [pgW, pgH] = PAGE_SIZES[pageFormat] ?? PAGE_SIZES.A4;
    const [, pageH]  = pageOrient === "landscape" ? [pgH, pgW] : [pgW, pgH];
    const contentH   = (pageH - (marginTop + marginBottom) * MM) * zoom / 100;
    const total = Math.max(1, Math.ceil(editorEl.getBoundingClientRect().height / contentH));
    setTotalPages(total);
  }

  // Scroll → page courante
  function handleCanvasScroll() {
    if (!canvasRef.current) return;
    const [pgW, pgH] = PAGE_SIZES[pageFormat] ?? PAGE_SIZES.A4;
    const [, pageH]  = pageOrient === "landscape" ? [pgH, pgW] : [pgW, pgH];
    const contentH   = (pageH - (marginTop + marginBottom) * MM) * zoom / 100;
    const scroll = canvasRef.current.scrollTop;
    setCurrentPage(Math.floor(scroll / (contentH + 32)) + 1);
  }

  // ── Dimensions ──────────────────────────────────────────────────────────────
  const [pgW0, pgH0] = PAGE_SIZES[pageFormat] ?? PAGE_SIZES.A4;
  const [pageW, pageH] = pageOrient === "landscape" ? [pgH0, pgW0] : [pgW0, pgH0];
  const pageWpx  = Math.round(pageW * zoom / 100);
  const pageHpx  = Math.round(pageH * zoom / 100);
  const ptMM = (mm: number) => Math.round(mm * MM * zoom / 100);

  // CSS background pour simuler sauts de page visuels
  const contentHpx   = Math.round((pageH - (marginTop + marginBottom) * MM) * zoom / 100);
  const pageSepH     = 32; // hauteur du séparateur gris entre pages
  const pageSeqTotal = contentHpx + pageSepH;
  const canvasBg     = isDark ? "#1a1a1a" : "#e0e0e0";
  const pageBgStyle  = {
    backgroundImage: `repeating-linear-gradient(
      to bottom,
      white 0px,
      white ${contentHpx}px,
      ${canvasBg} ${contentHpx}px,
      ${canvasBg} ${contentHpx + pageSepH}px
    )`,
    backgroundSize:   `100% ${pageSeqTotal}px`,
    backgroundRepeat: "repeat-y",
  } as React.CSSProperties;

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function duplicateDoc() {
    if (!editorRef.current || !doc) return;
    const wJson = JSON.stringify({ header: headerText, footer: footerText, body: editorRef.current.getJSON() });
    const res = await fetch("/api/notes/document", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title + " (copie)", content_json: wJson, doc_type: doc.doc_type }),
    }).catch(()=>null);
    if (!res?.ok) { showToast("error", "Erreur"); return; }
    const { document: d } = await res.json();
    router.push(`/client/bloc-notes/${d.id}`);
  }

  async function moveToTrash() {
    if (!confirm("Déplacer vers la corbeille ?")) return;
    await fetch(`/api/notes/document/${docId}`, { method: "DELETE" });
    router.push("/client/bloc-notes");
  }

  async function toggleFavorite() {
    if (!doc) return;
    const next = !doc.is_favorite;
    setDoc(d => d ? { ...d, is_favorite: next } : d);
    await fetch(`/api/notes/document/${docId}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ is_favorite: next }) });
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  function exportDoc(format: "pdf"|"txt"|"md"|"docx") {
    setOpenMenu(null);
    if (format === "pdf") {
      // Injecter en-tête/pied de page dynamiques dans les marges @page
      const sid = "djama-print-hf";
      let sEl = document.getElementById(sid) as HTMLStyleElement | null;
      if (!sEl) { sEl = document.createElement("style"); sEl.id = sid; document.head.appendChild(sEl); }
      const hdr = headerText ? `"${headerText.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"` : "none";
      const ftr = footerText ? `"${footerText.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"` : "none";
      sEl.textContent = `
        @page {
          @top-left   { content: ${hdr}; font-size: 8pt; color: #6b7280; font-family: serif; }
          @top-right  { content: "Page " counter(page) " / " counter(pages); font-size: 8pt; color: #9ca3af; }
          @bottom-left { content: ${ftr}; font-size: 8pt; color: #6b7280; font-family: serif; }
        }
      `;
      window.print();
      const cleanup = () => { sEl?.remove(); window.removeEventListener("afterprint", cleanup); };
      window.addEventListener("afterprint", cleanup);
      setTimeout(cleanup, 5000);
      return;
    }
    if (format === "txt") {
      const blob = new Blob([editorRef.current?.getText() ?? ""], { type: "text/plain" });
      downloadBlob(blob, `${title}.txt`); return;
    }
    if (format === "md") {
      const html = editorRef.current?.getHTML() ?? "";
      const md = htmlToMd(html);
      downloadBlob(new Blob([md], { type: "text/markdown" }), `${title}.md`); return;
    }
    if (format === "docx") {
      // Appel API route DOCX
      void (async () => {
        showToast("info", "Génération DOCX…");
        void save(); // s'assurer que le contenu est sauvegardé
        await new Promise(r => setTimeout(r, 600));
        const res = await fetch("/api/notes/docx", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note_id: docId }),
        }).catch(()=>null);
        if (!res?.ok) { showToast("error", "Erreur export DOCX"); return; }
        const blob = await res.blob();
        downloadBlob(blob, `${title}.docx`);
        showToast("success", "DOCX téléchargé");
      })();
    }
  }

  function downloadBlob(blob: Blob, name: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function htmlToMd(html: string) {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi,"# $1\n\n").replace(/<h2[^>]*>(.*?)<\/h2>/gi,"## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi,"### $1\n\n").replace(/<strong[^>]*>(.*?)<\/strong>/gi,"**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi,"_$1_").replace(/<s[^>]*>(.*?)<\/s>/gi,"~~$1~~")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,"[$2]($1)")
      .replace(/<li[^>]*>(.*?)<\/li>/gi,"- $1\n").replace(/<hr[^>]*>/gi,"---\n")
      .replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"")
      .replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();
  }

  // ── Import ──────────────────────────────────────────────────────────────────
  function importFile() {
    setOpenMenu(null);
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".txt,.md,.docx,.odt";
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext==="txt"||ext==="md") {
        const text = await file.text();
        tiptapRef.current?.commands.setContent({ type:"doc", content: text.split("\n").filter(Boolean).map(l=>({ type:"paragraph", content:[{type:"text",text:l}] })) });
        showToast("success","Fichier importé");
      } else if (ext==="docx"||ext==="odt") {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/notes/import", { method:"POST", body:fd }).catch(()=>null);
        if (!res?.ok) { showToast("error","Erreur import"); return; }
        const { html } = await res.json();
        tiptapRef.current?.commands.setContent(html);
        showToast("success","Document importé");
      }
    };
    input.click();
  }

  // ── Insert image ─────────────────────────────────────────────────────────────
  function insertImage() {
    setOpenMenu(null);
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) { showToast("error","Image trop lourde (max 5 Mo)"); return; }
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target?.result as string;
        tiptapRef.current?.commands.setImage({ src });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // ── Insert tableau ────────────────────────────────────────────────────────────
  function insertTable(rows: number, cols: number) {
    setOpenMenu(null);
    tiptapRef.current?.commands.insertTable({ rows, cols, withHeaderRow: true });
  }

  // ── Restaurer version ────────────────────────────────────────────────────────
  async function restoreVersion(vId: string) {
    showToast("info","Restauration en cours…");
    setActivePanel(null);
    const res = await fetch(`/api/notes/document/${docId}?version_id=${vId}`).catch(()=>null);
    if (!res?.ok) { showToast("error","Erreur restauration"); return; }
    window.location.reload();
  }

  // ── IA ────────────────────────────────────────────────────────────────────────
  async function runAI() {
    setAiLoading(true); setAiPreview(null);
    const text = editorRef.current?.getText() ?? "";
    const res = await fetch("/api/notes/ai", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action: aiAction, content: text.slice(0,6000), instruction: aiInput||undefined }),
    }).catch(()=>null);
    setAiLoading(false);
    if (!res?.ok) { const {error:e}=await res?.json().catch(()=>({}))??{}; showToast("error",e??"Erreur IA"); return; }
    const { result } = await res.json();
    if (result) setAiPreview(result);
  }

  function insertAIResult() {
    if (!aiPreview || !tiptapRef.current) return;
    tiptapRef.current.commands.focus("end");
    tiptapRef.current.commands.setHorizontalRule();
    tiptapRef.current.commands.insertContent(
      `<p><em style="color:#9ca3af">[IA — ${AI_ACTIONS.find(a=>a.id===aiAction)?.label}]</em></p>` +
      aiPreview.split("\n").map(l=>`<p>${l}</p>`).join("")
    );
    setAiPreview(null); setActivePanel(null);
    showToast("success","Résultat inséré");
  }

  // ── Rendu états de chargement ────────────────────────────────────────────────
  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${isDark?"bg-[#111]":"bg-[#f5f5f5]"}`}>
      <Loader2 className="animate-spin" size={28} style={{color:GOLD}}/>
    </div>
  );
  if (pageError) return (
    <div className={`flex h-screen flex-col items-center justify-center gap-3 ${isDark?"bg-[#111] text-white":"bg-[#f5f5f5] text-gray-900"}`}>
      <AlertCircle size={36} className="text-red-400"/>
      <p className="text-sm">{pageError}</p>
      <button onClick={()=>router.push("/client/bloc-notes")} className="rounded-lg px-4 py-2 text-sm text-white" style={{background:GOLD}}>Retour</button>
    </div>
  );

  // ── Classes thème ────────────────────────────────────────────────────────────
  const shell    = isDark ? "bg-[#111]"     : "bg-white";
  const bar1     = isDark ? "bg-[#1a1a1a] border-white/8"  : "bg-white border-gray-200";
  const bar2     = isDark ? "bg-[#141414] border-white/8"  : "bg-[#f5f5f5] border-gray-300";
  const panel    = isDark ? "bg-[#1a1a1a] border-white/8"  : "bg-white border-gray-200";
  const statusCls= isDark ? "bg-[#141414] border-white/8 text-white/35" : "bg-[#f5f5f5] border-gray-300 text-gray-400";
  const inp      = isDark ? "border-white/8 bg-white/4 text-white placeholder:text-white/25 focus:border-[#c9a55a]/40"
                          : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#c9a55a]/60";
  const menuDrop = isDark ? "border-white/10 bg-[#1a1a1a]" : "border-gray-200 bg-white";
  const menuItem = isDark ? "text-white/60 hover:bg-white/6 hover:text-white" : "text-gray-700 hover:bg-gray-50";

  // ── Menu bar items ─────────────────────────────────────────────────────────
  type MI = { label: string; action?: ()=>void; shortcut?: string; sep?: boolean; sub?: MI[] };
  const MENUS: Record<string, MI[]> = {
    Fichier: [
      { label: "Nouveau document", action: ()=>{ setOpenMenu(null); router.push("/client/bloc-notes?new=1"); }, shortcut: "Ctrl+N" },
      { label: "Dupliquer",        action: ()=>{ setOpenMenu(null); void duplicateDoc(); } },
      { sep: true, label: "" },
      { label: "Enregistrer",      action: ()=>{ setOpenMenu(null); void save({version:true}); }, shortcut: "Ctrl+S" },
      { label: "Importer…",        action: importFile },
      { sep: true, label: "" },
      { label: "Télécharger PDF",  action: ()=>exportDoc("pdf"), shortcut: "Ctrl+P" },
      { label: "Télécharger DOCX", action: ()=>exportDoc("docx") },
      { label: "Télécharger Markdown", action: ()=>exportDoc("md") },
      { label: "Télécharger TXT",  action: ()=>exportDoc("txt") },
      { sep: true, label: "" },
      { label: "Imprimer…",        action: ()=>{ setOpenMenu(null); exportDoc("pdf"); }, shortcut: "Ctrl+P" },
      { sep: true, label: "" },
      { label: "Corbeille",        action: ()=>{ setOpenMenu(null); void moveToTrash(); } },
    ],
    Édition: [
      { label: "Annuler",           action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.undo(); }, shortcut: "Ctrl+Z" },
      { label: "Rétablir",          action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.redo(); }, shortcut: "Ctrl+Y" },
      { sep: true, label: "" },
      { label: "Couper",            action: ()=>{ setOpenMenu(null); document.execCommand("cut"); },   shortcut: "Ctrl+X" },
      { label: "Copier",            action: ()=>{ setOpenMenu(null); document.execCommand("copy"); },  shortcut: "Ctrl+C" },
      { label: "Coller",            action: ()=>{ setOpenMenu(null); document.execCommand("paste"); }, shortcut: "Ctrl+V" },
      { label: "Tout sélectionner", action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.selectAll(); }, shortcut: "Ctrl+A" },
      { sep: true, label: "" },
      { label: "Rechercher…",       action: ()=>{ setOpenMenu(null); togglePanel("find"); }, shortcut: "Ctrl+F" },
    ],
    Affichage: [
      { label: "Zoom 50%",  action: ()=>{ setZoom(50);  setOpenMenu(null); } },
      { label: "Zoom 75%",  action: ()=>{ setZoom(75);  setOpenMenu(null); } },
      { label: "Zoom 100%", action: ()=>{ setZoom(100); setOpenMenu(null); } },
      { label: "Zoom 125%", action: ()=>{ setZoom(125); setOpenMenu(null); } },
      { label: "Zoom 150%", action: ()=>{ setZoom(150); setOpenMenu(null); } },
      { label: "Zoom 175%", action: ()=>{ setZoom(175); setOpenMenu(null); } },
      { label: "Zoom 200%", action: ()=>{ setZoom(200); setOpenMenu(null); } },
      { sep: true, label: "" },
      { label: "Mise en page…", action: ()=>{ setOpenMenu(null); togglePanel("layout"); } },
    ],
    Insertion: [
      { label: "Image…",               action: insertImage },
      { label: "Tableau 3×3",          action: ()=>insertTable(3,3) },
      { label: "Tableau 4×4",          action: ()=>insertTable(4,4) },
      { label: "Tableau 2×2",          action: ()=>insertTable(2,2) },
      { sep: true, label: "" },
      { label: "Lien…",                action: ()=>{ setOpenMenu(null); const u=window.prompt("URL :","https://"); if(u)tiptapRef.current?.commands.setLink({href:u}); } },
      { label: "Séparateur horizontal",action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.setHorizontalRule(); } },
      { label: "Saut de page",         action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.insertContent('<p style="page-break-before:always;border-top:2px dashed #d1d5db;margin:1.5em 0;color:#9ca3af;font-size:0.7em;text-align:center">— Saut de page —</p>'); } },
      { sep: true, label: "" },
      { label: "Liste à puces",        action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleBulletList(); } },
      { label: "Liste numérotée",      action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleOrderedList(); } },
      { label: "Liste de tâches",      action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleTaskList(); } },
    ],
    Format: [
      { label: "Gras",                action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleBold(); },      shortcut: "Ctrl+B" },
      { label: "Italique",            action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleItalic(); },    shortcut: "Ctrl+I" },
      { label: "Souligné",            action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleUnderline(); }, shortcut: "Ctrl+U" },
      { label: "Barré",               action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleStrike(); } },
      { label: "Exposant",            action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleSuperscript(); } },
      { label: "Indice",              action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.toggleSubscript(); } },
      { sep: true, label: "" },
      { label: "Aligner à gauche",    action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.setTextAlign("left"); } },
      { label: "Centrer",             action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.setTextAlign("center"); } },
      { label: "Aligner à droite",    action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.setTextAlign("right"); } },
      { label: "Justifier",           action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.setTextAlign("justify"); } },
      { sep: true, label: "" },
      { label: "Effacer le formatage",action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.unsetAllMarks(); } },
    ],
    Tableau: [
      { label: "Insérer un tableau 3×3", action: ()=>insertTable(3,3) },
      { sep: true, label: "" },
      { label: "Ajouter une ligne",    action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.addRowAfter(); } },
      { label: "Supprimer la ligne",   action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.deleteRow(); } },
      { label: "Ajouter une colonne",  action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.addColumnAfter(); } },
      { label: "Supprimer la colonne", action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.deleteColumn(); } },
      { sep: true, label: "" },
      { label: "Fusionner les cellules", action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.mergeCells(); } },
      { label: "Diviser la cellule",   action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.splitCell(); } },
      { sep: true, label: "" },
      { label: "Supprimer le tableau", action: ()=>{ setOpenMenu(null); tiptapRef.current?.commands.deleteTable(); } },
    ],
    Outils: [
      { label: "Assistant IA…",              action: ()=>{ setOpenMenu(null); togglePanel("ai"); } },
      { label: "Historique des versions…",   action: ()=>{ setOpenMenu(null); togglePanel("versions"); } },
      { label: "Partager…",                  action: ()=>{ setOpenMenu(null); togglePanel("share"); } },
    ],
  };

  return (
    <>
      {/* CSS impression */}
      <style>{`
        @media print {
          body > *:not(.doc-print-root) { display: none !important; }
          .doc-print-root { display: block !important; }
          .no-print { display: none !important; }
          .doc-page { box-shadow: none !important; margin: 0 !important; background: white !important; }
          @page { size: ${pageOrient==="landscape"?"landscape":"portrait"}; margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; }
        }
      `}</style>

      {/* Overlay ferme menus */}
      {openMenu && <div className="fixed inset-0 z-40" onClick={()=>setOpenMenu(null)}/>}

      <div className={`doc-print-root flex flex-col h-screen overflow-hidden ${shell}`}>

        {/* ── BARRE 1 : Titre + actions ──────────────────────────────────── */}
        <div className={`no-print flex shrink-0 items-center gap-2 border-b px-2.5 py-1 ${bar1}`}>
          <button onClick={()=>router.push("/client/bloc-notes")}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded transition ${isDark?"text-white/30 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100"}`}>
            <ArrowLeft size={13}/>
          </button>

          {/* Logo DJAMA Doc */}
          <span className="shrink-0 text-[11px] font-bold tracking-tight" style={{color:GOLD}}>DJAMA Doc</span>
          <span className={`shrink-0 text-[11px] ${isDark?"text-white/15":"text-gray-300"}`}>›</span>

          {/* Titre éditable */}
          <input value={title} onChange={e=>{ setTitle(e.target.value); scheduleSave(); }}
            className={`flex-1 truncate rounded px-1.5 py-0.5 text-[12px] font-semibold outline-none transition ${isDark?"bg-transparent text-white focus:bg-white/4":"bg-transparent text-gray-900 focus:bg-gray-50"}`}
            placeholder="Sans titre"/>

          {/* Statut */}
          <div className={`flex shrink-0 items-center gap-1 text-[10px] ${isDark?"text-white/30":"text-gray-400"}`}>
            {saveStatus==="saving" && <><Loader2 size={9} className="animate-spin"/><span>Enregistrement…</span></>}
            {saveStatus==="saved"  && <><Check size={9} className="text-emerald-400"/><span className="text-emerald-400">Enregistré</span></>}
            {saveStatus==="error"  && <><AlertCircle size={9} className="text-red-400"/><span className="text-red-400">Erreur</span></>}
          </div>

          {/* Actions rapides */}
          <div className="flex shrink-0 items-center gap-0.5">
            {editorMode === "tiptap" && (
              <TitleBtn onClick={()=>void save({version:true})} title="Enregistrer (Ctrl+S)" isDark={isDark}><Save size={12}/></TitleBtn>
            )}
            <TitleBtn onClick={()=>void toggleFavorite()} title="Favori" isDark={isDark} active={!!doc?.is_favorite}>
              <Star size={12} fill={doc?.is_favorite?"currentColor":"none"}/>
            </TitleBtn>
            {editorMode === "tiptap" && (
              <TitleBtn onClick={()=>togglePanel("ai")} title="Assistant IA" isDark={isDark} active={activePanel==="ai"}><Sparkles size={12}/></TitleBtn>
            )}
            <TitleBtn onClick={()=>togglePanel("share")} title="Partager" isDark={isDark} active={activePanel==="share"}><Share2 size={12}/></TitleBtn>
            {editorMode === "tiptap" && (
              <>
                <TitleBtn onClick={()=>exportDoc("pdf")} title="Exporter PDF" isDark={isDark}><Download size={12}/></TitleBtn>
                {/* Zoom */}
                <div className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 ml-1 ${isDark?"border-white/8":"border-gray-200"}`}>
                  <button onMouseDown={e=>{e.preventDefault();setZoom(z=>Math.max(50,z-25));}} className={isDark?"text-white/30 hover:text-white":"text-gray-400 hover:text-gray-700"}><ZoomOut size={9}/></button>
                  <span className={`w-7 text-center text-[9px] tabular-nums ${isDark?"text-white/40":"text-gray-500"}`}>{zoom}%</span>
                  <button onMouseDown={e=>{e.preventDefault();setZoom(z=>Math.min(200,z+25));}} className={isDark?"text-white/30 hover:text-white":"text-gray-400 hover:text-gray-700"}><ZoomIn size={9}/></button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── BARRE 2 : Menus (Tiptap uniquement) ─────────────────────────── */}
        {editorMode === "tiptap" && <div className={`no-print flex shrink-0 items-center border-b px-1 ${bar2}`} style={{height:26}}>
          {Object.entries(MENUS).map(([name, items]) => (
            <div key={name} className="relative">
              <button onMouseDown={e=>{e.preventDefault();setOpenMenu(o=>o===name?null:name);}}
                className={`flex h-full items-center px-2 text-[11px] transition ${openMenu===name?`bg-[rgba(201,165,90,0.12)] text-[${GOLD}]`:isDark?"text-white/55 hover:bg-white/6 hover:text-white":"text-gray-600 hover:bg-white hover:text-gray-900"}`}>
                {name}
              </button>
              {openMenu===name && (
                <div className={`absolute left-0 top-full z-50 w-52 rounded-b-lg border-x border-b py-1 shadow-2xl ${menuDrop}`}>
                  {items.map((item,i) =>
                    item.sep ? <div key={i} className={`my-0.5 border-t ${isDark?"border-white/6":"border-gray-100"}`}/>
                    : <button key={i} onClick={item.action}
                        className={`flex w-full items-center justify-between px-3 py-1.5 text-[11px] transition ${menuItem}`}>
                        <span>{item.label}</span>
                        {item.shortcut && <span className={`text-[9px] ${isDark?"text-white/20":"text-gray-400"}`}>{item.shortcut}</span>}
                      </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>}

        {/* ── BARRE 3 : Toolbar formatage (Tiptap uniquement) ──────────────── */}
        {editorMode === "tiptap" && (
          <EditorToolbar editor={tiptapRef.current} isDark={isDark}
            onInsertImage={insertImage}
            onInsertLink={()=>{ const u=window.prompt("URL :","https://"); if(u)tiptapRef.current?.commands.setLink({href:u}); }}/>
        )}

        {/* ── Zone travail ────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Mode Collabora : iframe plein espace ────────────────────────── */}
        {editorMode === "collabora" && (
          <CollaboraEditor
            noteId={docId}
            style={{ flex: 1, minWidth: 0 }}
            onClose={() => router.back()}
            onSaved={() => setSaveStatus("saved")}
            onError={(msg) => { setSaveStatus("error"); showToast("error", msg); }}
          />
        )}

        {/* ── Mode Tiptap : canvas + règle ────────────────────────────────── */}
        {editorMode === "tiptap" && (<>

          {/* Canvas + Règle */}
          <div ref={canvasRef} className="flex-1 overflow-auto" style={{background: canvasBg}} onScroll={handleCanvasScroll}>

            {/* Règle horizontale */}
            <div className="sticky top-0 z-10 flex justify-center">
              <Ruler
                width={pageWpx} zoom={zoom}
                marginLeft={marginLeft} marginRight={marginRight}
                isDark={isDark}/>
            </div>

            {/* Espace haut */}
            <div style={{height: 24}}/>

            {/* Page blanche */}
            <div className="mx-auto doc-page"
              style={{
                width:      pageWpx,
                minHeight:  pageHpx,
                ...pageBgStyle,
                color:      "#111827",
                fontSize:   `${Math.round(12 * zoom / 100)}px`,
                lineHeight: 1.6,
                fontFamily: "'Liberation Serif','Times New Roman',Georgia,serif",
                boxShadow:  "0 2px 20px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)",
              }}>

              {/* EN-TÊTE */}
              {(headerText || true) && (
                <div style={{
                  padding:    `${ptMM(5)}px ${ptMM(marginRight)}px ${ptMM(3)}px ${ptMM(marginLeft)}px`,
                  minHeight:  `${ptMM(10)}px`,
                  borderBottom: headerText ? `1px solid #e5e7eb` : undefined,
                }}>
                  <input
                    value={headerText}
                    onChange={e=>{ setHeaderText(e.target.value); scheduleSave(); }}
                    placeholder="En-tête (cliquez pour modifier)…"
                    className="w-full bg-transparent outline-none text-[11px] text-gray-400 placeholder:text-gray-300 italic"
                    style={{ fontSize: `${Math.round(9 * zoom / 100)}px` }}
                  />
                </div>
              )}

              {/* CORPS du document */}
              <div style={{
                padding: `${ptMM(marginTop)}px ${ptMM(marginRight)}px ${ptMM(marginBottom)}px ${ptMM(marginLeft)}px`,
              }}>
                <TiptapEditor
                  content={editorContent}
                  editorRef={editorRef}
                  onChange={handleEditorChange}
                  onEditorReady={ed => {
                    tiptapRef.current = ed;
                    editorReadyRef.current = true;
                    updatePageCount();
                    // Appliquer template si doc est déjà chargé
                    if (doc) applyTemplateIfEmpty(doc);
                  }}
                  isDark={false}
                  placeholder="Commencez à rédiger votre document…"
                />
              </div>

              {/* PIED DE PAGE */}
              <div style={{
                padding:    `${ptMM(3)}px ${ptMM(marginRight)}px ${ptMM(5)}px ${ptMM(marginLeft)}px`,
                minHeight:  `${ptMM(10)}px`,
                borderTop:  footerText ? `1px solid #e5e7eb` : undefined,
              }}>
                <input
                  value={footerText}
                  onChange={e=>{ setFooterText(e.target.value); scheduleSave(); }}
                  placeholder="Pied de page…"
                  className="w-full bg-transparent outline-none text-[11px] text-gray-400 placeholder:text-gray-300 italic"
                  style={{ fontSize: `${Math.round(9 * zoom / 100)}px` }}
                />
              </div>
            </div>

            <div style={{height:48}}/>
          </div>

          {/* ── Panels latéraux ─────────────────────────────────────────── */}
          <AnimatePresence>

            {/* Panel IA */}
            {activePanel==="ai" && (
              <motion.aside key="ai" initial={{x:280,opacity:0}} animate={{x:0,opacity:1}} exit={{x:280,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`no-print w-64 shrink-0 overflow-y-auto border-l ${panel}`}>
                <PH title="Assistant IA" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-2">
                  {AI_ACTIONS.map(a=>(
                    <button key={a.id} onClick={()=>setAiAction(a.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition ${aiAction===a.id?`bg-[rgba(201,165,90,0.1)] text-[${GOLD}] font-medium`:isDark?"text-white/55 hover:bg-white/5":"text-gray-600 hover:bg-gray-50"}`}>
                      <span className="text-base">{a.icon}</span>{a.label}
                    </button>
                  ))}
                  {aiAction==="chat" && (
                    <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} rows={3}
                      placeholder="Votre instruction…"
                      className={`w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none ${inp}`}/>
                  )}
                  <button onClick={runAI} disabled={aiLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-white disabled:opacity-50"
                    style={{background:`linear-gradient(135deg,${GOLD},#b8952f)`}}>
                    {aiLoading?<Loader2 size={11} className="animate-spin"/>:<Sparkles size={11}/>}
                    {aiLoading?"Génération…":"Appliquer l'IA"}
                  </button>
                  {aiPreview && (
                    <div className={`rounded-lg border p-3 ${isDark?"border-white/8 bg-white/3":"border-gray-200 bg-gray-50"}`}>
                      <p className={`mb-2 text-[9px] font-bold uppercase tracking-wider ${isDark?"text-white/30":"text-gray-400"}`}>Aperçu</p>
                      <p className={`text-xs whitespace-pre-wrap ${isDark?"text-white/70":"text-gray-700"}`}>{aiPreview.slice(0,500)}{aiPreview.length>500?"…":""}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={insertAIResult} className="flex-1 rounded-lg py-1.5 text-xs font-bold text-white" style={{background:GOLD}}>Insérer</button>
                        <button onClick={()=>setAiPreview(null)} className={`flex-1 rounded-lg border py-1.5 text-xs ${isDark?"border-white/10 text-white/40":"border-gray-200 text-gray-500"}`}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.aside>
            )}

            {/* Panel Versions */}
            {activePanel==="versions" && (
              <motion.aside key="versions" initial={{x:280,opacity:0}} animate={{x:0,opacity:1}} exit={{x:280,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`no-print w-60 shrink-0 overflow-y-auto border-l ${panel}`}>
                <PH title="Historique" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-2">
                  <button onClick={()=>void save({version:true})}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition ${isDark?"border-white/10 text-white/40 hover:text-white":"border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                    <RefreshCw size={10}/> Créer un snapshot
                  </button>
                  {versions.length===0 && <p className={`py-6 text-center text-xs ${isDark?"text-white/20":"text-gray-400"}`}>Aucune version sauvegardée.</p>}
                  {versions.map(v=>(
                    <div key={v.id} className={`flex items-center gap-2 rounded-lg p-2.5 ${isDark?"border border-white/6 bg-white/3":"border border-gray-100 bg-gray-50"}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-xs font-medium ${isDark?"text-white/70":"text-gray-700"}`}>{v.title||"Sans titre"}</p>
                        <p className={`text-[9px] ${isDark?"text-white/25":"text-gray-400"}`}>{new Date(v.saved_at).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                      </div>
                      <button onClick={()=>void restoreVersion(v.id)}
                        className={`rounded p-1 text-[9px] ${isDark?"text-white/25 hover:text-white":"text-gray-400 hover:text-gray-700"}`}
                        title="Restaurer"><RefreshCw size={9}/></button>
                    </div>
                  ))}
                </div>
              </motion.aside>
            )}

            {/* Panel Mise en page */}
            {activePanel==="layout" && (
              <motion.aside key="layout" initial={{x:280,opacity:0}} animate={{x:0,opacity:1}} exit={{x:280,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`no-print w-56 shrink-0 overflow-y-auto border-l ${panel}`}>
                <PH title="Mise en page" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-4">
                  <PG label="Format" isDark={isDark}>
                    <div className="grid grid-cols-3 gap-1">
                      {["A4","A3","Letter"].map(f=><PB key={f} active={pageFormat===f} onClick={()=>setPageFormat(f)} isDark={isDark}>{f}</PB>)}
                    </div>
                  </PG>
                  <PG label="Orientation" isDark={isDark}>
                    <div className="grid grid-cols-2 gap-1">
                      {[["portrait","Portrait"],["landscape","Paysage"]].map(([v,l])=><PB key={v} active={pageOrient===v} onClick={()=>setPageOrient(v)} isDark={isDark}>{l}</PB>)}
                    </div>
                  </PG>
                  <PG label="Marges (mm)" isDark={isDark}>
                    {([["Haut",marginTop,setMarginTop],["Bas",marginBottom,setMarginBottom],["Gauche",marginLeft,setMarginLeft],["Droite",marginRight,setMarginRight]] as [string,number,(v:number)=>void][]).map(([lbl,val,set])=>(
                      <div key={lbl} className="flex items-center gap-2">
                        <span className={`w-12 text-xs ${isDark?"text-white/40":"text-gray-500"}`}>{lbl}</span>
                        <input type="number" min="5" max="60" value={val} onChange={e=>set(parseInt(e.target.value)||20)}
                          className={`w-14 rounded border px-2 py-0.5 text-center text-xs outline-none ${isDark?"border-white/8 bg-white/4 text-white":"border-gray-200 bg-gray-50"}`}/>
                        <span className={`text-[9px] ${isDark?"text-white/20":"text-gray-400"}`}>mm</span>
                      </div>
                    ))}
                  </PG>
                  <PG label="Zoom" isDark={isDark}>
                    <div className="grid grid-cols-3 gap-1">
                      {[50,75,100,125,150,200].map(z=><PB key={z} active={zoom===z} onClick={()=>setZoom(z)} isDark={isDark}>{z}%</PB>)}
                    </div>
                  </PG>
                </div>
              </motion.aside>
            )}

            {/* Panel Partage */}
            {activePanel==="share" && (
              <motion.aside key="share" initial={{x:280,opacity:0}} animate={{x:0,opacity:1}} exit={{x:280,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`no-print w-60 shrink-0 overflow-y-auto border-l ${panel}`}>
                <PH title="Partager" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-3">
                  <p className={`text-xs ${isDark?"text-white/40":"text-gray-500"}`}>Partage avec l&apos;équipe disponible prochainement.</p>
                  <div className={`rounded-lg border p-3 ${isDark?"border-white/8 bg-white/3":"border-gray-100 bg-gray-50"}`}>
                    <p className={`mb-1 text-[9px] font-bold uppercase tracking-wider ${isDark?"text-white/30":"text-gray-400"}`}>Lien direct</p>
                    <p className={`truncate font-mono text-[9px] ${isDark?"text-white/25":"text-gray-400"}`}>{typeof window!=="undefined"?window.location.href:""}</p>
                    <button onClick={()=>{ navigator.clipboard.writeText(window.location.href).catch(()=>{}); showToast("success","Lien copié"); }}
                      className="mt-2 flex items-center gap-1 text-[10px]" style={{color:GOLD}}>
                      <Link2 size={10}/> Copier
                    </button>
                  </div>
                </div>
              </motion.aside>
            )}

            {/* Panel Rechercher/Remplacer */}
            {activePanel==="find" && (
              <motion.aside key="find" initial={{x:280,opacity:0}} animate={{x:0,opacity:1}} exit={{x:280,opacity:0}}
                transition={{type:"spring",damping:30,stiffness:300}}
                className={`no-print w-60 shrink-0 overflow-y-auto border-l ${panel}`}>
                <PH title="Rechercher / Remplacer" onClose={()=>setActivePanel(null)} isDark={isDark}/>
                <div className="p-3 space-y-2">
                  <input value={findText} onChange={e=>setFindText(e.target.value)} placeholder="Rechercher…"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none ${inp}`}/>
                  <input value={replaceText} onChange={e=>setReplaceText(e.target.value)} placeholder="Remplacer par…"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none ${inp}`}/>
                  <button onClick={()=>{
                    if (!findText || !tiptapRef.current) return;
                    // Parcours récursif du JSON — fiable même avec des marques imbriquées
                    type JNode = { type?: string; text?: string; content?: JNode[] } & Record<string, unknown>;
                    function walkNode(n: JNode): JNode {
                      if (n.type === "text" && typeof n.text === "string") {
                        return { ...n, text: n.text.split(findText).join(replaceText) };
                      }
                      if (Array.isArray(n.content)) {
                        return { ...n, content: n.content.map(walkNode) };
                      }
                      return n;
                    }
                    const updated = walkNode(tiptapRef.current.getJSON() as JNode);
                    tiptapRef.current.commands.setContent(updated);
                    showToast("success","Remplacement effectué");
                  }} className="w-full rounded-lg py-2 text-xs font-bold text-white" style={{background:GOLD}}>
                    Remplacer tout
                  </button>
                </div>
              </motion.aside>
            )}

          </AnimatePresence>
        </>)}
        </div>

        {/* ── BARRE INFÉRIEURE : statut ────────────────────────────────────── */}
        <div className={`no-print flex shrink-0 items-center justify-between border-t px-4 py-1 text-[10px] tabular-nums ${statusCls}`}>
          {editorMode === "collabora" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-semibold" style={{color:GOLD}}>DJAMA Doc</span>
                <span className={isDark?"text-white/25":"text-gray-400"}>Collabora Online</span>
                {saveStatus === "saving" && <span className={isDark?"text-white/40":"text-gray-400"}>Sauvegarde…</span>}
                {saveStatus === "saved"  && <span style={{color:GOLD}}>✓ Sauvegardé</span>}
                {saveStatus === "error"  && <span className="text-red-400">Erreur de sauvegarde</span>}
              </div>
              <span className={isDark?"text-white/20":"text-gray-300"}>Sauvegarde automatique</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <span>Page {currentPage}/{totalPages}</span>
                <span>{wordCount} mot{wordCount!==1?"s":""}</span>
                <span>{charCount} car.</span>
                <span title="La pagination dans l'éditeur est un aperçu visuel. PDF et DOCX ont une vraie pagination." className={`${isDark?"text-white/20":"text-gray-300"} cursor-default`}>Aperçu</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{pageFormat} {pageOrient==="landscape"?"Paysage":"Portrait"}</span>
                <span>Français</span>
                <div className="flex items-center gap-1">
                  <button onMouseDown={e=>{e.preventDefault();setZoom(z=>Math.max(50,z-25));}} className="hover:opacity-80"><ZoomOut size={9}/></button>
                  <span className="w-7 text-center">{zoom}%</span>
                  <button onMouseDown={e=>{e.preventDefault();setZoom(z=>Math.min(200,z+25));}} className="hover:opacity-80"><ZoomIn size={9}/></button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </>
  );
}

// ── Micro-composants ──────────────────────────────────────────────────────────
function TitleBtn({ onClick, title, isDark, active, children }: { onClick:()=>void; title?:string; isDark:boolean; active?:boolean; children:React.ReactNode }) {
  return (
    <button onMouseDown={e=>{e.preventDefault();onClick();}} title={title}
      className={`flex h-7 w-7 items-center justify-center rounded transition ${active?"text-[#c9a55a] bg-[rgba(201,165,90,0.12)]":isDark?"text-white/30 hover:bg-white/8 hover:text-white":"text-gray-400 hover:bg-gray-100"}`}>
      {children}
    </button>
  );
}
function PH({ title, onClose, isDark }: { title:string; onClose:()=>void; isDark:boolean }) {
  return (
    <div className={`flex items-center justify-between border-b px-3 py-2.5 ${isDark?"border-white/8":"border-gray-100"}`}>
      <span className={`text-[11px] font-bold ${isDark?"text-white/70":"text-gray-700"}`}>{title}</span>
      <button onClick={onClose} className={isDark?"text-white/25 hover:text-white":"text-gray-300 hover:text-gray-700"}><X size={12}/></button>
    </div>
  );
}
function PG({ label, children, isDark }: { label:string; children:React.ReactNode; isDark:boolean }) {
  return (
    <div className="space-y-1.5">
      <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark?"text-white/25":"text-gray-400"}`}>{label}</p>
      {children}
    </div>
  );
}
function PB({ active, onClick, children, isDark }: { active:boolean; onClick:()=>void; children:React.ReactNode; isDark:boolean }) {
  return (
    <button onClick={onClick}
      className={`w-full rounded border py-1 text-[10px] font-medium transition ${active?`border-[#c9a55a]/40 bg-[rgba(201,165,90,0.08)] text-[#c9a55a]`:isDark?"border-white/8 text-white/35 hover:text-white":"border-gray-200 text-gray-500 hover:text-gray-700"}`}>
      {children}
    </button>
  );
}
