"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { ArrowUpRight, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  /** The event itself, e.g. "Streak 5 hari". */
  title: string;
  /** Supporting detail, shown after the time on the second line. */
  subtitle: string;
  /** Short left-hand label on the second line: a time, a score, an XP total. */
  time: string;
  /** Optional chip on the title row, e.g. the streak count. */
  meta?: string;
  /** Icon for that chip. Defaults to RotateCcw, as in the original component. */
  icon?: LucideIcon;
}

interface NotificationListProps {
  /** Required on purpose: this card never renders invented sample data. */
  items: NotificationItem[];
  /** Footer label while collapsed. */
  label: string;
  /** Footer label revealed on hover/focus. */
  viewAllLabel: string;
  /**
   * Makes the revealed label a real link. Typed as Link's own href so it
   * satisfies Next 16 typed routes instead of accepting any string.
   */
  viewAllHref?: React.ComponentProps<typeof Link>["href"];
  className?: string;
}

const spring: Transition = { type: "spring", stiffness: 300, damping: 26 };
const textSwitch: Transition = { duration: 0.22, ease: "easeInOut" };

/**
 * Collapsed, the cards overlap into a stack; -44px is tuned to this card's
 * own height (two lines at py-2.5) so roughly 14px of each card still peeks
 * out. Change the padding and this number has to follow.
 */
const cardVariants = (i: number): Variants => ({
  collapsed: { marginTop: i === 0 ? 0 : -44, scaleX: 1 - i * 0.05 },
  expanded: { marginTop: i === 0 ? 0 : 4, scaleX: 1 },
});

const labelVariants: Variants = {
  collapsed: { opacity: 1, y: 0, pointerEvents: "auto" },
  expanded: { opacity: 0, y: -16, pointerEvents: "none" },
};

const viewAllVariants: Variants = {
  collapsed: { opacity: 0, y: 16, pointerEvents: "none" },
  expanded: { opacity: 1, y: 0, pointerEvents: "auto" },
};

export function NotificationList({
  items,
  label,
  viewAllLabel,
  viewAllHref,
  className,
}: NotificationListProps) {
  const reduceMotion = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <motion.div
      // Hover is the primary gesture; focus keeps it reachable by keyboard,
      // and tap covers touch, where hover does not exist.
      initial="collapsed"
      whileHover="expanded"
      whileFocus="expanded"
      whileTap="expanded"
      animate={reduceMotion ? "expanded" : undefined}
      tabIndex={0}
      className={cn(
        "w-full space-y-3 rounded-3xl border border-border bg-card/50 p-3 shadow-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
    >
      <div role="list">
        {items.map((item, i) => {
          const Icon = item.icon ?? RotateCcw;
          return (
            <motion.div
              key={item.id}
              role="listitem"
              className="relative rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm transition-shadow duration-200 hover:shadow-card"
              variants={cardVariants(i)}
              transition={reduceMotion ? { duration: 0 } : spring}
              style={{ zIndex: items.length - i }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-foreground">
                  {item.title}
                </p>
                {item.meta && (
                  <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-muted">
                    <Icon aria-hidden className="h-3 w-3" />
                    <span className="tabular-nums">{item.meta}</span>
                  </span>
                )}
              </div>
              <p className="truncate text-xs font-medium text-muted">
                <span className="tabular-nums">{item.time}</span>
                {" — "}
                <span>{item.subtitle}</span>
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
        >
          {items.length}
        </span>
        <span className="grid min-w-0">
          <motion.span
            className="col-start-1 row-start-1 truncate text-sm font-bold text-muted"
            variants={labelVariants}
            transition={textSwitch}
          >
            {label}
          </motion.span>
          <motion.span
            className="col-start-1 row-start-1 truncate text-sm font-bold text-primary"
            variants={viewAllVariants}
            transition={textSwitch}
          >
            {viewAllHref ? (
              <Link
                href={viewAllHref}
                className="flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {viewAllLabel}
                <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <span className="flex items-center gap-1">
                {viewAllLabel}
                <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0" />
              </span>
            )}
          </motion.span>
        </span>
      </div>
    </motion.div>
  );
}

export default NotificationList;
