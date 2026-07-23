"use client";
import Link from "next/link";

/**
 * SEO-friendly numbered pagination: real crawlable <a> links carrying
 * ?page=N (plus any active filter params), prev/next with rel hints.
 * RTL-aware: order flips naturally under dir="rtl"; arrows swap via isAr.
 */
export default function Pagination({
  page,
  totalPages,
  makeHref,
  isAr = false,
}: {
  page: number;
  totalPages: number;
  makeHref: (p: number) => string;
  isAr?: boolean;
}) {
  if (totalPages <= 1) return null;

  // 1 … p-1 p p+1 … last
  const nums: (number | "…")[] = [];
  const push = (n: number | "…") => {
    if (nums[nums.length - 1] !== n) nums.push(n);
  };
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) push(n);
    else push("…");
  }

  const prevArrow = isAr ? "→" : "←";
  const nextArrow = isAr ? "←" : "→";
  const base =
    "inline-flex items-center justify-center min-w-[40px] h-10 px-2 rounded-lg text-sm font-semibold border transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          rel="prev"
          href={makeHref(page - 1)}
          className={`${base} border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary`}
          aria-label="Page précédente"
        >
          {prevArrow}
        </Link>
      ) : (
        <span className={`${base} border-gray-100 bg-gray-50 text-gray-300`} aria-hidden>
          {prevArrow}
        </span>
      )}

      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-gray-400" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={n}
            href={makeHref(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${
              n === page
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
            }`}
          >
            {n}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          rel="next"
          href={makeHref(page + 1)}
          className={`${base} border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary`}
          aria-label="Page suivante"
        >
          {nextArrow}
        </Link>
      ) : (
        <span className={`${base} border-gray-100 bg-gray-50 text-gray-300`} aria-hidden>
          {nextArrow}
        </span>
      )}
    </nav>
  );
}
