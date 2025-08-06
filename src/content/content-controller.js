'use strict';

import { logger } from '../shared/utils/logger.js';
import { messaging } from '../shared/utils/messaging.js';
import { MESSAGE_TYPES, SPA_SOURCES, SPA_DETECTION } from '../shared/constants.js';
import { spaDetector } from './detectors/spa-detector.js';
import { WebVitalsAnalyzer } from './analyzers/web-vitals-analyzer.js';
import { SeoExtractor } from './extractors/seo-extractor.js';
import { LinkChecker } from './utils/link-checker.js';

/**
 * Main controller for content script functionality
 */
export class ContentController {
  // State variables
  isProcessingExtraction = false;
  lastExtractedUrl = '';
  navigationListenerActive = false;

  /**
   * Initialize the content controller
   */
  constructor() {
    this.setupMessageListeners();
    // Removed this.latestWebVitals as it's no longer needed
  }

  /**
   * Initialize the content script functionality
   */
  async initialize() {
    logger.info('ContentController', 'Initializing content script...');

    try {
      // Initialize SPA detector
      spaDetector.initialize();

      // Initialize Web Vitals measurement
      WebVitalsAnalyzer.startMeasurement();

      // Add custom event listener for SPA navigation
      this.setupSpaNavigationListener();

      // Initial data extraction - wait for page to be more stable
      // For SPAs, we need to wait longer for initial render
      const initialDelay = 2000; // 2 seconds for initial load
      
      logger.info('ContentController', `Waiting ${initialDelay}ms for initial page render...`);
      
      setTimeout(() => {
        logger.info('ContentController', 'Starting initial data extraction');
        this.sendSEOData(SPA_SOURCES.INITIAL_IDLE);
      }, initialDelay);

      // Also send data when the page is fully loaded
      window.addEventListener('load', () => {
        // For SPAs, wait even longer after load event
        setTimeout(() => {
           logger.info('ContentController', 'Page load event fired, extracting data');
           this.sendSEOData(SPA_SOURCES.INITIAL_LOAD);
           // Re-measure Web Vitals after load as well
           WebVitalsAnalyzer.startMeasurement();
        }, 1500);
      });

      // Store initial URL
      this.lastExtractedUrl = window.location.href; // Already set in spaDetector, but keep here for controller state

      logger.info('ContentController', 'Content script initialized successfully');
    } catch (error) {
      logger.error('ContentController', 'Error initializing content script', error);
    }
  }

  /**
   * Set up message listeners
   */
  setupMessageListeners() {
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

      // REMOVED listener for 'webVitalsUpdated' as analyzer sends directly

      // Extract SEO data request
      if (message.action === MESSAGE_TYPES.EXTRACT_SEO_DATA) {
        logger.info('ContentController', 'Received extractSEOData request');

        // Extract data and respond
        SeoExtractor.extractPageSEOData()
          .then(seoData => {
            // Send response
            sendResponse({ success: true, data: seoData });

            // Also update the background script
            logger.info('ContentController', 'Sending content_update from extractSEOData request');
            messaging.sendToBackground({
              action: MESSAGE_TYPES.CONTENT_UPDATE,
              data: seoData,
              source: 'extract_request',
              timestamp: Date.now()
            }, false).catch(error => {
              logger.error('ContentController', 'Error sending content update', error);
            });
          })
          .catch(error => {
            logger.error('ContentController', 'Error extracting SEO data', error);
            sendResponse({ success: false, error: error.message });
          });

        return true; // Keep message channel open for async response
      }
      
      // Handle link status check using XHR
      if (message.action === 'checkLinkStatusXHR') {
        const url = message.url;
        const timeout = message.timeout || 5000;
        
        logger.info('ContentController', `Received request to check link status for: ${url}`);
        
        // Use LinkChecker to check the URL
        LinkChecker.checkStatus(url, timeout)
          .then(result => {
            logger.info('ContentController', `Link check result for ${url}: ${result.status} (${result.statusCode || 'n/a'})`);
            sendResponse(result);
          })
          .catch(error => {
            logger.error('ContentController', `Error checking link status for ${url}`, error);
            sendResponse({
              success: false,
              status: 'error',
              statusCode: null,
              error: error.message || 'Unknown error checking link'
            });
          });
        
        return true; // Keep message channel open for async response
      }

      // Add ping handler to check if content script is loaded
      if (message.action === 'ping') {
        logger.info('ContentController', 'Received ping, responding');
        sendResponse({ success: true, source: 'content_script' });
        return false; // No need to keep channel open
      }
      
      // Return false for unhandled actions
      return false;
    });
  }

  /**
   * Set up listener for SPA navigation events
   */
  setupSpaNavigationListener() {
    if (this.navigationListenerActive) return;

    window.addEventListener('spaNavigationDetected', (event) => {
      const { url, source, timestamp } = event.detail;

      logger.info('ContentController', `SPA navigation detected event: ${url} from ${source}`);

      // --- IMPORTANT: Restart Web Vitals measurement on SPA navigation ---
      WebVitalsAnalyzer.startMeasurement();

      // Determine if extraction should be forced based on URL change
      const forceExtraction = url !== this.lastExtractedUrl;

      if (forceExtraction) {
        logger.info('ContentController', `URL changed from ${this.lastExtractedUrl} to ${url} - forcing data extraction`);
      } else {
        logger.info('ContentController', `Same URL detected, but content may have changed - extracting data`);
      }

      // For NextJS and other SPAs, wait longer for the page to fully render
      // Use a longer delay for client-side rendered content
      const delay = 2000; // 2 seconds delay
      logger.info('ContentController', `Waiting ${delay}ms for SPA content to render...`);
      
      setTimeout(() => {
        logger.info('ContentController', `Extracting data after SPA navigation delay`);
        // Send SEO data, forcing if the URL changed
        this.sendSEOData(`spa_navigation_${source}`, forceExtraction);
      }, delay);

    });

    this.navigationListenerActive = true;
    logger.info('ContentController', 'SPA navigation listener set up');
  }

  /**
   * Extract and send SEO data to background script
   * @param {string} source - The source triggering the extraction
   * @param {boolean} forceProcess - Whether to force processing even if already processing
   * @returns {Promise<boolean>} Whether the extraction and sending was successful
   */
  async sendSEOData(source = 'initial', forceProcess = false) {
    // Skip if already processing, unless forced
    if (this.isProcessingExtraction && !forceProcess && source !== SPA_SOURCES.INITIAL_IDLE && source !== SPA_SOURCES.INITIAL_LOAD) {
      logger.info('ContentController', `Already processing extraction, skipping sendSEOData from ${source}`);
      return false;
    }

    // Set extraction flag
    this.isProcessingExtraction = true;

    try {
      logger.info('ContentController', `Starting data extraction from ${source}${forceProcess ? ' (forced)' : ''}`);

      // REMOVED Web Vitals injection request block - Analyzer handles it directly

      // Extract the SEO data using the refactored extractor
      const seoData = await SeoExtractor.extractPageSEOData();

      // Add SPA flag if from SPA navigation
      if (source.includes('spa_navigation')) {
        seoData.isSpaNavigation = true;
        seoData.navigationSource = source;
        seoData.isSpaDetected = true;
        seoData.forceProcessed = forceProcess;
        logger.info('ContentController', `Marked data as SPA navigation from ${source}`);
      }

      // Update last extracted URL
      this.lastExtractedUrl = seoData.url;

      logger.info('ContentController', `Sending content_update from ${source} for URL: ${seoData.url}`);

      // Send the data to background script
      const response = await messaging.sendToBackground({
        action: MESSAGE_TYPES.CONTENT_UPDATE,
        source: source,
        timestamp: Date.now(),
        data: seoData
      });

      // --- REMOVED: Automatic image size processing trigger ---
      // Image size checking will now be initiated manually from the popup UI.

      if (response && response.success) {
        logger.info('ContentController', `Background confirmed receipt of initial data for ${seoData.url}`);
        this.isProcessingExtraction = false;
        return true;
      } else {
        logger.warn('ContentController', 'Background did not confirm data receipt', response);
        this.isProcessingExtraction = false;
        return false;
      }
    } catch (error) {
      logger.error('ContentController', `Error extracting/sending SEO data from ${source}`, error);

      // Send error notification
      try {
        await messaging.sendToBackground({
          action: MESSAGE_TYPES.CONTENT_ERROR,
          source: source,
          url: window.location.href,
          error: error.message,
          timestamp: Date.now()
        });
      } catch (sendError) {
        logger.error('ContentController', 'Error sending extraction error notification', sendError);
      }

      this.isProcessingExtraction = false;
      return false;
    }
  }

  /**
   * Clean up resources when no longer needed
   */
  cleanup() {
    // Clean up SPA detector
    spaDetector.cleanup();
    // Clean up Web Vitals observers
    WebVitalsAnalyzer.reset();

    // Remove SPA navigation listener if active
    // Note: This might require storing the listener function reference if we need to remove it specifically
    // For now, assume page unload handles listener removal implicitly.

    logger.info('ContentController', 'Content controller cleaned up');
  }
}
