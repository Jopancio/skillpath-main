import { badges, type Badge, type BadgeMetric } from "@/data/badges";
import { courses, isCourseComplete } from "@/data/courses";

/** Everything a badge requirement can be measured against. */
export type BadgeStats = Record<BadgeMetric, number>;

export interface BadgeWithStatus extends Badge {
  earned: boolean;
  /** YYYY-MM-DD the badge was first unlocked, when known. */
  unlockedAt: string | null;
  /** Current value of the requirement metric, capped at the goal. */
  current: number;
  goal: number;
  percent: number;
}

interface QuizLike {
  score: number;
  passed: boolean;
}

/** Derive badge stats from raw learner progress. */
export function computeBadgeStats(input: {
  xp: number;
  streak: number;
  completedLessons: ReadonlySet<string> | readonly string[];
  quizResults: Record<string, QuizLike>;
  moduleQuizResults?: Record<string, QuizLike>;
}): BadgeStats {
  const done =
    input.completedLessons instanceof Set
      ? (input.completedLessons as ReadonlySet<string>)
      : new Set(input.completedLessons as readonly string[]);
  const finals = Object.values(input.quizResults);
  return {
    lessons: done.size,
    streak: input.streak,
    xp: input.xp,
    perfectQuizzes: finals.filter((r) => r.score === 100).length,
    certificates: finals.filter((r) => r.passed).length,
    coursesCompleted: courses.filter((c) => isCourseComplete(c, done)).length,
    chapterQuizzes: Object.values(input.moduleQuizResults ?? {}).filter((r) => r.passed)
      .length,
  };
}

/** Ids whose requirement is currently met by `stats`. */
export function qualifyingBadgeIds(stats: BadgeStats): string[] {
  return badges
    .filter((b) => stats[b.requirement.metric] >= b.requirement.goal)
    .map((b) => b.id);
}

/**
 * Full badge list with status. A badge stays earned once it is in
 * `unlocks` — a streak that later resets never takes a badge away.
 */
export function evaluateBadges(
  stats: BadgeStats | null,
  unlocks: Record<string, string>
): BadgeWithStatus[] {
  return badges.map((b) => {
    const goal = b.requirement.goal;
    const raw = stats ? stats[b.requirement.metric] : 0;
    const qualifies = raw >= goal;
    const earned = qualifies || b.id in unlocks;
    const current = earned ? goal : Math.min(raw, goal);
    return {
      ...b,
      earned,
      unlockedAt: unlocks[b.id] ?? null,
      current,
      goal,
      percent: goal > 0 ? Math.round((current / goal) * 100) : 100,
    };
  });
}
