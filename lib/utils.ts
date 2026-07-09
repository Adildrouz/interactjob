import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate a string to at most maxLength UTF-16 code units without splitting
 * a surrogate pair (e.g. bold/italic Unicode letters, emoji). Plain .slice()
 * can leave a lone surrogate at the cut point, which produces JSON that
 * Node's parser accepts but stricter parsers (e.g. Turbopack's) reject.
 */
export function safeTruncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  let end = maxLength;
  const code = str.charCodeAt(end - 1);
  if (code >= 0xd800 && code <= 0xdbff) end -= 1;
  return str.slice(0, end);
}
