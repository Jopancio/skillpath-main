"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { daysBetween, todayKey, xpProgress } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  persistUserData,
  supabase,
  upsertLeaderboardEntry,
  upsertPublicProfile,
} from "@/lib/supabase";
import { computeBadgeStats, qualifyingBadgeIds, type BadgeStats } from "@/lib/badge-engine";
import { MAX_FEATURED_BADGES } from "@/data/badges";

const BASE_STORAGE_KEY = "skillpath-progress-v1";

export interface QuizResult {
  score: number; // percentage 0-100
  passed: boolean;
  date: string;
}

export interface OnboardingData {
  interests: string[]; // course ids picked by the user
  reason: string; // "career" | "business" | "hobby" | "school"
  knowledgeLevel: string; // "beginner" | "some" | "comfortable"
  learningExp: string; // "self" | "course" | "first"
  dailyGoalMinutes: number; // 5 | 10 | 15 | 20
  // Personalization answers (steps 7-12)
  focusEnemy?: string; // "phone" | "people" | "boredom" | "tired"
  workType?: number; // 0-100 (0 = speed, 100 = accuracy)
  memory?: number; // 0-100 (0 = forget details, 100 = hard grasp concepts)
  learningStyle?: number; // 0-100 (0 = theory first, 100 = straight to practice)
  graspMethod?: string; // "example" | "visual" | "analogy" | "try"
  ambition?: number; // 1-10
}

/** User-facing profile answers, sent to the AI course generator. */
export interface OnboardingProfile {
  name: string;
  reason: string;
  knowledgeLevel: string;
  learningExp: string;
  dailyGoalMinutes: number;
  focusEnemy?: string;
  workType?: number;
  memory?: number;
  learningStyle?: number;
  graspMethod?: string;
  ambition?: number;
}

/** Result of the AI diagnostic quiz at the end of onboarding. */
export interface PlacementResult {
  level: string; // "beginner" | "intermediate" | "advanced"
  message: string;
  tips: string[];
  strengths: string[];
  scorePercent: number;
  date: string;
}

interface PersistedState {
  xp: number;
  streak: number;
  lastActive: string; // YYYY-MM-DD
  completedLessons: string[];
  quizResults: Record<string, QuizResult>;
  /** End-of-chapter quiz results, keyed `${courseId}::${moduleId}` (kept separate from final-quiz results). */
  moduleQuizResults?: Record<string, QuizResult>;
  userName: string;
  onboarded: boolean;
  onboarding: OnboardingData | null;
  placement: PlacementResult | null;
  /** Short public bio shown on /profile/[id]. */
  bio?: string;
  /** Badge ids pinned to the top of the public profile (max 3). */
  featuredBadges?: string[];
  /** Badge id → YYYY-MM-DD first unlocked. Earning is permanent. */
  badgeUnlocks?: Record<string, string>;
  /** Questions sent to the course AI assistant (Top AI Ask board). */
  aiAsks?: number;
  /** AI-generated courses this learner created (Top Course Creator board). */
  coursesCreated?: number;
}

const initialState: PersistedState = {
  xp: 0,
  streak: 0,
  lastActive: "",
  completedLessons: [],
  quizResults: {},
  moduleQuizResults: {},
  userName: "",
  onboarded: false,
  onboarding: null,
  placement: null,
  bio: "",
  featuredBadges: [],
  badgeUnlocks: {},
  aiAsks: 0,
  coursesCreated: 0,
};

interface ProgressContextValue {
  xp: number;
  streak: number;
  /** YYYY-MM-DD of the last active day (drives the dashboard streak-risk nudge). */
  lastActive: string;
  level: number;
  levelProgress: { current: number; needed: number; percent: number };
  completedLessons: ReadonlySet<string>;
  quizResults: Record<string, QuizResult>;
  /** Chapter-quiz results keyed `${courseId}::${moduleId}`. */
  moduleQuizResults: Record<string, QuizResult>;
  userName: string;
  onboarded: boolean;
  onboarding: OnboardingData | null;
  placement: PlacementResult | null;
  lessonsCompletedCount: number;
  hydrated: boolean;
  completeLesson: (lessonId: string, xp: number) => void;
  recordQuiz: (courseId: string, score: number, passed: boolean) => void;
  recordModuleQuiz: (
    courseId: string,
    moduleId: string,
    score: number,
    passed: boolean
  ) => void;
  setUserName: (name: string) => void;
  completeOnboarding: (data: OnboardingData & { name?: string }) => void;
  setPlacement: (result: PlacementResult) => void;
  setDailyGoal: (minutes: number) => void;
  resetAll: () => void;
  bio: string;
  setBio: (bio: string) => void;
  featuredBadges: string[];
  setFeaturedBadges: (ids: string[]) => void;
  badgeUnlocks: Record<string, string>;
  badgeStats: BadgeStats;
  /** Badges unlocked during this visit, oldest first — drives the unlock toast. */
  recentUnlocks: string[];
  dismissUnlock: (id: string) => void;
  aiAsks: number;
  coursesCreated: number;
  /** Count one question sent to the course AI assistant. */
  recordAiAsk: () => void;
  /** Count one AI-generated course the learner created. */
  recordCourseCreated: () => void;
  /** Raise the created-courses counter to at least `min` (backfill). */
  ensureCoursesCreatedAtLeast: (min: number) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Remount per user so each account gets its own storage slice.
  return (
    <ProgressInner
      key={user?.id ?? "anonymous"}
      userId={user?.id ?? null}
      storageKey={user ? `${BASE_STORAGE_KEY}:${user.id}` : null}
    >
      {children}
    </ProgressInner>
  );
}

function ProgressInner({
  children,
  userId,
  storageKey,
}: {
  children: ReactNode;
  userId: string | null;
  storageKey: string | null;
}) {
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(!storageKey);
  const [hydrationFailed, setHydrationFailed] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, getToken } = useAuth();

  const migrateState = useCallback((raw: PersistedState): PersistedState => {
    // Migrate states persisted before onboarding fields existed
    const migrated: PersistedState = {
      ...raw,
      onboarded: raw.onboarded ?? false,
      onboarding: raw.onboarding ?? null,
      placement: raw.placement ?? null,
      moduleQuizResults: raw.moduleQuizResults ?? {},
      bio: raw.bio ?? "",
      featuredBadges: raw.featuredBadges ?? [],
      badgeUnlocks: raw.badgeUnlocks ?? {},
      aiAsks: raw.aiAsks ?? 0,
      coursesCreated: raw.coursesCreated ?? 0,
    };
    // Streak continuity check
    const today = todayKey();
    if (migrated.lastActive && migrated.lastActive !== today) {
      const gap = daysBetween(migrated.lastActive, today);
      if (gap > 1) migrated.streak = 0;
    }
    return migrated;
  }, []);

  // Load once on mount (keyed remount per user)
  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration from storage
        setState(migrateState(JSON.parse(raw) as PersistedState));
      }
    } catch {
      // corrupted storage -> start fresh
    }
    // Do not expose writable defaults until the account's remote copy is known.
    void (async () => {
      try {
        if (userId && supabase) {
          const token = await getToken();
          if (!token) throw new Error("Missing session token");
          const { data } = await supabase.from("progress").select("data")
            .eq("user_id", userId).setHeader("Authorization", `Bearer ${token}`)
            .abortSignal(AbortSignal.timeout(15000)).maybeSingle().throwOnError();
          if (cancelled) return;
          if (data?.data) setState(migrateState(data.data as PersistedState));
        }
        if (!cancelled) setHydrated(true);
      } catch {
        // A failed read is not an empty account. Never upload defaults over it.
        if (!cancelled) setHydrationFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable per remount
  }, []);

  // ── Badge system ─────────────────────────────────────────────
  const badgeStats = useMemo(
    () =>
      computeBadgeStats({
        xp: state.xp,
        streak: state.streak,
        completedLessons: state.completedLessons,
        quizResults: state.quizResults,
        moduleQuizResults: state.moduleQuizResults,
      }),
    [state.xp, state.streak, state.completedLessons, state.quizResults, state.moduleQuizResults]
  );
  const [recentUnlocks, setRecentUnlocks] = useState<string[]>([]);
  // The first sync after load is silent: whatever already qualifies then was
  // earned earlier (or on another device) and must not flood the toast.
  const badgeSyncPrimed = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    const unlocks = state.badgeUnlocks ?? {};
    const fresh = qualifyingBadgeIds(badgeStats).filter((id) => !(id in unlocks));
    const announce = badgeSyncPrimed.current;
    badgeSyncPrimed.current = true;
    if (fresh.length === 0) return;
    const today = todayKey();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived unlock bookkeeping
    setState((s) => {
      const next = { ...(s.badgeUnlocks ?? {}) };
      for (const id of fresh) if (!(id in next)) next[id] = today;
      return { ...s, badgeUnlocks: next };
    });
    if (announce) setRecentUnlocks((q) => [...q, ...fresh.filter((id) => !q.includes(id))]);
  }, [hydrated, badgeStats, state.badgeUnlocks]);

  const dismissUnlock = useCallback((id: string) => {
    setRecentUnlocks((q) => q.filter((x) => x !== id));
  }, []);

  // Debounced persist
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // Remote persistence still works when local storage is unavailable.
      }
      if (userId && supabase) {
        const displayName = state.userName || user?.name || "Anonim";
        void persistUserData("progress", userId, state, getToken);
        // Publish the stats that power the dashboard leaderboard.
        void upsertLeaderboardEntry(
          userId,
          {
            displayName,
            xp: state.xp,
            streak: state.streak,
            lessonsDone: state.completedLessons.length,
            coursesCreated: state.coursesCreated ?? 0,
            aiAsks: state.aiAsks ?? 0,
            quizzesPassed: badgeStats.certificates + badgeStats.chapterQuizzes,
            certificates: badgeStats.certificates,
            badgesCount: Object.keys(state.badgeUnlocks ?? {}).length,
          },
          getToken
        );
        // Publish the public profile other learners see at /profile/[id].
        void upsertPublicProfile(
          userId,
          {
            display_name: displayName,
            bio: state.bio ?? "",
            avatar_url: user?.avatarUrl ?? null,
            xp: state.xp,
            streak: state.streak,
            lessons_done: badgeStats.lessons,
            courses_completed: badgeStats.coursesCompleted,
            certificates: badgeStats.certificates,
            badges: state.badgeUnlocks ?? {},
            featured_badges: state.featuredBadges ?? [],
          },
          getToken
        );
      }
    }, 150);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, hydrated, storageKey, userId, user, getToken, badgeStats]);

  const touchStreak = useCallback((s: PersistedState): PersistedState => {
    const today = todayKey();
    if (s.lastActive === today) return s;
    const yesterday = s.lastActive ? daysBetween(s.lastActive, today) === 1 : false;
    return {
      ...s,
      lastActive: today,
      streak: s.lastActive ? (yesterday ? s.streak + 1 : 1) : 1,
    };
  }, []);

  const completeLesson = useCallback(
    (lessonId: string, xp: number) => {
      setState((s) => {
        if (s.completedLessons.includes(lessonId)) return s;
        const next: PersistedState = {
          ...s,
          completedLessons: [...s.completedLessons, lessonId],
          xp: s.xp + xp,
        };
        return touchStreak(next);
      });
    },
    [touchStreak]
  );

  const recordQuiz = useCallback(
    (courseId: string, score: number, passed: boolean) => {
      setState((s) => {
        const prev = s.quizResults[courseId];
        const firstPass = passed && !prev?.passed;
        const bestScore = Math.max(prev?.score ?? 0, score);
        const next: PersistedState = {
          ...s,
          xp: firstPass ? s.xp + 100 : s.xp,
          quizResults: {
            ...s.quizResults,
            [courseId]: {
              score: bestScore,
              passed: (prev?.passed ?? false) || passed,
              date: todayKey(),
            },
          },
        };
        return touchStreak(next);
      });
    },
    [touchStreak]
  );

  const setUserName = useCallback((name: string) => {
    setState((s) => ({ ...s, userName: name }));
  }, []);

  const setBio = useCallback((bio: string) => {
    setState((s) => ({ ...s, bio: bio.slice(0, 160) }));
  }, []);

  // Only earned badges can be pinned; unknown/locked ids are dropped.
  const setFeaturedBadges = useCallback((ids: string[]) => {
    setState((s) => {
      const unlocks = s.badgeUnlocks ?? {};
      const clean = [...new Set(ids)].filter((id) => id in unlocks).slice(0, MAX_FEATURED_BADGES);
      return { ...s, featuredBadges: clean };
    });
  }, []);

  // Chapter quizzes live in their own record so badges/certificates that read
  // `quizResults` only ever react to the final course quiz.
  const recordModuleQuiz = useCallback(
    (courseId: string, moduleId: string, score: number, passed: boolean) => {
      const key = `${courseId}::${moduleId}`;
      setState((s) => {
        const prev = s.moduleQuizResults?.[key];
        const firstPass = passed && !prev?.passed;
        const bestScore = Math.max(prev?.score ?? 0, score);
        const next: PersistedState = {
          ...s,
          xp: firstPass ? s.xp + 40 : s.xp,
          moduleQuizResults: {
            ...(s.moduleQuizResults ?? {}),
            [key]: {
              score: bestScore,
              passed: (prev?.passed ?? false) || passed,
              date: todayKey(),
            },
          },
        };
        return touchStreak(next);
      });
    },
    [touchStreak]
  );

  const completeOnboarding = useCallback(
    (data: OnboardingData & { name?: string }) => {
      if (!hydrated || !userId) return;
      setState((s) => {
        if (s.onboarded) return s;
        const next: PersistedState = {
          ...s,
          onboarded: true,
          onboarding: {
            interests: data.interests,
            reason: data.reason,
            knowledgeLevel: data.knowledgeLevel,
            learningExp: data.learningExp,
            dailyGoalMinutes: data.dailyGoalMinutes,
            focusEnemy: data.focusEnemy,
            workType: data.workType,
            memory: data.memory,
            learningStyle: data.learningStyle,
            graspMethod: data.graspMethod,
            ambition: data.ambition,
          },
          userName: data.name?.trim() ? data.name.trim() : s.userName,
        };
        // Count onboarding day as an active day so the streak starts
        return touchStreak(next);
      });
    },
    [touchStreak, hydrated, userId]
  );

  const recordAiAsk = useCallback(() => {
    setState((s) => ({ ...s, aiAsks: (s.aiAsks ?? 0) + 1 }));
  }, []);

  const recordCourseCreated = useCallback(() => {
    setState((s) => ({ ...s, coursesCreated: (s.coursesCreated ?? 0) + 1 }));
  }, []);

  // Backfill for courses created before the counter existed.
  const ensureCoursesCreatedAtLeast = useCallback((min: number) => {
    setState((s) => ((s.coursesCreated ?? 0) >= min ? s : { ...s, coursesCreated: min }));
  }, []);

  const setPlacement = useCallback((result: PlacementResult) => {
    setState((s) => ({ ...s, placement: result }));
  }, []);

  const setDailyGoal = useCallback((minutes: number) => {
    setState((s) =>
      s.onboarding
        ? { ...s, onboarding: { ...s.onboarding, dailyGoalMinutes: minutes } }
        : s
    );
  }, []);

  const resetAll = useCallback(() => {
    setState(initialState);
    if (storageKey) window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  const lessonsCompletedCount = state.completedLessons.length;
  const { level, current, needed, percent } = xpProgress(state.xp);

  const value = useMemo<ProgressContextValue>(
    () => ({
      xp: state.xp,
      streak: state.streak,
      lastActive: state.lastActive,
      level,
      levelProgress: {
        current,
        needed,
        percent,
      },
      completedLessons: new Set(state.completedLessons),
      quizResults: state.quizResults,
      moduleQuizResults: state.moduleQuizResults ?? {},
      userName: state.userName,
      onboarded: state.onboarded,
      onboarding: state.onboarding,
      placement: state.placement,
      lessonsCompletedCount,
      hydrated,
      completeLesson,
      recordQuiz,
      recordModuleQuiz,
      setUserName,
      completeOnboarding,
      setPlacement,
      setDailyGoal,
      resetAll,
      bio: state.bio ?? "",
      setBio,
      featuredBadges: state.featuredBadges ?? [],
      setFeaturedBadges,
      badgeUnlocks: state.badgeUnlocks ?? {},
      badgeStats,
      recentUnlocks,
      dismissUnlock,
      aiAsks: state.aiAsks ?? 0,
      coursesCreated: state.coursesCreated ?? 0,
      recordAiAsk,
      recordCourseCreated,
      ensureCoursesCreatedAtLeast,
    }),
    [state, lessonsCompletedCount, hydrated, completeLesson, recordQuiz, recordModuleQuiz, setUserName, completeOnboarding, setPlacement, setDailyGoal, resetAll, level, current, needed, percent, setBio, setFeaturedBadges, badgeStats, recentUnlocks, dismissUnlock, recordAiAsk, recordCourseCreated, ensureCoursesCreatedAtLeast]
  );

  if (hydrationFailed) {
    return <div role="alert" className="p-8 text-center">
      <p>Data akun gagal dimuat. / Could not load account data.</p>
      <button type="button" onClick={() => window.location.reload()}>Coba lagi / Retry</button>
    </div>;
  }

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
