'use strict';

// Store module for centralized state management

// Private store state
let _state = {
  pageData: null,
    activeTab: 'overview',
    isLoading: true,
    // Lưu trữ dữ liệu theo URL
    urlData: {},
    settings: {
      // User settings
      customWeights: {
        contentQuality: 0.35,
        technicalSEO: 0.25,
        onPageSEO: 0.25,
        userExperience: 0.15
      },
      // Other settings
    }
  };

  // Subscribers
  const _subscribers = [];

  // Get state (return a copy to prevent direct mutation)
  function getState() {
    return JSON.parse(JSON.stringify(_state));
  }

  // Get a specific slice of state
  function getStateSlice(sliceName) {
    if (_state[sliceName] === undefined) {
      console.warn(`State slice "${sliceName}" does not exist`);
      return null;
    }
    return JSON.parse(JSON.stringify(_state[sliceName]));
  }

  // Update state
  function setState(newState) {
    const oldState = { ..._state };
    _state = { ..._state, ...newState };

    // Notify subscribers
    _subscribers.forEach(callback => callback(_state, oldState));

    // Optionally persist to localStorage
    persistState();

    return _state;
  }

  // Update a specific slice of state
  function setStateSlice(sliceName, sliceValue) {
    if (_state[sliceName] === undefined) {
      console.warn(`State slice "${sliceName}" does not exist`);
      return _state;
    }

    const newState = { ..._state };
    newState[sliceName] = sliceValue;
    return setState(newState);
  }

  // Subscribe to state changes
  function subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('Store.subscribe requires a function');
      return;
    }
    _subscribers.push(callback);

    // Return unsubscribe function
    return function unsubscribe() {
      const index = _subscribers.indexOf(callback);
      if (index !== -1) _subscribers.splice(index, 1);
    };
  }

  // Persist state to localStorage
  function persistState() {
    try {
      localStorage.setItem('seoAiAssistantState', JSON.stringify(_state));
    } catch (e) {
      console.warn('Could not save state to localStorage:', e);
    }
  }

  // Load state from localStorage
  function loadPersistedState() {
    try {
      const savedState = localStorage.getItem('seoAiAssistantState');
      if (savedState) {
        _state = { ..._state, ...JSON.parse(savedState) };
      }
    } catch (e) {
      console.warn('Could not load state from localStorage:', e);
    }
  }

  // Initialize store
  function init() {
    console.log('[store.js] Initializing store...');
    // Load initial state from storage
    loadFromStorage().then(loaded => {
      console.log('[store.js] Store initialized with state:', _state);
      console.log('[store.js] Loaded from storage:', loaded);

      // Add listener for external storage changes AFTER initial load
      if (chrome && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(handleStorageChange);
        console.log('[store.js] Added chrome.storage.onChanged listener.');
      } else {
        console.warn('[store.js] chrome.storage.onChanged not available.');
      }
    });
  }

  // Handler for chrome.storage changes
  function handleStorageChange(changes, areaName) {
    if (areaName !== 'local') return; // Only listen to local storage changes

    console.log('[store.js] handleStorageChange triggered:', changes);

    // Find changes related to tab data (keys like "tab_123")
    const changedTabKeys = Object.keys(changes).filter(key => key.startsWith('tab_'));

    if (changedTabKeys.length === 0) {
      // console.log('[store.js] No relevant tab data changed.');
      return; // No relevant changes
    }

    // Get the current active tab to see if the change affects it
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        console.warn('[store.js handleStorageChange] Could not get active tab ID.');
        return;
      }
      const activeTabId = tabs[0].id;
      
      // Get the current URL of the active tab to match with stored data
      const currentTabUrl = tabs[0].url;
      
      if (!currentTabUrl) {
        console.warn('[store.js handleStorageChange] Active tab has no URL.');
        return;
      }
      
      // Construct possible storage keys for this tab (with current URL)
      const encodedCurrentUrl = encodeURIComponent(currentTabUrl);
      const activeTabCurrentUrlKey = `tab_${activeTabId}_${encodedCurrentUrl}`;
      
      // First check for exact match with current URL
      if (changes[activeTabCurrentUrlKey]) {
        const change = changes[activeTabCurrentUrlKey];
        const newValue = change.newValue; // The entire updated data object for the tab
        
        if (!newValue) {
          console.log(`[store.js] Data for active tab's current URL was removed from storage.`);
          return;
        }
        
        console.log(`[store.js] Active tab's current URL data changed. Updating store.`);
        // Update store with current URL's data
        const oldState = { ..._state };
        _state.pageData = newValue;
        _subscribers.forEach(callback => callback(_state, oldState));
        // --- MODIFICATION START: Always update if newValue differs from current state ---
        // Compare the stringified versions to detect any change, including nested ones like image fileSize
        if (JSON.stringify(newValue) !== JSON.stringify(_state.pageData)) {
            console.log(`[store.js] Active tab's current URL data changed (detected difference). Updating store.`);
            const oldState = { ..._state };
            _state.pageData = newValue; // Update with the fresh data from storage
            _subscribers.forEach(callback => callback(_state, oldState)); // Notify subscribers
        } else {
            // console.log(`[store.js] Active tab's current URL data changed, but identical to current state. No update needed.`);
        }
        // --- MODIFICATION END ---
        return; // Exit after handling the exact match
      }
      
      // --- MODIFICATION START: Handle changes for the active tab but potentially different (stale) URL key ---
      // This part might be less relevant now if the background always updates the correct key,
      // but we keep it for robustness, ensuring SPA flags are still handled if needed.
      const changedKeysForActiveTab = changedTabKeys.filter(key => key.startsWith(`tab_${activeTabId}_`));
      
      if (changedKeysForActiveTab.length > 0) {
        console.log(`[store.js] Found ${changedKeysForActiveTab.length} changes for active tab ID, but not matching current URL key: ${activeTabCurrentUrlKey}`);
        
        // Check if any of these changes represent an SPA navigation state we need to display
        changedKeysForActiveTab.forEach(key => {
          const change = changes[key];
          const newValue = change.newValue;
          
          // Only update if it's an SPA navigation state AND different from current state
          if (newValue && (newValue.isSpaDetected || newValue.isSpaNavigation)) {
             if (JSON.stringify(newValue) !== JSON.stringify(_state.pageData)) {
                console.log(`[store.js] Updating state with SPA navigation data from key ${key}`);
                const oldState = { ..._state };
                _state.pageData = newValue;
                _subscribers.forEach(callback => callback(_state, oldState));
             }
          }
        });
      }
      // --- MODIFICATION END ---
    });
  }

  // Lưu trữ dữ liệu theo URL
  function saveUrlData(url, key, data) {
    if (!url) return;

    // Khởi tạo object cho URL nếu chưa có
    if (!_state.urlData[url]) {
      _state.urlData[url] = {};
    }

    // Lưu dữ liệu
    _state.urlData[url][key] = data;

    // Thông báo thay đổi
    const oldState = { ..._state };
    _subscribers.forEach(callback => callback(_state, oldState));

    // Lưu vào chrome.storage
    saveToStorage();

    return data;
  }

  // Lấy dữ liệu theo URL
  function getUrlData(url, key, defaultValue = null) {
    if (!url || !_state.urlData[url]) return defaultValue;
    return _state.urlData[url][key] !== undefined ? _state.urlData[url][key] : defaultValue;
  }

  // Lưu trữ vào chrome.storage
  function saveToStorage() {
    try {
      // Lưu vào localStorage cho trường hợp chrome.storage không khả dụng
      localStorage.setItem('seoAiAssistantState', JSON.stringify(_state));

      // Lưu vào chrome.storage nếu có thể
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'seoAiAssistantState': _state });
      }
    } catch (e) {
      console.warn('Could not save state to storage:', e);
    }
  }

  // Lấy dữ liệu từ chrome.storage
  function loadFromStorage() {
    return new Promise((resolve) => {
      try {
        // Thử lấy từ chrome.storage trước
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get('seoAiAssistantState', (result) => {
            if (result && result.seoAiAssistantState) {
              _state = { ..._state, ...result.seoAiAssistantState };
              resolve(true);
            } else {
              // Nếu không có trong chrome.storage, thử lấy từ localStorage
              const savedState = localStorage.getItem('seoAiAssistantState');
              if (savedState) {
                _state = { ..._state, ...JSON.parse(savedState) };
                resolve(true);
              } else {
                resolve(false);
              }
            }
          });
        } else {
          // Nếu không có chrome.storage, thử lấy từ localStorage
          const savedState = localStorage.getItem('seoAiAssistantState');
          if (savedState) {
            _state = { ..._state, ...JSON.parse(savedState) };
            resolve(true);
          } else {
            resolve(false);
          }
        }
      } catch (e) {
        console.warn('Could not load state from storage:', e);
        resolve(false);
      }
    });
  }

  // Xóa dữ liệu của một URL
  function clearUrlData(url) {
    if (!url || !_state.urlData[url]) return;

    delete _state.urlData[url];

    // Thông báo thay đổi
    const oldState = { ..._state };
    _subscribers.forEach(callback => callback(_state, oldState));

    // Lưu vào chrome.storage
    saveToStorage();
  }

  // Export public API
  // Clean up listener on unload (though popup closing usually handles this)
  // window.addEventListener('unload', () => {
  //   if (chrome && chrome.storage && chrome.storage.onChanged) {
  //     chrome.storage.onChanged.removeListener(handleStorageChange);
  //   }
  // });

  window.seoAIAssistant = window.seoAIAssistant || {};
  window.seoAIAssistant.store = {
    getState,
    getStateSlice,
    setState,
    setStateSlice,
    subscribe,
    init,
    // Thêm các phương thức mới
    saveUrlData,
    getUrlData,
  clearUrlData
};

// Export the public API directly
export const store = {
  getState,
  getStateSlice,
  setState,
  setStateSlice,
  subscribe,
  init,
  saveUrlData,
  getUrlData,
  clearUrlData
};

// Auto-initialize
init();
