import type { CSSProperties } from "react";
import type { Metadata } from "next";
import DesignPreview from "./DesignPreview";

const previewFonts = {
  "--font-bricolage": 'var(--font-jakarta, "Segoe UI"), system-ui, sans-serif',
  "--font-hand": '"Segoe Print", "Bradley Hand", cursive',
} as CSSProperties;

export const metadata: Metadata = {
  title: "InteractJob — Direction créative v2",
  description: "Aperçu interne de la nouvelle direction visuelle.",
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return (
    <div className="bg-white text-navy-900" style={previewFonts}>
      <DesignPreview />
    </div>
  );
}
