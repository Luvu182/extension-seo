'use strict';

import { StorageService } from '../services/storage-service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controller for handling SPA navigation events and content updates
 */
class SpaNavigationControllerClass {
  /**
   * Initialize controller
   */
  initialize() {
    logger.info('SpaNavigationController', 'Initialized');
  }

  /**
   * Handle SPA navigation detection notification from content script.
   * This sets a temporary loading state.
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleSpaNavigation(message, sender, sendResponse) {
    if (!sender.tab) return false;

    const tabId = sender.tab.id;
    const url = message.url;
    const source = message.source || 'unknown';
    const timestamp = message.timestamp || Date.now();

    logger.info('SpaNavigationController', `Received SPA navigation notification for tab ${tabId}, URL: ${url}, source: ${source}`);

    // --- MODIFICATION START ---
    // Do NOT set isLoading: true here immediately. 
    // We only log the detection and update the last known URL.
    // The loading state should be managed by the actual data update process.
    try {
        // Only update timestamps and last known URL
        StorageService.setUpdateTimestamp(tabId, timestamp); 
        StorageService.setLastKnownUrl(tabId, url); 
        // We don't store temporary loading data here anymore.
        // StorageService.setTabData(tabId, url, tempData); 

    } catch (error) {
        logger.error('SpaNavigationController', `Error updating timestamps/URL for SPA nav ${url}`, error);
    } finally {
        // Acknowledge receipt 
        if (sendResponse) sendResponse({ success: true }); 
    }
    // Return false as we don't need to keep the channel open long
    return false; 
  }

  /**
   * Handle content extraction errors
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleContentError(message, sender, sendResponse) {
    if (!sender.tab) return false;

    const tabId = sender.tab.id;
    const url = message.url;
    const error = message.error || "Unknown error during extraction";
    const source = message.source || 'unknown';

    logger.error('SpaNavigationController', `Received extraction error for tab ${tabId}, URL: ${url}: ${error}`);

    try {
        const existingData = StorageService.getTabData(tabId, url) || {};
        existingData.error = error;
        existingData.extractionFailed = true;
        existingData.navigationSource = source;
        existingData.timestamp = message.timestamp || Date.now();
        existingData.isLoading = false; 
        existingData.partialData = true; 
        existingData.waitingForExtraction = false; 
        StorageService.setTabData(tabId, url, existingData);
    } catch (storageError) {
        logger.error('SpaNavigationController', `Error updating storage on content error for ${url}`, storageError);
    } finally {
        if (sendResponse) sendResponse({ success: true }); 
    }
    return false; 
  }

  /**
   * Handle content update messages (main data processing)
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleContentUpdate(message, sender, sendResponse) {
    if (!sender.tab || !message.data) return false;

    const tabId = sender.tab.id;
    const incomingUrl = message.data.url;
    const source = message.source || 'unknown';
    const timestamp = message.timestamp || Date.now();
    const isSpaNavigation = message.data.isSpaNavigation || false;
    let success = false; // Track if processing was successful

    if (!tabId || !incomingUrl) {
      logger.warn('SpaNavigationController', 'Invalid content_update message', message);
      if (sendResponse) sendResponse({ success: false, error: "Invalid message" });
      return false;
    }

    try {
        if (isSpaNavigation) {
          logger.info('SpaNavigationController', `Received SPA navigation update for tab ${tabId}, source: ${source}, URL: ${incomingUrl}`);
        }

        const lastUpdateTimestamp = StorageService.getUpdateTimestamp(tabId);
        if (!isSpaNavigation && lastUpdateTimestamp && timestamp < lastUpdateTimestamp) {
          logger.warn('SpaNavigationController', `Received outdated update for tab ${tabId} (${source}). Ignoring.`);
          // Don't send response here, just return false
          return false; 
        }

        StorageService.setUpdateTimestamp(tabId, timestamp);
        StorageService.setLastKnownUrl(tabId, incomingUrl);

        const existingData = StorageService.getTabData(tabId, incomingUrl) || {};

        const mergedData = {
          ...message.data,
          ...(existingData.statusCode !== undefined && existingData.statusCode !== 'loading' && { statusCode: existingData.statusCode }),
          ...(existingData.responseDetailStatusCode !== undefined && { responseDetailStatusCode: existingData.responseDetailStatusCode }),
          ...(existingData.redirect && { redirect: existingData.redirect }),
          ...(existingData.webVitals && { webVitals: existingData.webVitals }),
          ...(existingData.serverInfo && { serverInfo: existingData.serverInfo }),
          ...(existingData.isSpaNavigation && source !== 'INITIAL_LOAD' && source !== 'INITIAL_IDLE' && { isSpaNavigation: true }), // Preserve SPA flag only if not initial load
          ...(existingData.navigationSource && source !== 'INITIAL_LOAD' && source !== 'INITIAL_IDLE' && { navigationSource: existingData.navigationSource }), // Preserve source only if not initial load
          isLoading: false, // ALWAYS set isLoading to false on content update
          partialData: false, // Mark as complete
          waitingForExtraction: false, // ALWAYS set waiting to false on content update
          extractionFailed: false, // Clear any previous error state
          extractionCompleted: Date.now(),
          lastUpdate: {
            source: source,
            timestamp: timestamp,
            date: new Date(timestamp).toISOString(),
            wasSpaNavigation: message.data.isSpaNavigation || false
          }
        };

        // Safety checks
        if (existingData.statusCode !== undefined) mergedData.statusCode = existingData.statusCode;
        if (existingData.responseDetailStatusCode !== undefined) mergedData.responseDetailStatusCode = existingData.responseDetailStatusCode;
        if (existingData.redirect) mergedData.redirect = existingData.redirect;
        if (existingData.webVitals) mergedData.webVitals = existingData.webVitals;
        if (existingData.serverInfo) mergedData.serverInfo = existingData.serverInfo;

        // Placeholders
        if (mergedData.responseDetailStatusCode === undefined) mergedData.responseDetailStatusCode = 'N/A';
        if (mergedData.statusCode === undefined) mergedData.statusCode = 'N/A';
        if (!mergedData.serverInfo) mergedData.serverInfo = { ip: 'N/A', httpVersion: 'N/A', server: 'N/A', loaded: false };
        if (!mergedData.webVitals) mergedData.webVitals = {};

        logger.info('SpaNavigationController', `Storing data for tab ${tabId} URL ${incomingUrl} from ${source}`);
        StorageService.setTabData(tabId, incomingUrl, mergedData);
        success = true; // Mark as successful

    } catch (error) {
        logger.error('SpaNavigationController', `Error processing content update for ${incomingUrl}`, error);
        // Attempt to store error state, but ensure flags are cleared below
        try {
            const existingDataOnError = StorageService.getTabData(tabId, incomingUrl) || {};
            existingDataOnError.error = `Processing error: ${error.message}`;
            existingDataOnError.extractionFailed = true; 
            StorageService.setTabData(tabId, incomingUrl, existingDataOnError);
        } catch (finalError) {
             logger.error('SpaNavigationController', `Failed to store error state for ${incomingUrl}`, finalError);
        }
    } finally {
        // --- CRITICAL: Ensure loading flags are cleared in finally ---
        try {
            const finalDataCheck = StorageService.getTabData(tabId, incomingUrl);
            if (finalDataCheck && (finalDataCheck.isLoading || finalDataCheck.waitingForExtraction)) {
                 logger.info('SpaNavigationController', `Clearing flags in finally block for ${incomingUrl}`);
                 finalDataCheck.isLoading = false;
                 finalDataCheck.waitingForExtraction = false;
                 // Don't mark as partial=false here, might hide a processing error
                 StorageService.setTabData(tabId, incomingUrl, finalDataCheck);
            }
        } catch (finalError) {
             logger.error('SpaNavigationController', `Error in finally block clearing flags for ${incomingUrl}`, finalError);
        }
        // Send response after finally block ensures flags are attempted to be cleared
        if (sendResponse) sendResponse({ success: success }); 
    }
    // Return true because async operations might still be pending within the try/catch/finally
    return true; 
  }

  /**
   * Handle request to clear stale SPA data
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleClearSpaData(message, sender, sendResponse) {
    const tabId = message.tabId;
    const url = message.url;

    if (!tabId || !url) {
      logger.warn('SpaNavigationController', 'Invalid clearSpaData message, missing tabId or url', message);
      if (sendResponse) sendResponse({ success: false, error: "Missing tabId or url" });
      return false;
    }

    logger.info('SpaNavigationController', `Clearing SPA data for tab ${tabId}, url ${url}`);

    try {
      StorageService.clearTabData(tabId, url);
      const storageKey = `tab_${tabId}_${encodeURIComponent(url)}`;
      chrome.storage.local.remove(storageKey, () => {
        if (chrome.runtime.lastError) {
          logger.warn('SpaNavigationController', `Error removing data from storage: ${chrome.runtime.lastError.message}`);
        } else {
          logger.info('SpaNavigationController', `Successfully removed data from storage for key ${storageKey}`);
        }
      });
      StorageService.setLastKnownUrl(tabId, null);
      if (sendResponse) sendResponse({ success: true });
    } catch (error) {
      logger.error('SpaNavigationController', 'Error clearing SPA data', error);
      if (sendResponse) sendResponse({ success: false, error: error.message });
    }
    return true; 
  }

  /**
   * Handle skipped SPA navigation notifications from content script
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleSpaNavigationSkipped(message, sender, sendResponse) {
    if (!sender.tab) return false;

    const tabId = sender.tab.id;
    const url = message.url;
    const source = message.source || 'unknown';

    logger.info('SpaNavigationController', `Received SPA navigation skipped notification for tab ${tabId}, URL: ${url}, source: ${source}`);

    try {
        const existingData = StorageService.getTabData(tabId, url);
        if (existingData && (existingData.isLoading || existingData.waitingForExtraction)) {
          logger.info('SpaNavigationController', `Clearing loading/waiting flags for skipped navigation: ${url}`);
          existingData.isLoading = false;
          existingData.waitingForExtraction = false;
          existingData.partialData = false; // Mark as not partial anymore since processing was skipped
          existingData.lastUpdate = { 
              source: `skipped_${source}`,
              timestamp: message.timestamp || Date.now(),
              date: new Date(message.timestamp || Date.now()).toISOString()
          };
          StorageService.setTabData(tabId, url, existingData);
        } else {
           logger.info('SpaNavigationController', `No temporary data found or flags already cleared for skipped navigation: ${url}`);
        }
    } catch (error) {
        logger.error('SpaNavigationController', `Error handling skipped navigation for ${url}`, error);
    } finally {
       if (sendResponse) sendResponse({ success: true }); // Acknowledge receipt
    }
    return false; // No need to keep channel open
  }
}

// Export as singleton
export const SpaNavigationController = new SpaNavigationControllerClass();
