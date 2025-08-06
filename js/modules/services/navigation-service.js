'use strict';

// Import dependencies
import { store } from '../store.js';

/**
 * Service for handling navigation and tab switching
 * Manages tab state and transitions
 */
export const navigationService = {
  /**
   * Switch to a specific tab
   * @param {string} tabId - ID of the tab to switch to
   * @param {boolean} animate - Whether to animate the transition
   */
  switchTab(tabId, animate = true) {
    console.log(`[navigationService] Switching to tab: ${tabId} (animate: ${animate})`);
    
    // Get current tab for comparison
    const currentTab = store.getStateSlice('activeTab');
    
    // Don't do anything if we're already on this tab
    if (tabId === currentTab) {
      console.log(`[navigationService] Already on tab: ${tabId}`);
      return;
    }
    
    // Update the store with the new tab
    store.setStateSlice('activeTab', tabId);
    
    // Could add animation logic here if needed in the future
  },
  
  /**
   * Handle SPA navigation detection
   * @param {Object} navigationData - Data about the navigation event
   */
  handleSpaNavigation(navigationData) {
    console.log(`[navigationService] SPA navigation detected`, navigationData);
    
    // Get current page data
    const currentPageData = store.getStateSlice('pageData') || {};
    
    // Update with SPA flags
    const updatedData = {
      ...currentPageData,
      isSpaDetected: true,
      navigationSource: navigationData.source,
      navigationTimestamp: navigationData.timestamp || Date.now()
    };
    
    // Add navigation-specific data if available
    if (navigationData.newUrl) {
      updatedData.newUrl = navigationData.newUrl;
    }
    
    if (navigationData.oldUrl) {
      updatedData.oldUrl = navigationData.oldUrl;
    }
    
    if (navigationData.urlChanged) {
      updatedData.urlChanged = true;
    }
    
    // Update the store
    store.setStateSlice('pageData', updatedData);
  },
  
  /**
   * Complete SPA navigation and show regular content
   */
  completeSpaNavigation() {
    console.log(`[navigationService] Completing SPA navigation`);
    
    // Get current page data
    const currentPageData = store.getStateSlice('pageData') || {};
    
    if (currentPageData.isSpaDetected) {
      // Create a new object without the SPA flags
      const updatedData = {...currentPageData};
      delete updatedData.isSpaDetected;
      delete updatedData.navigationSource;
      delete updatedData.freshSpaNavigation;
      
      // Update the store
      store.setStateSlice('pageData', updatedData);
      
      // Dispatch custom event that components can listen for
      const event = new CustomEvent('spaNavigationComplete');
      document.dispatchEvent(event);
    }
  },
  
  /**
   * Save the current tab to persistent storage
   * @param {string} tabId - ID of the tab to save
   */
  saveLastActiveTab(tabId) {
    try {
      localStorage.setItem('seoAiAssistantLastTab', tabId);
      console.log(`[navigationService] Saved last active tab: ${tabId}`);
    } catch (e) {
      console.warn('[navigationService] Could not save last active tab to localStorage:', e);
    }
  },
  
  /**
   * Get the last active tab from persistent storage
   * @returns {string} The last active tab ID or 'overview' as default
   */
  getLastActiveTab() {
    try {
      const lastTab = localStorage.getItem('seoAiAssistantLastTab');
      return lastTab || 'overview';
    } catch (e) {
      console.warn('[navigationService] Could not retrieve last active tab from localStorage:', e);
      return 'overview';
    }
  },
  
  /**
   * Check if a URL has changed compared to stored URL
   * @param {string} currentUrl - The current URL to check
   * @returns {Object} Object with change status and related information
   */
  checkUrlChange(currentUrl) {
    // Get the last known URL from store or localStorage
    let lastKnownUrl = '';
    
    try {
      // Try to get from localStorage first
      const storedData = localStorage.getItem('seoAiAssistantData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        lastKnownUrl = parsedData.url || '';
      }
    } catch (e) {
      console.warn('[navigationService] Error reading stored URL:', e);
    }
    
    // If no URL in localStorage, check store
    if (!lastKnownUrl) {
      const storeData = store.getStateSlice('pageData');
      if (storeData) {
        lastKnownUrl = storeData.url || '';
      }
    }
    
    // Compare URLs (ignore trailing slashes and protocol for comparison)
    const normalizeUrl = (url) => {
      if (!url) return '';
      // Remove protocol
      let normalized = url.replace(/^(https?:\/\/)/, '');
      // Remove trailing slash
      normalized = normalized.replace(/\/$/, '');
      return normalized.toLowerCase();
    };
    
    const normalizedCurrent = normalizeUrl(currentUrl);
    const normalizedLast = normalizeUrl(lastKnownUrl);
    
    const hasChanged = normalizedLast && normalizedCurrent && normalizedLast !== normalizedCurrent;
    
    return {
      hasChanged,
      oldUrl: lastKnownUrl,
      newUrl: currentUrl,
      needsRefresh: hasChanged
    };
  }
};
