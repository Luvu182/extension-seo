'use strict';

import { logger } from '../../shared/utils/logger.js';
// MessagingService không được sử dụng trực tiếp
import { VercelLinkService } from './vercel-link-service.js';
import { StorageService } from './storage-service.js';
import { STORAGE_KEYS, LINK_CHECKER } from '../../shared/constants.js';

/**
 * Service for checking link status
 */
class LinkCheckerServiceClass {
  constructor() {
    // Feature flags for enabling/disabling different checking methods
    this.useVercelApi = true; // Set to false to disable Vercel API usage
    this.useContentScript = true; // Set to false to disable content script checking
    this.useFetchApi = true; // Set to false to disable fetch API fallback

    // Settings keys
    this.SETTINGS_KEY = STORAGE_KEYS.LINK_CHECKER;
    this.loadSettings();
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      // Use getFromStorage instead of get
      const settings = await StorageService.getFromStorage(this.SETTINGS_KEY) || {};
      // Apply settings with defaults if not present
      this.useVercelApi = settings.useVercelApi !== undefined ? settings.useVercelApi : true;
      this.useContentScript = settings.useContentScript !== undefined ? settings.useContentScript : true;
      this.useFetchApi = settings.useFetchApi !== undefined ? settings.useFetchApi : true;

      logger.info('LinkCheckerService', `Loaded settings: Vercel API ${this.useVercelApi ? 'enabled' : 'disabled'}, Content Script ${this.useContentScript ? 'enabled' : 'disabled'}, Fetch API ${this.useFetchApi ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('LinkCheckerService', 'Error loading settings:', error);
      // Keep defaults if error
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      // Use chrome.storage.local directly as that's what StorageService uses internally
      return new Promise((resolve, reject) => {
        const data = {};
        data[this.SETTINGS_KEY] = {
          useVercelApi: this.useVercelApi,
          useContentScript: this.useContentScript,
          useFetchApi: this.useFetchApi
        };

        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            logger.error('LinkCheckerService', 'Error saving settings:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            logger.info('LinkCheckerService', 'Settings saved successfully');
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('LinkCheckerService', 'Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Update settings
   * @param {Object} newSettings - New settings to apply
   * @returns {Promise<Object>} - Current settings after update
   */
  async updateSettings(newSettings) {
    if (newSettings.query === true) {
      // Just return current settings for query
      return {
        useVercelApi: this.useVercelApi,
        useContentScript: this.useContentScript,
        useFetchApi: this.useFetchApi
      };
    }

    if (newSettings.useVercelApi !== undefined) {
      this.useVercelApi = newSettings.useVercelApi;
    }
    if (newSettings.useContentScript !== undefined) {
      this.useContentScript = newSettings.useContentScript;
    }
    if (newSettings.useFetchApi !== undefined) {
      this.useFetchApi = newSettings.useFetchApi;
    }

    await this.saveSettings();
    logger.info('LinkCheckerService', 'Settings updated');

    return {
      useVercelApi: this.useVercelApi,
      useContentScript: this.useContentScript,
      useFetchApi: this.useFetchApi
    };
  }

  /**
   * Check multiple URLs status using the most effective method available
   * @param {Array<string>} urls - Array of URLs to check
   * @param {Function} onBatchComplete - Optional callback function for batch progress
   * @returns {Promise<Object>} - Map of URL to status information
   */
  async checkMultipleUrls(urls, onBatchComplete = null) {
    logger.info('LinkCheckerService', `Checking ${urls.length} URLs`);

    // Filter out invalid URLs
    const validUrls = urls.filter(url => url && typeof url === 'string');

    if (validUrls.length === 0) {
      logger.warn('LinkCheckerService', 'No valid URLs to check');
      return {};
    }

    // Use Vercel API service if enabled
    if (this.useVercelApi) {
      try {
        logger.info('LinkCheckerService', 'Using Vercel API for checking multiple URLs');
        return await VercelLinkService.checkMultipleUrls(validUrls, onBatchComplete);
      } catch (error) {
        logger.error('LinkCheckerService', 'Vercel API check failed:', error);
        // Fall back to individual checks if Vercel API fails
      }
    }

    // Fallback: check each URL individually
    logger.info('LinkCheckerService', 'Using individual URL checks as fallback');

    const results = {};
    const batchSize = 10; // Check 10 URLs at a time for better performance

    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.checkLinkStatus(url));

      try {
        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach(result => {
          if (result.url) {
            results[result.url] = {
              status: result.status,
              statusCode: result.statusCode,
              error: result.error
            };
          }
        });

        // Call the batch completion callback if provided
        if (onBatchComplete && typeof onBatchComplete === 'function') {
          onBatchComplete({...results});
        }
      } catch (error) {
        logger.error('LinkCheckerService', 'Error checking batch:', error);
      }

      // Add a small delay between batches
      if (i + batchSize < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Check the status of a URL
   * @param {string} url - The URL to check
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>} - The status result
   */
  async checkLinkStatus(url, timeoutMs = LINK_CHECKER.DEFAULT_TIMEOUT) {
    if (!url) {
      logger.warn('LinkCheckerService', 'No URL provided for status check');
      return {
        success: false,
        url: url,
        status: 'error',
        statusCode: null,
        error: 'No URL provided'
      };
    }

    logger.info('LinkCheckerService', `Checking link status for URL: ${url}`);

    // Create a standardized response
    const createResponse = (status, statusCode, errorMessage = null) => {
      return {
        success: !errorMessage,
        url: url,
        status: status,
        statusCode: statusCode,
        error: errorMessage
      };
    };

    // Try Vercel API first if enabled
    if (this.useVercelApi) {
      try {
        const results = await VercelLinkService.checkMultipleUrls([url]);
        if (results[url]) {
          logger.info('LinkCheckerService', `Vercel API check succeeded for ${url}: ${results[url].status} (${results[url].statusCode})`);
          return createResponse(results[url].status, results[url].statusCode, results[url].error);
        }
      } catch (vercelError) {
        logger.warn('LinkCheckerService', `Vercel API check failed for ${url}: ${vercelError.message}`);
        // Continue with other methods if Vercel API fails
      }
    }

    // Try content script method if enabled
    if (this.useContentScript) {
      try {
        const tabs = await new Promise(resolve => {
          chrome.tabs.query({active: true, currentWindow: true}, resolve);
        });

        if (tabs && tabs.length > 0) {
          const activeTabId = tabs[0].id;

          try {
            // Send request to content script to check URL
            const response = await chrome.tabs.sendMessage(activeTabId, {
              action: 'checkLinkStatusXHR',
              url: url,
              timeout: timeoutMs
            });

            // If there's a result from the content script
            if (response && response.success) {
              logger.info('LinkCheckerService', `Content script check succeeded for ${url}: ${response.status} (${response.statusCode})`);
              return response;
            }
          } catch (msgError) {
            logger.warn('LinkCheckerService', `Content script message failed: ${msgError.message}`);
            // Continue with fetch fallback
          }
        }
      } catch (error) {
        logger.warn('LinkCheckerService', `Content script check failed for ${url}: ${error.message}`);
        // Continue with fetch fallback
      }
    }

    // Fallback: Use native fetch API if enabled
    if (this.useFetchApi) {
      try {
        const result = await this.checkWithFetch(url, timeoutMs);
        return { ...result, url };
      } catch (fetchError) {
        logger.error('LinkCheckerService', `Fetch check failed for ${url}: ${fetchError.message}`);
        return createResponse('error', null, fetchError.message);
      }
    }

    // If all methods are disabled or failed
    logger.warn('LinkCheckerService', `All methods failed or disabled for ${url}`);
    return createResponse('unknown', null, 'All check methods failed or disabled');
  }

  /**
   * Fallback: Check URL using fetch API
   * @param {string} url - The URL to check
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>} - The status result
   */
  async checkWithFetch(url, timeoutMs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        logger.warn('LinkCheckerService', `Timeout (${timeoutMs}ms) reached for ${url}`);
      }, timeoutMs);

      // Try to use fetch with manual redirect
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      // When status is 3xx - it's a redirect
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location') || response.headers.get('location') || null;

        return {
          success: true,
          status: 'redirect',
          statusCode: response.status,
          redirectUrl: location || 'Unknown destination',
          note: 'Redirect detected via fetch'
        };
      }

      // Return normal status
      return {
        success: true,
        status: this.getStatusText(response.status),
        statusCode: response.status,
        note: 'Status determined via fetch'
      };
    } catch (error) {
      // Handle errors
      if (error.name === 'AbortError') {
        logger.warn('LinkCheckerService', `Request timed out for ${url} after ${timeoutMs}ms`);
        return {
          success: false,
          status: 'timeout',
          statusCode: null,
          error: `Request timed out after ${timeoutMs}ms`
        };
      }

      // Final fallback - cannot determine status
      return {
        success: false,
        status: 'error',
        statusCode: null,
        note: 'Limited by browser security - see console for details',
        error: error.message
      };
    }
  }

  /**
   * Helper to get status description based on status code
   * @param {number} statusCode - HTTP status code
   * @returns {string} - Human-readable status
   */
  getStatusText(statusCode) {
    if (statusCode >= 200 && statusCode < 300) {
      return 'available';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'redirect';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'client error';
    } else if (statusCode >= 500) {
      return 'server error';
    } else {
      return 'unknown';
    }
  }
}

// Export as a singleton
export const LinkCheckerService = new LinkCheckerServiceClass();
