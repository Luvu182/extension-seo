'use strict';

/**
 * TextAnalysis Component - Displays text content analysis for a webpage
 * @param {Object} props - Component props
 * @param {Object} props.pageData - The page data containing text content information
 * @param {Function} props.renderStatItem - Helper function to render stat items consistently
 * @returns {React.Element} Rendered component
 */
export const TextAnalysis = ({ pageData, renderStatItem }) => {
    // --- Page Content Analysis Data ---
    const titleCount = pageData.title?.length || 0;
    const titleStatus = titleCount >= 30 && titleCount <= 60 ? 'good' : titleCount > 0 ? 'warning' : 'bad';
    const titleStatusColor = titleStatus === 'good' ? '#10b981' : titleStatus === 'warning' ? '#f59e0b' : '#ef4444';

    const descCount = pageData.description?.length || 0;
    const descStatus = descCount >= 120 && descCount <= 160 ? 'good' : descCount > 0 ? 'warning' : 'bad';
    const descStatusColor = descStatus === 'good' ? '#10b981' : descStatus === 'warning' ? '#f59e0b' : '#ef4444';

    let headingsCount = 0;
    if (pageData.content?.headings) {
        headingsCount = pageData.content.headings.length;
    } else if (pageData.headings) {
        // Convert alternative headings format
        headingsCount = Object.values(pageData.headings).reduce((sum, headingArray) => 
            sum + (Array.isArray(headingArray) ? headingArray.length : 0), 0);
    }

    // Get actual word count from the content data or show "Calculating..." if not available
    const wordCount = pageData.content?.wordCount || (pageData.wordCount || 0);
    const wordCountText = wordCount > 0 ? wordCount.toLocaleString() : 'Calculating...';

    return React.createElement(React.Fragment, null,
        // Content Stats
        React.createElement('div', { 
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px',
                marginBottom: '16px'
            }
        },
            renderStatItem('Title', `${titleCount} chars`, titleStatusColor),
            renderStatItem('Meta Description', `${descCount} chars`, descStatusColor),
            renderStatItem('Headings', headingsCount.toString()),
            renderStatItem('Word Count', wordCountText)
        ),
        
        // Title and Description
        React.createElement('div', { 
            style: { 
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
            } 
        },
            React.createElement('div', { 
                style: { 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    marginBottom: '4px', 
                    color: '#64748b' 
                } 
            }, 'Page Title'),
            
            React.createElement('div', { 
                style: { 
                    fontSize: '0.9rem', 
                    marginBottom: '12px', 
                    wordBreak: 'break-word', 
                    color: '#1e293b' 
                } 
            }, pageData.title || 'No title found'),
            
            React.createElement('div', { 
                style: { 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    marginBottom: '4px', 
                    color: '#64748b' 
                } 
            }, 'Meta Description'),
            
            React.createElement('div', { 
                style: { 
                    fontSize: '0.9rem', 
                    wordBreak: 'break-word', 
                    color: '#1e293b' 
                } 
            }, pageData.description || 'No meta description found')
        )
    );
};
