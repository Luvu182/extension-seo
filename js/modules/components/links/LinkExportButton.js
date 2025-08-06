'use strict';

import React from 'react';

import { styles } from '../../styles.js';

/**
 * Component for exporting link data
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function to call when export is requested
 * @returns {React.Element} Rendered component
 */
export const LinkExportButton = ({ onClick }) => {
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
            React.createElement('span', { key: 'text' }, 'Export')
        ]),
        
        // Format options container
        React.createElement('div', {
            key: 'format-options',
            style: {
                position: 'absolute',
                top: 0,
                right: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isHovering ? 1 : 0,
                visibility: isHovering ? 'visible' : 'hidden',
                transform: isHovering ? 'translateX(0)' : 'translateX(10px)',
                transition: 'all 0.3s ease',
                paddingRight: '8px'
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
