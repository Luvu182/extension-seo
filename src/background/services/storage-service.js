'use strict';

import { STORAGE_KEYS } from '../../shared/constants.js';
import { logger } from '../../shared/utils/logger.js';
// Import the shared storage utility
import { storageUtils } from '../../shared/utils/storage-utils.js';

/**
 * Service for managing data storage and retrieval, including in-memory cache
 * and interaction with chrome.storage.local via storageUtils.
 */
class StorageServiceClass {
  // Private data stores
  seoDataStore = {};
  lastKnownUrls = {};
  lastUpdateTimestamps = {};

  /**
   * Initialize the storage service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    logger.info('StorageService', 'Initializing...');
    // No initialization needed for now
    return true;
  }

  /**
   * Get tab data with URL-based indexing
   * @param {number} tabId - The tab ID
   * @param {string} url - The URL (optional)
   * @returns {Object} - The tab data
   */
  getTabData(tabId, url) {
    if (!this.seoDataStore[tabId]) {
      return null;
    }

    if (url) {
      return this.seoDataStore[tabId][url] || null;
    }

    return this.seoDataStore[tabId];
  }

  /**
   * Get all tab data for a specific tab
   * @param {number} tabId - The tab ID
   * @returns {Object|null} - All data for the tab, keyed by URL
   */
  getAllTabData(tabId) {
    if (!this.seoDataStore[tabId]) {
      return null;
    }

    return this.seoDataStore[tabId];
  }

  /**
   * Optimize data size by removing unnecessary fields
   * @param {Object} data - The data to optimize
   * @returns {Object} - Optimized data
   */
  optimizeDataSize(data) {
    if (!data) return data;
    
    // Create a shallow copy
    const optimized = { ...data };
    
    // Log original size
    const originalSize = JSON.stringify(data).length;
    logger.info('StorageService', `Original data size: ${originalSize} bytes`);
    
    // Remove large fields that might not be needed for storage
    if (optimized.links?.internal?.items?.length > 20) {
      optimized.links.internal.items = optimized.links.internal.items.slice(0, 20);
    }
    if (optimized.links?.external?.items?.length > 20) {
      optimized.links.external.items = optimized.links.external.items.slice(0, 20);
    }
    
    // Remove image data completely if too large
    if (optimized.images?.items?.length > 10) {
      optimized.images.items = optimized.images.items.slice(0, 10).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
        // Remove other fields like base64, naturalWidth, etc
      }));
    }
    
    // Remove raw HTML content and other large fields
    delete optimized.rawHtml;
    delete optimized.fullContent;
    delete optimized.scripts;
    delete optimized.stylesheets;
    delete optimized.jsonLdRaw;
    delete optimized.microdataRaw;
    
    // Remove detailed structured data if too large
    if (optimized.structuredData) {
      // Keep only summary
      optimized.structuredData = {
        hasJsonLd: !!optimized.structuredData.jsonLd?.length,
        hasMicrodata: !!optimized.structuredData.microdata?.length,
        jsonLdCount: optimized.structuredData.jsonLd?.length || 0,
        microdataCount: optimized.structuredData.microdata?.length || 0
      };
    }
    
    // Log optimized size
    const optimizedSize = JSON.stringify(optimized).length;
    logger.info('StorageService', `Optimized data size: ${optimizedSize} bytes (reduced by ${originalSize - optimizedSize} bytes)`);
    
    return optimized;
  }

  /**
   * Check storage quota
   * @returns {Promise<Object>} - Quota info
   */
  async checkStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const percentUsed = (estimate.usage / estimate.quota) * 100;
      logger.info('StorageService', `Storage usage: ${percentUsed.toFixed(2)}% (${estimate.usage} / ${estimate.quota})`);
      return { usage: estimate.usage, quota: estimate.quota, percentUsed };
    }
    return null;
  }

  /**
   * Set tab data with URL-based indexing
   * @param {number} tabId - The tab ID
   * @param {string} url - The URL
   * @param {Object} data - The data to set
   * @returns {Promise<Object>} - The set data
   */
  async setTabData(tabId, url, data) {
    if (!this.seoDataStore[tabId]) {
      this.seoDataStore[tabId] = {};
    }

    // Optimize data size before storing
    const optimizedData = this.optimizeDataSize(data);
    this.seoDataStore[tabId][url] = optimizedData;

    // Check storage quota before saving
    const quota = await this.checkStorageQuota();
    if (quota && quota.percentUsed > 80) {
      logger.warn('StorageService', `Storage usage high: ${quota.percentUsed.toFixed(2)}%`);
      // Clear old data first
      await this.clearOldTabData();
    }

    // Check if data is too large even after optimization
    const dataSize = JSON.stringify(optimizedData).length;
    const MAX_SINGLE_ITEM_SIZE = 8192; // Chrome's limit per item is ~8KB
    
    if (dataSize > MAX_SINGLE_ITEM_SIZE) {
      logger.warn('StorageService', `Data still too large (${dataSize} bytes) after optimization, keeping in memory only`);
      // Don't try to save to chrome.storage if too large
      return optimizedData;
    }

    // Save to chrome.storage with URL-specific key
    const storageKey = `${STORAGE_KEYS.TAB_PREFIX}${tabId}_${encodeURIComponent(url)}`;
    const storageData = { [storageKey]: optimizedData };

    try {
      await storageUtils.set(storageData);
      logger.info('StorageService', `Successfully saved data for tab ${tabId}, url ${url}`);
      return optimizedData;
    } catch (error) {
      logger.error('StorageService', `Error saving data for tab ${tabId}, url ${url}`, error);
      
      // If quota exceeded, just keep in memory and warn
      if (error.message && error.message.includes('quota exceeded')) {
        logger.warn('StorageService', 'Storage quota exceeded, keeping data in memory only');
        // Still return the data so popup can display it from memory
        return optimizedData;
      }
      
      // For other errors, still return data
      return optimizedData;
    }
  }

  /**
   * Clear old tab data to free up space
   */
  async clearOldTabData() {
    const cutoffTime = Date.now() - (30 * 60 * 1000); // 30 minutes
    const keysToRemove = [];
    
    // Get all keys from storage
    const allData = await chrome.storage.local.get(null);
    
    for (const key in allData) {
      if (key.startsWith(STORAGE_KEYS.TAB_PREFIX)) {
        const data = allData[key];
        if (data.timestamp && data.timestamp < cutoffTime) {
          keysToRemove.push(key);
        }
      }
    }
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      logger.info('StorageService', `Cleared ${keysToRemove.length} old entries`);
    }
  }

  /**
   * Get data from chrome.storage
   * @param {string} key - The storage key
   * @param {*} defaultValue - Default value if key not found
   * @returns {Promise<*>} - The retrieved data or default value.
   */
  async getFromStorage(key, defaultValue = null) {
    try {
      const result = await storageUtils.get(key); // Use shared utility
      return result?.[key] ?? defaultValue; // Return the value or default
    } catch (error) {
      logger.error('StorageService', `Error getting data for key ${key}`, error);
      return defaultValue; // Return default value on error
    }
  }

  /**
   * Remove tab data
   * @param {number} tabId - The tab ID to remove
   * @returns {Promise<number>} - Number of storage items removed
   */
  async removeTabData(tabId) {
    delete this.seoDataStore[tabId];
    delete this.lastKnownUrls[tabId];
    delete this.lastUpdateTimestamps[tabId];

    // Find and remove all tab-specific storage items using the shared utility
    try {
      const allItems = await storageUtils.get(null); // Get all items
      const keysToRemove = Object.keys(allItems).filter(key =>
        key.startsWith(`${STORAGE_KEYS.TAB_PREFIX}${tabId}_`)
      );

      if (keysToRemove.length > 0) {
        await storageUtils.remove(keysToRemove); // Use shared utility
        logger.info('StorageService', `Removed ${keysToRemove.length} storage items for closed tab ${tabId}`);
        return keysToRemove.length;
      } else {
        return 0;
      }
    } catch (error) {
      logger.error('StorageService', `Error removing storage items for tab ${tabId}`, error);
      return 0; // Return 0 on error
    }
  }

  /**
   * Set the last known URL for a tab
   * @param {number} tabId - The tab ID
   * @param {string} url - The URL
   */
  setLastKnownUrl(tabId, url) {
    this.lastKnownUrls[tabId] = url;
  }

  /**
   * Get the last known URL for a tab
   * @param {number} tabId - The tab ID
   * @returns {string|undefined} - The last known URL
   */
  getLastKnownUrl(tabId) {
    return this.lastKnownUrls[tabId];
  }

  /**
   * Set the update timestamp for a tab
   * @param {number} tabId - The tab ID
   * @param {number} timestamp - The timestamp
   */
  setUpdateTimestamp(tabId, timestamp) {
    this.lastUpdateTimestamps[tabId] = timestamp;
  }

  /**
   * Get the update timestamp for a tab
   * @param {number} tabId - The tab ID
   * @returns {number|undefined} - The timestamp
   */
  getUpdateTimestamp(tabId) {
    return this.lastUpdateTimestamps[tabId];
  }

  /**
   * Clear the update timestamp for a tab
   * @param {number} tabId - The tab ID
   */
  clearUpdateTimestamp(tabId) {
    delete this.lastUpdateTimestamps[tabId];
  }

  /**
   * Clear data for a specific tab and URL
   * @param {number} tabId - The tab ID
   * @param {string} url - The specific URL to clear
   */
  async clearTabData(tabId, url) { // Added async keyword here
    // Remove from memory if it exists
    if (this.seoDataStore[tabId] && this.seoDataStore[tabId][url]) {
      logger.info('StorageService', `Clearing data for tab ${tabId}, url ${url} from memory`);
      delete this.seoDataStore[tabId][url];
    }

    // Reset the last known URL for this tab if it matches the one being cleared
    if (this.lastKnownUrls[tabId] === url) {
      logger.info('StorageService', `Resetting lastKnownUrl for tab ${tabId}`);
      delete this.lastKnownUrls[tabId];
    }

    // Remove from storage using the shared utility
    const storageKey = `${STORAGE_KEYS.TAB_PREFIX}${tabId}_${encodeURIComponent(url)}`;
    try {
      await storageUtils.remove(storageKey);
      logger.info('StorageService', `Successfully removed data from storage for key ${storageKey}`);
    } catch (error) {
      logger.error('StorageService', `Error removing data from storage for key ${storageKey}`, error);
      // Decide if you need to handle this error further
    }
  }
}

// Export as a singleton
export const StorageService = new StorageServiceClass();
