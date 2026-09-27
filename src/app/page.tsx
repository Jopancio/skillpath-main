"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Award, BookOpen, CheckCircle2, ChevronRight, Clock3, Compass, Gamepad2, GraduationCap, HelpCircle, Map, ShieldCheck, Sparkles, Target, Wrench, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProgress } from "@/hooks/use-progress";
import { useAuth } from "@/lib/auth";
import { courses } from "@/data/courses";
import { type Category } from "@/data/types";
import { CourseCard } from "@/components/course/CourseCard";
import { ButtonLink } from "@/components/ui/button";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import GradientWaves from "@/components/GradientWaves";
import { RotatingText } from "@/components/ui/rotating-text";
import { HeroLearningCard } from "@/components/home/HeroLearningCard";

const icons = [Gamepad2, Map, Wrench, Award];
/**
 * Only these portraits exist in /public/testimonials. A testimonial past the
 * end of this list gets `undefined` and renders its initials instead of
 * requesting a file that isn't there.
 */
const learnerPhotos = [
  "/testimonials/learner-1.jpg",
  "/testimonials/learner-2.jpg",
  "/testimonials/learner-3.jpg",
  "/testimonials/learner-4.jpg",
];
const cats: { value: Category | "all"; id: string; en: string }[] = [{value:"all",id:"Semua skill",en:"All skills"},{value:"creative",id:"Kreatif",en:"Creative"},{value:"marketing",id:"Marketing",en:"Marketing"},{value:"tech",id:"Teknologi",en:"Technology"},{value:"culinary",id:"Kuliner",en:"Culinary"}];
export default function HomePage() {
  const { t, locale } = useI18n(); const en = locale === "en"; const { onboarded, hydrated } = useProgress(); const { user } = useAuth(); const [category,setCategory] = useState<Category|"all">("all");
  const reduceMotion = useReducedMotion();
  const href = user && hydrated && onboarded ? "/courses" : "/onboarding"; const shown = category === "all" ? courses : courses.filter(c => c.category === category);
  // A marquee half must be wider than the viewport or the loop seam shows bare
  // track. One card is ~360px at desktop, so repeat the filtered set until a
  // half clears ~2000px — a single-course category needs several passes.
  const courseRepeats = Math.max(1, Math.ceil(2000 / Math.max(shown.length * 360, 1)));
  const testimonialItems = useMemo(() => t.testimonials.items.map((item, index) => ({
    testimonial: item.quote,
    by: `${item.name} · ${item.role}`,
    imgSrc: learnerPhotos[index],
    initials: item.avatar,
  })), [t]);
  const steps = en ? [["Find your direction","Tell us your interests and goals. Discover a path that fits you.",Compass],["Build a little, every day","Bite-sized lessons, quizzes, and hands-on practice keep you moving.",BookOpen],["Show what you can do","Finish your course and add your certificate to your portfolio.",Award]] as const : [["Temukan arahmu","Ceritakan minat dan tujuanmu. Temukan jalur yang sesuai.",Compass],["Mulai dari langkah kecil","Materi ringkas, kuis interaktif, dan latihan nyata untukmu.",BookOpen],["Tunjukkan kemampuanmu","Tuntaskan kursus dan lengkapi portofoliomu dengan sertifikat.",Award]] as const;
  // Fed into the hero's looping marquee. Repeated per half below so the seam never
  // reveals empty track on a wide screen.
  const heroStats = [[Compass,`${courses.length}`,en?"skill paths":"jalur skill"],[Clock3,"15–30",en?"minutes a day":"menit sehari"],[Gamepad2,en?"Interactive":"Interaktif",en?"learn by doing":"belajar lewat praktik"],[GraduationCap,en?"Free":"Gratis",en?"start without worry":"mulai tanpa beban"]];
  return <div className="landing-page">
    <section id="top" className="relative overflow-hidden border-b border-border"><div className="landing-hero-grid pointer-events-none absolute inset-0 z-0"/><div className="hero-waves-background absolute inset-0 z-0"><GradientWaves horizonColor="#2b5abd" waveColor="#c9f0ed" crestColor="#FFFFFF" speed={0.4} amplitude={2.25} waveScale={0.6} waveRatio={0.9} swell={35} turbulence={20} tilt={1.11} zoom={1} height={5.5} fogDepth={15} detail="medium" brightness={1} opacity={1} grain grainIntensity={0.05} mouseInteraction parallaxStrength={0.5} /></div><div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-14 pt-12 sm:px-8 md:py-20 lg:grid-cols-[1fr_.9fr] lg:gap-20 lg:py-24"><div><span className="section-eyebrow"><span className="h-2 w-2 rounded-full bg-primary"/>{en?"SMALL STEPS. BIG POSSIBILITIES.":"LANGKAH KECIL. PELUANG BESAR."}</span><h1 className="mt-6 font-display text-[clamp(2.7rem,5vw,4.6rem)] font-bold leading-[1.13] tracking-[-.055em]">{en?"Your next chapter":"Masa depanmu,"}<br/>{en?"starts with":"dimulai dari"}<br/><RotatingText className="text-primary" words={en?["one new skill.","one perfect espresso.","one bold design.","one great shot.","one viral video."]:["satu skill baru.","secangkir espresso.","satu desain keren.","satu jepretan apik.","satu video viral."]}/></h1><p className="mt-8 max-w-lg text-base leading-8 text-muted sm:text-lg">{en?"Turn your curiosity into real-world skills. Find your path, learn by doing, and open new possibilities.":"Ubah rasa ingin tahu jadi kemampuan nyata. Temukan jalurmu, belajar lewat praktik, dan buka peluang baru."}</p><div className="mt-8 flex flex-wrap gap-3"><ButtonLink href={href} size="lg">{en?"Start learning for free":"Mulai Belajar Gratis"}<ArrowRight className="h-4 w-4"/></ButtonLink><ButtonLink href="#popular" variant="outline" size="lg"><Compass className="h-4 w-4"/>{t.hero.ctaSecondary}</ButtonLink></div><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted">{[en?"Beginner friendly":"Ramah untuk pemula",en?"Flexible learning":"Waktu fleksibel",en?"Digital certificates":"Sertifikat digital"].map(x=><span key={x} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary"/>{x}</span>)}</div></div>
      <HeroLearningCard href={href} en={en} /></div>
      <div className="hero-paths relative border-y border-border/70 bg-card/45 py-9 sm:py-11">
        <div className="hero-paths-viewport relative overflow-hidden" aria-label={en ? "Why SkillPath" : "Kenapa SkillPath"}>
          <div className="hero-paths-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-24" />
          <div className="hero-paths-fade hero-paths-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-24" />
          <div className="hero-paths-track flex w-max animate-marquee-left hover:[animation-play-state:paused]">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 gap-5 pr-5 sm:gap-7 sm:pr-7">
                {[0, 1, 2].map((repeat) =>
                  heroStats.map(([I, value, label]) => (
                    <div
                      key={`${half}-${repeat}-${String(label)}`}
                      aria-hidden={half !== 0 || repeat !== 0}
                      className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-2xl border border-border/80 bg-card/90 px-5 py-3 shadow-[0_8px_24px_-18px_rgb(37_99_235/.5)]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <I className="h-5 w-5" />
                      </span>
                      <span>
                        <b className="block font-display text-lg leading-tight">{String(value)}</b>
                        <span className="mt-0.5 block text-[11px] font-medium text-muted">{String(label)}</span>
                      </span>
                    </div>
                  )),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    <section id="features" className="landing-section"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="section-eyebrow">01 / {en?"THE SKILLPATH WAY":"CARA BELAJAR YANG BERBEDA"}</span><h2 className="section-title">{en?"More than just watching lessons.":"Bukan sekadar nonton materi."}</h2></div><p className="max-w-sm text-sm leading-7 text-muted">{en?"Stay curious, keep moving, and turn knowledge into something real.":"Dari langkah pertama sampai punya karya. Semua yang kamu butuhkan ada di sini."}</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{t.features.items.map((f,i)=>{const I=icons[i];return <article key={f.title} className="feature-card rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><I className="h-5 w-5"/></span><span className="font-mono text-xs text-muted/60">0{i+1}</span></div><h3 className="mt-5 font-display font-semibold">{f.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{f.description}</p><div className="mt-6 flex h-20 items-center justify-center rounded-xl border border-border bg-background text-primary">{i===0?<Zap className="h-9 w-9"/>:i===1?<Map className="h-9 w-9"/>:i===2?<Wrench className="h-9 w-9"/>:<Award className="h-9 w-9"/>}</div></article>})}</div></section>
    <section id="popular" className="border-y border-border bg-card/50"><div className="landing-section"><span className="section-eyebrow">02 / {en?"EXPLORE YOUR POTENTIAL":"EKSPLORASI POTENSIMU"}</span><div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="section-title">{en?"What will you learn next?":"Mau kuasai skill apa hari ini?"}</h2><p className="mt-2 text-sm text-muted">{en?"Start from zero. Build skills that take you somewhere.":"Mulai dari nol. Bangun kemampuan yang membuka peluang baru."}</p></div><Link href="/courses" className="flex items-center gap-2 text-sm font-bold text-primary">{en?"Explore all courses":"Lihat Semua Kursus"}<ArrowRight className="h-4 w-4"/></Link></div><div className="my-7 flex flex-wrap gap-2">{cats.map(c=><button key={c.value} type="button" aria-pressed={category===c.value} onClick={()=>setCategory(c.value)} className={`rounded-full border px-5 py-2.5 text-xs font-semibold ${category===c.value?"border-primary bg-primary text-white":"border-border bg-card text-muted hover:border-primary hover:text-primary"}`}>{c[locale]}</button>)}</div><div className="course-marquee relative -mx-5 sm:-mx-8">
      <div className="course-marquee-viewport relative" aria-label={en ? "Course paths" : "Jalur kursus"}>
        <div className="hero-paths-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-24" />
        <div className="hero-paths-fade hero-paths-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-24" />
        {/* Pauses on hover AND on keyboard focus — these cards are real links,
            so a moving target has to stop when someone aims at it. */}
        <div className="course-marquee-track flex w-max animate-marquee-left px-5 py-3 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] sm:px-8">
          {[0, 1].map((half) => (
            <div key={half} data-marquee-half={half} className="flex shrink-0 gap-5 pr-5">
              {Array.from({ length: courseRepeats }).map((_, repeat) =>
                shown.map((c) => (
                  <div
                    key={`${half}-${repeat}-${c.id}`}
                    // Only the first pass is announced; the rest are the same
                    // courses again and stay clickable for the mouse.
                    aria-hidden={half !== 0 || repeat !== 0}
                    className="w-[300px] shrink-0 sm:w-[340px]"
                  >
                    <CourseCard course={c} plain />
                  </div>
                )),
              )}
            </div>
          ))}
        </div>
      </div>
    </div><p className="mt-6 flex justify-center gap-2 text-center text-xs text-muted"><ShieldCheck className="h-4 w-4 text-primary"/>{en?"Lessons, practice, and a final quiz in every path.":"Materi, latihan, dan kuis akhir di setiap jalur."}</p></div></section>
    <section id="how-it-works" className="landing-section"><motion.div className="mx-auto max-w-2xl text-center" initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.55, ease: "easeOut" }}><span className="section-eyebrow">{en?"YOUR NEXT CHAPTER":"PERJALANAN BARUMU"}</span><h2 className="section-title">{en?"Big goals. Simple first steps.":"Tujuan besar. Langkah awal sederhana."}</h2><p className="mt-3 text-sm text-muted">{en?"You don't have to have it all figured out. Just start here.":"Kamu nggak perlu tahu semuanya sekarang. Cukup mulai dari sini."}</p></motion.div><div className="mt-12 grid gap-8 md:grid-cols-3">{steps.map(([title,body,I],i)=><motion.article key={title} initial={reduceMotion ? false : { opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: i * 0.12, ease: "easeOut" }}><div className="mb-6 flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary"><I className="h-6 w-6"/></span><span className="h-px flex-1 bg-border"/><span className="font-mono text-sm text-muted">0{i+1}</span></div><h3 className="font-display text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted">{body}</p><span className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary"><CheckCircle2 className="h-3.5 w-3.5"/>{en?"One step closer":"Selangkah lebih dekat"}</span></motion.article>)}</div></section>
    <section id="testimonials" className="border-y border-border bg-card/50"><div className="landing-section"><span className="section-eyebrow">03 / {en?"LEARNER STORIES":"CERITA TEMAN BELAJAR"}</span><h2 className="section-title mt-3">{en?"Different journeys. A shared first step.":"Beda cerita, satu langkah yang sama."}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-muted">{t.testimonials.subtitle}</p><div className="mt-8 -mx-5 sm:-mx-8"><StaggerTestimonials key={locale} items={testimonialItems} /></div><div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted"><span>{t.testimonials.learners}</span><span className="text-primary">★ {t.testimonials.rating}</span></div></div></section>
    <section id="faq" className="landing-section grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><span className="section-eyebrow">04 / {en?"LET'S CLEAR THINGS UP":"KENALI LEBIH DEKAT"}</span><h2 className="section-title mt-3">{en?"A little curious? That's a good start.":"Masih penasaran? Itu awal yang bagus."}</h2><p className="mt-4 text-sm leading-7 text-muted">{t.faq.subtitle}</p><div className="mt-8 rounded-2xl border border-border bg-card p-5"><HelpCircle className="h-7 w-7 text-primary"/><h3 className="mt-3 text-sm font-bold">{en?"Find your starting point":"Temukan titik mulainya"}</h3><Link href={href} className="mt-4 flex items-center gap-1 text-xs font-bold text-primary">{en?"Explore my interests":"Kenali Minatku"}<ChevronRight className="h-4 w-4"/></Link></div></div><FaqAccordion items={t.faq.items}/></section>
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8"><div className="landing-cta relative overflow-hidden rounded-[2rem] bg-[#102b66] px-7 py-12 text-white sm:px-12 md:py-16">
      {/* Decorative backdrop: concentric rings with skill icons riding the
          middle one — the same "jalur" (path + node) motif as the course
          path lines. aria-hidden + pointer-events-none so it never reaches a
          screen reader or swallows a click on the CTA. The icon nodes are
          sm-and-up only: on a phone the card is narrow and they would sit on
          top of the headline. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -right-28 top-1/2 h-64 w-64 -translate-y-1/2 sm:-right-16 sm:h-96 sm:w-96">
          <span className="absolute inset-0 rounded-full border border-white/10"/>
          <span className="absolute inset-8 rounded-full border border-white/[.09] sm:inset-12"/>
          <span className="absolute inset-16 rounded-full border border-white/[.07] bg-white/[.04] sm:inset-24"/>
          {/* Each node is centred on the middle ring's edge (inset-12 = 3rem). */}
          <span className="absolute left-1/2 top-12 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#102b66] text-white/55 sm:flex"><Compass className="h-5 w-5"/></span>
          <span className="absolute right-12 top-1/2 hidden h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-[#102b66] text-white/55 sm:flex"><Target className="h-5 w-5"/></span>
          <span className="absolute bottom-12 left-1/2 hidden h-11 w-11 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#102b66] text-white/55 sm:flex"><GraduationCap className="h-5 w-5"/></span>
          <span className="absolute left-12 top-1/2 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#102b66] text-white/55 sm:flex"><Sparkles className="h-5 w-5"/></span>
        </div>
        {/* Smaller cluster bottom-left, so the panel is not lopsided. */}
        <span className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full border border-white/[.08]"/>
        <span className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full border border-white/[.06]"/>
      </div>
      <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center"><div><span className="text-xs font-semibold uppercase tracking-[.18em] text-blue-200">{en?"YOUR FUTURE IS CALLING":"PELUANG BARU MENUNGGUMU"}</span><h2 className="mt-4 whitespace-pre-line font-display text-3xl font-semibold leading-tight sm:text-4xl">{en?"A new skill today.\nA new possibility tomorrow.":"Satu skill hari ini.\nPeluang baru esok hari."}</h2><p className="mt-4 text-sm text-blue-100/80">{en?"You bring the curiosity. We'll help with the next step.":"Bawa rasa ingin tahumu. Kami bantu langkah selanjutnya."}</p></div><ButtonLink href={href} variant="white" size="lg">{t.hero.cta}<ArrowRight className="h-4 w-4"/></ButtonLink></div></div></section>
  </div>;
}
