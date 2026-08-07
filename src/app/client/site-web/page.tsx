"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, Globe, Eye, CheckCircle2,
  AlertCircle, Loader2, Settings2,
} from "lucide-react";
import { TEMPLATES, COLOR_PRESETS, emptySections, toSlug } from "@/lib/site-builder";
import type { TemplateId, SiteSections } from "@/lib/site-builder";

/* ── Shared styles ──────────────────────────────── */
const inp  = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 text-sm";
const lbl  = "block text-xs text-white/50 mb-1.5 font-medium";

/* ════════════════════════════════════════════════════
   SECTION CARD
════════════════════════════════════════════════════ */
function SectionCard({
  label, enabled, onToggle, children,
}: { label: string; enabled: boolean; onToggle: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      enabled ? "border-white/15 bg-white/[.03]" : "border-white/5 opacity-50"
    }`}>
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-left flex-1">
          <span className="font-semibold text-sm">{label}</span>
          <span className="text-white/30 text-xs">{open ? "▲" : "▼"}</span>
        </button>
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input type="checkbox" checked={enabled} onChange={onToggle} className="sr-only peer" />
          <div className="w-10 h-5 bg-white/10 peer-checked:bg-violet-500 rounded-full transition-all
            after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full
            after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
        </label>
      </div>
      {open && enabled && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4">{children}</div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════ */
export default function SiteWebPage() {
  const searchParams = useSearchParams();
  const [step,        setStep]       = useState<1|2|3>(1);
  const [template,    setTemplate]   = useState<TemplateId>("commerce");
  const [form,        setForm]       = useState({
    businessName: "", sector: "", description: "",
    email: "", phone: "", city: "", whatsapp: "", primaryColor: "#2563EB",
  });
  const [sections,    setSections]   = useState<SiteSections>(emptySections());
  const [slug,        setSlug]       = useState("");
  const [siteId,      setSiteId]     = useState<string|null>(null);
  const [generating,  setGenerating] = useState(false);
  const [saving,      setSaving]     = useState(false);
  const [publishing,  setPublishing] = useState(false);
  const [published,   setPublished]  = useState(false);
  const [error,       setError]      = useState<string|null>(null);
  const [editLoading, setEditLoading] = useState(false);

  /* ── Load existing site if ?id= param present ── */
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    setEditLoading(true);
    fetch(`/api/site-builder/get?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const cfg = data.config;
        setTemplate(cfg.template ?? "commerce");
        setForm({
          businessName: cfg.businessName ?? "",
          sector:       cfg.sector ?? "",
          description:  cfg.description ?? "",
          email:        cfg.email ?? "",
          phone:        cfg.phone ?? "",
          city:         cfg.city ?? "",
          whatsapp:     cfg.whatsapp ?? "",
          primaryColor: cfg.primaryColor ?? "#2563EB",
        });
        setSections(cfg.sections ?? emptySections());
        setSlug(data.slug ?? "");
        setSiteId(data.id);
        setStep(2);
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setEditLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── helpers ──────────────────────────────────── */
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const pickTemplate = (id: TemplateId) => {
    setTemplate(id);
    const t = TEMPLATES[id];
    setForm(f => ({ ...f, sector: t.sector, primaryColor: t.color }));
  };

  const toggleSec = (k: keyof SiteSections) =>
    setSections(p => ({ ...p, [k]: { ...p[k], enabled: !p[k].enabled } }));

  const updSec = (k: keyof SiteSections, field: string, val: unknown) =>
    setSections(p => ({ ...p, [k]: { ...p[k], [field]: val } }));

  const updService = (i: number, field: string, val: string) =>
    setSections(p => ({
      ...p, services: {
        ...p.services,
        items: p.services.items.map((it, j) => j === i ? { ...it, [field]: val } : it),
      },
    }));

  const updTesti = (i: number, field: string, val: string) =>
    setSections(p => ({
      ...p, testimonials: {
        ...p.testimonials,
        items: p.testimonials.items.map((it, j) => j === i ? { ...it, [field]: val } : it),
      },
    }));

  const updFaq = (i: number, field: string, val: string) =>
    setSections(p => ({
      ...p, faq: {
        ...p.faq,
        items: p.faq.items.map((it, j) => j === i ? { ...it, [field]: val } : it),
      },
    }));

  /* ── API calls ────────────────────────────────── */
  const handleGenerate = async () => {
    if (!form.businessName || !form.description) { setError("Nom et description requis."); return; }
    setError(null); setGenerating(true); setStep(2);
    setSlug(toSlug(form.businessName));
    try {
      const res  = await fetch("/api/site-builder/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSections(data.sections);
    } catch (e) { setError((e as Error).message); } finally { setGenerating(false); }
  };

  const handleSaveDraft = async () => {
    setSaving(true); setError(null);
    try {
      const config = { template, ...form, sections };
      const res  = await fetch("/api/site-builder/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, slug, siteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSiteId(data.id); setSlug(data.slug); setStep(3);
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const handlePublish = async () => {
    setPublishing(true); setError(null);
    try {
      const config = { template, ...form, sections };
      const res  = await fetch("/api/site-builder/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, slug, siteId, publish: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSiteId(data.id); setSlug(data.slug); setPublished(true);
    } catch (e) { setError((e as Error).message); } finally { setPublishing(false); }
  };

  /* ── Render ───────────────────────────────────── */
  const isEdit  = !!searchParams.get("id");
  const STEPS   = ["Votre entreprise", "Personnalisation", "Publication"];

  if (editLoading) return (
    <div className="min-h-screen bg-[#070711] flex items-center justify-center gap-3 text-white">
      <Loader2 size={24} className="animate-spin text-violet-400" />
      <span className="text-white/60">Chargement du site…</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070711] text-white">

      {/* Header + progress */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Globe size={20} className="text-violet-400"/>
                {isEdit ? "Modifier le site" : "Créateur de site"}
              </h1>
              <p className="text-sm text-white/40">{STEPS[step - 1]}</p>
            </div>
            <div className="flex items-center gap-3">
              {isEdit && (
                <a href="/client/mes-sites"
                  className="text-xs text-white/40 hover:text-white transition-colors">
                  ← Mes sites
                </a>
              )}
              <span className="text-sm text-white/30">{step} / 3</span>
            </div>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
              animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: .4 }} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">

          {/* ═══════════════ STEP 1 ═══════════════ */}
          {step === 1 && (
            <motion.div key="s1" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>

              <h2 className="text-lg font-semibold mb-4">Choisissez votre secteur</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {(Object.entries(TEMPLATES) as [TemplateId, (typeof TEMPLATES)[TemplateId]][]).map(([id, t]) => (
                  <button key={id} onClick={() => pickTemplate(id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      template === id ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[.03] hover:border-white/20"
                    }`}
                  >
                    <div className="text-2xl mb-2">{t.emoji}</div>
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-[11px] text-white/40 mt-0.5 leading-tight">{t.desc}</div>
                    {template === id && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: t.color }} />
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-white/[.04] border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
                <h2 className="text-lg font-semibold">Informations de votre entreprise</h2>

                <div className="sm:col-span-2">
                  <label className={lbl}>Nom de l&apos;entreprise *</label>
                  <input className={inp} placeholder="Ex : Plomberie Dupont, Studio Léa…"
                    value={form.businessName} onChange={e => upd("businessName", e.target.value)} />
                </div>

                <div>
                  <label className={lbl}>
                    Décrivez votre activité * <span className="text-white/30">(l&apos;IA rédige votre site à partir de ça)</span>
                  </label>
                  <textarea className={`${inp} min-h-[100px] resize-none`}
                    placeholder="Ex : Je suis plombier depuis 15 ans à Lyon. J'interviens pour urgences, installations et rénovations de salle de bain…"
                    value={form.description} onChange={e => upd("description", e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Email</label>
                    <input className={inp} type="email" placeholder="contact@entreprise.fr"
                      value={form.email} onChange={e => upd("email", e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Téléphone</label>
                    <input className={inp} placeholder="+33 6 12 34 56 78"
                      value={form.phone} onChange={e => upd("phone", e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>WhatsApp <span className="text-white/30">(active un bouton flottant)</span></label>
                    <input className={inp} placeholder="+33 6 12 34 56 78"
                      value={form.whatsapp} onChange={e => upd("whatsapp", e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Ville</label>
                    <input className={inp} placeholder="Paris, Lyon…"
                      value={form.city} onChange={e => upd("city", e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Couleur principale</label>
                  <div className="flex gap-2 items-center flex-wrap">
                    {(COLOR_PRESETS[template] ?? COLOR_PRESETS.commerce).map(c => (
                      <button key={c} onClick={() => upd("primaryColor", c)}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ background: c, borderColor: form.primaryColor === c ? "#fff" : "transparent" }} />
                    ))}
                    <input type="color" value={form.primaryColor} onChange={e => upd("primaryColor", e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0 p-0" title="Couleur personnalisée" />
                  </div>
                </div>
              </div>

              {error && <ErrorBar msg={error} />}

              <button onClick={handleGenerate}
                disabled={!form.businessName || !form.description}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg
                  disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.primaryColor}88)` }}
              >
                <Sparkles size={20}/> Générer mon site avec l&apos;IA <ArrowRight size={20}/>
              </button>
            </motion.div>
          )}

          {/* ═══════════════ STEP 2 ═══════════════ */}
          {step === 2 && (
            <motion.div key="s2" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
              {generating ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="w-20 h-20 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
                  <div className="text-center">
                    <p className="text-xl font-semibold mb-2">L&apos;IA crée votre site…</p>
                    <p className="text-white/40 text-sm">Rédaction des textes, prestations, FAQ…</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Personnalisez vos sections</h2>
                    <button onClick={() => { setStep(1); setError(null); }}
                      className="text-sm text-white/40 hover:text-white transition-colors">← Recommencer</button>
                  </div>
                  {error && <ErrorBar msg={error} />}

                  <div className="space-y-3">
                    {/* Hero */}
                    <SectionCard label="Hero" enabled={sections.hero.enabled} onToggle={() => toggleSec("hero")}>
                      <div className="space-y-3">
                        <div><label className={lbl}>Titre</label>
                          <input className={inp} value={sections.hero.title} onChange={e => updSec("hero","title",e.target.value)}/></div>
                        <div><label className={lbl}>Sous-titre</label>
                          <input className={inp} value={sections.hero.subtitle} onChange={e => updSec("hero","subtitle",e.target.value)}/></div>
                        <div><label className={lbl}>Texte du bouton</label>
                          <input className={inp} value={sections.hero.cta} onChange={e => updSec("hero","cta",e.target.value)}/></div>
                      </div>
                    </SectionCard>

                    {/* Services */}
                    <SectionCard label="Prestations" enabled={sections.services.enabled} onToggle={() => toggleSec("services")}>
                      <div className="space-y-3">
                        <div><label className={lbl}>Titre de section</label>
                          <input className={inp} value={sections.services.title} onChange={e => updSec("services","title",e.target.value)}/></div>
                        {sections.services.items.map((it, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-white/40 font-medium">Prestation {i+1}</span>
                              <button onClick={() => setSections(p => ({...p,services:{...p.services,items:p.services.items.filter((_,j)=>j!==i)}}))}
                                className="text-red-400/60 hover:text-red-400 text-xs">Supprimer</button>
                            </div>
                            <input className={inp} placeholder="Nom" value={it.name} onChange={e => updService(i,"name",e.target.value)}/>
                            <input className={inp} placeholder="Description" value={it.desc} onChange={e => updService(i,"desc",e.target.value)}/>
                            <input className={inp} placeholder="Tarif (optionnel)" value={it.price||""} onChange={e => updService(i,"price",e.target.value)}/>
                          </div>
                        ))}
                        <button onClick={() => setSections(p=>({...p,services:{...p.services,items:[...p.services.items,{name:"",desc:"",price:""}]}}))}
                          className="w-full py-2 text-sm text-white/50 hover:text-white border border-dashed border-white/20 hover:border-white/40 rounded-xl transition-all">
                          + Ajouter une prestation
                        </button>
                      </div>
                    </SectionCard>

                    {/* About */}
                    <SectionCard label="À propos" enabled={sections.about.enabled} onToggle={() => toggleSec("about")}>
                      <div className="space-y-3">
                        <div><label className={lbl}>Titre</label>
                          <input className={inp} value={sections.about.title} onChange={e => updSec("about","title",e.target.value)}/></div>
                        <div><label className={lbl}>Texte de présentation</label>
                          <textarea className={`${inp} min-h-[120px] resize-none`} value={sections.about.content} onChange={e => updSec("about","content",e.target.value)}/></div>
                      </div>
                    </SectionCard>

                    {/* Testimonials */}
                    <SectionCard label="Témoignages" enabled={sections.testimonials.enabled} onToggle={() => toggleSec("testimonials")}>
                      <div className="space-y-2">
                        {sections.testimonials.items.map((t, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                            <input className={inp} placeholder="Nom" value={t.name} onChange={e => updTesti(i,"name",e.target.value)}/>
                            <textarea className={`${inp} resize-none`} rows={2} value={t.text} onChange={e => updTesti(i,"text",e.target.value)}/>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    {/* FAQ */}
                    <SectionCard label="FAQ" enabled={sections.faq.enabled} onToggle={() => toggleSec("faq")}>
                      <div className="space-y-3">
                        {sections.faq.items.map((f, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                            <span className="text-xs text-white/40 font-medium">Question {i+1}</span>
                            <input className={inp} placeholder="Question ?" value={f.q} onChange={e => updFaq(i,"q",e.target.value)}/>
                            <textarea className={`${inp} resize-none`} rows={2} placeholder="Réponse…" value={f.a} onChange={e => updFaq(i,"a",e.target.value)}/>
                          </div>
                        ))}
                        <button onClick={() => setSections(p=>({...p,faq:{...p.faq,items:[...p.faq.items,{q:"",a:""}]}}))}
                          className="w-full py-2 text-sm text-white/50 hover:text-white border border-dashed border-white/20 hover:border-white/40 rounded-xl transition-all">
                          + Ajouter une question
                        </button>
                      </div>
                    </SectionCard>

                    {/* Contact */}
                    <SectionCard label="Contact" enabled={sections.contact.enabled} onToggle={() => toggleSec("contact")}>
                      <p className="text-sm text-white/50">Affiche email, téléphone, ville et un formulaire de contact.</p>
                    </SectionCard>
                  </div>

                  <button onClick={handleSaveDraft} disabled={saving}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg
                      bg-gradient-to-r from-violet-500 to-blue-500 hover:opacity-90 disabled:opacity-40 mt-6 transition-all"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin"/> : <Eye size={20}/>}
                    {saving ? "Sauvegarde…" : "Aperçu & Publication →"}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ═══════════════ STEP 3 ═══════════════ */}
          {step === 3 && (
            <motion.div key="s3" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
              {published ? (
                <div className="text-center py-16">
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:200}}>
                    <CheckCircle2 size={72} className="mx-auto text-green-400 mb-6"/>
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-3">Votre site est en ligne !</h2>
                  <p className="text-white/50 mb-6">Accessible à l&apos;adresse :</p>
                  <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/30
                      text-green-400 font-mono font-semibold text-lg px-6 py-4 rounded-2xl mb-8 hover:bg-green-400/20 transition-all">
                    <Globe size={18}/> djama.pro/s/{slug}
                  </a>
                  <div className="flex gap-3 justify-center">
                    <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all">
                      <Eye size={18}/> Voir mon site
                    </a>
                    <button onClick={() => { setStep(1); setPublished(false); setSiteId(null); setSections(emptySections()); setForm({businessName:"",sector:"",description:"",email:"",phone:"",city:"",whatsapp:"",primaryColor:"#2563EB"}); }}
                      className="flex items-center gap-2 px-6 py-3 bg-violet-500/20 hover:bg-violet-500/30 rounded-xl font-semibold text-violet-300 transition-all">
                      <Settings2 size={18}/> Créer un autre site
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Votre site est prêt</h2>
                    <button onClick={() => setStep(2)} className="text-sm text-white/40 hover:text-white transition-colors">← Modifier</button>
                  </div>

                  {/* URL */}
                  <div className="bg-white/[.04] border border-white/10 rounded-2xl p-6 mb-6">
                    <label className={lbl}>URL de votre site</label>
                    <div className="flex gap-2 items-center">
                      <span className="text-white/30 text-sm whitespace-nowrap">djama.pro/s/</span>
                      <input className={`${inp} flex-1`} value={slug}
                        onChange={e => setSlug(toSlug(e.target.value))} placeholder="mon-entreprise"/>
                    </div>
                    <p className="text-xs text-white/30 mt-2">Lettres minuscules, chiffres et tirets uniquement.</p>
                  </div>

                  {/* Preview iframe */}
                  <div className="bg-white/[.04] border border-white/10 rounded-2xl overflow-hidden mb-6">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                      <div className="flex gap-1.5">
                        {["bg-red-500","bg-yellow-500","bg-green-500"].map(c=>(
                          <div key={c} className={`w-3 h-3 rounded-full ${c}`}/>
                        ))}
                      </div>
                      <span className="text-xs text-white/30 flex-1 text-center font-mono">djama.pro/s/{slug}</span>
                    </div>
                    <iframe src={`/s/${slug}`} className="w-full border-0" style={{height:480}} title="Aperçu"/>
                  </div>

                  {error && <ErrorBar msg={error} />}

                  <div className="flex gap-3">
                    <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-semibold transition-all whitespace-nowrap">
                      <Eye size={18}/> Plein écran
                    </a>
                    <button onClick={handlePublish} disabled={publishing}
                      className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg
                        bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 disabled:opacity-40 transition-all">
                      {publishing ? <Loader2 size={20} className="animate-spin"/> : <Globe size={20}/>}
                      {publishing ? "Publication…" : "🚀 Publier mon site"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ErrorBar({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
      <AlertCircle size={16}/> {msg}
    </div>
  );
}
