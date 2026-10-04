"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  type Node, type Edge, type NodeTypes,
  BackgroundVariant, Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Network, Plus, Trash2, ArrowLeft, Sparkles, Loader2,
  X, Check, Wand2, GitBranch, PlusCircle, Map,
  Clock, AlertCircle,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#c9a55a";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MindMapMeta {
  id: string; title: string; description: string | null;
  visibility: string; node_count?: number; pinned: boolean;
  created_at: string; updated_at: string;
}

interface NodeData extends Record<string, unknown> {
  label: string; color: string; is_root?: boolean;
  description?: string; priority?: string;
  _onAddChild: (id: string) => void;
  _onDelete: (id: string) => void;
  _onSelect: (id: string) => void;
}

interface MindMapOp {
  op: string;
  [key: string]: unknown;
}

// ─── Custom node ──────────────────────────────────────────────────────────────

function MindMapNodeComponent({ id, data, selected }: { id: string; data: NodeData; selected?: boolean }) {
  const isRoot = !!data.is_root;
  const color = (data.color as string) || GOLD;

  return (
    <div className="relative group" onClick={() => data._onSelect(id)}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 8, height: 8 }} />

      <div style={{
        background: isRoot ? `linear-gradient(135deg, ${color}22, ${color}44)` : "rgba(18,18,28,0.88)",
        border: `${selected ? 2 : 1.5}px solid ${selected ? color : color + "55"}`,
        borderRadius: isRoot ? 20 : 12,
        padding: isRoot ? "12px 20px" : "8px 14px",
        minWidth: isRoot ? 140 : 100,
        maxWidth: 220,
        backdropFilter: "blur(12px)",
        boxShadow: selected
          ? `0 0 0 3px ${color}33, 0 8px 24px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all 0.15s ease",
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
      }}>
        <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: color, opacity: 0.8 }} />
        <div style={{ fontSize: isRoot ? 13 : 12, fontWeight: isRoot ? 700 : 500, color: isRoot ? color : "#e8e8f0", lineHeight: 1.3, wordBreak: "break-word" }}>
          {data.label as string}
        </div>
        {data.description && (
          <div style={{ fontSize: 10, color: "#888", marginTop: 3, lineHeight: 1.3 }}>
            {(data.description as string).slice(0, 60)}
          </div>
        )}
        {data.priority && data.priority !== "normal" && (
          <div style={{
            display: "inline-block", marginTop: 4, fontSize: 9, padding: "1px 5px", borderRadius: 4,
            background: data.priority === "urgent" ? "#ef444433" : "#f59e0b33",
            color: data.priority === "urgent" ? "#ef4444" : "#f59e0b",
            fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {data.priority as string}
          </div>
        )}
      </div>

      {/* Add child button */}
      <button
        onClick={e => { e.stopPropagation(); data._onAddChild(id); }}
        className="group-hover:!opacity-100"
        style={{
          position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
          width: 20, height: 20, borderRadius: "50%", background: color,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity 0.15s", color: "#111",
        }}
        title="Ajouter un nœud enfant"
      >
        <Plus size={10} strokeWidth={3} />
      </button>

      {/* Delete button (hidden for root) */}
      {!isRoot && (
        <button
          onClick={e => { e.stopPropagation(); data._onDelete(id); }}
          className="group-hover:!opacity-70"
          style={{
            position: "absolute", top: -8, left: -8,
            width: 16, height: 16, borderRadius: "50%", background: "#ef4444",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.15s",
          }}
          title="Supprimer"
        >
          <X size={8} strokeWidth={3} color="white" />
        </button>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { mindmap: MindMapNodeComponent as NodeTypes["mindmap"] };

// ─── Canvas ───────────────────────────────────────────────────────────────────

function MindMapCanvas({ mapId, mapTitle, onBack }: { mapId: string; mapTitle: string; onBack: () => void }) {
  const { isDark } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [title, setTitle] = useState(mapTitle);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editPanel, setEditPanel] = useState<{ id: string; label: string; color: string; description: string } | null>(null);
  const [addingChild, setAddingChild] = useState<string | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingOps, setPendingOps] = useState<MindMapOp[] | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable handler refs — updated every render, so node callbacks are never stale
  const handlersRef = useRef({
    onAddChild: (_id: string) => {},
    onDelete: (_id: string) => {},
    onSelect: (_id: string) => {},
  });

  // Stable proxies that always delegate to the ref (never change identity)
  const stableAddChild = useRef((id: string) => handlersRef.current.onAddChild(id)).current;
  const stableDelete  = useRef((id: string) => handlersRef.current.onDelete(id)).current;
  const stableSelect  = useRef((id: string) => handlersRef.current.onSelect(id)).current;

  function toRFNodes(raw: Record<string, unknown>[]): Node<NodeData>[] {
    return raw.map(n => ({
      id: n.id as string,
      type: "mindmap",
      position: { x: (n.position_x as number) ?? 0, y: (n.position_y as number) ?? 0 },
      data: {
        label: n.label as string,
        color: (n.color as string) ?? GOLD,
        is_root: n.is_root as boolean,
        description: (n.description as string) ?? "",
        priority: n.priority as string,
        _onAddChild: stableAddChild,
        _onDelete: stableDelete,
        _onSelect: stableSelect,
      },
    }));
  }

  function toRFEdges(raw: Record<string, unknown>[]): Edge[] {
    return raw.map(e => ({
      id: e.id as string,
      source: e.source_id as string,
      target: e.target_id as string,
      style: { stroke: "#c9a55a44", strokeWidth: 1.5 },
    }));
  }

  // Update handlers ref every render
  handlersRef.current = {
    onAddChild: (id: string) => {
      setAddingChild(id);
      setNewNodeLabel("");
    },
    onDelete: (id: string) => {
      fetch(`/api/mindmaps/${mapId}/nodes/${id}`, { method: "DELETE" }).then(() => {
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
        setSelectedNodeId(cur => (cur === id ? null : cur));
        setEditPanel(cur => (cur?.id === id ? null : cur));
      });
    },
    onSelect: (id: string) => {
      setSelectedNodeId(prev => {
        const next = prev === id ? null : id;
        if (next) {
          setNodes(nds => {
            const n = nds.find(x => x.id === id);
            if (n) {
              setEditPanel({
                id,
                label: n.data.label as string,
                color: n.data.color as string,
                description: (n.data.description as string) ?? "",
              });
            }
            return nds;
          });
        } else {
          setEditPanel(null);
        }
        return next;
      });
    },
  };

  // Load map
  useEffect(() => {
    (async () => {
      setLoadingMap(true);
      const res = await fetch(`/api/mindmaps/${mapId}`);
      if (!res.ok) { setError("Erreur de chargement."); setLoadingMap(false); return; }
      const { map, nodes: rawNodes, edges: rawEdges } = await res.json();
      setTitle(map.title);
      setNodes(toRFNodes(rawNodes));
      setEdges(toRFEdges(rawEdges));
      setLoadingMap(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  async function handleConfirmAddChild() {
    if (!addingChild || !newNodeLabel.trim()) return;
    const parentNode = nodes.find(n => n.id === addingChild);
    const px = parentNode?.position.x ?? 0;
    const py = parentNode?.position.y ?? 0;
    const childCount = edges.filter(e => e.source === addingChild).length;
    const angle = (childCount * 45 * Math.PI) / 180;
    const nx = Math.round(px + Math.cos(angle) * 200);
    const ny = Math.round(py + Math.sin(angle) * 200);

    const res = await fetch(`/api/mindmaps/${mapId}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parent_id: addingChild, label: newNodeLabel.trim(), position_x: nx, position_y: ny }),
    });
    if (!res.ok) { setError("Erreur lors de l'ajout."); return; }
    const { node } = await res.json();
    setNodes(nds => [
      ...nds,
      {
        id: node.id, type: "mindmap",
        position: { x: nx, y: ny },
        data: { label: node.label, color: node.color ?? GOLD, _onAddChild: stableAddChild, _onDelete: stableDelete, _onSelect: stableSelect },
      },
    ]);
    setEdges(eds => [
      ...eds,
      { id: `e-${addingChild}-${node.id}`, source: addingChild, target: node.id, style: { stroke: "#c9a55a44", strokeWidth: 1.5 } },
    ]);
    setAddingChild(null);
  }

  async function handleSaveNode() {
    if (!editPanel) return;
    await fetch(`/api/mindmaps/${mapId}/nodes/${editPanel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editPanel.label, color: editPanel.color, description: editPanel.description }),
    });
    setNodes(nds =>
      nds.map(n =>
        n.id === editPanel.id
          ? { ...n, data: { ...n.data, label: editPanel.label, color: editPanel.color, description: editPanel.description } }
          : n,
      ),
    );
    setEditPanel(null); setSelectedNodeId(null);
  }

  function onNodeDragStop(_: unknown, node: Node<NodeData>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/mindmaps/${mapId}/nodes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions: [{ id: node.id, x: Math.round(node.position.x), y: Math.round(node.position.y) }] }),
      });
    }, 800);
  }

  async function handleAiSuggest() {
    if (!aiInstruction.trim()) return;
    setAiLoading(true); setError(null);
    try {
      const res = await fetch(`/api/mindmaps/${mapId}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: aiInstruction, node_id: selectedNodeId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur IA."); return; }
      setPendingOps(data.ops ?? []);
    } finally { setAiLoading(false); }
  }

  async function handleAiApply() {
    if (!pendingOps?.length) return;
    setApplyLoading(true);
    try {
      const res = await fetch(`/api/mindmaps/${mapId}/ai-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ops: pendingOps, ai_session_id: crypto.randomUUID() }),
      });
      if (!res.ok) { setError("Erreur lors de l'application."); return; }
      const mapRes = await fetch(`/api/mindmaps/${mapId}`);
      const { map, nodes: rawNodes, edges: rawEdges } = await mapRes.json();
      setTitle(map.title);
      setNodes(toRFNodes(rawNodes));
      setEdges(toRFEdges(rawEdges));
      setPendingOps(null); setAiInstruction(""); setAiOpen(false);
    } finally { setApplyLoading(false); }
  }

  const surfaceBg = isDark ? "rgba(15,15,22,0.96)" : "rgba(250,248,244,0.97)";
  const panelBg = isDark ? "rgba(18,18,28,0.94)" : "rgba(255,253,248,0.96)";
  const textMain = isDark ? "#e8e8f0" : "#1a1a2e";
  const textSub = isDark ? "#888" : "#666";
  const borderColor = isDark ? "rgba(201,165,90,0.18)" : "rgba(201,165,90,0.28)";

  if (loadingMap) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: isDark ? "#0a0a12" : "#f5f3ee" }}>
      <Loader2 size={28} color={GOLD} className="animate-spin" />
    </div>
  );

  return (
    <div style={{ width: "100%", height: "100vh", background: isDark ? "#0a0a12" : "#f5f3ee", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: surfaceBg, borderBottom: `1px solid ${borderColor}`, zIndex: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: textSub, display: "flex" }}>
          <ArrowLeft size={18} />
        </button>
        <Network size={15} color={GOLD} />
        <span style={{ fontSize: 14, fontWeight: 600, color: textMain, flex: 1 }}>{title}</span>
        <button
          onClick={() => setAiOpen(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: aiOpen ? `${GOLD}22` : "transparent", border: `1px solid ${aiOpen ? GOLD : borderColor}`, color: aiOpen ? GOLD : textSub, cursor: "pointer", fontSize: 12, fontWeight: 500 }}
        >
          <Sparkles size={13} />
          Assistant IA
        </button>
        <button
          onClick={() => { const root = nodes.find(n => n.data.is_root); if (root) stableAddChild(root.id); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "transparent", border: `1px solid ${borderColor}`, color: textSub, cursor: "pointer", fontSize: 12, fontWeight: 500 }}
        >
          <Plus size={13} />
          Ajouter
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={() => { setSelectedNodeId(null); setEditPanel(null); }}
          fitView fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2} maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={isDark ? "#c9a55a18" : "#c9a55a22"} variant={BackgroundVariant.Dots} gap={24} />
          <Controls style={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10 }} />
          <MiniMap
            style={{ background: panelBg, border: `1px solid ${borderColor}` }}
            nodeColor={n => ((n.data as NodeData).color as string) ?? GOLD}
            maskColor={isDark ? "rgba(10,10,18,0.7)" : "rgba(245,243,238,0.7)"}
          />
        </ReactFlow>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, color: "#ef4444", fontSize: 13, zIndex: 20 }}
            >
              <AlertCircle size={14} />
              {error}
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><X size={12} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Node edit panel */}
      <AnimatePresence>
        {editPanel && (
          <motion.div key="edit" initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            style={{ position: "absolute", right: 0, top: 52, bottom: 0, width: 280, background: panelBg, borderLeft: `1px solid ${borderColor}`, padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", zIndex: 15 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em" }}>Modifier le nœud</span>
              <button onClick={() => { setEditPanel(null); setSelectedNodeId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: textSub }}><X size={14} /></button>
            </div>
            {(["label", "description"] as const).map(field => (
              <div key={field} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 11, color: textSub, fontWeight: 500 }}>{field === "label" ? "Label" : "Description"}</label>
                {field === "label" ? (
                  <input value={editPanel.label} onChange={e => setEditPanel(p => p ? { ...p, label: e.target.value } : p)}
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: textMain, outline: "none" }} />
                ) : (
                  <textarea value={editPanel.description} onChange={e => setEditPanel(p => p ? { ...p, description: e.target.value } : p)}
                    rows={3} style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: textMain, outline: "none", resize: "vertical" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: textSub, fontWeight: 500 }}>Couleur</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["#c9a55a","#6366f1","#10b981","#f59e0b","#ec4899","#0ea5e9","#8b5cf6","#ef4444"].map(c => (
                  <button key={c} onClick={() => setEditPanel(p => p ? { ...p, color: c } : p)}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: "none", cursor: "pointer", outline: editPanel.color === c ? "2px solid white" : "none", outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <button onClick={handleSaveNode}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 8, background: GOLD, border: "none", cursor: "pointer", color: "#111", fontWeight: 600, fontSize: 13, marginTop: "auto" }}
            >
              <Check size={14} />Enregistrer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add child modal */}
      <AnimatePresence>
        {addingChild && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40 }}
            onClick={() => setAddingChild(null)}
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              style={{ background: panelBg, borderRadius: 16, padding: 24, width: 320, border: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", gap: 14 }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: GOLD }}>Nouveau nœud enfant</span>
              <input autoFocus value={newNodeLabel} onChange={e => setNewNodeLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleConfirmAddChild(); if (e.key === "Escape") setAddingChild(null); }}
                placeholder="Label du nœud…"
                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: textMain, outline: "none" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setAddingChild(null)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${borderColor}`, background: "transparent", color: textSub, cursor: "pointer", fontSize: 13 }}>
                  Annuler
                </button>
                <button onClick={handleConfirmAddChild} disabled={!newNodeLabel.trim()}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: GOLD, color: "#111", cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: newNodeLabel.trim() ? 1 : 0.5 }}>
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI panel */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div key="ai" initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: panelBg, borderTop: `1px solid ${borderColor}`, padding: "16px 20px", zIndex: 20, maxHeight: pendingOps ? "55vh" : "auto", overflowY: pendingOps ? "auto" : "visible" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Sparkles size={14} color={GOLD} />
              <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>Assistant IA</span>
              {selectedNodeId && <span style={{ fontSize: 11, color: textSub, padding: "2px 6px", borderRadius: 4, background: `${GOLD}18` }}>Nœud sélectionné</span>}
              <button onClick={() => { setAiOpen(false); setPendingOps(null); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: textSub }}><X size={14} /></button>
            </div>

            {!pendingOps ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input value={aiInstruction} onChange={e => setAiInstruction(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAiSuggest(); }}
                  placeholder="Ex : Ajoute des sous-branches sur le financement, développe la stratégie…"
                  style={{ flex: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: textMain, outline: "none" }}
                />
                <button onClick={handleAiSuggest} disabled={aiLoading || !aiInstruction.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, border: "none", background: GOLD, color: "#111", cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: aiLoading || !aiInstruction.trim() ? 0.6 : 1, flexShrink: 0 }}
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                  Générer
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: textSub }}>
                  {pendingOps.length} opération(s) proposée(s) — confirmez avant d'appliquer :
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "28vh", overflowY: "auto" }}>
                  {pendingOps.map((op, i) => (
                    <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${borderColor}`, fontSize: 12 }}>
                      <span style={{ color: GOLD, fontWeight: 600, marginRight: 8 }}>{op.op}</span>
                      <span style={{ color: textMain }}>
                        {op.op === "create_node" && `"${op.label as string}"`}
                        {op.op === "update_node" && `Modifier nœud ${(op.id as string).slice(0, 8)}…`}
                        {op.op === "delete_node" && `Supprimer nœud ${(op.id as string).slice(0, 8)}…`}
                        {op.op === "expand_branch" && `Ajouter ${(op.nodes as unknown[])?.length ?? 0} nœud(s) enfants`}
                        {op.op === "update_map" && `Renommer : "${op.title as string}"`}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPendingOps(null)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${borderColor}`, background: "transparent", color: textSub, cursor: "pointer", fontSize: 13 }}>
                    Annuler
                  </button>
                  <button onClick={handleAiApply} disabled={applyLoading}
                    style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 8, border: "none", background: GOLD, color: "#111", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                  >
                    {applyLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Appliquer les modifications
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function MindMapListView({ onSelect }: { onSelect: (id: string, title: string) => void }) {
  const { isDark } = useTheme();
  const [maps, setMaps] = useState<MindMapMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const surfaceBg = isDark ? "rgba(15,15,22,0.96)" : "rgba(250,248,244,0.97)";
  const cardBg = isDark ? "rgba(20,20,30,0.85)" : "rgba(255,253,248,0.92)";
  const borderColor = isDark ? "rgba(201,165,90,0.18)" : "rgba(201,165,90,0.28)";
  const textMain = isDark ? "#e8e8f0" : "#1a1a2e";
  const textSub = isDark ? "#888" : "#666";

  useEffect(() => {
    fetch("/api/mindmaps").then(r => r.json()).then(d => {
      setMaps(d.maps ?? []);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!newMapTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/mindmaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newMapTitle.trim() }),
    });
    if (res.ok) {
      const { map } = await res.json();
      onSelect(map.id, map.title);
    }
    setCreating(false);
  }

  async function handleGenerate() {
    if (!genPrompt.trim()) return;
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/mindmaps/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: genPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur IA."); return; }
      onSelect(data.map_id, data.title ?? genPrompt);
    } finally { setGenerating(false); }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/mindmaps/${id}`, { method: "DELETE" });
    setMaps(m => m.filter(x => x.id !== id));
    setDeletingId(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#0a0a12" : "#f5f3ee", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: "28px 28px 0", background: surfaceBg, borderBottom: `1px solid ${borderColor}`, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ padding: 8, borderRadius: 12, background: `${GOLD}22`, border: `1px solid ${GOLD}44` }}>
            <Network size={18} color={GOLD} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: textMain }}>Mind Maps</div>
            <div style={{ fontSize: 12, color: textSub }}>{maps.length} carte{maps.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={() => setGenOpen(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, cursor: "pointer", background: genOpen ? `${GOLD}22` : "transparent", border: `1px solid ${genOpen ? GOLD : borderColor}`, color: genOpen ? GOLD : textSub, fontSize: 13, fontWeight: 500 }}
            >
              <Sparkles size={13} />Générer par IA
            </button>
          </div>
        </div>

        <AnimatePresence>
          {genOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, paddingBottom: 8 }}>
                <input value={genPrompt} onChange={e => setGenPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleGenerate(); }}
                  placeholder="Décris la mind map… ex : Plan de lancement produit SaaS B2B"
                  style={{ flex: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: textMain, outline: "none" }}
                />
                <button onClick={handleGenerate} disabled={generating || !genPrompt.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, border: "none", background: GOLD, color: "#111", cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: generating || !genPrompt.trim() ? 0.6 : 1, flexShrink: 0 }}
                >
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                  {generating ? "Génération…" : "Créer"}
                </button>
              </div>
              {error && <div style={{ padding: "8px 12px", borderRadius: 8, background: "#ef444420", border: "1px solid #ef444440", color: "#ef4444", fontSize: 12 }}>{error}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", gap: 8, paddingBottom: 20 }}>
          <input value={newMapTitle} onChange={e => setNewMapTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
            placeholder="Nouvelle mind map vide…"
            style={{ flex: 1, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, color: textMain, outline: "none" }}
          />
          <button onClick={handleCreate} disabled={creating || !newMapTitle.trim()}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 14px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "transparent", color: textSub, cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: creating || !newMapTitle.trim() ? 0.5 : 1 }}
          >
            <Plus size={14} />Créer
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: "0 28px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <Loader2 size={24} color={GOLD} className="animate-spin" />
          </div>
        ) : maps.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 80, color: textSub }}>
            <Map size={40} color={`${GOLD}40`} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: textMain, marginBottom: 6 }}>Aucune mind map</div>
            <div style={{ fontSize: 13 }}>Crée une carte vide ou génère-en une par IA</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {maps.map(map => (
              <motion.div key={map.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}
                onClick={() => onSelect(map.id, map.title)}
                style={{ background: cardBg, borderRadius: 14, padding: 18, border: `1px solid ${borderColor}`, cursor: "pointer", backdropFilter: "blur(10px)", position: "relative" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ padding: 8, borderRadius: 10, background: `${GOLD}18`, border: `1px solid ${GOLD}33` }}>
                    <GitBranch size={15} color={GOLD} />
                  </div>
                  <button onClick={e => handleDelete(map.id, e)} disabled={deletingId === map.id}
                    style={{ background: "none", border: "none", cursor: "pointer", color: textSub, opacity: 0.5, padding: 4, borderRadius: 6 }}
                  >
                    {deletingId === map.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: textMain, marginBottom: 4, lineHeight: 1.3 }}>{map.title}</div>
                {map.description && <div style={{ fontSize: 12, color: textSub, marginBottom: 8, lineHeight: 1.4 }}>{map.description.slice(0, 80)}{map.description.length > 80 ? "…" : ""}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  {typeof map.node_count === "number" && (
                    <span style={{ fontSize: 11, color: textSub, display: "flex", alignItems: "center", gap: 4 }}>
                      <PlusCircle size={10} />{map.node_count} nœud{map.node_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: textSub, display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                    <Clock size={10} />{new Date(map.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderRadius: "0 0 14px 14px", background: `linear-gradient(90deg, ${GOLD}44, ${GOLD}88)` }} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function MindMapPage() {
  const [activeMap, setActiveMap] = useState<{ id: string; title: string } | null>(null);
  return activeMap
    ? <MindMapCanvas mapId={activeMap.id} mapTitle={activeMap.title} onBack={() => setActiveMap(null)} />
    : <MindMapListView onSelect={(id, title) => setActiveMap({ id, title })} />;
}
