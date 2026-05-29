import type { Metadata } from "next";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Apply Now — Spontaneous Application | InteractJob.ma",
  description:
    "Submit your spontaneous application to InteractJob.ma. Share your profile and we'll contact you as soon as a matching opportunity arises in Morocco.",
  keywords: [
    "apply job morocco",
    "spontaneous application morocco",
    "job application morocco 2027",
    "interactjob apply",
  ],
  alternates: { canonical: `${BASE_URL}/en/apply` },
  openGraph: {
    title: "Apply Now — Spontaneous Application | InteractJob.ma",
    description:
      "Submit your profile and get contacted for matching job opportunities in Morocco.",
    url: `${BASE_URL}/en/apply`,
    siteName: "InteractJob.ma",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
