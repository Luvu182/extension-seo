'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component to display performance recommendations
 * @param {Object} props - Component properties
 * @param {Array} props.recommendations - List of recommendations
 * @returns {React.Element} - The PerformanceRecommendations component
 */
export const PerformanceRecommendations = ({ recommendations }) => {
    return React.createElement('div', { style: { ...styles.cardSection, backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginTop: '16px' } },
        React.createElement('div', { style: { ...styles.cardTitle, color: '#f8fafc', fontSize: '1rem', marginBottom: '12px' } }, 'Performance Recommendations'),
        React.createElement('div', { style: { maxHeight: '300px', overflowY: 'auto' } },
            recommendations.length > 0 ? 
            recommendations.map((rec, index) =>
                React.createElement('div', { 
                    key: index, 
                    style: { 
                        backgroundColor: '#1e293b',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '12px',
                        borderLeft: `4px solid ${rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#3b82f6'}`, 
                    } 
                },
                    React.createElement('div', { 
                        style: { 
                            fontSize: '0.9rem', 
                            fontWeight: '600', 
                            marginBottom: '6px', 
                            color: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center' 
                        } 
                    }, 
                        React.createElement('span', {
                            style: {
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#3b82f6',
                                marginRight: '8px',
                                display: 'inline-block'
                            }
                        }),
                        rec.title
                    ),
                    React.createElement('div', { 
                        style: { 
                            fontSize: '0.8rem', 
                            color: '#cbd5e1', 
                            lineHeight: '1.4' 
                        } 
                    }, rec.description)
                )
            ) :
            React.createElement('div', {
                style: {
                    textAlign: 'center',
                    padding: '20px',
                    color: '#94a3b8',
                    fontSize: '0.9rem'
                }
            }, 'No specific recommendations available.')
        )
    );
};
