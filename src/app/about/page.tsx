"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  Clock,
  Compass,
  Heart,
  Layers,
  Lightbulb,
  Mail,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { courses } from "@/data/courses";
import { team } from "@/data/team";
import { ButtonLink } from "@/components/ui/button";
import { TeamCarousel } from "@/components/about/TeamCarousel";

/**
 * Where "Contact us" messages go. PLACEHOLDER — replace with the team's real
 * inbox; the form opens the visitor's mail app addressed to it (no backend).
 */
const CONTACT_EMAIL = "hello@skillpath.id";

export default function AboutPage() {
  const { locale, t } = useI18n();
  const en = locale === "en";
  const reduce = useReducedMotion();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  // Shared scroll-reveal presets; collapsed to instant when motion is reduced.
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };
  const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
  };
  const reveal = {
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, amount: 0.25 },
  } as const;

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
        ? "Every feature answers: what makes someone stop learning halfway?"
        : "Setiap fitur menjawab: apa yang bikin orang berhenti belajar di tengah jalan?",
    ],
    [
      Layers,
      en ? "Build small, refine fast" : "Bangun kecil, rapikan cepat",
      en
        ? "Ship one path, feel it in use, then fix the friction."
        : "Rilis satu jalur, rasakan pemakaiannya, lalu benahi yang mengganggu.",
    ],
    [
      Heart,
      en ? "Beginner first" : "Ramah untuk pemula",
      en
        ? "If a beginner gets lost, that is our bug, not theirs."
        : "Kalau pemula tersesat, itu kesalahan kami, bukan mereka.",
    ],
  ] as const;

  const channels = [
    [Mail, "Email", CONTACT_EMAIL, `mailto:${CONTACT_EMAIL}`],
    [AtSign, "Instagram", "@skillpath.id", "#"],
    [MessageCircle, en ? "Community" : "Komunitas", en ? "Join the chat" : "Gabung obrolan", "#"],
  ] as const;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `${en ? "Message from" : "Pesan dari"} ${name.trim() || "SkillPath"}`,
    );
    const body = encodeURIComponent(message.trim());
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <div className="about-page">
      {/* Hero — compact, with floating blobs behind */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="landing-hero-grid pointer-events-none absolute inset-0 z-0" />
        <div aria-hidden className="about-blob about-blob-a" />
        <div aria-hidden className="about-blob about-blob-b" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto max-w-3xl px-5 py-12 text-center sm:px-8 md:py-16"
        >
          <motion.span variants={fadeUp} className="section-eyebrow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {en ? "ABOUT & CONTACT" : "TENTANG & KONTAK KAMI"}
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-5 font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.12] tracking-[-.05em]"
          >
            {en ? "Three people, " : "Tiga orang, "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {en ? "one learning path." : "satu jalur belajar."}
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base"
          >
            {en
              ? "A small team making practical skills reachable for anyone curious enough to start."
              : "Tim kecil yang ingin skill praktis bisa dijangkau siapa pun yang mau mulai."}
          </motion.p>

          <motion.div
            variants={stagger}
            className="mt-7 flex flex-wrap justify-center gap-2.5"
          >
            {stats.map(([Icon, value, label]) => (
              <motion.div
                key={label}
                variants={fadeUp}
                whileHover={reduce ? undefined : { y: -3 }}
                className="flex items-center gap-2.5 rounded-full border border-border bg-card/90 py-1.5 pl-1.5 pr-4 shadow-[0_8px_24px_-18px_rgb(37_99_235/.5)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <b className="font-display text-sm">{value}</b>
                <span className="text-xs text-muted">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Team carousel + contact, side by side */}
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14 sm:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr]">
          {/* Team */}
          <motion.div variants={fadeUp} {...reveal}>
            <span className="section-eyebrow">01 / {en ? "THE TEAM" : "TIM PENGEMBANG"}</span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {en ? "Who builds SkillPath." : "Orang di balik SkillPath."}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {en ? "Swipe, click, or use the arrows." : "Geser, klik, atau pakai tombol panah."}
            </p>
            <div className="mt-6">
              <TeamCarousel />
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            variants={fadeUp}
            {...reveal}
            className="relative isolate overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-40px_rgb(37_99_235/.6)] sm:p-7"
          >
            <div aria-hidden className="about-contact-glow" />
            <span className="section-eyebrow">02 / {en ? "CONTACT US" : "KONTAK KAMI"}</span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
              {en ? "Say hello 👋" : "Sapa kami 👋"}
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {en ? "We usually reply within 1–2 days." : "Biasanya kami balas dalam 1–2 hari."}
            </p>

            <motion.ul variants={stagger} {...reveal} className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {channels.map(([Icon, label, value, href]) => (
                <motion.li key={label} variants={fadeUp}>
                  <a
                    href={href}
                    className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-soft"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:rotate-[-8deg] group-hover:scale-110">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold">{label}</span>
                    <span className="truncate text-[11px] text-muted">{value}</span>
                  </a>
                </motion.li>
              ))}
            </motion.ul>

            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">{en ? "Your name" : "Nama kamu"}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder={en ? "e.g. Alex" : "mis. Budi"}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">{en ? "Message" : "Pesan"}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  maxLength={1500}
                  placeholder={
                    en ? "Questions, feedback, or ideas…" : "Pertanyaan, masukan, atau ide…"
                  }
                  className={`${inputClass} resize-none`}
                />
              </label>
              <motion.button
                type="submit"
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-deep-blue px-4 py-3 text-sm font-bold text-white shadow-soft"
              >
                {en ? "Send message" : "Kirim pesan"}
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              </motion.button>
              {sent && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="text-center text-xs text-muted"
                >
                  {en
                    ? "Your mail app should open. Nothing opened? Email us at "
                    : "Aplikasi email-mu akan terbuka. Tidak terbuka? Kirim ke "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-primary">
                    {CONTACT_EMAIL}
                  </a>
                </motion.p>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Values — compact row */}
      <section id="values" className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <motion.div variants={fadeUp} {...reveal} className="text-center">
            <span className="section-eyebrow">03 / {en ? "HOW WE WORK" : "CARA KAMI BEKERJA"}</span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
              {en ? "Three rules we keep." : "Tiga hal yang kami pegang."}
            </h2>
          </motion.div>

          <motion.div variants={stagger} {...reveal} className="mt-8 grid gap-4 md:grid-cols-3">
            {values.map(([Icon, title, body], i) => (
              <motion.article
                key={title}
                variants={fadeUp}
                whileHover={reduce ? undefined : { y: -4 }}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold">{title}</h3>
                  <span className="ml-auto font-mono text-xs text-muted/60">0{i + 1}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA — compact */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <motion.div
          variants={fadeUp}
          {...reveal}
          className="landing-cta rounded-[1.75rem] bg-[#102b66] px-7 py-9 text-white sm:px-10"
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
                {en ? "We built the path. The first step is yours." : "Jalurnya sudah siap. Langkah pertamanya milikmu."}
              </h2>
              <p className="mt-2 text-sm text-blue-100/80">
                {en
                  ? "Pick a skill, spend 15 minutes a day."
                  : "Pilih satu skill, luangkan 15 menit sehari."}
              </p>
            </div>
            <ButtonLink href="/courses" variant="white" size="lg">
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
