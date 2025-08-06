'use strict';

import { StorageService } from '../services/storage-service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controller handling web request events
 */
class WebRequestControllerClass {
  // Store for tracking redirect chains
  redirectChainStore = {};

  /**
   * Initialize the controller
   */
  initialize() {
    logger.info('WebRequestController', 'Initializing...');
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Listen for HTTP redirects
    chrome.webRequest.onBeforeRedirect.addListener(
      this.handleBeforeRedirect.bind(this),
      {urls: ["<all_urls>"], types: ["main_frame"]},
      ["responseHeaders"]
    );

    // Listen for HTTP responses (to detect if URL changes)
    chrome.webRequest.onCompleted.addListener(
      this.handleRequestCompleted.bind(this),
      {urls: ["<all_urls>"], types: ["main_frame"]},
      ["responseHeaders"]
    );

    // Listen for errors
    chrome.webRequest.onErrorOccurred.addListener(
      this.handleErrorOccurred.bind(this),
      {urls: ["<all_urls>"], types: ["main_frame"]}
    );

    // Listen for HTTP responses that could be redirects (3xx status codes)
    chrome.webRequest.onHeadersReceived.addListener(
      this.handleHeadersReceived.bind(this),
      {urls: ["<all_urls>"], types: ["main_frame"]},
      ["responseHeaders"]
    );

    // Listen for sent requests to track the initial URL
    chrome.webRequest.onSendHeaders.addListener(
      this.handleSendHeaders.bind(this),
      {urls: ["<all_urls>"], types: ["main_frame"]},
      ["requestHeaders"]
    );

    logger.info('WebRequestController', 'All web request listeners set up successfully');
  }

  /**
   * Handle sent headers (track initial request)
   * @param {Object} details - The event details
   */
  handleSendHeaders(details) {
    if (details.type !== 'main_frame') return;
    const tabId = details.tabId;

    logger.info('WebRequestController', `Initial request detected: tab ${tabId}, URL: ${details.url}`);

    // Store initial URL for this tab if we don't have a redirect chain yet
    if (!this.redirectChainStore[tabId]) {
      this.redirectChainStore[tabId] = [];

      // Store origin URL as attribute
      this.redirectChainStore[tabId].initialUrl = details.url;
      this.redirectChainStore[tabId].initialTimestamp = details.timeStamp;

      logger.info('WebRequestController', `Set initial URL for tab ${tabId}: ${details.url}`);
    }
  }

  /**
   * Handle headers received (detect 3xx status codes)
   * @param {Object} details - The event details
   */
  handleHeadersReceived(details) {
    if (details.type !== 'main_frame') return;

    let statusCode = 200; // Default

    // Extract status code from headers
    if (details.responseHeaders) {
      const statusHeader = details.responseHeaders.find(header =>
        header.name.toLowerCase() === 'status' ||
        header.name.toLowerCase() === ':status');

      if (statusHeader && statusHeader.value) {
        statusCode = parseInt(statusHeader.value, 10);

        // Log all 3xx responses
        if (statusCode >= 300 && statusCode < 400) {
          logger.info('WebRequestController', `3XX STATUS DETECTED in onHeadersReceived: tab ${details.tabId}, URL: ${details.url}, Status: ${statusCode}`);

          // Check for location header (redirect target)
          const locationHeader = details.responseHeaders.find(header =>
            header.name.toLowerCase() === 'location');

          if (locationHeader && locationHeader.value) {
            logger.info('WebRequestController', `Location header found: ${locationHeader.value}`);
          }
        }
      }
    }
  }

  /**
   * Handle redirect events
   * @param {Object} details - The event details
   */
  handleBeforeRedirect(details) {
    if (details.type !== 'main_frame') return;
    const tabId = details.tabId;

    // Log detailed redirect information first
    logger.info('WebRequestController', `REDIRECT DETECTED: tab ${tabId}, from ${details.url} to ${details.redirectUrl}, status: ${details.statusCode}`);

    // Log all details for debugging
    logger.info('WebRequestController', `Full redirect details:`, JSON.stringify(details));

    // Initialize chain if it doesn't exist for this tab's navigation sequence
    if (!this.redirectChainStore[tabId]) {
      this.redirectChainStore[tabId] = [];
    }

    // Add the current hop to the temporary chain store
    this.redirectChainStore[tabId].push({
      fromUrl: details.url,
      toUrl: details.redirectUrl,
      statusCode: details.statusCode,
      timeStamp: details.timeStamp
    });

    logger.info('WebRequestController', `Added hop to redirectChainStore for tab ${tabId}. Chain length: ${this.redirectChainStore[tabId].length}, Latest status: ${details.statusCode}`);
  }

  /**
   * Handle completed requests
   * @param {Object} details - The event details
   */
  handleRequestCompleted(details) {
    if (details.type !== 'main_frame') return;
    const tabId = details.tabId;
    const finalUrl = details.url;
    const finalStatusCode = details.statusCode;

    logger.info('WebRequestController', `Completed for tab ${tabId}, url ${finalUrl} with status ${finalStatusCode}`);

    // Get existing data for this tab+URL
    const currentData = StorageService.getTabData(tabId, finalUrl) || {};
    const redirectChain = this.redirectChainStore[tabId]; // Get the accumulated chain for this navigation

    // --- Finalize Data ---
    currentData.statusCode = finalStatusCode; // Set the final status

    if (redirectChain && redirectChain.length > 0) {
      // Redirect occurred: Build the definitive redirect object
      const firstHop = redirectChain[0];
      const lastHop = redirectChain[redirectChain.length - 1];

      // Log the complete redirect chain first
      logger.info('WebRequestController', `REDIRECT CHAIN COMPLETE for tab ${tabId}:`);
      redirectChain.forEach((hop, index) => {
        logger.info('WebRequestController', `  Hop ${index+1}: ${hop.fromUrl} -> ${hop.toUrl}, Status: ${hop.statusCode}`);
      });

      // Extract URLs and status codes from the chain for display
      const redirectUrls = [];
      const statusCodes = [];
      const redirectCount = redirectChain.length;

      // Only count 3xx status codes for the redirect count
      let actual3xxRedirects = 0;

      // Log the redirect chain for debugging
      logger.info('WebRequestController', `Redirect chain for tab ${tabId}:`, JSON.stringify(redirectChain));

      redirectChain.forEach((hop, index) => {
        if (hop.statusCode >= 300 && hop.statusCode < 400) {
          actual3xxRedirects++;
        }

        // Add URLs to the chain
        if (index === 0) {
          // First URL is the origin URL
          redirectUrls.push(hop.fromUrl);
        }

        // Always add the destination URL
        redirectUrls.push(hop.toUrl);

        // Add status codes
        statusCodes.push(hop.statusCode);
      });

      // Add the final status code (from the completed request)
      statusCodes.push(finalStatusCode);

      // Add structured data for redirect visualization
      const redirectData = [];
      for (let i = 0; i < redirectUrls.length - 1; i++) {
        redirectData.push({
          fromUrl: redirectUrls[i],
          toUrl: redirectUrls[i + 1],
          statusCode: statusCodes[i]
        });
      }

      // Add final status code to last hop
      if (redirectData.length > 0) {
        redirectData[redirectData.length - 1].finalStatusCode = finalStatusCode;
      }

      // Log the prepared redirect data
      logger.info('WebRequestController', `Prepared redirectData for tab ${tabId}:`,
        JSON.stringify({
          count: actual3xxRedirects,
          totalHops: redirectChain.length,
          urls: redirectUrls,
          statusCodes: statusCodes,
          redirectData: redirectData
        })
      );

      currentData.redirect = {
        count: actual3xxRedirects, // Only count 3xx redirects
        totalHops: redirectChain.length, // Total number of hops including non-3xx responses
        chain: redirectChain, // Full detailed chain with all metadata
        statusCodes: statusCodes, // Array of status codes
        urls: redirectUrls, // Array of URLs in the chain
        redirectData: redirectData, // Structured data for visualization
        statusCode: firstHop.statusCode, // Status of the *first* redirect (for backward compatibility)
        originalRequestedUrl: firstHop.fromUrl, // URL that *caused* the first redirect
        fromUrl: firstHop.fromUrl, // URL that *caused* the first redirect (for backward compatibility)
        toUrl: lastHop.toUrl // Final destination (for backward compatibility)
      };

      logger.info('WebRequestController', `Finalized redirect data for tab ${tabId}: ${actual3xxRedirects} 3xx redirects in ${redirectChain.length} total hops`);
      currentData.responseDetailStatusCode = firstHop.statusCode; // Detail status is the first redirect's status
      logger.info('WebRequestController', `Finalized redirect data for tab ${tabId}, url ${finalUrl}`);
    } else {
      // No redirect occurred
      delete currentData.redirect; // Ensure no redirect object
      currentData.responseDetailStatusCode = finalStatusCode; // Detail status is the final status
      logger.info('WebRequestController', `No redirect detected for tab ${tabId}, url ${finalUrl}`);
    }

    // Ensure other placeholders exist if sendSEOData hasn't run yet
    if (!currentData.serverInfo) currentData.serverInfo = { ip: 'N/A', httpVersion: 'N/A', server: 'N/A', loaded: false };
    if (!currentData.webVitals) currentData.webVitals = {};

    // Ensure status codes have values (should be set above, but safety check)
    if (currentData.responseDetailStatusCode === undefined) currentData.responseDetailStatusCode = 'N/A';
    if (currentData.statusCode === undefined) currentData.statusCode = 'N/A';

    // --- Save Final Data ---
    logger.info('WebRequestController', `Saving final data for tab ${tabId}, url ${finalUrl}`);

    // Store the redirect chain in a separate property for later retrieval
    if (redirectChain && redirectChain.length > 0) {
      // Store a deep copy of the redirect chain to prevent reference issues
      currentData.storedRedirectChain = JSON.parse(JSON.stringify(redirectChain));
      logger.info('WebRequestController', `Stored redirect chain for tab ${tabId}, url ${finalUrl}`);
    }

    StorageService.setTabData(tabId, finalUrl, currentData);

    // Update last known URL
    StorageService.setLastKnownUrl(tabId, finalUrl);

    // Clear the temporary chain store for this tab now that navigation is complete
    delete this.redirectChainStore[tabId];
  }

  /**
   * Handle network errors
   * @param {Object} details - The event details
   */
  handleErrorOccurred(details) {
    if (details.type !== 'main_frame') return;
    const tabId = details.tabId;
    const finalUrl = details.url;

    logger.info('WebRequestController', `Error for tab ${tabId}, url ${finalUrl}. Status 0.`);

    // Get existing data for this tab+URL
    const currentData = StorageService.getTabData(tabId, finalUrl) || {};
    const redirectChain = this.redirectChainStore[tabId];

    // --- Finalize Data with Error ---
    currentData.statusCode = 0; // Final status is error

    if (redirectChain && redirectChain.length > 0) {
      // Redirect started before error
      const firstHop = redirectChain[0];
      const lastHop = redirectChain[redirectChain.length - 1];
      currentData.redirect = {
        count: redirectChain.length,
        chain: redirectChain,
        statusCode: firstHop.statusCode,
        originalRequestedUrl: firstHop.fromUrl,
        fromUrl: firstHop.fromUrl,
        toUrl: lastHop.toUrl // Last known destination
      };
      currentData.responseDetailStatusCode = firstHop.statusCode; // Detail status is the first redirect's
      logger.info('WebRequestController', `Finalized redirect data with error for tab ${tabId}, url ${finalUrl}`);
    } else {
      // Error occurred before any redirect
      delete currentData.redirect;
      currentData.responseDetailStatusCode = 0; // Detail status is error
      logger.info('WebRequestController', `No redirect detected before error for tab ${tabId}, url ${finalUrl}`);
    }

    // Ensure other placeholders exist
    if (!currentData.serverInfo) currentData.serverInfo = { ip: 'N/A', httpVersion: 'N/A', server: 'N/A', loaded: false };
    if (!currentData.webVitals) currentData.webVitals = {};
    if (currentData.responseDetailStatusCode === undefined) currentData.responseDetailStatusCode = 'N/A';
    if (currentData.statusCode === undefined) currentData.statusCode = 'N/A';

    // --- Save Final Error Data ---
    logger.info('WebRequestController', `Saving error data for tab ${tabId}, url ${finalUrl}`);

    // Store the redirect chain in a separate property for later retrieval
    if (redirectChain && redirectChain.length > 0) {
      // Store a deep copy of the redirect chain to prevent reference issues
      currentData.storedRedirectChain = JSON.parse(JSON.stringify(redirectChain));
      logger.info('WebRequestController', `Stored redirect chain for tab ${tabId}, url ${finalUrl} (error case)`);
    }

    StorageService.setTabData(tabId, finalUrl, currentData);

    // Update last known URL
    StorageService.setLastKnownUrl(tabId, finalUrl);

    // Clear the temporary chain store for this tab now that navigation has errored
    delete this.redirectChainStore[tabId];
  }

  /**
   * Clear redirect chain for a tab
   * @param {number} tabId - The tab ID
   */
  clearRedirectChain(tabId) {
    delete this.redirectChainStore[tabId];
  }
}

// Export as singleton
/**
 * Get the HTTP response status for a tab and URL
 * @param {number} tabId - The tab ID
 * @param {string} url - The URL
 * @returns {Object|null} - The status info or null if not found
 */
WebRequestControllerClass.prototype.getResponseStatus = function(tabId, url) {
  try {
    // Get the tab data for this URL
    const tabData = StorageService.getTabData(tabId, url);

    if (!tabData) {
      logger.warn('WebRequestController', `No tab data found for tab ${tabId}, url ${url}`);
      return null;
    }

    // Construct response status info
    const statusInfo = {
      statusCode: tabData.statusCode || tabData.responseDetailStatusCode || 0,
      statusText: tabData.statusText || 'Unknown',
      responseHeaders: tabData.responseHeaders || []
    };

    return statusInfo;
  } catch (error) {
    logger.error('WebRequestController', `Error getting response status: ${error.message}`);
    return null;
  }
};

/**
 * Extract server information from response headers
 * @param {Array} responseHeaders - The response headers
 * @returns {Object|null} - Server information or null if not found
 */
WebRequestControllerClass.prototype.extractServerInfo = function(responseHeaders) {
  if (!responseHeaders || !Array.isArray(responseHeaders)) {
    return null;
  }

  try {
    const serverInfo = {
      server: 'Unknown',
      httpVersion: 'Unknown',
      loaded: true
    };

    // Extract server header
    const serverHeader = responseHeaders.find(header =>
      header.name.toLowerCase() === 'server');
    if (serverHeader && serverHeader.value) {
      serverInfo.server = serverHeader.value;
    }

    // Try to determine HTTP version
    const statusHeader = responseHeaders.find(header =>
      header.name.toLowerCase() === ':status' ||
      header.name.toLowerCase() === 'status');
    if (statusHeader) {
      // HTTP/2 or HTTP/3 typically use :status
      if (header.name.startsWith(':')) {
        serverInfo.httpVersion = 'HTTP/2 or HTTP/3';
      } else {
        serverInfo.httpVersion = 'HTTP/1.1';
      }
    }

    return serverInfo;
  } catch (error) {
    logger.error('WebRequestController', `Error extracting server info: ${error.message}`);
    return null;
  }
};

/**
 * Get the redirect chain for a tab
 * @param {number} tabId - The tab ID
 * @param {string} [url] - Optional URL to help locate the correct tab data
 * @returns {Array|null} - The redirect chain or null if not found
 */
WebRequestControllerClass.prototype.getRedirectChain = function(tabId, url) {
  try {
    // First check if we have an active redirect chain in the store (during navigation)
    if (this.redirectChainStore[tabId] && this.redirectChainStore[tabId].length > 0) {
      logger.info('WebRequestController', `Found active redirect chain for tab ${tabId} with ${this.redirectChainStore[tabId].length} hops`);
      return this.redirectChainStore[tabId];
    }

    // If not in the store, try to get it from the stored tab data
    const lastKnownUrl = url || StorageService.getLastKnownUrl(tabId);
    if (lastKnownUrl) {
      const tabData = StorageService.getTabData(tabId, lastKnownUrl);
      if (tabData && tabData.storedRedirectChain && tabData.storedRedirectChain.length > 0) {
        logger.info('WebRequestController', `Retrieved stored redirect chain for tab ${tabId}, url ${lastKnownUrl} with ${tabData.storedRedirectChain.length} hops`);
        
        // Check how old the chain is
        const lastHop = tabData.storedRedirectChain[tabData.storedRedirectChain.length - 1];
        const lastHopTime = lastHop?.timeStamp || 0;
        const isRecent = (Date.now() - lastHopTime) < 30000; // 30 seconds
        
        if (isRecent) {
          logger.info('WebRequestController', `Using recent redirect chain for tab ${tabId}`);
          return tabData.storedRedirectChain;
        } else {
          logger.info('WebRequestController', `Stored redirect chain for tab ${tabId} is too old, not using it`);
        }
      }
    }

    // No valid redirect chain found
    logger.info('WebRequestController', `No valid redirect chain found for tab ${tabId}`);
    return null;
  } catch (error) {
    logger.error('WebRequestController', `Error getting redirect chain: ${error.message}`);
    return null;
  }
};

/**
 * Check if a redirect chain needs to be preserved during URL changes
 * This helps ensure we don't lose 301/302 redirect data during navigation
 * @param {number} tabId - The tab ID
 * @param {string} oldUrl - The old URL
 * @param {string} newUrl - The new URL
 * @returns {boolean} - Whether the redirect chain should be preserved
 */
WebRequestControllerClass.prototype.shouldPreserveRedirectChain = function(tabId, oldUrl, newUrl) {
  try {
    // Get the current redirect chain
    const redirectChain = this.getRedirectChain(tabId);
    if (!redirectChain || redirectChain.length === 0) {
      logger.info('WebRequestController', `No redirect chain to preserve for tab ${tabId}`);
      return false;
    }
    
    // Check if the new URL is part of the redirect chain
    const isPartOfRedirectChain = redirectChain.some(hop => 
      hop.toUrl === newUrl || hop.fromUrl === newUrl
    );
    
    if (isPartOfRedirectChain) {
      logger.info('WebRequestController', `New URL ${newUrl} is part of redirect chain, preserving`);
      return true;
    }
    
    // Check for recency - only preserve if the chain is recent
    const lastHop = redirectChain[redirectChain.length - 1];
    const lastHopTime = lastHop?.timeStamp || 0;
    const timeSinceLastRedirect = Date.now() - lastHopTime;
    
    const isRecent = timeSinceLastRedirect < 10000; // 10 seconds
    if (isRecent) {
      logger.info('WebRequestController', `Redirect chain is recent (${timeSinceLastRedirect}ms), preserving during URL change`);
      return true;
    }
    
    logger.info('WebRequestController', `Redirect chain is old (${timeSinceLastRedirect}ms), not preserving`);
    return false;
  } catch (error) {
    logger.error('WebRequestController', `Error checking if redirect chain should be preserved: ${error.message}`);
    return false;
  }
};

export const WebRequestController = new WebRequestControllerClass();
