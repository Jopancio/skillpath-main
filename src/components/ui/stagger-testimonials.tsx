"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaggerTestimonial {
  testimonial: string;
  by: string;
  /** Portrait under /public/testimonials. Omit it to get an initials tile. */
  imgSrc?: string;
  /** Monogram for the no-portrait case, e.g. "AL". Derived from `by` if absent. */
  initials?: string;
}

/**
 * Each rendered card carries a `tempId` that stays stable while the card only
 * slides to a neighbouring slot. React then reuses the same DOM node and the CSS
 * transform transition can actually run. Only the card that wraps around from one
 * edge to the other gets a fresh id, so it remounts (and fades in) instead of
 * flying across the whole carousel.
 */
interface StaggerItem extends StaggerTestimonial {
  tempId: number;
}

interface TestimonialCardProps {
  position: number;
  testimonial: StaggerTestimonial;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const withIds = (list: StaggerTestimonial[]): StaggerItem[] =>
  list.map((item, index) => ({ ...item, tempId: index }));

/** Clean, chromeless icon controls — no pill, no border, no fill; only the icon reads. */
const navButtonClass = cn(
  "flex h-12 w-12 items-center justify-center rounded-md bg-transparent text-muted transition-colors duration-200",
  "hover:text-primary active:text-primary-hover",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

const testimonials: StaggerTestimonial[] = [
  {
    testimonial: "Dari nol sampai diterima kerja jadi barista cuma butuh 3 minggu. Materinya praktis banget dan langsung bisa dipraktikkan!",
    by: "Rani Pratama · Barista di Kopi Kenangan",
    imgSrc: "/testimonials/learner-1.jpg",
  },
  {
    testimonial: "Belajar sambil kerja tetap bisa. Fitur XP dan streak bikin aku konsisten belajar tiap hari. Sekarang udah dapet klien pertama!",
    by: "Dimas Aditya · Freelance Content Creator",
    imgSrc: "/testimonials/learner-2.jpg",
  },
  {
    testimonial: "Sertifikatnya langsung kupakai di LinkedIn dan CV. Tiga minggu setelah lulus, aku diterima handle sosial media UMKM lokal.",
    by: "Siti Nurhaliza · Digital Marketer UMKM",
    imgSrc: "/testimonials/learner-3.jpg",
  },
  {
    testimonial: "Jalur belajarnya rapi banget, dari dasar sampai mahir. Setiap modul ada latihan, jadi nggak cuma teori.",
    by: "Budi Santoso · Video Editor Freelance",
    imgSrc: "/testimonials/learner-4.jpg",
  },
  {
    // Five cards, not four: the layout centres the middle card, so an even
    // count leaves one side of the fan short.
    testimonial: "Aku mulai tanpa background desain sama sekali. Latihan di tiap modul jadi isi portofolioku, dan itu yang bikin aku lolos interview pertama.",
    by: "Ayu Lestari · UI/UX Designer Junior",
    initials: "AL",
  },
];

function TestimonialCard({ position, testimonial, handleMove, cardSize }: TestimonialCardProps) {
  const isCenter = position === 0;
  const [name] = testimonial.by.split(" · ");
  const monogram =
    testimonial.initials ??
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => handleMove(position)}
      aria-label={`Tampilkan testimoni dari ${name}`}
      className={cn(
        "stagger-card absolute left-1/2 top-1/2 cursor-pointer border-2 p-6 text-left transition-all duration-500 ease-in-out sm:p-8",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isCenter
          ? "z-10 border-primary bg-primary text-white"
          : "z-0 border-border bg-card text-foreground hover:border-primary/50",
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: "polygon(36px 0%, calc(100% - 36px) 0%, 100% 36px, 100% 100%, calc(100% - 36px) 100%, 36px 100%, 0 100%, 0 0)",
        transform: `translate(-50%, -50%) translateX(${(cardSize / 1.5) * position}px) translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px) rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)`,
        boxShadow: isCenter ? "0 8px 0 4px color-mix(in srgb, var(--color-border) 90%, transparent)" : undefined,
      }}
    >
      <span aria-hidden className="absolute right-0 top-9 block h-0.5 w-[71px] origin-top-right rotate-45 bg-border" />
      {testimonial.imgSrc ? (
        <Image
          src={testimonial.imgSrc}
          alt=""
          width={48}
          height={56}
          className="mb-4 h-14 w-12 bg-muted object-cover object-top"
          style={{ boxShadow: "3px 3px 0 var(--color-background)" }}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "mb-4 flex h-14 w-12 items-center justify-center font-display text-base font-bold",
            isCenter ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
          )}
          style={{ boxShadow: "3px 3px 0 var(--color-background)" }}
        >
          {monogram}
        </span>
      )}
      <span className={cn("block text-base font-medium sm:text-xl", isCenter ? "text-white" : "text-foreground")}>
        “{testimonial.testimonial}”
      </span>
      <span className={cn("absolute bottom-6 left-6 right-6 mt-2 text-sm italic sm:bottom-8 sm:left-8 sm:right-8", isCenter ? "text-white/80" : "text-muted")}>
        — {testimonial.by}
      </span>
    </button>
  );
}

export function StaggerTestimonials({ items = testimonials }: { items?: StaggerTestimonial[] }) {
  const [cardSize, setCardSize] = useState(290);
  const [testimonialsList, setTestimonialsList] = useState<StaggerItem[]>(() => withIds(items));
  const nextId = useRef(items.length);

  useEffect(() => {
    const updateSize = () => setCardSize(window.matchMedia("(min-width: 640px)").matches ? 365 : 290);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMove = useCallback((steps: number) => {
    if (!steps) return;
    setTestimonialsList((current) => {
      if (current.length < 2) return current;
      const next = [...current];
      const count = Math.min(Math.abs(steps), next.length);
      for (let i = 0; i < count; i += 1) {
        // Only the wrapping card gets a new id, so every other card keeps its
        // DOM node and animates to its new slot.
        if (steps > 0) next.push({ ...next.shift()!, tempId: (nextId.current += 1) });
        else next.unshift({ ...next.pop()!, tempId: (nextId.current += 1) });
      }
      return next;
    });
  }, []);

  return (
    <div className="relative h-[520px] w-full overflow-hidden sm:h-[600px]" aria-label="Testimonial carousel">
      {testimonialsList.map((testimonial, index) => {
        const position = index - Math.floor(testimonialsList.length / 2);
        return <TestimonialCard key={testimonial.tempId} testimonial={testimonial} handleMove={handleMove} position={position} cardSize={cardSize} />;
      })}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
        <button type="button" onClick={() => handleMove(-1)} className={navButtonClass} aria-label="Testimoni sebelumnya"><ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" /></button>
        <button type="button" onClick={() => handleMove(1)} className={navButtonClass} aria-label="Testimoni berikutnya"><ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" /></button>
      </div>
    </div>
  );
}

export { testimonials };
