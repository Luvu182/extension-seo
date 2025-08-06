'use strict';

/**
 * Service for handling link-related operations
 */
export const linkService = {
    /**
     * Check status of multiple links
     * @param {Array} links - Array of link objects to check
     * @param {Function} onBatchComplete - Callback function to call after each batch is complete
     * @param {Function} onProgress - Callback function for overall progress updates
     * @param {boolean} useTurboMode - Whether to use the optimized batch API (turbo mode)
     * @returns {Object} Object with URL as key and status info as value
     */
    async checkLinksStatus(links, onBatchComplete = null, onProgress = null, useTurboMode = false) {
        const statuses = {};

        // Get URLs from link objects
        const urls = links
            .filter(link => link.href && typeof link.href === 'string')
            .map(link => link.href);

        if (urls.length === 0) {
            console.warn('No valid URLs to check');
            return statuses;
        }

        // Process URLs in batches of 20
        const BATCH_SIZE = 20;
        const batches = [];

        // Split URLs into batches
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            batches.push(urls.slice(i, i + BATCH_SIZE));
        }

        console.log(`Split ${urls.length} URLs into ${batches.length} batches of max ${BATCH_SIZE} URLs each`);
        console.log(`Using ${useTurboMode ? 'TURBO' : 'INDIVIDUAL'} mode for link checking`);

        // Process each batch sequentially
        let processedCount = 0;
        const totalUrls = urls.length;

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchLinks = links.filter(link => link.href && batch.includes(link.href));

            console.log(`Processing batch ${i+1}/${batches.length} with ${batch.length} URLs`);

            // Report progress
            if (onProgress) {
                onProgress({
                    currentBatch: i + 1,
                    totalBatches: batches.length,
                    processedUrls: processedCount,
                    totalUrls: totalUrls,
                    percentComplete: Math.round((processedCount / totalUrls) * 100)
                });
            }

            try {
                let batchResults;

                if (useTurboMode) {
                    // Use the optimized batch API for turbo mode
                    console.log(`Checking status for batch ${i+1} using batch API (TURBO mode)`);
                    batchResults = await this.checkMultipleUrlsWithBatchApi(batch, batchLinks, onBatchComplete);
                } else {
                    // Use individual checking for standard mode
                    console.log(`Checking status for batch ${i+1} using individual checks (STANDARD mode)`);
                    batchResults = await this.checkLinksStatusIndividually(batchLinks, onBatchComplete);
                }

                // Merge batch results into overall results
                Object.assign(statuses, batchResults);

                // Update processed count
                processedCount += batch.length;

            } catch (error) {
                console.error(`Error checking batch ${i+1}:`, error);

                // If turbo mode failed, fall back to individual checks
                if (useTurboMode) {
                    console.log(`Falling back to individual checks for batch ${i+1}`);
                    try {
                        const fallbackResults = await this.checkLinksStatusIndividually(batchLinks, onBatchComplete);
                        Object.assign(statuses, fallbackResults);
                    } catch (fallbackError) {
                        console.error(`Fallback also failed for batch ${i+1}:`, fallbackError);
                        // Mark all links in this batch as error
                        batchLinks.forEach(link => {
                            if (link.href) {
                                statuses[link.href] = {
                                    status: 'error',
                                    statusCode: null,
                                    error: 'Failed to check link status'
                                };
                            }
                        });

                        // Update UI with errors
                        if (onBatchComplete) {
                            try {
                                onBatchComplete({...statuses});
                            } catch (callbackError) {
                                console.error('Error in batch error callback:', callbackError);
                            }
                        }
                    }
                } else {
                    // Mark all links in this batch as error
                    batchLinks.forEach(link => {
                        if (link.href) {
                            statuses[link.href] = {
                                status: 'error',
                                statusCode: null,
                                error: 'Failed to check link status'
                            };
                        }
                    });

                    // Update UI with errors
                    if (onBatchComplete) {
                        try {
                            onBatchComplete({...statuses});
                        } catch (callbackError) {
                            console.error('Error in batch error callback:', callbackError);
                        }
                    }
                }

                // Update processed count
                processedCount += batch.length;
            }
        }

        // Final progress update
        if (onProgress) {
            onProgress({
                currentBatch: batches.length,
                totalBatches: batches.length,
                processedUrls: processedCount,
                totalUrls: totalUrls,
                percentComplete: 100
            });
        }

        return statuses;
    },

    /**
     * Check multiple URLs using the batch API
     * @param {Array<string>} urls - Array of URLs to check
     * @param {Array} linkObjects - Original link objects (used for mapping back)
     * @param {Function} onBatchComplete - Optional callback for progress updates
     * @returns {Object} - Status results
     */
    async checkMultipleUrlsWithBatchApi(urls, linkObjects, onBatchComplete = null) {
        const statuses = {};

        // Initialize non-HTTP URLs with appropriate status
        linkObjects.forEach(link => {
            if (!link.href) {
                statuses[link.href] = { status: 'empty', statusCode: null };
            } else if (link.href === '#') {
                statuses[link.href] = { status: 'hash-only', statusCode: null };
            } else if (!link.href.startsWith('http://') && !link.href.startsWith('https://')) {
                statuses[link.href] = { status: 'invalid URL', statusCode: null };
            }
        });

        // Call progress callback with initial non-HTTP URLs
        if (onBatchComplete && Object.keys(statuses).length > 0) {
            console.log(`Reporting initial progress with ${Object.keys(statuses).length} non-HTTP URLs`);
            onBatchComplete({...statuses});
        }

        // Filter out URLs that are already processed (non-HTTP)
        const httpUrls = urls.filter(url =>
            url && typeof url === 'string' &&
            (url.startsWith('http://') || url.startsWith('https://')))

        if (httpUrls.length === 0) {
            console.log('No HTTP URLs to check, returning early with non-HTTP results');
            return statuses;
        }

        console.log(`Checking ${httpUrls.length} HTTP URLs with batch API`);

        // Use the new batch API
        return new Promise((resolve, reject) => {
            // Track if we've received the final response
            let finalResponseReceived = false;

            // Set a timeout to ensure we don't hang indefinitely
            const timeoutId = setTimeout(() => {
                if (!finalResponseReceived) {
                    console.warn('Link checking timed out after 60 seconds');
                    resolve(statuses); // Resolve with what we have so far
                }
            }, 60000); // 60 second timeout

            // Create a listener for progress updates
            const messageListener = (message) => {
                // Only process messages related to our batch check
                if (message && message.action === 'batchProgress' && message.forUrls) {
                    // Check if this progress update is for our batch
                    const isForOurBatch = message.forUrls.some(url => httpUrls.includes(url));

                    if (isForOurBatch && message.results) {
                        console.log(`Received progress update with ${Object.keys(message.results).length} results`);

                        // Merge with existing statuses
                        Object.keys(message.results).forEach(url => {
                            statuses[url] = message.results[url];
                        });

                        // Call progress callback
                        if (onBatchComplete) {
                            onBatchComplete({...statuses});
                        }
                    }

                    // Return true to keep the message channel open
                    return true;
                }
                return false;
            };

            // Add listener for progress updates
            chrome.runtime.onMessage.addListener(messageListener);

            chrome.runtime.sendMessage({
                action: "checkMultipleLinks",
                urls: httpUrls,
                reportProgress: !!onBatchComplete
            }, function(response) {
                // Remove the message listener when we're done
                chrome.runtime.onMessage.removeListener(messageListener);

                if (chrome.runtime.lastError) {
                    console.error("Error checking links:", chrome.runtime.lastError);
                    clearTimeout(timeoutId);
                    reject(chrome.runtime.lastError);
                    return;
                }

                // Handle progress updates
                if (response && !response.complete && response.progress && onBatchComplete) {
                    // Process progress update
                    const progressResults = response.progress.results;
                    const progressCount = response.progress.checked;
                    const totalCount = response.progress.total;

                    console.log(`Progress update: ${progressCount}/${totalCount} URLs checked`);

                    // Merge with existing statuses
                    Object.keys(progressResults).forEach(url => {
                        statuses[url] = progressResults[url];
                    });

                    // Call progress callback
                    onBatchComplete({...statuses});
                }

                // Handle final response
                if (response && response.complete) {
                    finalResponseReceived = true;
                    clearTimeout(timeoutId);

                    if (response.success) {
                        // Merge the results with our existing statuses
                        const results = response.results || {};
                        Object.keys(results).forEach(url => {
                            statuses[url] = results[url];
                        });

                        console.log(`Completed batch check with ${Object.keys(results).length} results`);
                        resolve(statuses);
                    } else {
                        console.error('Batch check failed:', response?.error);
                        reject(response?.error || 'Unknown error during bulk check');
                    }
                } else {
                    // If we didn't get a complete response, resolve with what we have
                    console.warn('Did not receive complete response, resolving with partial results');
                    finalResponseReceived = true;
                    clearTimeout(timeoutId);
                    resolve(statuses);
                }
            });
        });
    },

    /**
     * Legacy method: Check links individually
     * @param {Array} links - Array of link objects to check
     * @param {Function} onBatchComplete - Callback for updates
     * @returns {Object} - Status results
     */
    async checkLinksStatusIndividually(links, onBatchComplete = null) {
        const statuses = {};

        try {
            // Initialize non-HTTP URLs with appropriate status
            links.forEach(link => {
                if (!link.href) {
                    statuses[link.href] = { status: 'empty', statusCode: null };
                } else if (link.href === '#') {
                    statuses[link.href] = { status: 'hash-only', statusCode: null };
                } else if (!link.href.startsWith('http://') && !link.href.startsWith('https://')) {
                    statuses[link.href] = { status: 'invalid URL', statusCode: null };
                }
            });

            // Call progress callback with initial non-HTTP URLs
            if (onBatchComplete && Object.keys(statuses).length > 0) {
                try {
                    onBatchComplete({...statuses});
                } catch (callbackError) {
                    console.error('Error in initial callback:', callbackError);
                }
            }

            // Filter links to only include HTTP(S) URLs
            const httpLinks = links.filter(link =>
                link.href && link.href !== '#' &&
                (link.href.startsWith('http://') || link.href.startsWith('https://')))

            if (httpLinks.length === 0) {
                return statuses;
            }

            // Check statuses in batches of 5 to avoid overwhelming the browser
            const batchSize = 5;

            // Create a tracking array of links that need to be checked
            const linksToCheck = [...httpLinks];

            // Mark all HTTP links as 'checking' initially
            httpLinks.forEach(link => {
                statuses[link.href] = { status: 'checking', statusCode: null };
            });

            // Report initial 'checking' status
            if (onBatchComplete) {
                try {
                    onBatchComplete({...statuses});
                } catch (callbackError) {
                    console.error('Error in checking status callback:', callbackError);
                }
            }

            // Process links in batches until all are checked
            let batchIndex = 0;
            while (linksToCheck.length > 0) {
                // Take the next batch of links
                const batch = linksToCheck.splice(0, batchSize);
                batchIndex++;

                try {
                    // Process each link in the batch sequentially to avoid race conditions
                    for (const link of batch) {
                        try {
                            const result = await this.checkSingleLink(link.href);

                            if (result && result.url) {
                                statuses[result.url] = {
                                    status: result.status,
                                    statusCode: result.statusCode,
                                    error: result.error
                                };

                                // Update after each individual link for better UI feedback
                                if (onBatchComplete) {
                                    try {
                                        onBatchComplete({...statuses});
                                    } catch (callbackError) {
                                        console.error('Error in link update callback:', callbackError);
                                    }
                                }
                            }
                        } catch (linkError) {
                            console.error(`Error checking link ${link.href}:`, linkError);

                            // Mark this link as error
                            statuses[link.href] = {
                                status: 'error',
                                statusCode: null,
                                error: linkError.message || 'Unknown error during check'
                            };

                            // Still update UI
                            if (onBatchComplete) {
                                try {
                                    onBatchComplete({...statuses});
                                } catch (callbackError) {
                                    console.error('Error in error callback:', callbackError);
                                }
                            }
                        }

                        // Small delay between individual links
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    // Add a small delay between batches
                    if (linksToCheck.length > 0) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                } catch (batchError) {
                    console.error('Error processing batch:', batchError);

                    // Mark all links in this batch as error
                    batch.forEach(link => {
                        statuses[link.href] = {
                            status: 'error',
                            statusCode: null,
                            error: batchError.message || 'Batch processing error'
                        };
                    });

                    // Update UI with errors
                    if (onBatchComplete) {
                        try {
                            onBatchComplete({...statuses});
                        } catch (callbackError) {
                            console.error('Error in batch error callback:', callbackError);
                        }
                    }
                }
            }

            // Final verification - fix any links still in 'checking' state
            const stillChecking = httpLinks.filter(link =>
                statuses[link.href]?.status === 'checking'
            );

            if (stillChecking.length > 0) {
                // Fix any links still in checking state
                stillChecking.forEach(link => {
                    statuses[link.href] = {
                        status: 'unknown',
                        statusCode: null,
                        error: 'Checking timed out or failed to complete'
                    };
                });

                // Final callback with fixed statuses
                if (onBatchComplete) {
                    try {
                        onBatchComplete({...statuses});
                    } catch (callbackError) {
                        console.error('Error in final verification callback:', callbackError);
                    }
                }
            }
        } catch (error) {
            console.error('Critical error in checkLinksStatusIndividually:', error);

            // Try to recover by marking all links as error
            links.forEach(link => {
                if (link.href && (link.href.startsWith('http://') || link.href.startsWith('https://'))) {
                    statuses[link.href] = {
                        status: 'error',
                        statusCode: null,
                        error: 'Critical processing error'
                    };
                }
            });

            // Final attempt to update UI
            if (onBatchComplete) {
                try {
                    onBatchComplete({...statuses});
                } catch (callbackError) {
                    console.error('Error in critical error callback:', callbackError);
                }
            }
        }

        return statuses;
    },

    /**
     * Check status of a single link
     * @param {string} url - URL to check
     * @returns {Promise<Object>} Promise resolving to status object
     */
    checkSingleLink(url) {
        return new Promise((resolve) => {
            // Track if we've received a response
            let responseReceived = false;

            // Set a timeout to ensure we don't hang indefinitely
            const timeoutId = setTimeout(() => {
                if (!responseReceived) {
                    console.warn(`Link check timed out for ${url}`);
                    responseReceived = true;
                    resolve({
                        url,
                        status: 'timeout',
                        statusCode: null,
                        error: 'Request timed out after 10 seconds'
                    });
                }
            }, 10000); // 10 second timeout

            // Send message to background script to check URL status
            try {
                chrome.runtime.sendMessage({
                    action: "checkLinkStatus",
                    url: url
                }, (response) => {
                    // Clear the timeout since we got a response
                    clearTimeout(timeoutId);

                    // If we already resolved due to timeout, don't process the response
                    if (responseReceived) return;

                    responseReceived = true;

                    if (chrome.runtime.lastError) {
                        console.error("Error checking link status:", chrome.runtime.lastError);
                        resolve({
                            url,
                            status: 'error',
                            statusCode: null,
                            error: chrome.runtime.lastError.message
                        });
                    } else if (response && response.success) {
                        resolve({
                            url,
                            status: response.status,
                            statusCode: response.statusCode
                        });
                    } else {
                        resolve({
                            url,
                            status: 'unknown',
                            statusCode: null,
                            error: response?.error || 'Unknown error'
                        });
                    }
                });
            } catch (error) {
                // Clear the timeout
                clearTimeout(timeoutId);

                if (!responseReceived) {
                    responseReceived = true;
                    console.error("Exception sending message:", error);
                    resolve({
                        url,
                        status: 'error',
                        statusCode: null,
                        error: error.message || 'Exception sending message'
                    });
                }
            }
        });
    },

    /**
     * Export link data as JSON or CSV file
     * @param {Object} data - Link data to export
     * @param {string} format - Export format ('json' or 'csv')
     */
    exportLinkData(data, format = 'json') {
        if (format === 'json') {
            // Create JSON string
            const jsonString = JSON.stringify(data, null, 2);

            // Create blob and download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `link-data-${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } else if (format === 'csv') {
            // Convert links to CSV format
            const links = data.links || [];
            const statuses = data.linkStatuses || {};

            // Create CSV header
            let csvContent = 'URL,Text,Type,Status,Status Code,Error\n';

            // Add each link as a row
            links.forEach(link => {
                const status = statuses[link.href] || {};
                const url = link.href || '';
                const text = (link.text || '').replace(/"/g, '""'); // Escape quotes
                const type = link.type || '';
                const statusText = status.status || '';
                const statusCode = status.statusCode || '';
                const error = (status.error || '').replace(/"/g, '""'); // Escape quotes

                // Format CSV row with proper escaping
                csvContent += `"${url}","${text}","${type}","${statusText}","${statusCode}","${error}"\n`;
            });

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `link-data-${new Date().getTime()}.csv`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } else {
            console.error(`Unsupported export format: ${format}`);
        }
    },

    /**
     * Get status color based on HTTP status code
     * @param {Object} linkStatuses - Object containing status information for links
     * @param {string} url - URL to get status color for
     * @returns {string} Color hex code
     */
    getStatusColor(linkStatuses, url) {
        const status = linkStatuses[url];
        if (!status) return '#94a3b8'; // gray for unknown

        // Handle status codes
        if (status.statusCode) {
            if (status.statusCode >= 200 && status.statusCode < 300) return '#10b981'; // green for 2xx
            if (status.statusCode >= 300 && status.statusCode < 400) return '#f59e0b'; // orange for 3xx
            if (status.statusCode >= 400) return '#ef4444'; // red for 4xx/5xx
        }

        // Handle status text
        if (status.status === 'available') return '#10b981'; // green for available
        if (status.status === 'redirect') return '#f59e0b'; // orange for redirect
        if (status.status === 'error') return '#ef4444'; // red for error

        return '#94a3b8'; // gray for others
    },

    /**
     * Get status text based on HTTP status code
     * @param {Object} linkStatuses - Object containing status information for links
     * @param {string} url - URL to get status text for
     * @returns {string} Status text
     */
    getStatusText(linkStatuses, url) {
        const status = linkStatuses[url];
        if (!status) return 'Not checked';
        if (status.status === 'empty') return 'Empty URL';
        if (status.status === 'hash-only') return 'Hash only (#)';
        if (status.status === 'invalid URL') return 'Invalid URL';
        if (status.status === 'error') return 'ERR'; // Simplified error state
        if (status.status === 'redirect' || (status.statusCode >= 300 && status.statusCode < 400)) {
            return `${status.statusCode || 301}`; // Just show the code
        }
        if (status.status === 'available') return '200';
        return status.statusCode ? `${status.statusCode}` : status.status;
    },

    /**
     * Analyze links for various issues
     * @param {Array} links - Array of link objects
     * @param {Object} statuses - Object containing link status information
     * @returns {Object} Object containing categorized issues
     */
    analyzeIssues(links, statuses) {
        // Initialize issue categories
        const issues = {
            security: {
                title: 'Security Issues',
                color: '#ef4444', // red
                items: []
            },
            seo: {
                title: 'SEO Issues',
                color: '#f59e0b', // amber
                items: []
            },
            structure: {
                title: 'Structure Issues',
                color: '#60a5fa', // blue
                items: []
            },
            status: {
                title: 'Status Issues',
                color: '#8b5cf6', // purple
                items: []
            }
        };

        // Check for security issues
        const blankNoopenerIssue = links.filter(link =>
            link.type === 'external' &&
            link.target === '_blank' &&
            (!link.rel || !link.rel.includes('noopener'))
        );

        if (blankNoopenerIssue.length > 0) {
            issues.security.items.push({
                text: 'External links with target="_blank" missing noopener attribute',
                count: blankNoopenerIssue.length
            });
        }

        // Check for SEO issues
        const internalNofollow = links.filter(link =>
            link.type === 'internal' &&
            link.rel &&
            link.rel.includes('nofollow')
        );

        if (internalNofollow.length > 0) {
            issues.seo.items.push({
                text: 'Internal links with nofollow attribute',
                count: internalNofollow.length
            });
        }

        const externalDofollow = links.filter(link =>
            link.type === 'external' &&
            (!link.rel || !link.rel.includes('nofollow'))
        );

        if (externalDofollow.length > 0) {
            issues.seo.items.push({
                text: 'External links without nofollow attribute',
                count: externalDofollow.length
            });
        }

        // Check for structure issues
        const deepLinks = links.filter(link =>
            link.type === 'internal' &&
            link.depth &&
            link.depth > 3
        );

        if (deepLinks.length > 0) {
            issues.structure.items.push({
                text: 'Deep internal links (>3 levels)',
                count: deepLinks.length
            });
        }

        const emptyAnchors = links.filter(link =>
            !link.anchorText || link.anchorText.trim() === ''
        );

        if (emptyAnchors.length > 0) {
            issues.structure.items.push({
                text: 'Links with empty anchor text',
                count: emptyAnchors.length
            });
        }

        // Check for status issues (if status check has been performed)
        if (Object.keys(statuses).length > 0) {
            // Count broken links (4xx, 5xx)
            const brokenLinks = links.filter(link => {
                const status = statuses[link.href];
                return status && status.statusCode && status.statusCode >= 400;
            });

            if (brokenLinks.length > 0) {
                issues.status.items.push({
                    text: 'Broken links (4xx, 5xx status codes)',
                    count: brokenLinks.length
                });
            }

            // Count redirects (3xx)
            const redirectLinks = links.filter(link => {
                const status = statuses[link.href];
                return status && status.statusCode && status.statusCode >= 300 && status.statusCode < 400;
            });

            if (redirectLinks.length > 0) {
                issues.status.items.push({
                    text: 'Links with redirects (3xx status codes)',
                    count: redirectLinks.length
                });
            }
        }

        return issues;
    },

    /**
     * Check if link status checking is optimized with Vercel API
     * @returns {Promise<boolean>} Whether optimized checking is enabled
     */
    async isOptimizedCheckingEnabled() {
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage({
                    action: "updateLinkCheckerSettings",
                    settings: { query: true }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error querying link checker settings:", chrome.runtime.lastError);
                        resolve(true); // Default to true on error for now (better UX)
                    } else if (response && response.success && response.settings) {
                        resolve(response.settings.useVercelApi === true);
                    } else {
                        resolve(true); // Default to true if no valid response
                    }
                });
            } catch (error) {
                console.error("Exception querying link checker settings:", error);
                resolve(true); // Default to true on any exception
            }
        });
    },

    /**
     * Enable or disable optimized checking with Vercel API
     * @param {boolean} enabled - Whether to enable optimized checking
     * @returns {Promise<boolean>} Whether the setting was successfully updated
     */
    async setOptimizedChecking(enabled) {
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage({
                    action: "updateLinkCheckerSettings",
                    settings: { useVercelApi: enabled }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error updating link checker settings:", chrome.runtime.lastError);
                        resolve(false);
                    } else {
                        resolve(response && response.success === true);
                    }
                });
            } catch (error) {
                console.error("Exception updating link checker settings:", error);
                resolve(false);
            }
        });
    }
};
