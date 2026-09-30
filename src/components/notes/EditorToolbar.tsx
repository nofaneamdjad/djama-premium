"use client";

import { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Code2,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare,
  Quote, Minus, Link2, Image, Table2,
  Undo2, Redo2, ChevronDown, Highlighter, Palette,
  IndentDecrease, IndentIncrease, Type, RotateCcw,
} from "lucide-react";
import { useRef, useState } from "react";

const gold = "#c9a55a";

interface Props {
  editor: Editor | null;
  isDark?: boolean;
  onInsertImage?: () => void;
  onInsertLink?:  () => void;
}

// Composant bouton de la toolbar
function Btn({
  onClick, active, disabled, title, children,
  isDark,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title?: string; children: React.ReactNode; isDark?: boolean;
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={`relative flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? "text-[#c9a55a] bg-[rgba(201,165,90,0.12)]"
          : isDark
          ? "text-white/60 hover:text-white hover:bg-white/8"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      } disabled:opacity-30 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}

// Séparateur vertical
function Sep({ isDark }: { isDark?: boolean }) {
  return <div className={`mx-0.5 h-5 w-px shrink-0 ${isDark ? "bg-white/10" : "bg-gray-200"}`} />;
}

// Dropdown des niveaux de titre
function HeadingMenu({ editor, isDark }: { editor: Editor; isDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const levels = [
    { label: "Paragraphe", fn: () => editor.chain().focus().setParagraph().run(), active: editor.isActive("paragraph") },
    { label: "Titre 1",    fn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
    { label: "Titre 2",    fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { label: "Titre 3",    fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { label: "Titre 4",    fn: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: editor.isActive("heading", { level: 4 }) },
  ];
  const current = levels.find(l => l.active)?.label ?? "Paragraphe";

  return (
    <div className="relative">
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
        className={`flex h-7 items-center gap-1 rounded px-2 text-xs font-medium transition-colors ${
          isDark ? "text-white/70 hover:bg-white/8 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Type size={13} /><span className="hidden sm:inline">{current}</span>
        <ChevronDown size={11} className="opacity-50" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 top-8 z-50 w-36 rounded-xl border py-1 shadow-xl ${
            isDark ? "border-white/10 bg-[#16213e]" : "border-gray-200 bg-white"
          }`}>
            {levels.map(l => (
              <button key={l.label} onMouseDown={e => { e.preventDefault(); l.fn(); setOpen(false); }}
                className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                  l.active
                    ? "text-[#c9a55a] font-semibold"
                    : isDark ? "text-white/70 hover:bg-white/6 hover:text-white" : "text-gray-700 hover:bg-gray-50"
                }`}>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Sélecteur de couleur
function ColorPicker({ editor, isDark, type }: { editor: Editor; isDark?: boolean; type: "text" | "highlight" }) {
  const [open, setOpen] = useState(false);
  const COLORS = [
    "#000000","#374151","#6b7280","#ef4444","#f97316","#eab308",
    "#22c55e","#3b82f6","#8b5cf6","#ec4899","#c9a55a","#06b6d4",
  ];
  const icon = type === "text"
    ? <Palette size={13} />
    : <Highlighter size={13} />;

  return (
    <div className="relative">
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
        title={type === "text" ? "Couleur du texte" : "Surligner"}
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          isDark ? "text-white/60 hover:text-white hover:bg-white/8" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}>
        {icon}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 top-8 z-50 rounded-xl border p-2 shadow-xl ${
            isDark ? "border-white/10 bg-[#16213e]" : "border-gray-200 bg-white"
          }`}>
            <div className="grid grid-cols-6 gap-1">
              {COLORS.map(c => (
                <button key={c} onMouseDown={e => {
                  e.preventDefault();
                  if (type === "text") {
                    editor.chain().focus().setColor(c).run();
                  } else {
                    editor.chain().focus().toggleHighlight({ color: c + "40" }).run();
                  }
                  setOpen(false);
                }}
                  className="h-5 w-5 rounded transition-transform hover:scale-110"
                  style={{ background: c, border: c === "#000000" ? "1px solid #ccc" : "none" }}
                />
              ))}
            </div>
            <button onMouseDown={e => {
              e.preventDefault();
              if (type === "text") editor.chain().focus().unsetColor().run();
              else editor.chain().focus().unsetHighlight().run();
              setOpen(false);
            }} className={`mt-2 w-full rounded px-2 py-1 text-[10px] transition-colors ${
              isDark ? "text-white/40 hover:bg-white/6 hover:text-white" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            }`}>
              Réinitialiser
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function EditorToolbar({ editor, isDark = false, onInsertImage, onInsertLink }: Props) {
  if (!editor) return null;

  const handleInsertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleInsertLink = () => {
    if (onInsertLink) { onInsertLink(); return; }
    const url = window.prompt("URL du lien :", "https://");
    if (url) editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
  };

  const handleInsertImage = () => {
    if (onInsertImage) { onInsertImage(); return; }
    const url = window.prompt("URL de l'image :", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className={`flex flex-wrap items-center gap-0.5 px-3 py-1.5 ${
      isDark ? "border-b border-white/8 bg-[#0c1525]" : "border-b border-gray-200 bg-white"
    }`}>
      {/* Historique */}
      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler (Ctrl+Z)" isDark={isDark}>
        <Undo2 size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir (Ctrl+Y)" isDark={isDark}>
        <Redo2 size={13} />
      </Btn>
      <Sep isDark={isDark} />

      {/* Style du paragraphe */}
      <HeadingMenu editor={editor} isDark={isDark} />
      <Sep isDark={isDark} />

      {/* Formatage caractères */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras (Ctrl+B)" isDark={isDark}>
        <Bold size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique (Ctrl+I)" isDark={isDark}>
        <Italic size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné (Ctrl+U)" isDark={isDark}>
        <Underline size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré" isDark={isDark}>
        <Strikethrough size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code en ligne" isDark={isDark}>
        <Code size={13} />
      </Btn>
      <ColorPicker editor={editor} isDark={isDark} type="text" />
      <ColorPicker editor={editor} isDark={isDark} type="highlight" />
      <Sep isDark={isDark} />

      {/* Alignement */}
      <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Aligner à gauche" isDark={isDark}>
        <AlignLeft size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centrer" isDark={isDark}>
        <AlignCenter size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Aligner à droite" isDark={isDark}>
        <AlignRight size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justifier" isDark={isDark}>
        <AlignJustify size={13} />
      </Btn>
      <Sep isDark={isDark} />

      {/* Listes */}
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste à puces" isDark={isDark}>
        <List size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée" isDark={isDark}>
        <ListOrdered size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Liste de tâches" isDark={isDark}>
        <CheckSquare size={13} />
      </Btn>
      <Sep isDark={isDark} />

      {/* Insertions */}
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation" isDark={isDark}>
        <Quote size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Bloc de code" isDark={isDark}>
        <Code2 size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur horizontal" isDark={isDark}>
        <Minus size={13} />
      </Btn>
      <Btn onClick={handleInsertLink} active={editor.isActive("link")} title="Insérer un lien" isDark={isDark}>
        <Link2 size={13} />
      </Btn>
      <Btn onClick={handleInsertImage} title="Insérer une image" isDark={isDark}>
        <Image size={13} />
      </Btn>
      <Btn onClick={handleInsertTable} title="Insérer un tableau" isDark={isDark}>
        <Table2 size={13} />
      </Btn>

      {/* Indentation pour les listes */}
      <Sep isDark={isDark} />
      <Btn onClick={() => editor.chain().focus().sinkListItem("listItem").run()} disabled={!editor.can().sinkListItem("listItem")} title="Augmenter l'indentation" isDark={isDark}>
        <IndentIncrease size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().liftListItem("listItem").run()} disabled={!editor.can().liftListItem("listItem")} title="Diminuer l'indentation" isDark={isDark}>
        <IndentDecrease size={13} />
      </Btn>

      {/* Réinitialiser le formatage */}
      <Sep isDark={isDark} />
      <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Effacer le formatage" isDark={isDark}>
        <RotateCcw size={13} />
      </Btn>
    </div>
  );
}

export default EditorToolbar;
