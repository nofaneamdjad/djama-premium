"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { useEffect, useRef } from "react";

// ── CSS de l'éditeur (injecté dans <head>) ────────────────────────────────────
const EDITOR_CSS = `
.ProseMirror {
  outline: none;
  min-height: 100%;
  caret-color: #c9a55a;
}
.ProseMirror p { margin: 0 0 0.4em; line-height: 1.7; }
.ProseMirror h1 { font-size: 2rem; font-weight: 700; margin: 1.2rem 0 0.6rem; line-height: 1.2; }
.ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1rem 0 0.5rem; line-height: 1.3; }
.ProseMirror h3 { font-size: 1.2rem; font-weight: 600; margin: 0.8rem 0 0.4rem; line-height: 1.4; }
.ProseMirror h4 { font-size: 1rem;   font-weight: 600; margin: 0.6rem 0 0.3rem; }
.ProseMirror ul { list-style: disc;    padding-left: 1.5rem; margin: 0.4rem 0; }
.ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0.4rem 0; }
.ProseMirror li { margin: 0.1rem 0; }
.ProseMirror blockquote {
  border-left: 3px solid #c9a55a;
  padding: 0.4rem 0 0.4rem 1rem;
  color: #6b7280;
  font-style: italic;
  margin: 0.6rem 0;
}
.ProseMirror code {
  background: rgba(0,0,0,0.06);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875em;
}
.ProseMirror pre {
  background: #1e2030;
  color: #cdd6f4;
  padding: 1rem 1.2rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.8rem 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875em;
}
.ProseMirror pre code { background: none; padding: 0; color: inherit; }
.ProseMirror table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8rem 0;
  table-layout: fixed;
}
.ProseMirror td, .ProseMirror th {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  min-width: 2rem;
  vertical-align: top;
  position: relative;
}
.ProseMirror th { background: #f9fafb; font-weight: 600; text-align: left; }
.ProseMirror .selectedCell { background: rgba(201,165,90,0.1); }
.ProseMirror .column-resize-handle {
  position: absolute;
  right: -2px; top: 0; bottom: -2px;
  width: 4px; background: #c9a55a;
  cursor: col-resize; pointer-events: all;
}
.ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.25rem; }
.ProseMirror ul[data-type="taskList"] li {
  display: flex; align-items: flex-start; gap: 0.5rem; margin: 0.2rem 0;
}
.ProseMirror ul[data-type="taskList"] li label {
  flex-shrink: 0; display: flex; align-items: center; margin-top: 0.15rem;
}
.ProseMirror ul[data-type="taskList"] li input[type="checkbox"] {
  width: 1rem; height: 1rem; cursor: pointer;
  accent-color: #c9a55a;
}
.ProseMirror ul[data-type="taskList"] li > div { flex: 1; }
.ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
  text-decoration: line-through; opacity: 0.6;
}
.ProseMirror hr {
  border: none; border-top: 1.5px solid #e5e7eb; margin: 1.2rem 0;
}
.ProseMirror img {
  max-width: 100%; border-radius: 6px; margin: 0.4rem 0;
  display: block;
}
.ProseMirror a { color: #3b82f6; text-decoration: underline; cursor: pointer; }
.ProseMirror a:hover { color: #1d4ed8; }
.ProseMirror mark { border-radius: 2px; padding: 0 0.15rem; }
.ProseMirror p.is-editor-empty:first-child::before {
  color: #9ca3af; content: attr(data-placeholder); float: left; height: 0; pointer-events: none;
}
/* Dark mode */
.dark-editor .ProseMirror td, .dark-editor .ProseMirror th {
  border-color: rgba(255,255,255,0.1);
}
.dark-editor .ProseMirror th { background: rgba(255,255,255,0.04); }
.dark-editor .ProseMirror code { background: rgba(255,255,255,0.08); }
.dark-editor .ProseMirror blockquote { color: #9ca3af; border-left-color: #c9a55a; }
.dark-editor .ProseMirror hr { border-color: rgba(255,255,255,0.1); }
`;

export type TiptapEditorRef = {
  getJSON: () => object;
  getHTML: () => string;
  getText: () => string;
  setContent: (content: object | string) => void;
  focus: () => void;
};

interface Props {
  content?:        object | string | null;
  editorRef?:      React.RefObject<TiptapEditorRef | null>;
  onChange?:       (json: object, html: string, text: string) => void;
  onEditorReady?:  (editor: Editor) => void;
  editable?:       boolean;
  isDark?:         boolean;
  placeholder?:    string;
}

export function TiptapEditor({ content, editorRef, onChange, onEditorReady, editable = true, isDark = false, placeholder = "Commencez à écrire…" }: Props) {
  const styleInjected = useRef(false);

  // Injecter le CSS une seule fois
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.id = "tiptap-editor-css";
    if (!document.getElementById("tiptap-editor-css")) {
      el.textContent = EDITOR_CSS;
      document.head.appendChild(el);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { languageClassPrefix: "language-" },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Typography,
    ],
    content: content ?? null,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON(), ed.getHTML(), ed.getText());
    },
    onCreate: ({ editor: ed }) => {
      onEditorReady?.(ed);
    },
  });

  // Exposer les méthodes via ref
  useEffect(() => {
    if (!editorRef || !editor) return;
    (editorRef as React.MutableRefObject<TiptapEditorRef | null>).current = {
      getJSON:    () => editor.getJSON(),
      getHTML:    () => editor.getHTML(),
      getText:    () => editor.getText(),
      setContent: (c) => editor.commands.setContent(c),
      focus:      () => editor.commands.focus(),
    };
  }, [editor, editorRef]);

  // Mettre à jour le contenu externe si content change
  useEffect(() => {
    if (!editor || !content) return;
    const cur = JSON.stringify(editor.getJSON());
    const next = typeof content === "string" ? content : JSON.stringify(content);
    if (cur !== next) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <EditorContent
      editor={editor}
      className={isDark ? "dark-editor" : ""}
      style={{ minHeight: "100%", width: "100%" }}
    />
  );
}

export type { Editor };
export default TiptapEditor;
