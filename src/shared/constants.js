'use strict';

// Shared constants for the extension

export const STATUS_CODES = {
  SUCCESS: 200,
  REDIRECT: 30,
  CLIENT_ERROR: 40,
  SERVER_ERROR: 50,
  NETWORK_ERROR: 0
};

export const STORAGE_KEYS = {
  SETTINGS: 'seoAiAssistantSettings',
  STATE: 'seoAiAssistantState',
  TAB_PREFIX: 'tab_',
  LINK_CHECKER: 'link_checker_settings'
};

export const MESSAGE_TYPES = {
  CONTENT_UPDATE: 'content_update',
  SPA_NAVIGATION: 'spa_navigation_detected',
  CONTENT_ERROR: 'content_extraction_error',
  GET_SEO_DATA: 'getSEOData',
  FETCH_SERVER: 'fetchServerDetails',
  INJECT_WEB_VITALS: 'injectWebVitals',
  WEB_VITALS_RESULT: 'webVitalsResult',
  CHECK_LINK: 'checkLinkStatus',
  CHECK_LINK_XHR: 'checkLinkStatusXHR',
  CHECK_MULTIPLE_LINKS: 'checkMultipleLinks',
  UPDATE_LINK_SETTINGS: 'updateLinkCheckerSettings',
  EXTRACT_SEO_DATA: 'extractSEOData',
  GET_CURRENT_TAB_ID: 'getCurrentTabId',
  CLEAR_SPA_DATA: 'clearSpaData'
};

export const SPA_SOURCES = {
  URL_WATCHER: 'url_watcher',
  MUTATION: 'mutation',
  POPSTATE: 'popstate',
  PUSHSTATE: 'pushstate',
  REPLACESTATE: 'replacestate',
  VISIBILITY: 'visibility_change',
  INITIAL_IDLE: 'initial_idle',
  INITIAL_LOAD: 'initial_load'
};

export const TABS = {
  OVERVIEW: 'overview',
  STRUCTURED: 'structured',
  LINKS: 'links',
  PERFORMANCE: 'performance',
  CONTENT: 'content',
  ISSUES: 'issues',
  AI: 'ai',
  SETTINGS: 'settings'
};

export const SPA_DETECTION = {
  DOM_UPDATE_THRESHOLD: 2,
  NAVIGATION_DEBOUNCE_TIME: 800,
  FORCE_REFRESH_INTERVAL: 5000,
  URL_WATCH_INTERVAL: 1000,
  MAX_EXTRACTION_ATTEMPTS: 3,
  CHANGE_THRESHOLD: 3 // Thêm CHANGE_THRESHOLD vào đây
};

export const CLEANUP = {
  MAX_URLS_PER_TAB: 20,
  MAX_AGE_MS: 30 * 60 * 1000, // 30 minutes
  CLEANUP_INTERVAL: 10 * 60 * 1000 // 10 minutes
};

export const LINK_CHECKER = {
  BATCH_SIZE: 20,
  MAX_URLS_PER_REQUEST: 100,
  DEFAULT_TIMEOUT: 5000,
  BATCH_DELAY: 1000, // Delay between batches in milliseconds
  VERCEL_API_ENDPOINT: 'https://vercel-alpha-liart-20.vercel.app/api/check-status'
};
