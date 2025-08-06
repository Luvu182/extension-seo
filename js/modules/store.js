'use strict';

import { logger } from '../../src/shared/utils/logger.js';

/**
 * Centralized state management store
 * Implements a simple pub-sub pattern with Chrome storage integration
 */

// Private state
let _state = {
  pageData: null,
  activeTab: 'overview',
  isLoading: true,
  urlData: {},
  settings: {
    customWeights: {
      contentQuality: 0.35,
      technicalSEO: 0.25,
      onPageSEO: 0.25,
      userExperience: 0.15
    }
  }
};

// Subscribers array
const _subscribers = new Set();

// Storage change listener reference for cleanup
let _storageListener = null;

/**
 * Deep clone utility - more efficient than JSON for simple objects
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Get current state (returns a deep copy to prevent mutations)
 */
function getState() {
  return deepClone(_state);
}

/**
 * Get a specific slice of state
 */
function getStateSlice(sliceName) {
  if (!_state.hasOwnProperty(sliceName)) {
    logger.warn('Store', `State slice "${sliceName}" does not exist`);
    return null;
  }
  return deepClone(_state[sliceName]);
}

/**
 * Update state and notify subscribers
 */
function setState(updates) {
  const oldState = deepClone(_state);
  _state = { ..._state, ...updates };
  
  // Notify all subscribers
  _subscribers.forEach(callback => {
    try {
      callback(_state, oldState);
    } catch (error) {
      logger.error('Store', 'Subscriber error:', error);
    }
  });
  
  // Persist to storage
  persistState();
  
  return _state;
}

/**
 * Update a specific slice of state
 */
function setStateSlice(sliceName, value) {
  if (!_state.hasOwnProperty(sliceName)) {
    logger.warn('Store', `State slice "${sliceName}" does not exist`);
    return _state;
  }
  
  return setState({ [sliceName]: value });
}

/**
 * Subscribe to state changes
 */
function subscribe(callback) {
  if (typeof callback !== 'function') {
    logger.error('Store', 'Subscribe requires a function');
    return () => {}; // Return no-op unsubscribe
  }
  
  _subscribers.add(callback);
  
  // Return unsubscribe function
  return () => {
    _subscribers.delete(callback);
  };
}

/**
 * Save URL-specific data
 */
function saveUrlData(url, key, data) {
  if (!url) return null;
  
  const urlData = { ..._state.urlData };
  if (!urlData[url]) {
    urlData[url] = {};
  }
  
  urlData[url][key] = data;
  setState({ urlData });
  
  return data;
}

/**
 * Get URL-specific data
 */
function getUrlData(url, key, defaultValue = null) {
  if (!url || !_state.urlData[url]) return defaultValue;
  return _state.urlData[url][key] ?? defaultValue;
}

/**
 * Clear data for a specific URL
 */
function clearUrlData(url) {
  if (!url || !_state.urlData[url]) return;
  
  const urlData = { ..._state.urlData };
  delete urlData[url];
  setState({ urlData });
}

/**
 * Persist state to storage
 */
async function persistState() {
  try {
    // Save to localStorage as fallback
    localStorage.setItem('seoAiAssistantState', JSON.stringify(_state));
    
    // Save to Chrome storage if available
    if (chrome?.storage?.local) {
      await chrome.storage.local.set({ seoAiAssistantState: _state });
    }
  } catch (error) {
    logger.error('Store', 'Failed to persist state:', error);
  }
}

/**
 * Load state from storage
 */
async function loadFromStorage() {
  try {
    // Try Chrome storage first
    if (chrome?.storage?.local) {
      const result = await chrome.storage.local.get('seoAiAssistantState');
      if (result?.seoAiAssistantState) {
        _state = { ..._state, ...result.seoAiAssistantState };
        return true;
      }
    }
    
    // Fallback to localStorage
    const savedState = localStorage.getItem('seoAiAssistantState');
    if (savedState) {
      _state = { ..._state, ...JSON.parse(savedState) };
      return true;
    }
  } catch (error) {
    logger.error('Store', 'Failed to load state:', error);
  }
  
  return false;
}

/**
 * Handle Chrome storage changes
 */
function handleStorageChange(changes, areaName) {
  if (areaName !== 'local') return;
  
  // Find tab data changes
  const tabChanges = Object.keys(changes).filter(key => key.startsWith('tab_'));
  if (tabChanges.length === 0) return;
  
  // Get active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.[0]?.id || !tabs[0].url) return;
    
    const activeTabId = tabs[0].id;
    const currentUrl = tabs[0].url;
    const storageKey = `tab_${activeTabId}_${encodeURIComponent(currentUrl)}`;
    
    // Check if active tab data changed
    if (changes[storageKey]?.newValue) {
      const newData = changes[storageKey].newValue;
      
      // Only update if data actually changed
      if (JSON.stringify(newData) !== JSON.stringify(_state.pageData)) {
        logger.info('Store', 'Updating pageData from storage change');
        setState({ pageData: newData });
      }
    }
  });
}

/**
 * Initialize the store
 */
async function init() {
  logger.info('Store', 'Initializing...');
  
  // Load saved state
  const loaded = await loadFromStorage();
  logger.info('Store', 'Loaded from storage:', loaded);
  
  // Set up storage listener
  if (chrome?.storage?.onChanged) {
    _storageListener = handleStorageChange;
    chrome.storage.onChanged.addListener(_storageListener);
    logger.info('Store', 'Storage listener added');
  }
}

/**
 * Clean up resources
 */
function cleanup() {
  // Remove storage listener
  if (_storageListener && chrome?.storage?.onChanged) {
    chrome.storage.onChanged.removeListener(_storageListener);
    _storageListener = null;
  }
  
  // Clear subscribers
  _subscribers.clear();
}

// Public API
export const store = {
  getState,
  getStateSlice,
  setState,
  setStateSlice,
  subscribe,
  saveUrlData,
  getUrlData,
  clearUrlData,
  init,
  cleanup
};

// Auto-initialize
init().catch(error => {
  logger.error('Store', 'Failed to initialize:', error);
});

// Clean up on page unload
window.addEventListener('unload', cleanup);