export const locales = ['th', 'en'] as const;
export const defaultLocale = 'th';
export type Locale = (typeof locales)[number];
