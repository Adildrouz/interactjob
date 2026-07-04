"use client";

import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/trackEvent";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  event: string;
  eventParams?: Record<string, unknown>;
};

/** Wraps the i18n Link with a gtag click event — for CTAs and related-content links rendered from Server Components. */
export default function TrackedLink({ event, eventParams, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventParams);
        onClick?.(e);
      }}
    />
  );
}
