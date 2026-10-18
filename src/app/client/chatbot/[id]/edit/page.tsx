"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Sparkles, MessageSquare,
  Globe, Palette, Settings, Code2, Eye,
  Play, PauseCircle, Copy, Check, BookOpen, Plug, ShieldCheck, Download,
} from "lucide-react";
import type { Chatbot, WidgetConfig } from "@/lib/chatbot/types";
import type { BusinessHours } from "@/lib/chatbot/schedule";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/chatbot/schedule";
import {
  PERSONALITY_LABELS, PERSONALITY_DESCRIPTIONS,
  LANGUAGE_LABELS, CHATBOT_MODELS,
} from "@/lib/chatbot/defaults";
import { INTEGRATION_META, type IntegrationType } from "@/lib/chatbot/tools";

type Tab = "general" | "behavior" | "widget" | "integration" | "test" | "integrations" | "advanced";

interface FormState {
  name:             string;
  description:      string;
  language:         string;
  personality:      string;
  instructions:     string;
  welcome_message:  string;
  fallback_message: string;
  model:            string;
  max_tokens:       number;
  allowed_domains:  string;
  widget_config:    Partial<WidgetConfig>;
  webhook_url:      string;
  webhook_events:   string[];
  business_hours:   BusinessHours;
}

export default function ChatbotEditPage() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const [bot,        setBot]       = useState<Chatbot | null>(null);
  const [tab,        setTab]       = useState<Tab>("general");
  const [form,       setForm]      = useState<FormState | null>(null);
  const [saving,     setSaving]    = useState(false);
  const [saved,      setSaved]     = useState(false);
  const [aiLoading,  setAiLoading] = useState(false);
  const [testInput,  setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [copied,     setCopied]    = useState(false);
  const [integrations, setIntegrations] = useState<{ type: IntegrationType; label: string; description: string; enabled: boolean }[]>([]);
  const [integToggling, setIntegToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/chatbot/${id}/integrations`)
      .then(r => r.json())
      .then((d: { integrations?: { type: IntegrationType; label: string; description: string; enabled: boolean }[] }) => {
        setIntegrations(d.integrations ?? []);
      });
  }, [id]);

  useEffect(() => {
    fetch(`/api/chatbot/${id}`)
      .then(r => r.json())
      .then((d: { chatbot?: Chatbot }) => {
        if (!d.chatbot) return;
        setBot(d.chatbot);
        setForm({
          name:             d.chatbot.name,
          description:      d.chatbot.description ?? "",
          language:         d.chatbot.language,
          personality:      d.chatbot.personality,
          instructions:     d.chatbot.instructions,
          welcome_message:  d.chatbot.welcome_message,
          fallback_message: d.chatbot.fallback_message,
          model:            d.chatbot.model,
          max_tokens:       d.chatbot.max_tokens,
          allowed_domains:  d.chatbot.allowed_domains?.join(", ") ?? "",
          widget_config:    d.chatbot.widget_config ?? {},
          webhook_url:      d.chatbot.webhook_url ?? "",
          webhook_events:   d.chatbot.webhook_events ?? ["new_message"],
          business_hours:   (d.chatbot.business_hours as BusinessHours | null) ?? { ...DEFAULT_BUSINESS_HOURS },
        });
        setTestHistory([
          { role: "assistant", content: d.chatbot.welcome_message },
        ]);
      });
  }, [id]);

  const setWc = (patch: Partial<WidgetConfig>) =>
    setForm(f => f ? { ...f, widget_config: { ...f.widget_config, ...patch } } : f);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const domains = form.allowed_domains
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    await fetch(`/api/chatbot/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        ...form,
        allowed_domains: domains,
        webhook_url:     form.webhook_url || null,
        webhook_events:  form.webhook_events,
        business_hours:  form.business_hours,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleStatus = async () => {
    if (!bot) return;
    const next = bot.status === "active" ? "disabled" : "active";
    await fetch(`/api/chatbot/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next }),
    });
    setBot(b => b ? { ...b, status: next as Chatbot["status"] } : b);
  };

  const improveInstructions = async () => {
    if (!form) return;
    setAiLoading(true);
    const res = await fetch(`/api/chatbot/${id}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        message: `Améliore et enrichis ces instructions pour un chatbot (${form.personality}, ${form.language}) :\n\n${form.instructions}\n\nRetourne uniquement les instructions améliorées, sans commentaire.`,
        history: [],
      }),
    });
    if (!res.body) { setAiLoading(false); return; }
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   result  = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6)) as { text?: string };
          if (data.text) result += data.text;
        } catch { /* skip */ }
      }
    }
    if (result.trim()) setForm(f => f ? { ...f, instructions: result.trim() } : f);
    setAiLoading(false);
  };

  const sendTest = async () => {
    if (!testInput.trim() || testLoading) return;
    const msg = testInput;
    setTestInput("");
    setTestHistory(h => [...h, { role: "user", content: msg }]);
    setTestLoading(true);

    const res = await fetch(`/api/chatbot/${id}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: msg, history: testHistory }),
    });
    if (!res.body) { setTestLoading(false); return; }
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   assistant = "";
    setTestHistory(h => [...h, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6)) as { text?: string };
          if (data.text) {
            assistant += data.text;
            setTestHistory(h => [...h.slice(0, -1), { role: "assistant", content: assistant }]);
          }
        } catch { /* skip */ }
      }
    }
    setTestLoading(false);
  };

  const copyEmbed = () => {
    if (!bot) return;
    const script = `<script src="${window.location.origin}/widget.js" data-chatbot="${bot.public_id}" defer><\/script>`;
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!form || !bot) {
    return <div className="p-6 text-gray-500 text-sm">Chargement…</div>;
  }

  const wc     = form.widget_config;
  const accent = wc.theme_color ?? "#7c3aed";

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "general",     label: "Général",      icon: <Settings className="w-4 h-4" /> },
    { key: "behavior",    label: "Comportement",  icon: <Sparkles className="w-4 h-4" /> },
    { key: "widget",      label: "Apparence",     icon: <Palette className="w-4 h-4" /> },
    { key: "integration", label: "Intégration",   icon: <Code2 className="w-4 h-4" /> },
    { key: "test",          label: "Test",           icon: <MessageSquare className="w-4 h-4" /> },
    { key: "integrations",  label: "Intégrations",   icon: <Plug className="w-4 h-4" /> },
    { key: "advanced",      label: "Avancé",         icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const goToKnowledge = () => router.push(`/client/chatbot/${id}/knowledge`);

  const toggleIntegration = async (type: IntegrationType, enabled: boolean) => {
    setIntegToggling(type);
    await fetch(`/api/chatbot/${id}/integrations`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ type, enabled }),
    });
    setIntegrations(prev => prev.map(i => i.type === type ? { ...i, enabled } : i));
    setIntegToggling(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b flex-shrink-0">
        <button onClick={() => router.push("/client/chatbot")} className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-gray-900 flex-1 truncate">{form.name}</h1>
        <button
          onClick={() => void toggleStatus()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            bot.status === "active"
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          {bot.status === "active"
            ? <><PauseCircle className="w-3.5 h-3.5" /> Actif</>
            : <><Play className="w-3.5 h-3.5" /> Activer</>
          }
        </button>
        <button
          onClick={() => void save()}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-52 flex-shrink-0 bg-white border-r py-4 px-2 flex flex-col gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                tab === t.key
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <hr className="my-2" />
          <button
            onClick={goToKnowledge}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full text-left"
          >
            <BookOpen className="w-4 h-4" /> Base de connaissances
          </button>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* GÉNÉRAL */}
          {tab === "general" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-lg font-semibold">Informations générales</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du chatbot</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => f ? { ...f, name: e.target.value } : f)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Langue principale</label>
                <select
                  value={form.language}
                  onChange={e => setForm(f => f ? { ...f, language: e.target.value } : f)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle IA</label>
                {CHATBOT_MODELS.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="model"
                      value={m.id}
                      checked={form.model === m.id}
                      onChange={() => setForm(f => f ? { ...f, model: m.id } : f)}
                    />
                    <div>
                      <span className="font-medium text-sm">{m.label}</span>
                      {m.recommended && (
                        <span className="ml-2 text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">Recommandé</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tokens max par réponse
                  <span className="ml-2 text-gray-400 font-normal">{form.max_tokens}</span>
                </label>
                <input
                  type="range"
                  min={128}
                  max={2048}
                  step={64}
                  value={form.max_tokens}
                  onChange={e => setForm(f => f ? { ...f, max_tokens: +e.target.value } : f)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* COMPORTEMENT */}
          {tab === "behavior" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-lg font-semibold">Comportement</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personnalité</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(PERSONALITY_LABELS).map(([k, v]) => (
                    <label key={k} className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
                      form.personality === k ? "border-violet-400 bg-violet-50" : "hover:bg-gray-50"
                    }`}>
                      <input
                        type="radio"
                        name="personality"
                        value={k}
                        checked={form.personality === k}
                        onChange={() => setForm(f => f ? { ...f, personality: k } : f)}
                        className="hidden"
                      />
                      <span className="font-medium text-sm">{v}</span>
                      <span className="text-xs text-gray-400 mt-0.5">
                        {PERSONALITY_DESCRIPTIONS[k]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Instructions</label>
                  <button
                    onClick={() => void improveInstructions()}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiLoading ? "Amélioration…" : "Améliorer avec l'IA"}
                  </button>
                </div>
                <textarea
                  value={form.instructions}
                  onChange={e => setForm(f => f ? { ...f, instructions: e.target.value } : f)}
                  rows={8}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message d&apos;accueil</label>
                <textarea
                  value={form.welcome_message}
                  onChange={e => setForm(f => f ? { ...f, welcome_message: e.target.value } : f)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message de fallback</label>
                <textarea
                  value={form.fallback_message}
                  onChange={e => setForm(f => f ? { ...f, fallback_message: e.target.value } : f)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
            </div>
          )}

          {/* WIDGET / APPARENCE */}
          {tab === "widget" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-lg font-semibold">Apparence du widget</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                  <input
                    type="color"
                    value={wc.theme_color ?? "#7c3aed"}
                    onChange={e => setWc({ theme_color: e.target.value })}
                    className="w-full h-10 rounded-lg border cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur fond</label>
                  <input
                    type="color"
                    value={wc.background_color ?? "#ffffff"}
                    onChange={e => setWc({ background_color: e.target.value })}
                    className="w-full h-10 rounded-lg border cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom affiché du bot</label>
                <input
                  value={wc.bot_display_name ?? ""}
                  onChange={e => setWc({ bot_display_name: e.target.value })}
                  placeholder={form.name}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  value={wc.position ?? "bottom-right"}
                  onChange={e => setWc({ position: e.target.value as WidgetConfig["position"] })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {(["bottom-right", "bottom-left", "top-right", "top-left"] as const).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coins arrondis</label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg", "full"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setWc({ border_radius: r })}
                      className={`flex-1 py-1.5 text-xs border rounded-lg font-medium transition-colors ${
                        wc.border_radius === r
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Questions suggérées <span className="text-gray-400 font-normal">(une par ligne)</span>
                </label>
                <textarea
                  value={(wc.suggested_questions ?? []).join("\n")}
                  onChange={e => setWc({ suggested_questions: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
                  rows={4}
                  placeholder="Comment vous contacter ?&#10;Quels sont vos horaires ?&#10;Quels services proposez-vous ?"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Indicateur de frappe</label>
                <input
                  type="checkbox"
                  checked={wc.show_typing_indicator ?? true}
                  onChange={e => setWc({ show_typing_indicator: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
            </div>
          )}

          {/* INTÉGRATION */}
          {tab === "integration" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-lg font-semibold">Intégration widget</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                <p className="font-medium mb-1">Votre ID public : <code className="font-mono">{bot.public_id}</code></p>
                <p className="text-xs">Cet identifiant est sûr à exposer publiquement. Il ne révèle pas votre clé API.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domaines autorisés <span className="text-gray-400 font-normal">(séparés par des virgules)</span>
                </label>
                <input
                  value={form.allowed_domains}
                  onChange={e => setForm(f => f ? { ...f, allowed_domains: e.target.value } : f)}
                  placeholder="monsite.com, app.monsite.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <p className="text-xs text-gray-400 mt-1">Laissez vide pour autoriser tous les domaines (déconseillé en production).</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Code d&apos;intégration</label>
                  <button
                    onClick={copyEmbed}
                    className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copié !</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                  {`<script src="${typeof window !== "undefined" ? window.location.origin : "https://app.djama.fr"}/widget.js"\n  data-chatbot="${bot.public_id}"\n  defer>\n</script>`}
                </pre>
                <p className="text-xs text-gray-400 mt-2">
                  Collez ce code avant la balise <code>&lt;/body&gt;</code> de votre site.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL iframe (test)</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/widget/${bot.public_id}`}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono text-xs"
                  />
                  <a
                    href={`/widget/${bot.public_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" /> Voir
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TEST */}
          {tab === "test" && (
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold mb-4">Tester le chatbot</h2>
              <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                {/* Fausse barre header */}
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: accent }}>
                  <span className="text-white text-sm font-semibold">
                    {wc.bot_display_name || form.name}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-xs opacity-80 text-white">
                    <Globe className="w-3 h-3" /> Test local
                  </span>
                </div>

                <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3">
                  {testHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "text-white"
                          : "bg-gray-100 text-gray-900"
                      }`} style={m.role === "user" ? { background: accent } : {}}>
                        {m.content || (testLoading && m.role === "assistant" ? "…" : "")}
                      </div>
                    </div>
                  ))}
                  {testLoading && testHistory[testHistory.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-3 py-2 rounded-xl text-gray-400 text-sm">…</div>
                    </div>
                  )}
                </div>

                <div className="border-t px-3 py-2 flex gap-2">
                  <input
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendTest(); } }}
                    placeholder="Entrez un message de test…"
                    disabled={testLoading}
                    className="flex-1 text-sm px-2 py-1.5 outline-none"
                  />
                  <button
                    onClick={() => void sendTest()}
                    disabled={testLoading || !testInput.trim()}
                    className="px-3 py-1.5 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: accent }}
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INTÉGRATIONS */}
          {tab === "integrations" && (
            <div className="max-w-2xl space-y-4">
              <h2 className="text-lg font-semibold">Intégrations DJAMA</h2>
              <p className="text-sm text-gray-500">
                Connectez le chatbot à vos modules DJAMA pour qu&apos;il puisse répondre avec vos vraies données.
              </p>
              {integrations.map(integ => (
                <div key={integ.type} className="border rounded-xl p-4 bg-white flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{integ.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{integ.description}</p>
                  </div>
                  <button
                    onClick={() => void toggleIntegration(integ.type, !integ.enabled)}
                    disabled={integToggling === integ.type}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      integ.enabled ? "bg-violet-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={integ.enabled}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${
                      integ.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
              {integrations.length === 0 && (
                <p className="text-gray-400 text-sm">Chargement…</p>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                Les intégrations CRM, Boutique et Factures sont en <strong>lecture seule</strong>. Seule l&apos;intégration RDV peut créer des données (avec l&apos;accord explicite du visiteur).
              </div>
            </div>
          )}
          {/* AVANCÉ */}
          {tab === "advanced" && (
            <div className="max-w-2xl space-y-8">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-violet-600" /> Paramètres avancés
              </h2>

              {/* Webhooks */}
              <section className="border rounded-xl p-5 bg-white space-y-4">
                <h3 className="font-semibold text-sm text-gray-900">Webhook sortant</h3>
                <p className="text-xs text-gray-500">
                  DJAMA envoie une requête POST à cette URL à chaque événement sélectionné.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">URL du webhook</label>
                  <input
                    type="url"
                    value={form.webhook_url}
                    onChange={e => setForm(f => f ? { ...f, webhook_url: e.target.value } : f)}
                    placeholder="https://votre-serveur.com/webhook"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Événements déclencheurs</label>
                  <div className="space-y-2">
                    {[
                      { value: "new_conversation", label: "Nouvelle conversation" },
                      { value: "new_message",      label: "Nouveau message IA" },
                      { value: "escalation",       label: "Escalade vers agent" },
                      { value: "conversation_closed", label: "Conversation fermée" },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.webhook_events.includes(value)}
                          onChange={e => {
                            const events = e.target.checked
                              ? [...form.webhook_events, value]
                              : form.webhook_events.filter(ev => ev !== value);
                            setForm(f => f ? { ...f, webhook_events: events } : f);
                          }}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-400"
                        />
                        <span className="text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              {/* Horaires d'ouverture */}
              <section className="border rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Horaires d&apos;ouverture</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      En dehors de ces horaires, le chatbot répond avec le message d&apos;absence.
                    </p>
                  </div>
                  <button
                    onClick={() => setForm(f => f ? { ...f, business_hours: { ...f.business_hours, enabled: !f.business_hours.enabled } } : f)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${form.business_hours.enabled ? "bg-violet-600" : "bg-gray-200"}`}
                    role="switch" aria-checked={form.business_hours.enabled}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${form.business_hours.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {form.business_hours.enabled && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Jours actifs</label>
                      <div className="flex gap-2 flex-wrap">
                        {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day, i) => (
                          <button key={i}
                            onClick={() => {
                              const days = form.business_hours.days.includes(i)
                                ? form.business_hours.days.filter(d => d !== i)
                                : [...form.business_hours.days, i];
                              setForm(f => f ? { ...f, business_hours: { ...f.business_hours, days } } : f);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              form.business_hours.days.includes(i)
                                ? "bg-violet-600 text-white border-violet-600"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Heure d&apos;ouverture</label>
                        <select
                          value={form.business_hours.start_hour}
                          onChange={e => setForm(f => f ? { ...f, business_hours: { ...f.business_hours, start_hour: +e.target.value } } : f)}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Heure de fermeture</label>
                        <select
                          value={form.business_hours.end_hour}
                          onChange={e => setForm(f => f ? { ...f, business_hours: { ...f.business_hours, end_hour: +e.target.value } } : f)}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                        >
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fuseau horaire</label>
                      <select
                        value={form.business_hours.timezone}
                        onChange={e => setForm(f => f ? { ...f, business_hours: { ...f.business_hours, timezone: e.target.value } } : f)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      >
                        {["Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "UTC"].map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Message d&apos;absence</label>
                      <textarea
                        value={form.business_hours.away_message}
                        onChange={e => setForm(f => f ? { ...f, business_hours: { ...f.business_hours, away_message: e.target.value } } : f)}
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  </>
                )}
              </section>

              {/* Export RGPD */}
              <section className="border rounded-xl p-5 bg-white space-y-3">
                <h3 className="font-semibold text-sm text-gray-900">Export & RGPD</h3>
                <p className="text-xs text-gray-500">
                  Exportez toutes les conversations et messages de ce chatbot en JSON (conforme RGPD).
                </p>
                <a
                  href={`/api/chatbot/${id}/export`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <Download className="w-4 h-4" /> Exporter les données (JSON)
                </a>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
