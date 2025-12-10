import { Request, Response, NextFunction } from 'express';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';

export type Locale = 'en' | 'ar';

export const defaultLocale: Locale = 'en';
export const supportedLocales: Locale[] = ['en', 'ar'];

// Initialize i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: defaultLocale,
    supportedLngs: supportedLocales,
    preload: supportedLocales,
    ns: ['backend'],
    defaultNS: 'backend',
    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json')
    },
    detection: {
      order: ['querystring', 'header'],
      lookupQuerystring: 'lang',
      lookupHeader: 'accept-language',
      caches: false
    },
    interpolation: {
      escapeValue: false
    }
  });

/**
 * Get locale from request headers (Accept-Language) or query parameter
 */
export function getLocale(req: Request): Locale {
  // Check query parameter first
  const queryLocale = req.query.lang as string;
  if (queryLocale && supportedLocales.includes(queryLocale as Locale)) {
    return queryLocale as Locale;
  }

  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,ar;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1.0'] = lang.trim().split(';');
        if (!code) {
          return null;
        }
        const quality = parseFloat(q.replace('q=', ''));
        return { code: (code.split('-')[0] ?? code).toLowerCase(), quality };
      })
      .filter((lang): lang is { code: string; quality: number } => lang !== null)
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      if (supportedLocales.includes(lang.code as Locale)) {
        return lang.code as Locale;
      }
    }
  }

  return defaultLocale;
}

/**
 * Middleware to attach i18next to request object
 */
export const i18nMiddleware = middleware.handle(i18next);

/**
 * Helper to get translation function from request
 */
export function getT(req: Request) {
  return (req as any).t || i18next.t.bind(i18next);
}

export default i18next;

