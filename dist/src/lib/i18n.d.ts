import { Request } from 'express';
import i18next from 'i18next';
export type Locale = 'en' | 'ar';
export declare const defaultLocale: Locale;
export declare const supportedLocales: Locale[];
export declare function getLocale(req: Request): Locale;
export declare const i18nMiddleware: import("express-serve-static-core").Handler;
export declare function getT(req: Request): any;
export default i18next;
//# sourceMappingURL=i18n.d.ts.map