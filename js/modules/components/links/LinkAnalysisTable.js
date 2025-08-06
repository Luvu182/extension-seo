'use strict';

import React from 'react';

import { styles } from '../../styles.js';
import { linkService } from '../../services/link-service.js';

/**
 * Component to display link analysis table
 * @param {Object} props - Component props
 * @param {Object} props.linksData - Data about links
 * @param {boolean} props.isOptimized - Whether optimized checking is enabled
 * @param {Function} props.onToggleOptimized - Function to toggle optimized checking
 * @returns {React.Element} Rendered component
 */
export const LinkAnalysisTable = ({ linksData, isOptimized, onToggleOptimized }) => {
    // Extract data
    const internalLinks = linksData.internal?.count || 0;
    const externalLinks = linksData.external?.count || 0;
    const nofollowLinks = linksData.nofollow?.count || 0;
    const totalLinks = linksData.total || 0;

    /**
     * Toggle the optimization state
     */
    const handleToggleOptimized = async () => {
        try {
            const result = await linkService.setOptimizedChecking(!isOptimized);
            if (result && onToggleOptimized) {
                onToggleOptimized(!isOptimized);
            }
        } catch (error) {
            console.error('Error toggling optimization:', error);
        }
    };

    // Optimization toggle switch component
    const renderOptimizationSwitch = () => {
        return React.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                marginTop: '12px',
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '4px',
                fontSize: '0.75rem'
            }
        }, [
            // Toggle switch
            React.createElement('label', {
                key: 'switch',
                style: {
                    position: 'relative',
                    display: 'inline-block',
                    width: '36px',
                    height: '20px',
                    marginRight: '8px'
                }
            }, [
                // Hidden checkbox
                React.createElement('input', {
                    key: 'checkbox',
                    type: 'checkbox',
                    style: {
                        opacity: 0,
                        width: 0,
                        height: 0
                    },
                    checked: isOptimized,
                    onChange: handleToggleOptimized
                }),
                // Switch slider
                React.createElement('span', {
                    key: 'slider',
                    style: {
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isOptimized ? '#10b981' : '#ccc',
                        transition: '0.4s',
                        borderRadius: '34px'
                    }
                }),
                // Switch knob
                React.createElement('span', {
                    key: 'knob',
                    style: {
                        position: 'absolute',
                        content: '""',
                        height: '16px',
                        width: '16px',
                        left: isOptimized ? '18px' : '2px',
                        bottom: '2px',
                        backgroundColor: 'white',
                        transition: '0.4s',
                        borderRadius: '50%'
                    }
                })
            ]),
            // Label text
            React.createElement('div', {
                key: 'label',
                style: {
                    display: 'flex',
                    flexDirection: 'column'
                }
            }, [
                React.createElement('span', {
                    key: 'title',
                    style: {
                        fontWeight: 'bold',
                        color: isOptimized ? '#10b981' : '#64748b'
                    }
                }, isOptimized ? 'Optimized Checking: ON' : 'Optimized Checking: OFF'),
                React.createElement('span', {
                    key: 'desc',
                    style: {
                        fontSize: '0.65rem',
                        color: '#64748b'
                    }
                }, isOptimized ? 
                    'Using Vercel API for faster & more accurate status checks' : 
                    'Using standard browser status checks')
            ]),
            // Turbo badge when optimized
            isOptimized ? React.createElement('span', {
                key: 'badge',
                style: {
                    marginLeft: 'auto',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold'
                }
            }, '⚡ TURBO') : null
        ]);
    };

    return React.createElement('div', { style: styles.cardSection }, [
        // Header
        React.createElement('div', { 
            key: 'title',
            style: styles.cardTitle 
        }, 'Link Analysis'),

        // Optimization toggle
        renderOptimizationSwitch(),

        // Analysis table
        React.createElement('table', {
            key: 'table',
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
                marginTop: '12px'
            }
        }, [
            // Table header
            React.createElement('thead', { key: 'thead' },
                React.createElement('tr', {},
                    React.createElement('th', { style: { padding: '8px', textAlign: 'left' } }, 'Type'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'left' } }, 'Count'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'left' } }, 'Percentage'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'left' } }, 'Issues')
                )
            ),

            // Table body
            React.createElement('tbody', { key: 'tbody' }, [
                // Internal links row
                React.createElement('tr', { key: 'internal' },
                    React.createElement('td', { style: { padding: '8px' } }, 'Internal'),
                    React.createElement('td', { style: { padding: '8px' } }, internalLinks),
                    React.createElement('td', { style: { padding: '8px' } },
                        `${Math.round(linksData.analysis?.internalRatio * 100 || 0)}%`),
                    React.createElement('td', { style: { padding: '8px' } },
                        linksData.internal?.items?.some(link => link.depth > 3) ?
                        'Deep URLs (>3 levels)' : 'None')
                ),

                // External links row
                React.createElement('tr', { key: 'external' },
                    React.createElement('td', { style: { padding: '8px' } }, 'External'),
                    React.createElement('td', { style: { padding: '8px' } }, externalLinks),
                    React.createElement('td', { style: { padding: '8px' } },
                        `${Math.round(linksData.analysis?.externalRatio * 100 || 0)}%`),
                    React.createElement('td', { style: { padding: '8px' } },
                        linksData.external?.items?.some(link => link.target === '_blank' && !link.rel?.includes('noopener')) ?
                        'Missing noopener' : 'None')
                ),

                // Nofollow links row
                React.createElement('tr', { key: 'nofollow' },
                    React.createElement('td', { style: { padding: '8px' } }, 'Nofollow'),
                    React.createElement('td', { style: { padding: '8px' } }, nofollowLinks),
                    React.createElement('td', { style: { padding: '8px' } },
                        `${Math.round((nofollowLinks / totalLinks) * 100) || 0}%`),
                    React.createElement('td', { style: { padding: '8px' } }, 'None')
                )
            ])
        ])
    ]);
};
