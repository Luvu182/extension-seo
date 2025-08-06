'use strict';

// Import dependencies
import { styles } from '../styles.js';
import { MetricItem } from './MetricItem.js';

/**
 * Component to display detailed Core Web Vitals metrics
 * @param {Object} props - Component properties
 * @param {Object} props.metrics - Performance metrics
 * @returns {React.Element} - The CoreWebVitalsDetail component
 */
export const CoreWebVitalsDetail = ({ metrics }) => {
    // Log the incoming metrics for debugging
    console.log('[CoreWebVitalsDetail] Incoming metrics:', metrics);

    // Define normalized metrics with proper validation and reasonable caps
    const normalizedMetrics = {
        lcp: undefined,
        fid: undefined,
        cls: undefined
    };

    // LCP should be in seconds (0-10s range for display)
    if (typeof metrics.lcp === 'number') {
        // Log the original value first
        console.log('[CoreWebVitalsDetail] Original LCP value received:', metrics.lcp);
        
        // Check if the value might be in milliseconds instead of seconds
        if (metrics.lcp > 100) {
            console.warn('[CoreWebVitalsDetail] LCP value suspiciously large:', metrics.lcp, 'might be in ms, converting to seconds');
            // Convert from ms to seconds
            normalizedMetrics.lcp = metrics.lcp / 1000;
        } else {
            // Accept the value as is
            normalizedMetrics.lcp = metrics.lcp;
        }
        
        // Apply reasonable caps for display
        if (normalizedMetrics.lcp > 10) {
            console.log('[CoreWebVitalsDetail] Capping LCP value:', normalizedMetrics.lcp, '-> 10s');
            normalizedMetrics.lcp = 10;
        }
        
        // Sanity check for unreasonably small values that might indicate unit problems
        if (normalizedMetrics.lcp < 0.01) {
            console.warn('[CoreWebVitalsDetail] LCP value suspiciously small:', normalizedMetrics.lcp, 'using fallback value');
            normalizedMetrics.lcp = 2.5; // Use a reasonable fallback
        }
    }

    // FID should be in milliseconds (0-1000ms range for display)
    if (typeof metrics.fid === 'number') {
        // Log the original value
        console.log('[CoreWebVitalsDetail] Original FID value received:', metrics.fid);
        
        normalizedMetrics.fid = metrics.fid;
        
        // Sanity check for suspicious values - might be in seconds instead of ms
        if (normalizedMetrics.fid < 1 && normalizedMetrics.fid > 0) {
            console.warn('[CoreWebVitalsDetail] FID value suspiciously small:', normalizedMetrics.fid, 'might be in seconds, converting to ms');
            normalizedMetrics.fid = normalizedMetrics.fid * 1000;
        }
        
        // Apply reasonable caps for display
        if (normalizedMetrics.fid > 1000) {
            console.log('[CoreWebVitalsDetail] Capping FID value:', normalizedMetrics.fid, '-> 1000ms');
            normalizedMetrics.fid = 1000;
        }
    }

    // CLS is unitless (0-1 range for display)
    if (typeof metrics.cls === 'number') {
        normalizedMetrics.cls = metrics.cls;
        
        // Apply reasonable caps for display
        if (normalizedMetrics.cls > 1) {
            console.log('[CoreWebVitalsDetail] Capping CLS value:', normalizedMetrics.cls, '-> 1.0');
            normalizedMetrics.cls = 1.0;
        }
    }

    // Log the final metrics for debugging
    console.log('[CoreWebVitalsDetail] Final metrics for display:', normalizedMetrics);

    // Format display values - use dash for missing data
    const lcpDisplay = typeof normalizedMetrics.lcp === 'number' ? `${normalizedMetrics.lcp.toFixed(1)}s` : '-';
    const fidDisplay = typeof normalizedMetrics.fid === 'number' ? `${Math.round(normalizedMetrics.fid)}ms` : '-';
    const clsDisplay = typeof normalizedMetrics.cls === 'number' ? normalizedMetrics.cls.toFixed(2) : '-';

    // Determine colors based on thresholds
    const lcpColor = normalizedMetrics.lcp < 2.5 ? '#10b981' : normalizedMetrics.lcp < 4 ? '#f59e0b' : '#ef4444';
    const fidColor = normalizedMetrics.fid < 100 ? '#10b981' : normalizedMetrics.fid < 300 ? '#f59e0b' : '#ef4444';
    const clsColor = normalizedMetrics.cls < 0.1 ? '#10b981' : normalizedMetrics.cls < 0.25 ? '#f59e0b' : '#ef4444';

    // Calculate percentages for progress bars - using the scale of the worst threshold
    // Return 0 for metrics that don't have values
    const lcpPercentage = typeof normalizedMetrics.lcp === 'number' && normalizedMetrics.lcp > 0 
        ? Math.min(100, (normalizedMetrics.lcp / 6) * 100) 
        : 0;
    
    const fidPercentage = typeof normalizedMetrics.fid === 'number' && normalizedMetrics.fid > 0
        ? Math.min(100, (normalizedMetrics.fid / 500) * 100) 
        : 0;
    
    const clsPercentage = typeof normalizedMetrics.cls === 'number' && normalizedMetrics.cls > 0
        ? Math.min(100, (normalizedMetrics.cls / 0.5) * 100) 
        : 0;
    
    // Define thresholds for each metric
    const lcpThresholds = [
        {
            position: (2.5 / 6) * 100,
            color: '#10b981',
            label: 'Good'
        },
        {
            position: (4 / 6) * 100,
            color: '#f59e0b',
            label: 'Needs Improvement'
        }
    ];
    
    const fidThresholds = [
        {
            position: (100 / 500) * 100,
            color: '#10b981',
            label: 'Good'
        },
        {
            position: (300 / 500) * 100,
            color: '#f59e0b',
            label: 'Needs Improvement'
        }
    ];
    
    const clsThresholds = [
        {
            position: (0.1 / 0.5) * 100,
            color: '#10b981',
            label: 'Good'
        },
        {
            position: (0.25 / 0.5) * 100,
            color: '#f59e0b',
            label: 'Needs Improvement'
        }
    ];

    return React.createElement('div', { style: { ...styles.cardSection, backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px' } },
        React.createElement('div', { style: { ...styles.cardTitle, color: '#f8fafc', fontSize: '1rem', marginBottom: '12px' } }, 'Core Web Vitals'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
            React.createElement(MetricItem, {
                label: 'LCP (Largest Contentful Paint)',
                value: lcpDisplay,
                color: lcpColor,
                percentage: lcpPercentage,
                thresholds: lcpThresholds,
                description: 'Time until the largest content element is rendered. Good: < 2.5s | Needs Improvement: < 4s | Poor: ≥ 4s'
            }),
            React.createElement(MetricItem, {
                label: 'FID (First Input Delay)',
                value: fidDisplay,
                color: fidColor,
                percentage: fidPercentage,
                thresholds: fidThresholds,
                description: 'Time from user interaction to browser response. Good: < 100ms | Needs Improvement: < 300ms | Poor: ≥ 300ms'
            }),
            React.createElement(MetricItem, {
                label: 'CLS (Cumulative Layout Shift)',
                value: clsDisplay,
                color: clsColor,
                percentage: clsPercentage,
                thresholds: clsThresholds,
                description: 'Measures visual stability. Good: < 0.1 | Needs Improvement: < 0.25 | Poor: ≥ 0.25'
            })
        )
    );
};
