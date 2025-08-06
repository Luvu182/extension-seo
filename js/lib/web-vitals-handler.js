/**
 * Web Vitals Handler
 * 
 * This file handles initialization of web-vitals metrics in the page context
 * avoiding the need for inline scripts.
 * 
 * IMPORTANT: This file is designed to run in the web page context (not isolated)
 * to properly measure Core Web Vitals.
 */
(function() {
  const webVitalsSource = 'seo-ai-assistant-web-vitals';
  let initializationAttempts = 0;
  const MAX_ATTEMPTS = 15; // Increased to be more resilient

  // Handler function that will run when the web-vitals library is loaded
  function initWebVitals() {
    console.log('[WebVitals Handler] Initializing... Attempt: ' + (++initializationAttempts));

    if (typeof webVitals === 'undefined') {
      console.error('[WebVitals Handler] webVitals library not available!');
      
      // Tạo đối tượng webVitals global nếu nó không tồn tại
      if (initializationAttempts === 1) {
        console.log('[WebVitals Handler] Attempting to inject webVitals library via script tag');
        
        // Tạo một script tag để load web-vitals
        try {
          var script = document.createElement('script');
          // Sử dụng URL tuyệt đối với chrome-extension://
          script.src = chrome.runtime.getURL('/js/lib/web-vitals.iife.js');
          document.head.appendChild(script);
          console.log('[WebVitals Handler] Added web-vitals script tag to page');
        } catch (e) {
          console.error('[WebVitals Handler] Error creating script tag:', e);
        }
      }
      
      // Giới hạn số lần thử
      if (initializationAttempts < MAX_ATTEMPTS) {
        setTimeout(initWebVitals, 500);
      } else {
        console.error('[WebVitals Handler] Gave up after ' + MAX_ATTEMPTS + ' attempts');
      }
      return false;
    }

    // Test value to make sure metrics are being recorded
    window.postMessage({
      source: webVitalsSource,
      metric: { name: 'test', value: 123 }
    }, '*');
    console.log('[WebVitals Handler] Sent test metric');

    const sendMetricToPage = (metric) => {
      try {
        // Create a standardized metric object
        // Note: Web Vitals library reports:
        // - LCP in milliseconds (needs conversion to seconds for UI)
        // - FID in milliseconds (keep as is)
        // - CLS as a unitless value (keep as is)
        // - TTFB in milliseconds (needs conversion to seconds for UI)
        
        // Keep raw values for debugging
        const originalValue = metric.value;
        let value = metric.value;
        let name = metric.name.toLowerCase();
        
        // Keep track of the original unit for debugging
        const originalUnit = 
          (name === 'lcp' || name === 'ttfb' || name === 'fcp') ? 'milliseconds' : 
          (name === 'fid' || name === 'inp') ? 'milliseconds' : 
          (name === 'cls') ? 'unitless' : 'unknown';
        
        // CRITICAL FIX: Let's NOT do any conversions here
        // Instead, pass the raw values with very clear metadata about units
        // web-vitals reports metrics in their native format:
        // - LCP: milliseconds (e.g., a value of 780 means 780ms = 0.78s)
        // - FID: milliseconds
        // - CLS: unitless decimal
        // - TTFB: milliseconds
        
        // Create explicit metadata
        const metricMeta = {
          lcp: { 
            unit: 'milliseconds', 
            display_unit: 'seconds',
            conversion_factor: 0.001,  // ms to s
            typical_range: [100, 4000] // 0.1s to 4s
          },
          ttfb: { 
            unit: 'milliseconds', 
            display_unit: 'seconds',
            conversion_factor: 0.001,  // ms to s
            typical_range: [50, 1800]  // 0.05s to 1.8s
          },
          fid: { 
            unit: 'milliseconds', 
            display_unit: 'milliseconds',
            conversion_factor: 1,      // no conversion
            typical_range: [10, 300]   // 10ms to 300ms
          },
          cls: { 
            unit: 'unitless', 
            display_unit: 'unitless',
            conversion_factor: 1,      // no conversion
            typical_range: [0, 0.25]   // 0 to 0.25
          },
          fcp: {
            unit: 'milliseconds',
            display_unit: 'seconds',
            conversion_factor: 0.001,  // ms to s
            typical_range: [100, 3000] // 0.1s to 3s
          }
        };
        
        // Get metadata for this metric
        const meta = metricMeta[name] || { 
          unit: 'unknown', 
          display_unit: 'unknown',
          conversion_factor: 1,
          typical_range: [0, Number.MAX_VALUE]
        };

        // Log the original metric with proper metadata
        console.log(`[WebVitals Handler] Raw ${name} metric: ${value} ${meta.unit}`);
        
        // Create an enriched metric object
        const enrichedMetric = {
          name: name,
          value: value,  // Keep the original value
          rawValue: value,
          rawUnit: meta.unit,
          displayUnit: meta.display_unit,
          conversionFactor: meta.conversion_factor,
          typicalRange: meta.typical_range
        };
        
        // Only apply caps for truly extreme values (not normal conversion issues)
        if (name === 'lcp' && value > 30000) { // 30 seconds
          console.warn(`[WebVitals Handler] Extreme ${name} value: ${value}ms, likely an error`);
          enrichedMetric.extremeValue = true;
        } else if (name === 'ttfb' && value > 10000) { // 10 seconds
          console.warn(`[WebVitals Handler] Extreme ${name} value: ${value}ms, likely an error`);
          enrichedMetric.extremeValue = true;
        } else if (name === 'fid' && value > 5000) { // 5 seconds
          console.warn(`[WebVitals Handler] Extreme ${name} value: ${value}ms, likely an error`);
          enrichedMetric.extremeValue = true;
        } else if (name === 'cls' && value > 5) { // Very high CLS
          console.warn(`[WebVitals Handler] Extreme ${name} value: ${value}, likely an error`);
          enrichedMetric.extremeValue = true;
        }
        
        // Post the enriched metric
        window.postMessage({
          source: webVitalsSource,
          metric: enrichedMetric
        }, '*');
        
        console.log(`[WebVitals Handler] Sent enriched metric: ${name}=${value} ${meta.unit}`);
        
        // Return here - we've posted with enrichedMetric already
        return;
        
        // Log the raw metric from web-vitals
        console.log('[WebVitals Handler] Raw metric received:', 
          metric.name, originalValue, `(${originalUnit})`);
        console.log('[WebVitals Handler] Processed metric to be sent:', 
          name, value, (originalUnit === 'milliseconds' && name !== 'fid' && name !== 'inp') ? 'seconds' : originalUnit);
        
        // Create a simple object with only essential data
        const simplifiedMetric = {
          name: name,
          value: value,
          originalValue: originalValue,
          originalUnit: originalUnit
        };
        
        // Post using a standard format
        window.postMessage({
          source: webVitalsSource,
          metric: simplifiedMetric
        }, '*');
        
        console.log('[WebVitals Handler] Metric forwarded:', 
          name, value, `(${originalUnit})`);
      } catch (err) {
        console.error('[WebVitals Handler] Error forwarding metric:', err);
      }
    };
    
    try {
      // Đo TTFB từ Navigation Timing API (phiên bản mới) nếu khả dụng
      if (window.performance && window.performance.getEntriesByType) {
        try {
          const navigationEntries = window.performance.getEntriesByType('navigation');
          if (navigationEntries && navigationEntries.length > 0) {
            const nav = navigationEntries[0];
            // Đây là cách đo TTFB chính xác
            const ttfb = nav.responseStart - nav.requestStart;
            if (ttfb > 0) {
              window.postMessage({
                source: webVitalsSource,
                metric: { name: 'ttfb', value: ttfb }
              }, '*');
              console.log('[WebVitals Handler] Measured and sent real TTFB:', ttfb);
            }
          }
        } catch (e) {
          console.error('[WebVitals Handler] Error using Navigation Timing API:', e);
        }
      }
      
      // Không sử dụng APIs bị deprecated và không tạo dữ liệu mẫu
      // Để web-vitals library tự đo lường các metrics

      // Test value để kiểm tra kênh postMessage
      window.postMessage({
        source: webVitalsSource,
        metric: { name: 'test', value: 999 }
      }, '*');
      console.log('[WebVitals Handler] Sent test metric for postMessage channel verification');

      // Setup metrics monitoring
      webVitals.onLCP(sendMetricToPage, { reportAllChanges: true });
      webVitals.onFID(sendMetricToPage);
      webVitals.onCLS(sendMetricToPage, { reportAllChanges: true });
      webVitals.onTTFB(sendMetricToPage);
      
      if (webVitals.onFCP) {
        webVitals.onFCP(sendMetricToPage, { reportAllChanges: true });
      }
      if (webVitals.onINP) {
        webVitals.onINP(sendMetricToPage, { reportAllChanges: true });
      }
      
      console.log('[WebVitals Handler] Metrics forwarding initialized successfully');
      return true;
    } catch (err) {
      console.error('[WebVitals Handler] Error setting up metrics:', err);
      return false;
    }
  }

  // Check if webVitals library is loaded
  function checkWebVitalsLoaded() {
    if (typeof webVitals !== 'undefined') {
      console.log('[WebVitals Handler] webVitals library found, initializing...');
      initWebVitals();
    } else {
      console.log('[WebVitals Handler] webVitals library not found yet, retrying in 500ms...');
      setTimeout(checkWebVitalsLoaded, 500);
    }
  }

  // Automatically run initialization when the script loads
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // If DOM is ready, start checking for webVitals library
    console.log('[WebVitals Handler] Document ready, checking for webVitals...');
    setTimeout(checkWebVitalsLoaded, 100);
  } else {
    // Wait for DOM to be ready
    console.log('[WebVitals Handler] Waiting for document to be ready...');
    document.addEventListener('DOMContentLoaded', function() {
      console.log('[WebVitals Handler] Document now ready, checking for webVitals...');
      setTimeout(checkWebVitalsLoaded, 100);
    });
  }
})();
