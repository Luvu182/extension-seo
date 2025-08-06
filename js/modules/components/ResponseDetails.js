'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component for displaying response details
 * @param {Object} data - The page data containing response information
 * @returns {React.Element} - The response details component
 */
export const ResponseDetails = ({ data }) => {
    // Helper function to render a detail item
    const renderDetailItem = (label, value, color) => {
        // Debug log to see what values are being passed
        console.log(`[ResponseDetails] Rendering ${label} with value:`, value);

        return React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-start', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' } },
            React.createElement('div', { style: { color: '#94a3b8', minWidth: '140px', textAlign: 'left' } }, label),
            React.createElement('div', { style: { color: color || '#e2e8f0', fontWeight: 'normal', textAlign: 'left', flex: '1' } }, value || 'N/A')
        );
    };

    // Helper function to format URLs (truncate if too long)
    const formatUrl = function(url) {
        if (!url) return 'N/A';
        try {
            // Try to create a URL object
            const urlObj = new URL(url);
            // Format: hostname + pathname (truncated if needed)
            const hostname = urlObj.hostname;
            const pathname = urlObj.pathname;
            const search = urlObj.search;

            // Truncate pathname if it's too long
            const maxPathLength = 25;
            const truncatedPath = pathname.length > maxPathLength ?
                pathname.substring(0, maxPathLength) + '...' :
                pathname;

            // Truncate search if it's too long
            const maxSearchLength = 15;
            const truncatedSearch = search.length > maxSearchLength ?
                search.substring(0, maxSearchLength) + '...' :
                search;

            return `${hostname}${truncatedPath}${truncatedSearch}`;
        } catch (e) {
            // If URL parsing fails, return the original URL truncated
            return url.length > 40 ? url.substring(0, 40) + '...' : url;
        }
    };

    // Extract response data
    const responseStatusCode = data.statusCode || 200;

    // Handle edge case: if redirect exists but redirectData is missing, try to build it
    if (data.redirect) {
        console.log('ResponseDetails: Fixing missing redirectData');

        try {
            // Handle case where we have newer format with initialUrl
            if (data.redirect.initialUrl && data.redirect.url && !data.redirect.fromUrl) {
                console.log('ResponseDetails: New format detected with initialUrl/url');
                data.redirect.fromUrl = data.redirect.initialUrl;
                data.redirect.toUrl = data.redirect.url;
                data.redirect.statusCode = 301; // Assume 301 for navigation
            }

            // Now check for fromUrl/toUrl again
            if ((!data.redirect.redirectData || !data.redirect.redirectData.length) &&
                data.redirect.fromUrl && data.redirect.toUrl) {
                // Create redirectData object from the available properties
                data.redirect.redirectData = [{
                    fromUrl: data.redirect.fromUrl,
                    toUrl: data.redirect.toUrl,
                    statusCode: data.redirect.statusCode || 301, // Default to 301 if not specified
                    finalStatusCode: data.statusCode || 200      // Use page status code
                }];

                // If urls and statusCodes arrays exist, also include them
                if (!data.redirect.urls && data.redirect.fromUrl && data.redirect.toUrl) {
                    data.redirect.urls = [data.redirect.fromUrl, data.redirect.toUrl];
                }

                if (!data.redirect.statusCodes && data.redirect.statusCode) {
                    data.redirect.statusCodes = [data.redirect.statusCode, data.statusCode || 200];
                }

                // Force redirect count to be at least 1 if we have fromUrl and toUrl
                if (!data.redirect.count || data.redirect.count < 1) {
                    data.redirect.count = 1;
                }

                console.log('ResponseDetails: Fixed redirectData:', JSON.stringify(data.redirect.redirectData));
            }
        } catch (e) {
            console.error('ResponseDetails: Error fixing redirectData:', e);
        }
    }

    // Determine status color based on status code range
    let statusColor = '#10b981'; // Default green for 200 OK
    if (responseStatusCode >= 300 && responseStatusCode < 400) {
        statusColor = '#f59e0b'; // Orange for redirects (3xx)
    } else if (responseStatusCode >= 400) {
        statusColor = '#ef4444'; // Red for client/server errors (4xx/5xx)
    }

    // Function to create a redirect chain element
    const createRedirectChainElement = function() {
        console.log('[ResponseDetails] Creating redirect chain with data:', data.redirect);

        // If we made it here, the redirect data already passed extreme validation
        // Just do a quick sanity check to ensure the redirectData exists and has content
        if (!data.redirect?.redirectData || !data.redirect.redirectData.length) {
            console.log('[ResponseDetails] No redirect data content to display');
            return null;
        }
        
        // Log the data we're using to create the chain
        console.log('[ResponseDetails] Creating redirect chain with validated data:', data.redirect);

        // Special case for navigation type redirect with initialUrl/url
        if (data.redirect?.initialUrl && data.redirect?.url &&
            data.redirect.initialUrl !== data.redirect.url) {
            console.log('[ResponseDetails] Using initialUrl/url format for navigation');

            // Create a simple redirect display with navigation type
            return React.createElement('div', { style: { width: '100%', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' } },
                // First URL (initialUrl)
                React.createElement('div', null,
                    React.createElement('span', { style: { color: '#94a3b8' } },
                        formatUrl(data.redirect.initialUrl)),
                    React.createElement('span', { style: { color: '#f59e0b', fontWeight: 'bold' } },
                        ` : ${data.redirect.statusCode || 301} (${data.redirect.navigationType || 'redirect'})`)
                ),
                // Arrow
                React.createElement('div', { style: { marginLeft: '10px', color: '#94a3b8' } }, '↓'),
                // Final URL (url)
                React.createElement('div', null,
                    React.createElement('span', { style: { color: '#10b981' } },
                        formatUrl(data.redirect.url)),
                    React.createElement('span', { style: { color: '#10b981', fontWeight: 'bold' } },
                        ` : ${data.statusCode || 200}`)
                )
            );
        }
        // Standard case with redirectData
        else if (data.redirect?.redirectData && data.redirect.redirectData.length > 0) {
            console.log('[ResponseDetails] Using redirectData format with', data.redirect.redirectData.length, 'hops');

            // Modern detailed format with redirectData
            return React.createElement('div', { style: { width: '100%', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' } },
                data.redirect.redirectData.map(function(hop, index) {
                    // Format each hop with URLs and status codes
                    const isRedirect = hop.statusCode >= 300 && hop.statusCode < 400;
                    const statusColor = isRedirect ? '#f59e0b' : hop.statusCode >= 400 ? '#ef4444' : '#10b981';

                    // Create a row for this hop
                    return React.createElement('div', {
                        key: `hop-${index}`,
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: index < data.redirect.redirectData.length - 1 ? '8px' : '0'
                        }
                    },
                        // First line: from URL with status code
                        React.createElement('div', null,
                            React.createElement('span', {
                                style: {
                                    color: index === 0 ? '#94a3b8' : statusColor,
                                    fontWeight: isRedirect ? 'bold' : 'normal'
                                }
                            },
                            formatUrl(hop.fromUrl)),
                            React.createElement('span', { style: { color: statusColor, fontWeight: 'bold' } },
                                ` : ${hop.statusCode}`),
                        ),
                        // Arrow down
                        index < data.redirect.redirectData.length - 1 &&
                        React.createElement('div', { style: { marginLeft: '10px', color: '#94a3b8' } }, '↓'),
                        // Only show the final URL for the last hop
                        index === data.redirect.redirectData.length - 1 &&
                        React.createElement('div', null,
                            React.createElement('span', { style: { color: '#10b981' } },
                                formatUrl(hop.toUrl)),
                            hop.finalStatusCode && React.createElement('span', { style: { color: '#10b981', fontWeight: 'bold' } },
                                ` : ${hop.finalStatusCode || data.statusCode || 200}`)
                        )
                    );
                })
            );
        } else if (data.redirect?.count > 0 && data.redirect?.fromUrl && data.redirect?.toUrl) {
            // Fallback simpler format
            return React.createElement('div', { style: { width: '100%', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' } },
                // First URL (from)
                React.createElement('div', null,
                    React.createElement('span', { style: { color: '#94a3b8' } }, formatUrl(data.redirect.fromUrl)),
                    React.createElement('span', { style: { color: '#f59e0b', fontWeight: 'bold' } },
                        ` : ${data.redirect.statusCode || 301}`)
                ),
                // Arrow
                React.createElement('div', { style: { marginLeft: '10px', color: '#94a3b8' } }, '↓'),
                // Final URL (to)
                React.createElement('div', null,
                    React.createElement('span', { style: { color: '#10b981' } }, formatUrl(data.redirect.toUrl)),
                    React.createElement('span', { style: { color: '#10b981', fontWeight: 'bold' } },
                        ` : ${data.statusCode || 200}`)
                )
            );
        }
        return null;
    };

    // GENERIC VALIDATION: Apply to all websites equally
    if (data.redirect) {
        console.log('[ResponseDetails] Validating redirect data');
        
        // Basic validation that all redirects should pass
        const hasValidStatusCode = data.redirect.statusCode >= 300 && data.redirect.statusCode < 400;
        const hasValidCount = data.redirect.count && data.redirect.count > 0;
        const hasValidRedirectData = data.redirect.redirectData && 
                                   data.redirect.redirectData.length > 0 && 
                                   data.redirect.redirectData[0].fromUrl &&
                                   data.redirect.redirectData[0].toUrl;
        
        // If any validation fails, just set count to 0 instead of deleting
        if (!hasValidStatusCode || !hasValidCount || !hasValidRedirectData) {
            console.log('[ResponseDetails] Setting count to 0 for invalid redirect:', {
                hasValidStatusCode, 
                hasValidCount, 
                hasValidRedirectData
            });
            data.redirect.count = 0;
        } else {
            console.log('[ResponseDetails] Valid redirect data with count', data.redirect.count);
        }
    }
    
    // Debug log redirect data with full detail
    if (data.redirect) {
        console.log('ResponseDetails: Redirect data received:', JSON.stringify(data.redirect));

        // Add additional debug logs to help diagnose issues
        if (data.redirect.redirectData) {
            console.log('ResponseDetails: redirectData length:', data.redirect.redirectData.length);
            console.log('ResponseDetails: First redirectData item:', JSON.stringify(data.redirect.redirectData[0]));
        } else {
            console.log('ResponseDetails: No redirectData array found');
        }

        if (data.redirectChain) {
            console.log('ResponseDetails: Raw redirectChain available with length:', data.redirectChain.length);
        }
        
        // Special debug log for navigation vs actual redirect
        if (data.redirect.count === 0 || (data.redirect.navigationType && data.redirect.navigationType === 'navigation')) {
            console.log('ResponseDetails: This appears to be a navigation, not a redirect');
        }
    } else {
        console.log('ResponseDetails: No redirect data available');
    }

    // Render the response details section
    return React.createElement('div', { style: styles.cardSection },
        React.createElement('div', { style: styles.cardTitle }, 'Response Details'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
            renderDetailItem('Status Code', responseStatusCode, statusColor),

            // Always show redirect count if we have redirect data with a count > 0
            // BALANCED: Only show if redirect data exists AND has count > 0
            (data.redirect && data.redirect.count > 0) ? 
                renderDetailItem('Redirect Count',
                    `${data.redirect.count} ${data.redirect.totalHops ? `(${data.redirect.totalHops} total hops)` : ''}`) : 
                null,

            // BALANCED APPROACH: Only show if redirect data exists AND has count > 0
            (data.redirect && data.redirect.count > 0) ? 
                renderDetailItem('Redirect Chain', createRedirectChainElement()) : 
                null,

            // Other details
            data.contentType && renderDetailItem('Content Type', data.contentType),
            data.contentLength && renderDetailItem('Content Length', `${Math.round(data.contentLength / 1024)} KB`),
            data.loadTime && renderDetailItem('Load Time', `${data.loadTime.toFixed(2)} seconds`)
        )
    );
};
