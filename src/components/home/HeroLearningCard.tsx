"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Check, Flame, Lock, Play, Sparkles, Star, Trophy } from "lucide-react";

type Path = {
  key: string;
  emoji: string;
  title: { id: string; en: string };
  tab: { id: string; en: string };
  /** Tailwind gradient stops for the dark header panel. */
  glow: string;
  steps: { id: string; en: string; mins: number }[];
  /** Index of the step currently in progress (earlier ones count as done). */
  current: number;
  /** 0–100, how far into the current step the learner is. */
  stepProgress: number;
};

const PATHS: Path[] = [
  {
    key: "barista",
    emoji: "☕",
    title: { id: "Jadi Barista Andal", en: "Become a Barista" },
    tab: { id: "Barista", en: "Barista" },
    glow: "from-amber-400/40 via-orange-400/20",
    current: 1,
    stepProgress: 60,
    steps: [
      { id: "Kenalan dengan kopi", en: "Get to know coffee", mins: 12 },
      { id: "Racik espresso pertamamu", en: "Brew your first espresso", mins: 18 },
      { id: "Buat latte art versimu", en: "Create your latte art", mins: 25 },
    ],
  },
  {
    key: "design",
    emoji: "🎨",
    title: { id: "Desainer Grafis Pemula", en: "Graphic Design Starter" },
    tab: { id: "Desain", en: "Design" },
    glow: "from-fuchsia-400/40 via-pink-400/20",
    current: 2,
    stepProgress: 35,
    steps: [
      { id: "Dasar warna & tipografi", en: "Color & type basics", mins: 15 },
      { id: "Susun layout yang rapi", en: "Build a clean layout", mins: 20 },
      { id: "Desain poster pertamamu", en: "Design your first poster", mins: 30 },
    ],
  },
  {
    key: "video",
    emoji: "🎬",
    title: { id: "Video Editor Kreatif", en: "Creative Video Editor" },
    tab: { id: "Video", en: "Video" },
    glow: "from-sky-300/40 via-cyan-300/20",
    current: 0,
    stepProgress: 80,
    steps: [
      { id: "Cutting yang rapat", en: "Tight cutting", mins: 14 },
      { id: "Color grading sinematik", en: "Cinematic color grading", mins: 22 },
      { id: "Edit video 60 detik", en: "Edit a 60-second video", mins: 28 },
    ],
  },
];

const ROTATE_MS = 5500;

export function HeroLearningCard({ href, en }: { href: string; en: boolean }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const L = en ? "en" : "id";
  const path = PATHS[active];
  const done = path.current;
  // Overall % = finished steps + the partial current one.
  const overall = Math.round(((done + path.stepProgress / 100) / path.steps.length) * 100);

  // Auto-cycle through the demo paths; hover/focus pauses it.
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % PATHS.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, reduce]);

  // Soft 3D tilt that follows the pointer.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 160, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 160, damping: 18 });
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse" || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
    setPaused(false);
  };

  const float = (delay: number, dist = 8) =>
    reduce ? {} : { y: [0, -dist, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="relative mx-auto w-full max-w-md [perspective:1200px] lg:max-w-none"
    >
      {/* Ambient glow behind the card */}
      <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/30 via-sky-300/20 to-transparent blur-3xl" />

      {/* Floating badges — decorative, desktop only */}
      <motion.div
        aria-hidden
        animate={float(0)}
        className="absolute -left-6 top-24 z-20 hidden items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 text-foreground shadow-xl backdrop-blur sm:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500"><Flame className="h-4 w-4" /></span>
        <span className="leading-tight">
          <b className="block text-xs">{en ? "7-day streak" : "7 hari beruntun"}</b>
          <span className="text-[10px] text-muted">{en ? "Keep it up!" : "Pertahankan!"}</span>
        </span>
      </motion.div>
      <motion.div
        aria-hidden
        animate={float(1.2, 10)}
        className="absolute -right-5 bottom-28 z-20 hidden items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 text-foreground shadow-xl backdrop-blur sm:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-500"><Trophy className="h-4 w-4" /></span>
        <span className="leading-tight">
          <b className="block text-xs">+50 XP</b>
          <span className="text-[10px] text-muted">{en ? "Lesson complete" : "Materi selesai"}</span>
        </span>
      </motion.div>

      <motion.div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={onLeave}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        style={reduce ? undefined : { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="relative rounded-[1.75rem] border border-primary/15 bg-card p-3 shadow-[0_30px_80px_-30px_rgba(30,64,175,.45)] sm:p-4"
      >
        {/* ── Dark header panel ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#102b66] p-5 text-white sm:p-6">
          {/* Moving color blob, tinted per path */}
          <AnimatePresence>
            <motion.div
              key={path.key}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, x: [0, 30, -10, 0], y: [0, -15, 10, 0] }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.6 }, x: { duration: 12, repeat: Infinity, ease: "easeInOut" }, y: { duration: 12, repeat: Infinity, ease: "easeInOut" } }}
              className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${path.glow} to-transparent blur-2xl`}
            />
          </AnimatePresence>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.09)_1px,transparent_0)] [background-size:16px_16px]" />

          <div className="relative flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-blue-100">
              <span className="relative flex h-1.5 w-1.5">
                {!reduce && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              <Sparkles className="h-3 w-3" />
              {en ? "YOUR LEARNING SPACE" : "RUANG BELAJARMU"}
            </span>
            {/* Path switcher */}
            <div role="tablist" aria-label={en ? "Example paths" : "Contoh jalur"} className="flex gap-1 rounded-full bg-white/10 p-0.5">
              {PATHS.map((p, i) => (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className="relative rounded-full px-2.5 py-1 text-[10px] font-semibold text-blue-100 transition-colors hover:text-white"
                >
                  {i === active && (
                    <motion.span layoutId="hero-path-tab" className="absolute inset-0 rounded-full bg-white/20" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative">{p.tab[L]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-blue-200">{en ? "Your learning path" : "Jalur belajarmu"}</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={path.key}
                  initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduce ? undefined : { opacity: 0, y: -14, filter: "blur(6px)" }}
                  transition={{ duration: 0.35 }}
                  className="mt-1 truncate font-display text-2xl font-semibold"
                >
                  {path.title[L]}
                </motion.p>
              </AnimatePresence>
            </div>
            {/* Emoji inside an animated progress ring */}
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="4" />
                <motion.circle
                  cx="32" cy="32" r="28" fill="none" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round"
                  initial={false}
                  animate={{ pathLength: overall / 100 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </svg>
              <AnimatePresence mode="wait">
                <motion.span
                  key={path.key}
                  initial={reduce ? false : { scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={reduce ? undefined : { scale: 0, rotate: 40 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="absolute inset-0 flex items-center justify-center text-3xl"
                  aria-hidden
                >
                  {path.emoji}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="relative mt-5 flex items-end justify-between text-[10px] text-blue-100">
            <span>{en ? "Progress" : "Progres"}</span>
            <span className="flex items-baseline gap-2">
              <b className="font-display text-base text-white">{overall}%</b>
              <span>· {done} / {path.steps.length} {en ? "steps" : "langkah"}</span>
            </span>
          </div>
          <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-sky-300 to-cyan-200"
              initial={false}
              animate={{ width: `${overall}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  animate={{ x: ["-3rem", "20rem"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }}
                />
              )}
            </motion.div>
          </div>
          {/* Rotation timer dots */}
          <div className="relative mt-4 flex gap-1.5" aria-hidden>
            {PATHS.map((p, i) => (
              <span key={p.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                {i === active && (
                  <motion.span
                    key={`${p.key}-${paused}`}
                    className="block h-full rounded-full bg-white/50"
                    initial={{ width: reduce || paused ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: reduce || paused ? 0 : ROTATE_MS / 1000, ease: "linear" }}
                  />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ── Steps list ── */}
        <div className="p-3 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <b className="text-xs">{en ? "A little progress, every day" : "Sedikit kemajuan, setiap hari"}</b>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Star className="h-3 w-3" />
              {en ? "Preview" : "Pratinjau"}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.ol
              key={path.key}
              className="relative space-y-2"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
            >
              {/* Vertical connector line */}
              <span aria-hidden className="absolute bottom-6 left-[1.9rem] top-6 w-px bg-border" />
              {path.steps.map((s, i) => {
                const state = i < done ? "done" : i === done ? "current" : "locked";
                return (
                  <motion.li
                    key={s.id}
                    variants={{
                      hidden: reduce ? {} : { opacity: 0, x: -16 },
                      show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
                      exit: reduce ? {} : { opacity: 0, x: 16, transition: { duration: 0.15 } },
                    }}
                    whileHover={reduce ? undefined : { x: 4 }}
                    className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      state === "current"
                        ? "border-primary/30 bg-primary/5 shadow-[0_8px_24px_-16px_rgb(37_99_235/.6)]"
                        : "border-transparent hover:border-border hover:bg-background/60"
                    }`}
                  >
                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        state === "done"
                          ? "bg-emerald-500 text-white"
                          : state === "current"
                            ? "bg-primary text-white"
                            : "bg-muted/15 text-muted"
                      }`}
                    >
                      {state === "current" && !reduce && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                      )}
                      {state === "done" ? <Check className="h-4 w-4" /> : state === "current" ? <Play className="relative h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-xs font-semibold ${state === "locked" ? "text-muted" : ""}`}>{s[L]}</span>
                      {state === "current" ? (
                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-primary/15">
                          <motion.span
                            className="block h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${path.stepProgress}%` }}
                            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                          />
                        </span>
                      ) : (
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {state === "done" ? (en ? "Completed" : "Selesai") : `${s.mins} ${en ? "min" : "menit"}`}
                        </span>
                      )}
                    </span>
                    {state === "current" && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary">
                        {en ? "Continue" : "Lanjut"}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </motion.ol>
          </AnimatePresence>

          <Link
            href={href}
            className="group relative mt-4 flex items-center justify-between overflow-hidden rounded-xl bg-primary px-4 py-3.5 text-xs font-semibold text-white shadow-[0_12px_30px_-12px_rgb(37_99_235/.8)] transition-transform active:scale-[.98]"
          >
            {!reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-16 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                animate={{ x: ["-6rem", "32rem"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
              />
            )}
            <span className="relative">{en ? "Create my own path" : "Buat Jalur Belajarku"}</span>
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
