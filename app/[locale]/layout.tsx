import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import HtmlAttributes from "@/components/HtmlAttributes";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DonationButton from "@/components/DonationButton";
import WhatsAppButton from "@/components/WhatsAppButton";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
      <main className="flex-1">{children}</main>
      <Footer />
      <DonationButton />
      <WhatsAppButton />
    </NextIntlClientProvider>
  );
}
