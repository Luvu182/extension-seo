'use strict';

// Import dependencies
import { store } from '../store.js';

// Define message types constants
const MESSAGE_TYPES = {
    FETCH_SERVER: 'fetchServerDetails'
};

/**
 * Service for handling server details
 */
export const serverService = {
    /**
     * Fetch server details for a URL
     * @param {string} url - The URL to fetch server details for
     * @returns {Promise<Object>} - A promise that resolves to the server details
     */
    fetchServerDetails: async (url) => {
        if (!url) {
            return Promise.reject(new Error('No URL provided'));
        }

        console.log('[ServerService] Sending fetchServerDetails message');

        // Check if this is the first attempt (for debugging)
        const attemptCount = localStorage.getItem('serverDetailsAttemptCount') || 0;
        localStorage.setItem('serverDetailsAttemptCount', Number(attemptCount) + 1);
        console.log(`[ServerService] Server details request attempt #${Number(attemptCount) + 1}`);

        try {
            // Use Promise-based approach for better error handling
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: MESSAGE_TYPES.FETCH_SERVER,
                    url: url
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(response);
                });
            });

            console.log('[ServerService] Received response from fetchServerDetails:', response);

            if (response?.success && response.serverInfo) {
                // Debug - log all server info properties
                console.log('[ServerService] Server Info details:', JSON.stringify(response.serverInfo));

                // If we get valid data, clear attempt counter
                localStorage.removeItem('serverDetailsAttemptCount');

                // Process the server info to match our component's expected format
                const processedServerInfo = serverService.processServerInfo(response.serverInfo);

                // Save to local store
                store.saveUrlData(url, 'serverDetails', processedServerInfo);

                // Return the processed server info
                return processedServerInfo;
            } else {
                console.error('[ServerService] Server details error:', response?.error || 'No success');
                throw new Error(response?.error || 'Could not load details.');
            }
        } catch (error) {
            console.error('[ServerService] Error in fetchServerDetails:', error);
            throw error;
        }
    },

    /**
     * Get cached server details for a URL
     * @param {string} url - The URL to get server details for
     * @returns {Object|null} - The server details or null if not found
     */
    getCachedServerDetails: (url) => {
        if (!url) return null;
        return store.getUrlData(url, 'serverDetails');
    },

    /**
     * Process server info from API response to match our component's expected format
     * @param {Object} serverInfo - The raw server info from API
     * @returns {Object} - Processed server info
     */
    processServerInfo: (serverInfo) => {
        // If serverInfo is not provided or invalid, return null
        if (!serverInfo) return null;

        console.log('[ServerService] Processing server info:', serverInfo);

        // Create a processed server info object that matches our component's expected format
        const processedInfo = {};

        // Check if we're dealing with the simplified response from the message controller
        if (serverInfo.ip !== undefined) {
            // This is the simplified response from the message controller
            // Only include the most relevant properties for SEO
            if (serverInfo.ip && serverInfo.ip !== 'N/A (API Error)' && serverInfo.ip !== 'N/A (Fetch Error)') {
                processedInfo.ip = serverInfo.ip;
            }

            if (serverInfo.httpVersion && serverInfo.httpVersion !== 'N/A') {
                processedInfo.httpVersion = serverInfo.httpVersion;
            }

            if (serverInfo.server && serverInfo.server !== 'N/A') {
                processedInfo.serverSoftware = serverInfo.server;
            }

            // Add raw data for debugging
            processedInfo.rawData = serverInfo;

            console.log('[ServerService] Processed simplified server info:', processedInfo);
            return processedInfo;
        }

        // If we have the full API response, process it
        const {
            target,
            hostname,
            port,
            protocol,
            dns_info,
            http_info
        } = serverInfo;

        // Add basic info if available
        if (dns_info?.main_ip) processedInfo.ip = dns_info.main_ip;
        if (hostname) processedInfo.hostname = hostname;
        if (target && !hostname) processedInfo.hostname = target;
        if (port) processedInfo.port = port;
        if (protocol) processedInfo.protocol = protocol;

        // Add HTTP info if available
        if (http_info?.highest_version) processedInfo.httpVersion = http_info.highest_version;
        if (http_info?.server) processedInfo.serverSoftware = http_info.server;

        // Add HTTP headers if available
        if (http_info?.headers) {
            // Server software from headers takes precedence
            if (http_info.headers['server']) {
                processedInfo.serverSoftware = http_info.headers['server'];
            }

            if (http_info.headers['content-type']) {
                processedInfo.contentType = http_info.headers['content-type'];
            }

            if (http_info.headers['content-encoding']) {
                processedInfo.contentEncoding = http_info.headers['content-encoding'];
            }

            if (http_info.headers['cache-control']) {
                processedInfo.cacheControl = http_info.headers['cache-control'];
            }
        }

        // Add HTTP status code if available
        if (http_info?.all_versions?.http1?.status_code) {
            processedInfo.statusCode = http_info.all_versions.http1.status_code;
        }

        // Add DNS information if available
        if (dns_info?.all_ips) {
            if (dns_info.all_ips.ipv4 && dns_info.all_ips.ipv4.length > 0) {
                processedInfo.ipv4Addresses = dns_info.all_ips.ipv4.join(', ');
            }

            if (dns_info.all_ips.ipv6 && dns_info.all_ips.ipv6.length > 0) {
                processedInfo.ipv6Addresses = dns_info.all_ips.ipv6.join(', ');
            }
        }

        // Add IP version if available
        if (dns_info?.ip_version) {
            processedInfo.ipVersion = dns_info.ip_version;
        }

        // Add raw data for debugging
        processedInfo.rawData = serverInfo;

        console.log('[ServerService] Processed server info:', processedInfo);
        return processedInfo;
    }
};
