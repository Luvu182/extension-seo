'use strict';

import { WebVitalsService } from '../services/web-vitals-service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controller for handling Web Vitals related messages
 */
class WebVitalsControllerClass {
  /**
   * Initialize controller
   */
  initialize() {
    logger.info('WebVitalsController', 'Initialized');
  }

  /**
   * Get the latest Web Vitals for a tab
   * @param {number} tabId - The tab ID
   * @param {string} tabUrl - Optional tab URL
   * @returns {Object|null} - The web vitals data or null
   */
  getLatestWebVitals(tabId, tabUrl) {
    try {
      if (!tabId) {
        logger.warn('WebVitalsController', 'getLatestWebVitals called without tabId');
        return null;
      }

      // If URL is not provided, try to get it
      if (!tabUrl) {
        // Return the data from service directly, which will handle the null URL case
        return WebVitalsService.getLatestWebVitals(tabId, tabUrl);
      }

      return WebVitalsService.getLatestWebVitals(tabId, tabUrl);
    } catch (error) {
      logger.error('WebVitalsController', 'Error in getLatestWebVitals', error);
      return null;
    }
  }

  /**
   * Handle inject web vitals request
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleInjectWebVitals(message, sender, sendResponse) {
    let tabId;

    // Get tab ID from sender or message or query active tab
    if (sender && sender.tab && sender.tab.id) {
      // Called from content script
      tabId = sender.tab.id;
      this.injectWebVitalsIntoTab(tabId, sendResponse);
    } else if (message.tabId) {
      // Called from popup with specific tabId
      tabId = message.tabId;
      this.injectWebVitalsIntoTab(tabId, sendResponse);
    } else {
      // No tabId, get active tab
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || !tabs.length) {
          if (sendResponse) sendResponse({ success: false, error: "No active tab found" });
          return;
        }
        this.injectWebVitalsIntoTab(tabs[0].id, sendResponse);
      });
    }

    return true; // Keep channel open for async response
  }

  /**
   * Helper method to inject Web Vitals into a tab
   * @param {number} tabId - The tab ID
   * @param {Function} sendResponse - The response callback
   */
  async injectWebVitalsIntoTab(tabId, sendResponse) {
    try {
      logger.info('WebVitalsController', `Injecting web vitals into tab ${tabId}`);

      // Use the WebVitalsService to inject the script
      const success = await WebVitalsService.injectWebVitalsScript(tabId);

      if (success) {
        logger.info('WebVitalsController', `Successfully injected web vitals script into tab ${tabId}`);
        if (sendResponse) sendResponse({ success: true });
      } else {
        logger.warn('WebVitalsController', `Failed to inject web vitals script into tab ${tabId}`);
        if (sendResponse) sendResponse({ success: false, error: 'Failed to inject web vitals script' });
      }
    } catch (error) {
      logger.error('WebVitalsController', `Error injecting web vitals script into tab ${tabId}`, error);
      if (sendResponse) sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle web vitals result message
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleWebVitalsResult(message, sender, sendResponse) {
    if (!message.data) {
      logger.warn('WebVitalsController', 'Received webVitalsResult with no data');
      if (sendResponse) sendResponse({ success: false, error: 'No data provided' });
      return false;
    }

    try {
      // Get tab info from sender or message
      const tabId = sender.tab ? sender.tab.id : message.tabId;
      const tabUrl = sender.tab ? sender.tab.url : message.url;
      const name = String(message.data.name).toLowerCase();
      const value = Number(message.data.value);

      // Validate required parameters
      if (!tabId || !name || value === undefined) {
        // If missing tab info, try to get active tab
        if (!tabId) {
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs.length > 0) {
              const activeTabId = tabs[0].id;
              const activeTabUrl = tabs[0].url;

              if (activeTabUrl && name && value !== undefined) {
                // Process with active tab info
                WebVitalsService.saveWebVitalMetric(activeTabId, activeTabUrl, name, value);
                if (sendResponse) sendResponse({ success: true });
              } else {
                if (sendResponse) sendResponse({ success: false, error: 'Invalid web vital data' });
              }
            } else {
              if (sendResponse) sendResponse({ success: false, error: 'No active tab found' });
            }
          });
          return true; // Keep channel open for async response
        } else {
          // Missing name or value
          logger.warn('WebVitalsController', 'Invalid web vitals data', { tabId, name, value });
          if (sendResponse) sendResponse({ success: false, error: 'Invalid web vitals data' });
          return false;
        }
      }

      // Process with available tab info
      if (tabUrl) {
        WebVitalsService.saveWebVitalMetric(tabId, tabUrl, name, value);
        if (sendResponse) sendResponse({ success: true });
      } else {
        // Missing URL but have tabId, try to get URL
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            logger.warn('WebVitalsController', `Error getting tab ${tabId}`, chrome.runtime.lastError);
            if (sendResponse) sendResponse({ success: false, error: 'Tab not found' });
            return;
          }

          if (tab && tab.url) {
            WebVitalsService.saveWebVitalMetric(tabId, tab.url, name, value);
            if (sendResponse) sendResponse({ success: true });
          } else {
            if (sendResponse) sendResponse({ success: false, error: 'Tab URL not available' });
          }
        });
        return true; // Keep channel open for async response
      }
    } catch (error) {
      logger.error('WebVitalsController', 'Error processing web vitals result', error);
      if (sendResponse) sendResponse({ success: false, error: error.message });
    }

    return true; // Keep channel open for possible async response
  }

  /**
   * Handle request for latest web vitals data
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleGetLatestWebVitals(message, sender, sendResponse) {
    try {
      // Get the active tab
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || !tabs.length) {
          if (sendResponse) {
            sendResponse({ success: false, error: "No active tab found" });
          }
          return;
        }

        const tabId = tabs[0].id;
        const tabUrl = tabs[0].url;

        // Get the latest web vitals data
        const webVitals = WebVitalsService.getLatestWebVitals(tabId, tabUrl);

        if (webVitals) {
          logger.info('WebVitalsController', `Returning latest web vitals for tab ${tabId}`);
          if (sendResponse) {
            sendResponse({
              success: true,
              webVitals: webVitals,
              timestamp: Date.now()
            });
          }
        } else {
          logger.info('WebVitalsController', `No web vitals data available for tab ${tabId}`);
          if (sendResponse) {
            sendResponse({
              success: false,
              error: "No web vitals data available"
            });
          }
        }
      });

      return true; // Keep channel open for async response
    } catch (error) {
      logger.error('WebVitalsController', 'Error handling getLatestWebVitals', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
      return false;
    }
  }
}

// Export as singleton
export const WebVitalsController = new WebVitalsControllerClass();
