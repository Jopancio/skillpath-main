"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { useI18n, pick } from "@/lib/i18n";
import { team, initialsOf } from "@/data/team";

/** How long each profile stays in front before the carousel advances. */
const AUTOPLAY_MS = 4500;
/** Drag distance (px) or fling velocity that counts as a swipe. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;

/**
 * 3D "coverflow" carousel for the team: the active profile sits in front,
 * its neighbours are tilted and pushed back. Autoplays (paused on hover,
 * focus, or reduced-motion), and supports swipe, arrows, dots and keyboard.
 */
export function TeamCarousel() {
  const { locale } = useI18n();
  const en = locale === "en";
  const reduce = useReducedMotion();
  const n = team.length;
  const half = Math.floor(n / 2);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: number) => setActive((a) => (a + dir + n) % n), [n]);

  // `active` is a dependency on purpose: any manual navigation restarts the timer.
  useEffect(() => {
    if (reduce || paused || n < 2) return;
    const id = window.setTimeout(() => go(1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [reduce, paused, go, n, active]);

  /** Signed distance of card i from the front card, wrapped around the ring. */
  const offsetOf = (i: number) => ((i - active + n + half) % n) - half;

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) go(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) go(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  const current = team[active];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div
        role="region"
        aria-roledescription="carousel"
        aria-label={en ? "Team profiles" : "Profil tim"}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPanEnd={onPanEnd}
        style={{ touchAction: "pan-y" }}
        className="relative mx-auto h-[410px] w-full cursor-grab rounded-3xl outline-none [perspective:1200px] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {team.map((member, i) => {
          const off = offsetOf(i);
          const abs = Math.abs(off);
          const isActive = off === 0;
          const Icon = member.icon;

          return (
            <motion.article
              key={member.id}
              aria-hidden={!isActive}
              onClick={() => !isActive && setActive(i)}
              initial={false}
              animate={{
                x: `${off * 62}%`,
                scale: isActive ? 1 : 0.82,
                rotateY: off * -24,
                opacity: abs > 1 ? 0 : isActive ? 1 : 0.5,
                filter: isActive ? "blur(0px)" : "blur(1.5px)",
              }}
              transition={
                reduce ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 28 }
              }
              style={{ zIndex: 10 - abs }}
              className={`absolute left-1/2 top-2 -ml-[min(155px,39vw)] w-[min(310px,78vw)] select-none overflow-hidden rounded-3xl border bg-card shadow-[0_24px_60px_-30px_rgb(37_99_235/.55)] ${
                isActive ? "border-primary/30" : "cursor-pointer border-border"
              }`}
            >
              {/* Animated gradient banner */}
              <div className="team-card-banner relative h-24 bg-gradient-to-r from-primary via-secondary to-deep-blue">
                <span className="absolute right-4 top-3 font-mono text-xs font-bold text-white/70">
                  0{i + 1} / 0{n}
                </span>
              </div>

              <div className="relative -mt-11 px-6 pb-6">
                <div className="relative h-[84px] w-[84px]">
                  {/* Rotating ring around the avatar on the front card */}
                  {isActive && !reduce && (
                    <motion.span
                      aria-hidden
                      className="absolute -inset-1 rounded-[1.4rem] bg-[conic-gradient(from_0deg,var(--color-primary),var(--color-secondary),transparent,var(--color-primary))]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      width={84}
                      height={84}
                      draggable={false}
                      className="relative h-[84px] w-[84px] rounded-[1.25rem] border-4 border-card bg-muted object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="relative flex h-[84px] w-[84px] items-center justify-center rounded-[1.25rem] border-4 border-card bg-gradient-to-br from-primary to-deep-blue font-display text-2xl font-bold text-white"
                    >
                      {initialsOf(member.name)}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-display text-xl font-bold leading-tight">
                  {member.name}
                </h3>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  <Icon className="h-3.5 w-3.5" />
                  {member.role}
                </span>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                  {pick(locale, member.bio)}
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {member.focus.map((item, k) => (
                    <motion.li
                      key={pick(locale, item)}
                      initial={false}
                      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 4 }}
                      transition={{ delay: isActive && !reduce ? 0.15 + k * 0.07 : 0 }}
                      className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />
                      {pick(locale, item)}
                    </motion.li>
                  ))}
                </ul>

                {isActive && member.links && member.links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:border-primary hover:text-primary"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {/* Controls: arrows + dots whose active fill tracks the autoplay timer */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={en ? "Previous profile" : "Profil sebelumnya"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted transition-all hover:-translate-x-0.5 hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {team.map((member, i) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={member.name}
              aria-current={i === active}
              className={`relative h-2 overflow-hidden rounded-full bg-border transition-all duration-300 ${
                i === active ? "w-10" : "w-2 hover:bg-primary/40"
              }`}
            >
              {i === active && (
                <motion.span
                  key={`${active}-${paused}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  initial={{ width: reduce || paused ? "100%" : "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: reduce || paused ? 0 : AUTOPLAY_MS / 1000,
                    ease: "linear",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label={en ? "Next profile" : "Profil berikutnya"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted transition-all hover:translate-x-0.5 hover:border-primary hover:text-primary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {current.name}, {current.role}
      </p>
    </div>
  );
}
