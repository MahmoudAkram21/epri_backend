const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

// Initialize i18next with filesystem backend
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    preload: ['en', 'ar'],
    ns: ['backend'],
    defaultNS: 'backend',
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json')
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

module.exports = {
  i18next,
  middleware: middleware.handle(i18next)
};

