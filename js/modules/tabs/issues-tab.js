'use strict';

// Issues tab module for SEO AI Assistant

// Import dependencies
// React is global
import { styles } from '../styles.js';
import { dataService } from '../data-service.js';
import { issueService } from '../services/issue-service.js';

// Helper component for Issue Bar
const IssueBar = ({ label, count, total, color }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    // Use React.createElement
    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#f1f5f9' } },
            React.createElement('div', null, label),
            React.createElement('div', { style: { fontWeight: '500' } }, count.toString())
        ),
        React.createElement('div', { style: { height: '8px', width: '100%', backgroundColor: '#475569', borderRadius: '4px', overflow: 'hidden' } },
            React.createElement('div', { style: { height: '100%', width: `${percentage}%`, backgroundColor: color, borderRadius: '4px' } })
        )
    );
};

// Helper component for Issue Item
const IssueItem = ({ issue, index, color }) => {
    // Use React.createElement
    return React.createElement('div', { style: { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: `3px solid ${color}` } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' } },
            React.createElement('div', { style: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: color, color: 'white', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' } }, (index + 1).toString()),
            React.createElement('div', { style: { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' } }, issue.message || 'Unknown issue')
        ),
        issue.description && React.createElement('div', { style: { fontSize: '0.85rem', lineHeight: '1.4', color: '#475569', marginBottom: '8px' } }, issue.description),
        issue.location && React.createElement('div', { style: { fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '6px 8px', borderRadius: '4px', fontFamily: 'monospace' } }, issue.location),
        issue.recommendation && React.createElement(React.Fragment, null,
            React.createElement('div', { style: { fontSize: '0.8rem', fontWeight: '600', marginTop: '8px', marginBottom: '4px', color: '#475569' } }, 'Recommendation:'),
            React.createElement('div', { style: { fontSize: '0.85rem', lineHeight: '1.4', color: '#475569' } }, issue.recommendation)
        )
    );
};

// Function to consolidate issues from different tabs
const consolidateIssues = (data) => {
    if (!data) return { critical: [], warnings: [], suggestions: [] };

    // Start with the main issues
    const issues = {
        critical: [...(data.issues?.critical || [])],
        warnings: [...(data.issues?.warnings || [])],
        suggestions: [...(data.issues?.suggestions || [])]
    };

    // Helper function to avoid duplicate issues
    const addIssue = (category, issue) => {
        // Check if a similar issue already exists
        const existingIssue = issues[category].find(i =>
            i.message === issue.message ||
            (i.category === issue.category && i.description === issue.description)
        );

        if (!existingIssue) {
            issues[category].push(issue);
        }
    };

    // Add issues from content tab (images)
    if (data.images && Array.isArray(data.images)) {
        // Check for missing alt text
        const missingAltImages = data.images.filter(img => !img.alt || img.alt.trim() === '');
        if (missingAltImages.length > 0) {
            addIssue('warnings', {
                category: 'Images',
                message: `${missingAltImages.length} images missing alt text`,
                description: 'Images without alt text reduce accessibility and SEO potential',
                recommendation: 'Add descriptive alt text to all images'
            });
        }

        // Check for images without dimensions
        const imagesWithoutDimensions = data.images.filter(img => !img.width || !img.height);
        if (imagesWithoutDimensions.length > 0) {
            addIssue('warnings', {
                category: 'Images',
                message: `${imagesWithoutDimensions.length} images missing width/height attributes`,
                description: 'Images without dimensions can cause layout shifts during page load',
                recommendation: 'Add width and height attributes to all images'
            });
        }

        // Check for oversized images (larger than 1MB)
        const oversizedImages = data.images.filter(img => img.fileSize && img.fileSize > 1000000);
        if (oversizedImages.length > 0) {
            addIssue('warnings', {
                category: 'Images',
                message: `${oversizedImages.length} oversized images detected`,
                description: 'Large images slow down page load time',
                recommendation: 'Optimize and compress images to improve page speed'
            });
        }

        // Check for non-descriptive image filenames
        const nonDescriptiveImages = data.images.filter(img => {
            const filename = img.src?.split('/')?.pop() || '';
            return /^(image|img|pic|picture|photo|untitled)[0-9]*\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
        });
        if (nonDescriptiveImages.length > 0) {
            addIssue('suggestions', {
                category: 'Images',
                message: `${nonDescriptiveImages.length} images with non-descriptive filenames`,
                description: 'Non-descriptive filenames miss SEO opportunities',
                recommendation: 'Use descriptive, keyword-rich filenames for images'
            });
        }
    }

    // Add issues from content tab (text content)
    if (data.title || data.description || data.content) {
        // Check title length
        const titleLength = data.title?.length || 0;
        if (titleLength === 0) {
            addIssue('critical', {
                category: 'Content',
                message: 'Missing page title',
                description: 'Page title is essential for SEO and user experience',
                recommendation: 'Add a descriptive title tag to your page'
            });
        } else if (titleLength < 30) {
            addIssue('warnings', {
                category: 'Content',
                message: `Title too short (${titleLength} characters)`,
                description: 'Short titles may not adequately describe page content',
                recommendation: 'Aim for titles between 50-60 characters'
            });
        } else if (titleLength > 60) {
            addIssue('warnings', {
                category: 'Content',
                message: `Title too long (${titleLength} characters)`,
                description: 'Long titles may be truncated in search results',
                recommendation: 'Keep titles under 60 characters'
            });
        }

        // Check meta description
        const descLength = data.description?.length || 0;
        if (descLength === 0) {
            addIssue('warnings', {
                category: 'Content',
                message: 'Missing meta description',
                description: 'Meta descriptions help improve click-through rates from search results',
                recommendation: 'Add a compelling meta description'
            });
        } else if (descLength < 120) {
            addIssue('suggestions', {
                category: 'Content',
                message: `Meta description too short (${descLength} characters)`,
                description: 'Short descriptions may not adequately describe page content',
                recommendation: 'Aim for descriptions between 120-160 characters'
            });
        } else if (descLength > 160) {
            addIssue('suggestions', {
                category: 'Content',
                message: `Meta description too long (${descLength} characters)`,
                description: 'Long descriptions may be truncated in search results',
                recommendation: 'Keep descriptions under 160 characters'
            });
        }

        // Check heading structure
        let h1Count = 0;
        let h2Count = 0;

        if (data.content?.headings) {
            h1Count = data.content.headings.filter(h => h.level === 1).length;
            h2Count = data.content.headings.filter(h => h.level === 2).length;
        } else if (data.headings) {
            h1Count = data.headings.h1?.length || 0;
            h2Count = data.headings.h2?.length || 0;
        }

        if (h1Count === 0) {
            addIssue('critical', {
                category: 'Content',
                message: 'Missing H1 heading',
                description: 'H1 headings are important for page structure and SEO',
                recommendation: 'Add a single H1 heading that describes the page content'
            });
        } else if (h1Count > 1) {
            addIssue('warnings', {
                category: 'Content',
                message: `Multiple H1 headings (${h1Count})`,
                description: 'Multiple H1 headings can confuse search engines about the main topic',
                recommendation: 'Use only one H1 heading per page'
            });
        }

        if (h2Count === 0) {
            addIssue('suggestions', {
                category: 'Content',
                message: 'No H2 headings found',
                description: 'H2 headings help organize content and improve readability',
                recommendation: 'Add H2 headings to structure your content'
            });
        }

        // Check word count
        const wordCount = data.content?.wordCount || data.wordCount || 0;
        if (wordCount < 200) {
            addIssue('critical', {
                category: 'Content',
                message: `Very low word count (${wordCount} words)`,
                description: 'Pages with extremely thin content may be considered low quality',
                recommendation: 'Add more comprehensive content with at least 300 words'
            });
        } else if (wordCount < 300) {
            addIssue('warnings', {
                category: 'Content',
                message: `Low word count (${wordCount} words)`,
                description: 'Pages with thin content may not rank well',
                recommendation: 'Add more comprehensive content with at least 300 words'
            });
        }
    }

    // Add issues from links
    if (data.links) {
        // Check for excessive external links
        let externalLinks = 0;
        let internalLinks = 0;
        let nofollowLinks = 0;
        let totalLinks = 0;
        let brokenLinks = [];
        let redirectLinks = [];
        let emptyAnchors = [];
        let externalWithoutNoopener = [];

        // Handle different data structures
        if (typeof data.links.external === 'number') {
            externalLinks = data.links.external;
            internalLinks = data.links.internal || 0;
            nofollowLinks = data.links.nofollow || 0;
            totalLinks = externalLinks + internalLinks;
        } else if (data.links.external?.count) {
            externalLinks = data.links.external.count;
            internalLinks = data.links.internal?.count || 0;
            nofollowLinks = data.links.nofollow?.count || 0;
            totalLinks = externalLinks + internalLinks;
        }

        // Process link items if available
        if (data.links.items && Array.isArray(data.links.items)) {
            const items = data.links.items;

            // Find broken links (4xx, 5xx)
            brokenLinks = items.filter(link => {
                if (link.status && (link.status.startsWith('4') || link.status.startsWith('5'))) {
                    return true;
                }
                if (link.statusCode && link.statusCode >= 400) {
                    return true;
                }
                return false;
            });

            // Find redirecting links (3xx)
            redirectLinks = items.filter(link => {
                if (link.status && link.status.startsWith('3')) {
                    return true;
                }
                if (link.statusCode && link.statusCode >= 300 && link.statusCode < 400) {
                    return true;
                }
                return false;
            });

            // Find empty anchor text
            emptyAnchors = items.filter(link => !link.text || link.text.trim() === '');

            // Find external links without noopener
            externalWithoutNoopener = items.filter(link =>
                link.type === 'external' &&
                link.target === '_blank' &&
                (!link.rel || !link.rel.includes('noopener'))
            );
        }

        // Add issues based on findings
        if (externalLinks > internalLinks && internalLinks > 0 && totalLinks > 5) {
            addIssue('warnings', {
                category: 'Links',
                message: 'More external links than internal links',
                description: 'Having more external links than internal links may reduce SEO value',
                recommendation: 'Add more internal links to improve site structure'
            });
        }

        // Check for nofollow links
        if (nofollowLinks > 0) {
            addIssue('suggestions', {
                category: 'Links',
                message: `${nofollowLinks} nofollow links detected`,
                description: 'Nofollow links do not pass link equity',
                recommendation: 'Review nofollow links to ensure they are used appropriately'
            });
        }

        // Check for broken links
        if (brokenLinks.length > 0) {
            addIssue('critical', {
                category: 'Links',
                message: `${brokenLinks.length} broken links detected`,
                description: 'Broken links create poor user experience and can harm SEO',
                recommendation: 'Fix or remove broken links'
            });
        }

        // Check for redirect chains
        if (redirectLinks.length > 0) {
            addIssue('warnings', {
                category: 'Links',
                message: `${redirectLinks.length} redirecting links detected`,
                description: 'Redirects slow down page load and waste crawl budget',
                recommendation: 'Update links to point directly to final URLs'
            });
        }

        // Check for empty anchor text
        if (emptyAnchors.length > 0) {
            addIssue('warnings', {
                category: 'Links',
                message: `${emptyAnchors.length} links with empty anchor text`,
                description: 'Links without descriptive text provide poor user experience and SEO value',
                recommendation: 'Add descriptive anchor text to all links'
            });
        }

        // Check for security issues with external links
        if (externalWithoutNoopener.length > 0) {
            addIssue('warnings', {
                category: 'Links',
                message: `${externalWithoutNoopener.length} external links missing rel="noopener"`,
                description: 'External links with target="_blank" but without rel="noopener" can be a security risk',
                recommendation: 'Add rel="noopener" to all external links that open in new tabs'
            });
        }
    }

    // Add issues from performance data
    if (data.metrics) {
        const metrics = data.metrics;

        // Check LCP (Largest Contentful Paint)
        if (metrics.lcp && metrics.lcp > 2.5) {
            const severity = metrics.lcp > 4.0 ? 'critical' : 'warnings';
            addIssue(severity, {
                category: 'Performance',
                message: `Slow Largest Contentful Paint (${metrics.lcp.toFixed(2)}s)`,
                description: 'Poor user experience and lower search rankings',
                recommendation: 'Optimize images, reduce server response time, and minimize render-blocking resources'
            });
        }

        // Check CLS (Cumulative Layout Shift)
        if (metrics.cls && metrics.cls > 0.1) {
            const severity = metrics.cls > 0.25 ? 'critical' : 'warnings';
            addIssue(severity, {
                category: 'Performance',
                message: `High Cumulative Layout Shift (${metrics.cls.toFixed(3)})`,
                description: 'Poor user experience and lower search rankings',
                recommendation: 'Set dimensions for images and embeds, avoid inserting content above existing content'
            });
        }

        // Check TTFB (Time to First Byte)
        if (metrics.ttfb && metrics.ttfb > 0.8) {
            const severity = metrics.ttfb > 1.8 ? 'critical' : 'warnings';
            addIssue(severity, {
                category: 'Performance',
                message: `Slow Time to First Byte (${metrics.ttfb.toFixed(2)}s)`,
                description: 'Delays entire page rendering process',
                recommendation: 'Optimize server response time, use CDN, implement caching'
            });
        }

        // Check FID (First Input Delay)
        if (metrics.fid && metrics.fid > 100) {
            const severity = metrics.fid > 300 ? 'critical' : 'warnings';
            addIssue(severity, {
                category: 'Performance',
                message: `High First Input Delay (${metrics.fid.toFixed(0)}ms)`,
                description: 'Poor interactivity and user experience',
                recommendation: 'Optimize JavaScript execution and reduce main thread blocking'
            });
        }

        // Check INP (Interaction to Next Paint) - newer metric
        if (metrics.inp && metrics.inp > 200) {
            const severity = metrics.inp > 500 ? 'critical' : 'warnings';
            addIssue(severity, {
                category: 'Performance',
                message: `High Interaction to Next Paint (${metrics.inp.toFixed(0)}ms)`,
                description: 'Poor responsiveness to user interactions',
                recommendation: 'Optimize event handlers and reduce JavaScript execution time'
            });
        }
    }

    // Add issues from Web Vitals if available separately
    if (data.webVitals) {
        const webVitals = data.webVitals;

        // Only add if not already added from metrics
        if (!data.metrics?.lcp && webVitals.LCP) {
            const lcpValue = parseFloat(webVitals.LCP);
            if (lcpValue > 2.5) {
                const severity = lcpValue > 4.0 ? 'critical' : 'warnings';
                addIssue(severity, {
                    category: 'Performance',
                    message: `Slow Largest Contentful Paint (${lcpValue.toFixed(2)}s)`,
                    description: 'Poor user experience and lower search rankings',
                    recommendation: 'Optimize images, reduce server response time, and minimize render-blocking resources'
                });
            }
        }

        if (!data.metrics?.cls && webVitals.CLS) {
            const clsValue = parseFloat(webVitals.CLS);
            if (clsValue > 0.1) {
                const severity = clsValue > 0.25 ? 'critical' : 'warnings';
                addIssue(severity, {
                    category: 'Performance',
                    message: `High Cumulative Layout Shift (${clsValue.toFixed(3)})`,
                    description: 'Poor user experience and lower search rankings',
                    recommendation: 'Set dimensions for images and embeds, avoid inserting content above existing content'
                });
            }
        }
    }

    // Add issues from structured data
    if (data.structured) {
        const structured = data.structured;
        const hasStructuredData = (structured.jsonLd && structured.jsonLd.length > 0) ||
                                 (structured.microdata && structured.microdata.length > 0) ||
                                 (structured.rdfa && structured.rdfa.length > 0);

        if (!hasStructuredData) {
            addIssue('warnings', {
                category: 'Structured Data',
                message: 'No structured data detected',
                description: 'Missing opportunity for rich results in search',
                recommendation: 'Implement relevant schema markup using JSON-LD'
            });
        } else {
            // Check for incomplete structured data
            let hasArticle = false;
            let hasOrganization = false;
            let hasBreadcrumb = false;

            // Check JSON-LD
            if (structured.jsonLd && structured.jsonLd.length > 0) {
                for (const item of structured.jsonLd) {
                    if (item.type === 'Article' || item.type === 'BlogPosting' || item.type === 'NewsArticle') {
                        hasArticle = true;
                    } else if (item.type === 'Organization') {
                        hasOrganization = true;
                    } else if (item.type === 'BreadcrumbList') {
                        hasBreadcrumb = true;
                    }
                }
            }

            // Check for missing important schema types
            if (!hasArticle && data.content) {
                addIssue('suggestions', {
                    category: 'Structured Data',
                    message: 'Missing Article schema',
                    description: 'Article schema helps search engines understand your content',
                    recommendation: 'Add Article, BlogPosting, or NewsArticle schema to your page'
                });
            }

            if (!hasOrganization) {
                addIssue('suggestions', {
                    category: 'Structured Data',
                    message: 'Missing Organization schema',
                    description: 'Organization schema helps establish entity identity',
                    recommendation: 'Add Organization schema with logo and contact information'
                });
            }

            if (!hasBreadcrumb) {
                addIssue('suggestions', {
                    category: 'Structured Data',
                    message: 'Missing BreadcrumbList schema',
                    description: 'Breadcrumb schema improves navigation and search appearance',
                    recommendation: 'Add BreadcrumbList schema to show site hierarchy'
                });
            }
        }
    }

    // Add issues from canonical URL
    if (data.canonical) {
        if (!data.canonical.valid) {
            addIssue('warnings', {
                category: 'Technical SEO',
                message: 'Invalid canonical URL',
                description: 'Incorrect canonical URL can cause indexing issues',
                recommendation: 'Fix the canonical URL to point to the correct page'
            });
        } else if (!data.canonical.url) {
            addIssue('warnings', {
                category: 'Technical SEO',
                message: 'Missing canonical URL',
                description: 'Canonical URLs help prevent duplicate content issues',
                recommendation: 'Add a canonical URL tag to your page'
            });
        }
    }

    // Add issues from robots directives
    if (data.robots) {
        if (!data.robots.allowed) {
            addIssue('critical', {
                category: 'Technical SEO',
                message: 'Page is not allowed to be indexed',
                description: 'Robots directives are preventing this page from being indexed',
                recommendation: 'Remove noindex directive if you want this page to appear in search results'
            });
        }

        // Check for missing robots.txt
        if (data.robots.missing) {
            addIssue('warnings', {
                category: 'Technical SEO',
                message: 'Missing robots.txt file',
                description: 'robots.txt helps control search engine crawling',
                recommendation: 'Create a robots.txt file at the root of your domain'
            });
        }
    }

    // Add issues from hreflang
    if (data.hreflang && Array.isArray(data.hreflang)) {
        const invalidHreflang = data.hreflang.filter(item => !item.valid);
        if (invalidHreflang.length > 0) {
            addIssue('warnings', {
                category: 'Technical SEO',
                message: `${invalidHreflang.length} invalid hreflang tags`,
                description: 'Invalid hreflang tags can cause international targeting issues',
                recommendation: 'Fix invalid hreflang tags with correct language and region codes'
            });
        }
    }

    // Check for sitemap
    if (data.sitemap === false || (data.technical && data.technical.sitemap === false)) {
        addIssue('warnings', {
            category: 'Technical SEO',
            message: 'Missing XML sitemap',
            description: 'XML sitemaps help search engines discover and index your content',
            recommendation: 'Create and submit an XML sitemap to search engines'
        });
    }

    // Check for HTTPS
    if (data.url && !data.url.startsWith('https://')) {
        addIssue('critical', {
            category: 'Security',
            message: 'Site not using HTTPS',
            description: 'HTTPS is essential for security and is a ranking factor',
            recommendation: 'Implement HTTPS across your entire website'
        });
    }

    return issues;
};

// Main Component
export const IssuesTab = ({ pageData }) => {
    const data = pageData || dataService.mockData;

    // Consolidate issues from all tabs using the issue service
    const consolidatedIssues = issueService.consolidateIssues(data);

    const criticalIssues = consolidatedIssues.critical || [];
    const warningIssues = consolidatedIssues.warnings || [];
    const suggestionIssues = consolidatedIssues.suggestions || [];
    const totalIssues = criticalIssues.length + warningIssues.length + suggestionIssues.length;

    // Export function for consolidated issues
    const handleExportIssues = () => {
        // Create data to export
        const exportData = {
            url: data.url,
            timestamp: new Date().toISOString(),
            summary: {
                total: totalIssues,
                critical: criticalIssues.length,
                warnings: warningIssues.length,
                suggestions: suggestionIssues.length
            },
            issues: consolidatedIssues
        };

        // Use issue service to export data
        issueService.exportIssuesData(exportData, 'json');

        // Show notification
        alert('Issues exported successfully!');
    };

    let statusIconChar = '✅';
    let statusBgColor = '#dcfce7';
    let statusIconBgColor = '#a7f3d0';
    let statusTitleColor = '#047857';
    let statusDescription = 'Your page looks great! No issues detected.';

    if (criticalIssues.length > 0) {
        statusIconChar = '❌'; statusBgColor = '#fee2e2'; statusIconBgColor = '#fecaca'; statusTitleColor = '#b91c1c';
        statusDescription = `${criticalIssues.length} critical issue(s) need attention`;
        if (warningIssues.length > 0 || suggestionIssues.length > 0) statusDescription += ` plus ${warningIssues.length + suggestionIssues.length} other issue(s)`;
    } else if (warningIssues.length > 0) {
        statusIconChar = '⚠️'; statusBgColor = '#fff7ed'; statusIconBgColor = '#fed7aa'; statusTitleColor = '#c2410c';
        statusDescription = `${warningIssues.length} warning(s)`;
        if (suggestionIssues.length > 0) statusDescription += ` and ${suggestionIssues.length} suggestion(s)`;
    } else if (suggestionIssues.length > 0) {
        statusIconChar = 'ℹ️'; statusBgColor = '#dbeafe'; statusIconBgColor = '#bfdbfe'; statusTitleColor = '#1e40af';
        statusDescription = `${suggestionIssues.length} suggestion(s) for improvement`;
    }

    // Use React.createElement
    return React.createElement('div', { style: styles.spaceY3 },
        // Issues Summary Section
        React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement('div', { style: styles.cardTitle }, 'Issues Summary'),
                // Add export button if there are issues
                totalIssues > 0 && React.createElement('button', {
                    onClick: handleExportIssues,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                    }
                }, [
                    React.createElement('span', {
                        style: {
                            fontSize: '0.875rem',
                            color: '#60a5fa'
                        }
                    }, '📊'),
                    React.createElement('span', null, 'Export Issues')
                ])
            ),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
                // Overall Status
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: statusBgColor, borderRadius: '6px', borderLeft: `3px solid ${statusTitleColor}` } },
                    React.createElement('div', { style: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: statusIconBgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' } }, statusIconChar),
                    React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
                        React.createElement('div', { style: { fontSize: '0.95rem', fontWeight: '600', color: statusTitleColor } }, totalIssues === 0 ? 'No issues found!' : `Found ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}`),
                        React.createElement('div', { style: { fontSize: '0.85rem', color: '#4b5563' } }, statusDescription)
                    )
                ),
                // Summary Chart (if issues exist)
                totalIssues > 0 && React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' } },
                    React.createElement('div', { style: { flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' } },
                        criticalIssues.length > 0 && React.createElement(IssueBar, { label: 'Critical', count: criticalIssues.length, total: totalIssues, color: '#ef4444' }),
                        warningIssues.length > 0 && React.createElement(IssueBar, { label: 'Warnings', count: warningIssues.length, total: totalIssues, color: '#f59e0b' }),
                        suggestionIssues.length > 0 && React.createElement(IssueBar, { label: 'Suggestions', count: suggestionIssues.length, total: totalIssues, color: '#3b82f6' })
                    )
                )
            )
        ),
        // Critical Issues Section
        criticalIssues.length > 0 && React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: { ...styles.cardTitle, color: '#ef4444' } }, 'Critical Issues'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' } },
                criticalIssues.map((issue, index) => React.createElement(IssueItem, { key: `crit-${index}`, issue: issue, index: index, color: '#ef4444' }))
            )
        ),
        // Warnings Section
        warningIssues.length > 0 && React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: { ...styles.cardTitle, color: '#f59e0b' } }, 'Warnings'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' } },
                warningIssues.map((issue, index) => React.createElement(IssueItem, { key: `warn-${index}`, issue: issue, index: index, color: '#f59e0b' }))
            )
        ),
        // Suggestions Section
        suggestionIssues.length > 0 && React.createElement('div', { style: styles.cardSection },
            React.createElement('div', { style: { ...styles.cardTitle, color: '#3b82f6' } }, 'Suggestions'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' } },
                suggestionIssues.map((issue, index) => React.createElement(IssueItem, { key: `sugg-${index}`, issue: issue, index: index, color: '#3b82f6' }))
            )
        )
    );
};

// No IIFE needed
