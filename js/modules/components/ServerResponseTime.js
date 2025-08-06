'use strict';

// Import dependencies
import { styles } from '../styles.js';
import { MetricItem } from './MetricItem.js';
import { performanceService } from '../services/performance-service.js';

/**
 * Component to display server response time metrics
 * @param {Object} props - Component properties
 * @param {number} props.ttfb - Time to First Byte value
 * @returns {React.Element} - The ServerResponseTime component
 */
export const ServerResponseTime = ({ ttfb }) => {
    const ttfbEvaluation = performanceService.evaluateTTFB(ttfb);
    
    // Define thresholds for TTFB
    const ttfbThresholds = [
        {
            position: (0.2 / 1.8) * 100,
            color: '#10b981',
            label: 'Excellent'
        },
        {
            position: (0.5 / 1.8) * 100,
            color: '#22c55e',
            label: 'Good'
        },
        {
            position: (0.8 / 1.8) * 100,
            color: '#f59e0b',
            label: 'Acceptable'
        }
    ];

    // Format display value with dash for missing data
    const ttfbDisplay = typeof ttfb === 'number' ? `${ttfb}s` : '-';
    
    // Default color for no data
    const color = typeof ttfb === 'number' ? ttfbEvaluation.color : '#64748b';
    
    // Percentage for progress bar
    const percentage = typeof ttfb === 'number' ? ttfbEvaluation.percentage : 0;

    return React.createElement('div', { style: { ...styles.cardSection, backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginTop: '16px' } },
        React.createElement('div', { style: { ...styles.cardTitle, color: '#f8fafc', fontSize: '1rem', marginBottom: '12px' } }, 'Server Response Time'),
        React.createElement(MetricItem, {
            label: 'TTFB (Time to First Byte)',
            value: ttfbDisplay,
            color: color,
            percentage: percentage,
            thresholds: ttfbThresholds,
            description: 'Time for the browser to receive the first byte from the server. Excellent: < 0.2s | Good: < 0.5s | Acceptable: < 0.8s | Poor: ≥ 0.8s'
        })
    );
};
