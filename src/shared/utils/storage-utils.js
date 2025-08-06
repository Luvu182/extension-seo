'use strict';

import { logger } from './logger.js';

/**
 * Utility functions for interacting with chrome.storage.local API using Promises.
 */
export const storageUtils = {
  /**
   * Retrieves item(s) from chrome.storage.local.
   * @param {string | string[] | Object | null} keys - A single key, array of keys, or object to retrieve. Null retrieves all items.
   * @returns {Promise<Object>} A promise that resolves with an object containing the requested key-value pairs, or rejects on error.
   */
  get(keys) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return reject(new Error('Chrome storage API is not available.'));
      }
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          logger.error('storageUtils', `Error getting keys: ${JSON.stringify(keys)}`, chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        resolve(result);
      });
    });
  },

  /**
   * Stores item(s) in chrome.storage.local.
   * @param {Object} items - An object containing one or more key-value pairs to store.
   * @returns {Promise<void>} A promise that resolves when the items are set, or rejects on error.
   */
  set(items) {
    return new Promise((resolve, reject) => {
       if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return reject(new Error('Chrome storage API is not available.'));
      }
      if (typeof items !== 'object' || items === null) {
        return reject(new Error('Invalid items object provided to storageUtils.set.'));
      }
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          logger.error('storageUtils', `Error setting items: ${Object.keys(items).join(', ')}`, chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  },

  /**
   * Removes item(s) from chrome.storage.local.
   * @param {string | string[]} keys - A single key or array of keys to remove.
   * @returns {Promise<void>} A promise that resolves when the items are removed, or rejects on error.
   */
  remove(keys) {
    return new Promise((resolve, reject) => {
       if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return reject(new Error('Chrome storage API is not available.'));
      }
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          logger.error('storageUtils', `Error removing keys: ${JSON.stringify(keys)}`, chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  },

  /**
   * Clears all items from chrome.storage.local.
   * Use with caution!
   * @returns {Promise<void>} A promise that resolves when storage is cleared, or rejects on error.
   */
  clear() {
     return new Promise((resolve, reject) => {
       if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return reject(new Error('Chrome storage API is not available.'));
      }
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          logger.error('storageUtils', 'Error clearing storage', chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        logger.info('storageUtils', 'Chrome local storage cleared.');
        resolve();
      });
    });
  }
};
