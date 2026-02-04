import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/hooks/useAuth';
import {IBM_Plex_Sans_Thai, Anuphan, Inter} from "next/font/google";
import "@/app/globals.css";
import PDPAModal from "@/components/ui/PDPAModal";
import { Toaster } from 'sonner';
import { ReactQueryProvider } from '@/app/providers';

const ibmPlexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-ibm-thai",
  weight: ["300", "400", "500", "600", "700"],
});

const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  variable: "--font-anuphan",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as "th" | "en")) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ReactQueryProvider>
        <AuthProvider>
          <div className="fixed inset-0 bg-grain pointer-events-none z-[9999]" />
          <Toaster position="top-right" expand={false} richColors />
          <PDPAModal />
          {children}
        </AuthProvider>
      </ReactQueryProvider>
    </NextIntlClientProvider>
  );
}
