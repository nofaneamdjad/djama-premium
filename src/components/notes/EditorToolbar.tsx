"use client";

import { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Code2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare,
  Quote, Minus, Link2, ImageIcon, Table2,
  Undo2, Redo2, ChevronDown, Highlighter, Palette,
  IndentDecrease, IndentIncrease, RotateCcw,
  Subscript, Superscript,
} from "lucide-react";
import { useState, useRef } from "react";

const GOLD = "#c9a55a";

interface Props {
  editor: Editor | null;
  isDark?: boolean;
  onInsertImage?: () => void;
  onInsertLink?:  () => void;
}

function Btn({ onClick, active, disabled, title, children, isDark, wide }: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title?: string; children: React.ReactNode; isDark?: boolean; wide?: boolean;
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title} disabled={disabled}
      className={`relative flex ${wide?"px-2 min-w-[2.5rem]":"w-7"} h-7 items-center justify-center rounded transition-colors text-[11px] ${
        active
          ? "text-[#c9a55a] bg-[rgba(201,165,90,0.12)]"
          : isDark ? "text-white/60 hover:text-white hover:bg-white/8"
                   : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      } disabled:opacity-30 disabled:pointer-events-none`}
    >{children}</button>
  );
}
function Sep({ isDark }: { isDark?: boolean }) {
  return <div className={`mx-0.5 h-5 w-px shrink-0 ${isDark?"bg-white/10":"bg-gray-200"}`}/>;
}

// ── Sélecteur de police ───────────────────────────────────────────────────────
const FONTS = [
  { label: "Par défaut",   value: "" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia",      value: "Georgia" },
  { label: "Arial",        value: "Arial" },
  { label: "Helvetica",    value: "Helvetica" },
  { label: "Verdana",      value: "Verdana" },
  { label: "Calibri",      value: "Calibri" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Courier New",  value: "Courier New" },
];
const SIZES = ["8","9","10","11","12","14","16","18","20","24","28","32","36","48","60","72"];

function FontSelect({ editor, isDark }: { editor: Editor; isDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const cur = (editor.getAttributes("textStyle").fontFamily as string) || "Par défaut";
  const lbl = FONTS.find(f => f.value === cur)?.label ?? cur;
  return (
    <div className="relative">
      <button onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}}
        className={`flex h-7 w-28 items-center justify-between gap-1 rounded px-2 text-[11px] truncate transition ${isDark?"text-white/70 hover:bg-white/8":"text-gray-600 hover:bg-gray-100"}`}>
        <span className="truncate">{lbl}</span><ChevronDown size={10} className="shrink-0 opacity-50"/>
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
        <div className={`absolute left-0 top-8 z-50 w-44 rounded-xl border py-1 shadow-xl max-h-60 overflow-y-auto ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
          {FONTS.map(f=>(
            <button key={f.value} onMouseDown={e=>{e.preventDefault();
              f.value ? editor.chain().focus().setFontFamily(f.value).run()
                      : editor.chain().focus().unsetFontFamily().run();
              setOpen(false);}}
              className={`w-full px-3 py-1.5 text-left text-[11px] transition ${cur===f.value||(!f.value&&!cur)?`text-[${GOLD}] font-semibold`:isDark?"text-white/70 hover:bg-white/6":"text-gray-700 hover:bg-gray-50"}`}
              style={{fontFamily:f.value||undefined}}>
              {f.label}
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

function SizeSelect({ editor, isDark }: { editor: Editor; isDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const curPx = (editor.getAttributes("textStyle").fontSize as string) ?? "";
  const curNum = curPx ? String(parseFloat(curPx)) : "12";

  const setSize = (s: string) => {
    if (s) editor.chain().focus().setMark("textStyle",{fontSize:s}).run();
    else editor.chain().focus().unsetMark("textStyle").run();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}}
        className={`flex h-7 w-14 items-center justify-between gap-0.5 rounded px-2 text-[11px] transition ${isDark?"text-white/70 hover:bg-white/8":"text-gray-600 hover:bg-gray-100"}`}>
        <span>{curNum}</span><ChevronDown size={10} className="opacity-50"/>
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
        <div className={`absolute left-0 top-8 z-50 w-20 rounded-xl border py-1 shadow-xl max-h-60 overflow-y-auto ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
          <div className="px-2 pb-1">
            <input value={custom} onChange={e=>setCustom(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"){setSize(custom);setCustom("");}}}
              placeholder={curNum} className={`w-full rounded border px-1.5 py-0.5 text-[11px] outline-none ${isDark?"border-white/10 bg-white/5 text-white":"border-gray-200 text-gray-900"}`}/>
          </div>
          {SIZES.map(s=>(
            <button key={s} onMouseDown={e=>{e.preventDefault();setSize(s);}}
              className={`w-full px-3 py-1 text-right text-[11px] transition ${curNum===s?`text-[${GOLD}] font-bold`:isDark?"text-white/70 hover:bg-white/6":"text-gray-700 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

function HeadingMenu({ editor, isDark }: { editor: Editor; isDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const styles = [
    { label: "Normal",     fn: ()=>editor.chain().focus().setParagraph().run(), active: editor.isActive("paragraph") && !editor.isActive("heading") },
    { label: "Titre 1",    fn: ()=>editor.chain().focus().toggleHeading({level:1}).run(), active: editor.isActive("heading",{level:1}) },
    { label: "Titre 2",    fn: ()=>editor.chain().focus().toggleHeading({level:2}).run(), active: editor.isActive("heading",{level:2}) },
    { label: "Titre 3",    fn: ()=>editor.chain().focus().toggleHeading({level:3}).run(), active: editor.isActive("heading",{level:3}) },
    { label: "Titre 4",    fn: ()=>editor.chain().focus().toggleHeading({level:4}).run(), active: editor.isActive("heading",{level:4}) },
    { label: "Citation",   fn: ()=>editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { label: "Code",       fn: ()=>editor.chain().focus().toggleCodeBlock().run(),  active: editor.isActive("codeBlock") },
  ];
  const current = styles.find(s=>s.active)?.label ?? "Normal";
  return (
    <div className="relative">
      <button onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}}
        className={`flex h-7 w-24 items-center justify-between gap-1 rounded px-2 text-[11px] transition ${isDark?"text-white/70 hover:bg-white/8":"text-gray-600 hover:bg-gray-100"}`}>
        <span className="truncate">{current}</span><ChevronDown size={10} className="opacity-50"/>
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
        <div className={`absolute left-0 top-8 z-50 w-36 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
          {styles.map(s=>(
            <button key={s.label} onMouseDown={e=>{e.preventDefault();s.fn();setOpen(false);}}
              className={`w-full px-3 py-1.5 text-left text-[11px] transition ${s.active?`text-[${GOLD}] font-semibold`:isDark?"text-white/70 hover:bg-white/6":"text-gray-700 hover:bg-gray-50"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

function ColorPicker({ editor, isDark, type }: { editor: Editor; isDark?: boolean; type: "text"|"highlight" }) {
  const [open, setOpen] = useState(false);
  const COLORS = ["#000000","#374151","#6b7280","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#c9a55a","#06b6d4","#ffffff"];
  return (
    <div className="relative">
      <button onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}} title={type==="text"?"Couleur du texte":"Surligner"}
        className={`flex h-7 w-7 items-center justify-center rounded transition ${isDark?"text-white/60 hover:text-white hover:bg-white/8":"text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
        {type==="text"?<Palette size={12}/>:<Highlighter size={12}/>}
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
        <div className={`absolute left-0 top-8 z-50 rounded-xl border p-2 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
          <div className="grid grid-cols-7 gap-1">
            {COLORS.map(c=>(
              <button key={c} onMouseDown={e=>{e.preventDefault();
                type==="text" ? editor.chain().focus().setColor(c).run()
                              : editor.chain().focus().toggleHighlight({color:c+"50"}).run();
                setOpen(false);}}
                className="h-5 w-5 rounded transition-transform hover:scale-110"
                style={{background:c,border:c==="#ffffff"?"1px solid #d1d5db":"none"}}/>
            ))}
          </div>
          <button onMouseDown={e=>{e.preventDefault();
            type==="text" ? editor.chain().focus().unsetColor().run()
                          : editor.chain().focus().unsetHighlight().run();
            setOpen(false);}}
            className={`mt-1.5 w-full rounded px-2 py-0.5 text-[10px] transition ${isDark?"text-white/40 hover:bg-white/6":"text-gray-400 hover:bg-gray-50"}`}>
            Réinitialiser
          </button>
        </div>
      </>}
    </div>
  );
}

function LineHeightMenu({ editor, isDark }: { editor: Editor; isDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const opts = [["1","Simple"],["1.15","1.15"],["1.5","1.5"],["2","Double"],["2.5","2.5"]];
  return (
    <div className="relative">
      <button onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}} title="Interligne"
        className={`flex h-7 w-7 items-center justify-center rounded transition text-[9px] font-bold ${isDark?"text-white/60 hover:text-white hover:bg-white/8":"text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
        ↕
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
        <div className={`absolute left-0 top-8 z-50 w-28 rounded-xl border py-1 shadow-xl ${isDark?"border-white/10 bg-[#16213e]":"border-gray-200 bg-white"}`}>
          {opts.map(([v,l])=>(
            <button key={v} onMouseDown={e=>{e.preventDefault();
              editor.chain().focus().updateAttributes("paragraph",{lineHeight:v}).run();
              setOpen(false);}}
              className={`w-full px-3 py-1.5 text-left text-[11px] transition ${isDark?"text-white/70 hover:bg-white/6":"text-gray-700 hover:bg-gray-50"}`}>
              {l}
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

export function EditorToolbar({ editor, isDark = false, onInsertImage, onInsertLink }: Props) {
  if (!editor) return (
    <div className={`flex h-9 shrink-0 items-center px-3 border-b ${isDark?"border-white/8 bg-[#0c1525]":"border-gray-200 bg-white"}`}/>
  );

  const insertTable = () => editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run();
  const insertLink  = () => {
    if (onInsertLink) { onInsertLink(); return; }
    const url = window.prompt("URL du lien :", "https://");
    if (url) editor.chain().focus().setLink({href:url, target:"_blank"}).run();
  };
  const insertImage = () => {
    if (onInsertImage) { onInsertImage(); return; }
    const url = window.prompt("URL de l'image :", "https://");
    if (url) editor.chain().focus().setImage({src:url}).run();
  };

  return (
    <div className={`flex shrink-0 flex-wrap items-center gap-0.5 px-2 py-1 ${isDark?"border-b border-white/8 bg-[#0c1525]":"border-b border-gray-200 bg-white"}`}>
      {/* Undo/Redo */}
      <Btn onClick={()=>editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler Ctrl+Z" isDark={isDark}><Undo2 size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir Ctrl+Y" isDark={isDark}><Redo2 size={12}/></Btn>
      <Sep isDark={isDark}/>

      {/* Style de paragraphe */}
      <HeadingMenu editor={editor} isDark={isDark}/>
      <Sep isDark={isDark}/>

      {/* Police + Taille */}
      <FontSelect editor={editor} isDark={isDark}/>
      <SizeSelect editor={editor} isDark={isDark}/>
      <Sep isDark={isDark}/>

      {/* Formatage */}
      <Btn onClick={()=>editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras Ctrl+B" isDark={isDark}><Bold size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique Ctrl+I" isDark={isDark}><Italic size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné Ctrl+U" isDark={isDark}><Underline size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré" isDark={isDark}><Strikethrough size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Indice" isDark={isDark}><Subscript size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Exposant" isDark={isDark}><Superscript size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code inline" isDark={isDark}><Code size={12}/></Btn>
      <ColorPicker editor={editor} isDark={isDark} type="text"/>
      <ColorPicker editor={editor} isDark={isDark} type="highlight"/>
      <Sep isDark={isDark}/>

      {/* Alignement */}
      <Btn onClick={()=>editor.chain().focus().setTextAlign("left").run()}    active={editor.isActive({textAlign:"left"})}    title="Gauche"   isDark={isDark}><AlignLeft    size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().setTextAlign("center").run()}  active={editor.isActive({textAlign:"center"})}  title="Centrer"  isDark={isDark}><AlignCenter  size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().setTextAlign("right").run()}   active={editor.isActive({textAlign:"right"})}   title="Droite"   isDark={isDark}><AlignRight   size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({textAlign:"justify"})} title="Justifié" isDark={isDark}><AlignJustify size={12}/></Btn>
      <LineHeightMenu editor={editor} isDark={isDark}/>
      <Sep isDark={isDark}/>

      {/* Listes */}
      <Btn onClick={()=>editor.chain().focus().toggleBulletList().run()}  active={editor.isActive("bulletList")}  title="Liste à puces"     isDark={isDark}><List        size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée"   isDark={isDark}><ListOrdered size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleTaskList().run()}    active={editor.isActive("taskList")}    title="Cases à cocher"    isDark={isDark}><CheckSquare size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().sinkListItem("listItem").run()} disabled={!editor.can().sinkListItem("listItem")} title="Augmenter indentation" isDark={isDark}><IndentIncrease size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().liftListItem("listItem").run()} disabled={!editor.can().liftListItem("listItem")} title="Diminuer indentation" isDark={isDark}><IndentDecrease size={12}/></Btn>
      <Sep isDark={isDark}/>

      {/* Insertions */}
      <Btn onClick={()=>editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation"  isDark={isDark}><Quote    size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().toggleCodeBlock().run()}  active={editor.isActive("codeBlock")}  title="Bloc code" isDark={isDark}><Code2    size={12}/></Btn>
      <Btn onClick={()=>editor.chain().focus().setHorizontalRule().run()}                                        title="Séparateur"isDark={isDark}><Minus    size={12}/></Btn>
      <Btn onClick={insertLink}  active={editor.isActive("link")}  title="Lien"    isDark={isDark}><Link2      size={12}/></Btn>
      <Btn onClick={insertImage}                                     title="Image"   isDark={isDark}><ImageIcon  size={12}/></Btn>
      <Btn onClick={insertTable}                                     title="Tableau" isDark={isDark}><Table2     size={12}/></Btn>
      <Sep isDark={isDark}/>

      {/* Réinitialiser */}
      <Btn onClick={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Effacer le formatage" isDark={isDark}><RotateCcw size={12}/></Btn>
    </div>
  );
}

export default EditorToolbar;
