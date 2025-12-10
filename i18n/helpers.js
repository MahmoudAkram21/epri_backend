const { i18next } = require('./index');

/**
 * Helper function for translations when no request context is available
 * (e.g., cron jobs, background tasks, seed files)
 * 
 * @param {string} key - Translation key (e.g., 'common.success')
 * @param {string} locale - Locale code ('en' or 'ar'), defaults to 'en'
 * @param {object} params - Optional parameters for interpolation
 * @returns {string} Translated string
 */
function t(key, locale = 'en', params = {}) {
  return i18next.getFixedT(locale, 'backend')(key, params);
}

module.exports = { t };

