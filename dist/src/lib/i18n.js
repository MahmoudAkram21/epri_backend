"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nMiddleware = exports.supportedLocales = exports.defaultLocale = void 0;
exports.getLocale = getLocale;
exports.getT = getT;
const i18next_1 = __importDefault(require("i18next"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const path_1 = __importDefault(require("path"));
exports.defaultLocale = 'en';
exports.supportedLocales = ['en', 'ar'];
i18next_1.default
    .use(i18next_fs_backend_1.default)
    .use(i18next_http_middleware_1.default.LanguageDetector)
    .init({
    fallbackLng: exports.defaultLocale,
    supportedLngs: exports.supportedLocales,
    preload: exports.supportedLocales,
    ns: ['backend'],
    defaultNS: 'backend',
    backend: {
        loadPath: path_1.default.join(__dirname, '../../locales/{{lng}}/{{ns}}.json')
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
function getLocale(req) {
    const queryLocale = req.query.lang;
    if (queryLocale && exports.supportedLocales.includes(queryLocale)) {
        return queryLocale;
    }
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
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
            .filter((lang) => lang !== null)
            .sort((a, b) => b.quality - a.quality);
        for (const lang of languages) {
            if (exports.supportedLocales.includes(lang.code)) {
                return lang.code;
            }
        }
    }
    return exports.defaultLocale;
}
exports.i18nMiddleware = i18next_http_middleware_1.default.handle(i18next_1.default);
function getT(req) {
    return req.t || i18next_1.default.t.bind(i18next_1.default);
}
exports.default = i18next_1.default;
//# sourceMappingURL=i18n.js.map