"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useProgress } from "@/hooks/use-progress";
import {
  fetchTopLeaderboard,
  type LeaderboardRow,
} from "@/lib/supabase";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  streak: number;
  rank: number; // 1-based position across all learners
  avatarColor: string;
  isCurrentUser: boolean;
}

/** Palette matching the old dummy board so the look stays familiar. */
const AVATAR_COLORS = [
  "#2563EB",
  "#3B82F6",
  "#EC4899",
  "#38BDF8",
  "#8B5CF6",
  "#1D4ED8",
  "#22C55E",
];

const POLL_MS = 30_000;

function avatarColorFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Real leaderboard backed by the Supabase `leaderboard` table. Fetches the
 * top rows, lightly polls so other learners' gains show up, and merges the
 * current user in from live progress values so their row is never a
 * round-trip behind.
 */
export function useLeaderboard(): {
  entries: LeaderboardEntry[];
  hydrated: boolean;
} {
  const { user, getToken } = useAuth();
  const { xp, streak, userName } = useProgress();

  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // getToken is a function: including it in the fetch effect's deps would
  // restart the fetch whenever its identity changed. Held in a ref so the
  // effect below depends on nothing but the account id.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchTopLeaderboard(10, () => getTokenRef.current());
        // null result means no Supabase configured (localStorage-only mode);
        // fall back to showing just the signed-in learner.
        if (!cancelled) setRows(data ?? []);
      } catch (err) {
        // A failed fetch must NOT leave the board loading forever — the
        // learner's own row needs no network at all. Keep whatever rows we
        // already had and let the poller retry.
        console.warn("[leaderboard] load failed:", err);
        if (!cancelled) setRows((prev) => prev ?? []);
      } finally {
        // Always settle. Previously this sat after the await inside the happy
        // path, so any throw — or any effect restart that landed mid-flight —
        // left `hydrated` false and the dashboard stuck on its skeleton.
        if (!cancelled) setHydrated(true);
      }
    };

    void load();
    const poller = setInterval(() => void load(), POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(poller);
    };
    // Keyed on the account id only — a stable string. Depending on the user
    // OBJECT tore this down and restarted it on every Clerk user refresh.
  }, [userId]);

  return useMemo(() => {
    if (!user || !hydrated) return { entries: [], hydrated: false };

    const selfEntry: LeaderboardEntry = {
      userId: user.id,
      name: userName || user.name || "Anonim",
      xp,
      streak,
      rank: 0,
      avatarColor: avatarColorFor(user.id),
      isCurrentUser: true,
    };

    const others = (rows ?? [])
      .filter((r) => r.user_id !== user.id)
      .map((r): LeaderboardEntry => ({
        userId: r.user_id,
        name: r.display_name || "Anonim",
        xp: r.xp,
        streak: r.streak,
        rank: 0,
        avatarColor: avatarColorFor(r.user_id),
        isCurrentUser: false
      }));

    const merged = [...others, selfEntry].sort(
      (a, b) => b.xp - a.xp || b.streak - a.streak
    );
    const ranked = merged.map((entry, index) => ({ ...entry, rank: index + 1 }));
    const top = ranked.slice(0, 10);
    const selfRanked = ranked.find((e) => e.isCurrentUser);
    // Outside the top slice? Still show your own row at the bottom with your
    // real rank, Duolingo-style.
    if (selfRanked && !top.some((e) => e.isCurrentUser)) {
      top.push(selfRanked);
    }

    return { entries: top, hydrated };
  }, [rows, hydrated, user, xp, streak, userName]);
}
