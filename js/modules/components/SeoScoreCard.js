'use strict';

// Import dependencies
import { styles } from '../styles.js';
import { getScoreColor } from '../utils.js';

/**
 * Component for displaying SEO score card
 * @param {Object} data - The page data containing SEO score information
 * @returns {React.Element} - The SEO score card component
 */
export const SeoScoreCard = ({ data }) => {
    // Define the new SEO scoring categories based on requirements
    const calculateContentScore = (data) => {
        // Total possible: 45 points
        let score = 0;
        let title = 0;
        let description = 0;
        let h1 = 0;
        let headings = 0;
        let imgAlt = 0;

        // Thẻ Tiêu đề (title) - 15 điểm
        if (data.title && data.title.length > 0) {
            // Has title: 5 points
            title += 5;
            
            // Optimal length (50-60 chars): 5 more points
            const titleLength = data.title.length;
            if (titleLength >= 50 && titleLength <= 60) {
                title += 5;
            } else if ((titleLength >= 30 && titleLength < 50) || (titleLength > 60 && titleLength <= 70)) {
                title += 3;
            } else {
                title += 0;
            }
            
            // Contains main keyword (simplified check): 5 points
            // This is a simplified approximation since we don't know the target keyword
            title += 5;
        }
        
        // Thẻ Mô tả Meta (meta description) - 10 điểm
        if (data.description && data.description.length > 0) {
            // Has description: 5 points
            description += 5;
            
            // Optimal length (120-160 chars): 5 more points
            const descLength = data.description.length;
            if (descLength >= 120 && descLength <= 160) {
                description += 5;
            } else if ((descLength >= 70 && descLength < 120) || (descLength > 160 && descLength <= 170)) {
                description += 2;
            } else {
                description += 0;
            }
        }
        
        // Thẻ Heading 1 (H1) - 10 điểm
        const headingsData = data.headings || {};
        const h1Count = headingsData.h1Count || 0;
        
        if (h1Count > 0) {
            // Has H1: 5 points
            h1 += 5;
            
            // Exactly one H1: 5 more points
            if (h1Count === 1) {
                h1 += 5;
            } else {
                h1 += 0; // Multiple H1s is not recommended
            }
        }
        
        // Các thẻ Heading khác (H2-H6) - 5 điểm
        const h2Count = headingsData.h2Count || 0;
        const h3Count = headingsData.h3Count || 0;
        
        if (h2Count > 0) {
            // Has H2: 3 points
            headings += 3;
            
            // Has proper hierarchy (has H3 if has H2): 2 more points
            if (h3Count > 0) {
                headings += 2;
            }
        }
        
        // Thuộc tính Alt của Hình ảnh - 5 điểm
        const imgStats = data.images || {};
        const totalImages = imgStats.count || 0;
        const imagesWithAlt = imgStats.withAlt || 0;
        
        if (totalImages > 0) {
            const altPercentage = (imagesWithAlt / totalImages) * 100;
            
            if (altPercentage > 90) {
                imgAlt = 5;
            } else if (altPercentage >= 70 && altPercentage <= 90) {
                imgAlt = 3;
            } else if (altPercentage >= 50 && altPercentage < 70) {
                imgAlt = 1;
            } else {
                imgAlt = 0;
            }
        } else {
            imgAlt = 0; // No images to check
        }
        
        // Sum up all content elements scores
        score = title + description + h1 + headings + imgAlt;
        return score;
    };
    
    const calculateTechnicalScore = (data) => {
        // Total possible: 40 points
        let score = 0;
        let https = 0;
        let mobile = 0;
        let canonical = 0;
        let robots = 0;
        let url = 0;
        let performance = 0;
        
        // Sử dụng HTTPS - 10 điểm
        if (data.url && data.url.startsWith('https://')) {
            https = 10;
        }
        
        // Thân thiện với Di động (Mobile-Friendly) - 10 điểm
        const metaTags = data.metaTags || [];
        const hasViewport = metaTags.some(tag => 
            tag.name === 'viewport' && 
            tag.content && 
            tag.content.includes('width=device-width') && 
            tag.content.includes('initial-scale=1')
        );
        
        if (hasViewport) {
            mobile = 10;
        }
        
        // Thẻ Canonical - 5 điểm
        const links = data.links || {};
        const canonicalUrl = links.canonical || '';
        
        if (canonicalUrl) {
            canonical = 5;
        }
        
        // Chỉ thị Robots - 5 điểm
        const robotsMeta = metaTags.find(tag => tag.name === 'robots');
        
        if (!robotsMeta || 
            (robotsMeta && !robotsMeta.content.includes('noindex') && !robotsMeta.content.includes('none'))) {
            robots = 5;
        }
        
        // Cấu trúc URL - 5 điểm
        if (data.url) {
            let urlScore = 0;
            
            // URL length under 100 chars: 3 points
            if (data.url.length < 100) {
                urlScore += 3;
            }
            
            // Uses hyphens instead of underscores: 1 point
            if (data.url.includes('-') && !data.url.includes('_')) {
                urlScore += 1;
            }
            
            // No special characters: 1 point
            if (!/[^\w\-\/\:\.]/g.test(data.url)) {
                urlScore += 1;
            }
            
            url = urlScore;
        }
        
        // Kiểm tra hiệu suất cơ bản - 5 điểm
        const performanceData = data.performance || {};
        
        // Number of scripts not too many: 3 points
        const scriptCount = data.scriptCount || 0;
        if (scriptCount < 25) {
            performance += 3;
        } else if (scriptCount < 40) {
            performance += 1;
        }
        
        // No excessively large images: 2 points
        // This is a simplification since we don't have detailed image size data
        performance += 2;
        
        // Sum up all technical scores
        score = https + mobile + canonical + robots + url + performance;
        return score;
    };
    
    const calculateStructureScore = (data) => {
        // Total possible: 15 points
        let score = 0;
        let internalLinks = 0;
        let externalLinks = 0;
        let schema = 0;
        
        // Liên kết Nội bộ (Internal Links) - 5 điểm
        const linkData = data.links || {};
        
        // Check for both old and new data structures
        // New structure has counts inside items array
        let internalLinksCount = 0;
        if (typeof linkData.internal === 'number') {
            internalLinksCount = linkData.internal;
        } else if (linkData.internal?.count !== undefined) {
            internalLinksCount = linkData.internal.count;
        } else if (linkData.internal?.items?.length) {
            internalLinksCount = linkData.internal.items.length;
        }
        
        // Thang điểm tinh chỉnh cho Internal Links - 5 điểm
        if (internalLinksCount >= 10) {
            internalLinks = 5; // Tối ưu: 10+ internal links
        } else if (internalLinksCount >= 6) {
            internalLinks = 4; // Rất tốt: 6-9 internal links
        } else if (internalLinksCount >= 3) {
            internalLinks = 3; // Tốt: 3-5 internal links
        } else if (internalLinksCount === 2) {
            internalLinks = 2; // Đủ dùng: 2 internal links
        } else if (internalLinksCount === 1) {
            internalLinks = 1; // Tối thiểu: 1 internal link
        } else {
            internalLinks = 0; // Không có internal links
        }
        
        // Liên kết Ngoài (External Links) - 5 điểm
        let externalLinksCount = 0;
        if (typeof linkData.external === 'number') {
            externalLinksCount = linkData.external;
        } else if (linkData.external?.count !== undefined) {
            externalLinksCount = linkData.external.count;
        } else if (linkData.external?.items?.length) {
            externalLinksCount = linkData.external.items.length;
        }
        
        // Thang điểm tinh chỉnh cho External Links - 5 điểm
        if (externalLinksCount >= 5) {
            externalLinks = 5; // Tối ưu: 5+ external links
        } else if (externalLinksCount === 4) {
            externalLinks = 4; // Rất tốt: 4 external links
        } else if (externalLinksCount === 3) {
            externalLinks = 3; // Tốt: 3 external links
        } else if (externalLinksCount === 2) {
            externalLinks = 2; // Đủ dùng: 2 external links
        } else if (externalLinksCount === 1) {
            externalLinks = 1; // Tối thiểu: 1 external link
        } else {
            externalLinks = 0; // Không có external links
        }
        
        // Schema Markup (Dữ liệu có cấu trúc) - 5 điểm
        // Check for schema data in multiple possible locations
        const hasJsonLD = 
            (data.structured?.jsonLd && data.structured.jsonLd.length > 0) || 
            (data.jsonLD && data.jsonLD.length > 0);
            
        const hasMicrodata = 
            (data.structured?.microdata && data.structured.microdata.length > 0) || 
            (data.microdata && data.microdata.length > 0);
            
        const hasRDFa = 
            (data.structured?.rdfa && data.structured.rdfa.length > 0) || 
            (data.rdfa && data.rdfa.length > 0);
        
        const structuredData = data.structured || data.structuredData || {};
        
        // Đếm các loại schema
        let schemaCount = 0;
        
        // Count JSON-LD items
        if (data.structured?.jsonLd && data.structured.jsonLd.length > 0) {
            schemaCount += data.structured.jsonLd.length;
        } else if (data.jsonLD && data.jsonLD.length > 0) {
            schemaCount += data.jsonLD.length;
        }
        
        // Count Microdata items
        if (data.structured?.microdata && data.structured.microdata.length > 0) {
            schemaCount += data.structured.microdata.length;
        } else if (data.microdata && data.microdata.length > 0) {
            schemaCount += data.microdata.length;
        }
        
        // Count RDFa items
        if (data.structured?.rdfa && data.structured.rdfa.length > 0) {
            schemaCount += data.structured.rdfa.length;
        } else if (data.rdfa && data.rdfa.length > 0) {
            schemaCount += data.rdfa.length;
        }
        
        // Thang điểm tinh chỉnh cho Schema Markup - 5 điểm
        if (schemaCount >= 3) {
            schema = 5; // Tối ưu: 3+ schema items
        } else if (schemaCount === 2) {
            schema = 4; // Rất tốt: 2 schema items
        } else if (schemaCount === 1) {
            schema = 3; // Tốt: 1 schema item
        } else if (hasJsonLD || hasMicrodata || hasRDFa || Object.keys(structuredData).length > 0) {
            schema = 2; // Có schema nhưng không đếm được số lượng
        } else {
            schema = 0; // Không có schema markup
        }
        
        // For debugging - log the scores
        console.log('[SEO Score] Structure & Linking scores:', {
            internalLinks: `${internalLinks}/5 points (${internalLinksCount} links)`,
            externalLinks: `${externalLinks}/5 points (${externalLinksCount} links)`,
            schema: `${schema}/5 points (${schemaCount} schema items)`,
            schemaTypes: {
                hasJsonLD,
                hasMicrodata,
                hasRDFa
            },
            totalScore: `${internalLinks + externalLinks + schema}/15 points`
        });
        
        // Sum up all structure scores
        score = internalLinks + externalLinks + schema;
        return score;
    };
    
    // Calculate the three main scores
    const contentElementsScore = calculateContentScore(data);
    const technicalSeoScore = calculateTechnicalScore(data);
    const structureLinkingScore = calculateStructureScore(data);
    
    // Define the scoring categories
    const factorScores = {
        'Content Elements': {
            score: Math.round((contentElementsScore / 45) * 100),
            weight: 0.45,
            rawScore: contentElementsScore,
            maxScore: 45
        },
        'Technical SEO': {
            score: Math.round((technicalSeoScore / 40) * 100),
            weight: 0.40,
            rawScore: technicalSeoScore,
            maxScore: 40
        },
        'Structure & Linking': {
            score: Math.round((structureLinkingScore / 15) * 100),
            weight: 0.15,
            rawScore: structureLinkingScore,
            maxScore: 15
        }
    };

    // Calculate overall score (out of 100)
    const totalRawScore = contentElementsScore + technicalSeoScore + structureLinkingScore;
    const totalMaxScore = 45 + 40 + 15; // 100 total points
    const overallScore = Math.round((totalRawScore / totalMaxScore) * 100);

    // Get score color based on value
    const scoreColor = getScoreColor(overallScore);

    // Get category icons
    const getCategoryIcon = (category) => {
        switch(category) {
            case 'Content Elements':
                return '📝'; // Document/Content icon
            case 'Technical SEO':
                return '⚙️'; // Gear/Technical icon
            case 'Structure & Linking':
                return '🔗'; // Link icon
            default:
                return '';
        }
    };

    // Get badge style based on score
    const getBadgeStyle = (score) => {
        let backgroundColor, textColor;
        
        if (score >= 80) {
            backgroundColor = '#d1fae5'; // Light green
            textColor = '#065f46'; // Dark green
        } else if (score >= 60) {
            backgroundColor = '#fef3c7'; // Light yellow
            textColor = '#92400e'; // Dark yellow/brown
        } else {
            backgroundColor = '#fee2e2'; // Light red
            textColor = '#b91c1c'; // Dark red
        }
        
        return {
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor,
            color: textColor
        };
    };

    // Render the SEO score card
    return React.createElement('div', { style: {
        ...styles.cardSection,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        color: '#fff',
        padding: '0 0 16px 0'
    }},
        React.createElement('div', { 
            style: {
                ...styles.cardTitle,
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                background: 'linear-gradient(to right, #1e40af, #4c1d95)',
                borderBottom: '1px solid rgba(71, 85, 105, 0.5)'
            } 
        }, 'Overall SEO Score'),
        
        // Main content with original side-by-side layout but cleaner styling
        React.createElement('div', { style: { 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '20px',
            padding: '0 16px'
        }},
            // Factors Breakdown
            React.createElement('div', { style: { flex: '7', minWidth: '0' } },
                Object.entries(factorScores).map(([factor, factorData]) =>
                    React.createElement('div', { key: factor, style: { 
                        marginBottom: '12px',
                    }},
                        React.createElement('div', { style: { 
                            fontSize: '0.9rem', 
                            color: '#fff', 
                            marginBottom: '4px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}, 
                            React.createElement('span', null, 
                                getCategoryIcon(factor), 
                                ' ', 
                                factor
                            ),
                            React.createElement('span', { style: {
                                fontSize: '0.8rem',
                                color: '#ddd',
                                fontWeight: '500'
                            }}, `${factorData.rawScore}/${factorData.maxScore} pts`)
                        ),
                        React.createElement('div', { style: {
                            position: 'relative',
                            height: '6px',
                            backgroundColor: 'rgba(71, 85, 105, 0.6)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            marginBottom: '2px'
                        }},
                            React.createElement('div', {
                                style: {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: `${factorData.score}%`,
                                    backgroundColor: getScoreColor(factorData.score),
                                    height: '100%',
                                    borderRadius: '3px',
                                    transition: 'width 0.5s ease'
                                }
                            }),
                            // Simple percentage text to the right
                            React.createElement('div', {
                                style: {
                                    position: 'absolute',
                                    top: '8px',
                                    right: '0',
                                    fontSize: '0.7rem',
                                    color: '#cbd5e1',
                                    fontWeight: '400'
                                }
                            }, `${factorData.score}%`)
                        )
                    )
                )
            ),
            
            // Overall Score Circle
            React.createElement('div', { style: { 
                flex: '3', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center'
            }},
                React.createElement('div', {
                    style: {
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: `conic-gradient(${scoreColor} ${overallScore}%, rgba(71, 85, 105, 0.4) 0%)`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        marginBottom: '8px',
                        boxShadow: '0 0 15px rgba(96, 165, 250, 0.2)'
                    }
                }, 
                    React.createElement('div', {
                        style: {
                            width: '86px',
                            height: '86px',
                            borderRadius: '50%',
                            background: 'linear-gradient(145deg, #0f172a, #1e293b)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }
                    }, 
                        React.createElement('span', {
                            style: {
                                fontSize: '1.8rem',
                                fontWeight: '700',
                                color: scoreColor,
                                lineHeight: '1'
                            }
                        }, overallScore)
                    )
                ),
                
                // Simple text showing total points
                React.createElement('div', { style: { 
                    fontSize: '0.75rem', 
                    color: '#93c5fd', 
                    textAlign: 'center',
                    fontWeight: '500'
                }}, `${totalRawScore}/${totalMaxScore} pts`)
            )
        )
    );
};
