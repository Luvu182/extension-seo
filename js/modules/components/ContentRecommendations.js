'use strict';

/**
 * ContentRecommendations Component - Displays SEO content recommendations
 * @param {Object} props - Component props
 * @param {Object} props.pageData - The page data containing content information
 * @returns {React.Element} Rendered component
 */
export const ContentRecommendations = ({ pageData }) => {
    // --- Prepare recommendations ---
    const recommendations = [];
    const data = pageData;
    
    // Title recommendations
    const titleCount = data.title?.length || 0;
    if (!data.title) recommendations.push({ title: 'Add Page Title', description: 'Missing title tag. Search engines and users rely on page titles to understand what a page is about.', priority: 'high' });
    else if (titleCount < 30) recommendations.push({ title: 'Improve Title Length', description: `Title too short (${titleCount} chars). Most search engines display up to 60 characters of the title tag in search results.`, priority: 'medium' });
    else if (titleCount > 60) recommendations.push({ title: 'Optimize Title Length', description: `Title too long (${titleCount} chars). It may get cut off in search results. Try to keep titles between 30-60 characters.`, priority: 'medium' });

    // Description recommendations
    const descCount = data.description?.length || 0;
    if (!data.description) recommendations.push({ title: 'Add Meta Description', description: 'Missing meta description. A compelling meta description can improve click-through rates from search results.', priority: 'high' });
    else if (descCount < 120) recommendations.push({ title: 'Improve Description Length', description: `Description too short (${descCount} chars). Aim for 120-160 characters to provide meaningful information and maximize SERP real estate.`, priority: 'medium' });
    else if (descCount > 160) recommendations.push({ title: 'Optimize Description Length', description: `Description too long (${descCount} chars). Search engines typically display only around 160 characters. Focus on concise, compelling content.`, priority: 'medium' });

    // H1 recommendations
    let h1Count = 0;
    if (data.content?.headings) {
        h1Count = data.content.headings.filter(h => h.level === 1).length;
    } else if (data.headings?.h1) {
        h1Count = Array.isArray(data.headings.h1) ? data.headings.h1.length : 0;
    }

    if (h1Count === 0) recommendations.push({ title: 'Add H1 Heading', description: 'Missing H1 heading. Every page should have exactly one H1 heading that clearly describes the page topic.', priority: 'high' });
    else if (h1Count > 1) recommendations.push({ title: 'Fix Multiple H1 Headings', description: `Found ${h1Count} H1 headings. Best practice is to use exactly one H1 per page as the main heading.`, priority: 'medium' });

    // Content depth recommendation
    const wordCount = data.content?.wordCount || (data.wordCount || 0);
    if (wordCount < 300) recommendations.push({ title: 'Expand Content Depth', description: 'Content appears too thin. Consider adding more comprehensive information to provide better value to users and improve ranking potential.', priority: 'medium' });
    else if (wordCount < 600) recommendations.push({ title: 'Expand Content Depth', description: 'Consider adding more detailed content to fully cover the topic and signal authority to search engines.', priority: 'low' });
    else recommendations.push({ title: 'Maintain Content Quality', description: 'Content length looks good. Focus on keeping information up-to-date and valuable to users.', priority: 'low' });

    // Image recommendations
    const images = data.images || [];
    const missingAltTextCount = images.filter(img => !img.alt).length;
    if (missingAltTextCount > 0) {
        recommendations.push({ 
            title: 'Add Missing Alt Text', 
            description: `${missingAltTextCount} images missing alt text. Alt text improves accessibility and helps search engines understand image content.`, 
            priority: missingAltTextCount > 2 ? 'high' : 'medium' 
        });
    }

    // Add general recommendations if needed
    if (recommendations.length < 3) {
        const generalRecommendations = [
            { title: 'Use Keywords Naturally', description: 'Incorporate relevant keywords naturally throughout your content. Focus on semantic relevance rather than keyword density.', priority: 'medium' },
            { title: 'Add Visual Content', description: 'Enhance your content with relevant images, videos, or infographics to improve engagement and time on page.', priority: 'medium' },
            { title: 'Improve Readability', description: 'Break up content with subheadings, bullet points, and short paragraphs to improve readability and user experience.', priority: 'medium' },
            { title: 'Include Internal Links', description: 'Add relevant internal links to help users navigate your site and distribute page authority.', priority: 'medium' },
            { title: 'Add Schema Markup', description: 'Implement schema markup to help search engines better understand your content and potentially display rich snippets in search results.', priority: 'medium' }
        ];
        
        for (let i = 0; i < Math.min(5 - recommendations.length, generalRecommendations.length); i++) {
            if (!recommendations.some(rec => rec.title === generalRecommendations[i].title)) {
                recommendations.push(generalRecommendations[i]);
            }
        }
    }

    // Render component
    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        recommendations.map((rec, index) =>
            React.createElement('div', { 
                key: index, 
                style: { 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '6px', 
                    padding: '12px', 
                    borderLeft: `3px solid ${rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#3b82f6'}` 
                } 
            },
                React.createElement('div', { 
                    style: { 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        marginBottom: '4px', 
                        color: rec.priority === 'high' ? '#dc2626' : rec.priority === 'medium' ? '#d97706' : '#2563eb' 
                    } 
                }, rec.title),
                React.createElement('div', { 
                    style: { 
                        fontSize: '0.8rem', 
                        color: '#4b5563', 
                        lineHeight: '1.3' 
                    } 
                }, rec.description)
            )
        )
    );
};
