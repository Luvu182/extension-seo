'use strict';

import { logger } from '../../shared/utils/logger.js';
import { StorageService } from './storage-service.js';

/**
 * Service for fetching and parsing robots.txt files
 */
class RobotsServiceClass {
  constructor() {
    // Cache for robots.txt content
    this.robotsCache = {};
  }

  /**
   * Fetch and parse robots.txt for a given domain
   * @param {string} url - The URL to check
   * @param {number} tabId - The tab ID (optional)
   * @returns {Promise<Object>} - The robots.txt data
   */
  async fetchRobotsTxt(url, tabId = null) {
    try {
      // Extract domain from URL
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const protocol = parsedUrl.protocol;
      const robotsUrl = `${protocol}//${domain}/robots.txt`;
      
      // Check cache first
      if (this.robotsCache[domain] && this.robotsCache[domain].timestamp > Date.now() - 3600000) {
        logger.info('RobotsService', `Using cached robots.txt for ${domain}`);
        return this.robotsCache[domain].data;
      }
      
      logger.info('RobotsService', `Fetching robots.txt from ${robotsUrl}`);
      
      // Fetch robots.txt
      const response = await fetch(robotsUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          logger.warn('RobotsService', `robots.txt not found for ${domain}`);
          const emptyResult = {
            exists: false,
            content: '',
            sitemaps: [],
            userAgents: [],
            rules: [],
            isCurrentUrlAllowed: true, // Default to allowed if no robots.txt
            timestamp: Date.now()
          };
          
          // Cache the result
          this.robotsCache[domain] = {
            data: emptyResult,
            timestamp: Date.now()
          };
          
          return emptyResult;
        }
        
        throw new Error(`Failed to fetch robots.txt: ${response.status} ${response.statusText}`);
      }
      
      // Parse robots.txt content
      const content = await response.text();
      const parsedData = this.parseRobotsTxt(content);
      
      // Add metadata
      const result = {
        exists: true,
        content: content,
        ...parsedData,
        timestamp: Date.now()
      };
      
      // Cache the result
      this.robotsCache[domain] = {
        data: result,
        timestamp: Date.now()
      };
      
      // Store in tab data if tabId is provided
      if (tabId) {
        const tabData = StorageService.getTabData(tabId, url) || {};
        tabData.robots = {
          ...tabData.robots,
          robotsTxt: result
        };
        await StorageService.setTabData(tabId, url, tabData);
      }
      
      return result;
    } catch (error) {
      logger.error('RobotsService', `Error fetching robots.txt for ${url}`, error);
      
      // Return a default result on error
      return {
        exists: false,
        error: error.message,
        content: '',
        sitemaps: [],
        userAgents: [],
        rules: [],
        isCurrentUrlAllowed: true, // Default to allowed on error
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Parse robots.txt content
   * @param {string} content - The robots.txt content
   * @returns {Object} - The parsed data
   */
  parseRobotsTxt(content) {
    if (!content || typeof content !== 'string') {
      return {
        sitemaps: [],
        userAgents: [],
        rules: []
      };
    }
    
    const lines = content.split('\n');
    const sitemaps = [];
    const userAgents = [];
    const rules = [];
    
    let currentUserAgent = null;
    
    for (let line of lines) {
      // Remove comments and trim
      line = line.split('#')[0].trim();
      
      if (!line) continue;
      
      // Check for sitemap
      if (line.toLowerCase().startsWith('sitemap:')) {
        const sitemap = line.substring(8).trim();
        if (sitemap) {
          sitemaps.push(sitemap);
        }
        continue;
      }
      
      // Check for user-agent
      if (line.toLowerCase().startsWith('user-agent:')) {
        const agent = line.substring(11).trim();
        if (agent) {
          currentUserAgent = agent;
          if (!userAgents.includes(agent)) {
            userAgents.push(agent);
          }
        }
        continue;
      }
      
      // Check for allow/disallow rules
      if (line.toLowerCase().startsWith('allow:') || line.toLowerCase().startsWith('disallow:')) {
        const isAllow = line.toLowerCase().startsWith('allow:');
        const path = isAllow ? 
          line.substring(6).trim() : 
          line.substring(9).trim();
        
        if (path !== undefined) {
          rules.push({
            userAgent: currentUserAgent || '*',
            rule: isAllow ? 'allow' : 'disallow',
            path: path
          });
        }
      }
    }
    
    return {
      sitemaps,
      userAgents,
      rules
    };
  }
  
  /**
   * Check if a URL is allowed by robots.txt
   * @param {string} url - The URL to check
   * @param {string} userAgent - The user agent to check (default: *)
   * @returns {Promise<Object>} - The check result
   */
  async isUrlAllowed(url, userAgent = '*') {
    try {
      // Get robots.txt data
      const robotsData = await this.fetchRobotsTxt(url);
      
      if (!robotsData.exists || robotsData.error) {
        // If robots.txt doesn't exist or there was an error, assume allowed
        return {
          allowed: true,
          reason: robotsData.exists ? 'Error fetching robots.txt' : 'No robots.txt file'
        };
      }
      
      // Parse URL to get path
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname + parsedUrl.search;
      
      // Find applicable rules for this user agent
      // First look for specific user agent, then fallback to *
      const specificRules = robotsData.rules.filter(r => 
        r.userAgent.toLowerCase() === userAgent.toLowerCase());
      
      const wildcardRules = robotsData.rules.filter(r => 
        r.userAgent === '*');
      
      const applicableRules = specificRules.length > 0 ? specificRules : wildcardRules;
      
      // If no rules apply, it's allowed
      if (applicableRules.length === 0) {
        return {
          allowed: true,
          reason: 'No applicable rules'
        };
      }
      
      // Check rules in order (longest path match first)
      const sortedRules = [...applicableRules].sort((a, b) => 
        b.path.length - a.path.length);
      
      for (const rule of sortedRules) {
        // Convert rule path to regex pattern
        let pattern = rule.path;
        
        // Handle wildcards
        pattern = pattern.replace(/\*/g, '.*');
        
        // Handle $ (end of URL)
        if (pattern.endsWith('$')) {
          pattern = pattern.slice(0, -1) + '$';
        }
        
        // Create regex
        const regex = new RegExp(`^${pattern}`);
        
        // Check if path matches
        if (regex.test(path)) {
          return {
            allowed: rule.rule === 'allow',
            reason: `Matched ${rule.rule} rule: ${rule.path}`,
            matchedRule: rule
          };
        }
      }
      
      // If no rules matched, it's allowed
      return {
        allowed: true,
        reason: 'No matching rules'
      };
    } catch (error) {
      logger.error('RobotsService', `Error checking if URL is allowed: ${url}`, error);
      
      // Default to allowed on error
      return {
        allowed: true,
        reason: `Error: ${error.message}`
      };
    }
  }
}

// Export as singleton
export const RobotsService = new RobotsServiceClass();
