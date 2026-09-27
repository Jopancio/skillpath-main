"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CompassIcon, HomeIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useI18n } from "@/lib/i18n";

const copy = {
  id: {
    line1: "Halaman yang kamu cari mungkin sudah",
    line2: "dipindahkan atau tidak pernah ada.",
    home: "Ke Beranda",
    explore: "Jelajahi Kursus",
  },
  en: {
    line1: "The page you're looking for might have been",
    line2: "moved or doesn't exist.",
    home: "Go Home",
    explore: "Explore Courses",
  },
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

// Parent orchestrates the opening sequence: digits -> copy -> buttons.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const digit: Variants = {
  hidden: { opacity: 0, y: -90, rotateX: 75, scale: 0.6, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 18, mass: 0.9 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
};

export function NotFound() {
  const reduce = useReducedMotion();
  const { locale } = useI18n();
  const t = copy[locale] ?? copy.id;

  return (
    <div className="relative flex min-h-[calc(100svh-5rem)] w-full items-center justify-center overflow-hidden">
      {/* Ambient background: glow orbs bloom in, dotted grid fades in */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
          initial={reduce ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
        />
        <motion.div
          className="absolute left-[62%] top-[38%] size-72 rounded-full bg-secondary/25 blur-3xl"
          initial={reduce ? false : { opacity: 0, x: 80 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{
            opacity: { duration: 1.2, delay: 0.3 },
            x: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        <motion.div
          className="absolute inset-0 [background-image:radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        />
      </div>

      <motion.div
        className="relative z-10"
        variants={container}
        initial={reduce ? false : "hidden"}
        animate="show"
      >
        <Empty>
          <EmptyHeader>
            <EmptyTitle
              className="mask-b-from-20% mask-b-to-80% flex select-none font-extrabold text-9xl leading-none [perspective:800px] sm:text-[10rem]"
              role="heading"
              aria-level={1}
              aria-label="404"
            >
              {["4", "0", "4"].map((d, i) => (
                <motion.span key={i} variants={digit} className="inline-block origin-bottom">
                  {/* Inner span floats after the entrance, so both motions don't fight */}
                  <motion.span
                    className={i === 1 ? "inline-block text-primary" : "inline-block"}
                    animate={reduce ? undefined : { y: [0, -10, 0] }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1 + i * 0.25,
                    }}
                  >
                    {d}
                  </motion.span>
                </motion.span>
              ))}
            </EmptyTitle>

            <motion.div variants={fadeUp}>
              <EmptyDescription className="-mt-6 text-foreground/80 sm:text-nowrap">
                {t.line1} <br className="hidden sm:block" />
                {t.line2}
              </EmptyDescription>
            </motion.div>
          </EmptyHeader>

          <EmptyContent>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/" size="sm">
                <HomeIcon className="size-4" aria-hidden />
                {t.home}
              </ButtonLink>
              <ButtonLink href="/courses" size="sm" variant="outline">
                <CompassIcon className="size-4" aria-hidden />
                {t.explore}
              </ButtonLink>
            </motion.div>
          </EmptyContent>
        </Empty>
      </motion.div>
    </div>
  );
}

export default NotFound;
