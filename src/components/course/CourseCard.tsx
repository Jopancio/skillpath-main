"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Lock, PlayCircle } from "lucide-react";
import type { Course } from "@/data/types";
import { courseStats } from "@/data/types";
import { useI18n, pick } from "@/lib/i18n";
import { useProgress } from "@/hooks/use-progress";
import { DynamicIcon } from "@/components/ui/icon-map";
import { ProgressBar } from "@/components/ui/progress-bar";

const difficultyKey = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
} as const;

export function CourseCard({
  course,
  index = 0,
  plain = false,
  locked = false,
  className = "",
}: {
  course: Course;
  index?: number;
  plain?: boolean;
  /**
   * Guest preview: the card is greyed out and not a link. Hover/focus reveals
   * a "sign in to unlock" overlay that points at /login instead.
   */
  locked?: boolean;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const { completedLessons } = useProgress();
  const stats = courseStats(course);
  const done = course.modules
    .flatMap((m) => m.lessons)
    .filter((l) => completedLessons.has(l.id)).length;
  const percent = stats.lessons > 0 ? Math.round((done / stats.lessons) * 100) : 0;
  const started = done > 0;
  const en = locale === "en";

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: course.color }}
        >
          <DynamicIcon name={course.icon} className="h-7 w-7" />
        </span>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-bold text-muted">
          {t.common[difficultyKey[course.difficulty]]}
        </span>
      </div>

      <h3 className={`mt-4 font-display text-lg font-bold leading-snug ${locked ? "" : "group-hover:text-primary"}`}>
        {pick(locale, course.title)}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
        {pick(locale, course.description)}
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-muted">
        <span className="flex items-center gap-1">
          <PlayCircle className={`h-3.5 w-3.5 ${locked ? "" : "text-primary"}`} />
          {stats.lessons} {t.common.lessons}
        </span>
        <span className="flex items-center gap-1">
          <Clock className={`h-3.5 w-3.5 ${locked ? "" : "text-primary"}`} />
          {stats.minutes} {t.common.minutes}
        </span>
        {!locked && percent === 100 && (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t.common.completed}
          </span>
        )}
      </div>

      <div className="mt-4">
        {locked ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-muted">
            <Lock className="h-3.5 w-3.5" />
            {en ? "Preview only" : "Hanya pratinjau"}
          </span>
        ) : started ? (
          <ProgressBar percent={percent} showLabel />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            {t.courses.startCourse} →
          </span>
        )}
      </div>
    </>
  );

  const card = locked ? (
    <div
      aria-disabled="true"
      className="group relative flex h-full cursor-not-allowed flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      {/* Greyed-out content */}
      <div className="flex h-full select-none flex-col opacity-60 grayscale">{body}</div>
      {/* Unlock overlay — shown on hover and when the link inside gets keyboard focus */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 p-6 text-center opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-muted shadow-card">
          <Lock className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold text-foreground">
          {en ? "Sign in to start this course" : "Masuk untuk mulai kursus ini"}
        </p>
        <Link
          href="/login"
          className="cursor-pointer rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {en ? "Sign in / Sign up" : "Masuk / Daftar"}
        </Link>
      </div>
    </div>
  ) : (
    <Link
      href={`/courses/${course.id}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all card-futuristic hover:border-primary/50"
    >
      {body}
    </Link>
  );

  if (plain) {
    return <div className={className}>{card}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
    >
      {card}
    </motion.div>
  );
}
