# URL Change Bug Fix

## Problem Description

When clicking links or navigating to a different URL, the extension data would not automatically update to reflect the new page's content. This caused users to see stale data from the previous page, requiring manual refreshes.

Additionally, there was a potential conflict with the redirect chain feature, as aggressive data clearing could lose important redirect information (301/302 redirects) during navigation.

## Root Causes Identified

1. **Insufficient URL Change Detection:** The SPA detector was not reliably detecting URL changes, especially when the processing flag was already set.
2. **Overly Conservative Data Clearing:** The navigation controller was too conservative in clearing data to protect redirect chains.
3. **Lack of Auto-Refresh on URL Changes:** When URL changes were detected, the extension would show a message but not automatically refresh.
4. **Race Conditions in Background Script:** Timing issues between URL change detection and data storage.

## Solution Implemented

### 1. Improved SPA Detection for URL Changes

Modified `spa-detector.js` to always process URL changes, regardless of the current processing state:

```javascript
// Before
if (!this.isProcessingNavigation && currentUrl !== this.lastProcessedUrl) {
  this.handleSpaNavigation(SPA_SOURCES.URL_WATCHER);
}

// After
if (currentUrl !== this.lastProcessedUrl) {
  // Always process URL changes, using forceProcess=true parameter
  this.handleSpaNavigation(SPA_SOURCES.URL_WATCHER, true);
}
```

Added a new parameter to the `handleSpaNavigation` method to support forcing processing:

```javascript
handleSpaNavigation(source, forceProcess = false) {
  // Implementation that respects forceProcess parameter
}
```

### 2. Enhanced Navigation Controller

Modified the `navigation-controller.js` file to better handle URL changes while preserving redirect data:

```javascript
// Check if this is a new URL (real navigation)
if (lastKnownUrl && lastKnownUrl !== newUrl) {
  // Save redirect chain but mark previous data as stale for refresh
  const redirectChain = WebRequestController.getRedirectChain(tabId);
  if (redirectChain && redirectChain.length > 0) {
    // Preserve the redirect chain
  } else {
    // Only clear the redirect chain if we don't have any redirects yet
    WebRequestController.clearRedirectChain(tabId);
  }
}
```

### 3. Added Smarter Redirect Chain Management

Added a new helper method to `web-request-controller.js` to intelligently determine when to preserve redirect chains:

```javascript
shouldPreserveRedirectChain(tabId, oldUrl, newUrl) {
  // Check if the new URL is part of the redirect chain
  const isPartOfRedirectChain = redirectChain.some(hop => 
    hop.toUrl === newUrl || hop.fromUrl === newUrl
  );
  
  // Check for recency - only preserve if the chain is recent
  const isRecent = timeSinceLastRedirect < 10000; // 10 seconds
  
  return isPartOfRedirectChain || isRecent;
}
```

### 4. Automatic Refresh on URL Changes

Modified `data-fetching-service.js` to automatically refresh data when URL changes are detected:

```javascript
if (receivedData.urlChanged && receivedData.needsRefresh) {
  // Set loading state
  store.setStateSlice('isLoading', true);
  
  // Initiate content extraction immediately
  setTimeout(() => {
    this.refreshData();
  }, 100);
  
  // Return early since we're triggering a refresh
  return;
}
```

Added improved URL change detection in the App component:

```javascript
// Check for URL changes that require refresh
if (newPageData && newPageData.urlChanged && newPageData.needsRefresh) {
  console.log('[App Component] URL change detected, triggering auto-refresh');
  
  // Skip other state updates and go straight to refresh
  setIsLoading(true); 
  
  // Delay slightly to allow UI to update
  setTimeout(() => {
    dataFetchingService.refreshData();
  }, 100);
}
```

### 5. Enhanced Chrome Storage Handling

Improved the store.js file to better detect URL changes from storage:

```javascript
// Check if the data contains urlChanged flag, which indicates a navigation
if (newValue && (newValue.urlChanged || newValue.isSpaNavigation)) {
  // If the new data indicates the URL changed, update our state to show it
  if (JSON.stringify(newValue) !== JSON.stringify(_state.pageData)) {
    const oldState = { ..._state };
    _state.pageData = newValue;
    _subscribers.forEach(callback => callback(_state, oldState));
  }
}
```

## Testing

The fix was tested with these scenarios:

1. **Clicking internal links** within pages
2. **Clicking external links** to different domains
3. **Page reload** scenarios
4. **301/302 redirect chains** to ensure they're properly preserved
5. **SPA navigation** events (especially in React, Vue and Angular sites)

## Conclusion

This comprehensive fix addresses the root causes of the URL change detection bug while preserving the important redirect chain functionality. Users should now see data automatically refresh when navigating to new pages without manual intervention, greatly improving the user experience.
