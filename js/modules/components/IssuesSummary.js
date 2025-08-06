'use strict';

// Import dependencies
import { styles } from '../styles.js';
import { issueService } from '../services/issue-service.js';

/**
 * Component for displaying issues summary
 * @param {Object} data - The page data containing issues information
 * @returns {React.Element} - The issues summary component
 */
export const IssuesSummary = ({ data }) => {
    // Use the issue service to consolidate issues from all tabs
    const consolidatedIssues = issueService.consolidateIssues(data);
    const criticalCount = consolidatedIssues.critical?.length || 0;
    const warningCount = consolidatedIssues.warnings?.length || 0;
    const suggestionCount = consolidatedIssues.suggestions?.length || 0;

    // Helper function to create an issue item
    const createIssueItem = (label, count, color) => {
        return React.createElement('div', { key: label, style: styles.statItem },
            React.createElement('div', { style: styles.statLabel }, label),
            React.createElement('div', { style: { ...styles.statValue, color: color } }, count.toString())
        );
    };

    // Render the issues summary section
    return React.createElement('div', { style: { ...styles.cardSection, flex: '1', minWidth: '0' } },
        React.createElement('div', { style: styles.cardTitle }, 'Issues Summary'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' } },
            createIssueItem('Critical', criticalCount, '#ef4444'),
            createIssueItem('Warnings', warningCount, '#f59e0b'),
            createIssueItem('Suggestions', suggestionCount, '#3b82f6')
        )
    );
};
