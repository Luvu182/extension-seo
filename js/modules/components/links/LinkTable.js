'use strict';

import React from 'react';

import { styles } from '../../styles.js';
import { linkService } from '../../services/link-service.js';

/**
 * Component to display link table with filtering
 * @param {Object} props - Component props
 * @param {Array} props.links - Array of link objects to display (filtered by active tab and status)
 * @param {Array} props.allLinks - Array of all link objects (unfiltered)
 * @param {boolean} props.showAll - Whether to show all links or just first 10
 * @param {Function} props.onToggleShowAll - Function to toggle showAll state
 * @param {Object} props.statuses - Object containing link status information
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Function to call when tab changes
 * @param {string} props.activeStatusFilter - Currently active status filter
 * @param {number} props.filteredCount - Number of links after filtering
 * @returns {React.Element} Rendered component
 */
export const LinkTable = ({
    links,
    allLinks,
    showAll,
    onToggleShowAll,
    statuses,
    activeTab,
    onTabChange,
    activeStatusFilter = 'all',
    onStatusFilterChange,
    filteredCount,
    isOptimized = false,
    onToggleOptimized
}) => {
    // Force render on select change to fix dropdown sync issues
    const [renderKey, setRenderKey] = React.useState(0);
    
    // Get links to display based on showAll state
    const displayLinks = showAll ? links : links.slice(0, 10);

    // Get status filter options from LinkStatusFilter component
    const getStatusFilterOptions = () => {
        // Get unique status codes from the statuses object
        const getStatusCounts = () => {
            // Initialize with common status codes and groups
            const counts = {
                'all': 0,
                '200': 0,
                '301': 0,
                '302': 0,
                '3xx': 0, // Group for all 3xx
                '404': 0,
                '4xx': 0, // Group for all 4xx
                '500': 0,
                '5xx': 0, // Group for all 5xx
                'error': 0
            };

            // Count links by status
            allLinks.forEach(link => {
                if (!link.href) return;

                const status = statuses[link.href];
                if (!status) return;

                // Increment total count
                counts['all']++;

                if (status.statusCode) {
                    // Add to specific code count
                    const code = status.statusCode.toString();
                    if (counts[code] !== undefined) {
                        counts[code]++;
                    } else {
                        counts[code] = 1;
                    }

                    // Also add to group counts
                    if (status.statusCode >= 300 && status.statusCode < 400) {
                        counts['3xx']++;
                    } else if (status.statusCode >= 400 && status.statusCode < 500) {
                        counts['4xx']++;
                    } else if (status.statusCode >= 500) {
                        counts['5xx']++;
                    }
                } else if (status.status === 'error') {
                    counts['error']++;
                }
            });

            // Filter out status codes with zero count
            return Object.entries(counts)
                .filter(([_, count]) => count > 0)
                .reduce((obj, [code, count]) => {
                    obj[code] = count;
                    return obj;
                }, {});
        };

        const statusCounts = getStatusCounts();

        // Organize status codes into groups
        const organizeStatusCodes = () => {
            // Extract all status codes
            const allCodes = Object.keys(statusCounts);

            // Create groups
            const groups = {
                all: { code: 'all', label: 'All statuses', count: statusCounts['all'] || 0 },
                success: { code: '200', label: '200 OK', count: statusCounts['200'] || 0 },
                redirects: {
                    code: '3xx',
                    label: 'All 3xx Redirects',
                    count: statusCounts['3xx'] || 0,
                    children: []
                },
                clientErrors: {
                    code: '4xx',
                    label: 'All 4xx Client Errors',
                    count: statusCounts['4xx'] || 0,
                    children: []
                },
                serverErrors: {
                    code: '5xx',
                    label: 'All 5xx Server Errors',
                    count: statusCounts['5xx'] || 0,
                    children: []
                },
                errors: { code: 'error', label: 'Error', count: statusCounts['error'] || 0 },
                other: []
            };

            // Assign specific codes to their groups
            allCodes.forEach(code => {
                if (['all', '3xx', '4xx', '5xx', '200', 'error'].includes(code)) {
                    return; // Skip group codes and already handled codes
                }

                const codeNum = parseInt(code);
                let label = `${code} Status`;

                // Assign specific labels
                if (code === '301') label = '301 Permanent Redirect';
                else if (code === '302') label = '302 Temporary Redirect';
                else if (code === '304') label = '304 Not Modified';
                else if (code === '307') label = '307 Temporary Redirect';
                else if (code === '308') label = '308 Permanent Redirect';
                else if (code === '400') label = '400 Bad Request';
                else if (code === '401') label = '401 Unauthorized';
                else if (code === '403') label = '403 Forbidden';
                else if (code === '404') label = '404 Not Found';
                else if (code === '410') label = '410 Gone';
                else if (code === '429') label = '429 Too Many Requests';
                else if (code === '500') label = '500 Server Error';
                else if (code === '502') label = '502 Bad Gateway';
                else if (code === '503') label = '503 Service Unavailable';
                else if (code === '504') label = '504 Gateway Timeout';

                const item = { code, label, count: statusCounts[code] };

                // Add to appropriate group
                if (codeNum >= 300 && codeNum < 400) {
                    groups.redirects.children.push(item);
                } else if (codeNum >= 400 && codeNum < 500) {
                    groups.clientErrors.children.push(item);
                } else if (codeNum >= 500) {
                    groups.serverErrors.children.push(item);
                } else {
                    groups.other.push(item);
                }
            });

            // Sort children within each group
            groups.redirects.children.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            groups.clientErrors.children.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            groups.serverErrors.children.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            groups.other.sort((a, b) => parseInt(a.code) - parseInt(b.code));

            return groups;
        };

        // Create hierarchical options
        const groups = organizeStatusCodes();
        const options = [];

        // Add 'All statuses' option
        if (groups.all.count > 0) {
            options.push(React.createElement('option', {
                key: groups.all.code,
                value: groups.all.code
            }, `${groups.all.label} (${groups.all.count})`));
        }

        // Add '200 OK' option
        if (groups.success.count > 0) {
            options.push(React.createElement('option', {
                key: groups.success.code,
                value: groups.success.code
            }, `${groups.success.label} (${groups.success.count})`));
        }

        // Add 3xx group and children
        if (groups.redirects.count > 0) {
            // Add group header
            options.push(React.createElement('option', {
                key: groups.redirects.code,
                value: groups.redirects.code
            }, `${groups.redirects.label} (${groups.redirects.count})`));

            // Add children with indentation
            groups.redirects.children.forEach(child => {
                if (child.count > 0) {
                    options.push(React.createElement('option', {
                        key: child.code,
                        value: child.code
                    }, `\u00A0\u00A0\u00A0\u00A0${child.label} (${child.count})`));
                }
            });
        }

        // Add 4xx group and children
        if (groups.clientErrors.count > 0) {
            // Add group header
            options.push(React.createElement('option', {
                key: groups.clientErrors.code,
                value: groups.clientErrors.code
            }, `${groups.clientErrors.label} (${groups.clientErrors.count})`));

            // Add children with indentation
            groups.clientErrors.children.forEach(child => {
                if (child.count > 0) {
                    options.push(React.createElement('option', {
                        key: child.code,
                        value: child.code
                    }, `\u00A0\u00A0\u00A0\u00A0${child.label} (${child.count})`));
                }
            });
        }

        // Add 5xx group and children
        if (groups.serverErrors.count > 0) {
            // Add group header
            options.push(React.createElement('option', {
                key: groups.serverErrors.code,
                value: groups.serverErrors.code
            }, `${groups.serverErrors.label} (${groups.serverErrors.count})`));

            // Add children with indentation
            groups.serverErrors.children.forEach(child => {
                if (child.count > 0) {
                    options.push(React.createElement('option', {
                        key: child.code,
                        value: child.code
                    }, `\u00A0\u00A0\u00A0\u00A0${child.label} (${child.count})`));
                }
            });
        }

        // Add error option
        if (groups.errors.count > 0) {
            options.push(React.createElement('option', {
                key: groups.errors.code,
                value: groups.errors.code
            }, `${groups.errors.label} (${groups.errors.count})`));
        }

        // Add other options
        groups.other.forEach(item => {
            if (item.count > 0) {
                options.push(React.createElement('option', {
                    key: item.code,
                    value: item.code
                }, `${item.label} (${item.count})`));
            }
        });

        return options;
    };

    // Filter tabs
    const renderFilterTabs = () => {
        return React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #334155',
                marginBottom: '12px'
            }
        }, [
            // Left side: Tab filters
            React.createElement('div', {
                key: 'tab-filters',
                style: {
                    display: 'flex'
                }
            },
                ['all', 'internal', 'external', 'nofollow'].map(tab => {
                    // Get count for each tab using allLinks to ensure counts are consistent
                    let count = 0;
                    if (tab === 'all') count = allLinks.length;
                    else if (tab === 'internal') count = allLinks.filter(link => link.type === 'internal').length;
                    else if (tab === 'external') count = allLinks.filter(link => link.type === 'external').length;
                    else if (tab === 'nofollow') count = allLinks.filter(link => !link.dofollow).length;

                    return React.createElement('button', {
                        key: tab,
                        style: {
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            borderBottom: activeTab === tab ? '2px solid #60a5fa' : 'none',
                            color: activeTab === tab ? '#60a5fa' : '#94a3b8',
                            border: 'none',
                            marginBottom: activeTab === tab ? '-1px' : '0',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: activeTab === tab ? '500' : 'normal'
                        },
                        onClick: () => onTabChange && onTabChange(tab)
                    }, `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${count})`);
                })
            ),

            // Right side: Status filter
            React.createElement('div', {
                key: 'status-filter',
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    paddingBottom: '4px'
                }
            }, [
                React.createElement('span', {
                    key: 'label',
                    style: {
                        fontSize: '0.75rem',
                        marginRight: '8px',
                        color: '#94a3b8'
                    }
                }, 'Filter by status:'),
                React.createElement('select', {
                    key: `select-${renderKey}-${activeStatusFilter}`, // Force re-render with key change
                    disabled: Object.keys(statuses).length === 0,
                    value: activeStatusFilter,
                    onChange: (e) => {
                        const newValue = e.target.value;
                        console.log('Filter changed:', newValue);
                        
                        // Force immediate UI update
                        document.querySelector('select').value = newValue;
                        
                        if (onStatusFilterChange) {
                            // Use direct DOM to avoid React batching/delays
                            setTimeout(() => {
                                onStatusFilterChange(newValue);
                                
                                // Force re-render after state update
                                setRenderKey(prev => prev + 1);
                            }, 0);
                        }
                    },
                    style: {
                        backgroundColor: '#1e293b',
                        color: '#e2e8f0',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        cursor: Object.keys(statuses).length === 0 ? 'not-allowed' : 'pointer'
                    }
                }, getStatusFilterOptions())
            ])
        ]);
    };

    // Optimization toggle with check button and progress info
    const renderOptimizationSwitch = () => {
        return React.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'flex-start', // Changed to flex-start to align items at the top
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '4px',
                fontSize: '0.75rem'
            }
        }, [
            // Left section with toggle and description
            React.createElement('div', {
                key: 'left-section',
                style: {
                    display: 'flex',
                    alignItems: 'center'
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
                        onChange: (e) => {
                            const newValue = e.target.checked;
                            // Call the link service to save this setting
                            linkService.setOptimizedChecking(newValue).then(success => {
                                if (success && onToggleOptimized) {
                                    onToggleOptimized(newValue);
                                }
                            });
                        }
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
                
                // Label text (without the TURBO badge - removed)
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
                    }, isOptimized ? 'Turbo Mode: ON' : 'Turbo Mode: OFF'),
                    React.createElement('span', {
                        key: 'desc',
                        style: {
                            fontSize: '0.65rem',
                            color: '#64748b'
                        }
                    }, isOptimized ? 
                        'Using API for faster & more accurate status checks' : 
                        'Using standard browser status checks')
                ])
            ]),
            
            // Right section with check button and progress info
            React.createElement('div', {
                key: 'button-container',
                style: {
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }
            }, [
                // Progress info (hidden by default)
                React.createElement('div', {
                    key: 'progress-container',
                    id: 'progress-container',
                    style: {
                        fontSize: '0.75rem',
                        color: '#64748b',
                        display: 'none' // Hidden by default
                    }
                }),
                React.createElement('button', {
                    key: 'check-btn',
                    id: 'check-links-status-btn',
                    style: {
                        padding: '6px 12px',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    },
                    onClick: () => {
                        // This function will be attached from the links-tab.js
                        if (window.checkLinkStatus) {
                            window.checkLinkStatus();
                        }
                    }
                }, [
                    React.createElement('span', {
                        style: { 
                            fontSize: '0.875rem', 
                            marginRight: '4px' 
                        }
                    }, isOptimized ? '⚡' : '🔍'),
                    React.createElement('span', {}, 'Check Status')
                ])
            ])
        ]);
    };

    // Table header
    const renderTableHeader = () => {
        return React.createElement('thead', {
            style: {
                position: 'sticky',
                top: 0,
                backgroundColor: '#1a202c',
                zIndex: 1
            }
        },
            React.createElement('tr', {},
                ['Target URL', 'Anchor Text', 'Type', 'Follow', 'Status'].map(header =>
                    React.createElement('th', {
                        key: header,
                        style: {
                            padding: '8px',
                            textAlign: 'left',
                            borderBottom: '1px solid #334155',
                            color: '#94a3b8',
                            fontWeight: '500'
                        }
                    }, header)
                )
            )
        );
    };

    // Table body
    const renderTableBody = () => {
        return React.createElement('tbody', {},
            displayLinks.map((link, index) =>
                React.createElement('tr', { key: index },
                    // Target URL
                    React.createElement('td', {
                        style: {
                            padding: '8px',
                            borderBottom: '1px solid #334155',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }
                    },
                        link.href ?
                            React.createElement('a', {
                                href: link.href,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                style: {
                                    color: '#60a5fa',
                                    textDecoration: 'none'
                                },
                                title: link.href
                            }, link.href) :
                            React.createElement('span', { style: { color: '#ef4444' } }, 'Empty URL')
                    ),

                    // Anchor Text
                    React.createElement('td', {
                        style: {
                            padding: '8px',
                            borderBottom: '1px solid #334155',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }
                    },
                        link.anchorText || React.createElement('span', { style: { color: '#94a3b8', fontStyle: 'italic' } }, 'No text')
                    ),

                    // Type
                    React.createElement('td', {
                        style: {
                            padding: '8px',
                            borderBottom: '1px solid #334155'
                        }
                    },
                        link.type === 'internal' ?
                            React.createElement('span', { style: { color: '#60a5fa' } }, 'Internal') :
                            React.createElement('span', { style: { color: '#f59e0b' } }, 'External')
                    ),

                    // Follow
                    React.createElement('td', {
                        style: {
                            padding: '8px',
                            borderBottom: '1px solid #334155'
                        }
                    },
                        link.dofollow ?
                            React.createElement('span', { style: { color: '#10b981' } }, 'Follow') :
                            React.createElement('span', { style: { color: '#ef4444' } }, 'Nofollow')
                    ),

                    // Status
                    React.createElement('td', {
                        style: {
                            padding: '8px',
                            borderBottom: '1px solid #334155',
                            color: linkService.getStatusColor(statuses, link.href)
                        }
                    }, linkService.getStatusText(statuses, link.href))
                )
            )
        );
    };

    // Show more/less button
    const renderShowMoreButton = () => {
        if (links.length <= 10) return null;

        return React.createElement('button', {
            style: {
                padding: '6px 12px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                border: 'none',
                borderRadius: '4px',
                marginTop: '12px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                width: 'auto',
                display: 'block',
                margin: '12px auto 0'
            },
            onClick: onToggleShowAll
        }, showAll ? 'Show Less' : `Show More (${links.length - 10} more)`);
    };

    // If no links to display, show a message but keep the filter tabs
    const renderNoLinksMessage = () => {
        if (links.length === 0) {
            let message = `No ${activeTab !== 'all' ? activeTab + ' ' : ''}links`;

            // Add status filter info if active
            if (activeStatusFilter !== 'all') {
                message += ` with status ${activeStatusFilter}`;
            }

            // Complete the message
            message += ' to display.';

            // If we have a filtered count, show how many were filtered out
            if (filteredCount === 0 && allLinks.length > 0) {
                const tabCount = activeTab === 'all' ?
                    allLinks.length :
                    allLinks.filter(link => {
                        if (activeTab === 'internal') return link.type === 'internal';
                        if (activeTab === 'external') return link.type === 'external';
                        if (activeTab === 'nofollow') return !link.dofollow;
                        return true;
                    }).length;

                if (tabCount > 0) {
                    message += ` Try a different status filter (${tabCount} links available).`;
                }
            }

            return React.createElement('p', {
                style: {
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    padding: '16px'
                }
            }, message);
        }
        return null;
    };

    // Render the table
    return React.createElement('div', {},
        // Optimization toggle at the top of the table
        renderOptimizationSwitch(),

        renderFilterTabs(),

        // Show message if no links, otherwise show table
        links.length === 0 ?
            renderNoLinksMessage() :
            React.createElement('div', {
                style: {
                    maxHeight: '300px',
                    overflowY: 'auto',
                    overflowX: 'auto'
                }
            },
                React.createElement('table', {
                    style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.75rem'
                    }
                },
                    renderTableHeader(),
                    renderTableBody()
                )
            ),

        // Only show the button if we have links and more than 10
        links.length > 10 ? renderShowMoreButton() : null
    );
};
