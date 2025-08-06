'use strict';

import { logger } from '../../shared/utils/logger.js';
import { SitemapService } from '../services/sitemap-service.js';

/**
 * Controller for handling sitemap related requests
 */
export class SitemapController {
  /**
   * Handle message routing for sitemap related actions
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  static handleMessage(message, sender, sendResponse) {
    const { action } = message;
    
    switch (action) {
      case 'findSitemap':
        return SitemapController.handleFindSitemap(message, sender, sendResponse);
      default:
        return false;
    }
  }
  
  /**
   * Handle find sitemap request
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  static handleFindSitemap(message, sender, sendResponse) {
    const { url } = message;
    
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return false;
    }
    
    // Get tab ID if available
    const tabId = sender.tab ? sender.tab.id : null;
    
    // Find sitemap
    SitemapService.findSitemap(url, tabId)
      .then(sitemapData => {
        sendResponse({ success: true, sitemapData });
      })
      .catch(error => {
        logger.error('SitemapController', `Error finding sitemap for ${url}`, error);
        sendResponse({ 
          success: false, 
          error: error.message,
          sitemapData: {
            exists: false,
            error: error.message,
            content: ''
          }
        });
      });
    
    return true; // Keep channel open for async response
  }
}
