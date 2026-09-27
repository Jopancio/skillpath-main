import type { Localized } from "./types";

/** Learner stats a badge requirement can be measured against. */
export type BadgeMetric =
  | "lessons" // lessons completed
  | "streak" // current day streak
  | "xp" // total XP
  | "perfectQuizzes" // final quizzes finished with 100%
  | "certificates" // final quizzes passed
  | "coursesCompleted" // courses with every lesson done
  | "chapterQuizzes"; // chapter quizzes passed

export type BadgeTier = "bronze" | "silver" | "gold" | "legend";
export type BadgeCategory = "learning" | "streak" | "xp" | "mastery";

export interface Badge {
  id: string;
  name: Localized;
  description: Localized;
  icon: string; // lucide icon key (see components/ui/icon-map)
  color: string;
  tier: BadgeTier;
  category: BadgeCategory;
  /** Earned once `metric` reaches `goal`. Earning is permanent. */
  requirement: { metric: BadgeMetric; goal: number };
}

export const BADGE_TIERS: Record<BadgeTier, { label: Localized; color: string }> = {
  bronze: { label: { id: "Perunggu", en: "Bronze" }, color: "#C2410C" },
  silver: { label: { id: "Perak", en: "Silver" }, color: "#64748B" },
  gold: { label: { id: "Emas", en: "Gold" }, color: "#CA8A04" },
  legend: { label: { id: "Legenda", en: "Legend" }, color: "#9333EA" },
};

export const BADGE_CATEGORIES: Record<BadgeCategory, Localized> = {
  learning: { id: "Belajar", en: "Learning" },
  streak: { id: "Konsistensi", en: "Consistency" },
  xp: { id: "XP", en: "XP" },
  mastery: { id: "Penguasaan", en: "Mastery" },
};

/** How many earned badges a learner can pin to their public profile. */
export const MAX_FEATURED_BADGES = 3;

export const badges: Badge[] = [
  // ── Learning ────────────────────────────────────────────────
  {
    id: "first-steps",
    name: { id: "Langkah Pertama", en: "First Steps" },
    description: { id: "Selesaikan pelajaran pertamamu", en: "Complete your first lesson" },
    icon: "Footprints",
    color: "#22C55E",
    tier: "bronze",
    category: "learning",
    requirement: { metric: "lessons", goal: 1 },
  },
  {
    id: "bookworm",
    name: { id: "Kutu Buku", en: "Bookworm" },
    description: { id: "Selesaikan 10 pelajaran", en: "Complete 10 lessons" },
    icon: "BookOpen",
    color: "#3B82F6",
    tier: "silver",
    category: "learning",
    requirement: { metric: "lessons", goal: 10 },
  },
  {
    id: "scholar",
    name: { id: "Sarjana Skill", en: "Skill Scholar" },
    description: { id: "Selesaikan 25 pelajaran", en: "Complete 25 lessons" },
    icon: "GraduationCap",
    color: "#8B5CF6",
    tier: "gold",
    category: "learning",
    requirement: { metric: "lessons", goal: 25 },
  },
  {
    id: "lesson-50",
    name: { id: "Profesor Muda", en: "Young Professor" },
    description: { id: "Selesaikan 50 pelajaran", en: "Complete 50 lessons" },
    icon: "Gem",
    color: "#0EA5E9",
    tier: "legend",
    category: "learning",
    requirement: { metric: "lessons", goal: 50 },
  },
  {
    id: "course-completer",
    name: { id: "Penakluk Kursus", en: "Course Conqueror" },
    description: { id: "Selesaikan semua pelajaran di satu kursus", en: "Complete all lessons in one course" },
    icon: "Trophy",
    color: "#1D4ED8",
    tier: "silver",
    category: "learning",
    requirement: { metric: "coursesCompleted", goal: 1 },
  },
  {
    id: "explorer",
    name: { id: "Penjelajah Skill", en: "Skill Explorer" },
    description: { id: "Selesaikan 3 kursus berbeda", en: "Complete 3 different courses" },
    icon: "Compass",
    color: "#14B8A6",
    tier: "gold",
    category: "learning",
    requirement: { metric: "coursesCompleted", goal: 3 },
  },

  // ── Consistency ─────────────────────────────────────────────
  {
    id: "streak-3",
    name: { id: "Streak 3 Hari", en: "3-Day Streak" },
    description: { id: "Belajar 3 hari berturut-turut", en: "Learn 3 days in a row" },
    icon: "Flame",
    color: "#2563EB",
    tier: "bronze",
    category: "streak",
    requirement: { metric: "streak", goal: 3 },
  },
  {
    id: "streak-7",
    name: { id: "Streak 7 Hari", en: "7-Day Streak" },
    description: { id: "Belajar seminggu penuh tanpa putus", en: "Learn a full week without missing" },
    icon: "Zap",
    color: "#38BDF8",
    tier: "silver",
    category: "streak",
    requirement: { metric: "streak", goal: 7 },
  },
  {
    id: "streak-30",
    name: { id: "Tak Terhentikan", en: "Unstoppable" },
    description: { id: "Belajar 30 hari berturut-turut", en: "Learn 30 days in a row" },
    icon: "Rocket",
    color: "#F97316",
    tier: "legend",
    category: "streak",
    requirement: { metric: "streak", goal: 30 },
  },

  // ── XP ──────────────────────────────────────────────────────
  {
    id: "xp-500",
    name: { id: "Kolektor 500 XP", en: "500 XP Collector" },
    description: { id: "Kumpulkan total 500 XP", en: "Collect 500 total XP" },
    icon: "Star",
    color: "#EC4899",
    tier: "bronze",
    category: "xp",
    requirement: { metric: "xp", goal: 500 },
  },
  {
    id: "xp-1000",
    name: { id: "Legenda 1000 XP", en: "1000 XP Legend" },
    description: { id: "Kumpulkan total 1000 XP", en: "Collect 1000 total XP" },
    icon: "Crown",
    color: "#2563EB",
    tier: "silver",
    category: "xp",
    requirement: { metric: "xp", goal: 1000 },
  },
  {
    id: "xp-2500",
    name: { id: "Raja XP", en: "XP Royalty" },
    description: { id: "Kumpulkan total 2500 XP", en: "Collect 2500 total XP" },
    icon: "Sparkles",
    color: "#A855F7",
    tier: "gold",
    category: "xp",
    requirement: { metric: "xp", goal: 2500 },
  },

  // ── Mastery ─────────────────────────────────────────────────
  {
    id: "chapter-champ",
    name: { id: "Juara Bab", en: "Chapter Champ" },
    description: { id: "Lulus 5 kuis bab", en: "Pass 5 chapter quizzes" },
    icon: "Medal",
    color: "#10B981",
    tier: "bronze",
    category: "mastery",
    requirement: { metric: "chapterQuizzes", goal: 5 },
  },
  {
    id: "quiz-master",
    name: { id: "Master Kuis", en: "Quiz Master" },
    description: { id: "Dapatkan nilai sempurna di kuis", en: "Get a perfect score on a quiz" },
    icon: "Target",
    color: "#EF4444",
    tier: "silver",
    category: "mastery",
    requirement: { metric: "perfectQuizzes", goal: 1 },
  },
  {
    id: "certified",
    name: { id: "Tersertifikasi", en: "Certified" },
    description: { id: "Lulus kuis akhir dan raih sertifikat", en: "Pass a final quiz and earn a certificate" },
    icon: "Award",
    color: "#22C55E",
    tier: "silver",
    category: "mastery",
    requirement: { metric: "certificates", goal: 1 },
  },
  {
    id: "certified-3",
    name: { id: "Kolektor Sertifikat", en: "Certificate Collector" },
    description: { id: "Raih 3 sertifikat", en: "Earn 3 certificates" },
    icon: "Mountain",
    color: "#EAB308",
    tier: "gold",
    category: "mastery",
    requirement: { metric: "certificates", goal: 3 },
  },
];

export function getBadge(id: string): Badge | undefined {
  return badges.find((b) => b.id === id);
}
