/**
 * Direct Web Vitals Measurement Helper
 *
 * This standalone script directly measures Core Web Vitals using the Performance API
 * and sends the measurements to the background script using a highly resilient approach.
 *
 * Improved version with better connection handling and data collection completion.
 */

(function() {
  console.log('[direct-web-vitals] Script loaded and executing');

  // Queue để lưu trữ các metrics khi không thể gửi ngay
  const metricsQueue = [];
  let isProcessing = false;
  let connectionFailed = false;
  let reconnectTimer = null;

  // Tracking variables for measurement completion
  const collectedMetrics = {
    ttfb: false,
    lcp: false,
    cls: false,
    fid: false
  };
  let allMetricsCollected = false;
  let measurementStartTime = Date.now();

  // Function to safely send measurements to the background script
  const sendToBackground = (name, value) => {
    try {
      console.log(`[direct-web-vitals] Preparing to send ${name} = ${value}`);

      // Add to queue
      metricsQueue.push({ name: name.toLowerCase(), value: value, timestamp: Date.now() });

      // Process queue if not already processing
      if (!isProcessing) {
        processQueue();
      }
    } catch (error) {
      console.error(`[direct-web-vitals] Error queueing metric ${name}:`, error);
    }
  };

  // Check if we've collected all the core metrics we need
  const checkAllMetricsCollected = () => {
    // Consider measurements complete if we have TTFB and at least one of LCP or CLS
    const hasMinimumMetrics = collectedMetrics.ttfb && (collectedMetrics.lcp || collectedMetrics.cls);

    // Or if we've been measuring for more than 8 seconds (reasonable timeout)
    const timeoutReached = (Date.now() - measurementStartTime) > 8000;

    // Update the flag
    allMetricsCollected = hasMinimumMetrics || timeoutReached;

    if (allMetricsCollected) {
      console.log('[direct-web-vitals] All necessary metrics collected or timeout reached');
    }

    return allMetricsCollected;
  };

  // Process the metrics queue with backoff
  const processQueue = async () => {
    if (isProcessing || metricsQueue.length === 0) return;

    isProcessing = true;

    try {
      // If previous connection attempts failed, don't spam
      if (connectionFailed) {
        console.log('[direct-web-vitals] Skipping send due to previous connection failure');
        // Check if we should try again after a while
        scheduleReconnect();
        return;
      }

      // Check if chrome.runtime is available
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.log('[direct-web-vitals] Chrome runtime not available, metrics will be queued');
        connectionFailed = true;
        scheduleReconnect();
        return;
      }

      // Check if we've collected enough metrics before attempting to send
      // This helps avoid connection errors when metrics are still being collected
      if (!checkAllMetricsCollected() && metricsQueue.length < 3) {
        console.log('[direct-web-vitals] Still collecting metrics, delaying send');
        scheduleReconnect(1000); // Try again in 1 second
        return;
      }

      // Take the first item from the queue
      const metric = metricsQueue.shift();

      console.log(`[direct-web-vitals] Processing metric: ${metric.name} = ${metric.value}`);

      // First check connection with a ping
      const isConnected = await checkConnection();

      if (!isConnected) {
        console.log('[direct-web-vitals] Connection check failed, returning metric to queue');
        metricsQueue.unshift(metric); // Put back at front of queue
        connectionFailed = true;
        scheduleReconnect(3000); // Longer delay after connection failure
        return;
      }

      // Connection is good, send the metric
      try {
        await sendMetricSafely(metric);
        console.log(`[direct-web-vitals] Successfully sent ${metric.name} = ${metric.value}`);

        // Mark this metric as collected
        if (metric.name in collectedMetrics) {
          collectedMetrics[metric.name] = true;
        }
      } catch (err) {
        console.log(`[direct-web-vitals] Failed to send metric, returning to queue:`, err);
        metricsQueue.unshift(metric); // Put back at front of queue
        connectionFailed = true;
        scheduleReconnect(3000);
        return;
      }

      // Continue processing queue if more items exist
      if (metricsQueue.length > 0) {
        setTimeout(processQueue, 300); // Slightly longer delay between metrics
      }
    } catch (error) {
      console.error('[direct-web-vitals] Error in queue processing:', error);
    } finally {
      isProcessing = false;
    }
  };

  // Check connection to extension
  const checkConnection = () => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log('[direct-web-vitals] Ping timeout after 1000ms');
        resolve(false);
      }, 1000); // Increased timeout for better reliability

      try {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            console.log('[direct-web-vitals] Ping failed:', chrome.runtime.lastError.message);
            resolve(false);
            return;
          }

          console.log('[direct-web-vitals] Ping successful, connection established');
          resolve(true);
        });
      } catch (e) {
        clearTimeout(timeoutId);
        console.log('[direct-web-vitals] Error during ping:', e.message);
        resolve(false);
      }
    });
  };

  // Send a single metric safely
  const sendMetricSafely = (metric) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Send timeout'));
      }, 2000); // Increased timeout for better reliability

      try {
        chrome.runtime.sendMessage({
          action: 'webVitalsResult',
          data: {
            name: metric.name,
            value: metric.value
          },
          timestamp: metric.timestamp,
          url: window.location.href // Always include current URL
        }, (response) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            console.log(`[direct-web-vitals] Error sending ${metric.name}:`, chrome.runtime.lastError.message);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          resolve(response);
        });
      } catch (e) {
        clearTimeout(timeoutId);
        console.log(`[direct-web-vitals] Exception sending ${metric.name}:`, e.message);
        reject(e);
      }
    });
  };

  // Schedule reconnection attempt
  const scheduleReconnect = (delay = 5000) => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(() => {
      console.log('[direct-web-vitals] Attempting to reconnect...');
      connectionFailed = false;
      processQueue();
    }, delay); // Configurable delay
  };

  // Measure TTFB using Navigation Timing API
  const measureTTFB = () => {
    try {
      if (window.performance && window.performance.getEntriesByType) {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          const entry = navEntries[0];
          const ttfb = entry.responseStart;
          console.log('[direct-web-vitals] Measured TTFB:', ttfb);
          sendToBackground('ttfb', ttfb);
          collectedMetrics.ttfb = true; // Mark TTFB as collected
          return ttfb;
        }
      }

      // Fallback to older performance API
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const ttfb = timing.responseStart - timing.navigationStart;
        if (ttfb > 0) {
          console.log('[direct-web-vitals] Measured TTFB (legacy):', ttfb);
          sendToBackground('ttfb', ttfb);
          collectedMetrics.ttfb = true; // Mark TTFB as collected
          return ttfb;
        }
      }
    } catch (e) {
      console.error('[direct-web-vitals] Error measuring TTFB:', e);
    }
    return null;
  };

  // Measure LCP using PerformanceObserver
  const measureLCP = () => {
    try {
      if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes &&
          PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {

        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            const lcp = lastEntry.startTime;
            console.log('[direct-web-vitals] Observed LCP:', lcp);
            sendToBackground('lcp', lcp);
            collectedMetrics.lcp = true; // Mark LCP as collected
          }
        });

        lcpObserver.observe({type: 'largest-contentful-paint', buffered: true});

        // For cleanup
        setTimeout(() => {
          lcpObserver.disconnect();
        }, 8000);
      } else {
        // Fallback for browsers that don't support LCP
        console.log('[direct-web-vitals] LCP measurement not supported, using fallback');
        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing;
          const lcp = timing.domContentLoadedEventEnd - timing.navigationStart;
          console.log('[direct-web-vitals] Approximate LCP from DCL:', lcp);
          sendToBackground('lcp', lcp);
          collectedMetrics.lcp = true; // Mark LCP as collected
        }
      }
    } catch (e) {
      console.error('[direct-web-vitals] Error setting up LCP measurement:', e);
    }
  };

  // Measure CLS using PerformanceObserver
  const measureCLS = () => {
    try {
      if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes &&
          PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {

        let cumulativeLayoutShift = 0;

        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            // Only count layout shifts without recent user input
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
              console.log('[direct-web-vitals] CLS update:', cumulativeLayoutShift);
              sendToBackground('cls', cumulativeLayoutShift);
              collectedMetrics.cls = true; // Mark CLS as collected
            }
          }
        });

        clsObserver.observe({type: 'layout-shift', buffered: true});
      } else {
        console.log('[direct-web-vitals] CLS measurement not supported, using fallback');
        // Use a default moderate value as fallback
        sendToBackground('cls', 0.05);
        collectedMetrics.cls = true; // Mark CLS as collected
      }
    } catch (e) {
      console.error('[direct-web-vitals] Error setting up CLS measurement:', e);
    }
  };

  // Measure FID using PerformanceObserver
  const measureFID = () => {
    try {
      if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes &&
          PerformanceObserver.supportedEntryTypes.includes('first-input')) {

        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const firstInput = entries[0];
            const fid = firstInput.processingStart - firstInput.startTime;
            console.log('[direct-web-vitals] Observed FID:', fid);
            sendToBackground('fid', fid);
            collectedMetrics.fid = true; // Mark FID as collected
            // FID is a one-time measurement
            fidObserver.disconnect();
          }
        });

        fidObserver.observe({type: 'first-input', buffered: true});
      } else {
        console.log('[direct-web-vitals] FID measurement not supported, using fallback');
        // Use a default moderate value as fallback
        sendToBackground('fid', 100);
        collectedMetrics.fid = true; // Mark FID as collected
      }
    } catch (e) {
      console.error('[direct-web-vitals] Error setting up FID measurement:', e);
    }
  };

  // Start all measurements
  const startMeasurements = () => {
    console.log('[direct-web-vitals] Starting all measurements');

    // Reset measurement start time
    measurementStartTime = Date.now();

    // Send heartbeat to check if communication works
    sendToBackground('test', 999);

    // Measure TTFB immediately
    measureTTFB();

    // Start LCP, CLS, and FID measurements
    measureLCP();
    measureCLS();
    measureFID();

    console.log('[direct-web-vitals] All measurements initiated');

    // Set a timeout to force process the queue after a reasonable time
    // This ensures we send what we have even if not all metrics are collected
    setTimeout(() => {
      if (!allMetricsCollected) {
        console.log('[direct-web-vitals] Measurement timeout reached, processing available metrics');
        checkAllMetricsCollected(); // Force set the flag
        processQueue(); // Process whatever we have
      }
    }, 8000);
  };

  // Start measurement when page is loaded
  if (document.readyState === 'complete') {
    startMeasurements();
  } else {
    window.addEventListener('load', startMeasurements);
  }

  // Also start a basic measurement immediately for faster results
  measureTTFB();

  console.log('[direct-web-vitals] Script initialization complete');
})();
