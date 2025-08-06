'use strict';

import React from 'react';

import { styles } from '../../styles.js';

/**
 * Component to display link distribution chart
 * @param {Object} props - Component props
 * @param {number} props.internal - Number of internal links
 * @param {number} props.external - Number of external links
 * @param {number} props.total - Total number of links
 * @returns {React.Element} Rendered component
 */
export const LinkDistribution = ({ internal, external, total }) => {
    // Calculate percentages
    const internalPercentage = total > 0 ? Math.round((internal / total) * 100) : 0;
    const externalPercentage = total > 0 ? Math.round((external / total) * 100) : 0;
    
    return React.createElement('div', { style: styles.cardSection },
        React.createElement('div', { style: styles.cardTitle }, 'Link Distribution'),
        
        // Distribution bar
        React.createElement('div', { 
            style: { 
                height: '24px', 
                display: 'flex', 
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px'
            } 
        },
            // Internal links portion
            React.createElement('div', { 
                style: { 
                    width: `${internalPercentage}%`, 
                    backgroundColor: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                } 
            }, internalPercentage > 10 ? `${internalPercentage}%` : ''),
            
            // External links portion
            React.createElement('div', { 
                style: { 
                    width: `${externalPercentage}%`, 
                    backgroundColor: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                } 
            }, externalPercentage > 10 ? `${externalPercentage}%` : '')
        ),
        
        // Legend
        React.createElement('div', { 
            style: { 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8'
            } 
        },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
                React.createElement('div', { 
                    style: { 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#60a5fa',
                        marginRight: '4px',
                        borderRadius: '2px'
                    } 
                }),
                `Internal (${internal})`
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
                React.createElement('div', { 
                    style: { 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: '#f59e0b',
                        marginRight: '4px',
                        borderRadius: '2px'
                    } 
                }),
                `External (${external})`
            )
        )
    );
};
