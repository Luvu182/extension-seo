'use strict';

import { logger } from '../../shared/utils/logger.js';
import { MESSAGE_TYPES } from '../../shared/constants.js';
// Import the shared messaging utility
import { messaging } from '../../shared/utils/messaging.js';

/**
 * Service for handling messaging initiated FROM the background script.
 * Uses the shared messaging utility where appropriate.
 */
class MessagingServiceClass {
  /**
   * Send a message to a specific tab
   * @param {number} tabId - The tab ID to send message to
   * @param {Object} message - The message to send
   * @param {boolean} expectResponse - Whether to expect a response (default: true)
   * @returns {Promise<any>} - Promise resolving to the response or undefined
   */
  sendToTab(tabId, message, expectResponse = true) {
    // Use the shared utility which includes retries and error handling
    return messaging.sendToContent(tabId, message, expectResponse);
  }

  /**
   * Send a message to the background script
   * @param {Object} message - The message to send
   * @returns {Promise<any>} - Promise resolving to the response
   */
  sendToBackground(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, response => {
          if (chrome.runtime.lastError) {
            logger.error('MessagingService', `Error sending message to background: ${chrome.runtime.lastError.message}`);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response || { success: true });
          }
        });
      } catch (error) {
        logger.error('MessagingService', 'Error sending message to background', error);
        reject(error);
      }
    });
  }

  /**
   * Send a message to all tabs
   * @param {Object} message - The message to send
   * @param {Object} options - Options for filtering tabs
   * @returns {Promise<Array>} - Promise resolving to array of responses
   */
  async broadcastToTabs(message, options = {}) {
    const { urlPattern = null, excludeTabId = null } = options;
    
    try {
      // Query for all tabs, possibly with URL filter
      const queryOptions = urlPattern ? { url: urlPattern } : {};
      const tabs = await this.queryTabs(queryOptions);
      
      const responses = [];
      
      // Send message to each tab (except excluded tab if specified) using the shared utility
      const sendPromises = tabs
        .filter(tab => !(excludeTabId && tab.id === excludeTabId))
        .map(tab =>
          messaging.sendToContent(tab.id, message, false) // Send without expecting response for broadcast efficiency
            .then(response => ({ tabId: tab.id, response: response || { success: true } })) // Ensure a response object
            .catch(error => {
              logger.debug('MessagingService', `Broadcast failed for tab ${tab.id}`, error.message);
              return { tabId: tab.id, error: error.message }; // Capture errors per tab
            })
        );

      // Wait for all messages to be sent (or fail)
      const results = await Promise.allSettled(sendPromises);

      // Process results
      return results.map(result => {
         if (result.status === 'fulfilled') {
            return result.value;
         } else {
            // This case might not happen often with the catch above, but good practice
            logger.error('MessagingService', 'Unexpected broadcast error state:', result.reason);
            // Attempt to return a structured error if possible
            return { tabId: 'unknown', error: result.reason?.message || 'Unknown broadcast error' };
         }
      });
    } catch (error) {
      logger.error('MessagingService', 'Error broadcasting to tabs', error);
      throw error;
    }
  }
  
  /**
   * Query for tabs matching options
   * @param {Object} queryOptions - Chrome tab query options
   * @returns {Promise<Array>} - Promise resolving to array of tabs
   */
  queryTabs(queryOptions = {}) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query(queryOptions, tabs => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(tabs || []);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Get the current active tab
   * @returns {Promise<Object>} - Promise resolving to active tab
   */
  getActiveTab() {
    return this.queryTabs({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs && tabs.length > 0) {
          return tabs[0];
        }
        throw new Error('No active tab found');
      });
  }
  
  /**
   * Check connection to background script with ping
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} - Promise resolving to connection status
   */
  async checkConnection(timeout = 2000) {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), timeout);
      });
      
      // Create a promise for the ping message
      const pingPromise = this.sendToBackground({ action: 'ping' });
      
      // Race the promises
      const response = await Promise.race([pingPromise, timeoutPromise]);
      
      return response && response.success === true;
    } catch (error) {
      logger.warn('MessagingService', 'Connection check failed', error);
      return false;
    }
  }
}

// Export as singleton
export const MessagingService = new MessagingServiceClass();
