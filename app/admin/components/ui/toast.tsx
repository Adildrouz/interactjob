"use client";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { useAdminTheme } from "../theme-provider";

export type ToastType = "success" | "error" | "info";

/** Preserves the legacy `toast(message, type)` signature used across admin pages. */
export function useToast() {
  function toast(message: string, type: ToastType = "info") {
    const icon =
      type === "success" ? <CheckCircle2 className="h-4 w-4" /> :
      type === "error" ? <XCircle className="h-4 w-4" /> :
      <Info className="h-4 w-4" />;

    if (type === "success") sonnerToast.success(message, { icon });
    else if (type === "error") sonnerToast.error(message, { icon });
    else sonnerToast(message, { icon });
  }
  return { toast };
}

export function AdminToaster() {
  const { theme } = useAdminTheme();
  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center gap-2.5 rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] bg-[var(--ad-surface)] px-4 py-3 text-sm font-medium text-[var(--ad-text)] shadow-[var(--ad-shadow-lg)] w-[356px]",
          success: "!text-[var(--ad-success-text)] [&_svg]:!text-[var(--ad-success)]",
          error: "!text-[var(--ad-danger-text)] [&_svg]:!text-[var(--ad-danger)]",
          icon: "shrink-0",
        },
      }}
    />
  );
}
