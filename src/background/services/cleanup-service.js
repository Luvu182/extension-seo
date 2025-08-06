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
   * Clear all storage data when quota is exceeded
   */
  async clearAllStorage() {
    try {
      logger.warn('CleanupService', 'Clearing all storage due to quota exceeded');
      
      // Clear chrome.storage.local
      await chrome.storage.local.clear();
      
      // Clear in-memory store
      const seoDataStore = StorageService.seoDataStore;
      for (const tabId in seoDataStore) {
        delete seoDataStore[tabId];
      }
      
      logger.info('CleanupService', 'All storage cleared successfully');
      return true;
    } catch (error) {
      logger.error('CleanupService', 'Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Cleanup old data to prevent memory leaks
   */
  cleanupOldData() {
    const seoDataStore = StorageService.seoDataStore;
    const now = Date.now();
    const MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    let totalRemoved = 0;
    
    for (const tabId in seoDataStore) {
      const urlsForTab = Object.keys(seoDataStore[tabId]);
      let removedForTab = 0;
      
      // Collect URLs with timestamps
      const urlsWithTimestamps = urlsForTab.map(url => {
        const data = seoDataStore[tabId][url];
        const timestamp = data.lastUpdate?.timestamp || data.timestamp || 0;
        const age = now - timestamp;
        return { url, timestamp, age };
      });
      
      // First, remove old data (older than MAX_AGE)
      const oldUrls = urlsWithTimestamps
        .filter(item => item.age > MAX_AGE)
        .map(item => item.url);
      
      if (oldUrls.length > 0) {
        logger.info('CleanupService', `Removing ${oldUrls.length} old URLs (>2hrs) for tab ${tabId}`);
        for (const url of oldUrls) {
          delete seoDataStore[tabId][url];
          
          // Also remove from chrome.storage
          const storageKey = `tab_${tabId}_${encodeURIComponent(url)}`;
          chrome.storage.local.remove(storageKey);
          removedForTab++;
        }
      }
      
      // Then, if still too many URLs, remove oldest ones
      const remainingUrls = urlsWithTimestamps.filter(item => item.age <= MAX_AGE);
      if (remainingUrls.length > CLEANUP.MAX_URLS_PER_TAB) {
        logger.info('CleanupService', `Tab ${tabId} has ${remainingUrls.length} recent URLs. Removing oldest to stay under limit.`);
        
        // Sort by timestamp, oldest first
        remainingUrls.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove oldest URLs to stay under limit
        const urlsToRemove = remainingUrls
          .slice(0, remainingUrls.length - CLEANUP.MAX_URLS_PER_TAB)
          .map(item => item.url);
        
        for (const url of urlsToRemove) {
          delete seoDataStore[tabId][url];
          
          // Also remove from chrome.storage
          const storageKey = `tab_${tabId}_${encodeURIComponent(url)}`;
          chrome.storage.local.remove(storageKey);
          removedForTab++;
        }
      }
      
      // If tab has no URLs left, remove the tab entry
      if (Object.keys(seoDataStore[tabId]).length === 0) {
        delete seoDataStore[tabId];
        logger.info('CleanupService', `Removed empty tab ${tabId}`);
      }
      
      totalRemoved += removedForTab;
    }
    
    if (totalRemoved > 0) {
      logger.info('CleanupService', `Cleanup complete. Removed ${totalRemoved} old entries.`);
    }
  }
}

// Export as a singleton
export const CleanupService = new CleanupServiceClass();
