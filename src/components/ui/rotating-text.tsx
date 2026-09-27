"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const wordVariants: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: "-0.5em",
    filter: "blur(8px)",
    transition: { duration: 0.3, ease: EASE },
  },
};

/**
 * Cycles through `words` (phrases), animating each phrase word by word.
 * `stagger` is the delay between words — lower it for long sentences.
 * Screen readers get the first phrase only (static), so the
 * changing text is never announced repeatedly.
 */
export function RotatingText({
  words,
  interval = 3200,
  stagger = 0.12,
  className,
}: {
  words: readonly string[];
  interval?: number;
  stagger?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || words.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [reduceMotion, words.length, interval]);

  // Parent only orchestrates timing: words enter one by one, and leave one by one.
  const phraseVariants = useMemo<Variants>(
    () => ({
      hidden: {},
      visible: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
      exit: { transition: { staggerChildren: stagger * 0.5 } },
    }),
    [stagger]
  );

  // Locale switch can shorten the list — keep the index in range.
  const current = words[index % words.length] ?? "";
  const parts = current.split(" ");

  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span className="sr-only">{words[0]}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          aria-hidden
          className="inline-block"
          variants={phraseVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {parts.map((word, i) => (
            // A real space between word boxes keeps long sentences wrapping.
            <Fragment key={`${word}-${i}`}>
              <motion.span variants={wordVariants} className="inline-block">
                {word}
              </motion.span>
              {i < parts.length - 1 && " "}
            </Fragment>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
