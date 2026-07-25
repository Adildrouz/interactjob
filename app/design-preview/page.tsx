import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import DesignPreview from "./DesignPreview";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InteractJob — Direction créative v2",
  description: "Aperçu interne de la nouvelle direction visuelle.",
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return (
    <div className={`${bricolage.variable} ${caveat.variable} bg-white text-navy-900`}>
      <DesignPreview />
    </div>
  );
}
