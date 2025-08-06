'use strict';

import { SPA_DETECTION, SPA_SOURCES } from '../../shared/constants.js';
import { logger } from '../../shared/utils/logger.js';
import { messaging } from '../../shared/utils/messaging.js';
import { DomUtils } from '../utils/dom-utils.js';

/**
 * SPA detector service for detecting Single Page Application navigation
 */
export class SpaDetector {
  // State variables
  navigationTimeoutId = null;
  lastProcessedUrl = '';
  domUpdateCount = 0;
  isProcessingNavigation = false;
  previousDOMSnapshot = null;
  forceRefreshIntervalId = null;
  lastNavigationTime = 0;
  navigationsInProgress = new Set();
  mutationObserver = null;

  /**
   * Initialize the SPA detector
   */
  initialize() {
    logger.info('SpaDetector', 'Initializing...');

    // Store initial URL before taking snapshot
    this.lastProcessedUrl = window.location.href;
    this.lastNavigationTime = Date.now();

    // Take initial DOM snapshot
    this.previousDOMSnapshot = DomUtils.getDOMSnapshot();
    logger.info('SpaDetector', 'Initial DOM snapshot taken');

    // Override History API
    this.overrideHistoryAPI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start URL watcher as fallback detection
    this.startUrlWatcher();

    // Set up mutation observer for better content change detection
    this.setupMutationObserver();

    logger.info('SpaDetector', 'Initialized successfully');
  }

  /**
   * Set up event listeners for SPA detection
   */
  setupEventListeners() {
    // Navigation events
    window.addEventListener('popstate', () => this.handleSpaNavigation(SPA_SOURCES.POPSTATE));
    window.addEventListener('hashchange', () => this.handleSpaNavigation(SPA_SOURCES.HASHCHANGE)); // Keep hashchange for now, might be needed for some SPAs
    window.addEventListener('pushstate', () => this.handleSpaNavigation(SPA_SOURCES.PUSHSTATE));
    window.addEventListener('replacestate', () => this.handleSpaNavigation(SPA_SOURCES.REPLACESTATE));
    
    // Visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        logger.info('SpaDetector', 'Tab became visible, checking for changes');
        
        // Check if the page changed while we were away using the *new* stricter logic
        const currentSnapshot = DomUtils.getDOMSnapshot();
        const currentUrl = window.location.href;
        
        // Use the stricter check here as well
        if (this.hasUrlOrMetaChanged(this.previousDOMSnapshot, currentSnapshot)) {
          logger.info('SpaDetector', 'Detected significant changes (URL/Title/Meta) after tab became visible');
          this.handleSpaNavigation(SPA_SOURCES.VISIBILITY, true); // Force process on visibility change if significant
        } else if (currentUrl !== this.lastProcessedUrl) {
           // Handle case where only URL changed but not title/meta (less likely but possible)
           logger.info('SpaDetector', 'Detected URL change only after tab became visible');
           this.handleSpaNavigation(SPA_SOURCES.VISIBILITY, true); 
        }
      }
    });
    
    logger.info('SpaDetector', 'Event listeners attached');
  }

  /**
   * Override history API to detect pushState and replaceState
   */
  overrideHistoryAPI() {
    try {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function() {
        const result = originalPushState.apply(history, arguments);
        try {
          const currentUrl = window.location.href;
          logger.info('SpaDetector', `pushState detected, URL: ${currentUrl}`);
          window.dispatchEvent(new Event('pushstate'));
        } catch (e) { logger.error('SpaDetector', 'Error in pushState override', e); }
        return result;
      };
      
      history.replaceState = function() {
        const result = originalReplaceState.apply(history, arguments);
        try {
          const currentUrl = window.location.href;
          logger.info('SpaDetector', `replaceState detected, URL: ${currentUrl}`);
          window.dispatchEvent(new Event('replacestate'));
        } catch (e) { logger.error('SpaDetector', 'Error in replaceState override', e); }
        return result;
      };
      
      logger.info('SpaDetector', 'Successfully overrode history API methods');
    } catch (e) { logger.error('SpaDetector', 'Failed to override history API methods', e); }
  }

  /**
   * Simplified check focusing only on URL (path/search), Title, and Meta Description.
   * Ignores hash changes.
   * @param {Object} prev - Previous DOM snapshot
   * @param {Object} current - Current DOM snapshot
   * @returns {boolean} Whether a significant change (URL, Title, Meta) occurred.
   */
  hasUrlOrMetaChanged(prev, current) {
    if (!prev || !current) return true; // Assume change if snapshots are missing

    const reasons = [];
    let changed = false;

    // Check URL path change
    if (prev.path !== current.path) {
      reasons.push("URL path");
      changed = true;
    }

    // Check URL search params change
    if (prev.search !== current.search) {
      reasons.push("URL search");
      changed = true;
    }

    // Check title change
    if (prev.title !== current.title) {
      reasons.push("Page title");
      changed = true;
    }

    // Check meta description change
    if (prev.meta !== current.meta) {
      reasons.push("Meta description");
      changed = true;
    }

    if (changed) {
        logger.info('SpaDetector', `Significant change detected: ${reasons.join(', ')} changed.`);
    }

    // No need to log here anymore, handleSpaNavigation will log if processing
    // if (changed) {
    //     logger.info('SpaDetector', `Significant change detected: ${reasons.join(', ')} changed.`);
    // }

    return changed;
  }


  /**
   * Set up a mutation observer to detect DOM changes (but rely on hasUrlOrMetaChanged for significance)
   */
  setupMutationObserver() {
    try {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }

      this.mutationObserver = new MutationObserver((mutations) => {
         // We still observe mutations, but the decision to trigger reload
         // will primarily depend on hasUrlOrMetaChanged called within handleSpaNavigation.
         // We might still use mutation detection for *potential* changes, prompting a check.

         // Check if any mutation seems potentially significant (e.g., title/meta change)
         const potentiallySignificant = mutations.some(mutation => 
             mutation.target.nodeName === 'TITLE' || 
             (mutation.target.nodeName === 'META' && mutation.target.getAttribute('name') === 'description') ||
             mutation.addedNodes.length > 0 || // Consider added nodes as potential trigger
             mutation.removedNodes.length > 0 
         );

         // Only trigger a check if the mutation seems like it *could* affect URL, Title, or Meta
         const checkNeeded = mutations.some(mutation => 
             mutation.target.nodeName === 'TITLE' || 
             (mutation.target.nodeName === 'META' && mutation.target.getAttribute('name') === 'description')
             // We don't need to trigger on general node additions/removals anymore
         );


         if (checkNeeded) {
             logger.info('SpaDetector', 'Potentially relevant DOM mutations detected (Title/Meta), triggering check.');
             // Trigger handleSpaNavigation, which will then use hasUrlOrMetaChanged
             // Don't force processing, let the check decide
             this.handleSpaNavigation(SPA_SOURCES.MUTATION, false); 
         }
      });

      const targetNode = document.body || document.documentElement;
      if (targetNode) {
          this.mutationObserver.observe(targetNode, {
              childList: true,
              subtree: true,
              attributes: true, // Still observe attributes for meta changes
              attributeFilter: ['name', 'content'], // Focus on attributes relevant to meta
              characterData: true, // Needed for title changes
              characterDataOldValue: false 
          });
          logger.info('SpaDetector', 'Mutation observer attached (focused on title/meta)');
      } else {
          window.addEventListener('DOMContentLoaded', () => {
              this.mutationObserver.observe(document.body || document.documentElement, {
                  childList: true, subtree: true, attributes: true, attributeFilter: ['name', 'content'], characterData: true 
              });
              logger.info('SpaDetector', 'Mutation observer attached after DOMContentLoaded (focused on title/meta)');
          });
      }

    } catch (e) {
      logger.error('SpaDetector', 'Error setting up mutation observer', e);
    }
  }

  /**
   * Start a URL watcher as a fallback for SPA detection
   */
  startUrlWatcher() {
    if (this.forceRefreshIntervalId) {
      clearInterval(this.forceRefreshIntervalId);
    }
    
    let lastCheckedUrl = window.location.href;
    // Extract URL without hash for comparison
    const urlWithoutHash = (url) => url.split('#')[0];
    let lastCheckedUrlWithoutHash = urlWithoutHash(lastCheckedUrl);

    logger.info('SpaDetector', `Starting URL watcher with initial URL: ${lastCheckedUrl}`);
    
    this.forceRefreshIntervalId = setInterval(() => {
      const currentUrl = window.location.href;
      const currentUrlWithoutHash = urlWithoutHash(currentUrl);
      
      // Check if URL (excluding hash) has changed
      if (currentUrlWithoutHash !== lastCheckedUrlWithoutHash) {
        logger.info('SpaDetector', `URL watcher detected change (ignoring hash): ${lastCheckedUrlWithoutHash} → ${currentUrlWithoutHash}`);
        lastCheckedUrl = currentUrl; // Update full URL for logging/state
        lastCheckedUrlWithoutHash = currentUrlWithoutHash; // Update hashless URL for comparison
        
        // Always trigger processing for URL changes (excluding hash)
        logger.info('SpaDetector', `URL watcher triggering SPA navigation - URL CHANGED (hash ignored)`);
        this.handleSpaNavigation(SPA_SOURCES.URL_WATCHER, true); // Force process
        
      } 
      // Removed the DOM check here - rely on MutationObserver or explicit navigation events
      /* else {
        const currentSnapshot = DomUtils.getDOMSnapshot();
        // Use the stricter check
        const significantChange = this.hasUrlOrMetaChanged(this.previousDOMSnapshot, currentSnapshot);
        
        if (significantChange && !this.isProcessingNavigation && Date.now() - this.lastNavigationTime > 3000) {
          logger.info('SpaDetector', `URL watcher detected significant changes (URL/Title/Meta) without URL change`);
          this.previousDOMSnapshot = currentSnapshot;
          this.handleSpaNavigation(SPA_SOURCES.URL_WATCHER);
        }
      } */
    }, SPA_DETECTION.URL_WATCH_INTERVAL);
    
    logger.info('SpaDetector', `URL watcher started with interval: ${SPA_DETECTION.URL_WATCH_INTERVAL}ms`);
  }

  /**
   * Main handler for SPA navigation detection
   * @param {string} source - The source of the navigation event
   * @param {boolean} forceProcess - Whether to force processing even if already processing or URL hasn't changed.
   */
  handleSpaNavigation(source, forceProcess = false) {
    if (this.navigationTimeoutId) {
      clearTimeout(this.navigationTimeoutId);
      this.navigationTimeoutId = null;
    }

    this.lastNavigationTime = Date.now();
    const currentUrl = window.location.href;
    
    // --- Stricter URL Change Check (Ignore Hash) ---
    const urlWithoutHash = (url) => url.split('#')[0];
    const previousUrlWithoutHash = urlWithoutHash(this.lastProcessedUrl);
    const currentUrlWithoutHash = urlWithoutHash(currentUrl);
    const urlActuallyChanged = currentUrlWithoutHash !== previousUrlWithoutHash;
    // --- End Stricter Check ---

    if (this.navigationsInProgress.has(currentUrl) && !forceProcess) {
      logger.info('SpaDetector', `Already processing URL ${currentUrl}, preventing duplicate extraction`);
      return;
    }
    this.navigationsInProgress.add(currentUrl);

    const currentSnapshot = DomUtils.getDOMSnapshot();
    // Use the new stricter check function
    const significantChange = this.hasUrlOrMetaChanged(this.previousDOMSnapshot, currentSnapshot);

    // Log the potential navigation event with the stricter change detection result
    logger.info('SpaDetector', `SPA navigation detected from ${source}. URL changed (no hash): ${urlActuallyChanged}, Title/Meta changed: ${significantChange}, Current URL: ${currentUrl}, Force: ${forceProcess}`);

    // Determine if we should process based on the stricter criteria
    // Process if:
    // 1. Forced by the caller (e.g., direct history API call, visibility change, URL watcher)
    // 2. URL (no hash) actually changed 
    // 3. Title or Meta changed significantly
    const shouldProcess = forceProcess || urlActuallyChanged || significantChange;

    if (shouldProcess) {
      logger.info('SpaDetector', `Processing required based on source/force/significant change.`);
      this.previousDOMSnapshot = currentSnapshot; // Update snapshot before processing
      this.processSpaNavigation(currentUrl, currentSnapshot, source, true); // Process this change
      // No return here, let the function complete normally
    } else {
       // If no significant change detected and not forced, simply log and do nothing else.
       // No need to send 'skipped' message as no loading state was set in background.
       logger.info('SpaDetector', `No significant change (URL/Title/Meta) detected from ${source} and not forced. Skipping.`);
       this.navigationsInProgress.delete(currentUrl); // Clear processing flag for this attempt
    }

    // Debounce logic is removed as we only process significant changes immediately.
    /* --- Removed Debounce Logic ---
    // logger.info('SpaDetector', `Debouncing navigation processing for ${SPA_DETECTION.NAVIGATION_DEBOUNCE_TIME}ms`);
    this.navigationTimeoutId = setTimeout(() => {
      const finalSnapshot = DomUtils.getDOMSnapshot();
      const finalSignificantChange = this.hasUrlOrMetaChanged(currentSnapshot, finalSnapshot); // Use stricter check after debounce
      logger.info('SpaDetector', `Processing after debounce. Final significant change check: ${finalSignificantChange}`);
      this.processSpaNavigation(currentUrl, finalSnapshot, source, urlActuallyChanged || finalSignificantChange); 
      this.navigationTimeoutId = null;
    }, SPA_DETECTION.NAVIGATION_DEBOUNCE_TIME);
    */
  }

  /**
   * Helper function to actually process a navigation event by dispatching an event.
   * @param {string} url - The current URL at the time of processing.
   * @param {Object} finalSnapshot - The most recent DOM snapshot.
   * @param {string} source - The original source that triggered the detection.
   * @param {boolean} shouldProcess - Whether conditions warrant processing (always true if called now).
   */
  processSpaNavigation(url, finalSnapshot, source, shouldProcess) {
    this.navigationsInProgress.delete(url);
    // this.isProcessingNavigation = false; // State might not be needed anymore

    if (shouldProcess) { // This will always be true based on the new logic in handleSpaNavigation
      logger.info('SpaDetector', `Processing navigation to ${url} from ${source}. Conditions met.`);

      // Update the last *successfully processed* URL and snapshot
      this.lastProcessedUrl = url; // Store the full URL that was processed
      this.previousDOMSnapshot = finalSnapshot; 

      // Reset DOM update counter (though it's less relevant now)
      this.domUpdateCount = 0;

      // Fire custom event for the ContentController to pick up
      const eventDetail = { url: url, source: source, timestamp: Date.now() };
      window.dispatchEvent(new CustomEvent('spaNavigationDetected', { detail: eventDetail }));
      logger.info('SpaDetector', `Dispatched spaNavigationDetected event for ${url}`, eventDetail);

      // Send notification to background (might be redundant if ContentController handles it)
      messaging.sendToBackground(
        messaging.createMessage('spa_navigation_processed', { url: url, source: source }, 'spa_detector')
      ).catch(error => {
        logger.warn('SpaDetector', 'Failed to send SPA processed notification to background', error);
      });

    } 
    // Removed the 'else' block and the 'spa_navigation_skipped' message sending
    // as we now only call processSpaNavigation when shouldProcess is true.
  }

  /**
   * Stop the URL watcher
   */
  stopUrlWatcher() {
    if (this.forceRefreshIntervalId) {
      clearInterval(this.forceRefreshIntervalId);
      this.forceRefreshIntervalId = null;
    }
  }

  /**
   * Clean up resources when no longer needed
   */
  cleanup() {
    this.stopUrlWatcher();
    if (this.navigationTimeoutId) {
      clearTimeout(this.navigationTimeoutId);
      this.navigationTimeoutId = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}

// Export as a singleton
export const spaDetector = new SpaDetector();
