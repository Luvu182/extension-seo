'use strict';

import { logger } from '../../shared/utils/logger.js';

/**
 * Controller for handling tab-related operations
 */
class TabControllerClass {
  /**
   * Initialize controller
   */
  initialize() {
    logger.info('TabController', 'Initialized');
  }

  /**
   * Handle request to get the current tab ID
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleGetCurrentTabId(message, sender, sendResponse) {
    // If sent from a tab, we already know the tab ID
    if (sender.tab && sender.tab.id) {
      logger.info('TabController', `Returning current tab ID: ${sender.tab.id} (from sender)`);
      sendResponse({ success: true, tabId: sender.tab.id });
      return false;
    }

    // Otherwise, query for the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        logger.info('TabController', `Returning current tab ID: ${tabs[0].id} (from query)`);
        sendResponse({ success: true, tabId: tabs[0].id });
      } else {
        logger.warn('TabController', 'Could not determine current tab ID');
        sendResponse({ success: false, error: "Could not determine current tab ID" });
      }
    });

    return true; // Keep channel open for async response
  }
}

// Export as singleton
export const TabController = new TabControllerClass();
