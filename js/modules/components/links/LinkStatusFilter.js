'use strict';

import React from 'react';

/**
 * Component for filtering links by status code
 * @param {Object} props - Component props
 * @param {Object} props.statuses - Object containing link status information
 * @param {Array} props.links - Array of link objects
 * @param {string} props.activeStatusFilter - Currently active status filter
 * @param {Function} props.onStatusFilterChange - Function to call when filter changes
 * @param {boolean} props.disabled - Whether the filter is disabled
 * @returns {React.Element} Rendered component
 */
export const LinkStatusFilter = ({ statuses, links, activeStatusFilter, onStatusFilterChange, disabled = true }) => {
    // Get unique status codes from the statuses object
    const getStatusCounts = () => {
        // Initialize with common status codes
        const counts = {
            'all': 0,
            '200': 0,
            '301': 0,
            '302': 0,
            '304': 0,
            '307': 0,
            '308': 0,
            '3xx': 0, // Group for all 3xx
            '400': 0,
            '401': 0,
            '403': 0,
            '404': 0,
            '410': 0,
            '429': 0,
            '4xx': 0, // Group for all 4xx
            '500': 0,
            '502': 0,
            '503': 0,
            '504': 0,
            '5xx': 0, // Group for all 5xx
            'error': 0
        };

        // Count links by status
        links.forEach(link => {
            if (!link.href) return;

            const status = statuses[link.href];
            if (!status) return;

            // Increment total count
            counts['all']++;

            if (status.statusCode) {
                // If we have a specific status code, increment that counter
                const code = status.statusCode.toString();

                // Add to specific code count if it exists
                if (counts[code] !== undefined) {
                    counts[code]++;
                } else {
                    // Add new status code if not in our predefined list
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
    const hasStatusData = Object.keys(statusCounts).length > 1; // More than just 'all'

    // If disabled or no status data, show disabled dropdown
    if (disabled || !hasStatusData) {
        return React.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                opacity: 0.5,
                cursor: 'not-allowed'
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
                key: 'select',
                disabled: true,
                style: {
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    cursor: 'not-allowed'
                }
            }, [
                React.createElement('option', { key: 'all', value: 'all' }, 'All statuses')
            ])
        ]);
    }

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

    // Render the filter dropdown
    return React.createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: activeStatusFilter !== 'all' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            padding: activeStatusFilter !== 'all' ? '4px 8px' : '0',
            borderRadius: '4px',
            border: activeStatusFilter !== 'all' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none'
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
            key: 'select',
            value: activeStatusFilter,
            onChange: (e) => onStatusFilterChange(e.target.value),
            style: {
                backgroundColor: activeStatusFilter !== 'all' ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
                color: activeStatusFilter !== 'all' ? '#60a5fa' : '#e2e8f0',
                border: activeStatusFilter !== 'all' ? '1px solid #60a5fa' : '1px solid #334155',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: activeStatusFilter !== 'all' ? '500' : 'normal'
            }
        }, options)
    ]);
};
