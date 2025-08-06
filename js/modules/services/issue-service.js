'use strict';

/**
 * Service for handling issues-related operations
 */
export const issueService = {
    /**
     * Export issues data as JSON or CSV file
     * @param {Object} data - Issues data to export
     * @param {string} format - Export format ('json' or 'csv')
     */
    exportIssuesData(data, format = 'json') {
        if (format === 'json') {
            // Create JSON string
            const jsonString = JSON.stringify(data, null, 2);

            // Create blob and download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `issues-data-${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } else if (format === 'csv') {
            // Create CSV content
            let csvContent = 'data:text/csv;charset=utf-8,';

            // Add headers
            csvContent += 'Type,Category,Description,Impact,Recommendation\n';

            // Add critical issues
            if (data.critical && data.critical.length > 0) {
                data.critical.forEach(issue => {
                    const row = [
                        'Critical',
                        issue.category || '',
                        issue.description || '',
                        issue.impact || '',
                        issue.recommendation || ''
                    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
                    csvContent += row + '\n';
                });
            }

            // Add warnings
            if (data.warnings && data.warnings.length > 0) {
                data.warnings.forEach(issue => {
                    const row = [
                        'Warning',
                        issue.category || '',
                        issue.description || '',
                        issue.impact || '',
                        issue.recommendation || ''
                    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
                    csvContent += row + '\n';
                });
            }

            // Add suggestions
            if (data.suggestions && data.suggestions.length > 0) {
                data.suggestions.forEach(issue => {
                    const row = [
                        'Suggestion',
                        issue.category || '',
                        issue.description || '',
                        issue.impact || '',
                        issue.recommendation || ''
                    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
                    csvContent += row + '\n';
                });
            }

            // Create blob and download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `issues-data-${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
        } else {
            console.error(`Unsupported export format: ${format}`);
        }
    },

    /**
     * Consolidate issues from different tabs/sources
     * @param {Object} pageData - The complete page data object
     * @returns {Object} Consolidated issues object
     */
    consolidateIssues(pageData) {
        if (!pageData) return { critical: [], warnings: [], suggestions: [] };

        // Start with the main issues
        const issues = {
            critical: [...(pageData.issues?.critical || [])],
            warnings: [...(pageData.issues?.warnings || [])],
            suggestions: [...(pageData.issues?.suggestions || [])]
        };

        // Helper function to avoid duplicate issues
        const addIssue = (category, issue) => {
            // Check if a similar issue already exists
            const existingIssue = issues[category].find(i =>
                (i.message === issue.message || i.description === issue.description) &&
                i.category === issue.category
            );

            if (!existingIssue) {
                // Ensure the issue has a message property if it only has description
                if (!issue.message && issue.description) {
                    issue.message = issue.description;
                }
                issues[category].push(issue);
            }
        };

        // Add issues from content tab (images)
        if (pageData.images && Array.isArray(pageData.images)) {
            // Check for missing alt text
            const missingAltImages = pageData.images.filter(img => !img.alt || img.alt.trim() === '');
            if (missingAltImages.length > 0) {
                addIssue('warnings', {
                    category: 'Images',
                    message: `${missingAltImages.length} images missing alt text`,
                    description: 'Images without alt text reduce accessibility and SEO potential',
                    recommendation: 'Add descriptive alt text to all images'
                });
            }

            // Check for images without dimensions
            const imagesWithoutDimensions = pageData.images.filter(img => !img.width || !img.height);
            if (imagesWithoutDimensions.length > 0) {
                addIssue('warnings', {
                    category: 'Images',
                    message: `${imagesWithoutDimensions.length} images missing width/height attributes`,
                    description: 'Images without dimensions can cause layout shifts during page load',
                    recommendation: 'Add width and height attributes to all images'
                });
            }
        }

        // Also check content.images if available
        if (pageData.content && pageData.content.images) {
            const images = Array.isArray(pageData.content.images) ? pageData.content.images : [];

            // Check for missing alt text
            const missingAltImages = images.filter(img => !img.alt || img.alt.trim() === '');
            if (missingAltImages.length > 0) {
                addIssue('warnings', {
                    category: 'Images',
                    message: `${missingAltImages.length} images missing alt text`,
                    description: 'Images without alt text reduce accessibility and SEO potential',
                    recommendation: 'Add descriptive alt text to all images'
                });
            }

            // Check for non-optimized filenames
            const nonOptimizedImages = images.filter(img => img.hasNonOptimizedFilename);
            if (nonOptimizedImages.length > 0) {
                addIssue('suggestions', {
                    category: 'Images',
                    message: `${nonOptimizedImages.length} images have non-optimized filenames`,
                    description: 'Non-descriptive filenames miss SEO opportunities',
                    recommendation: 'Use descriptive, keyword-rich filenames for images'
                });
            }
        }

        // Add issues from content tab (text content)
        if (pageData.title || pageData.description || pageData.content) {
            // Check title length
            const titleLength = pageData.title?.length || 0;
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
            const descLength = pageData.description?.length || 0;
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

            if (pageData.content?.headings) {
                h1Count = pageData.content.headings.filter(h => h.level === 1).length;
                h2Count = pageData.content.headings.filter(h => h.level === 2).length;
            } else if (pageData.headings) {
                h1Count = pageData.headings.h1?.length || 0;
                h2Count = pageData.headings.h2?.length || 0;
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
            const wordCount = pageData.content?.wordCount || pageData.wordCount || 0;
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
        if (pageData.links) {
            // Get all links and statuses
            let allLinks = [];
            let linkStatuses = {};
            let linkIssues = null;

            // Handle different data structures
            if (Array.isArray(pageData.links)) {
                // Links is an array of link objects
                allLinks = pageData.links;
            } else if (pageData.links.items && Array.isArray(pageData.links.items)) {
                // Links has an items array
                allLinks = pageData.links.items;
            } else {
                // Try to extract links from internal/external/nofollow properties
                const internal = pageData.links.internal?.items || [];
                const external = pageData.links.external?.items || [];
                const nofollow = pageData.links.nofollow?.items || [];

                // Combine all links, avoiding duplicates
                const linkMap = new Map();
                [...internal, ...external, ...nofollow].forEach(link => {
                    if (link && link.href) {
                        linkMap.set(link.href, link);
                    }
                });

                allLinks = Array.from(linkMap.values());
            }

            // Get link statuses if available
            if (pageData.linkStatuses) {
                linkStatuses = pageData.linkStatuses;
            } else if (pageData.links.statuses) {
                linkStatuses = pageData.links.statuses;
            }

            // Get link issues if available
            if (pageData.links.issues) {
                linkIssues = pageData.links.issues;
            }

            // If we have pre-analyzed issues from the links tab, use those
            if (linkIssues) {
                // Security issues
                if (linkIssues.security && linkIssues.security.items) {
                    for (const issue of linkIssues.security.items) {
                        if (issue.text.includes('noopener') && issue.count > 0) {
                            addIssue('warnings', {
                                category: 'Security',
                                message: `${issue.count} external links missing rel="noopener"`,
                                description: 'External links with target="_blank" but without rel="noopener" can be a security risk',
                                recommendation: 'Add rel="noopener" to all external links that open in new tabs'
                            });
                        }
                    }
                }

                // SEO issues
                if (linkIssues.seo && linkIssues.seo.items) {
                    for (const issue of linkIssues.seo.items) {
                        if (issue.text.includes('Internal links with nofollow') && issue.count > 0) {
                            addIssue('warnings', {
                                category: 'Links',
                                message: `${issue.count} internal links with nofollow attribute`,
                                description: 'Internal links with nofollow don\'t pass link equity within your site',
                                recommendation: 'Remove nofollow from internal links unless specifically needed'
                            });
                        } else if (issue.text.includes('External links without nofollow') && issue.count > 0) {
                            addIssue('suggestions', {
                                category: 'Links',
                                message: `${issue.count} external links without nofollow attribute`,
                                description: 'External links without nofollow may leak link equity',
                                recommendation: 'Consider adding nofollow to external links that don\'t need to pass link equity'
                            });
                        }
                    }
                }

                // Structure issues
                if (linkIssues.structure && linkIssues.structure.items) {
                    for (const issue of linkIssues.structure.items) {
                        if (issue.text.includes('empty anchor text') && issue.count > 0) {
                            addIssue('warnings', {
                                category: 'Links',
                                message: `${issue.count} links with empty anchor text`,
                                description: 'Links without descriptive text provide poor user experience and SEO value',
                                recommendation: 'Add descriptive anchor text to all links'
                            });
                        } else if (issue.text.includes('Deep internal links') && issue.count > 0) {
                            addIssue('suggestions', {
                                category: 'Links',
                                message: `${issue.count} deep internal links (>3 levels)`,
                                description: 'Deep links may be harder for users and search engines to find',
                                recommendation: 'Consider flattening your site structure for important pages'
                            });
                        }
                    }
                }

                // Status issues
                if (linkIssues.status && linkIssues.status.items) {
                    for (const issue of linkIssues.status.items) {
                        if (issue.text.includes('Broken links') && issue.count > 0) {
                            addIssue('critical', {
                                category: 'Links',
                                message: `${issue.count} broken links detected`,
                                description: 'Broken links create poor user experience and can harm SEO',
                                recommendation: 'Fix or remove broken links'
                            });
                        } else if (issue.text.includes('redirects') && issue.count > 0) {
                            addIssue('warnings', {
                                category: 'Links',
                                message: `${issue.count} redirecting links detected`,
                                description: 'Redirects slow down page load and waste crawl budget',
                                recommendation: 'Update links to point directly to final URLs'
                            });
                        }
                    }
                }
            } else {
                // Fallback to analyzing links directly if pre-analyzed issues aren't available

                // Find broken links (4xx, 5xx)
                const brokenLinks = allLinks.filter(link => {
                    const status = linkStatuses[link.href];
                    return status && (
                        (status.statusCode && status.statusCode >= 400) ||
                        (status.status && (status.status.startsWith('4') || status.status.startsWith('5')))
                    );
                });

                if (brokenLinks.length > 0) {
                    addIssue('critical', {
                        category: 'Links',
                        message: `${brokenLinks.length} broken links detected`,
                        description: 'Broken links create poor user experience and can harm SEO',
                        recommendation: 'Fix or remove broken links'
                    });
                }

                // Find redirects (3xx)
                const redirectLinks = allLinks.filter(link => {
                    const status = linkStatuses[link.href];
                    return status && (
                        (status.statusCode && status.statusCode >= 300 && status.statusCode < 400) ||
                        (status.status && status.status.startsWith('3'))
                    );
                });

                if (redirectLinks.length > 0) {
                    addIssue('warnings', {
                        category: 'Links',
                        message: `${redirectLinks.length} redirecting links detected`,
                        description: 'Redirects slow down page load and waste crawl budget',
                        recommendation: 'Update links to point directly to final URLs'
                    });
                }

                // Find external links without noopener
                const externalWithoutNoopener = allLinks.filter(link =>
                    link.type === 'external' &&
                    link.target === '_blank' &&
                    (!link.rel || !link.rel.includes('noopener'))
                );

                if (externalWithoutNoopener.length > 0) {
                    addIssue('warnings', {
                        category: 'Security',
                        message: `${externalWithoutNoopener.length} external links missing rel="noopener"`,
                        description: 'External links with target="_blank" but without rel="noopener" can be a security risk',
                        recommendation: 'Add rel="noopener" to all external links that open in new tabs'
                    });
                }

                // Find internal links with nofollow
                const internalNofollow = allLinks.filter(link =>
                    link.type === 'internal' &&
                    link.rel &&
                    link.rel.includes('nofollow')
                );

                if (internalNofollow.length > 0) {
                    addIssue('warnings', {
                        category: 'Links',
                        message: `${internalNofollow.length} internal links with nofollow attribute`,
                        description: 'Internal links with nofollow don\'t pass link equity within your site',
                        recommendation: 'Remove nofollow from internal links unless specifically needed'
                    });
                }

                // Find external links without nofollow
                const externalDofollow = allLinks.filter(link =>
                    link.type === 'external' &&
                    (!link.rel || !link.rel.includes('nofollow'))
                );

                if (externalDofollow.length > 0) {
                    addIssue('suggestions', {
                        category: 'Links',
                        message: `${externalDofollow.length} external links without nofollow attribute`,
                        description: 'External links without nofollow may leak link equity',
                        recommendation: 'Consider adding nofollow to external links that don\'t need to pass link equity'
                    });
                }

                // Find links with empty anchor text
                const emptyAnchors = allLinks.filter(link =>
                    !link.text || link.text.trim() === '' ||
                    !link.anchorText || link.anchorText.trim() === ''
                );

                if (emptyAnchors.length > 0) {
                    addIssue('warnings', {
                        category: 'Links',
                        message: `${emptyAnchors.length} links with empty anchor text`,
                        description: 'Links without descriptive text provide poor user experience and SEO value',
                        recommendation: 'Add descriptive anchor text to all links'
                    });
                }

                // Find deep internal links
                const deepLinks = allLinks.filter(link =>
                    link.type === 'internal' &&
                    link.depth &&
                    link.depth > 3
                );

                if (deepLinks.length > 0) {
                    addIssue('suggestions', {
                        category: 'Links',
                        message: `${deepLinks.length} deep internal links (>3 levels)`,
                        description: 'Deep links may be harder for users and search engines to find',
                        recommendation: 'Consider flattening your site structure for important pages'
                    });
                }
            }
        }

        // Check for heading level skips
        if (pageData.content && pageData.content.headings) {
            const headings = pageData.content.headings;
            const headingLevels = new Set(headings.map(h => h.level));

            // Check for skipped heading levels
            let skippedLevels = false;
            let previousLevel = 0;

            for (let i = 1; i <= 6; i++) {
                if (headingLevels.has(i)) {
                    if (i > previousLevel + 1 && previousLevel > 0) {
                        skippedLevels = true;
                        break;
                    }
                    previousLevel = i;
                }
            }

            if (skippedLevels) {
                addIssue('warnings', {
                    category: 'Content',
                    message: 'Heading levels skipped',
                    description: 'Skipping heading levels (e.g., from H1 to H3) can confuse users and assistive technologies',
                    recommendation: 'Use heading levels in sequential order without skipping levels'
                });
            }
        }

        // Add issues from performance data
        if (pageData.metrics) {
            const metrics = pageData.metrics;

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
        }

        // Add issues from structured data
        if (pageData.structured) {
            const structured = pageData.structured;
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
            }
        }

        // Add issues from robots directives
        if (pageData.robots) {
            if (!pageData.robots.allowed) {
                addIssue('critical', {
                    category: 'Technical SEO',
                    message: 'Page is not allowed to be indexed',
                    description: 'Robots directives are preventing this page from being indexed',
                    recommendation: 'Remove noindex directive if you want this page to appear in search results'
                });
            }
        }

        // Check for HTTPS
        if (pageData.url && !pageData.url.startsWith('https://')) {
            addIssue('critical', {
                category: 'Security',
                message: 'Site not using HTTPS',
                description: 'HTTPS is essential for security and is a ranking factor',
                recommendation: 'Implement HTTPS across your entire website'
            });
        }

        return issues;
    }
};
