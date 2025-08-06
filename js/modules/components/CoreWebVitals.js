'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component for displaying Core Web Vitals
 * @param {Object} data - The page data containing web vitals information
 * @returns {React.Element} - The Core Web Vitals component
 */
export const CoreWebVitals = ({ data }) => {
    // Try to read web vitals from multiple possible locations
    let webVitals = {
        lcp: undefined,
        cls: undefined,
        fid: undefined,
        ttfb: undefined
    };

    // Merge web vitals data from different sources
    if (data.webVitals) {
        // Log the raw web vitals data for debugging
        console.log('[CoreWebVitals] Raw web vitals data:', data.webVitals);

        // Deep copy to avoid modifying the original data
        const rawWebVitals = JSON.parse(JSON.stringify(data.webVitals));
        
        // CRITICAL FIX: Always use the properly converted display values
        // that have already been processed by WebVitalsAnalyzer
        
        // Clear log of the actual incoming values
        if (rawWebVitals.lcp !== undefined) console.log('[CoreWebVitals] Incoming LCP:', rawWebVitals.lcp);
        if (rawWebVitals.ttfb !== undefined) console.log('[CoreWebVitals] Incoming TTFB:', rawWebVitals.ttfb);
        if (rawWebVitals.fid !== undefined) console.log('[CoreWebVitals] Incoming FID:', rawWebVitals.fid);
        if (rawWebVitals.cls !== undefined) console.log('[CoreWebVitals] Incoming CLS:', rawWebVitals.cls);
        
        // Use the values directly - at this point they should already be:
        // - LCP in seconds (capped at 10s) 
        // - TTFB in seconds (capped at 5s)
        // - FID in milliseconds (capped at 1000ms)
        // - CLS as unitless (capped at 1.0)
        webVitals = { ...webVitals, ...rawWebVitals };

        // Log the final web vitals data that will be displayed
        console.log('[CoreWebVitals] Final web vitals data for display:', webVitals);
    }

    if (data.metrics) {
        // If metrics has web vitals data, merge it
        // This data could come from different sources with different units
        const { lcp, cls, fid, ttfb } = data.metrics;

        // Log all metrics for debugging
        console.log('[CoreWebVitals] Data from metrics:', { lcp, cls, fid, ttfb });
        
        // Check if we have enhanced metadata about units
        const hasMetaData = data.metrics.rawUnits || data.metrics.displayUnits;
        console.log('[CoreWebVitals] Has unit metadata:', hasMetaData);
        
        // LCP (Largest Contentful Paint) processing
        if (lcp !== undefined) {
            console.log('[CoreWebVitals] Processing LCP value:', lcp);
            
            // Check if the value is in milliseconds (web-vitals reports in ms)
            if (lcp > 100) {
                // Definitely in milliseconds, needs conversion
                webVitals.lcp = parseFloat((lcp / 1000).toFixed(2));
                console.log('[CoreWebVitals] Converted LCP from ms to s:', lcp, 'ms →', webVitals.lcp, 's');
            } else {
                // Already in reasonable seconds range or previously converted
                webVitals.lcp = parseFloat(lcp.toFixed(2));
                console.log('[CoreWebVitals] Using LCP value as is:', webVitals.lcp, 's');
            }
            
            // Safety cap at 10s for display purposes
            if (webVitals.lcp > 10) {
                console.log('[CoreWebVitals] Capping LCP at 10s:', webVitals.lcp, '→ 10.0s');
                webVitals.lcp = 10.0;
            }
        }

        // CLS (Cumulative Layout Shift) processing
        if (cls !== undefined) {
            console.log('[CoreWebVitals] Processing CLS value:', cls);
            
            // CLS is unitless and typically a small decimal
            webVitals.cls = parseFloat(parseFloat(cls).toFixed(2));
            
            // Safety cap at 1.0
            if (webVitals.cls > 1) {
                console.log('[CoreWebVitals] Capping CLS at 1.0:', cls, '→ 1.0');
                webVitals.cls = 1.0;
            }
        }

        // FID (First Input Delay) processing
        if (fid !== undefined) {
            console.log('[CoreWebVitals] Processing FID value:', fid);
            
            // FID should be in milliseconds
            if (fid < 1 && fid > 0) {
                // Too small for milliseconds, probably in seconds
                webVitals.fid = Math.round(fid * 1000);
                console.log('[CoreWebVitals] Converted FID from s to ms:', fid, 's →', webVitals.fid, 'ms');
            } else {
                // Already in reasonable milliseconds range
                webVitals.fid = Math.round(fid);
                console.log('[CoreWebVitals] Using FID value as is:', webVitals.fid, 'ms');
            }
            
            // Safety cap at 1000ms
            if (webVitals.fid > 1000) {
                console.log('[CoreWebVitals] Capping FID at 1000ms:', webVitals.fid, '→ 1000ms');
                webVitals.fid = 1000;
            }
        }

        // TTFB (Time To First Byte) processing
        if (ttfb !== undefined) {
            console.log('[CoreWebVitals] Processing TTFB value:', ttfb);
            
            // Check if in milliseconds (web-vitals reports TTFB in ms)
            if (ttfb > 100) {
                // Definitely in milliseconds, needs conversion
                webVitals.ttfb = parseFloat((ttfb / 1000).toFixed(2));
                console.log('[CoreWebVitals] Converted TTFB from ms to s:', ttfb, 'ms →', webVitals.ttfb, 's');
            } else {
                // Already in reasonable seconds range or previously converted
                webVitals.ttfb = parseFloat(ttfb.toFixed(2));
                console.log('[CoreWebVitals] Using TTFB value as is:', webVitals.ttfb, 's');
            }
            
            // Safety cap at 5s
            if (webVitals.ttfb > 5) {
                console.log('[CoreWebVitals] Capping TTFB at 5s:', webVitals.ttfb, '→ 5.0s');
                webVitals.ttfb = 5.0;
            }
        }
        
        // Log the finalized metrics
        console.log('[CoreWebVitals] Processed metrics:', {
            lcp: webVitals.lcp + 's',
            cls: webVitals.cls,
            fid: webVitals.fid + 'ms',
            ttfb: webVitals.ttfb + 's'
        });

        // Log the metrics for debugging
        console.log('[CoreWebVitals] Original metrics:', data.metrics);
        console.log('[CoreWebVitals] Final metrics for display:', webVitals);
    }

    // Helper function to create a vital item
    const createVitalItem = (key, label, unit, thresholds) => {
        let value = webVitals[key];
        let displayValue = '';
        let color = '#9ca3af'; // Default gray
        
        // Fix critical issue: values might still be in milliseconds here!
        // This is our last chance to convert before display
        if (typeof value === 'number') {
            // For timing metrics that should be in seconds but are likely in ms
            if ((key === 'lcp' || key === 'ttfb') && value > 100) {
                const oldValue = value;
                value = parseFloat((value / 1000).toFixed(2));
                console.log(`[CoreWebVitals] Last-minute conversion of ${key} from ms to s: ${oldValue}ms → ${value}s`);
            }
            
            // Apply sanity checks with the correctly converted values
            let safeValue = value;
            if (key === 'lcp' && value > 10) {
                console.warn(`[CoreWebVitals] LCP value too large: ${value}s, capping at 10s for display`);
                safeValue = 10;
            } else if (key === 'ttfb' && value > 5) {
                console.warn(`[CoreWebVitals] TTFB value too large: ${value}s, capping at 5s for display`);
                safeValue = 5;
            } else if (key === 'fid' && value > 1000) {
                console.warn(`[CoreWebVitals] FID value too large: ${value}ms, capping at 1000ms for display`);
                safeValue = 1000;
            }
            
            // Format the value based on the metric
            if (key === 'cls') {
                // CLS is unitless and should be displayed with 2 decimal places
                displayValue = safeValue.toFixed(2);
            } else if (key === 'fid') {
                // FID is in milliseconds, display as integer
                displayValue = Math.round(safeValue) + (unit ? ` ${unit}` : '');
            } else {
                // LCP and TTFB are in seconds, display with 1 decimal place
                displayValue = safeValue.toFixed(1) + (unit ? ` ${unit}` : '');
            }

            // The thresholds are based on the correctly converted units:
            // - LCP: good ≤ 2.5s, needs improvement ≤ 4.0s (seconds)
            // - TTFB: good ≤ 0.8s, needs improvement ≤ 1.8s (seconds)
            // - FID: good ≤ 100ms, needs improvement ≤ 300ms (milliseconds)
            // - CLS: good ≤ 0.1, needs improvement ≤ 0.25 (unitless)
            
            // Determine color based on thresholds
            if (thresholds && thresholds.good !== undefined) {
                if (safeValue <= thresholds.good) color = '#10b981';
                else if (safeValue <= thresholds.needsImprovement) color = '#f59e0b';
                else color = '#ef4444';
            }
        } else if (value === undefined) {
            displayValue = '...';
            color = '#9ca3af';
        } else {
            // Handle other non-numeric cases
            displayValue = 'N/A';
            color = '#ef4444';
        }

        // Create the vital item element
        return React.createElement('div', { key: key, style: styles.statItem },
            React.createElement('div', { style: styles.statLabel }, label),
            React.createElement('div', { style: { ...styles.statValue, color: color } }, displayValue)
        );
    };

    // Render the Core Web Vitals section
    return React.createElement('div', { style: { ...styles.cardSection, flex: '1', minWidth: '0' } },
        React.createElement('div', { style: styles.cardTitle }, 'Core Web Vitals'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' } },
            createVitalItem('lcp', 'LCP', 's', { good: 2.5, needsImprovement: 4.0 }),
            createVitalItem('fid', 'FID', 'ms', { good: 100, needsImprovement: 300 }),
            createVitalItem('cls', 'CLS', '', { good: 0.1, needsImprovement: 0.25 }),
            createVitalItem('ttfb', 'TTFB', 's', { good: 0.8, needsImprovement: 1.8 })
        )
    );
};
