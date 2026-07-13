"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Star, Zap, Lock,
  CheckCircle2, Crown, RefreshCw, Home, Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LEVELS, getStars, XP_PER_STAR } from "./game-data";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── XP counter animation ── */
function XPCount({ to, color }: { to: number; color: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t0 = Date.now(), dur = 1300;
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [to]);
  return (
    <div className="flex flex-col items-center">
      <span style={{ color }} className="text-6xl font-black tabular-nums">+{n}</span>
      <span className="mt-1 text-sm font-bold text-white/40">XP gagnés</span>
    </div>
  );
}

/* ── Confetti particles ── */
function Confetti({ color }: { color: string }) {
  const pieces = useMemo(() => {
    const cols = [color, "#fff", "#fbbf24", "#f472b6", "#818cf8", "#34d399", "#fb923c"];
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: `${(Math.random() * 110) - 5}%`,
      size: Math.random() * 12 + 5,
      col: cols[i % cols.length],
      delay: Math.random() * 1.4,
      dur: 2.2 + Math.random() * 1.8,
      rot: Math.random() * 720 - 360,
      isCircle: i % 4 === 0,
    }));
  }, [color]);
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -30, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: "115vh", opacity: 0, rotate: p.rot, scale: 0.3 }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute", left: p.left, top: 0,
            width: p.size, height: p.isCircle ? p.size : p.size * 0.45,
            borderRadius: p.isCircle ? "50%" : 2,
            background: p.col,
          }}
        />
      ))}
    </div>
  );
}

/* ── Star burst animation ── */
function StarBurst({ active, color }: { active: boolean; color: string }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -40 }}
      animate={{ scale: active ? 1 : 0.35, rotate: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0 }}
    >
      <Star
        size={60}
        fill={active ? "#fbbf24" : "transparent"}
        stroke={active ? "#fbbf24" : "rgba(255,255,255,0.12)"}
        strokeWidth={active ? 0 : 1.5}
        style={{ filter: active ? `drop-shadow(0 0 12px ${color})` : "none" }}
      />
    </motion.div>
  );
}

/* ── Progress type ── */
interface GameProgress { xp: number; steps: Record<string, { stars: number }> }

export default function JeuxPage() {
  type Screen = "map" | "level" | "game" | "step-done";
  const [screen, setScreen]       = useState<Screen>("map");
  const [levelIdx, setLevelIdx]   = useState(0);
  const [stepIdx, setStepIdx]     = useState(0);
  const [qIdx, setQIdx]           = useState(0);
  const [answers, setAnswers]     = useState<(number | boolean)[]>([]);
  const [answered, setAnswered]   = useState<number | boolean | null>(null);
  const [progress, setProgress]   = useState<GameProgress>({ xp: 0, steps: {} });
  const [userId, setUserId]       = useState<string | null>(null);
  const [stepResult, setStepResult] = useState<{ correct: number; total: number; stars: number; xp: number; levelDone: boolean } | null>(null);
  const [showConf, setShowConf]   = useState(false);

  /* load */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("user_preferences").select("value")
        .eq("user_id", user.id).eq("key", "jeu_v2_progress").maybeSingle();
      if (data?.value) setProgress(data.value as GameProgress);
    })();
  }, []);

  const saveProgress = useCallback(async (p: GameProgress) => {
    setProgress(p);
    if (!userId) return;
    await supabase.from("user_preferences").upsert(
      { user_id: userId, key: "jeu_v2_progress", value: p, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  }, [userId]);

  /* helpers */
  const level = LEVELS[levelIdx];
  const step  = level?.steps[stepIdx];
  const q     = step?.qs[qIdx];
  const color = level?.color ?? "#6366f1";
  const glow  = level?.glow  ?? "rgba(99,102,241,0.22)";

  function stepsCompleted(lid: number) {
    const lv = LEVELS.find(l => l.id === lid)!;
    return lv.steps.filter((_, si) => progress.steps[`${lid}_${si}`] !== undefined).length;
  }
  function isLevelUnlocked(lid: number) { return lid === 1 || stepsCompleted(lid - 1) >= 5; }
  function totalStars(lid: number) {
    const lv = LEVELS.find(l => l.id === lid)!;
    return lv.steps.reduce((s, _, si) => s + (progress.steps[`${lid}_${si}`]?.stars ?? 0), 0);
  }
  function isLevelDone(lid: number) { return stepsCompleted(lid) === 10; }
  function isCorrect(ans: number | boolean) {
    if (!q) return false;
    return q.t === "q" ? ans === q.c : ans === q.a;
  }

  function startStep(li: number, si: number) {
    setLevelIdx(li); setStepIdx(si);
    setQIdx(0); setAnswers([]); setAnswered(null);
    setScreen("game");
  }

  function handleAnswer(ans: number | boolean) {
    if (answered !== null) return;
    setAnswered(ans);
    setTimeout(() => {
      const next = [...answers, ans];
      setAnswers(next);
      if (qIdx + 1 >= step.qs.length) {
        const correct = next.filter((a, i) => {
          const qq = step.qs[i];
          return qq.t === "q" ? a === qq.c : a === qq.a;
        }).length;
        const total = step.qs.length;
        const stars = getStars(correct, total);
        const xpGained = stars * XP_PER_STAR;
        const stepKey = `${level.id}_${stepIdx}`;
        const prev = progress.steps[stepKey];
        const bestStars = Math.max(stars, prev?.stars ?? 0);
        const xpDelta = Math.max(0, xpGained - (prev?.stars ?? 0) * XP_PER_STAR);
        const newProgress: GameProgress = {
          xp: progress.xp + xpDelta,
          steps: { ...progress.steps, [stepKey]: { stars: bestStars } },
        };
        const levelDone = level.steps.every((_, si) =>
          newProgress.steps[`${level.id}_${si}`] !== undefined
        );
        setStepResult({ correct, total, stars, xp: xpGained, levelDone });
        void saveProgress(newProgress);
        setTimeout(() => {
          setScreen("step-done");
          if (levelDone) setTimeout(() => setShowConf(true), 400);
        }, 600);
      } else {
        setQIdx(i => i + 1);
        setAnswered(null);
      }
    }, 1400);
  }

  return (
    <div className="min-h-screen bg-[#06070f] text-white overflow-x-hidden">
      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════ MAP ═══ */}
        {screen === "map" && (
          <motion.div key="map"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-2xl px-4 pt-5 pb-24">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/coaching-ia"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/40 hover:text-white/80 transition">
                  <ChevronLeft size={14} />
                </Link>
                <div>
                  <h1 className="text-lg font-black text-white">Jeux IA</h1>
                  <p className="text-[0.65rem] text-white/30">10 niveaux · 100 étapes</p>
                </div>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5">
                <Zap size={12} className="text-yellow-400" />
                <span className="text-xs font-black text-yellow-300">{progress.xp} XP</span>
              </motion.div>
            </div>

            {/* Levels */}
            <div className="space-y-3">
              {LEVELS.map((lv, li) => {
                const unlocked  = isLevelUnlocked(lv.id);
                const done      = isLevelDone(lv.id);
                const completed = stepsCompleted(lv.id);
                const stars     = totalStars(lv.id);
                const pct       = (completed / 10) * 100;
                return (
                  <motion.button
                    key={lv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease, delay: li * 0.045 }}
                    whileHover={unlocked ? { scale: 1.015, y: -2 } : {}}
                    whileTap={unlocked ? { scale: 0.99 } : {}}
                    onClick={() => { if (unlocked) { setLevelIdx(li); setScreen("level"); } }}
                    disabled={!unlocked}
                    className="relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-200"
                    style={{
                      borderColor: unlocked ? lv.color + "45" : "rgba(255,255,255,0.06)",
                      background: unlocked
                        ? `radial-gradient(ellipse 80% 60% at 0% 50%, ${lv.glow}, transparent 70%)`
                        : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {unlocked && (
                      <div className="absolute inset-x-0 top-0 h-px"
                        style={{ background: `linear-gradient(90deg, ${lv.color}70, transparent)` }} />
                    )}
                    {done && (
                      <div className="absolute inset-x-0 bottom-0 h-px"
                        style={{ background: `linear-gradient(90deg, transparent, ${lv.color}40, transparent)` }} />
                    )}

                    <div className="flex items-center gap-4 p-4">
                      {/* Emoji / lock */}
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                        style={{
                          background: unlocked ? lv.color + "22" : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${unlocked ? lv.color + "40" : "rgba(255,255,255,0.08)"}`,
                          boxShadow: unlocked && done ? `0 0 20px ${lv.color}40` : "none",
                        }}>
                        {!unlocked ? <Lock size={18} className="text-white/18" /> : lv.emoji}
                        {done && (
                          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ background: lv.color }}>
                            <Crown size={10} className="text-black" />
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[0.58rem] font-black uppercase tracking-widest"
                            style={{ color: unlocked ? lv.color : "rgba(255,255,255,0.18)" }}>
                            Niveau {lv.id}
                          </span>
                        </div>
                        <p className={`text-sm font-black leading-tight ${unlocked ? "text-white" : "text-white/22"}`}>{lv.title}</p>
                        <p className={`text-[0.65rem] mt-0.5 ${unlocked ? "text-white/38" : "text-white/14"}`}>{lv.sub}</p>

                        {unlocked && (
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, ease, delay: li * 0.05 + 0.3 }}
                                className="h-full rounded-full"
                                style={{ background: done ? `linear-gradient(90deg, ${lv.color}, ${lv.color}cc)` : lv.color }}
                              />
                            </div>
                            <span className="text-[0.58rem] tabular-nums text-white/28">{completed}/10</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 3 }, (_, i) => {
                                const filled = i < Math.min(Math.floor(stars / (10 / 3)), 3);
                                return <Star key={i} size={9} fill={filled ? "#fbbf24" : "transparent"} stroke={filled ? "#fbbf24" : "rgba(255,255,255,0.18)"} />;
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {unlocked
                        ? <ChevronRight size={15} className="shrink-0 text-white/25" />
                        : <Lock size={13} className="shrink-0 text-white/18" />
                      }
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════ LEVEL ═══ */}
        {screen === "level" && (
          <motion.div key="level"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3, ease }}
            className="mx-auto max-w-2xl px-4 pt-5 pb-24">

            {/* Back */}
            <button onClick={() => setScreen("map")}
              className="mb-4 flex items-center gap-1.5 text-xs text-white/38 hover:text-white/70 transition">
              <ChevronLeft size={13} /> Tous les niveaux
            </button>

            {/* Level banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="relative mb-6 overflow-hidden rounded-2xl border p-5"
              style={{ borderColor: color + "50", background: `radial-gradient(ellipse 80% 60% at 10% 50%, ${glow.replace("0.22", "0.35")}, rgba(6,7,15,0.8))` }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, ${color}80, transparent)` }} />
              <div className="flex items-center gap-4">
                <motion.span
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl select-none">{level.emoji}</motion.span>
                <div>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest mb-0.5" style={{ color }}>{level.sub}</p>
                  <h2 className="text-xl font-black text-white">Niveau {level.id} : {level.title}</h2>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs text-white/35">{stepsCompleted(level.id)}/10 étapes</span>
                    <span className="text-white/20">·</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 3 }, (_, i) => {
                        const filled = i < Math.min(Math.floor(totalStars(level.id) / (10 / 3)), 3);
                        return <Star key={i} size={10} fill={filled ? "#fbbf24" : "transparent"} stroke={filled ? "#fbbf24" : "rgba(255,255,255,0.2)"} />;
                      })}
                    </div>
                    <span className="text-xs text-white/35">{totalStars(level.id)} ⭐</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Steps list */}
            <div className="space-y-2">
              {level.steps.map((s, si) => {
                const stepKey  = `${level.id}_${si}`;
                const stepData = progress.steps[stepKey];
                const done     = stepData !== undefined;
                const stars    = stepData?.stars ?? 0;
                const prevDone = si === 0 || progress.steps[`${level.id}_${si - 1}`] !== undefined;
                const canPlay  = prevDone;
                return (
                  <motion.button
                    key={si}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, ease, delay: si * 0.04 }}
                    whileHover={canPlay ? { x: 5, scale: 1.005 } : {}}
                    whileTap={canPlay ? { scale: 0.99 } : {}}
                    onClick={() => canPlay && startStep(levelIdx, si)}
                    disabled={!canPlay}
                    className="flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-200"
                    style={{
                      borderColor: done ? color + "40" : canPlay ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                      background: done ? color + "0d" : canPlay ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                    }}
                  >
                    {/* Step circle */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all"
                      style={{
                        background: done ? color : canPlay ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                        color: done ? "#000" : canPlay ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                        boxShadow: done ? `0 0 14px ${color}60` : "none",
                      }}>
                      {done ? <CheckCircle2 size={17} /> : canPlay ? si + 1 : <Lock size={13} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${canPlay ? "text-white" : "text-white/22"}`}>{s.title}</p>
                      <p className="text-[0.6rem] mt-0.5 text-white/25">{s.qs.length} questions · ≈5 min</p>
                    </div>

                    {done && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: 3 }, (_, i) => (
                          <Star key={i} size={12}
                            fill={i < stars ? "#fbbf24" : "transparent"}
                            stroke={i < stars ? "#fbbf24" : "rgba(255,255,255,0.18)"} />
                        ))}
                      </div>
                    )}
                    {canPlay && !done && <ChevronRight size={14} className="shrink-0 text-white/25" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════ GAME ═══ */}
        {screen === "game" && q && (
          <motion.div key="game"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col"
            style={{ background: `radial-gradient(ellipse 90% 35% at 50% 0%, ${glow.replace("0.22", "0.28")}, #06070f 55%)` }}>

            {/* Answer flash overlay */}
            <AnimatePresence>
              {answered !== null && (
                <motion.div
                  initial={{ opacity: 0.45 }} animate={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="pointer-events-none fixed inset-0 z-50"
                  style={{ background: isCorrect(answered) ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.14)" }}
                />
              )}
            </AnimatePresence>

            {/* Top progress */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 pt-4 pb-3 backdrop-blur-xl"
              style={{ background: "rgba(6,7,15,0.6)" }}>
              <button onClick={() => setScreen("level")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/40 hover:text-white/80 transition">
                <ChevronLeft size={14} />
              </button>
              <div className="flex-1 h-2.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  animate={{ width: `${(qIdx / step.qs.length) * 100}%` }}
                  transition={{ duration: 0.5, ease }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                />
              </div>
              <span className="shrink-0 tabular-nums text-xs font-bold" style={{ color }}>
                {qIdx + 1}/{step.qs.length}
              </span>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 px-5 pt-2 pb-4">
              <span className="text-xl">{level.emoji}</span>
              <span className="text-xs text-white/35 font-medium">{level.title}</span>
              <span className="text-white/18 text-xs">·</span>
              <span className="text-xs text-white/25">Étape {stepIdx + 1} — {step.title}</span>
            </div>

            {/* Question */}
            <div className="flex flex-1 flex-col justify-center px-4 pb-8">
              <div className="mx-auto w-full max-w-md space-y-5">
                <AnimatePresence mode="wait">
                  <motion.div key={qIdx}
                    initial={{ opacity: 0, x: 50, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.97 }}
                    transition={{ duration: 0.28, ease }}>

                    {/* Question card */}
                    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
                      style={{ boxShadow: `0 0 40px ${glow}` }}>
                      <p className="mb-3 text-[0.6rem] font-black uppercase tracking-widest" style={{ color }}>
                        {q.t === "q" ? "● Question" : "● Vrai ou Faux ?"}
                      </p>
                      <p className="text-base font-bold leading-snug text-white sm:text-lg">{q.q}</p>
                    </div>

                    {/* Quiz answers */}
                    {q.t === "q" && (
                      <div className="grid gap-2.5">
                        {q.o.map((opt, oi) => {
                          const sel         = answered === oi;
                          const showCorrect = answered !== null && oi === q.c;
                          const showWrong   = sel && oi !== q.c;
                          return (
                            <motion.button
                              key={oi}
                              whileTap={answered === null ? { scale: 0.98 } : {}}
                              onClick={() => handleAnswer(oi)}
                              disabled={answered !== null}
                              className="relative flex items-center gap-3 overflow-hidden rounded-xl border px-5 py-4 text-left text-sm font-semibold transition-all duration-300"
                              style={{
                                borderColor: showCorrect ? "#22c55e70" : showWrong ? "#ef444455" : "rgba(255,255,255,0.1)",
                                background:  showCorrect ? "rgba(34,197,94,0.16)"  : showWrong ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.035)",
                                color:       showCorrect ? "#4ade80"  : showWrong ? "#f87171"  : answered !== null ? "rgba(255,255,255,0.35)" : "#fff",
                              }}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-black"
                                style={{ background: showCorrect ? "rgba(74,222,128,0.25)" : showWrong ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)" }}>
                                {["A","B","C","D"][oi]}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {showCorrect && <CheckCircle2 size={15} className="shrink-0 text-green-400" />}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Vrai/Faux answers */}
                    {q.t === "v" && (
                      <div className="grid grid-cols-2 gap-3">
                        {([true, false] as const).map(val => {
                          const sel         = answered === val;
                          const showCorrect = answered !== null && val === q.a;
                          const showWrong   = sel && val !== q.a;
                          return (
                            <motion.button
                              key={String(val)}
                              whileTap={answered === null ? { scale: 0.97 } : {}}
                              onClick={() => handleAnswer(val)}
                              disabled={answered !== null}
                              className="rounded-2xl border py-8 text-center text-xl font-black transition-all duration-300"
                              style={{
                                borderColor: showCorrect ? "#22c55e70" : showWrong ? "#ef444455" : "rgba(255,255,255,0.1)",
                                background:  showCorrect ? "rgba(34,197,94,0.16)" : showWrong ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.04)",
                                color:       showCorrect ? "#4ade80" : showWrong ? "#f87171" : "#fff",
                              }}
                            >
                              {val ? "✓ VRAI" : "✗ FAUX"}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    <AnimatePresence>
                      {answered !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          transition={{ duration: 0.35, ease }}
                          className="mt-4 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <p className="text-xs leading-relaxed text-white/50">{q.t === "q" ? q.e : q.e}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════ STEP DONE ═══ */}
        {screen === "step-done" && stepResult && (
          <motion.div key="step-done"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
            style={{ background: `radial-gradient(ellipse 110% 65% at 50% 35%, ${glow.replace("0.22","0.42")}, #06070f 65%)` }}>

            {showConf && <Confetti color={color} />}

            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34,1.56,0.64,1] }}
              className="w-full max-w-xs text-center space-y-8">

              {/* Header */}
              <div>
                <motion.p
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4 text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/40">
                  {stepResult.levelDone
                    ? `${level.emoji} NIVEAU MAÎTRISÉ !`
                    : stepResult.stars === 3 ? "🔥 PARFAIT !"
                    : stepResult.stars === 2 ? "👏 BIEN JOUÉ !"
                    : stepResult.stars === 1 ? "💪 EN PROGRESSION !"
                    : "🎯 ÉTAPE TERMINÉE !"}
                </motion.p>

                {/* Stars */}
                <div className="flex justify-center gap-5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      initial={{ scale: 0, rotate: -40 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.35 + i * 0.2 }}>
                      <StarBurst active={i < stepResult.stars} color={color} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Stats card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Bonnes réponses</span>
                  <span className="font-black text-white">{stepResult.correct} / {stepResult.total}</span>
                </div>
                <div className="h-px bg-white/8" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                  <XPCount to={stepResult.xp} color={color} />
                </motion.div>
                {stepResult.levelDone && (
                  <>
                    <div className="h-px bg-white/8" />
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Trophy size={13} style={{ color }} />
                      <span style={{ color }} className="font-bold">Niveau {level.id} complété — {totalStars(level.id)} étoiles</span>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex flex-col gap-3">

                {stepResult.levelDone ? (
                  <>
                    <button
                      onClick={() => { setShowConf(false); setScreen("map"); }}
                      className="w-full rounded-2xl py-4 text-sm font-black text-black transition hover:brightness-110"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 24px ${color}50` }}>
                      🗺️ Carte des niveaux
                    </button>
                    {levelIdx < 9 && (
                      <button
                        onClick={() => {
                          setShowConf(false);
                          setLevelIdx(l => l + 1);
                          setScreen("level");
                        }}
                        className="w-full rounded-2xl border border-white/12 bg-white/5 py-4 text-sm font-bold text-white transition hover:bg-white/8">
                        Niveau suivant →
                      </button>
                    )}
                  </>
                ) : stepIdx < level.steps.length - 1 ? (
                  <button
                    onClick={() => startStep(levelIdx, stepIdx + 1)}
                    className="w-full rounded-2xl py-4 text-sm font-black text-black transition hover:brightness-110"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 24px ${color}45` }}>
                    Étape suivante →
                  </button>
                ) : (
                  <button
                    onClick={() => setScreen("level")}
                    className="w-full rounded-2xl py-4 text-sm font-black text-black transition hover:brightness-110"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 24px ${color}45` }}>
                    Voir le niveau
                  </button>
                )}

                <button
                  onClick={() => startStep(levelIdx, stepIdx)}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs text-white/28 transition hover:text-white/60">
                  <RefreshCw size={11} /> Recommencer cette étape
                </button>
                <button
                  onClick={() => setScreen("map")}
                  className="flex items-center justify-center gap-1.5 py-1 text-xs text-white/18 transition hover:text-white/45">
                  <Home size={10} /> Accueil
                </button>
              </motion.div>

            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
