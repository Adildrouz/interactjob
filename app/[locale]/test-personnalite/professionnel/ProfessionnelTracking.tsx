"use client";

import { useEffect } from "react";
import { trackToolEvent } from "@/lib/trackToolEvent";

export function ProfessionnelPageView() {
  useEffect(() => {
    trackToolEvent("personality_test", "page_view", { testType: "professionnel" });
  }, []);
  return null;
}

export function ProfessionnelCtaLink({
  href,
  tier,
  className,
  style,
  children,
}: {
  href: string;
  tier: "unlock_scroll" | "individual" | "pack";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={() => trackToolEvent("personality_test", "paid_report_cta_clicked", { testType: "professionnel", metadata: { tier } })}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
