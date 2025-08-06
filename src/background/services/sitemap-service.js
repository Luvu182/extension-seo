'use strict';

import { logger } from '../../shared/utils/logger.js';
import { StorageService } from './storage-service.js';
import { RobotsService } from './robots-service.js';

/**
 * Service for fetching and parsing sitemap files
 */
class SitemapServiceClass {
  constructor() {
    // Cache for sitemap content
    this.sitemapCache = {};
    
    // Common sitemap locations to check
    this.commonSitemapLocations = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemap-index.xml',
      '/sitemaps/sitemap.xml'
    ];
  }

  /**
   * Find and fetch sitemap for a given URL
   * @param {string} url - The URL to check
   * @param {number} tabId - The tab ID (optional)
   * @returns {Promise<Object>} - The sitemap data
   */
  async findSitemap(url, tabId = null) {
    try {
      // Extract domain from URL
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const protocol = parsedUrl.protocol;
      
      // Check cache first
      if (this.sitemapCache[domain] && this.sitemapCache[domain].timestamp > Date.now() - 3600000) {
        logger.info('SitemapService', `Using cached sitemap data for ${domain}`);
        return this.sitemapCache[domain].data;
      }
      
      // First check robots.txt for sitemap declarations
      logger.info('SitemapService', `Checking robots.txt for sitemap declarations for ${domain}`);
      const robotsData = await RobotsService.fetchRobotsTxt(url);
      
      let sitemapUrls = [];
      
      // If robots.txt exists and has sitemaps, use those
      if (robotsData.exists && robotsData.sitemaps && robotsData.sitemaps.length > 0) {
        sitemapUrls = robotsData.sitemaps;
        logger.info('SitemapService', `Found ${sitemapUrls.length} sitemaps in robots.txt for ${domain}`);
      } else {
        // Otherwise check common locations
        logger.info('SitemapService', `No sitemaps in robots.txt, checking common locations for ${domain}`);
        sitemapUrls = this.commonSitemapLocations.map(path => `${protocol}//${domain}${path}`);
      }
      
      // Try each sitemap URL until we find one that exists
      for (const sitemapUrl of sitemapUrls) {
        try {
          logger.info('SitemapService', `Checking sitemap at ${sitemapUrl}`);
          
          // Fetch sitemap
          const response = await fetch(sitemapUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/xml, text/xml' },
            cache: 'no-store'
          });
          
          if (!response.ok) {
            logger.warn('SitemapService', `Sitemap not found at ${sitemapUrl}: ${response.status}`);
            continue;
          }
          
          // Parse sitemap content
          const content = await response.text();
          
          // Basic validation that it's XML and contains <urlset> or <sitemapindex>
          if (!content.includes('<urlset') && !content.includes('<sitemapindex')) {
            logger.warn('SitemapService', `Invalid sitemap format at ${sitemapUrl}`);
            continue;
          }
          
          // Determine if it's a sitemap index or regular sitemap
          const isSitemapIndex = content.includes('<sitemapindex');
          
          // Create result
          const result = {
            exists: true,
            url: sitemapUrl,
            isSitemapIndex: isSitemapIndex,
            content: content,
            timestamp: Date.now()
          };
          
          // Cache the result
          this.sitemapCache[domain] = {
            data: result,
            timestamp: Date.now()
          };
          
          // Store in tab data if tabId is provided
          if (tabId) {
            const tabData = StorageService.getTabData(tabId, url) || {};
            tabData.sitemap = result;
            await StorageService.setTabData(tabId, url, tabData);
          }
          
          return result;
        } catch (error) {
          logger.error('SitemapService', `Error fetching sitemap at ${sitemapUrl}`, error);
          continue;
        }
      }
      
      // If we get here, no sitemap was found
      logger.warn('SitemapService', `No sitemap found for ${domain}`);
      
      const emptyResult = {
        exists: false,
        content: '',
        timestamp: Date.now()
      };
      
      // Cache the result
      this.sitemapCache[domain] = {
        data: emptyResult,
        timestamp: Date.now()
      };
      
      // Store in tab data if tabId is provided
      if (tabId) {
        const tabData = StorageService.getTabData(tabId, url) || {};
        tabData.sitemap = emptyResult;
        await StorageService.setTabData(tabId, url, tabData);
      }
      
      return emptyResult;
    } catch (error) {
      logger.error('SitemapService', `Error finding sitemap for ${url}`, error);
      
      // Return a default result on error
      return {
        exists: false,
        error: error.message,
        content: '',
        timestamp: Date.now()
      };
    }
  }
}

// Export as singleton
export const SitemapService = new SitemapServiceClass();
