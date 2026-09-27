"use client";

import type { CSSProperties } from "react";
import { Lock } from "lucide-react";
import { BADGE_TIERS, type Badge } from "@/data/badges";
import { DynamicIcon } from "@/components/ui/icon-map";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-10 w-10", icon: "h-4.5 w-4.5", lock: "h-4 w-4", lockIcon: "h-2 w-2" },
  md: { box: "h-14 w-14", icon: "h-6 w-6", lock: "h-5 w-5", lockIcon: "h-2.5 w-2.5" },
  lg: { box: "h-20 w-20", icon: "h-9 w-9", lock: "h-6 w-6", lockIcon: "h-3 w-3" },
} as const;

/** Round badge emblem with a tier-coloured ring; greyed + padlock when locked. */
export function BadgeMedal({
  badge,
  earned,
  size = "md",
  className,
}: {
  badge: Badge;
  earned: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  const tier = BADGE_TIERS[badge.tier];
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full ring-[3px] ring-offset-2 ring-offset-card",
        s.box,
        !earned && "bg-border/50 text-muted ring-border grayscale",
        className
      )}
      style={
        earned
          ? ({
              backgroundColor: `${badge.color}22`,
              color: badge.color,
              // Tailwind ring colour via CSS variable so each tier gets its own.
              "--tw-ring-color": tier.color,
            } as CSSProperties)
          : undefined
      }
    >
      <DynamicIcon name={badge.icon} className={s.icon} />
      {!earned && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 grid place-items-center rounded-full border border-border bg-card text-muted",
            s.lock
          )}
        >
          <Lock aria-hidden className={s.lockIcon} />
        </span>
      )}
    </span>
  );
}

/** Small pill naming the badge tier. */
export function TierPill({ badge, label }: { badge: Badge; label: string }) {
  const tier = BADGE_TIERS[badge.tier];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
      style={{ backgroundColor: `${tier.color}1f`, color: tier.color }}
    >
      {label}
    </span>
  );
}
