"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MotionConfig, motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Eye,
  Flame,
  GraduationCap,
  Pencil,
  Pin,
  Trophy,
  UserX,
  Zap,
} from "lucide-react";
import { useI18n, pick } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useProgress } from "@/hooks/use-progress";
import { fetchPublicProfile } from "@/lib/supabase";
import { badges, getBadge, BADGE_TIERS, type Badge } from "@/data/badges";
import { BadgeMedal, TierPill } from "@/components/badges/BadgeMedal";
import { xpProgress } from "@/lib/utils";

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/** Normalised shape both the live (self) and fetched (others) profiles map into. */
interface ProfileView {
  name: string;
  bio: string;
  avatarUrl: string | null;
  xp: number;
  streak: number;
  lessons: number;
  coursesCompleted: number;
  certificates: number;
  unlocks: Record<string, string>;
  featured: string[];
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; profile: ProfileView }
  | { status: "missing" }
  | { status: "error" };

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const profileId = decodeURIComponent(params?.id ?? "");
  const { locale } = useI18n();
  const en = locale === "en";
  const { user, getToken } = useAuth();
  const progress = useProgress();
  const isSelf = !!user && user.id === profileId;

  // Your own profile renders from live progress — instant, and correct
  // even before the first publish reaches Supabase.
  const selfView = useMemo<ProfileView | null>(() => {
    if (!isSelf || !progress.hydrated) return null;
    return {
      name: progress.userName || user?.name || "?",
      bio: progress.bio,
      avatarUrl: user?.avatarUrl ?? null,
      xp: progress.xp,
      streak: progress.streak,
      lessons: progress.badgeStats.lessons,
      coursesCompleted: progress.badgeStats.coursesCompleted,
      certificates: progress.badgeStats.certificates,
      unlocks: progress.badgeUnlocks,
      featured: progress.featuredBadges,
    };
  }, [isSelf, progress, user]);

  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [remote, setRemote] = useState<LoadState>({ status: "loading" });
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId || isSelf || !profileId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on id change
    setRemote({ status: "loading" });
    (async () => {
      try {
        const row = await fetchPublicProfile(profileId, () => getTokenRef.current());
        if (cancelled) return;
        if (!row || row === "missing") {
          setRemote({ status: "missing" });
          return;
        }
        setRemote({
          status: "ready",
          profile: {
            name: row.display_name || "Anonim",
            bio: row.bio ?? "",
            avatarUrl: row.avatar_url,
            xp: row.xp,
            streak: row.streak,
            lessons: row.lessons_done,
            coursesCompleted: row.courses_completed,
            certificates: row.certificates,
            unlocks: row.badges ?? {},
            featured: row.featured_badges ?? [],
          },
        });
      } catch (err) {
        console.warn("[profile] load failed:", err);
        // Always settle — never leave the page on its skeleton.
        if (!cancelled) setRemote({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isSelf, profileId]);

  const state: LoadState = isSelf
    ? selfView
      ? { status: "ready", profile: selfView }
      : { status: "loading" }
    : remote;

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:py-12">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {en ? "Back" : "Kembali"}
        </Link>

        {isSelf && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="h-4 w-4 text-primary" />
              {en ? "This is how other learners see your profile." : "Beginilah learner lain melihat profilmu."}
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Pencil className="h-3.5 w-3.5" />
              {en ? "Edit profile" : "Edit profil"}
            </Link>
          </div>
        )}

        {state.status === "loading" && <ProfileSkeleton />}
        {state.status === "missing" && (
          <EmptyState
            title={en ? "Profile not found" : "Profil tidak ditemukan"}
            body={
              en
                ? "This learner hasn't published a profile yet, or the link is wrong."
                : "Learner ini belum memiliki profil publik, atau tautannya salah."
            }
          />
        )}
        {state.status === "error" && (
          <EmptyState
            title={en ? "Couldn't load profile" : "Gagal memuat profil"}
            body={en ? "Check your connection and try again." : "Periksa koneksimu lalu coba lagi."}
            retry
          />
        )}
        {state.status === "ready" && <ProfileBody profile={state.profile} />}
      </div>
    </MotionConfig>
  );
}

function ProfileBody({ profile }: { profile: ProfileView }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const { level } = xpProgress(profile.xp);
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const earned = badges.filter((b) => b.id in profile.unlocks);
  const featured = profile.featured
    .map((id) => getBadge(id))
    .filter((b): b is Badge => !!b && b.id in profile.unlocks);

  const stats = [
    { icon: Zap, label: "XP", value: profile.xp },
    { icon: GraduationCap, label: en ? "Level" : "Level", value: level },
    { icon: Flame, label: en ? "Day streak" : "Hari streak", value: profile.streak },
    { icon: BookOpen, label: en ? "Lessons" : "Pelajaran", value: profile.lessons },
    { icon: Trophy, label: en ? "Courses done" : "Kursus selesai", value: profile.coursesCompleted },
    { icon: Award, label: en ? "Certificates" : "Sertifikat", value: profile.certificates },
  ];

  return (
    <motion.div variants={groupVariants} initial="hidden" animate="show">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card"
      >
        <div aria-hidden className="h-24 bg-gradient-to-r from-primary via-primary/70 to-secondary sm:h-32" />
        <div className="relative px-5 pb-6 sm:px-8">
          <span className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-deep-orange text-2xl font-extrabold text-white shadow-card ring-4 ring-card sm:-mt-14 sm:h-28 sm:w-28">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initials
            )}
          </span>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{profile.name}</h1>
            <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-extrabold text-secondary">
              Level {level}
            </span>
          </div>
          <p className="mt-2 max-w-xl whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
            {profile.bio || (en ? "No bio yet." : "Belum ada bio.")}
          </p>

          {/* Featured badges sit in the header, like a trophy shelf. */}
          {featured.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {featured.map((b) => (
                <div
                  key={b.id}
                  title={pick(locale, b.description)}
                  className="flex items-center gap-2.5 rounded-2xl border border-secondary/40 bg-background/70 py-2 pl-2 pr-4"
                >
                  <BadgeMedal badge={b} earned size="sm" />
                  <div>
                    <p className="text-xs font-extrabold leading-tight">{pick(locale, b.name)}</p>
                    <p className="flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Pin className="h-2.5 w-2.5" />
                      {en ? "Featured" : "Unggulan"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <motion.section variants={itemVariants} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-2.5 font-display text-2xl font-extrabold tabular-nums">{value}</p>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
          </div>
        ))}
      </motion.section>

      {/* ── Earned badges ──────────────────────────────────── */}
      <motion.section variants={itemVariants} className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            {en ? "Badges" : "Badge"}
          </h2>
          <span className="text-sm font-bold tabular-nums text-muted">
            {earned.length}/{badges.length}
          </span>
        </div>
        {earned.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm font-semibold text-muted">
            {en ? "No badges earned yet." : "Belum ada badge yang diraih."}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {earned.map((b) => (
              <div
                key={b.id}
                title={pick(locale, b.description)}
                className="flex flex-col items-center rounded-2xl border border-secondary/30 bg-card p-4 text-center shadow-card"
              >
                <BadgeMedal badge={b} earned size="md" />
                <p className="mt-2.5 line-clamp-2 text-xs font-extrabold leading-tight">{pick(locale, b.name)}</p>
                <div className="mt-1.5">
                  <TierPill badge={b} label={pick(locale, BADGE_TIERS[b.tier].label)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-3xl border border-border bg-card/60" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card/60" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ title, body, retry }: { title: string; body: string; retry?: boolean }) {
  const { locale } = useI18n();
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-border/50 text-muted">
        <UserX className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-display text-xl font-extrabold">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      {retry && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white"
        >
          {locale === "en" ? "Try again" : "Coba lagi"}
        </button>
      )}
    </div>
  );
}
