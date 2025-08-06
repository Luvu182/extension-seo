'use strict';

import { logger } from '../../shared/utils/logger.js';
import { StorageService } from './storage-service.js';

/**
 * Service for handling Web Vitals metrics
 */
class WebVitalsServiceClass {
  /**
   * Inject Web Vitals measurement script into a tab
   * @param {number} tabId - The tab ID to inject into
   * @returns {Promise<boolean>} - Whether injection was successful
   */
  async injectWebVitalsScript(tabId) {
    logger.info('WebVitalsService', `Injecting web vitals scripts into tab ${tabId}`);
    
    try {
      // Validate tab ID
      if (!tabId || typeof tabId !== 'number') {
        throw new Error('Invalid tab ID');
      }
      
      // Check if scripting API is available
      if (!chrome.scripting) {
        throw new Error('chrome.scripting API is not available');
      }
      
      // Get tab info to initialize web vitals object
      const tabInfo = await chrome.tabs.get(tabId);
      const tabUrl = tabInfo.url;
      
      // Initialize empty web vitals object in storage
      if (tabUrl) {
        const currentData = StorageService.getTabData(tabId, tabUrl) || {};
        
        // Initialize web vitals object if needed
        if (!currentData.webVitals || typeof currentData.webVitals !== 'object' || Array.isArray(currentData.webVitals)) {
          currentData.webVitals = {};
          await StorageService.setTabData(tabId, tabUrl, currentData);
          logger.info('WebVitalsService', `Initialized empty webVitals object for tab ${tabId}`);
        }
      }
      
      // Inject the direct web vitals measurement script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['/js/lib/direct-web-vitals.js'],
        world: 'ISOLATED', // Use ISOLATED to avoid conflicts
        injectImmediately: true
      });
      
      logger.info('WebVitalsService', `Successfully injected web vitals script into tab ${tabId}`);
      return true;
    } catch (error) {
      logger.error('WebVitalsService', `Failed to inject web vitals script: ${error.message}`, error);
      return false;
    }
  }
  
  /**
   * Save a Web Vital metric for a tab
   * @param {number} tabId - The tab ID
   * @param {string} tabUrl - The tab URL
   * @param {string} name - The metric name
   * @param {number} value - The metric value
   * @returns {boolean} - Whether save was successful
   */
  saveWebVitalMetric(tabId, tabUrl, name, value) {
    try {
      // Validate inputs
      if (!tabId || !tabUrl || !name || value === undefined) {
        logger.warn('WebVitalsService', 'Invalid parameters for saveWebVitalMetric', {
          tabId, tabUrl, name, value
        });
        return false;
      }
      
      logger.info('WebVitalsService', `Saving ${name} = ${value} for tab ${tabId}, url ${tabUrl}`);
      
      // Get current tab data
      const currentData = StorageService.getTabData(tabId, tabUrl) || {};
      
      // Initialize web vitals object if needed
      if (!currentData.webVitals || typeof currentData.webVitals !== 'object' || Array.isArray(currentData.webVitals)) {
        currentData.webVitals = {};
      }
      
      // Fix case where webVitals might be a string
      if (typeof currentData.webVitals === 'string') {
        try {
          currentData.webVitals = JSON.parse(currentData.webVitals);
        } catch (e) {
          currentData.webVitals = {};
        }
      }
      
      // Standardize metric name to lowercase
      const metricName = String(name).toLowerCase();
      const numValue = Number(value);
      
      // Validate and store different metrics with appropriate ranges
      const isValid = this.validateWebVitalValue(metricName, numValue);
      
      if (isValid) {
        // Store the valid metric
        currentData.webVitals[metricName] = numValue;
        logger.info('WebVitalsService', `Saved ${metricName} = ${numValue}`);
      } else {
        logger.warn('WebVitalsService', `Ignoring invalid ${metricName} value: ${numValue}`);
      }
      
      // Add timestamp
      currentData.webVitals.lastUpdated = Date.now();
      
      // Save to storage
      StorageService.setTabData(tabId, tabUrl, currentData);
      
      // Notify any open UI about the update
      this.notifyWebVitalsUpdate(tabId, tabUrl, currentData.webVitals);
      
      return isValid;
    } catch (error) {
      logger.error('WebVitalsService', `Error saving web vital ${name}`, error);
      return false;
    }
  }
  
  /**
   * Validate a Web Vital value is within expected ranges
   * @param {string} name - The metric name
   * @param {number} value - The metric value
   * @returns {boolean} - Whether value is valid
   */
  validateWebVitalValue(name, value) {
    // Must be a number
    if (isNaN(value) || !isFinite(value)) {
      return false;
    }
    
    // Validate based on metric type
    switch (name) {
      case 'lcp': // Largest Contentful Paint
        return value > 0 && value < 100000; // Valid LCP is positive and under 100 seconds
        
      case 'fid': // First Input Delay
        return value >= 0 && value < 5000; // Valid FID is non-negative and under 5 seconds
        
      case 'cls': // Cumulative Layout Shift
        return value >= 0 && value < 10; // Valid CLS is non-negative and typically under 1
        
      case 'ttfb': // Time To First Byte
        return value > 0 && value < 30000; // Valid TTFB is positive and under 30 seconds
        
      case 'fcp': // First Contentful Paint
        return value > 0 && value < 100000; // Valid FCP is positive and under 100 seconds
        
      case 'inp': // Interaction to Next Paint
        return value >= 0 && value < 10000; // Valid INP is non-negative and under 10 seconds
      
      default:
        // For unknown metrics, just verify it's a reasonable number
        return value > -1000000 && value < 1000000;
    }
  }
  
  /**
   * Notify UI components about Web Vitals updates
   * @param {number} tabId - The tab ID
   * @param {string} tabUrl - The tab URL
   * @param {Object} webVitals - The web vitals data
   */
  notifyWebVitalsUpdate(tabId, tabUrl, webVitals) {
    try {
      // Try to notify popup if open
      chrome.runtime.sendMessage({
        action: 'webVitalsUpdated',
        webVitals: webVitals,
        tabId: tabId,
        url: tabUrl,
        timestamp: Date.now()
      }, (response) => {
        // Ignore errors if popup isn't open
        if (chrome.runtime.lastError) {
          // This is normal if popup isn't open
          logger.debug('WebVitalsService', 'No popup open to receive web vitals update');
        } else if (response && response.success) {
          logger.debug('WebVitalsService', 'Popup acknowledged web vitals update');
        }
      });
      
      // Also try to notify the content script in the tab
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'webVitalsUpdated',
          webVitals: webVitals,
          tabId: tabId,
          url: tabUrl,
          timestamp: Date.now()
        }, (response) => {
          // Ignore errors if content script isn't listening
          if (chrome.runtime.lastError) {
            // This is normal if content script isn't ready
            logger.debug('WebVitalsService', 'Content script not ready to receive web vitals update');
          }
        });
      }
    } catch (error) {
      // Ignore notification errors
      logger.debug('WebVitalsService', 'Error notifying about web vitals update', error);
    }
  }
  
  /**
   * Get the latest Web Vitals for a tab
   * @param {number} tabId - The tab ID
   * @param {string} tabUrl - The tab URL
   * @returns {Object|null} - The web vitals data or null
   */
  getLatestWebVitals(tabId, tabUrl) {
    try {
      if (!tabId || !tabUrl) {
        return null;
      }
      
      const tabData = StorageService.getTabData(tabId, tabUrl);
      
      if (tabData && tabData.webVitals && typeof tabData.webVitals === 'object') {
        return tabData.webVitals;
      }
      
      return null;
    } catch (error) {
      logger.error('WebVitalsService', 'Error getting latest web vitals', error);
      return null;
    }
  }
}

// Export as a singleton
export const WebVitalsService = new WebVitalsServiceClass();
