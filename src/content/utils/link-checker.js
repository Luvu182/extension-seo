'use strict';

import { logger } from '../../shared/utils/logger.js';

/**
 * Utility class to check link status from content script
 * Using XHR for better visibility into redirects
 */
export class LinkChecker {
  /**
   * Check the status of a URL using XMLHttpRequest
   * @param {string} url - The URL to check
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>} - The status result
   */
  static async checkStatus(url, timeoutMs = 5000) {
    if (!url) {
      return {
        success: false,
        status: 'error',
        statusCode: null,
        error: 'No URL provided'
      };
    }

    logger.info('LinkChecker', `Content script checking link status for URL: ${url}`);

    // Try using fetch first (faster and more reliable)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'HEAD',  // HEAD is faster than GET
        redirect: 'follow',  // Follow redirects automatically
        signal: controller.signal,
        cache: 'no-store',  // Don't use cache
        credentials: 'omit',  // Don't send cookies
        mode: 'no-cors'  // Allow cross-origin requests
      });

      clearTimeout(timeoutId);

      // Check if we got a redirect
      const finalUrl = response.url;
      const wasRedirected = finalUrl && finalUrl !== url;

      if (wasRedirected) {
        logger.info('LinkChecker', `✓ Redirect detected from ${url} to ${finalUrl}`);
        return {
          success: true,
          status: 'redirect',
          statusCode: response.status,
          redirectUrl: finalUrl
        };
      }

      // Process normal response
      let statusText = 'unknown';
      if (response.status >= 200 && response.status < 300) {
        statusText = 'available';
      } else if (response.status >= 300 && response.status < 400) {
        statusText = 'redirect';
      } else if (response.status >= 400 && response.status < 500) {
        statusText = 'client error';
      } else if (response.status >= 500) {
        statusText = 'server error';
      }

      return {
        success: true,
        status: statusText,
        statusCode: response.status
      };
    } catch (fetchError) {
      // If fetch fails (e.g., CORS issues or timeout), fall back to XHR
      if (fetchError.name === 'AbortError') {
        logger.warn('LinkChecker', `Fetch timeout for ${url}, falling back to XHR`);
      } else {
        logger.warn('LinkChecker', `Fetch failed for ${url}, falling back to XHR: ${fetchError.message}`);
      }

      // Fall back to XHR
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Timeout handler
        const timeout = setTimeout(() => {
          xhr.abort();
          logger.info('LinkChecker', `XHR timeout for ${url}`);
          resolve({
            success: false,
            status: 'timeout',
            statusCode: null,
            error: `Request timed out after ${timeoutMs}ms`
          });
        }, timeoutMs);

        // Set up XHR with all events
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            clearTimeout(timeout);

            // Check if we got a redirect
            const finalUrl = xhr.responseURL;
            const wasRedirected = finalUrl && finalUrl !== url;

            if (wasRedirected) {
              logger.info('LinkChecker', `✓ Redirect detected from ${url} to ${finalUrl}`);
              resolve({
                success: true,
                status: 'redirect',
                statusCode: xhr.status >= 300 && xhr.status < 400 ? xhr.status : 301,
                redirectUrl: finalUrl
              });
              return;
            }

            // Normal response
            if (xhr.status) {
              let statusText = 'unknown';
              if (xhr.status >= 200 && xhr.status < 300) {
                statusText = 'available';
              } else if (xhr.status >= 300 && xhr.status < 400) {
                statusText = 'redirect';
              } else if (xhr.status >= 400 && xhr.status < 500) {
                statusText = 'client error';
              } else if (xhr.status >= 500) {
                statusText = 'server error';
              }

              resolve({
                success: true,
                status: statusText,
                statusCode: xhr.status
              });
            } else {
              resolve({
                success: false,
                status: 'error',
                statusCode: null,
                error: 'Unknown error'
              });
            }
          }
        };

        xhr.onerror = function() {
          clearTimeout(timeout);
          logger.info('LinkChecker', `XHR error for ${url}`);

          resolve({
            success: false,
            status: 'error',
            statusCode: null,
            error: 'Network error'
          });
        };

        try {
          // Important: Use HEAD request which is lightweight
          xhr.open('HEAD', url, true);
          // Allow redirects to be visible
          xhr.send();
          logger.info('LinkChecker', `XHR sent for ${url}`);
        } catch (error) {
          clearTimeout(timeout);
          logger.error('LinkChecker', `Error initiating XHR for ${url}:`, error);

          resolve({
            success: false,
            status: 'error',
            statusCode: null,
            error: `Error initiating request: ${error.message}`
          });
        }
      });
    }
  }
}
