import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

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

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body suppressHydrationWarning={true}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
