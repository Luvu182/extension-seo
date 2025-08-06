'use strict';

import { logger } from '../../shared/utils/logger.js';
import { StorageService } from './storage-service.js';

/**
 * Service for fetching and managing server information
 */
class ServerInfoServiceClass {
  /**
   * Fetch server details for a given domain
   * @param {string} domain - The domain to fetch details for
   * @param {number} tabId - The tab ID
   * @param {string} tabUrl - The tab URL
   * @returns {Promise<Object>} - The server info result
   */
  async fetchServerDetails(domain, tabId, tabUrl) {
    // Default result in case of error
    const defaultResult = { 
      ip: 'N/A', 
      httpVersion: 'N/A', 
      server: 'N/A', 
      loaded: true 
    };
    
    try {
      logger.info('ServerInfoService', `Fetching server details for domain: ${domain}`);
      
      const backendApiUrl = 'https://vercel-extension-backend.vercel.app/api/check-server';
      
      const response = await fetch(backendApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: domain })
      });
      
      if (!response.ok) {
        throw new Error(`Backend API HTTP error! status: ${response.status}`);
      }
      
      const backendData = await response.json();
      
      if (backendData.success) {
        const serverInfo = {
          ip: backendData.dns_info?.main_ip || 'N/A (No IP)',
          httpVersion: backendData.http_info?.highest_version || 'N/A',
          server: backendData.http_info?.server || 'N/A',
          loaded: true
        };
        
        // Update stored data if tab info is provided
        if (tabId && tabUrl) {
          const currentData = StorageService.getTabData(tabId, tabUrl) || {};
          currentData.serverInfo = serverInfo;
          await StorageService.setTabData(tabId, tabUrl, currentData);
          logger.info('ServerInfoService', `Saved server info for tab ${tabId}, url ${tabUrl}`);
        }
        
        return serverInfo;
      } else {
        logger.warn('ServerInfoService', 'Backend API failure', backendData);
        return { 
          ...defaultResult, 
          ip: `N/A (Backend: ${backendData.error || 'Failed'})` 
        };
      }
    } catch (error) {
      logger.error('ServerInfoService', `Error fetching server details for ${domain}`, error);
      
      // Try to provide a basic fallback using domain name
      try {
        const fallbackResult = { 
          ...defaultResult, 
          ip: domain || 'N/A (Fetch Error)'
        };
        return fallbackResult;
      } catch (fallbackError) {
        logger.error('ServerInfoService', 'Even fallback failed', fallbackError);
        return defaultResult;
      }
    }
  }
  
  /**
   * Extract domain from URL
   * @param {string} url - The URL to extract domain from
   * @returns {string|null} - The domain or null if invalid
   */
  extractDomain(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch (error) {
      logger.error('ServerInfoService', `Error extracting domain from URL: ${url}`, error);
      return null;
    }
  }
}

// Export as a singleton
export const ServerInfoService = new ServerInfoServiceClass();
