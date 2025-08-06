'use strict';

import { logger } from '../../shared/utils/logger.js';
import { RobotsService } from '../services/robots-service.js';

/**
 * Controller for handling robots.txt related requests
 */
export class RobotsController {
  /**
   * Handle message routing for robots.txt related actions
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  static handleMessage(message, sender, sendResponse) {
    const { action } = message;
    
    switch (action) {
      case 'fetchRobotsTxt':
        return RobotsController.handleFetchRobotsTxt(message, sender, sendResponse);
      case 'isUrlAllowed':
        return RobotsController.handleIsUrlAllowed(message, sender, sendResponse);
      default:
        return false;
    }
  }
  
  /**
   * Handle fetch robots.txt request
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  static handleFetchRobotsTxt(message, sender, sendResponse) {
    const { url } = message;
    
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return false;
    }
    
    // Get tab ID if available
    const tabId = sender.tab ? sender.tab.id : null;
    
    // Fetch robots.txt
    RobotsService.fetchRobotsTxt(url, tabId)
      .then(robotsData => {
        sendResponse({ success: true, robotsData });
      })
      .catch(error => {
        logger.error('RobotsController', `Error fetching robots.txt for ${url}`, error);
        sendResponse({ 
          success: false, 
          error: error.message,
          robotsData: {
            exists: false,
            error: error.message,
            content: '',
            sitemaps: [],
            userAgents: [],
            rules: [],
            isCurrentUrlAllowed: true // Default to allowed on error
          }
        });
      });
    
    return true; // Keep channel open for async response
  }
  
  /**
   * Handle check if URL is allowed by robots.txt
   * @param {Object} message - The message
   * @param {Object} sender - The sender
   * @param {Function} sendResponse - Function to send response
   * @returns {boolean} - Whether to keep the message channel open
   */
  static handleIsUrlAllowed(message, sender, sendResponse) {
    const { url, userAgent } = message;
    
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return false;
    }
    
    // Check if URL is allowed
    RobotsService.isUrlAllowed(url, userAgent || '*')
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        logger.error('RobotsController', `Error checking if URL is allowed: ${url}`, error);
        sendResponse({ 
          success: false, 
          error: error.message,
          result: {
            allowed: true, // Default to allowed on error
            reason: `Error: ${error.message}`
          }
        });
      });
    
    return true; // Keep channel open for async response
  }
}
