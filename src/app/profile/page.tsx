"use client";

import { useState } from "react";
import Link from "next/link";
import { MotionConfig, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CircleUserRound,
  Eye,
  Flame,
  GraduationCap,
  Mail,
  Pencil,
  Pin,
  Target,
  Zap,
} from "lucide-react";
import { useI18n, pick } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useProgress } from "@/hooks/use-progress";
import { useBadges } from "@/hooks/use-badges";
import { MAX_FEATURED_BADGES } from "@/data/badges";
import { BadgeMedal } from "@/components/badges/BadgeMedal";
import { cn } from "@/lib/utils";

/* Same entrance vocabulary as the dashboard. */
const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const en = locale === "en";
  const { user } = useAuth();
  const {
    xp,
    streak,
    level,
    lessonsCompletedCount,
    userName,
    onboarding,
    hydrated,
    setUserName,
    bio,
    setBio,
    featuredBadges,
    setFeaturedBadges,
  } = useProgress();
  const allBadges = useBadges();
  const earnedBadges = allBadges.filter((b) => b.earned);

  // Bio editor
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const saveBio = () => {
    setBio(bioDraft.trim());
    setEditingBio(false);
  };

  const toggleFeatured = (id: string) => {
    if (featuredBadges.includes(id)) {
      setFeaturedBadges(featuredBadges.filter((x) => x !== id));
    } else if (featuredBadges.length < MAX_FEATURED_BADGES) {
      setFeaturedBadges([...featuredBadges, id]);
    }
  };

  const displayName = (hydrated && userName) || user?.name || "?";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Inline rename editor.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const startEdit = () => {
    setDraft(displayName === "?" ? "" : displayName);
    setJustSaved(false);
    setEditing(true);
  };

  const saveName = () => {
    const trimmed = draft.trim();
    if (trimmed) setUserName(trimmed);
    setEditing(false);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  };

  // Resolve onboarding answers into localized labels.
  const reason = onboarding
    ? t.onboarding.reasons.find((r) => r.id === onboarding.reason)
    : undefined;
  const knowledge = onboarding
    ? t.onboarding.knowledgeOptions.find((k) => k.id === onboarding.knowledgeLevel)
    : undefined;
  const experience = onboarding
    ? t.onboarding.expOptions.find((e) => e.id === onboarding.learningExp)
    : undefined;
  const goal = onboarding
    ? t.onboarding.goalOptions.find((g) => g.minutes === onboarding.dailyGoalMinutes)
    : undefined;

  const stats = [
    { icon: Zap, label: t.profile.statXp, value: xp },
    { icon: GraduationCap, label: t.profile.statLevel, value: level },
    { icon: Flame, label: t.profile.statStreak, value: streak },
    { icon: BookOpen, label: t.profile.statLessons, value: lessonsCompletedCount },
  ];

  const learningRows = [
    { icon: Target, label: t.profile.reason, option: reason },
    { icon: GraduationCap, label: t.profile.knowledge, option: knowledge },
    { icon: BookOpen, label: t.profile.experience, option: experience },
    {
      icon: Flame,
      label: t.profile.dailyGoal,
      option: goal
        ? { emoji: "🎯", label: `${goal.minutes} ${t.profile.minutesPerDay}` }
        : undefined,
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
        {/* ── Header / account card ────────────────────────────── */}
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/[0.06] to-transparent"
          />
          <span
            aria-hidden
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
          />
          <CircleUserRound
            aria-hidden
            className="absolute right-6 top-6 hidden h-5 w-5 animate-float text-secondary sm:block"
          />

          <div className="relative p-5 sm:p-7 lg:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">
              {t.profile.title}
            </p>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-deep-orange text-xl font-extrabold text-white shadow-card ring-4 ring-white/30 dark:ring-white/10">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initials
                )}
              </span>

              <div className="min-w-0 flex-1">
                {/* Name row: static + edit, or inline input */}
                {editing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") setEditing(false);
                      }}
                      placeholder={t.profile.namePlaceholder}
                      autoFocus
                      maxLength={40}
                      aria-label={t.profile.name}
                      className="w-full max-w-xs rounded-full border border-border bg-background px-4 py-2.5 font-display text-lg font-bold outline-none transition-colors focus:border-primary sm:text-xl"
                    />
                    <button
                      type="button"
                      onClick={saveName}
                      disabled={!draft.trim()}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-deep-orange px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Check className="h-4 w-4" />
                      {t.profile.save}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-full px-3 py-2.5 text-sm font-bold text-muted transition-colors hover:bg-background hover:text-foreground"
                    >
                      {t.profile.cancel}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="truncate font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {displayName}
                    </h1>
                    <button
                      type="button"
                      onClick={startEdit}
                      aria-label={t.profile.editName}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted transition-all hover:border-primary/40 hover:text-primary active:scale-90"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <span
                      className={`text-xs font-bold text-secondary transition-opacity duration-300 ${
                        justSaved ? "opacity-100" : "opacity-0"
                      }`}
                      aria-live="polite"
                    >
                      ✓ {t.profile.saved}
                    </span>
                  </div>
                )}

                {user?.email && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-muted">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                )}
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                  {t.profile.subtitle}
                </p>
                {user && (
                  <Link
                    href={`/profile/${encodeURIComponent(user.id)}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-extrabold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {en ? "View public profile" : "Lihat profil publik"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Bio ───────────────────────────────────────────────── */}
        <motion.section variants={itemVariants} className="mt-6 lg:mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold tracking-tight">Bio</h2>
            {!editingBio && hydrated && (
              <button
                type="button"
                onClick={() => {
                  setBioDraft(bio);
                  setEditingBio(true);
                }}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                {en ? "Edit" : "Ubah"}
              </button>
            )}
          </div>
          <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
            {editingBio ? (
              <>
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value.slice(0, 160))}
                  rows={3}
                  autoFocus
                  aria-label="Bio"
                  placeholder={
                    en
                      ? "Tell other learners about yourself…"
                      : "Ceritakan sedikit tentang dirimu ke learner lain…"
                  }
                  className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs tabular-nums text-muted">{bioDraft.length}/160</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBio(false)}
                      className="rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-background hover:text-foreground"
                    >
                      {t.profile.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={saveBio}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-deep-orange px-4 py-2 text-sm font-extrabold text-white shadow-soft"
                    >
                      <Check className="h-4 w-4" />
                      {t.profile.save}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className={cn("whitespace-pre-line text-sm leading-relaxed", !bio && "text-muted")}>
                {bio || (en ? "No bio yet. Add one so others know you." : "Belum ada bio. Tambahkan agar learner lain mengenalmu.")}
              </p>
            )}
          </div>
        </motion.section>

        {/* ── Featured badges picker ────────────────────────────── */}
        <motion.section variants={itemVariants} className="mt-6 lg:mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-extrabold tracking-tight">
                {en ? "Featured badges" : "Badge unggulan"}
              </h2>
              <p className="text-xs text-muted">
                {en
                  ? `Pick up to ${MAX_FEATURED_BADGES} badges to show at the top of your public profile.`
                  : `Pilih hingga ${MAX_FEATURED_BADGES} badge untuk dipamerkan di profil publikmu.`}
              </p>
            </div>
            <Link
              href="/badges"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <Award className="h-3.5 w-3.5" />
              {en ? "All badges" : "Semua badge"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!hydrated ? (
            <div className="mt-3 h-28 animate-pulse rounded-2xl border border-border bg-card/60" />
          ) : earnedBadges.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm font-semibold text-muted">
              {en
                ? "You haven't earned any badges yet. Finish a lesson to get your first!"
                : "Kamu belum punya badge. Selesaikan satu pelajaran untuk meraih yang pertama!"}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {earnedBadges.map((b) => {
                const selected = featuredBadges.includes(b.id);
                const full = !selected && featuredBadges.length >= MAX_FEATURED_BADGES;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleFeatured(b.id)}
                    disabled={full}
                    aria-pressed={selected}
                    className={cn(
                      "relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all",
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40",
                      full && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
                        <Pin className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <BadgeMedal badge={b} earned size="sm" />
                    <span className="mt-2 line-clamp-2 text-xs font-bold leading-tight">{pick(locale, b.name)}</span>
                  </button>
                );
              })}
            </div>
          )}
          {hydrated && earnedBadges.length > 0 && (
            <p className="mt-2 text-xs font-bold tabular-nums text-muted">
              {featuredBadges.length}/{MAX_FEATURED_BADGES} {en ? "selected" : "dipilih"}
            </p>
          )}
        </motion.section>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <motion.section variants={itemVariants} className="mt-6 lg:mt-8">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            {t.profile.statsSection}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {hydrated ? (
                  <p className="mt-3 font-display text-2xl font-extrabold tabular-nums sm:text-3xl">
                    {value}
                  </p>
                ) : (
                  <span className="mt-3 block h-8 w-16 animate-pulse rounded-lg bg-border/50" />
                )}
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Learning profile ──────────────────────────────────── */}
        <motion.section variants={itemVariants} className="mt-6 lg:mt-8">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            {t.profile.learningSection}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {learningRows.map(({ icon: Icon, label, option }) => (
              <div
                key={label}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-4 shadow-card sm:px-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                    {label}
                  </p>
                  {option ? (
                    <p className="mt-0.5 truncate font-display text-base font-bold">
                      <span aria-hidden className="mr-1.5">
                        {option.emoji}
                      </span>
                      {option.label}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm font-semibold text-muted">
                      {t.profile.notSet}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </MotionConfig>
  );
}
