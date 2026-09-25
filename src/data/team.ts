import { Code, Lightbulb, PenTool, type LucideIcon } from "lucide-react";
import type { Localized } from "./types";

export interface TeamMember {
  /** Stable key for React lists. */
  id: string;
  name: string;
  /**
   * Job title, kept verbatim in both locales because these are the titles the
   * team picked for themselves ("Planner & Designer", not a translation).
   */
  role: string;
  /** Placeholder bio — swap for copy each member writes about themselves. */
  bio: Localized;
  /** Two or three things this member actually owns day to day. */
  focus: Localized[];
  icon: LucideIcon;
  /**
   * Optional headshot served from /public/team (e.g. "/team/jovan.jpg").
   * Empty for now, so the card falls back to an initials monogram.
   */
  photo?: string;
  /** Optional contact links, e.g. { label: "Email", href: "mailto:…" }. */
  links?: { label: string; href: string }[];
}

export const team: TeamMember[] = [
  {
    id: "jovan",
    name: "Jovan",
    role: "Developer",
    icon: Code,
    bio: {
      id: "Menerjemahkan rancangan jadi produk yang benar-benar jalan — dari struktur halaman, alur belajar, sampai data kursus.",
      en: "Turns the plan into a product that actually runs — page structure, learning flow, and the course data behind it.",
    },
    focus: [
      { id: "Antarmuka Next.js & React", en: "Next.js & React interface" },
      { id: "Alur data dan kursus", en: "Course and data flow" },
      { id: "Performa & aksesibilitas", en: "Performance & accessibility" },
    ],
  },
  {
    id: "daniel",
    name: "Daniel",
    role: "Planner & Designer",
    icon: Lightbulb,
    bio: {
      id: "Menyusun peta jalan produk dan memastikan setiap layar punya tujuan yang jelas sebelum mulai dibangun.",
      en: "Maps out the product and makes sure every screen has a clear purpose before a line of it gets built.",
    },
    focus: [
      { id: "Perencanaan fitur", en: "Feature planning" },
      { id: "Alur pengguna", en: "User flows" },
      { id: "Desain antarmuka", en: "Interface design" },
    ],
  },
  {
    id: "jovan-sw",
    name: "Jovan SW",
    role: "Idea & Designer",
    icon: PenTool,
    bio: {
      id: "Sumber ide awal SkillPath dan penjaga arah visualnya, supaya terasa satu bahasa di setiap halaman.",
      en: "Where the SkillPath idea started, and the one keeping its visual direction consistent across every page.",
    },
    focus: [
      { id: "Konsep & ide produk", en: "Product concept & ideas" },
      { id: "Identitas visual", en: "Visual identity" },
      { id: "Materi & ilustrasi", en: "Content & illustration" },
    ],
  },
];

/** "Jovan SW" → "JS", "Daniel" → "D". Used by the monogram avatar fallback. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
}
