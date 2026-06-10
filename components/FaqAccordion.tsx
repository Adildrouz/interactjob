"use client";
import { useState } from "react";

type Item = { q: string; a: string };

export default function FaqAccordion({ items, isAr }: { items: Item[]; isAr?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isAr ? "flex-row-reverse text-right" : ""}`}
            aria-expanded={open === i}
          >
            <span className="text-sm font-semibold text-gray-800 leading-snug">{item.q}</span>
            <span className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {open === i && (
            <div className={`px-4 pb-4 text-sm text-gray-600 leading-relaxed bg-gray-50 ${isAr ? "text-right" : ""}`}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
