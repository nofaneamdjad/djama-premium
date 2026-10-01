"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { Extension } from "@tiptap/core";
import { useEffect, useRef } from "react";

// ── Extension ResizableImage (Image + poignées de resize) ────────────────────
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("width") ?? el.style.width?.replace("px","") ?? null,
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.width) return {};
          return { width: String(attrs.width), style: `width:${attrs.width}px;max-width:100%` };
        },
      },
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNodeView(): any {
    return ({ node, updateAttributes }: {
      node: { attrs: Record<string, unknown>; type: { name: string } };
      updateAttributes: (a: Record<string, unknown>) => void;
    }) => {
      const dom = document.createElement("span");
      dom.style.cssText = "display:inline-block;position:relative;max-width:100%;line-height:0;vertical-align:middle";

      const img = document.createElement("img");
      img.src = node.attrs.src as string;
      img.alt = (node.attrs.alt as string) ?? "";
      img.style.cssText = `display:block;max-width:100%;border-radius:4px;cursor:default;${node.attrs.width ? `width:${node.attrs.width}px` : ""}`;
      dom.appendChild(img);

      // Étiquette de largeur pendant le resize
      const label = document.createElement("div");
      label.style.cssText = "position:absolute;bottom:22px;left:4px;font-size:9px;background:rgba(0,0,0,0.6);color:#fff;padding:1px 5px;border-radius:3px;opacity:0;pointer-events:none;white-space:nowrap;font-family:monospace";
      dom.appendChild(label);

      // Poignée resize (coin bas-droite)
      const handle = document.createElement("div");
      handle.title = "Redimensionner";
      handle.style.cssText = "position:absolute;bottom:3px;right:3px;width:14px;height:14px;background:#c9a55a;cursor:se-resize;border-radius:2px;opacity:0;transition:opacity 0.15s;z-index:10";
      // Triangle SVG dans la poignée
      handle.innerHTML = `<svg width="8" height="8" viewBox="0 0 8 8" style="position:absolute;bottom:2px;right:2px;fill:rgba(0,0,0,0.5)"><polygon points="8,0 8,8 0,8"/></svg>`;
      dom.appendChild(handle);

      dom.addEventListener("mouseenter", () => { handle.style.opacity = "0.9"; });
      dom.addEventListener("mouseleave", () => { handle.style.opacity = "0"; });

      let startX = 0, startW = 0;
      handle.addEventListener("mousedown", (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startW = img.offsetWidth || 300;
        label.style.opacity = "1";

        const onMove = (ev: MouseEvent) => {
          const newW = Math.max(50, Math.min(startW + ev.clientX - startX, 790));
          img.style.width = `${newW}px`;
          label.textContent = `${newW}px`;
        };
        const onUp = (ev: MouseEvent) => {
          const newW = Math.max(50, Math.min(startW + ev.clientX - startX, 790));
          updateAttributes({ width: newW });
          label.style.opacity = "0";
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      return {
        dom,
        update(newNode: { type: { name: string }; attrs: Record<string, unknown> }) {
          if (newNode.type.name !== "image") return false;
          img.src = newNode.attrs.src as string;
          if (newNode.attrs.width) img.style.width = `${newNode.attrs.width}px`;
          else img.style.width = "";
          return true;
        },
        selectNode() { img.style.outline = "2px solid #c9a55a"; img.style.borderRadius = "4px"; },
        deselectNode() { img.style.outline = ""; },
        stopEvent(event: Event) { return (event.target as HTMLElement) === handle; },
      };
    };
  },
});

// ── Extension FontSize (via TextStyle) ────────────────────────────────────────
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{ types: ["textStyle"], attributes: {
      fontSize: {
        default: null,
        parseHTML: el => el.style.fontSize?.replace(/px$/, "") || null,
        renderHTML: attrs => attrs.fontSize ? { style: `font-size:${attrs.fontSize}px` } : {},
      },
    }}];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark("textStyle", { fontSize: size }).run(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ── Extension LineHeight ──────────────────────────────────────────────────────
const LineHeight = Extension.create({
  name: "lineHeight",
  addGlobalAttributes() {
    return [{ types: ["paragraph", "heading"], attributes: {
      lineHeight: {
        default: null,
        parseHTML: el => el.style.lineHeight || null,
        renderHTML: attrs => attrs.lineHeight ? { style: `line-height:${attrs.lineHeight}` } : {},
      },
    }}];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLineHeight: (h: string) => ({ commands }: any) =>
        commands.updateAttributes("paragraph", { lineHeight: h }),
    };
  },
});

// ── CSS éditeur ───────────────────────────────────────────────────────────────
const EDITOR_CSS = `
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
.ProseMirror { outline: none; min-height: 100%; caret-color: #c9a55a; }
.ProseMirror p  { margin: 0 0 0.35em; line-height: 1.6; }
.ProseMirror h1 { font-size: 2rem;   font-weight: 700; margin: 1.2em 0 0.5em; line-height: 1.2; }
.ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1em 0 0.45em;  line-height: 1.25; }
.ProseMirror h3 { font-size: 1.2rem; font-weight: 600; margin: 0.8em 0 0.4em; line-height: 1.3; }
.ProseMirror h4 { font-size: 1rem;   font-weight: 600; margin: 0.6em 0 0.3em; }
.ProseMirror ul { list-style: disc;    padding-left: 1.6em; margin: 0.3em 0; }
.ProseMirror ol { list-style: decimal; padding-left: 1.6em; margin: 0.3em 0; }
.ProseMirror li { margin: 0.1em 0; line-height: 1.6; }
.ProseMirror blockquote {
  border-left: 3px solid #c9a55a; padding: 0.3em 0 0.3em 1em;
  color: #6b7280; font-style: italic; margin: 0.5em 0;
}
.ProseMirror code {
  background: rgba(0,0,0,0.07); padding: 0.1em 0.3em; border-radius: 3px;
  font-family: 'JetBrains Mono','Fira Code',monospace; font-size: 0.875em;
}
.ProseMirror pre {
  background: #1e2030; color: #cdd6f4; padding: 0.9em 1.1em;
  border-radius: 6px; overflow-x: auto; margin: 0.7em 0;
  font-family: 'JetBrains Mono','Fira Code',monospace; font-size: 0.875em;
}
.ProseMirror pre code { background: none; padding: 0; color: inherit; }
.ProseMirror table { border-collapse: collapse; width: 100%; margin: 0.7em 0; table-layout: fixed; }
.ProseMirror td, .ProseMirror th { border: 1px solid #d1d5db; padding: 0.45em 0.7em; min-width: 2rem; vertical-align: top; position: relative; }
.ProseMirror th { background: #f9fafb; font-weight: 600; text-align: left; }
.ProseMirror .selectedCell { background: rgba(201,165,90,0.1); }
.ProseMirror .column-resize-handle { position:absolute; right:-2px; top:0; bottom:-2px; width:4px; background:#c9a55a; cursor:col-resize; pointer-events:all; }
.ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.25em; }
.ProseMirror ul[data-type="taskList"] li { display:flex; align-items:flex-start; gap:0.5em; margin:0.15em 0; }
.ProseMirror ul[data-type="taskList"] li label { flex-shrink:0; display:flex; align-items:center; margin-top:0.15em; }
.ProseMirror ul[data-type="taskList"] li input[type="checkbox"] { width:1em; height:1em; cursor:pointer; accent-color:#c9a55a; }
.ProseMirror ul[data-type="taskList"] li > div { flex:1; }
.ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration:line-through; opacity:0.55; }
.ProseMirror hr { border:none; border-top:1.5px solid #e5e7eb; margin:1em 0; }
.ProseMirror img { max-width:100%; border-radius:4px; margin:0.3em 0; display:block; cursor:pointer; }
.ProseMirror img.ProseMirror-selectednode { outline:2px solid #c9a55a; }
.ProseMirror a { color:#3b82f6; text-decoration:underline; cursor:pointer; }
.ProseMirror a:hover { color:#1d4ed8; }
.ProseMirror mark { border-radius:2px; padding:0 0.12em; }
.ProseMirror p.is-editor-empty:first-child::before { color:#9ca3af; content:attr(data-placeholder); float:left; height:0; pointer-events:none; }
.ProseMirror .page-break { border-top: 2px dashed #9ca3af; margin: 2em 0; padding-top: 0.5em; position: relative; }
.ProseMirror .page-break::before { content: 'Saut de page'; position: absolute; top: -0.7em; left: 50%; transform: translateX(-50%); background: white; padding: 0 0.5em; color: #9ca3af; font-size: 0.7em; }
`;

export type TiptapEditorRef = {
  getJSON:    () => object;
  getHTML:    () => string;
  getText:    () => string;
  setContent: (c: object | string) => void;
  focus:      () => void;
  getEditor:  () => Editor | null;
  getCharacterCount: () => number;
  getWordCount: () => number;
};

interface Props {
  content?:       object | string | null;
  editorRef?:     React.RefObject<TiptapEditorRef | null>;
  onChange?:      (json: object, html: string, text: string) => void;
  onEditorReady?: (editor: Editor) => void;
  editable?:      boolean;
  isDark?:        boolean;
  placeholder?:   string;
  className?:     string;
}

export function TiptapEditor({
  content, editorRef, onChange, onEditorReady,
  editable = true, isDark = false,
  placeholder = "Commencez à écrire…",
  className = "",
}: Props) {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    if (!document.getElementById("tiptap-editor-css")) {
      const el = document.createElement("style");
      el.id = "tiptap-editor-css";
      el.textContent = EDITOR_CSS;
      document.head.appendChild(el);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { languageClassPrefix: "language-" },
        bulletList:   { keepMarks: true, keepAttributes: false },
        orderedList:  { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      ResizableImage.configure({ allowBase64: true, inline: true }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      Color,
      Subscript,
      Superscript,
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

  useEffect(() => {
    if (!editorRef || !editor) return;
    (editorRef as React.MutableRefObject<TiptapEditorRef | null>).current = {
      getJSON:           () => editor.getJSON(),
      getHTML:           () => editor.getHTML(),
      getText:           () => editor.getText(),
      setContent:        (c) => editor.commands.setContent(c),
      focus:             () => editor.commands.focus(),
      getEditor:         () => editor,
      getCharacterCount: () => editor.storage.characterCount?.characters?.() ?? 0,
      getWordCount:      () => editor.storage.characterCount?.words?.() ?? 0,
    };
  }, [editor, editorRef]);

  useEffect(() => {
    if (!editor || !content) return;
    const cur  = JSON.stringify(editor.getJSON());
    const next = typeof content === "string" ? content : JSON.stringify(content);
    if (cur !== next) editor.commands.setContent(content);
  }, [content, editor]);

  return (
    <EditorContent
      editor={editor}
      className={`${isDark ? "dark-editor" : ""} ${className}`}
      style={{ minHeight: "100%", width: "100%" }}
    />
  );
}

export type { Editor };
export default TiptapEditor;
