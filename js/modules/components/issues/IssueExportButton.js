'use strict';

import React from 'react';

import { styles } from '../../styles.js';

/**
 * Component for exporting issues data
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function to call when export is requested
 * @returns {React.Element} Rendered component
 */
export const IssueExportButton = ({ onClick }) => {
    // State to track if hovering
    const [isHovering, setIsHovering] = React.useState(false);

    // Handle format selection
    const handleFormatSelect = (format) => {
        if (onClick) {
            onClick(format);
        }
    };

    return React.createElement('div', {
        onMouseEnter: () => setIsHovering(true),
        onMouseLeave: () => setIsHovering(false),
        style: {
            position: 'relative',
            display: 'inline-block'
        }
    }, [
        // Main button
        React.createElement('button', {
            key: 'main-button',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500'
            }
        }, [
            React.createElement('span', {
                key: 'icon',
                style: {
                    fontSize: '0.875rem',
                    color: '#60a5fa'
                }
            }, '📊'),
            React.createElement('span', { key: 'text' }, 'Export Issues')
        ]),
        
        // Dropdown menu (only shown when hovering)
        isHovering && React.createElement('div', {
            key: 'dropdown',
            style: {
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: '10'
            }
        }, [
            // JSON Button
            React.createElement('button', {
                key: 'json-button',
                onClick: () => handleFormatSelect('json'),
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#60a5fa',
                    border: '1px solid rgba(96, 165, 250, 0.2)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                }
            }, [
                React.createElement('span', { key: 'icon', style: { fontSize: '0.8rem' } }, '📄'),
                React.createElement('span', { key: 'text' }, 'JSON')
            ]),
            
            // CSV Button
            React.createElement('button', {
                key: 'csv-button',
                onClick: () => handleFormatSelect('csv'),
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                }
            }, [
                React.createElement('span', { key: 'icon', style: { fontSize: '0.8rem' } }, '📊'),
                React.createElement('span', { key: 'text' }, 'CSV')
            ])
        ])
    ]);
};
