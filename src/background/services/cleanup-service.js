'use strict';

import { CLEANUP } from '../../shared/constants.js';
import { StorageService } from './storage-service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Service for periodic cleanup of old data
 */
class CleanupServiceClass {
  interval = null;

  /**
   * Start periodic cleanup to prevent memory leaks
   */
  startPeriodicCleanup() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.cleanupOldData();
    }, CLEANUP.CLEANUP_INTERVAL);

    logger.info('CleanupService', `Started periodic cleanup (interval: ${CLEANUP.CLEANUP_INTERVAL}ms)`);
  }

  /**
   * Stop the periodic cleanup
   */
  stopPeriodicCleanup() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('CleanupService', 'Stopped periodic cleanup');
    }
  }

  /**
   * Cleanup old data to prevent memory leaks
   */
  cleanupOldData() {
    const seoDataStore = StorageService.seoDataStore;
    
    for (const tabId in seoDataStore) {
      const urlsForTab = Object.keys(seoDataStore[tabId]);
      
      // Skip tabs with few URLs
      if (urlsForTab.length <= CLEANUP.MAX_URLS_PER_TAB) continue;
      
      logger.info('CleanupService', `Tab ${tabId} has ${urlsForTab.length} URLs. Cleaning up old data.`);
      
      // Collect URLs with timestamps
      const urlsWithTimestamps = urlsForTab.map(url => {
        const data = seoDataStore[tabId][url];
        const timestamp = data.lastUpdate?.timestamp || 0;
        return { url, timestamp };
      });
      
      // Sort by timestamp, oldest first
      urlsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
      
      // Keep only the most recent URLs, delete the oldest ones
      const urlsToRemove = urlsWithTimestamps
        .slice(0, urlsWithTimestamps.length - CLEANUP.MAX_URLS_PER_TAB)
        .map(item => item.url);
      
      // Remove from memory and storage
      for (const url of urlsToRemove) {
        logger.info('CleanupService', `Removing old data for tab ${tabId}, url ${url}`);
        delete seoDataStore[tabId][url];
        
        // Also remove from chrome.storage
        const storageKey = `tab_${tabId}_${encodeURIComponent(url)}`;
        chrome.storage.local.remove(storageKey);
      }
    }
  }
}

// Export as a singleton
export const CleanupService = new CleanupServiceClass();
