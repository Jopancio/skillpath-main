"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";
import { useI18n, pick } from "@/lib/i18n";
import { getBadge } from "@/data/badges";
import { BadgeMedal } from "./BadgeMedal";

const SHOW_MS = 5000;

/** Pops a card for each badge unlocked during this visit, one at a time. */
export function BadgeUnlockToast() {
  const { recentUnlocks, dismissUnlock } = useProgress();
  const { locale } = useI18n();
  const en = locale === "en";
  const currentId = recentUnlocks[0];
  const badge = currentId ? getBadge(currentId) : undefined;

  useEffect(() => {
    if (!currentId) return;
    const id = window.setTimeout(() => dismissUnlock(currentId), SHOW_MS);
    return () => window.clearTimeout(id);
  }, [currentId, dismissUnlock]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {badge && (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3.5 rounded-2xl border border-secondary/40 bg-card p-3.5 text-foreground shadow-gold-glow"
          >
            <motion.span
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
            >
              <BadgeMedal badge={badge} earned size="sm" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                {en ? "Badge unlocked!" : "Badge baru terbuka!"}
              </p>
              <p className="truncate font-display text-sm font-extrabold">{pick(locale, badge.name)}</p>
              <Link
                href="/badges"
                onClick={() => dismissUnlock(badge.id)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {en ? "See all badges" : "Lihat semua badge"}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => dismissUnlock(badge.id)}
              aria-label={en ? "Close" : "Tutup"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
