'use strict';

import React from 'react';

import { styles } from '../../styles.js';
import { linkService } from '../../services/link-service.js';
import { store } from '../../store.js';

/**
 * Component to display link issues and recommendations
 * @param {Object} props - Component props
 * @param {Array} props.links - Array of all link objects
 * @param {Object} props.statuses - Object containing link status information
 * @param {string} props.activeTab - Currently active tab
 * @param {string} props.currentUrl - Current URL for storing data
 * @returns {React.Element} Rendered component
 */
export const LinkIssuesTable = ({ links, statuses, activeTab, currentUrl }) => {
    // Use state to track issues
    const [issues, setIssues] = React.useState({
        security: { title: 'Security Issues', color: '#ef4444', items: [] },
        seo: { title: 'SEO Issues', color: '#f59e0b', items: [] },
        structure: { title: 'Structure Issues', color: '#60a5fa', items: [] },
        status: { title: 'Status Issues', color: '#8b5cf6', items: [] }
    });
    const [totalIssues, setTotalIssues] = React.useState(0);

    // Update issues when links or statuses change
    React.useEffect(() => {
        const newIssues = linkService.analyzeIssues(links, statuses);
        setIssues(newIssues);

        const issueCount = Object.values(newIssues).reduce((sum, category) =>
            sum + category.items.length, 0);
        setTotalIssues(issueCount);

        // Save issues to store for other tabs to use
        if (currentUrl && issueCount > 0) {
            store.saveUrlData(currentUrl, 'linkIssues', newIssues);

            // Also update the main pageData object to include these issues
            const pageData = store.getStateSlice('pageData');
            if (pageData) {
                const updatedPageData = {...pageData};
                if (!updatedPageData.links) {
                    updatedPageData.links = {};
                }
                updatedPageData.links.issues = newIssues;
                store.setStateSlice('pageData', updatedPageData);
            }
        }
    }, [links, statuses, currentUrl]); // Re-run when links, statuses, or URL changes

    // Function to render issue category
    const renderIssueCategory = (category) => {
        if (category.items.length === 0) return null;

        return React.createElement('div', {
            key: category.title,
            style: { marginBottom: '16px' }
        },
            React.createElement('h4', {
                style: {
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: category.color,
                    marginBottom: '8px'
                }
            }, `${category.title}`),

            React.createElement('ul', {
                style: {
                    listStyleType: 'disc',
                    paddingLeft: '20px',
                    fontSize: '0.75rem',
                    color: '#e2e8f0'
                }
            },
                category.items.map((issue, index) =>
                    React.createElement('li', { key: index, style: { marginBottom: '4px' } },
                        issue.text,
                        issue.count > 1 ? React.createElement('span', {
                            style: {
                                backgroundColor: 'rgba(100, 116, 139, 0.3)',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                marginLeft: '6px'
                            }
                        }, `${issue.count}`) : null
                    )
                )
            )
        );
    };

    // If no issues found
    const renderNoIssues = () => {
        return React.createElement('div', {
            style: {
                textAlign: 'center',
                padding: '16px',
                color: '#10b981',
                fontSize: '0.875rem'
            }
        }, 'No link issues detected. Great job!');
    };

    // Render the component
    return React.createElement('div', { style: styles.cardSection },
        React.createElement('div', { style: styles.cardTitle },
            `${activeTab !== 'all' ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + ' ' : ''}Link Issues (${totalIssues})`
        ),

        React.createElement('div', { style: { marginTop: '12px' } },
            totalIssues === 0 ?
                renderNoIssues() :
                React.createElement('div', {},
                    renderIssueCategory(issues.security),
                    renderIssueCategory(issues.seo),
                    renderIssueCategory(issues.structure),
                    renderIssueCategory(issues.status)
                )
        ),

        // Recommendation note
        totalIssues > 0 ? React.createElement('div', {
            style: {
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginTop: '16px',
                padding: '8px',
                backgroundColor: 'rgba(100, 116, 139, 0.1)',
                borderRadius: '4px'
            }
        }, 'Tip: Click "Check Status" above to detect broken links and redirects.') : null
    );
};


