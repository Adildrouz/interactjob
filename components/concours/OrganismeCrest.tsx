import { organismeInitials, organismeColor } from "@/lib/concours";

const SIZES = {
  sm: { box: "w-9 h-9", text: "text-xs" },
  md: { box: "w-12 h-12", text: "text-sm" },
  lg: { box: "w-14 h-14", text: "text-base" },
};

/**
 * Placeholder crest for a government institution — no official logo assets are
 * available/reliable to scrape at scale, so we render a deterministic
 * initials badge (shield shape evokes an official emblem) instead of a
 * generic broken-image icon.
 */
export default function OrganismeCrest({ name, size = "md" }: { name: string; size?: keyof typeof SIZES }) {
  const initials = organismeInitials(name);
  const color = organismeColor(name);
  const { box, text } = SIZES[size];

  return (
    <div
      className={`${box} ${text} flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
      title={name}
    >
      {initials}
    </div>
  );
}
