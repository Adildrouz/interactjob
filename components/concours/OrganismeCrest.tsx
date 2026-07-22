import {
  Landmark,
  GraduationCap,
  Stethoscope,
  Shield,
  Scale,
  Building2,
  Building,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { classifyInstitution, institutionStyle, institutionLogo, type InstitutionType } from "@/lib/concours-institution";

const ICONS: Record<InstitutionType, LucideIcon> = {
  ministere: Landmark,
  universite: GraduationCap,
  sante: Stethoscope,
  securite: Shield,
  justice: Scale,
  collectivite: Building2,
  etablissement: Building,
  autre: Landmark,
};

const SIZES = {
  sm: { box: "w-10 h-10 rounded-xl", icon: 18, star: 7, starPos: "top-1 right-1" },
  md: { box: "w-12 h-12 rounded-xl", icon: 22, star: 8, starPos: "top-1 right-1" },
  lg: { box: "w-16 h-16 rounded-2xl", icon: 30, star: 11, starPos: "top-1.5 right-1.5" },
};

/** A five-point star (Moroccan-emblem motif) — an original accent, not a logo copy. */
function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.26L21.5 9l-5 4.9 1.3 6.9L12 17.4 6.2 20.8l1.3-6.9-5-4.9 6.6-.74z" />
    </svg>
  );
}

/**
 * Institution crest: an original, uniform emblem keyed by institution TYPE
 * (ministère, université, collectivité, santé, sécurité, justice, établissement).
 * Renders a brand-accented gradient badge with a type icon + Moroccan-star motif,
 * giving every card a real visual anchor with 100% coverage and zero broken images.
 * If a real logo is registered for the institution, it is shown instead.
 */
export default function OrganismeCrest({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const type = classifyInstitution(name);
  const style = institutionStyle(name);
  const logo = institutionLogo(name);
  const Icon = ICONS[type];
  const { box, icon, star, starPos } = SIZES[size];

  if (logo) {
    return (
      <span
        className={`${box} ${className} flex-shrink-0 grid place-items-center bg-white border border-concours-border overflow-hidden`}
        title={name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="w-full h-full object-contain p-1.5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className={`${box} ${className} relative flex-shrink-0 grid place-items-center text-white shadow-sm ring-1 ring-black/5`}
      style={{ background: `linear-gradient(135deg, ${style.accent} 0%, ${style.accentDark} 100%)` }}
      aria-hidden="true"
      title={`${name} — ${style.label}`}
    >
      <Icon size={icon} strokeWidth={2} className="opacity-95" />
      <span className={`absolute ${starPos} text-white/45`}>
        <Star size={star} />
      </span>
    </span>
  );
}
