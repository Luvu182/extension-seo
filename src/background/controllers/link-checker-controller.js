'use strict';

import { LinkCheckerService } from '../services/link-checker-service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controller for handling link status checking
 */
class LinkCheckerControllerClass {
  /**
   * Initialize controller
   */
  initialize() {
    logger.info('LinkCheckerController', 'Initialized');
  }

  /**
   * Handle check link status request for a single URL
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleCheckLinkStatus(message, sender, sendResponse) {
    const url = message.url;
    const timeout = message.timeout || 5000; // Default timeout of 5 seconds

    if (!url) {
      if (sendResponse) sendResponse({ success: false, error: "No URL provided" });
      return false;
    }

    logger.info('LinkCheckerController', `Checking status for URL: ${url}`);

    // Use LinkCheckerService to perform the check
    LinkCheckerService.checkLinkStatus(url, timeout)
      .then(result => {
        logger.info('LinkCheckerController', `Status check result for ${url}: ${result.statusCode || 'N/A'}`);
        if (sendResponse) sendResponse(result);
      })
      .catch(error => {
        logger.error('LinkCheckerController', `Error checking link status for ${url}`, error);
        if (sendResponse) {
          sendResponse({
            success: false,
            status: 'error',
            statusCode: null,
            error: error.message || 'Unknown error'
          });
        }
      });

    return true; // Keep channel open for async response
  }

  /**
   * Handle check multiple links status
   * @param {Object} message - The message containing array of URLs
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleCheckMultipleLinks(message, sender, sendResponse) {
    const urls = message.urls;
    const onProgress = message.reportProgress || false;

    if (!Array.isArray(urls) || urls.length === 0) {
      if (sendResponse) sendResponse({
        success: false,
        error: "No valid URLs provided",
        results: {}
      });
      return false;
    }

    logger.info('LinkCheckerController', `Checking status for ${urls.length} URLs`);

    let progressCallback = null;

    // Setup progress reporting if requested
    if (onProgress && sendResponse) {
      // Keep track of last reported count to avoid unnecessary updates
      let lastReportedCount = 0;

      progressCallback = (progressResults) => {
        const currentCount = Object.keys(progressResults).length;

        // Only send updates when there's actual progress (count changed)
        if (currentCount > lastReportedCount) {
          lastReportedCount = currentCount;

          // Report progress back to caller
          logger.info('LinkCheckerController', `Reporting progress: ${currentCount}/${urls.length} URLs checked`);

          // Send progress update to the original caller
          sendResponse({
            success: true,
            complete: false, // Signal this is a progress update, not final
            progress: {
              total: urls.length,
              checked: currentCount,
              results: {...progressResults}
            }
          });

          // Also broadcast progress to all listeners
          // This helps with the batch processing in Turbo mode
          chrome.runtime.sendMessage({
            action: 'batchProgress',
            forUrls: urls,
            results: progressResults,
            total: urls.length,
            checked: currentCount
          }).catch(err => {
            // Ignore errors from broadcasting - this is just a helper
            logger.warn('LinkCheckerController', 'Error broadcasting progress:', err);
          });
        }
      };
    }

    // Use LinkCheckerService to perform the check
    LinkCheckerService.checkMultipleUrls(urls, progressCallback)
      .then(results => {
        logger.info('LinkCheckerController', `Completed status check for ${urls.length} URLs`);
        if (sendResponse) {
          sendResponse({
            success: true,
            complete: true, // Signal this is the final response
            results: results
          });
        }
      })
      .catch(error => {
        logger.error('LinkCheckerController', `Error checking multiple links status:`, error);
        if (sendResponse) {
          sendResponse({
            success: false,
            complete: true,
            error: error.message || 'Unknown error',
            results: {}
          });
        }
      });

    return true; // Keep channel open for async response
  }

  /**
   * Handle update link checker settings
   * @param {Object} message - The message containing settings
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleUpdateSettings(message, sender, sendResponse) {
    const settings = message.settings;

    if (!settings || typeof settings !== 'object') {
      if (sendResponse) sendResponse({
        success: false,
        error: "Invalid settings object"
      });
      return false;
    }

    logger.info('LinkCheckerController', `Updating link checker settings`);

    LinkCheckerService.updateSettings(settings)
      .then((updatedSettings) => {
        if (sendResponse) {
          sendResponse({
            success: true,
            message: "Settings updated successfully",
            settings: updatedSettings
          });
        }
      })
      .catch(error => {
        logger.error('LinkCheckerController', `Error updating settings:`, error);
        if (sendResponse) {
          sendResponse({
            success: false,
            error: error.message || 'Unknown error'
          });
        }
      });

    return true; // Keep channel open for async response
  }
}

// Export as singleton
export const LinkCheckerController = new LinkCheckerControllerClass();
