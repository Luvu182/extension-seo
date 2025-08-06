'use strict';

import React from 'react';

/**
 * RecommendationItem - Displays a recommendation with priority styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Recommendation title
 * @param {string} props.description - Recommendation description
 * @param {string} props.priority - Priority level: 'high', 'medium', or 'low'
 * @returns {React.Element} Rendered component
 */
export const RecommendationItem = React.memo(({ title, description, priority }) => {
    // Determine colors based on priority
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#3b82f6';
            default: return '#3b82f6';
        }
    };
    
    const getTitleColor = (priority) => {
        switch (priority) {
            case 'high': return '#dc2626';
            case 'medium': return '#d97706';
            case 'low': return '#2563eb';
            default: return '#2563eb';
        }
    };
    
    const color = getPriorityColor(priority);
    const titleColor = getTitleColor(priority);
    
    return React.createElement('div', { 
        style: { 
            backgroundColor: '#f8fafc', 
            borderRadius: '6px', 
            padding: '12px', 
            borderLeft: `3px solid ${color}` 
        } 
    },
        React.createElement('div', { 
            style: { 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                marginBottom: '4px', 
                color: titleColor
            } 
        }, title),
        React.createElement('div', { 
            style: { 
                fontSize: '0.8rem', 
                color: '#4b5563', 
                lineHeight: '1.3' 
            } 
        }, description)
    );
});