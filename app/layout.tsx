import { ReactNode } from 'react'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { IBM_Plex_Sans_Thai, Anuphan, Inter } from "next/font/google";
import "@/app/globals.css";

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

export const metadata = {
  title: "BN-Aura | Premium Aesthetic Intelligence",
  description: "Enterprise-grade aesthetic clinic platform with AI-powered skin analysis",
};

// This is the root layout that wraps all locales
export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const locale = await getLocale()
  
  // Ensure we have a valid locale
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#0A0A0A" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/next.svg" />
      </head>
      <body
        className={`${ibmPlexThai.variable} ${anuphan.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
