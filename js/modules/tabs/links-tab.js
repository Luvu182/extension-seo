'use strict';

import React from 'react';
import { logger } from '../../../src/shared/utils/logger.js';

// Links tab module for SEO AI Assistant

// Import dependencies
// React is global
import { styles } from '../styles.js';
import { dataService } from '../data-service.js';
import { linkService } from '../services/link-service.js';
import { store } from '../store.js';

// Import components
import { LinkCountCards } from '../components/links/LinkCountCards.js';
import { LinkDistribution } from '../components/links/LinkDistribution.js';
import { LinkStatusChecker } from '../components/links/LinkStatusChecker.js';
import { LinkTable } from '../components/links/LinkTable.js';
import { LinkExportButton } from '../components/links/LinkExportButton.js';
import { LinkIssuesTable } from '../components/links/LinkIssuesTable.js';
// Removed LinkAnalysisTable import as it duplicates Link Distribution functionality

// Main Component
export const LinksTab = ({ pageData }) => {
    const data = pageData || dataService.mockData;
    const linksData = data.links || {
        internal: { count: 0, items: [] },
        external: { count: 0, items: [] },
        nofollow: { count: 0, items: [] },
        total: 0,
        analysis: {
            internalRatio: 0,
            externalRatio: 0,
            nofollowRatio: 0,
            maxInternalDepth: 0
        }
    };

    // Get current URL for storage key
    const currentUrl = pageData?.url || window.location.href;

    // React state hooks
    const [showAllLinks, setShowAllLinks] = React.useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);
    const [linkStatuses, setLinkStatuses] = React.useState({});
    const [activeTab, setActiveTab] = React.useState('all');
    const [activeStatusFilter, setActiveStatusFilter] = React.useState('all');
    const [isOptimized, setIsOptimized] = React.useState(false);
    const [checkProgress, setCheckProgress] = React.useState(null);
    const [linkIssues, setLinkIssues] = React.useState(null);

    // Load optimization setting and link statuses on mount
    React.useEffect(() => {
        const initializeTab = async () => {
            try {
                // Load optimization setting
                const optimized = await linkService.isOptimizedCheckingEnabled();
                setIsOptimized(optimized);

                // Load saved link statuses from store
                const savedStatuses = store.getUrlData(currentUrl, 'linkStatuses', {});
                if (savedStatuses && Object.keys(savedStatuses).length > 0) {
                    logger.info('LinksTab', `Loaded ${Object.keys(savedStatuses).length} saved link statuses from store`);
                    setLinkStatuses(savedStatuses);
                }

                // Load saved link issues from store
                const savedIssues = store.getUrlData(currentUrl, 'linkIssues', null);
                if (savedIssues) {
                    logger.info('LinksTab', 'Loaded saved link issues from store');
                    setLinkIssues(savedIssues);
                }
            } catch (error) {
                logger.error('LinksTab', 'Error initializing links tab:', error);
            }
        };

        initializeTab();
    }, [currentUrl]);

    // Extract data
    const internalLinks = linksData.internal?.count || 0;
    const externalLinks = linksData.external?.count || 0;
    const nofollowLinks = linksData.nofollow?.count || 0;
    const totalLinks = linksData.total || 0;

    // All links combined for the table
    const allLinks = [
        ...(linksData.internal?.items || []).map(link => ({
            ...link,
            type: 'internal',
            dofollow: true
        })),
        ...(linksData.external?.items || []).map(link => ({
            ...link,
            type: 'external',
            dofollow: !link.rel?.includes('nofollow')
        }))
    ].filter(link => {
        // Filter out javascript:void, tel:, mailto: links and links with hash (#) only
        if (!link.href) return true; // Keep links without href for analysis
        const href = link.href.toLowerCase();
        return !href.startsWith('javascript:') &&
               !href.startsWith('tel:') &&
               !href.startsWith('mailto:') &&
               href !== '#' &&
               !href.includes('/#'); // Filter out links with hash fragments
    });

    // Filter links based on active tab and status filter
    const getFilteredLinks = () => {
        // First filter by tab
        let filteredLinks;
        switch(activeTab) {
            case 'internal':
                filteredLinks = allLinks.filter(link => link.type === 'internal');
                break;
            case 'external':
                filteredLinks = allLinks.filter(link => link.type === 'external');
                break;
            case 'nofollow':
                filteredLinks = allLinks.filter(link => !link.dofollow);
                break;
            default:
                filteredLinks = allLinks;
        }

        // Then filter by status if a status filter is active
        if (activeStatusFilter !== 'all' && Object.keys(linkStatuses).length > 0) {
            return filteredLinks.filter(link => {
                if (!link.href) return false;

                const status = linkStatuses[link.href];
                if (!status) return false;

                if (activeStatusFilter === 'error') {
                    return status.status === 'error';
                }

                // Group filters (3xx, 4xx, 5xx)
                if (activeStatusFilter === '3xx' && status.statusCode) {
                    return status.statusCode >= 300 && status.statusCode < 400;
                }

                if (activeStatusFilter === '4xx' && status.statusCode) {
                    return status.statusCode >= 400 && status.statusCode < 500;
                }

                if (activeStatusFilter === '5xx' && status.statusCode) {
                    return status.statusCode >= 500;
                }

                // Filter by specific status code
                return status.statusCode?.toString() === activeStatusFilter;
            });
        }

        return filteredLinks;
    };

    // Function to check link status using background script
    // Prevent multiple simultaneous checks
    const [isCheckingInProgress, setIsCheckingInProgress] = React.useState(false);

    const checkLinkStatus = async () => {
        // Prevent multiple simultaneous checks
        if (isCheckingInProgress) {
            console.warn('Link check already in progress, ignoring request');
            return;
        }

        setIsCheckingInProgress(true);
        setIsCheckingStatus(true);

        // Get links based on the active tab
        const linksToCheck = getFilteredLinks();

        // Reset statuses for links that will be checked
        const linksToReset = {};
        linksToCheck.forEach(link => {
            if (link.href) {
                linksToReset[link.href] = { status: 'checking', statusCode: null };
            }
        });

        // Update UI to show all links as 'checking'
        setLinkStatuses(prevStatuses => ({
            ...prevStatuses,
            ...linksToReset
        }));

        console.log(`Checking ${linksToCheck.length} links in the '${activeTab}' tab using ${isOptimized ? 'optimized' : 'standard'} mode`);

        try {
            // Reset progress state
            setCheckProgress(null);

            // Use callback to update UI after each batch
            const statuses = await linkService.checkLinksStatus(
                linksToCheck, // Only check links in the current tab
                (batchStatuses) => {
                    // Update link statuses after each batch
                    setLinkStatuses(prevStatuses => {
                        const newStatuses = {
                            ...prevStatuses,
                            ...batchStatuses
                        };

                        // Save to store
                        store.saveUrlData(currentUrl, 'linkStatuses', newStatuses);

                        return newStatuses;
                    });
                },
                (progress) => {
                    // Update progress state
                    setCheckProgress(progress);
                },
                isOptimized // Pass the optimized flag to determine which mode to use
            );

            // Final update with all statuses
            setLinkStatuses(prevStatuses => {
                const finalStatuses = {
                    ...prevStatuses,
                    ...statuses
                };

                // Save final statuses to store
                store.saveUrlData(currentUrl, 'linkStatuses', finalStatuses);
                logger.info('LinksTab', `Saved ${Object.keys(finalStatuses).length} link statuses to store`);

                return finalStatuses;
            });
        } catch (error) {
            logger.error('LinksTab', 'Error checking link status:', error);

            // Log error instead of using alert
            logger.error('LinksTab', `Error checking links: ${error.message || 'Unknown error'}`);
        } finally {
            // Always set checking status to false, even if there was an error
            setIsCheckingStatus(false);
            setIsCheckingInProgress(false);

            // Reset progress after a delay to show completion
            setTimeout(() => setCheckProgress(null), 2000);
        }
    };

    // Export link data as JSON or CSV
    const handleExportLinkData = (format = 'json') => {
        // Get filtered links based on current tab and status filter
        const filteredLinks = getFilteredLinks();

        // Create data to export
        const exportData = {
            url: data.url,
            timestamp: new Date().toISOString(),
            summary: {
                total: totalLinks,
                internal: internalLinks,
                external: externalLinks,
                nofollow: nofollowLinks,
                filtered: filteredLinks.length
            },
            filters: {
                tab: activeTab,
                statusFilter: activeStatusFilter
            },
            links: filteredLinks, // Use the currently filtered links
            linkStatuses: linkStatuses
        };

        // Use link service to export data in the specified format
        linkService.exportLinkData(exportData, format);

        // Show notification using console instead of DOM manipulation
        logger.info('LinksTab', `Successfully exported ${filteredLinks.length} links as ${format.toUpperCase()}`);
        // TODO: Implement proper React notification component
    };

    // Handler for toggling optimization
    const handleToggleOptimized = (newValue) => {
        setIsOptimized(newValue);
    };

    // Reset status filter when tab changes
    React.useEffect(() => {
        setActiveStatusFilter('all');
    }, [activeTab]);

    // Render the main UI
    return React.createElement('div', { style: styles.spaceY3 },
        // Link Count Cards (Summary statistics)
        React.createElement(LinkCountCards, {
            counts: {
                all: totalLinks,
                internal: internalLinks,
                external: externalLinks,
                nofollow: nofollowLinks
            },
            activeTab,
            onTabChange: setActiveTab
        }),

        // Link Distribution
        React.createElement(LinkDistribution, {
            internal: internalLinks,
            external: externalLinks,
            total: totalLinks
        }),

        // Link Issues Table
        React.createElement(LinkIssuesTable, {
            links: getFilteredLinks(), // Use filtered links based on active tab
            statuses: linkStatuses,
            activeTab: activeTab,
            currentUrl: currentUrl
        }),

        // Links Table with filters and status checking
        React.createElement('div', { style: styles.cardSection },
            // Title and export button row
            React.createElement('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }
            }, [
                // Title
                React.createElement('div', {
                    key: 'title',
                    style: styles.cardTitle
                },
                    `Links (${getFilteredLinks().length} ${activeTab !== 'all' ? activeTab : ''} links)`
                ),

                // Keep container empty for positioning
                React.createElement('div', { key: 'empty-spacer' }),

                // Export button directly in the header
                React.createElement('div', {
                    key: 'export-container',
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: 'auto'
                    }
                },
                    React.createElement(LinkExportButton, {
                        onClick: handleExportLinkData
                    })
                )
            ]),

            // Links table with optimization toggle and check functionality added
            React.createElement(LinkTable, {
                links: getFilteredLinks(),
                allLinks: allLinks,
                showAll: showAllLinks,
                onToggleShowAll: () => setShowAllLinks(!showAllLinks),
                statuses: linkStatuses,
                activeTab,
                onTabChange: (tab) => {
                    setActiveTab(tab);
                    setActiveStatusFilter('all'); // Reset status filter when tab changes
                },
                activeStatusFilter,
                onStatusFilterChange: setActiveStatusFilter,
                filteredCount: getFilteredLinks().length,
                isOptimized: isOptimized,
                onToggleOptimized: handleToggleOptimized,
                isCheckingStatus: isCheckingStatus,
                checkProgress: checkProgress,
                onCheckStatus: checkLinkStatus
            }),

            // REMOVED: Direct DOM manipulation moved to React components
        ),

        // Export Button removed from here (now in header)
    );
};
