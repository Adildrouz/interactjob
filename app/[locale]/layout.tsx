import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import HtmlAttributes from "@/components/HtmlAttributes";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DonationButton from "@/components/DonationButton";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileNav from "@/components/MobileNav";
import CookieBanner from "@/components/CookieBanner";

export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Non-FR locales: noindex at layout level so pages without their own robots
// setting are excluded from Google's index. Pages that explicitly set
// robots: { index: true } (e.g. fr job pages) will override this.
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "fr") {
    return { robots: { index: false, follow: false } };
  }
  return {};
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "fr" | "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlAttributes />
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <DonationButton />
      <WhatsAppButton />
      <MobileNav />
      <CookieBanner />
    </NextIntlClientProvider>
  );
}
