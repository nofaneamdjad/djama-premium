"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CreditCard, TrendingUp, BookOpen, CheckCircle, Building2,
  Link as LinkIcon, ShoppingCart, Users, PenTool, Truck, Package, Layers,
  Globe, Tag, ShoppingBag, CheckSquare, Calendar, Clock, UserCog, Lock,
  Timer, ClipboardList, Edit, Target, Pen, Briefcase, Bot, Camera, Network,
  Search, GraduationCap, Share2, Mail, Newspaper, Star, MessageSquare,
  MessageCircle, Activity, Contact, Monitor, Layout, Building, X,
} from "lucide-react";

/* ── Palette ──────────────────────────────────────────────────────────────── */
const GOLD   = "#B99D5E";
const C = { bg:"#FAFAF8", surface:"#FFFFFF", text:"#202020", sub:"#707070", gold:GOLD, border:"#E8E6E1" };

/* ── 44 applications ─────────────────────────────────────────────────────── */
interface App { name: string; Icon: React.ElementType }
const APPS: App[] = [
  { name:"Factures & Devis",          Icon:FileText      },
  { name:"Dépenses",                  Icon:CreditCard    },
  { name:"Trésorerie",                Icon:TrendingUp    },
  { name:"Comptabilité",              Icon:BookOpen      },
  { name:"Déclarations",              Icon:CheckCircle   },
  { name:"Banque",                    Icon:Building2     },
  { name:"Liens de paiement",         Icon:LinkIcon      },
  { name:"Caisse / POS",              Icon:ShoppingCart  },
  { name:"CRM",                       Icon:Users         },
  { name:"Contrats",                  Icon:PenTool       },
  { name:"Fournisseurs",              Icon:Truck         },
  { name:"Stocks",                    Icon:Package       },
  { name:"Projets",                   Icon:Layers        },
  { name:"Portail Client",            Icon:Globe         },
  { name:"Marketplace",               Icon:Tag           },
  { name:"Boutique",                  Icon:ShoppingBag   },
  { name:"Tâches",                    Icon:CheckSquare   },
  { name:"Planning",                  Icon:Calendar      },
  { name:"Rendez-vous",               Icon:Clock         },
  { name:"Équipe",                    Icon:UserCog       },
  { name:"Espaces Privés",            Icon:Lock          },
  { name:"Chronomètre",               Icon:Timer         },
  { name:"Checklists",                Icon:ClipboardList },
  { name:"Bloc-notes",                Icon:Edit          },
  { name:"Planification stratégique", Icon:Target        },
  { name:"Signature électronique",    Icon:Pen           },
  { name:"Paie & RH",                 Icon:Briefcase     },
  { name:"Assistant IA",              Icon:Bot           },
  { name:"DOC IA",                    Icon:FileText      },
  { name:"Scanner",                   Icon:Camera        },
  { name:"Mind Map",                  Icon:Network       },
  { name:"Sourcing IA",               Icon:Search        },
  { name:"Coaching IA",               Icon:GraduationCap },
  { name:"Réseaux Sociaux",           Icon:Share2        },
  { name:"Email Marketing",           Icon:Mail          },
  { name:"Blog",                      Icon:Newspaper     },
  { name:"Réputation",                Icon:Star          },
  { name:"Témoignages",               Icon:MessageSquare },
  { name:"Chatbot IA",                Icon:MessageCircle },
  { name:"Analytics",                 Icon:Activity      },
  { name:"Carte de Visite",           Icon:Contact       },
  { name:"Site Web",                  Icon:Monitor       },
  { name:"Mes Sites",                 Icon:Layout        },
  { name:"Agences",                   Icon:Building      },
];

const COUNTRIES = [
  "France","Belgique","Suisse","Canada","Maroc","Sénégal","Côte d'Ivoire",
  "Cameroun","Madagascar","Comores","Île Maurice","Tunisie","Algérie",
  "Gabon","Burkina Faso","Togo","Bénin","Mali","Niger","Guinée",
  "République Démocratique du Congo","La Réunion","Mayotte","Autre",
];

const DESC  = "Nous préparons une nouvelle façon de gérer votre entreprise. Tous vos outils essentiels, réunis dans une plateforme intelligente, simple et professionnelle.";
const NOTICE = "Notre équipe travaille actuellement sur les dernières améliorations. Merci de votre patience, nous avons hâte de vous accueillir.";

const ROBOT_MESSAGES = [
  "Bonjour ! Je suis DJAMA AI.",
  "Nous préparons une nouvelle expérience pour simplifier la gestion de votre entreprise.",
  "Encore un peu de patience — DJAMA arrive bientôt !",
];

/* ── Composant bulle de dialogue ─────────────────────────────────────────── */
function SpeechBubble() {
  const [idx,     setIdx]     = useState(0);
  const [visible, setVisible] = useState(true);
  const DELAYS = [3400, 5000, 4200];

  useEffect(() => {
    const fadeOut = setTimeout(() => setVisible(false), DELAYS[idx]);
    const next    = setTimeout(() => {
      setIdx(i => (i + 1) % ROBOT_MESSAGES.length);
      setVisible(true);
    }, DELAYS[idx] + 480);
    return () => { clearTimeout(fadeOut); clearTimeout(next); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <div className={`pl-bubble${visible ? "" : " pl-bubble-hide"}`} role="status" aria-live="polite">
      <p className="pl-bubble-txt">{ROBOT_MESSAGES[idx]}</p>
      <div className="pl-bubble-arrow" aria-hidden/>
    </div>
  );
}

/* ── Robot SVG ───────────────────────────────────────────────────────────── */
function DjamaRobot() {
  return (
    <svg viewBox="0 0 100 148" xmlns="http://www.w3.org/2000/svg"
      className="pl-robot-svg" aria-hidden="true" focusable="false">
      {/* Antenna */}
      <line x1="50" y1="6" x2="50" y2="20" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="50" cy="5" r="5" fill={GOLD}/>

      {/* Head */}
      <rect x="18" y="20" width="64" height="46" rx="13" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>

      {/* Left eye group — blink via scaleY on pupil */}
      <circle cx="36" cy="44" r="8.5" fill="#F2F0EC"/>
      <g className="eye-look-l">
        <circle cx="36" cy="44" r="5" fill="#1C1916" className="eye-blink-l"/>
        <circle cx="37.8" cy="42.2" r="1.6" fill={C.surface} className="eye-blink-l"/>
      </g>

      {/* Right eye group */}
      <circle cx="64" cy="44" r="8.5" fill="#F2F0EC"/>
      <g className="eye-look-r">
        <circle cx="64" cy="44" r="5" fill="#1C1916" className="eye-blink-r"/>
        <circle cx="65.8" cy="42.2" r="1.6" fill={C.surface} className="eye-blink-r"/>
      </g>

      {/* Mouth */}
      <path d="M 40 57 Q 50 62 60 57" fill="none" stroke="#C0BAB4" strokeWidth="1.8" strokeLinecap="round"/>

      {/* Neck */}
      <rect x="43" y="66" width="14" height="7" rx="3" fill="#EDECEA"/>

      {/* Body */}
      <rect x="12" y="73" width="76" height="54" rx="12" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>

      {/* Body gold accent line */}
      <rect x="12" y="83" width="76" height="2" rx="1" fill={GOLD} opacity="0.22"/>

      {/* Chest panel */}
      <rect x="28" y="90" width="44" height="26" rx="7" fill="#F8F7F5" stroke={C.border} strokeWidth="1"/>

      {/* Indicator dots */}
      <circle cx="40" cy="103" r="3" fill={GOLD} opacity="0.55"/>
      <circle cx="50" cy="103" r="3" fill={GOLD}/>
      <circle cx="60" cy="103" r="3" fill={GOLD} opacity="0.55"/>

      {/* Left arm (static) */}
      <rect x="0" y="76" width="11" height="36" rx="5.5" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>
      <circle cx="5.5" cy="114" r="5.5" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>

      {/* Right arm (waving) */}
      <g className="arm-right">
        <rect x="89" y="76" width="11" height="36" rx="5.5" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>
        <circle cx="94.5" cy="114" r="5.5" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>
      </g>

      {/* Feet */}
      <rect x="24" y="127" width="21" height="14" rx="7" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>
      <rect x="55" y="127" width="21" height="14" rx="7" fill={C.surface} stroke={C.border} strokeWidth="1.5"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function PrelaunchPage() {

  /* ── Text animation state ───────────────────────────────────────────────── */
  const [typedDesc,      setTypedDesc]      = useState("");
  const [descDone,       setDescDone]       = useState(false);
  const [noticeVisible,  setNoticeVisible]  = useState(false);
  const [appsVisible,    setAppsVisible]    = useState(false);
  const [reducedMotion,  setReducedMotion]  = useState(false);
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
      setTypedDesc(DESC);
      setDescDone(true);
      setNoticeVisible(true);
      setAppsVisible(true);
      return;
    }

    // Title CSS animation takes 0.8s → start typewriter at 0.95s
    const TITLE_DELAY   = 950;
    const CHAR_INTERVAL = 30; // ~33 chars/sec

    let charIdx = 0;
    const typeNext = () => {
      charIdx++;
      setTypedDesc(DESC.slice(0, charIdx));
      if (charIdx < DESC.length) {
        typeTimerRef.current = setTimeout(typeNext, CHAR_INTERVAL);
      } else {
        setDescDone(true);
        typeTimerRef.current = setTimeout(() => {
          setNoticeVisible(true);
          typeTimerRef.current = setTimeout(() => setAppsVisible(true), 420);
        }, 220);
      }
    };

    typeTimerRef.current = setTimeout(typeNext, TITLE_DELAY);

    return () => { if (typeTimerRef.current) clearTimeout(typeTimerRef.current); };
  }, []);

  /* ── Form state ─────────────────────────────────────────────────────────── */
  const [robotVisible, setRobotVisible] = useState(true);
  const [nom,          setNom]          = useState("");
  const [email,        setEmail]        = useState("");
  const [entreprise,   setEntreprise]   = useState("");
  const [pays,         setPays]         = useState("");
  const [consent,      setConsent]      = useState(false);
  const [honeypot,     setHoneypot]     = useState("");
  const [fState,       setFState]       = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [fError,       setFError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fState === "submitting") return;
    setFState("submitting"); setFError("");
    try {
      const res  = await fetch("/api/waitlist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, entreprise: entreprise || undefined, pays: pays || undefined, consent, website: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) { setFState("error"); setFError(data.error ?? "Une erreur est survenue."); }
      else          setFState("success");
    } catch {
      setFState("error"); setFError("Impossible de contacter le serveur. Réessayez.");
    }
  }

  return (
    <div className="pl">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="pl-header">
        <Image src="/logo-transparent.png" alt="DJAMA"
          width={108} height={36}
          style={{ height:28, width:"auto", objectFit:"contain" }} priority/>
        <a href="#waitlist" className="pl-header-cta"
          onClick={e => { e.preventDefault(); document.getElementById("waitlist")?.scrollIntoView({ behavior:"smooth" }); }}>
          Rejoindre la liste d'attente
        </a>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="pl-hero">
        <div className="pl-hero-text">

          {/* 1 — Titre : révélation gauche → droite */}
          <h1 className={`pl-title${reducedMotion ? "" : " pl-title-anim"}`}>
            DJAMA arrive bientôt.
          </h1>

          {/* 2 — Description : machine à écrire */}
          <div className="pl-desc-wrap">
            {/* Screen reader — texte complet immédiatement accessible */}
            <p className="pl-sr-only">{DESC}</p>
            {/* Spacer invisible — maintient la hauteur sans layout shift */}
            <p className="pl-desc pl-desc-spacer" aria-hidden="true">{DESC}</p>
            {/* Texte animé visible */}
            <p className="pl-desc pl-desc-live" aria-hidden="true">
              {typedDesc}
              {!descDone && !reducedMotion && (
                <span className="pl-cursor" aria-hidden="true">|</span>
              )}
            </p>
          </div>

          {/* 3 — Notice : fondu après la description */}
          <AnimatePresence>
            {noticeVisible && (
              <motion.p className="pl-notice"
                initial={{ opacity:0, y:7 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.65, ease:"easeOut" }}>
                {NOTICE}
              </motion.p>
            )}
          </AnimatePresence>

        </div>

        {robotVisible && (
          <motion.div className="pl-hero-robot"
            initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
            transition={{ duration:0.5, delay:0.3, ease:[0.22,1,0.36,1] }}>
            <SpeechBubble/>
            <div className="pl-robot-float">
              <DjamaRobot/>
            </div>
            <button className="pl-robot-close" onClick={() => setRobotVisible(false)}
              aria-label="Masquer le robot">
              <X size={12}/>
            </button>
          </motion.div>
        )}
      </section>

      {/* ── APPLICATIONS ────────────────────────────────────────────────── */}
      <section className="pl-apps-section">
        <div className="pl-apps-grid">
          {APPS.map((app, i) => (
            <motion.div key={app.name} className="pl-app-item"
              initial={{ opacity:0, scale:0.94 }}
              animate={appsVisible ? { opacity:1, scale:1 } : { opacity:0, scale:0.94 }}
              transition={{ duration:0.28, delay:i * 0.012 }}>
              <div className="pl-app-icon"><app.Icon size={21} strokeWidth={1.6}/></div>
              <span className="pl-app-name">{app.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── LISTE D'ATTENTE ─────────────────────────────────────────────── */}
      <section id="waitlist" className="pl-waitlist">
        <div className="pl-waitlist-box">
          <h2 className="pl-wl-title">Soyez informé du lancement de DJAMA.</h2>
          <p className="pl-wl-sub">
            Inscrivez-vous pour recevoir une notification lorsque la plateforme sera disponible.
          </p>

          <AnimatePresence mode="wait">
            {fState === "success" ? (
              <motion.p key="ok" className="pl-wl-ok"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
                Merci pour votre intérêt ! Vous serez informé du lancement de DJAMA.
              </motion.p>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} noValidate exit={{ opacity:0 }}>
                <input name="website" tabIndex={-1} aria-hidden value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                  style={{ position:"absolute", opacity:0, pointerEvents:"none", height:0 }}/>

                <div className="pl-row">
                  <div className="pl-field">
                    <label className="pl-lbl" htmlFor="wl-nom">Nom complet *</label>
                    <input id="wl-nom" className="pl-inp" type="text" autoComplete="name"
                      placeholder="Jean Dupont" value={nom}
                      onChange={e => setNom(e.target.value)} required maxLength={120}/>
                  </div>
                  <div className="pl-field">
                    <label className="pl-lbl" htmlFor="wl-email">Adresse email *</label>
                    <input id="wl-email" className="pl-inp" type="email" autoComplete="email"
                      placeholder="jean@entreprise.fr" value={email}
                      onChange={e => setEmail(e.target.value)} required maxLength={255}/>
                  </div>
                </div>

                <div className="pl-row">
                  <div className="pl-field">
                    <label className="pl-lbl" htmlFor="wl-ent">
                      Entreprise <span className="pl-opt">(optionnel)</span>
                    </label>
                    <input id="wl-ent" className="pl-inp" type="text" autoComplete="organization"
                      placeholder="Nom de votre entreprise" value={entreprise}
                      onChange={e => setEntreprise(e.target.value)} maxLength={200}/>
                  </div>
                  <div className="pl-field">
                    <label className="pl-lbl" htmlFor="wl-pays">
                      Pays <span className="pl-opt">(optionnel)</span>
                    </label>
                    <select id="wl-pays" className="pl-inp pl-sel" value={pays}
                      onChange={e => setPays(e.target.value)}>
                      <option value="">Sélectionner</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <label className="pl-consent">
                  <input type="checkbox" className="pl-chk" checked={consent}
                    onChange={e => setConsent(e.target.checked)} required/>
                  <span className="pl-consent-txt">
                    J'accepte d'être contacté par DJAMA lors du lancement de la plateforme.
                    Aucune communication commerciale sans consentement préalable.
                  </span>
                </label>

                {fState === "error" && <p className="pl-err">{fError}</p>}

                <button type="submit" className="pl-submit" disabled={fState === "submitting"}>
                  {fState === "submitting"
                    ? <span className="pl-spin" aria-label="Envoi en cours"/>
                    : "Rejoindre la liste d'attente"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <Image src="/logo-transparent.png" alt="DJAMA" width={80} height={27}
            style={{ height:22, width:"auto", objectFit:"contain", opacity:0.6 }}/>
          <p className="pl-copyright">© 2026 DJAMA — Tous droits réservés.</p>
          <nav className="pl-footer-links" aria-label="Liens légaux">
            <a href="/mentions-legales" className="pl-flink">Mentions légales</a>
            <span className="pl-sep" aria-hidden>·</span>
            <a href="/confidentialite" className="pl-flink">Confidentialité</a>
            <span className="pl-sep" aria-hidden>·</span>
            <a href="mailto:contact@djama.space" className="pl-flink">contact@djama.space</a>
          </nav>
        </div>
      </footer>

      {/* ── STYLES ──────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ── Tokens & reset ───────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Screen reader only ───────────────────────── */
        .pl-sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }

        /* ── Title reveal animation ───────────────────── */
        .pl-title-anim {
          clip-path: inset(0 100% 0 0);
          animation: titleReveal 0.8s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes titleReveal {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }

        /* ── Typewriter description ───────────────────── */
        .pl-desc-wrap { position: relative; margin-bottom: 12px; }
        .pl-desc-spacer { visibility: hidden; pointer-events: none; }
        .pl-desc-live {
          position: absolute; top: 0; left: 0; width: 100%;
          margin-bottom: 0 !important;
        }
        .pl-cursor {
          display: inline-block;
          color: ${GOLD};
          font-weight: 300;
          animation: cursorBlink 0.9s step-end infinite;
          margin-left: 1px;
        }
        @keyframes cursorBlink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }

        .pl {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          background: ${C.bg}; color: ${C.text};
          min-height: 100svh; overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .pl a { color: inherit; text-decoration: none; }
        .pl button { font-family: inherit; }

        /* ── Header ───────────────────────────────────── */
        .pl-header {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; height: 60px;
          background: rgba(250,250,248,0.93);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid ${C.border};
        }
        .pl-header-cta {
          display: inline-flex; align-items: center;
          padding: 8px 18px; border-radius: 8px;
          background: ${C.gold}; color: #fff;
          font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
          transition: opacity 0.15s, transform 0.15s; cursor: pointer; white-space: nowrap;
        }
        .pl-header-cta:hover { opacity: 0.87; transform: translateY(-1px); }
        @media (max-width: 520px) {
          .pl-header { padding: 0 16px; }
          .pl-header-cta { font-size: 12px; padding: 7px 14px; }
        }

        /* ── Hero ─────────────────────────────────────── */
        .pl-hero {
          max-width: 1000px; margin: 0 auto;
          padding: 68px 32px 52px;
          display: flex; align-items: flex-start;
          gap: 40px; justify-content: space-between;
        }
        .pl-hero-text { flex: 1; max-width: 580px; }
        .pl-title {
          font-size: clamp(30px, 4.5vw, 44px);
          font-weight: 800; letter-spacing: -0.025em;
          line-height: 1.1; color: ${C.text};
          margin-bottom: 18px;
        }
        .pl-desc {
          font-size: 16px; line-height: 1.75;
          color: ${C.sub}; margin-bottom: 12px;
          font-weight: 400;
        }
        .pl-notice {
          font-size: 13.5px; color: #9a9490;
          line-height: 1.65; font-weight: 400;
        }
        @media (max-width: 700px) {
          .pl-hero {
            flex-direction: column; align-items: center;
            padding: 48px 20px 36px; gap: 28px;
          }
          .pl-hero-text { max-width: 100%; }
        }

        /* ── Robot container ──────────────────────────── */
        .pl-hero-robot {
          flex-shrink: 0; width: 160px;
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          position: relative;
        }
        @media (max-width: 700px) {
          .pl-hero-robot { width: 130px; }
        }

        /* ── Robot close button ───────────────────────── */
        .pl-robot-close {
          position: absolute; top: -6px; right: -6px; z-index: 5;
          width: 20px; height: 20px; border-radius: 50%;
          background: #edecea; border: 1px solid ${C.border};
          color: #9a9490; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .pl-robot-close:hover { background: #e0ddd8; color: ${C.text}; }

        /* ── Speech bubble ────────────────────────────── */
        .pl-bubble {
          background: ${C.surface}; border: 1px solid ${C.border};
          border-radius: 12px; padding: 10px 13px;
          box-shadow: 0 3px 14px rgba(0,0,0,0.07);
          position: relative; width: 100%;
          transition: opacity 0.4s ease, transform 0.4s ease;
          opacity: 1; transform: translateY(0);
        }
        .pl-bubble-hide { opacity: 0; transform: translateY(-4px); }
        .pl-bubble-txt {
          font-size: 12px; line-height: 1.55;
          color: ${C.sub}; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .pl-bubble-arrow {
          position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%);
          width: 13px; height: 7px; overflow: hidden;
        }
        .pl-bubble-arrow::before {
          content: '';
          position: absolute; top: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);
          width: 10px; height: 10px;
          background: ${C.surface}; border: 1px solid ${C.border};
        }

        /* ── Robot SVG ────────────────────────────────── */
        .pl-robot-float {
          animation: roboFloat 3.5s ease-in-out infinite;
        }
        .pl-robot-svg {
          width: 120px; height: auto;
          display: block;
        }
        @media (max-width: 700px) {
          .pl-robot-svg { width: 96px; }
        }

        /* Eye blink */
        .eye-blink-l {
          transform-box: fill-box; transform-origin: 50% 50%;
          animation: eyeBlink 5s ease-in-out infinite 0.2s;
        }
        .eye-blink-r {
          transform-box: fill-box; transform-origin: 50% 50%;
          animation: eyeBlink 5s ease-in-out infinite 0.25s;
        }
        /* Look around — translate pupils */
        .eye-look-l { animation: lookL 10s ease-in-out infinite 1.5s; }
        .eye-look-r { animation: lookR 10s ease-in-out infinite 1.5s; }
        /* Wave arm */
        .arm-right {
          transform-box: fill-box; transform-origin: 50% 0%;
          animation: armWave 0.7s ease-in-out 0.8s 3;
        }

        @keyframes roboFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes eyeBlink {
          0%,87%,100% { transform: scaleY(1); }
          91%,95%     { transform: scaleY(0.07); }
        }
        @keyframes lookL {
          0%,35%,100% { transform: translate(0, 0); }
          45%,65%     { transform: translate(-2.5px, 0); }
          75%,90%     { transform: translate(2px, 1px); }
        }
        @keyframes lookR {
          0%,35%,100% { transform: translate(0, 0); }
          45%,65%     { transform: translate(-2.5px, 0); }
          75%,90%     { transform: translate(2px, 1px); }
        }
        @keyframes armWave {
          0%,100% { transform: rotate(0deg); }
          30%     { transform: rotate(-28deg); }
          65%     { transform: rotate(-18deg); }
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .pl-title-anim { clip-path: none; animation: none; }
          .pl-cursor { animation: none; }
          .pl-robot-float, .eye-blink-l, .eye-blink-r,
          .eye-look-l, .eye-look-r, .arm-right {
            animation: none;
          }
          .pl-bubble { transition: none; }
        }

        /* ── Apps ─────────────────────────────────────── */
        .pl-apps-section {
          max-width: 1100px; margin: 0 auto;
          padding: 0 20px 64px;
        }
        .pl-apps-grid {
          display: grid; grid-template-columns: repeat(8, 1fr);
          gap: 2px;
        }
        .pl-app-item {
          display: flex; flex-direction: column;
          align-items: center; gap: 7px;
          padding: 13px 4px 11px; border-radius: 10px;
          cursor: default; transition: background 0.12s;
        }
        .pl-app-item:hover { background: ${C.surface}; }
        .pl-app-item:hover .pl-app-icon {
          border-color: rgba(185,157,94,0.35);
          transform: translateY(-2px);
        }
        .pl-app-icon {
          width: 52px; height: 52px; border-radius: 12px;
          background: ${C.surface}; border: 1px solid ${C.border};
          display: flex; align-items: center; justify-content: center;
          color: ${C.gold}; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          flex-shrink: 0; transition: border-color 0.15s, transform 0.15s;
        }
        .pl-app-name {
          font-size: 11px; color: ${C.sub};
          text-align: center; line-height: 1.3;
          max-width: 72px; word-break: break-word;
          font-weight: 500;
        }
        @media (max-width: 960px) { .pl-apps-grid { grid-template-columns: repeat(6,1fr); } }
        @media (max-width: 700px) { .pl-apps-grid { grid-template-columns: repeat(5,1fr); } }
        @media (max-width: 520px) { .pl-apps-grid { grid-template-columns: repeat(4,1fr); } }
        @media (max-width: 380px) { .pl-apps-grid { grid-template-columns: repeat(3,1fr); } }

        /* ── Waitlist ─────────────────────────────────── */
        .pl-waitlist {
          background: ${C.surface};
          border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border};
          padding: 60px 24px;
        }
        .pl-waitlist-box { max-width: 580px; margin: 0 auto; }
        .pl-wl-title {
          font-size: 22px; font-weight: 700;
          color: ${C.text}; margin-bottom: 8px; letter-spacing: -0.015em;
        }
        .pl-wl-sub {
          font-size: 15px; color: ${C.sub}; margin-bottom: 28px; line-height: 1.6;
        }
        .pl-wl-ok {
          font-size: 15px; color: #3a7c52; font-weight: 500;
          padding: 14px 16px; background: rgba(58,124,82,0.07);
          border: 1px solid rgba(58,124,82,0.2); border-radius: 8px;
        }
        .pl-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .pl-field { display: flex; flex-direction: column; gap: 4px; }
        .pl-lbl {
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase; color: #9a9490;
        }
        .pl-opt { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 10px; }
        .pl-inp {
          padding: 9px 11px; background: ${C.bg};
          border: 1px solid ${C.border}; border-radius: 7px;
          font-size: 14px; color: ${C.text}; outline: none; width: 100%;
          transition: border-color 0.15s;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .pl-inp::placeholder { color: #b8b4ae; }
        .pl-inp:focus { border-color: ${C.gold}; }
        .pl-sel { appearance: none; cursor: pointer; }
        .pl-consent { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin: 16px 0 20px; }
        .pl-chk { accent-color: ${C.gold}; width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; cursor: pointer; }
        .pl-consent-txt { font-size: 12.5px; color: ${C.sub}; line-height: 1.6; }
        .pl-err {
          margin-bottom: 12px; padding: 9px 12px;
          background: rgba(200,60,60,0.06); border: 1px solid rgba(200,60,60,0.2);
          border-radius: 7px; font-size: 13px; color: #c04040;
        }
        .pl-submit {
          width: 100%; padding: 12px;
          background: ${C.gold}; color: #fff; border: none; border-radius: 8px;
          font-size: 15px; font-weight: 600; cursor: pointer; letter-spacing: 0.01em;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.15s, transform 0.15s;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .pl-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .pl-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .pl-spin {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 520px) { .pl-row { grid-template-columns: 1fr; } }

        /* ── Footer ───────────────────────────────────── */
        .pl-footer { padding: 28px 24px; background: ${C.bg}; }
        .pl-footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .pl-copyright { font-size: 12px; color: #a8a49e; }
        .pl-footer-links {
          display: flex; align-items: center; gap: 10px; margin-left: auto; flex-wrap: wrap;
        }
        .pl-flink { font-size: 12px; color: #a8a49e; transition: color 0.15s; }
        .pl-flink:hover { color: ${C.text}; }
        .pl-sep { font-size: 12px; color: ${C.border}; }
        @media (max-width: 560px) {
          .pl-footer-inner { flex-direction: column; align-items: flex-start; gap: 8px; }
          .pl-footer-links { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
