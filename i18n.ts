import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// รายการภาษาที่รองรับ
export const locales = ['en', 'th'] as const;
export type Locale = (typeof locales)[number];

// ภาษาเริ่มต้น
export const defaultLocale: Locale = 'th';

export default getRequestConfig(async ({ locale }) => {
  // ตรวจสอบว่า locale ที่ร้องขอมีอยู่ในรายการที่รองรับหรือไม่
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale: locale || defaultLocale,
    messages: (await import(`./messages/${locale || defaultLocale}.json`)).default
  };
});
