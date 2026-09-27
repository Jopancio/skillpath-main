"use client";

import { useMemo } from "react";
import { useProgress } from "@/hooks/use-progress";
import { evaluateBadges, type BadgeWithStatus } from "@/lib/badge-engine";

export type { BadgeWithStatus };

/** Every badge with the signed-in learner's earned status and progress. */
export function useBadges(): BadgeWithStatus[] {
  const { badgeStats, badgeUnlocks } = useProgress();
  return useMemo(() => evaluateBadges(badgeStats, badgeUnlocks), [badgeStats, badgeUnlocks]);
}

/** Returns ids of badges earned (for new-badge detection). */
export function badgeIdsFrom(list: BadgeWithStatus[]): string[] {
  return list.filter((b) => b.earned).map((b) => b.id);
}
