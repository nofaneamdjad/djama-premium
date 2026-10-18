"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, RefreshCw, BookOpen,
  FileText, Link, HelpCircle, CheckCircle,
  AlertCircle, Clock, Loader2,
} from "lucide-react";

type DocType   = "text" | "faq" | "url";
type DocStatus = "pending" | "processing" | "ready" | "error";

interface KnowledgeDoc {
  id:            string;
  type:          DocType;
  title:         string;
  status:        DocStatus;
  chunk_count:   number;
  error_message: string | null;
  created_at:    string;
  url:           string | null;
}

interface FaqItem { q: string; a: string }

const TYPE_ICONS: Record<DocType, React.ReactNode> = {
  text: <FileText className="w-4 h-4" />,
  faq:  <HelpCircle className="w-4 h-4" />,
  url:  <Link className="w-4 h-4" />,
};

const TYPE_LABELS: Record<DocType, string> = {
  text: "Texte libre",
  faq:  "FAQ (Q&R)",
  url:  "Page web",
};

const STATUS_INFO: Record<DocStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending:    { icon: <Clock className="w-3.5 h-3.5" />,    color: "#6b7280", label: "En attente" },
  processing: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: "#f59e0b", label: "Traitement…" },
  ready:      { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "#10b981", label: "Prêt" },
  error:      { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "#ef4444", label: "Erreur" },
};

export default function KnowledgePage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();
  const [docs,     setDocs]     = useState<KnowledgeDoc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);
  const [form,     setForm]     = useState<{
    type: DocType; title: string; content: string; url: string;
    faq: FaqItem[];
  }>({
    type: "text", title: "", content: "", url: "", faq: [{ q: "", a: "" }],
  });

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/chatbot/${id}/knowledge`);
    const d = await r.json() as { documents?: KnowledgeDoc[] };
    setDocs(d.documents ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [id]);

  // Polling pour les documents en cours de traitement
  useEffect(() => {
    const processing = docs.some(d => d.status === "pending" || d.status === "processing");
    if (!processing) return;
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, [docs]);

  const submit = async () => {
    const payload: Record<string, unknown> = { type: form.type, title: form.title };
    if (form.type === "text") payload.content = form.content;
    if (form.type === "url")  payload.url     = form.url;
    if (form.type === "faq")  payload.faq     = form.faq.filter(f => f.q && f.a);

    const r = await fetch(`/api/chatbot/${id}/knowledge`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (r.ok) {
      setAdding(false);
      setForm({ type: "text", title: "", content: "", url: "", faq: [{ q: "", a: "" }] });
      void load();
    }
  };

  const remove = async (docId: string) => {
    if (!confirm("Supprimer ce document et ses vecteurs ?")) return;
    await fetch(`/api/chatbot/${id}/knowledge/${docId}`, { method: "DELETE" });
    void load();
  };

  const reembed = async (docId: string) => {
    await fetch(`/api/chatbot/${id}/knowledge/${docId}`, { method: "POST" });
    void load();
  };

  const addFaqRow = () => setForm(f => ({ ...f, faq: [...f.faq, { q: "", a: "" }] }));
  const removeFaqRow = (i: number) => setForm(f => ({ ...f, faq: f.faq.filter((_, j) => j !== i) }));
  const updateFaq = (i: number, field: "q" | "a", val: string) =>
    setForm(f => ({ ...f, faq: f.faq.map((row, j) => j === i ? { ...row, [field]: val } : row) }));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" /> Base de connaissances
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Les documents ajoutés enrichissent automatiquement les réponses du chatbot
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Bandeau info OPENAI_API_KEY */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-5">
        Requiert <code className="font-mono">OPENAI_API_KEY</code> dans votre fichier <code>.env.local</code> pour générer les embeddings vectoriels.
      </div>

      {loading && <p className="text-gray-500 text-sm">Chargement…</p>}

      {!loading && docs.length === 0 && (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed rounded-xl">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun document</p>
          <p className="text-sm mt-1">Ajoutez du texte, une FAQ ou une URL pour enrichir votre chatbot.</p>
        </div>
      )}

      <div className="space-y-3">
        {docs.map(doc => {
          const st = STATUS_INFO[doc.status];
          return (
            <div key={doc.id} className="border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 text-violet-500">{TYPE_ICONS[doc.type]}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{doc.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{TYPE_LABELS[doc.type]}</span>
                      {doc.url && <span className="truncate max-w-[180px]">{doc.url}</span>}
                      {doc.status === "ready" && (
                        <span>{doc.chunk_count} chunk{doc.chunk_count > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    {doc.error_message && (
                      <p className="text-xs text-red-500 mt-1">{doc.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${st.color}18`, color: st.color }}>
                    {st.icon} {st.label}
                  </span>
                  {(doc.status === "error" || doc.status === "ready") && (
                    <button onClick={() => void reembed(doc.id)}
                      title="Re-traiter"
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => void remove(doc.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal ajout */}
      {adding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Ajouter un document</h2>

            {/* Type */}
            <div className="flex gap-2 mb-4">
              {(["text", "faq", "url"] as DocType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border rounded-lg transition-colors ${
                    form.type === t
                      ? "bg-violet-50 border-violet-400 text-violet-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Titre */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex : Horaires d'ouverture, Politique de retour…"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            {/* Contenu selon type */}
            {form.type === "text" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={6}
                  placeholder="Collez ici le texte que le chatbot devra connaître…"
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            )}

            {form.type === "url" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de la page</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://votresite.com/a-propos"
                  type="url"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <p className="text-xs text-gray-400 mt-1">Le contenu textuel de la page sera extrait automatiquement.</p>
              </div>
            )}

            {form.type === "faq" && (
              <div className="mb-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Questions / Réponses</label>
                {form.faq.map((row, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <input
                      value={row.q}
                      onChange={e => updateFaq(i, "q", e.target.value)}
                      placeholder="Question"
                      className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                    <textarea
                      value={row.a}
                      onChange={e => updateFaq(i, "a", e.target.value)}
                      placeholder="Réponse"
                      rows={2}
                      className="w-full border rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                    {form.faq.length > 1 && (
                      <button onClick={() => removeFaqRow(i)}
                        className="text-xs text-red-400 hover:text-red-600">
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addFaqRow}
                  className="text-sm text-violet-600 hover:text-violet-800 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Ajouter une Q&R
                </button>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button
                onClick={() => void submit()}
                disabled={!form.title.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                Ajouter et traiter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
