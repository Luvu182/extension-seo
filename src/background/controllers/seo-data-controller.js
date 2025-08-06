'use strict';

import { StorageService } from '../services/storage-service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controller for handling SEO data retrieval
 */
class SeoDataControllerClass {
  /**
   * Initialize controller
   */
  initialize() {
    logger.info('SeoDataController', 'Initialized');
  }

  /**
   * Handle get SEO data requests from popup
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleGetSeoData(message, sender, sendResponse) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs || !tabs.length || !tabs[0].id) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      const tabId = tabs[0].id;
      const tabUrl = tabs[0].url;

      if (!tabUrl || !(tabUrl.startsWith('http:') || tabUrl.startsWith('https:'))) {
        sendResponse({ success: false, error: "Tab URL is not supported" });
        return;
      }

      logger.info('SeoDataController', `Retrieving data for tab ${tabId}, url ${tabUrl}`);

      // Check for URL changes
      const lastKnownUrl = StorageService.getLastKnownUrl(tabId);
      if (lastKnownUrl && lastKnownUrl !== tabUrl) {
        logger.info('SeoDataController', `URL CHANGED from ${lastKnownUrl} to ${tabUrl}.`);
        // Don't clear data here - just note the change
      }
      
      // ALWAYS update the last known URL to current URL for accurate data retrieval
      // This is critical when switching tabs
      StorageService.setLastKnownUrl(tabId, tabUrl);

      // Try to get data for the current URL directly first
      let tabData = StorageService.getTabData(tabId, tabUrl);

      // If no data for current URL, trigger a refresh
      if (!tabData) {
        // Send message to content script to extract data
        logger.info('SeoDataController', `No data found for tab ${tabId}, initiating extraction`);
        this.triggerContentScriptExtraction(tabId, tabUrl);
        
        // Return loading state to popup
        sendResponse({ 
          success: true,
          data: {
            url: tabUrl,
            isLoading: true,
            waitingForExtraction: true,
            needsRefresh: true,
            timestamp: Date.now()
          }
        });
        return;
      }
      
      // If data exists but is partial/loading, still return it
      if (tabData.partialData || tabData.waitingForExtraction || tabData.isLoading) {
        logger.info('SeoDataController', `Found partial/loading data for tab ${tabId}`);
        sendResponse({ success: true, data: tabData });
        return;
      }

      // We have data, check if it needs special handling
      if (tabData) {
        // If extraction failed, mark it as error
        if (tabData.extractionFailed) {
          logger.info('SeoDataController', `Found data with extraction failure for tab ${tabId}`);
          tabData.error = tabData.error || "Failed to extract data from page";
        }

        logger.info('SeoDataController', `Returning existing data for tab ${tabId}`);
        sendResponse({ success: true, data: tabData });
        return;
      }

      // This should not happen as we handle no data case above
      logger.warn('SeoDataController', `Unexpected: no data found for tab ${tabId}`);
      sendResponse({ 
        success: true,
        data: {
          needsRefresh: true,
          url: tabUrl
        }
      });
    });

    return true; // Keep channel open for tabs.query async response
  }

  /**
   * Trigger data extraction via content script
   * @param {number} tabId - The tab ID
   * @param {string} tabUrl - The current tab URL
   */
  triggerContentScriptExtraction(tabId, tabUrl) {
    try {
      // Don't create placeholder data - let the actual data come from content script
      logger.info('SeoDataController', `Triggering content script extraction for tab ${tabId}, url ${tabUrl}`);
      
      // Try to communicate with the content script
      chrome.tabs.sendMessage(tabId, { 
        action: "extractSEOData",
        background: true,
        forceRefresh: true // Force refresh to ensure we get fresh data
      }, response => {
        if (chrome.runtime.lastError) {
          logger.info('SeoDataController', `Content script not available in tab ${tabId}, needs injection`);
          
          // Attempt to inject content script
          try {
            // Get content script file from manifest
            const manifest = chrome.runtime.getManifest();
            const contentScripts = manifest.content_scripts;
            
            if (contentScripts && contentScripts.length > 0 && contentScripts[0].js) {
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: contentScripts[0].js
              }, () => {
                if (chrome.runtime.lastError) {
                  logger.error('SeoDataController', `Failed to inject content script: ${chrome.runtime.lastError.message}`);
                  return;
                }
                
                // Wait a bit for content script to initialize
                setTimeout(() => {
                  // Try again after injection
                  chrome.tabs.sendMessage(tabId, { 
                    action: "extractSEOData",
                    background: true,
                    forceRefresh: true // Force refresh
                  });
                }, 500);
              });
            }
          } catch (err) {
            logger.error('SeoDataController', `Error injecting content script: ${err.message}`);
          }
        } else if (response && response.success) {
          logger.info('SeoDataController', `Content script successfully started extraction for tab ${tabId}`);
        }
      });
    } catch (error) {
      logger.error('SeoDataController', `Error triggering content script extraction: ${error.message}`);
    }
  }

  /**
   * Check storage for SEO data with fallback strategy
   * @param {number} tabId - The tab ID
   * @param {string} tabUrl - The current tab URL
   * @param {string} fallbackUrl - A fallback URL if current not found
   * @param {Function} sendResponse - The response callback
   */
  checkStorageForSeoData(tabId, tabUrl, fallbackUrl, sendResponse) {
    const storageKey = `tab_${tabId}_${encodeURIComponent(tabUrl)}`;
    
    chrome.storage.local.get(storageKey, (result) => {
      if (result[storageKey]) {
        // Found in storage for current URL
        logger.info('SeoDataController', `Found data in storage for tab ${tabId}, url ${tabUrl}`);
        const retrievedData = result[storageKey];

        // Cache in memory
        StorageService.setTabData(tabId, tabUrl, retrievedData);

        sendResponse({ success: true, data: retrievedData });
      } else if (fallbackUrl && fallbackUrl !== tabUrl) {
        // Try fallback URL (current URL) in storage
        this.checkStorageForFallbackUrl(tabId, fallbackUrl, sendResponse);
      } else {
        // No fallback URL or matches current URL, send null with refresh needed flag
        logger.info('SeoDataController', `No data found for tab ${tabId}, returning refresh needed`);
        sendResponse({ 
          success: true, 
          data: {
            needsRefresh: true,
            url: tabUrl
          }
        });
      }
    });
  }

  /**
   * Check storage for the fallback URL as a last resort
   * @param {number} tabId - The tab ID
   * @param {string} fallbackUrl - The fallback URL
   * @param {Function} sendResponse - The response callback
   */
  checkStorageForFallbackUrl(tabId, fallbackUrl, sendResponse) {
    const fallbackKey = `tab_${tabId}_${encodeURIComponent(fallbackUrl)}`;
    
    chrome.storage.local.get(fallbackKey, (fallbackResult) => {
      if (fallbackResult[fallbackKey]) {
        logger.info('SeoDataController', `Found data for fallback URL: ${fallbackUrl}`);
        sendResponse({ success: true, data: fallbackResult[fallbackKey] });
      } else {
        // Nothing found, send null data with refresh needed flag
        logger.info('SeoDataController', `No data found for tab ${tabId}, returning refresh needed`);
        sendResponse({ 
          success: true, 
          data: {
            needsRefresh: true
          }
        });
      }
    });
  }

  /**
   * Handle clear SPA data request
   * @param {Object} message - The message object containing tabId and url
   * @param {Object} sender - The message sender
   * @param {Function} sendResponse - The response callback function
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleClearSpaData(message, sender, sendResponse) {
    const tabId = message.tabId;
    const url = message.url;
    
    if (!tabId || !url) {
      logger.error('SeoDataController', 'Missing tabId or url for clearSpaData');
      sendResponse({ success: false, error: 'Missing tabId or url' });
      return false;
    }
    
    logger.info('SeoDataController', `Clearing SPA data for tab ${tabId}, url ${url}`);
    
    // Clear from memory
    StorageService.clearTabData(tabId, url);
    
    // Clear from storage
    const storageKey = `tab_${tabId}_${encodeURIComponent(url)}`;
    chrome.storage.local.remove(storageKey, () => {
      if (chrome.runtime.lastError) {
        logger.error('SeoDataController', `Error removing data from storage: ${chrome.runtime.lastError.message}`);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        logger.info('SeoDataController', `Successfully cleared SPA data for tab ${tabId}`);
        sendResponse({ success: true });
      }
    });
    
    return true; // Keep channel open for async response
  }
}

// Export as singleton
export const SeoDataController = new SeoDataControllerClass();
