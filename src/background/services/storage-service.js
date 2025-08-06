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
      this.seoDataStore[tabId] = {};
    }

    if (url && !this.seoDataStore[tabId][url]) {
      this.seoDataStore[tabId][url] = {};
    }

    return url ? this.seoDataStore[tabId][url] : this.seoDataStore[tabId];
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

    this.seoDataStore[tabId][url] = data;

    // Also save to chrome.storage with URL-specific key
    const storageKey = `${STORAGE_KEYS.TAB_PREFIX}${tabId}_${encodeURIComponent(url)}`;
    const storageData = { [storageKey]: data }; // Use computed property name

    try {
      await storageUtils.set(storageData); // Use shared utility
      logger.info('StorageService', `Successfully saved data for tab ${tabId}, url ${url}`);
      return data; // Return the original data on success
    } catch (error) {
      logger.error('StorageService', `Error saving data for tab ${tabId}, url ${url}`, error);
      throw error; // Re-throw the error for the caller to handle
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
