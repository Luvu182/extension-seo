'use strict';

/**
 * ImageIssueCard - Displays image issues with examples
 * 
 * @param {Object} props - Component props
 * @param {string} props.issueType - Type of issue: 'missing-alt' or 'non-optimized-filename'
 * @param {number} props.count - Number of affected images
 * @param {Array} props.images - Sample images with the issue (up to 3)
 * @param {number} props.totalCount - Total number of affected images
 * @returns {React.Element} Rendered component
 */
export const ImageIssueCard = React.memo(({ issueType, count, images, totalCount }) => {
    // Helper function to truncate text with ellipsis
    const truncateText = (text, maxLength = 50) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const isMissingAlt = issueType === 'missing-alt';
    
    // Style and text based on issue type
    const cardStyle = { 
        backgroundColor: isMissingAlt ? '#fff1f2' : '#fff7ed', 
        borderRadius: '6px', 
        padding: '12px', 
        marginBottom: isMissingAlt ? '12px' : 0,
        borderLeft: `3px solid ${isMissingAlt ? '#ef4444' : '#f59e0b'}`
    };
    
    const titleColor = isMissingAlt ? '#dc2626' : '#d97706';
    const dotColor = isMissingAlt ? '#ef4444' : '#f59e0b';
    
    const title = isMissingAlt
        ? `${count} ${count === 1 ? 'Image is' : 'Images are'} Missing Alt Text`
        : `${count} ${count === 1 ? 'Image has' : 'Images have'} Non-Optimized Filenames`;
        
    const description = isMissingAlt
        ? 'Alt text improves accessibility and helps search engines understand your images. Add descriptive alt text to all relevant images.'
        : 'Image filenames with special characters, spaces or encoded characters (like %20) can cause issues and are less SEO-friendly. Use descriptive filenames with hyphens instead of spaces.';
    
    return React.createElement('div', { style: cardStyle },
        React.createElement('div', { 
            style: { 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: titleColor 
            } 
        }, title),
        React.createElement('div', { 
            style: { 
                fontSize: '0.8rem', 
                color: '#4b5563', 
                marginBottom: '8px' 
            } 
        }, description),
        images.length > 0 && images.map((img, idx) => 
            React.createElement('div', { 
                key: `${issueType}-${idx}`,
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    marginBottom: idx < Math.min(images.length, 3) - 1 ? '4px' : 0
                }
            },
                React.createElement('span', { 
                    style: { 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: dotColor, 
                        marginRight: '6px' 
                    } 
                }),
                React.createElement('span', {
                    style: {
                        color: '#4b5563',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }
                }, truncateText(img.filename || (img.src ? img.src.split('/').pop() : 'Unknown')))
            )
        ),
        totalCount > 3 && React.createElement('div', {
            style: {
                fontSize: '0.75rem',
                color: '#6b7280',
                fontStyle: 'italic',
                marginTop: '4px'
            }
        }, `... and ${totalCount - 3} more`)
    );
});