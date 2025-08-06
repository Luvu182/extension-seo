'use strict';

// Import dependencies
import { store } from '../store.js';
import { dataService } from '../data-service.js';

/**
 * Service for data fetching operations
 * Handles communication with background script and content script
 */
export const dataFetchingService = {
  /**
   * Requests the latest Web Vitals data from the background script
   * Updates the store with the result
   */
  requestLatestWebVitals() {
    console.log('[dataFetchingService] Requesting latest web vitals data');
    
    chrome.runtime.sendMessage({
      action: 'getLatestWebVitals',
      timestamp: Date.now()
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[dataFetchingService] Error requesting web vitals:', chrome.runtime.lastError);
        return;
      }

      if (response && response.success && response.webVitals) {
        console.log('[dataFetchingService] Received latest web vitals:', response.webVitals);

        // Update the store with the latest web vitals
        const currentData = store.getStateSlice('pageData') || {};
        const updatedData = {...currentData};

        // Make sure webVitals property exists
        if (!updatedData.webVitals) {
          updatedData.webVitals = {};
        }

        // Update with latest data
        updatedData.webVitals = {
          ...updatedData.webVitals,
          ...response.webVitals,
          lastUpdated: response.timestamp || Date.now()
        };

        // Preserve SPA detection flags if they exist
        if (currentData.isSpaDetected || currentData.isSpaNavigation) {
          console.log('[dataFetchingService] Preserving SPA detection flags during web vitals request');
          updatedData.isSpaDetected = currentData.isSpaDetected;
          updatedData.isSpaNavigation = currentData.isSpaNavigation;
        }

        // Update the store
        store.setStateSlice('pageData', updatedData);
      }
    });
  },

  /**
   * Refreshes SEO data from the content script
   * Reloads data from background if content script fails
   */
  refreshData() {
    console.log("[dataFetchingService] refreshData called");
    
    // Set loading state in store
    store.setStateSlice('isLoading', true);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        const tabId = tabs[0].id;

        // Timeout promise for race condition
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ timeoutError: true }), 10000)
        );

        // First try the standard extraction method
        const messagePromise = new Promise((resolve) => {
          chrome.tabs.sendMessage(tabId, { action: "extractSEOData" }, function(response) {
            // If content script doesn't exist or fails, lastError will be set
            resolve(chrome.runtime.lastError ? { error: chrome.runtime.lastError } : { response });
          });
        });

        // Inject content script if needed and retry
        const injectAndRetryPromise = messagePromise.then(result => {
          if (result.error || result.timeoutError) {
            console.log("[dataFetchingService] Initial extraction failed, trying content script injection");

            return new Promise((resolve) => {
              // Try to inject the content script if it's not already there
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['js/content.js']
              }, () => {
                // After injection, try to send message again
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabId, {
                    action: "extractSEOData",
                    forceRefresh: true // Signal that this is a forced refresh
                  }, function(response) {
                    resolve(chrome.runtime.lastError ? { error: chrome.runtime.lastError } : { response });
                  });
                }, 300); // Short delay to allow script initialization
              });
            });
          }
          return result;
        });

        // Race against timeout
        Promise.race([injectAndRetryPromise, timeoutPromise])
          .then(result => {
            if (result.timeoutError) {
              console.error("[dataFetchingService] Timeout getting data from content script");
              this.loadDataFromBackgroundOrFallback(true);
              return;
            }

            if (result.error) {
              console.error("[dataFetchingService] Error getting data from content script:", result.error);
              this.loadDataFromBackgroundOrFallback(true);
              return;
            }

            console.log("[dataFetchingService] Content script responded. Fetching from background.");
            // Wait for background to process the update from content script
            setTimeout(() => {
              this.loadDataFromBackgroundOrFallback(false);
            }, 300);
          })
          .catch(error => {
            console.error("[dataFetchingService] Unexpected error:", error);
            this.loadDataFromBackgroundOrFallback(true);
          });
      } else {
        console.error("[dataFetchingService] No active tab found");
        // Update store with error state
        store.setStateSlice('pageData', { error: "No active tab found" });
        store.setStateSlice('isLoading', false);
      }
    }.bind(this)); // Bind 'this' to ensure method access in callback
  },

  /**
   * Loads SEO data from the background script
   * @param {boolean} forceError - Whether to force an error state
   */
  loadDataFromBackgroundOrFallback(forceError = false) {
    console.log("[dataFetchingService] Requesting data from background...");
    
    // First, get the current URL from the active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs || !tabs.length || !tabs[0].url) {
        console.warn("[dataFetchingService] No active tab or URL found");
        // Set fallback error state
        store.setStateSlice('pageData', { error: "No active tab found" });
        store.setStateSlice('isLoading', false);
        return;
      }
      
      const currentTabUrl = tabs[0].url;
      console.log("[dataFetchingService] Current tab URL:", currentTabUrl);
      
      // Now request SEO data with URL information included
      chrome.runtime.sendMessage({ 
        action: "getSEOData",
        currentUrl: currentTabUrl,
        timestamp: Date.now()
      }, function(backgroundResponse) {
        let finalData = null;
        let hasError = forceError;
        let errorMessage = "Failed to load data."; // Default error
        let isSpaDetected = false; // Flag to track SPA detection

        // Handle failed communication first (no response from background)
        if (!backgroundResponse) {
          console.warn("[dataFetchingService] Background communication failed - no response");
          hasError = true;
          errorMessage = "Background communication failed.";
          finalData = { error: errorMessage };
        }
        // If background responded with an error
        else if (!backgroundResponse.success) {
          console.warn("[dataFetchingService] Background returned error:", backgroundResponse.error);
          hasError = true;
          errorMessage = backgroundResponse.error || "Background returned error";
          finalData = { error: errorMessage };
        }
        // Background responded successfully
        else if (backgroundResponse.success) {
          const receivedData = backgroundResponse.data;
          
          // Handle null or empty data
          if (!receivedData) {
            console.log("[dataFetchingService] Background returned null data");
            finalData = {
              error: "Page content has changed. Please refresh the data.",
              isSpaDetected: true
            };
            isSpaDetected = true;
            hasError = true;
          }
          // Handle URL change that needs refreshing
          else if (receivedData.urlChanged && receivedData.needsRefresh) {
            console.log(`[dataFetchingService] URL changed from ${receivedData.oldUrl} to ${receivedData.newUrl}`);
            console.log("[dataFetchingService] Auto-refreshing due to URL change");
            
            // Set loading state
            store.setStateSlice('isLoading', true);
            
            // Initiate content extraction immediately - using bind to ensure 'this' context
            setTimeout(() => {
              this.refreshData();
            }, 100);
            
            // Return early since we're triggering a refresh
            return;
          }
          // Handle partial/loading SPA data
          else if (receivedData.partialData || receivedData.isLoading || receivedData.isLoadingSpa) {
            console.log("[dataFetchingService] Received partial/loading SPA data");
            isSpaDetected = true;
            
            if (receivedData.url) {
              finalData = receivedData; // Use as-is without enhancement
              finalData.isSpaDetected = true;
              finalData.partialData = true;
              console.log("[dataFetchingService] Using partial SPA data for display");
              hasError = false;
            } else {
              finalData = {
                isSpaDetected: true,
                error: "Loading data for new page...",
                freshSpaNavigation: true
              };
              hasError = true;
            }
            console.log("[dataFetchingService] Partial SPA data received, waiting for user action");
          }
          // Handle extraction failure
          else if (receivedData.extractionFailed) {
            console.log("[dataFetchingService] Data extraction failed");
            hasError = true;
            errorMessage = receivedData.error || "Failed to extract data from page";
            finalData = receivedData;
            finalData.isSpaDetected = true;
          }
          // Handle network error status code
          else if (receivedData.statusCode === 0) {
            console.log("[dataFetchingService] Background reported network error (statusCode 0)");
            hasError = true;
            errorMessage = "Network error fetching page data.";
            finalData = receivedData;
          }
          // Handle SPA navigation flags
          else if (receivedData.isSpaNavigation || receivedData.isSpaDetected) {
            console.log("[dataFetchingService] Data contains SPA navigation flag");
            isSpaDetected = true;
            finalData = dataService.enhanceDataWithAnalytics(receivedData);
            finalData.isSpaDetected = true;
            console.log("[dataFetchingService] Processing SPA data normally, with SPA flag");
            hasError = false;
          }
          // Handle normal valid data
          else {
            const hasSubstantialData = receivedData.url && (
              receivedData.title ||
              receivedData.description ||
              (receivedData.headings && Object.keys(receivedData.headings).length > 0)
            );

            if (hasSubstantialData) {
              console.log("[dataFetchingService] Received valid SEO data from background");
              finalData = dataService.enhanceDataWithAnalytics(receivedData);
              hasError = false;
            } else {
              console.log("[dataFetchingService] Received empty or incomplete data");
              finalData = {
                error: "No SEO data available. Page might still be loading.",
                isSpaDetected: true
              };
              isSpaDetected = true;
              hasError = true;
            }
          }
        }

        // Update Store with final data
        if (!hasError) {
          console.log("[dataFetchingService] Updating store with valid data" + (isSpaDetected ? " (SPA detected)" : ""));
          store.setStateSlice('pageData', finalData);
        } else {
          console.log("[dataFetchingService] Updating store with error: " + (finalData?.error || errorMessage));
          if (!finalData) finalData = {};
          if (!finalData.error) finalData.error = errorMessage;
          if (isSpaDetected) {
            finalData.isSpaDetected = true;
          }
          store.setStateSlice('pageData', finalData);
        }
        
        // Always set loading to false after updating pageData
        store.setStateSlice('isLoading', false);

        // Save to localStorage if valid data
        if (!hasError && finalData && !finalData.error) {
          console.log("[dataFetchingService] Saving valid data to localStorage");
          try {
            localStorage.setItem('seoAiAssistantData', JSON.stringify(finalData));
            localStorage.setItem('seoAiAssistantTimestamp', Date.now().toString());
          } catch (e) {
            console.warn("Could not save data to localStorage:", e);
          }
        }

        console.log("[dataFetchingService] AUTO-REFRESH DISABLED - using existing data only");
      }.bind(this)); // Bind 'this' to ensure method access in callback
    });
  }
};
