"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MotionConfig, motion, type Variants } from "framer-motion";
import { ArrowRight, Award, CalendarCheck2, Pin } from "lucide-react";
import { useI18n, pick } from "@/lib/i18n";
import { useProgress } from "@/hooks/use-progress";
import { useBadges, type BadgeWithStatus } from "@/hooks/use-badges";
import { BADGE_CATEGORIES, BADGE_TIERS, type BadgeCategory } from "@/data/badges";
import { BadgeMedal, TierPill } from "@/components/badges/BadgeMedal";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

type Filter = "all" | "earned" | "locked";

export default function BadgesPage() {
  const { locale } = useI18n();
  const en = locale === "en";
  const { hydrated, featuredBadges } = useProgress();
  const all = useBadges();
  const [filter, setFilter] = useState<Filter>("all");

  const earnedCount = all.filter((b) => b.earned).length;
  const pct = all.length ? Math.round((earnedCount / all.length) * 100) : 0;

  // Closest locked badge by remaining percentage — the "next goal" card.
  const next = useMemo(
    () =>
      all
        .filter((b) => !b.earned)
        .sort((a, b) => b.percent - a.percent)[0],
    [all]
  );

  const grouped = useMemo(() => {
    const shown = all.filter((b) =>
      filter === "all" ? true : filter === "earned" ? b.earned : !b.earned
    );
    const byCat = new Map<BadgeCategory, BadgeWithStatus[]>();
    for (const b of shown) byCat.set(b.category, [...(byCat.get(b.category) ?? []), b]);
    return [...byCat.entries()];
  }, [all, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: en ? `All (${all.length})` : `Semua (${all.length})` },
    { id: "earned", label: en ? `Earned (${earnedCount})` : `Diraih (${earnedCount})` },
    {
      id: "locked",
      label: en ? `Locked (${all.length - earnedCount})` : `Terkunci (${all.length - earnedCount})`,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        variants={groupVariants}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:py-12"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7 lg:p-8"
        >
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-primary/[0.06] to-transparent" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">
                <Award className="h-3.5 w-3.5" />
                {en ? "Achievements" : "Pencapaian"}
              </p>
              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {en ? "Your badge collection" : "Koleksi badge-mu"}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                {en
                  ? "Every badge is earned for good. Pin your favourites to your profile so other learners can see them."
                  : "Setiap badge yang diraih jadi milikmu selamanya. Pasang favoritmu di profil agar dilihat learner lain."}
              </p>
              <Link
                href="/profile"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                <Pin className="h-3.5 w-3.5" />
                {en ? "Choose featured badges" : "Pilih badge unggulan"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="w-full max-w-xs rounded-2xl border border-border bg-background/70 p-4">
              {hydrated ? (
                <>
                  <p className="font-display text-3xl font-extrabold tabular-nums">
                    {earnedCount}
                    <span className="text-lg text-muted">/{all.length}</span>
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    {en ? "badges earned" : "badge diraih"} · {pct}%
                  </p>
                  <ProgressBar percent={pct} className="mt-3" barClassName="bg-secondary" />
                </>
              ) : (
                <span className="block h-16 animate-pulse rounded-lg bg-border/50" />
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Next goal ──────────────────────────────────────── */}
        {hydrated && next && (
          <motion.section
            variants={itemVariants}
            className="mt-6 flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5"
          >
            <BadgeMedal badge={next} earned={false} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                {en ? "Next goal" : "Target berikutnya"}
              </p>
              <p className="truncate font-display text-base font-extrabold">{pick(locale, next.name)}</p>
              <p className="truncate text-xs text-muted">{pick(locale, next.description)}</p>
              <ProgressBar percent={next.percent} className="mt-2" />
            </div>
            <span className="shrink-0 font-display text-sm font-extrabold tabular-nums text-primary">
              {next.current}/{next.goal}
            </span>
          </motion.section>
        )}

        {/* ── Filters ────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-2" role="tablist">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-muted hover:border-primary/40 hover:text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* ── Badge grid, grouped by category ───────────────── */}
        {!hydrated ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-border bg-card/60" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <p className="mt-10 text-center text-sm font-semibold text-muted">
            {filter === "earned"
              ? en
                ? "No badges yet — finish your first lesson to earn one!"
                : "Belum ada badge — selesaikan pelajaran pertamamu untuk meraihnya!"
              : en
                ? "You've unlocked every badge. Legendary!"
                : "Semua badge sudah kamu raih. Luar biasa!"}
          </p>
        ) : (
          grouped.map(([cat, list]) => (
            <section key={cat} className="mt-8">
              <h2 className="font-display text-lg font-extrabold tracking-tight">
                {pick(locale, BADGE_CATEGORIES[cat])}
              </h2>
              <motion.div
                variants={groupVariants}
                initial="hidden"
                animate="show"
                className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {list.map((b) => (
                  <BadgeCard key={b.id} badge={b} featured={featuredBadges.includes(b.id)} />
                ))}
              </motion.div>
            </section>
          ))
        )}
      </motion.div>
    </MotionConfig>
  );
}

function BadgeCard({ badge, featured }: { badge: BadgeWithStatus; featured: boolean }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const date = badge.unlockedAt
    ? new Date(`${badge.unlockedAt}T00:00:00`).toLocaleDateString(en ? "en-US" : "id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <motion.article
      variants={itemVariants}
      whileHover={badge.earned ? { y: -3 } : undefined}
      className={cn(
        "relative flex gap-4 rounded-2xl border p-4 sm:p-5",
        badge.earned ? "border-secondary/40 bg-card shadow-gold-glow" : "border-dashed border-border bg-card/50"
      )}
    >
      {featured && (
        <span
          title={en ? "Featured on your profile" : "Dipasang di profilmu"}
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary"
        >
          <Pin className="h-3 w-3" />
        </span>
      )}
      <BadgeMedal badge={badge} earned={badge.earned} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <h3 className="font-display text-sm font-extrabold leading-tight">{pick(locale, badge.name)}</h3>
          <TierPill badge={badge} label={pick(locale, BADGE_TIERS[badge.tier].label)} />
        </div>
        <p className={cn("mt-1 text-xs leading-snug text-muted", !badge.earned && "opacity-80")}>
          {pick(locale, badge.description)}
        </p>
        {badge.earned ? (
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-secondary">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            {date ? (en ? `Earned ${date}` : `Diraih ${date}`) : en ? "Earned" : "Diraih"}
          </p>
        ) : (
          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] font-bold tabular-nums text-muted">
              <span>{en ? "Progress" : "Progres"}</span>
              <span>
                {badge.current}/{badge.goal}
              </span>
            </div>
            <ProgressBar percent={badge.percent} className="mt-1" />
          </div>
        )}
      </div>
    </motion.article>
  );
}
