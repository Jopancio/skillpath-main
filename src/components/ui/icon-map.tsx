import {
  Award,
  BookOpen,
  Camera,
  Clapperboard,
  Coffee,
  Compass,
  Crown,
  Flame,
  Footprints,
  Gem,
  GraduationCap,
  Medal,
  Megaphone,
  Mountain,
  PenTool,
  Rocket,
  Scissors,
  Share2,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

const iconMap: Record<string, LucideIcon> = {
  Compass,
  Gem,
  Medal,
  Mountain,
  Rocket,
  Coffee,
  Clapperboard,
  Megaphone,
  Share2,
  Scissors,
  PenTool,
  Camera,
  Footprints,
  Flame,
  Zap,
  BookOpen,
  GraduationCap,
  Target,
  Trophy,
  Award,
  Star,
  Crown,
  Sparkles,
};

export function DynamicIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = iconMap[name] ?? BookOpen;
  return <Icon className={className} style={style} aria-hidden />;
}
