'use strict';

import { StorageService } from '../services/storage-service.js';
import { WebRequestController } from './web-request-controller.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controller handling browser navigation events
 */
class NavigationControllerClass {
  /**
   * Initialize the controller
   */
  initialize() {
    logger.info('NavigationController', 'Initializing...');
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Primary Cleanup Listener for Real Navigations
    chrome.webNavigation.onBeforeNavigate.addListener(this.handleBeforeNavigate.bind(this));
    
    // Listener for traditional page loads/reloads (Secondary Cleanup)
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    
    // Tab removal
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

    logger.info('NavigationController', 'Navigation listeners set up');
  }

  /**
   * Handle beforeNavigate events - IMPROVED APPROACH
   * @param {Object} details - The navigation details
   */
  handleBeforeNavigate(details) {
    // Filter for main frame navigations and valid URLs
    if (details.frameId === 0 && details.url && (details.url.startsWith('http:') || details.url.startsWith('https:'))) {
      const tabId = details.tabId;
      const newUrl = details.url;
      
      logger.info('NavigationController', `Navigation starting for tab ${tabId} to ${newUrl}`);

      // Get the last known URL before updating
      const lastKnownUrl = StorageService.getLastKnownUrl(tabId);
      
      // Check if this is a new URL (real navigation)
      if (lastKnownUrl && lastKnownUrl !== newUrl) {
        logger.info('NavigationController', `URL changed from ${lastKnownUrl} to ${newUrl}`);
        
        // Save redirect chain but mark previous data as stale for refresh
        // This preserves redirect chain while ensuring UI updates
        const redirectChain = WebRequestController.getRedirectChain(tabId);
        if (redirectChain && redirectChain.length > 0) {
          logger.info('NavigationController', `Preserving redirect chain with ${redirectChain.length} redirects`);
          // Don't clear the redirect chain - just preserve it
        } else {
          // Only clear the redirect chain if we don't have any redirects yet
          WebRequestController.clearRedirectChain(tabId);
        }
      } else {
        // Same URL or first visit, clear redirect chain
        WebRequestController.clearRedirectChain(tabId);
      }
      
      // Always update last known URL
      StorageService.setLastKnownUrl(tabId, newUrl);

      // --- START FIX: Clear SPA flags on page load/reload ---
      try {
        const currentData = StorageService.getTabData(tabId, newUrl);
        if (currentData) {
          // Check if any SPA flags exist before attempting to clean
          const needsCleaning = currentData.isSpaDetected || currentData.isSpaNavigation || currentData.urlChanged || currentData.needsRefresh || currentData.navigationSource || currentData.freshSpaNavigation;
          
          if (needsCleaning) {
            logger.info('NavigationController', `Cleaning SPA flags for tab ${tabId}, URL ${newUrl} due to page load/reload.`);
            const cleanedData = { ...currentData };
            delete cleanedData.isSpaDetected;
            delete cleanedData.isSpaNavigation;
            delete cleanedData.urlChanged;
            delete cleanedData.needsRefresh;
            delete cleanedData.navigationSource;
            delete cleanedData.freshSpaNavigation;
            // Also ensure loading is false, although handleContentUpdate should do this too
            cleanedData.isLoading = false; 
            cleanedData.waitingForExtraction = false;
            
            StorageService.setTabData(tabId, newUrl, cleanedData);
          } else {
            // logger.info('NavigationController', `No SPA flags to clean for tab ${tabId}, URL ${newUrl}.`);
          }
        }
      } catch (error) {
        logger.error('NavigationController', `Error cleaning SPA flags for tab ${tabId}, URL ${newUrl}`, error);
      }
      // --- END FIX ---
    }
  }

  /**
   * Handle tab updated events - IMPROVED APPROACH
   * @param {number} tabId - The tab ID
   * @param {Object} changeInfo - The change info
   * @param {Object} tab - The tab info
   */
  handleTabUpdated(tabId, changeInfo, tab) {
    // Only handle 'loading' status for valid URLs to perform cleanup
    if (changeInfo.status === 'loading' && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
      const newUrl = tab.url;
      
      // Check if this 'loading' event corresponds to a *different* URL than the last known one
      const lastKnownUrl = StorageService.getLastKnownUrl(tabId);
      
      // If URL has changed, handle the change
      if (lastKnownUrl && lastKnownUrl !== newUrl) {
        logger.info('NavigationController', `Tab ${tabId} loading URL changed from ${lastKnownUrl} to ${newUrl}`);
        
        // For real URL changes (not just reloads), we need to:
        // 1. Mark the old URL's data as requiring refresh
        // 2. Notify the content script to extract fresh data
        // 3. Preserve the redirect chain for 301/302 redirects
        
        // Get the current redirect chain
        const redirectChain = WebRequestController.getRedirectChain(tabId);
        
        // Only preserve redirect chain if we have one and it's not too old
        if (redirectChain && redirectChain.length > 0) {
          const lastRedirectTime = redirectChain[redirectChain.length - 1].timestamp || 0;
          const isRecentRedirect = (Date.now() - lastRedirectTime) < 10000; // 10 seconds
          
          if (isRecentRedirect) {
            logger.info('NavigationController', `Preserving recent redirect chain with ${redirectChain.length} redirects`);
            // Don't clear the redirect chain for recent redirects
          } else {
            logger.info('NavigationController', `Clearing old redirect chain`);
            WebRequestController.clearRedirectChain(tabId);
          }
        } else {
          // No redirect chain to preserve
          WebRequestController.clearRedirectChain(tabId);
        }
      } else {
        // Same URL (likely a refresh) or first visit
        logger.info('NavigationController', `Tab ${tabId} loading same URL ${newUrl} or initial load`);
        WebRequestController.clearRedirectChain(tabId);
      }
      
      // Always update last known URL
      StorageService.setLastKnownUrl(tabId, newUrl);
    }
  }
  
  // Method removed - we no longer do full cleanup

  /**
   * Handle tab removed events
   * @param {number} tabId - The tab ID
   */
  handleTabRemoved(tabId) {
    logger.info('NavigationController', `Tab ${tabId} closed. Cleaning up data.`);
    
    // Clear all data associated with the closed tab
    StorageService.removeTabData(tabId);
    
    // Ensure redirect chain is cleared too
    WebRequestController.clearRedirectChain(tabId);
  }
}

// Export as singleton
export const NavigationController = new NavigationControllerClass();
