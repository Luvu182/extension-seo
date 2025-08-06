'use strict';

import { logger } from '../../shared/utils/logger.js';
import { MESSAGE_TYPES } from '../../shared/constants.js';
import { SeoDataController } from './seo-data-controller.js';
import { WebVitalsController } from './web-vitals-controller.js';
import { LinkCheckerController } from './link-checker-controller.js';
import { WebRequestController } from './web-request-controller.js';
import { TabController } from './tab-controller.js';
import { ServerInfoController } from './server-info-controller.js';
import { StorageService } from '../services/storage-service.js';
// Import SpaNavigationController to handle SPA messages
import { SpaNavigationController } from './spa-navigation-controller.js';
// Import Robots and Sitemap controllers
import { RobotsController } from './robots-controller.js';
import { SitemapController } from './sitemap-controller.js';

/**
 * Controller for handling message passing
 */
class MessageControllerClass {
  /**
   * Initialize the controller
   */
  initialize() {
    logger.info('MessageController', 'Initializing message listener...');
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    logger.info('MessageController', 'Message listener initialized');
  }

  /**
   * Handle incoming messages
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleMessage(message, sender, sendResponse) {
    if (!message || !message.action) {
      logger.warn('MessageController', 'Received message without action');
      if (sendResponse) {
        sendResponse({ success: false, error: 'No action specified' });
      }
      return false;
    }

    logger.info('MessageController', `Received message: ${message.action}`);

    switch (message.action) {
      // SEO data actions
      case MESSAGE_TYPES.GET_SEO_DATA:
        return SeoDataController.handleGetSeoData(message, sender, sendResponse);

      // Server info actions
      case MESSAGE_TYPES.FETCH_SERVER:
        return ServerInfoController.handleFetchServerDetails(message, sender, sendResponse);

      // Web vitals actions
      case MESSAGE_TYPES.INJECT_WEB_VITALS:
        return WebVitalsController.handleInjectWebVitals(message, sender, sendResponse);
      case MESSAGE_TYPES.WEB_VITALS_RESULT:
        return WebVitalsController.handleWebVitalsResult(message, sender, sendResponse);
      case 'getLatestWebVitals':
        return WebVitalsController.handleGetLatestWebVitals(message, sender, sendResponse);

      // Link checker actions
      case MESSAGE_TYPES.CHECK_LINK:
        return LinkCheckerController.handleCheckLinkStatus(message, sender, sendResponse);
      case MESSAGE_TYPES.CHECK_MULTIPLE_LINKS:
        return LinkCheckerController.handleCheckMultipleLinks(message, sender, sendResponse);
      case MESSAGE_TYPES.UPDATE_LINK_SETTINGS:
        return LinkCheckerController.handleUpdateSettings(message, sender, sendResponse);

      // Content script update
      case MESSAGE_TYPES.CONTENT_UPDATE:
        return this.handleContentUpdate(message, sender, sendResponse);

      // SPA navigation processed (content script finished extraction)
      // Note: This case might be handled within handleContentUpdate now
      // case MESSAGE_TYPES.SPA_NAVIGATION:
      //   return SpaNavigationController.handleSpaNavigation(message, sender, sendResponse);

      // SPA navigation detected (initial notification from content script)
      case 'spa_navigation_processed': // Renamed from SPA_NAVIGATION for clarity? Check constants.
         return SpaNavigationController.handleSpaNavigation(message, sender, sendResponse);

      // SPA navigation skipped (content script decided not to process)
      case 'spa_navigation_skipped':
         return SpaNavigationController.handleSpaNavigationSkipped(message, sender, sendResponse);

      // Content extraction error
      case MESSAGE_TYPES.CONTENT_ERROR:
         return SpaNavigationController.handleContentError(message, sender, sendResponse);

      // Tab ID request
      case MESSAGE_TYPES.GET_CURRENT_TAB_ID:
        return TabController.handleGetCurrentTabId(message, sender, sendResponse);

      // Clear SPA data (handled by SpaNavigationController now)
      case MESSAGE_TYPES.CLEAR_SPA_DATA:
        return SpaNavigationController.handleClearSpaData(message, sender, sendResponse);

      // Clear all tab data (for aggressive cleaning) - Keep this handler here
      case 'clearAllTabData':
        return this.handleClearAllTabData(message, sender, sendResponse);

      // Ping response (for checking if popup is alive)
      case 'ping':
        if (sendResponse) {
          sendResponse({ success: true, source: 'background' });
        }
        return false;

      // --- START Process Images for Size Handler (using Vercel API) ---
      case 'process_images_for_size':
        // MUST return true here to indicate an async response is expected
        this.handleProcessImagesForSize(message, sender, sendResponse);
        return true;
      // --- END Process Images for Size Handler ---

      // Robots.txt related actions
      case 'fetchRobotsTxt':
      case 'isUrlAllowed':
        return RobotsController.handleMessage(message, sender, sendResponse);

      // Sitemap related actions
      case 'findSitemap':
        return SitemapController.handleMessage(message, sender, sendResponse);

      default:
        logger.warn('MessageController', `Unknown message action: ${message.action}`);
        if (sendResponse) {
          sendResponse({ success: false, error: `Unknown action: ${message.action}` });
        }
        return false;
    }
  }

  /**
   * Handle request to fetch image size using HEAD request
   * @param {Object} message - The message { imageUrl, originalUrl }
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  async handleProcessImagesForSize(message, sender, sendResponse) {
    // --- START: Log sender object for debugging ---
    logger.debug('MessageController', '[handleProcessImagesForSize] Received sender object:', JSON.stringify(sender, null, 2));
    // --- END: Log sender object ---

    const { images, originalUrl, tabId } = message; // Get tabId from message payload
    // const tabId = sender?.tab?.id; // No longer rely on sender
    const API_ENDPOINT = 'https://vercel-extension-backend.vercel.app/api/fetch-data';
    const DELAY_BETWEEN_REQUESTS = 100; // ms delay between API calls

    // --- START: More detailed validation logging (updated for tabId from message) ---
    let missingParams = [];
    if (!images || !Array.isArray(images)) missingParams.push('images array');
    if (!originalUrl) missingParams.push('originalUrl');
    if (!tabId) missingParams.push('tabId (from message)'); // Specify source

    if (missingParams.length > 0) {
      logger.warn(`MessageController', '[handleProcessImagesForSize] Missing required parameters: ${missingParams.join(', ')}`, { message }); // Log message only
      if (sendResponse) sendResponse({ success: false, error: `Missing parameters: ${missingParams.join(', ')}` });
      return false;
    }
    // --- END: More detailed validation logging ---

    // --- START: Respond immediately to prevent timeout ---
    logger.info('MessageController', `[handleProcessImagesForSize] Received request to process ${images.length} images for ${originalUrl} (tab: ${tabId}). Responding immediately.`);
    if (sendResponse) sendResponse({ success: true, message: "Image size processing initiated." });
    // --- END: Respond immediately ---

    // --- Process images asynchronously AFTER responding ---
    // Use a self-invoking async function or just let the rest of the function run
    (async () => {
        logger.info('MessageController', `[handleProcessImagesForSize] Starting ASYNC processing loop for ${images.length} images.`);
        // Process images sequentially with a delay
    for (const image of images) {
      const imageUrl = image.src;
      if (!imageUrl) continue;

      try {
        logger.debug('MessageController', `[handleProcessImagesForSize] Calling Vercel API for ${imageUrl}`);
        const apiResponse = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: imageUrl, method: 'GET' }), // Use GET as per example
        });

        if (!apiResponse.ok) {
          logger.warn('MessageController', `[handleProcessImagesForSize] Vercel API request failed for ${imageUrl}: ${apiResponse.status} ${apiResponse.statusText}`);
          // Optionally update storage to mark as error
          await this.updateImageFileSizeInStorage(tabId, originalUrl, imageUrl, 'Error');
          continue; // Move to the next image
        }

        const result = await apiResponse.json();
        let fileSizeKB = null;

        if (result.success && result.headers && result.headers['content-length']) {
          const contentLength = result.headers['content-length'];
          const sizeBytes = parseInt(contentLength, 10);
          if (!isNaN(sizeBytes)) {
            fileSizeKB = Math.round(sizeBytes / 1024);
            logger.info('MessageController', `[handleProcessImagesForSize] Vercel API returned size for ${imageUrl}: ${fileSizeKB} KB`);
            // Update storage with the fetched size
            await this.updateImageFileSizeInStorage(tabId, originalUrl, imageUrl, fileSizeKB);
          } else {
            logger.warn('MessageController', `[handleProcessImagesForSize] Vercel API returned invalid Content-Length for ${imageUrl}: ${contentLength}`);
            await this.updateImageFileSizeInStorage(tabId, originalUrl, imageUrl, 'Invalid');
          }
        } else {
          logger.warn('MessageController', `[handleProcessImagesForSize] Vercel API did not return success or content-length for ${imageUrl}`, result);
           await this.updateImageFileSizeInStorage(tabId, originalUrl, imageUrl, 'Missing');
        }

      } catch (error) {
        logger.error('MessageController', `[handleProcessImagesForSize] Error calling Vercel API for ${imageUrl}`, error);
         await this.updateImageFileSizeInStorage(tabId, originalUrl, imageUrl, 'Error');
      }

      // Wait before processing the next image
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }

    logger.info('MessageController', `[handleProcessImagesForSize] END processing images for ${originalUrl}`);
        logger.info('MessageController', `[handleProcessImagesForSize] ASYNC processing loop finished for ${originalUrl}`);
    })(); // End of self-invoking async function

    // Return false because sendResponse was already called earlier.
    // The main handleMessage function still returns true for this case.
    return false;
  }

  /**
   * Helper function to update image file size in storage
   */
  async updateImageFileSizeInStorage(tabId, originalUrl, imageUrl, fileSize) {
     try {
        const currentData = StorageService.getTabData(tabId, originalUrl);
        if (currentData && currentData.images && Array.isArray(currentData.images)) {
            const imageIndex = currentData.images.findIndex(img => img.src === imageUrl);
            if (imageIndex !== -1) {
                // Create new objects/arrays for React change detection
                const updatedImage = { ...currentData.images[imageIndex], fileSize: fileSize };
                const updatedImages = [...currentData.images];
                updatedImages[imageIndex] = updatedImage;
                const updatedStorageData = { ...currentData, images: updatedImages };

                await StorageService.setTabData(tabId, originalUrl, updatedStorageData);
                logger.debug('MessageController', `[updateImageFileSizeInStorage] Updated fileSize for ${imageUrl} to ${fileSize}`);
            } else {
                 logger.warn('MessageController', `[updateImageFileSizeInStorage] Image ${imageUrl} not found in stored data for ${originalUrl}`);
            }
        } else {
             logger.warn('MessageController', `[updateImageFileSizeInStorage] No stored data or images array found for ${originalUrl}`);
        }
     } catch (error) {
         logger.error('MessageController', `[updateImageFileSizeInStorage] Error updating storage for ${imageUrl}`, error);
     }
  }

  /**
   * Handle request to clear all data for a tab
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleClearAllTabData(message, sender, sendResponse) {
    try {
      const tabId = message.tabId;

      if (!tabId) {
        logger.error('MessageController', 'clearAllTabData missing tabId');
        if (sendResponse) {
          sendResponse({ success: false, error: 'Missing tabId' });
        }
        return false;
      }

      // BALANCED APPROACH: Only get current URL data
      const currentUrl = StorageService.getLastKnownUrl(tabId);

      // Log what we're about to do
      logger.info('MessageController', `Using targeted data cleanup for tab ${tabId} with current URL ${currentUrl || 'unknown'}`);

      // If we know the current URL, just clean up non-current URLs
      if (currentUrl) {
        // Only get all URLs for this tab if really needed
        const allTabData = StorageService.getAllTabData(tabId);
        if (allTabData) {
          const urls = Object.keys(allTabData).filter(url => url !== currentUrl);

          if (urls.length > 0) {
            logger.info('MessageController', `Found ${urls.length} old URLs to clean for tab ${tabId}`);

            // Clear old URLs only
            urls.forEach(url => {
              StorageService.clearTabData(tabId, url);
            });
          } else {
            logger.info('MessageController', `No old URLs to clean for tab ${tabId}`);
          }
        }
      } else {
        // Minimal cleanup without clearing everything
        logger.info('MessageController', `No current URL known for tab ${tabId}, performing minimal cleanup`);
      }

      // Clear redirect chain data which is likely stale
      WebRequestController.clearRedirectChain(tabId);

      if (sendResponse) {
        sendResponse({ success: true });
      }
      return false;
    } catch (error) {
      logger.error('MessageController', `Error handling clearAllTabData: ${error.message}`);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
      return false;
    }
  }

  /**
   * Handle content script data update
   * @param {Object} message - The message with updated data
   * @param {Object} sender - The sender information
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleContentUpdate(message, sender, sendResponse) {
    try {
      // Validate message
      if (!sender.tab || !sender.tab.id) {
        logger.error('MessageController', 'Content update missing tab information');
        if (sendResponse) {
          sendResponse({ success: false, error: 'Missing tab information' });
        }
        return false;
      }

      if (!message.data || !message.data.url) {
        logger.error('MessageController', 'Content update missing required data');
        if (sendResponse) {
          sendResponse({ success: false, error: 'Missing required data' });
        }
        return false;
      }

      const tabId = sender.tab.id;
      const tabUrl = message.data.url;
      const source = message.source || 'unknown';
      const timestamp = message.timestamp || Date.now();

      logger.info('MessageController', `Received content update from ${source} for tab ${tabId}, url ${tabUrl}`);

      // Add response status code from WebRequestController if available
      const statusInfo = WebRequestController.getResponseStatus(tabId, tabUrl);
      if (statusInfo) {
        message.data.statusCode = statusInfo.statusCode;
        message.data.responseDetailStatusCode = statusInfo.statusCode; // For backwards compatibility
        message.data.statusText = statusInfo.statusText;
        message.data.responseHeaders = statusInfo.responseHeaders;
      }

      // Add server header info if available
      if (statusInfo && statusInfo.responseHeaders) {
        const serverInfo = WebRequestController.extractServerInfo(statusInfo.responseHeaders);
        if (serverInfo) {
          if (!message.data.serverInfo) {
            message.data.serverInfo = {};
          }
          Object.assign(message.data.serverInfo, serverInfo);
        }
      }

      // Add redirect chain if available
      const redirectChain = WebRequestController.getRedirectChain(tabId, tabUrl);
      if (redirectChain && redirectChain.length > 0) {
        // Store the raw redirect chain for debugging
        message.data.redirectChain = redirectChain;

        // Get the tab data to see if we have the full redirect information
        const tabData = StorageService.getTabData(tabId, tabUrl);

        // Check if we have the full redirect data in the tab data
        if (tabData && tabData.redirect && tabData.redirect.redirectData) {
          // Use the full redirect data from the tab data
          message.data.redirect = tabData.redirect;
          logger.info('MessageController', `Using full redirect data from tab data for ${tabUrl}`);
        } else {
          // Create redirect data from the redirect chain
          if (!message.data.redirect) {
            message.data.redirect = {};
          }

          // Count only 3xx redirects
          const actual3xxRedirects = redirectChain.filter(hop =>
            hop.statusCode >= 300 && hop.statusCode < 400).length;

          message.data.redirect.count = actual3xxRedirects;
          message.data.redirect.totalHops = redirectChain.length;

          // Create URLs array
          const redirectUrls = [];
          redirectChain.forEach(hop => {
            redirectUrls.push(hop.url);
          });
          // Add the final URL
          redirectUrls.push(tabUrl);
          message.data.redirect.urls = redirectUrls;

          // Create status codes array
          const statusCodes = redirectChain.map(hop => hop.statusCode || 302);
          // Add the final status code
          statusCodes.push(message.data.statusCode || 200);
          message.data.redirect.statusCodes = statusCodes;

          // Create redirectData array for visualization
          const redirectData = [];
          for (let i = 0; i < redirectUrls.length - 1; i++) {
            redirectData.push({
              fromUrl: redirectUrls[i],
              toUrl: redirectUrls[i + 1],
              statusCode: statusCodes[i],
              finalStatusCode: i === redirectUrls.length - 2 ? message.data.statusCode || 200 : undefined
            });
          }
          message.data.redirect.redirectData = redirectData;

          // Set backward compatibility fields
          if (redirectChain.length > 0) {
            message.data.redirect.fromUrl = redirectChain[0].url;
            message.data.redirect.toUrl = tabUrl;
            message.data.redirect.statusCode = redirectChain[0].statusCode || 302;
            message.data.redirect.originalRequestedUrl = redirectChain[0].url;
          }
        }

        // Debug log the redirect data
        logger.info('MessageController', `Added redirect chain with ${message.data.redirect.count} redirects (${message.data.redirect.totalHops || redirectChain.length} total hops) to message data`);
      }

      // Also add Web Vitals if available
      const webVitals = WebVitalsController.getLatestWebVitals(tabId, tabUrl);
      if (webVitals && Object.keys(webVitals).length > 0) {
        message.data.webVitals = webVitals;
      }

      // Directly use StorageService instead of dynamic import
      // Get existing data for this tab and URL
      const existingData = StorageService.getTabData(tabId, tabUrl);

      // Merge with existing data
      const updatedData = {
        ...existingData, // Base layer
        ...message.data, // New data
        timestamp: timestamp // Update timestamp
      };

      // Always set update timestamp
      StorageService.setUpdateTimestamp(tabId, timestamp);

      // Clear loading/waiting flags
      delete updatedData.waitingForExtraction;
      delete updatedData.isLoading;

      // Set this as the last known URL for this tab
      StorageService.setLastKnownUrl(tabId, tabUrl);

      // Save updated data
      StorageService.setTabData(tabId, tabUrl, updatedData)
        .then(() => {
          logger.info('MessageController', `Updated data for tab ${tabId}, url ${tabUrl}`);
          if (sendResponse) {
            sendResponse({ success: true });
          }
        })
        .catch(error => {
          logger.error('MessageController', `Error saving data: ${error.message}`);
          if (sendResponse) {
            sendResponse({ success: false, error: error.message });
          }
        });

      return true; // Keep channel open for async response
    } catch (error) {
      logger.error('MessageController', `Error handling content update: ${error.message}`);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
      return false;
    }
  }

  /**
   * Handle SPA navigation detected message
   * @param {Object} message - The message with navigation details
   * @param {Object} sender - The sender information
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleSpaNavigation(message, sender, sendResponse) {
    try {
      // Validate sender
      if (!sender.tab || !sender.tab.id) {
        logger.error('MessageController', 'SPA navigation missing tab information');
        if (sendResponse) {
          sendResponse({ success: false, error: 'Missing tab information' });
        }
        return false;
      }

      const tabId = sender.tab.id;
      const url = message.url || (sender.tab.url || 'unknown');
      const source = message.source || 'unknown';
      const timestamp = message.timestamp || Date.now();

      logger.info('MessageController', `SPA navigation detected in tab ${tabId}, url ${url} from ${source}`);

      // If any popups are listening, notify them directly
      chrome.runtime.sendMessage({
        action: 'spaNavigationUpdate',
        tabId: tabId,
        url: url,
        source: source,
        timestamp: timestamp
      });

      // Acknowledge to content script
      if (sendResponse) {
        sendResponse({ success: true });
      }
      return false;
    } catch (error) {
      logger.error('MessageController', `Error handling SPA navigation: ${error.message}`);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
      return false;
    }
  }
}

// Export as singleton
export const MessageController = new MessageControllerClass();
