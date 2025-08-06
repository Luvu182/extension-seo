'use strict';

import { store } from '../store.js';
import { dataService } from '../data-service.js';

/**
 * Service for fetching SEO data from extension components
 * Handles communication between popup, background, and content scripts
 */
class DataFetchingService {
  constructor() {
    this.TIMEOUT_MS = 10000;
    this.RETRY_DELAY_MS = 300;
  }

  /**
   * Request latest Web Vitals data
   */
  async requestLatestWebVitals() {
    try {
      console.log('[DataFetching] Requesting Web Vitals...');
      
      const response = await this.sendMessage({
        action: 'getLatestWebVitals',
        timestamp: Date.now()
      });

      if (response?.success && response.webVitals) {
        this.updateWebVitals(response.webVitals, response.timestamp);
      }
    } catch (error) {
      console.error('[DataFetching] Web Vitals request failed:', error);
    }
  }

  /**
   * Refresh all SEO data
   */
  async refreshData() {
    console.log('[DataFetching] Refreshing data...');
    store.setStateSlice('isLoading', true);

    try {
      const tab = await this.getActiveTab();
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Try to get fresh data from content script
      const success = await this.refreshFromContentScript(tab.id);
      
      if (!success) {
        console.log('[DataFetching] Content script failed, loading from background');
      }
      
      // Always load from background (it may have fresher data)
      await this.loadFromBackground(tab.url);
      
    } catch (error) {
      console.error('[DataFetching] Refresh failed:', error);
      this.setErrorState(error.message);
    }
  }

  /**
   * Load data from background script
   */
  async loadFromBackground(currentUrl) {
    try {
      const response = await this.sendMessage({
        action: 'getSEOData',
        currentUrl: currentUrl,
        timestamp: Date.now()
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Background request failed');
      }

      const data = response.data || {};
      
      // Process and validate data
      const processedData = await dataService.processData(data);
      
      // Update store
      store.setState({
        pageData: processedData,
        isLoading: false
      });

      console.log('[DataFetching] Data loaded successfully');
      
    } catch (error) {
      console.error('[DataFetching] Background load failed:', error);
      this.setErrorState(error.message);
    }
  }

  /**
   * Try to refresh data from content script
   */
  async refreshFromContentScript(tabId) {
    try {
      // First attempt
      let response = await this.sendTabMessage(tabId, {
        action: 'extractSEOData'
      });

      // If failed, inject content script and retry
      if (!response) {
        console.log('[DataFetching] Injecting content script...');
        await this.injectContentScript(tabId);
        
        // Wait for script initialization
        await this.delay(this.RETRY_DELAY_MS);
        
        // Retry with force refresh flag
        response = await this.sendTabMessage(tabId, {
          action: 'extractSEOData',
          forceRefresh: true
        });
      }

      return !!response;
      
    } catch (error) {
      console.error('[DataFetching] Content script refresh failed:', error);
      return false;
    }
  }

  /**
   * Update Web Vitals in store
   */
  updateWebVitals(webVitals, timestamp) {
    const currentData = store.getStateSlice('pageData') || {};
    
    const updatedData = {
      ...currentData,
      webVitals: {
        ...currentData.webVitals,
        ...webVitals,
        lastUpdated: timestamp || Date.now()
      }
    };

    // Preserve SPA flags
    if (currentData.isSpaDetected || currentData.isSpaNavigation) {
      updatedData.isSpaDetected = currentData.isSpaDetected;
      updatedData.isSpaNavigation = currentData.isSpaNavigation;
    }

    store.setStateSlice('pageData', updatedData);
  }

  /**
   * Set error state in store
   */
  setErrorState(message) {
    store.setState({
      pageData: { error: message },
      isLoading: false
    });
  }

  /**
   * Get active tab
   */
  async getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs?.[0] || null);
      });
    });
  }

  /**
   * Send message to background
   */
  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[DataFetching] Message error:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Send message to tab
   */
  async sendTabMessage(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Inject content script
   */
  async injectContentScript(tabId) {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.bundle.js']
      }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const dataFetchingService = new DataFetchingService();