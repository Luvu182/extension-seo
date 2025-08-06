'use strict';

/**
 * Service for interacting with robots.txt data
 */
export const robotsService = {
  /**
   * Fetch robots.txt data for a URL
   * @param {string} url - The URL to check
   * @returns {Promise<Object>} - The robots.txt data
   */
  async fetchRobotsTxt(url) {
    try {
      console.log('[robotsService] Fetching robots.txt for URL:', url);
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'fetchRobotsTxt',
          url: url
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch robots.txt');
      }
      
      return response.robotsData;
    } catch (error) {
      console.error('[robotsService] Error fetching robots.txt:', error);
      throw error;
    }
  },
  
  /**
   * Check if a URL is allowed by robots.txt
   * @param {string} url - The URL to check
   * @param {string} userAgent - The user agent to check (default: *)
   * @returns {Promise<Object>} - The check result
   */
  async isUrlAllowed(url, userAgent = '*') {
    try {
      console.log('[robotsService] Checking if URL is allowed:', url);
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'isUrlAllowed',
          url: url,
          userAgent: userAgent
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to check if URL is allowed');
      }
      
      return response.result;
    } catch (error) {
      console.error('[robotsService] Error checking if URL is allowed:', error);
      throw error;
    }
  }
};
