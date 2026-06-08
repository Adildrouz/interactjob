import type { Metadata } from "next";
import OffresPage from "@/app/[locale]/offres/page";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${BASE_URL}/en/jobs`,
    languages: {
      fr:          `${BASE_URL}/offres`,
      en:          `${BASE_URL}/en/jobs`,
      "x-default": `${BASE_URL}/offres`,
    },
  },
};

export default function JobsPage() {
  return <OffresPage />;
}
