import { DISPLAY, HAND } from "@/lib/design";

/**
 * Section header in the v2 voice: a handwritten index, a short rule, and a
 * plain lowercase kicker — deliberately replacing the uppercase-tracking
 * eyebrow that reads as generic template default.
 */
export default function SectionHeading({
  index,
  kicker,
  title,
  align = "start",
  className = "",
}: {
  index: string;
  kicker: string;
  title: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "text-center" : ""} ${className}`}>
      <div className={`flex items-center gap-3 mb-2 ${align === "center" ? "justify-center" : ""}`}>
        <span className={`${HAND} text-2xl font-semibold text-tq-700 leading-none`}>{index}</span>
        <span aria-hidden className="h-px w-10 bg-tq-400" />
        <span className="text-sm font-medium text-navy-500">{kicker}</span>
      </div>
      <h2 className={`${DISPLAY} text-2xl sm:text-3xl font-bold tracking-tight text-navy-900`}>
        {title}
      </h2>
    </div>
  );
}
