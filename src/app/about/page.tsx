"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Heart,
  Layers,
  Lightbulb,
  Mail,
  Users,
} from "lucide-react";
import { useI18n, pick } from "@/lib/i18n";
import { courses } from "@/data/courses";
import { team, initialsOf } from "@/data/team";
import { ButtonLink } from "@/components/ui/button";

export default function AboutPage() {
  const { locale, t } = useI18n();
  const en = locale === "en";

  const stats = [
    [Users, String(team.length), en ? "team members" : "anggota tim"],
    [Compass, String(courses.length), en ? "skill paths" : "jalur skill"],
    [Heart, en ? "Free" : "Gratis", en ? "for every learner" : "untuk semua pelajar"],
  ] as const;

  const values = [
    [
      Lightbulb,
      en ? "Start from a real problem" : "Mulai dari masalah nyata",
      en
        ? "Every feature answers one question: what makes someone stop learning halfway?"
        : "Setiap fitur lahir dari satu pertanyaan: apa yang bikin orang berhenti belajar di tengah jalan?",
    ],
    [
      Layers,
      en ? "Build small, refine fast" : "Bangun kecil, rapikan cepat",
      en
        ? "We ship a path, watch how it feels to use, then fix the friction instead of adding more screens."
        : "Kami rilis satu jalur, rasakan pemakaiannya, lalu benahi bagian yang mengganggu — bukan menambah layar baru.",
    ],
    [
      Heart,
      en ? "Beginner first" : "Ramah untuk pemula",
      en
        ? "No prerequisites, no jargon wall. If a beginner gets lost, that is our bug, not theirs."
        : "Tanpa prasyarat, tanpa tumpukan istilah. Kalau pemula tersesat, itu kesalahan kami, bukan mereka.",
    ],
  ] as const;

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="landing-hero-grid pointer-events-none absolute inset-0 z-0" />
        <div className="relative z-10 mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 md:py-24">
          <span className="section-eyebrow">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {en ? "ABOUT US" : "TENTANG KAMI"}
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.1rem,4.2vw,3.5rem)] font-bold leading-[1.15] tracking-[-.05em]">
            {en ? "Three people," : "Tiga orang,"}
            <br />
            <span className="text-primary">
              {en ? "one learning path." : "satu jalur belajar."}
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
            {en
              ? "SkillPath is built by a small team that believes a practical skill should be within reach of anyone curious enough to start — no degree, no big budget."
              : "SkillPath dibuat oleh tim kecil yang percaya skill praktis harus bisa dijangkau siapa pun yang mau mulai — tanpa ijazah, tanpa biaya besar."}
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map(([Icon, value, label]) => (
              <div
                key={label}
                className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card/90 px-5 py-4 shadow-[0_8px_24px_-18px_rgb(37_99_235/.5)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-left">
                  <b className="block font-display text-lg leading-tight">{value}</b>
                  <span className="mt-0.5 block text-[11px] font-medium text-muted">
                    {label}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="landing-section">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="section-eyebrow">
              01 / {en ? "THE TEAM" : "TIM PENGEMBANG"}
            </span>
            <h2 className="section-title">
              {en ? "Who builds SkillPath." : "Orang di balik SkillPath."}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted">
            {en
              ? "A small team, clear roles, and one product we all use ourselves."
              : "Tim kecil, peran yang jelas, dan satu produk yang kami pakai sendiri."}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => {
            const Icon = member.icon;
            return (
              <article
                key={member.id}
                className="feature-card flex flex-col rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center gap-4">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-2xl bg-muted object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-deep-orange font-display text-xl font-bold text-white shadow-soft"
                    >
                      {initialsOf(member.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold leading-tight">
                      {member.name}
                    </h3>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                      <Icon className="h-3.5 w-3.5" />
                      {member.role}
                    </span>
                  </div>
                  <span className="ml-auto self-start font-mono text-xs text-muted/60">
                    0{i + 1}
                  </span>
                </div>

                <p className="mt-5 text-sm leading-6 text-muted">
                  {pick(locale, member.bio)}
                </p>

                <ul className="mt-5 space-y-2 border-t border-border pt-4">
                  {member.focus.map((item) => (
                    <li
                      key={pick(locale, item)}
                      className="flex items-center gap-2 text-xs font-medium text-muted"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {pick(locale, item)}
                    </li>
                  ))}
                </ul>

                {member.links && member.links.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
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
              </article>
            );
          })}
        </div>
      </section>

      {/* How we work */}
      <section id="values" className="border-y border-border bg-card/50">
        <div className="landing-section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-eyebrow">
              02 / {en ? "HOW WE WORK" : "CARA KAMI BEKERJA"}
            </span>
            <h2 className="section-title mx-auto">
              {en ? "Three rules we keep." : "Tiga hal yang kami pegang."}
            </h2>
            <p className="mt-3 text-sm text-muted">
              {en
                ? "Small decisions, made the same way every time."
                : "Keputusan kecil, diambil dengan cara yang sama setiap kali."}
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {values.map(([Icon, title, body], i) => (
              <article key={title}>
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-mono text-sm text-muted">0{i + 1}</span>
                </div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="landing-cta rounded-[2rem] bg-[#102b66] px-7 py-12 text-white sm:px-12 md:py-16">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[.18em] text-blue-200">
                {en ? "BUILT FOR YOU" : "DIBUAT UNTUKMU"}
              </span>
              <h2 className="mt-4 whitespace-pre-line font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {en
                  ? "We built the path.\nThe first step is yours."
                  : "Jalurnya sudah kami siapkan.\nLangkah pertamanya milikmu."}
              </h2>
              <p className="mt-4 text-sm text-blue-100/80">
                {en
                  ? "Pick a skill, spend 15 minutes a day, and see where it takes you."
                  : "Pilih satu skill, luangkan 15 menit sehari, dan lihat ke mana itu membawamu."}
              </p>
            </div>
            <ButtonLink href="/courses" variant="white" size="lg">
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          {en ? "Questions or feedback? " : "Ada pertanyaan atau masukan? "}
          <Link href="/" className="font-bold text-primary hover:underline">
            {en ? "Back to the home page" : "Kembali ke halaman utama"}
          </Link>
        </p>
      </section>
    </div>
  );
}
