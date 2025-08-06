'use strict';

import { logger } from '../../shared/utils/logger.js';
import { LINK_CHECKER } from '../../shared/constants.js';

/**
 * Service for checking link statuses using Vercel API
 * Handles batching of URL checks to prevent overloading and server rejection
 */
class VercelLinkServiceClass {
  constructor() {
    this.API_ENDPOINT = LINK_CHECKER.VERCEL_API_ENDPOINT;
    this.MAX_BATCH_SIZE = LINK_CHECKER.BATCH_SIZE; // Maximum URLs per batch
    this.BATCH_DELAY = LINK_CHECKER.BATCH_DELAY; // Delay between batches in ms
  }

  /**
   * Checks multiple URLs status using the Vercel API service
   * Automatically batches requests to avoid overwhelming the server
   *
   * @param {Array<string>} urls - Array of URLs to check
   * @param {Function} onBatchComplete - Optional callback to call after each batch completes
   * @returns {Promise<Object>} - Map of URL to status information
   */
  async checkMultipleUrls(urls, onBatchComplete = null) {
    if (!Array.isArray(urls) || urls.length === 0) {
      logger.warn('VercelLinkService', 'No valid URLs provided for status check');
      return {};
    }

    logger.info('VercelLinkService', `Starting status check for ${urls.length} URLs using Vercel API`);

    // Filter out invalid URLs first
    const validUrls = urls.filter(url => url && typeof url === 'string' &&
      (url.startsWith('http://') || url.startsWith('https://') || url.includes('.')));

    // Process non-http URLs or empty ones directly
    const invalidUrls = urls.filter(url => !validUrls.includes(url));

    // Initialize results object with invalid URLs
    const results = {};
    invalidUrls.forEach(url => {
      if (!url) {
        results[url] = { status: 'empty', statusCode: null };
      } else if (url === '#') {
        results[url] = { status: 'hash-only', statusCode: null };
      } else {
        results[url] = { status: 'invalid URL', statusCode: null };
      }
    });

    // Call progress callback with initial invalid URLs if provided
    if (onBatchComplete && typeof onBatchComplete === 'function' && Object.keys(results).length > 0) {
      logger.info('VercelLinkService', `Reporting initial progress with ${Object.keys(results).length} invalid URLs`);
      onBatchComplete({...results});
    }

    // Process valid URLs in batches
    const batches = [];
    for (let i = 0; i < validUrls.length; i += this.MAX_BATCH_SIZE) {
      batches.push(validUrls.slice(i, i + this.MAX_BATCH_SIZE));
    }

    // Track total processed URLs for progress reporting
    let processedCount = Object.keys(results).length;
    const totalUrls = urls.length;

    // Process each batch with delay between them
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info('VercelLinkService', `Processing batch ${i+1}/${batches.length} with ${batch.length} URLs`);

      try {
        const batchResults = await this.checkUrlBatch(batch);

        // Add batch results to overall results
        Object.keys(batchResults).forEach(url => {
          results[url] = batchResults[url];
        });

        // Update processed count
        processedCount += Object.keys(batchResults).length;
        logger.info('VercelLinkService', `Progress: ${processedCount}/${totalUrls} URLs processed`);

        // Call batch completion callback if provided
        if (onBatchComplete && typeof onBatchComplete === 'function') {
          onBatchComplete({...results});
        }

        // Add delay between batches if not the last batch
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
        }
      } catch (error) {
        logger.error('VercelLinkService', `Error processing batch ${i+1}:`, error);

        // Mark all URLs in this batch as error
        batch.forEach(url => {
          results[url] = {
            status: 'error',
            statusCode: null,
            error: error.message || 'Batch processing error'
          };
        });

        // Update processed count even for errors
        processedCount += batch.length;
        logger.info('VercelLinkService', `Progress (with errors): ${processedCount}/${totalUrls} URLs processed`);

        // Still call the batch completion callback with partial results
        if (onBatchComplete && typeof onBatchComplete === 'function') {
          onBatchComplete({...results});
        }
      }
    }

    logger.info('VercelLinkService', `Completed status check for ${urls.length} URLs`);
    return results;
  }

  /**
   * Sends a batch of URLs to Vercel API for status checking
   *
   * @param {Array<string>} urlBatch - Array of URLs to check (max 20)
   * @returns {Promise<Object>} - Map of URL to status information
   */
  async checkUrlBatch(urlBatch) {
    if (!urlBatch || urlBatch.length === 0) {
      return {};
    }

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urls: urlBatch })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Convert API response to our internal format
      const formattedResults = {};
      data.forEach(item => {
        const status = this.parseStatus(item.status);
        formattedResults[item.url] = {
          status: status.type,
          statusCode: status.code,
          error: status.error
        };
      });

      return formattedResults;
    } catch (error) {
      logger.error('VercelLinkService', 'Error checking URL batch:', error);
      throw error;
    }
  }

  /**
   * Parses status from API response into our internal format
   *
   * @param {number|string} status - Status from API
   * @returns {Object} - Parsed status { type, code, error }
   */
  parseStatus(status) {
    // Handle numeric status codes
    if (typeof status === 'number') {
      if (status >= 200 && status < 300) {
        return { type: 'available', code: status, error: null };
      } else if (status >= 300 && status < 400) {
        return { type: 'redirect', code: status, error: null };
      } else if (status >= 400) {
        return { type: 'error', code: status, error: `HTTP ${status}` };
      }
    }

    // Handle string status (error messages)
    if (typeof status === 'string') {
      if (status.toLowerCase().includes('timeout')) {
        return { type: 'error', code: null, error: 'Request timed out' };
      } else if (status.toLowerCase().includes('error')) {
        return { type: 'error', code: null, error: status };
      }
    }

    // Default case
    return { type: 'unknown', code: null, error: null };
  }
}

// Export as singleton
export const VercelLinkService = new VercelLinkServiceClass();
