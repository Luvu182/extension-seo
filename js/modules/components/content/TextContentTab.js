'use strict';

import { styles } from '../../styles.js';
import { HeadingStructure } from '../HeadingStructure.js';
import { StatItem } from '../common/StatItem.js';
import { RecommendationItem } from '../common/RecommendationItem.js';

/**
 * TextContentTab - Displays text content analysis
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Page data to analyze
 * @param {boolean} props.includeHeaderFooterHeadings - Whether to include header/footer headings
 * @param {Function} props.toggleHeaderFooterHeadings - Function to toggle header/footer heading inclusion
 * @returns {React.Element} Rendered component
 */
export const TextContentTab = React.memo(({ data, includeHeaderFooterHeadings, toggleHeaderFooterHeadings }) => {
    // Calculate stats for content
    const titleCount = data.title?.length || 0;
    const titleStatus = titleCount >= 30 && titleCount <= 60 ? 'good' : titleCount > 0 ? 'warning' : 'bad';
    const titleStatusColor = titleStatus === 'good' ? '#10b981' : titleStatus === 'warning' ? '#f59e0b' : '#ef4444';

    const descCount = data.description?.length || 0;
    const descStatus = descCount >= 120 && descCount <= 160 ? 'good' : descCount > 0 ? 'warning' : 'bad';
    const descStatusColor = descStatus === 'good' ? '#10b981' : descStatus === 'warning' ? '#f59e0b' : '#ef4444';

    let headingsCount = 0;
    if (data.content?.headings) {
        headingsCount = data.content.headings.length;
    } else if (data.headings) {
        // Convert alternative headings format
        headingsCount = Object.values(data.headings).reduce((sum, headingArray) => 
            sum + (Array.isArray(headingArray) ? headingArray.length : 0), 0);
    }

    const wordCount = data.content?.wordCount || (data.wordCount || 0);
    const wordCountText = wordCount > 0 ? wordCount.toLocaleString() : 'Calculating...';
    
    // Prepare recommendations
    const recommendations = [];
    
    if (!data.title) {
        recommendations.push({ title: 'Add Page Title', description: 'Missing title tag. Search engines and users rely on page titles to understand what a page is about.', priority: 'high' });
    } else if (titleCount < 30) {
        recommendations.push({ title: 'Improve Title Length', description: `Title too short (${titleCount} chars). Most search engines display up to 60 characters.`, priority: 'medium' });
    } else if (titleCount > 60) {
        recommendations.push({ title: 'Optimize Title Length', description: `Title too long (${titleCount} chars). May get cut off in search results.`, priority: 'medium' });
    }

    if (!data.description) {
        recommendations.push({ title: 'Add Meta Description', description: 'Missing meta description. This helps improve click-through rates from search results.', priority: 'high' });
    } else if (descCount < 120) {
        recommendations.push({ title: 'Improve Description Length', description: `Description too short (${descCount} chars). Aim for 120-160 characters.`, priority: 'medium' });
    } else if (descCount > 160) {
        recommendations.push({ title: 'Optimize Description Length', description: `Description too long (${descCount} chars). Focus on concise content.`, priority: 'medium' });
    }

    // Add more recommendations as needed
    if (wordCount < 300) {
        recommendations.push({ title: 'Expand Content Depth', description: 'Content appears too thin. Consider adding more comprehensive information.', priority: 'medium' });
    }
    
    // Return the text tab content
    return React.createElement(React.Fragment, null,
        // Page Content Analysis Section
        React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, 'Page Content Analysis'),
            React.createElement('div', { style: styles.gridStats },
                React.createElement(StatItem, { label: 'Title', value: `${titleCount} chars`, indicatorColor: titleStatusColor }),
                React.createElement(StatItem, { label: 'Meta Description', value: `${descCount} chars`, indicatorColor: descStatusColor }),
                React.createElement(StatItem, { label: 'Headings', value: headingsCount.toString() }),
                React.createElement(StatItem, { label: 'Word Count', value: wordCountText })
            ),
            React.createElement('div', { style: { ...styles.lightBackground, marginTop: '16px' } },
                React.createElement('div', { style: { fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: '#64748b' } }, 'Page Title'),
                React.createElement('div', { style: { fontSize: '0.9rem', marginBottom: '12px', wordBreak: 'break-word', color: '#1e293b' } }, data.title || 'No title found'),
                React.createElement('div', { style: { fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: '#64748b' } }, 'Meta Description'),
                React.createElement('div', { style: { fontSize: '0.9rem', wordBreak: 'break-word', color: '#1e293b' } }, data.description || 'No meta description found')
            )
        ),
        
        // Heading Structure Section
        React.createElement('div', { style: styles.cardSection },
            // Pass the new props down to HeadingStructure
            React.createElement(HeadingStructure, { 
                pageData: data, 
                includeHeaderFooter: includeHeaderFooterHeadings, 
                toggleHeaderFooter: toggleHeaderFooterHeadings 
            })
        ),
        
        // Content Recommendations Section
        React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: styles.cardTitle }, 'Content Recommendations'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
                recommendations.map((rec, index) =>
                    React.createElement(RecommendationItem, {
                        key: index,
                        title: rec.title,
                        description: rec.description,
                        priority: rec.priority
                    })
                )
            )
        )
    );
});
