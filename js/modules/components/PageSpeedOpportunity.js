'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component to display a PageSpeed Insight opportunity or recommendation
 * @param {Object} props - Component properties
 * @param {string} props.title - Opportunity title
 * @param {string} props.description - Opportunity description
 * @param {number} props.score - Opportunity score (0-1)
 * @param {string} props.displayValue - Display value (e.g. "3.2s")
 * @returns {React.Element} - The PageSpeedOpportunity component
 */
export const PageSpeedOpportunity = ({ title, description, score, displayValue }) => {
    // Color based on score
    const color = score > 0.7 ? '#22c55e' : 
                 score > 0.4 ? '#f59e0b' : '#ef4444';
    
    // Style for the container
    const containerStyle = {
        padding: '12px',
        backgroundColor: '#1e293b',
        borderRadius: '4px',
        borderLeft: `3px solid ${color}`,
        marginBottom: '12px'
    };
    
    // Style for header row with title and value
    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
    };
    
    // Style for title
    const titleStyle = {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#f1f5f9'
    };
    
    // Style for the value badge
    const valueBadgeStyle = {
        fontSize: '0.8rem',
        color: '#94a3b8',
        backgroundColor: '#334155',
        padding: '2px 6px',
        borderRadius: '4px'
    };
    
    // Style for description text
    const descriptionStyle = {
        fontSize: '0.8rem',
        color: '#cbd5e1',
        lineHeight: '1.4'
    };
    
    return React.createElement('div', { style: containerStyle },
        React.createElement('div', { style: headerStyle },
            React.createElement('span', { style: titleStyle }, title),
            displayValue && React.createElement('span', { style: valueBadgeStyle }, displayValue)
        ),
        React.createElement('div', { style: descriptionStyle }, description)
    );
};
