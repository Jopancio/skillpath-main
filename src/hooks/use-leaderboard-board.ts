"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useProgress } from "@/hooks/use-progress";
import { useCustomCourses } from "@/hooks/use-custom-courses";
import {
  fetchLeaderboardBy,
  type LeaderboardMetric,
  type LeaderboardRow,
} from "@/lib/supabase";

export interface BoardEntry {
  userId: string;
  name: string;
  value: number;
  xp: number;
  rank: number; // 1-based
  isCurrentUser: boolean;
}

export type BoardStatus = "loading" | "ready" | "error" | "unconfigured";

const LIMIT = 50;
const POLL_MS = 30_000;

function metricOf(row: LeaderboardRow, metric: LeaderboardMetric): number {
  return Number(row[metric] ?? 0) || 0;
}

/**
 * One leaderboard category for /leaderboard. The signed-in learner's row is
 * merged from live progress so it is never a save behind, and pinned at the
 * bottom with their real rank when they fall outside the top list.
 */
export function useLeaderboardBoard(metric: LeaderboardMetric): {
  entries: BoardEntry[];
  status: BoardStatus;
  error: string | null;
} {
  const { user, getToken } = useAuth();
  const progress = useProgress();
  const { customCourses, hydrated: coursesHydrated } = useCustomCourses();
  const { hydrated: progressHydrated, ensureCoursesCreatedAtLeast } = progress;

  // Courses made before the counter existed still count.
  useEffect(() => {
    if (progressHydrated && coursesHydrated) {
      ensureCoursesCreatedAtLeast(customCourses.length);
    }
  }, [progressHydrated, coursesHydrated, customCourses.length, ensureCoursesCreatedAtLeast]);

  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [status, setStatus] = useState<BoardStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on tab switch
    setStatus("loading");
    setRows(null);

    const load = async () => {
      try {
        const res = await fetchLeaderboardBy(metric, LIMIT, () => getTokenRef.current());
        if (cancelled) return;
        if (res.status === "ok") {
          setRows(res.rows);
          setError(null);
          setStatus("ready");
        } else if (res.status === "unconfigured") {
          setRows([]);
          setStatus("unconfigured");
        } else {
          setRows((prev) => prev ?? []);
          setError(res.message);
          setStatus("error");
        }
      } catch (err) {
        if (cancelled) return;
        setRows((prev) => prev ?? []);
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };

    void load();
    const poller = setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(poller);
    };
  }, [userId, metric]);

  const selfValue = useMemo(() => {
    const b = progress.badgeStats;
    switch (metric) {
      case "xp":
        return progress.xp;
      case "streak":
        return progress.streak;
      case "lessons_done":
        return progress.lessonsCompletedCount;
      case "courses_created":
        return progress.coursesCreated;
      case "ai_asks":
        return progress.aiAsks;
      case "quizzes_passed":
        return b.certificates + b.chapterQuizzes;
      case "badges_count":
        return Object.keys(progress.badgeUnlocks).length;
    }
  }, [metric, progress]);

  const entries = useMemo(() => {
    if (!user || rows === null) return [];
    const self: BoardEntry = {
      userId: user.id,
      name: progress.userName || user.name || "Anonim",
      value: selfValue,
      xp: progress.xp,
      rank: 0,
      isCurrentUser: true,
    };
    const others = rows
      .filter((r) => r.user_id !== user.id)
      .map(
        (r): BoardEntry => ({
          userId: r.user_id,
          name: r.display_name || "Anonim",
          value: metricOf(r, metric),
          xp: r.xp,
          rank: 0,
          isCurrentUser: false,
        })
      );
    const ranked = [...others, self]
      .sort((a, b) => b.value - a.value || b.xp - a.xp)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    const top = ranked.slice(0, LIMIT);
    const selfRanked = ranked.find((e) => e.isCurrentUser);
    if (selfRanked && !top.some((e) => e.isCurrentUser)) top.push(selfRanked);
    return top;
  }, [rows, user, metric, selfValue, progress.userName, progress.xp]);

  return { entries, status, error };
}
