'use strict';

import { logger } from '../../shared/utils/logger.js';
import { messaging } from '../../shared/utils/messaging.js';
import { MESSAGE_TYPES } from '../../shared/constants.js';

/**
 * Service for measuring and analyzing Web Vitals directly using PerformanceObserver.
 */
export class WebVitalsAnalyzer {
  static webVitalsInitiated = false;
  static lcpObserver = null;
  static clsObserver = null;
  static fidObserver = null;
  static fcpObserver = null; // Add FCP observer reference
  static cumulativeLayoutShift = 0;

  /**
   * Start measuring Core Web Vitals using PerformanceObserver API.
   * This method should be called once per page load or SPA navigation.
   */
  static startMeasurement() {
    if (this.webVitalsInitiated) {
      logger.info('WebVitalsAnalyzer', 'Measurement already initiated. Resetting and restarting.');
      this.reset(); // Reset before starting again for SPAs
    }
    this.webVitalsInitiated = true;
    this.cumulativeLayoutShift = 0; // Reset CLS for new measurement cycle
    logger.info('WebVitalsAnalyzer', 'Starting direct Core Web Vitals measurement...');

    // --- Measure TTFB ---
    this.measureTTFB();

    // --- Measure LCP ---
    this.observeLCP();

    // --- Measure CLS ---
    this.observeCLS();

    // --- Measure FID ---
    this.observeFID();

    // --- Measure FCP (First Contentful Paint) ---
    this.observeFCP();
  }

  /**
   * Measure Time to First Byte (TTFB) using Navigation Timing API.
   */
  static measureTTFB() {
    try {
      if (window.performance && window.performance.getEntriesByType) {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          const navEntry = navEntries[0];
          // TTFB is the time from navigationStart to responseStart
          // Ensure values are positive before calculating
          if (navEntry.responseStart > 0 && navEntry.startTime >= 0) {
             // Use startTime instead of navigationStart for potentially more accurate relative timing
             const ttfb = navEntry.responseStart - navEntry.startTime;
             if (ttfb >= 0) { // Ensure TTFB is not negative
                logger.info('WebVitalsAnalyzer', `Direct API: TTFB = ${ttfb.toFixed(2)}ms`);
                this.sendMetricToBackground('ttfb', ttfb);
             } else {
                logger.warn('WebVitalsAnalyzer', 'Calculated negative TTFB, skipping.', navEntry);
             }
          }
        } else if (window.performance.timing) {
          // Fallback to older API (less accurate)
          const timing = window.performance.timing;
          if (timing.responseStart > 0 && timing.navigationStart > 0) {
             const ttfb = timing.responseStart - timing.navigationStart;
             if (ttfb >= 0) {
                logger.info('WebVitalsAnalyzer', `Direct API (legacy): TTFB = ${ttfb}ms`);
                this.sendMetricToBackground('ttfb', ttfb);
             }
          }
        }
      }
    } catch (e) {
      logger.error('WebVitalsAnalyzer', 'Error measuring TTFB:', e);
    }
  }

  /**
   * Observe Largest Contentful Paint (LCP) using PerformanceObserver.
   */
  static observeLCP() {
    try {
      if (this.lcpObserver) this.lcpObserver.disconnect(); // Disconnect previous observer if any

      if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
        logger.info('WebVitalsAnalyzer', 'Setting up LCP observer');
        this.lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            // The last entry is the most recent LCP candidate
            const lastEntry = entries[entries.length - 1];
            const lcp = lastEntry.startTime;
            logger.info('WebVitalsAnalyzer', `Observed LCP = ${lcp.toFixed(2)}ms`);
            this.sendMetricToBackground('lcp', lcp);
            // LCP can change, so we keep observing but might disconnect later if needed
          }
        });
        this.lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } else {
        logger.warn('WebVitalsAnalyzer', 'Browser does not support LCP measurement via PerformanceObserver.');
      }
    } catch (e) {
      logger.error('WebVitalsAnalyzer', 'Error setting up LCP observer:', e);
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS) using PerformanceObserver.
   */
  static observeCLS() {
     try {
        if (this.clsObserver) this.clsObserver.disconnect(); // Disconnect previous observer

        if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
           logger.info('WebVitalsAnalyzer', 'Setting up CLS observer');
           this.clsObserver = new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                 // Only count layout shifts that were not preceded by user input
                 if (!entry.hadRecentInput) {
                    this.cumulativeLayoutShift += entry.value;
                    logger.info('WebVitalsAnalyzer', `CLS update, current total = ${this.cumulativeLayoutShift.toFixed(4)}`);
                    this.sendMetricToBackground('cls', this.cumulativeLayoutShift);
                 }
              }
           });
           this.clsObserver.observe({ type: 'layout-shift', buffered: true });
        } else {
           logger.warn('WebVitalsAnalyzer', 'Browser does not support CLS measurement via PerformanceObserver.');
        }
     } catch (e) {
        logger.error('WebVitalsAnalyzer', 'Error setting up CLS observer:', e);
     }
  }


  /**
   * Observe First Input Delay (FID) using PerformanceObserver.
   */
  static observeFID() {
    try {
      if (this.fidObserver) this.fidObserver.disconnect(); // Disconnect previous observer

      if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
        logger.info('WebVitalsAnalyzer', 'Setting up FID observer');
        this.fidObserver = new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0];
          if (firstInput) {
            // FID is the delay between input event time and processing time
            const fid = firstInput.processingStart - firstInput.startTime;
            logger.info('WebVitalsAnalyzer', `Observed FID = ${fid.toFixed(2)}ms`);
            this.sendMetricToBackground('fid', fid);
            // FID is measured only once, disconnect observer after first event
            if (this.fidObserver) this.fidObserver.disconnect();
          }
        });
        this.fidObserver.observe({ type: 'first-input', buffered: true });
      } else {
        logger.warn('WebVitalsAnalyzer', 'Browser does not support FID measurement via PerformanceObserver.');
      }
    } catch (e) {
      logger.error('WebVitalsAnalyzer', 'Error setting up FID observer:', e);
    }
  }

  /**
   * Observe First Contentful Paint (FCP) using PerformanceObserver.
   */
  static observeFCP() {
    try {
      if (this.fcpObserver) this.fcpObserver.disconnect(); // Disconnect previous observer
      
      if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes('paint')) {
        logger.info('WebVitalsAnalyzer', 'Setting up FCP observer');
        this.fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntriesByName('first-contentful-paint');
          if (entries.length > 0) {
            const fcpEntry = entries[0];
            const fcp = fcpEntry.startTime;
            logger.info('WebVitalsAnalyzer', `Observed FCP = ${fcp.toFixed(2)}ms`);
            this.sendMetricToBackground('fcp', fcp);
            // FCP is measured only once, disconnect observer
            if (this.fcpObserver) {
              this.fcpObserver.disconnect();
              this.fcpObserver = null;
            }
          }
        });
        this.fcpObserver.observe({ type: 'paint', buffered: true });
      } else {
        logger.warn('WebVitalsAnalyzer', 'Browser does not support FCP measurement via PerformanceObserver.');
      }
    } catch (e) {
      logger.error('WebVitalsAnalyzer', 'Error setting up FCP observer:', e);
    }
  }


  /**
   * Send metric data to the background script using the shared messaging utility.
   * @param {string} name - Metric name (e.g., 'lcp', 'fid', 'cls', 'ttfb', 'fcp').
   * @param {number} value - Raw metric value (usually in milliseconds or unitless for CLS).
   */
  static sendMetricToBackground(name, value) {
    if (typeof value !== 'number' || isNaN(value)) {
       logger.warn('WebVitalsAnalyzer', `Invalid value for metric ${name}: ${value}. Skipping send.`);
       return;
    }

    const metricName = name.toLowerCase();
    let displayValue = value;
    let displayUnit = 'ms'; // Default unit

    // Normalize value and determine display unit
    if (metricName === 'cls') {
      displayValue = parseFloat(value.toFixed(4)); // CLS is unitless, more precision
      displayUnit = '';
    } else if (metricName === 'lcp' || metricName === 'ttfb' || metricName === 'fcp') {
      displayValue = parseFloat((value / 1000).toFixed(2)); // Convert ms to seconds
      displayUnit = 's';
    } else if (metricName === 'fid') {
      displayValue = Math.round(value); // FID is typically ms
      displayUnit = 'ms';
    } else {
       // Keep original value and unit for unknown metrics
       displayValue = parseFloat(value.toFixed(2));
    }


    // Apply reasonable caps for display consistency
    let cappedDisplayValue = displayValue;
    if (metricName === 'lcp' && displayValue > 10) cappedDisplayValue = 10;
    else if (metricName === 'ttfb' && displayValue > 5) cappedDisplayValue = 5;
    else if (metricName === 'fid' && displayValue > 1000) cappedDisplayValue = 1000;
    else if (metricName === 'cls' && displayValue > 1) cappedDisplayValue = 1.0;
    else if (metricName === 'fcp' && displayValue > 5) cappedDisplayValue = 5; // Cap FCP at 5s


    const message = {
      action: MESSAGE_TYPES.WEB_VITALS_RESULT,
      data: {
        name: metricName,
        value: cappedDisplayValue, // The value to display
        rawValue: parseFloat(value.toFixed(2)), // Original measured value
        displayUnit: displayUnit,
      },
      url: window.location.href,
      timestamp: Date.now(),
      source: 'web_vitals_analyzer_direct'
    };

    logger.info('WebVitalsAnalyzer', `Sending metric: ${metricName}=${cappedDisplayValue}${displayUnit} (raw: ${value.toFixed(2)}ms)`);

    messaging.sendToBackground(message)
      .then(response => {
        if (response && response.success) {
          // logger.debug('WebVitalsAnalyzer', `Metric ${metricName} sent successfully`);
        } else {
          logger.warn('WebVitalsAnalyzer', `Background did not confirm receipt for ${metricName}`);
        }
      })
      .catch(error => {
        // Only log error if it's not the common "Receiving end does not exist" during page unload
        if (!error.message?.includes('Receiving end does not exist')) {
           logger.error('WebVitalsAnalyzer', `Error sending metric ${metricName}:`, error);
        }
      });
  }

  /**
   * Reset the Web Vitals measurement state and disconnect observers.
   * Useful for SPA navigation to start fresh measurements.
   */
  static reset() {
    logger.info('WebVitalsAnalyzer', 'Resetting Web Vitals measurement...');
    if (this.lcpObserver) {
      this.lcpObserver.disconnect();
      this.lcpObserver = null;
    }
    if (this.clsObserver) {
      this.clsObserver.disconnect();
      this.clsObserver = null;
    }
    if (this.fidObserver) {
      this.fidObserver.disconnect();
      this.fidObserver = null;
    }
    if (this.fcpObserver) {
      this.fcpObserver.disconnect();
      this.fcpObserver = null;
    }

    this.webVitalsInitiated = false;
    this.cumulativeLayoutShift = 0;
    logger.info('WebVitalsAnalyzer', 'Web Vitals measurement reset complete.');
  }
}
