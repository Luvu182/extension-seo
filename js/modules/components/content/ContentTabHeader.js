'use strict';

import React from 'react';

/**
 * ContentTabHeader - Tab navigation for content tab
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeContentTab - Currently active tab
 * @param {Function} props.handleTabChange - Tab change handler
 * @returns {React.Element} Rendered component
 */
export const ContentTabHeader = React.memo(({ activeContentTab, handleTabChange }) => {
    // Common tab button style
    const tabButtonStyle = (isActive) => ({
        padding: '8px 16px',
        backgroundColor: 'transparent',
        color: isActive ? '#60a5fa' : '#94a3b8',
        border: 'none',
        borderBottom: isActive ? '2px solid #60a5fa' : '2px solid transparent',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: isActive ? '500' : '400',
        transition: 'all 0.2s'
    });
    
    return React.createElement('div', { 
        style: { 
            display: 'flex',
            marginBottom: '12px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
        }
    },
        // Text Tab Button
        React.createElement('button', {
            className: activeContentTab === 'text' ? 'active-tab' : '',
            onClick: () => handleTabChange('text'),
            style: tabButtonStyle(activeContentTab === 'text'),
            'aria-selected': activeContentTab === 'text',
            role: 'tab'
        }, 'Text'),
        
        // Image Tab Button
        React.createElement('button', {
            className: activeContentTab === 'image' ? 'active-tab' : '',
            onClick: () => handleTabChange('image'),
            style: tabButtonStyle(activeContentTab === 'image'),
            'aria-selected': activeContentTab === 'image',
            role: 'tab'
        }, 'Image')
    );
});