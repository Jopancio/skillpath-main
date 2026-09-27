"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Award,
  BookOpen,
  Bot,
  Crown,
  Flame,
  Medal,
  Sparkles,
  Target,
  Trophy,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useLeaderboardBoard, type BoardEntry } from "@/hooks/use-leaderboard-board";
import type { LeaderboardMetric } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Category {
  metric: LeaderboardMetric;
  icon: LucideIcon;
  title: { id: string; en: string };
  desc: { id: string; en: string };
  unit: { id: string; en: string };
}

const CATEGORIES: Category[] = [
  {
    metric: "xp",
    icon: Zap,
    title: { id: "Top XP", en: "Top XP" },
    desc: { id: "Total XP terbanyak dari semua aktivitas belajar.", en: "Most XP earned across all learning." },
    unit: { id: "XP", en: "XP" },
  },
  {
    metric: "lessons_done",
    icon: BookOpen,
    title: { id: "Top Learner", en: "Top Learner" },
    desc: { id: "Paling banyak menyelesaikan pelajaran.", en: "Most lessons completed." },
    unit: { id: "pelajaran", en: "lessons" },
  },
  {
    metric: "courses_created",
    icon: Wand2,
    title: { id: "Top Courses", en: "Top Courses" },
    desc: { id: "Paling banyak membuat kursus dengan AI.", en: "Most courses created with AI." },
    unit: { id: "kursus", en: "courses" },
  },
  {
    metric: "ai_asks",
    icon: Bot,
    title: { id: "Top AI Ask", en: "Top AI Ask" },
    desc: { id: "Paling rajin bertanya ke AI asisten kursus.", en: "Most questions asked to the course AI." },
    unit: { id: "pertanyaan", en: "questions" },
  },
  {
    metric: "streak",
    icon: Flame,
    title: { id: "Top Streak", en: "Top Streak" },
    desc: { id: "Streak harian terpanjang saat ini.", en: "Longest current daily streak." },
    unit: { id: "hari", en: "days" },
  },
  {
    metric: "quizzes_passed",
    icon: Target,
    title: { id: "Top Quiz", en: "Top Quiz" },
    desc: { id: "Paling banyak lulus kuis bab & kuis akhir.", en: "Most chapter and final quizzes passed." },
    unit: { id: "kuis", en: "quizzes" },
  },
  {
    metric: "badges_count",
    icon: Award,
    title: { id: "Top Badges", en: "Top Badges" },
    desc: { id: "Paling banyak mengoleksi badge.", en: "Most badges collected." },
    unit: { id: "badge", en: "badges" },
  },
];

const AVATAR_COLORS = ["#2563EB", "#3B82F6", "#EC4899", "#38BDF8", "#8B5CF6", "#1D4ED8", "#22C55E"];

function avatarColorFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

const RANK_LIMIT = 50;

export default function LeaderboardPage() {
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "id";
  const [metric, setMetric] = useState<LeaderboardMetric>("xp");
  const category = CATEGORIES.find((c) => c.metric === metric) ?? CATEGORIES[0];
  const { entries, status, error } = useLeaderboardBoard(metric);
  const reduceMotion = useReducedMotion();

  const podium = entries.filter((e) => e.rank <= 3 && e.value > 0);
  const rest = entries.filter((e) => !podium.includes(e));
  const self = entries.find((e) => e.isCurrentUser);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-0">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            {lang === "en" ? "Who's leading SkillPath?" : "Siapa juara SkillPath?"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "en"
              ? "Rankings update automatically every 30 seconds."
              : "Peringkat diperbarui otomatis setiap 30 detik."}
          </p>
        </div>
        {self && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-bold">
                {lang === "en" ? "Your rank" : "Peringkatmu"}:{" "}
                <span className="text-primary">#{rankLabel(self.rank)}</span>
              </p>
              <p className="text-xs text-muted">
                {self.value.toLocaleString()} {category.unit[lang]}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Category tabs */}
      <div
        role="tablist"
        aria-label={lang === "en" ? "Leaderboard categories" : "Kategori leaderboard"}
        className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {CATEGORIES.map((c) => {
          const active = c.metric === metric;
          const Icon = c.icon;
          return (
            <button
              key={c.metric}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMetric(c.metric)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                active
                  ? "border-transparent text-white"
                  : "border-border bg-card text-muted hover:border-primary/40 hover:text-primary"
              )}
            >
              {active && (
                <motion.span
                  layoutId="leaderboard-tab-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-deep-orange shadow-soft"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{c.title[lang]}</span>
            </button>
          );
        })}
      </div>

      <section
        role="tabpanel"
        className="rounded-3xl border border-border bg-card p-4 text-foreground shadow-card sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-deep-orange text-white shadow-soft">
            <category.icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold">{category.title[lang]}</h2>
            <p className="text-sm text-muted">{category.desc[lang]}</p>
          </div>
        </div>

        {status === "error" && (
          <p role="alert" className="mb-4 rounded-2xl border border-deep-orange/40 bg-deep-orange/10 p-3 text-sm text-foreground">
            {lang === "en"
              ? "Couldn't load this board. If it's a new category, the database migration (supabase/leaderboard_v2.sql) may not have been run yet."
              : "Gagal memuat papan ini. Jika ini kategori baru, migrasi database (supabase/leaderboard_v2.sql) mungkin belum dijalankan."}
            {error && <span className="mt-1 block text-xs text-muted">{error}</span>}
          </p>
        )}
        {status === "unconfigured" && (
          <p className="mb-4 rounded-2xl border border-border bg-background p-3 text-sm text-muted">
            {lang === "en"
              ? "Online leaderboard is unavailable — showing only your own stats."
              : "Leaderboard online belum tersedia — hanya menampilkan statistikmu."}
          </p>
        )}

        {status === "loading" ? (
          <BoardSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={metric}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {podium.length > 0 && <Podium entries={podium} unit={category.unit[lang]} />}

              {rest.length > 0 ? (
                <ol className="mt-4 flex flex-col gap-2">
                  {rest.map((e) => (
                    <Row key={e.userId} entry={e} unit={category.unit[lang]} youLabel={lang === "en" ? "You" : "Kamu"} />
                  ))}
                </ol>
              ) : (
                podium.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted">
                    {lang === "en" ? "No one on this board yet. Be the first!" : "Belum ada yang masuk papan ini. Jadilah yang pertama!"}
                  </p>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}

function rankLabel(rank: number): string {
  return rank > RANK_LIMIT ? `${RANK_LIMIT}+` : String(rank);
}

function Avatar({ entry, size }: { entry: BoardEntry; size: "sm" | "lg" }) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: avatarColorFor(entry.userId) }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-extrabold text-white",
        size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs"
      )}
    >
      {initialsOf(entry.name)}
    </span>
  );
}

const PODIUM_STYLE: Record<number, { ring: string; icon: LucideIcon; iconClass: string; height: string }> = {
  1: { ring: "ring-yellow-400", icon: Crown, iconClass: "text-yellow-500", height: "sm:pt-0" },
  2: { ring: "ring-slate-300", icon: Medal, iconClass: "text-slate-400", height: "sm:pt-8" },
  3: { ring: "ring-amber-600", icon: Medal, iconClass: "text-amber-600", height: "sm:pt-12" },
};

function Podium({ entries, unit }: { entries: BoardEntry[]; unit: string }) {
  // Visual order 2 · 1 · 3 on wide screens, rank order on mobile.
  const order = [2, 1, 3];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
      {order.map((rank) => {
        const e = entries.find((x) => x.rank === rank);
        if (!e) return <div key={rank} className="hidden sm:block" />;
        const s = PODIUM_STYLE[rank];
        const Icon = s.icon;
        return (
          <div
            key={e.userId}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center",
              rank === 1 ? "order-first sm:order-none" : "",
              e.isCurrentUser ? "border-primary/50 bg-primary/5" : "border-border bg-background",
              s.height
            )}
          >
            <Icon className={cn("h-6 w-6", s.iconClass)} aria-hidden />
            <span className={cn("rounded-full ring-4", s.ring)}>
              <Avatar entry={e} size="lg" />
            </span>
            <p className="max-w-full truncate font-bold text-foreground">{e.name}</p>
            <p className="text-sm font-extrabold text-primary tabular-nums">
              {e.value.toLocaleString()} <span className="font-bold text-muted">{unit}</span>
            </p>
            <span className="text-xs font-extrabold text-muted">#{rank}</span>
          </div>
        );
      })}
    </div>
  );
}

function Row({ entry, unit, youLabel }: { entry: BoardEntry; unit: string; youLabel: string }) {
  return (
    <li
      aria-current={entry.isCurrentUser ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5",
        entry.isCurrentUser ? "border-primary/50 bg-primary/5" : "border-border bg-background"
      )}
    >
      <span className="w-10 text-center text-sm font-extrabold text-muted tabular-nums">#{rankLabel(entry.rank)}</span>
      <Avatar entry={entry} size="sm" />
      <span className="min-w-0 flex-1 truncate font-bold text-foreground">
        {entry.name}
        {entry.isCurrentUser && (
          <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-extrabold text-primary">{youLabel}</span>
        )}
      </span>
      <span className="text-sm font-extrabold text-foreground tabular-nums">
        {entry.value.toLocaleString()} <span className="font-bold text-muted">{unit}</span>
      </span>
    </li>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-background" />
      ))}
    </div>
  );
}
