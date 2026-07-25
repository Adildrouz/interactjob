/**
 * InteractJob v2 design system — "Vif & assuré".
 *
 * Shared primitives for the approved creative direction so every page
 * speaks the same visual language. Colour tokens live in globals.css
 * (@theme: navy-*, tq-*, coral-*, semantic); this file carries the
 * *shape*, *motion* and *motif* vocabulary that CSS variables can't.
 *
 * Rules encoded here (from owner feedback rounds):
 *  - Light canvas. Navy = primary action, turquoise = secondary/highlight.
 *  - Coral is urgency-only (concours deadlines) — never general navigation.
 *  - No gradient text, no gradient buttons, no pill-badge-with-dot eyebrows.
 *  - One deliberately cut corner is the signature shape, replacing the
 *    uniform rounded-pill vocabulary that reads as AI-template default.
 */

/* ── Signature shapes: one corner deliberately squared off ───────────── */
export const BTN_SHAPE = "rounded-[14px] rounded-br-[3px]";
export const BTN_SHAPE_SM = "rounded-[12px] rounded-br-[3px]";
export const CARD_SHAPE = "rounded-[20px] rounded-tr-[5px]";
export const CHIP_SHAPE = "rounded-[10px] rounded-bl-[2px]";
export const CHIP_SHAPE_SM = "rounded-[8px] rounded-bl-[2px]";

/* ── Moroccan five-point star, tiled as a faint proprietary texture ──── */
export const STAR_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cpath d='M64 54l1.7 3.65 3.85.45-2.9 2.85.75 4.05-3.4-1.95-3.4 1.95.75-4.05-2.9-2.85 3.85-.45z' fill='%2300347A' fill-opacity='0.055'/%3E%3C/svg%3E\")";

export const STAR_TILE_LIGHT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cpath d='M64 54l1.7 3.65 3.85.45-2.9 2.85.75 4.05-3.4-1.95-3.4 1.95.75-4.05-2.9-2.85 3.85-.45z' fill='white' fill-opacity='0.5'/%3E%3C/svg%3E\")";

/* Soft brand glows for light-canvas hero sections. */
export const HERO_GLOW =
  "radial-gradient(820px 400px at 30% -12%, rgba(0,194,203,0.10), transparent 60%), radial-gradient(700px 360px at 75% 0%, rgba(0,52,122,0.06), transparent 55%)";

/* ── Motion vocabulary ───────────────────────────────────────────────── */
export const SPRING = { type: "spring", stiffness: 380, damping: 28 } as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* ── Typography helpers ──────────────────────────────────────────────── */
export const DISPLAY = "font-[family-name:var(--font-display)]";
export const HAND = "font-[family-name:var(--font-hand)]";
