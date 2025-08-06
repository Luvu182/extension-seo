'use strict';

import { ServerInfoService } from '../services/server-info-service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Controller for handling server information requests
 */
class ServerInfoControllerClass {
  /**
   * Initialize controller
   */
  initialize() {
    logger.info('ServerInfoController', 'Initialized');
  }

  /**
   * Handle fetch server details request
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  handleFetchServerDetails(message, sender, sendResponse) {
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
      if (!tabs || !tabs.length || !tabs[0].id) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      const tabId = tabs[0].id;
      const currentUrl = tabs[0].url;

      if (!currentUrl || !(currentUrl.startsWith('http:') || currentUrl.startsWith('https:'))) {
        sendResponse({ success: true, serverInfo: { 
          ip: 'N/A (Invalid URL)', 
          httpVersion: 'N/A', 
          server: 'N/A', 
          loaded: true 
        }});
        return;
      }

      try {
        // Extract domain from URL
        const domain = ServerInfoService.extractDomain(currentUrl);
        
        if (!domain) {
          sendResponse({ success: true, serverInfo: { 
            ip: 'N/A (Invalid domain)', 
            httpVersion: 'N/A', 
            server: 'N/A', 
            loaded: true 
          }});
          return;
        }
        
        // Fetch server details
        const serverInfo = await ServerInfoService.fetchServerDetails(domain, tabId, currentUrl);
        
        // Send response
        sendResponse({ success: true, serverInfo });
      } catch (error) {
        logger.error('ServerInfoController', 'Error in fetchServerDetails', error);
        sendResponse({ success: true, serverInfo: { 
          ip: 'N/A (Error)', 
          httpVersion: 'N/A', 
          server: 'N/A', 
          loaded: true 
        }});
      }
    });
    
    return true; // Keep channel open for async response
  }
}

// Export as singleton
export const ServerInfoController = new ServerInfoControllerClass();
