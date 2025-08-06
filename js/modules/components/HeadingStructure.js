'use strict';

import { ToggleSwitch } from './common/ToggleSwitch.js'; // Import ToggleSwitch

/**
 * HeadingStructure Component - Displays a website's heading structure with filtering options
 * @param {Object} props - Component props
 * @param {Object} props.pageData - The page data containing heading information
 * @param {boolean} props.includeHeaderFooter - Whether to include header/footer headings
 * @param {Function} props.toggleHeaderFooter - Function to toggle header/footer heading inclusion
 * @returns {React.Element} Rendered component
 */
export const HeadingStructure = ({ pageData, includeHeaderFooter, toggleHeaderFooter }) => {
    // State for heading level filters
    const [activeLevelFilters, setActiveLevelFilters] = React.useState({
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        h5: true,
        h6: true // Include H6 filter state
    });

    // Process headings to have a consistent structure and preserve document order
    const processHeadings = () => {
        let headingsArray = [];
        
        if (pageData.content?.headings) {
            // If we already have an array of objects with level and text
            headingsArray = [...pageData.content.headings];
        } else if (pageData.headings) {
            // Old format with headings categorized by level
            // Create position index to track original position in document
            let position = 0;
            
            // Process each heading type in order h1-h6
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(level => {
                if (pageData.headings[level] && Array.isArray(pageData.headings[level])) {
                    // For each heading text of this level, create a heading object
                    pageData.headings[level].forEach(text => {
                        headingsArray.push({
                            level: parseInt(level.substring(1)),
                            text,
                            position: position++
                        });
                    });
                }
            });

            // This is a best effort to reconstruct document order
            // If the headings were already collected in document order,
            // we use the position property to sort them
            if (headingsArray.some(h => h.position !== undefined)) {
                headingsArray.sort((a, b) => a.position - b.position);
            }
        }
        
        // Ensure context property exists, default to 'content' if missing
        headingsArray.forEach(h => {
            if (!h.context) {
                h.context = 'content'; 
            }
        });

        return headingsArray;
    };

    // Get all headings in document order
    const allHeadings = processHeadings();

    // Toggle a heading level filter
    const toggleLevelFilter = (level) => {
        setActiveLevelFilters(prev => ({
            ...prev,
            [level]: !prev[level]
        }));
    };

    // Filter headings based on level filters AND context filter (includeHeaderFooter)
    const filteredHeadings = React.useMemo(() => {
        return allHeadings.filter(heading => {
            // Check level filter
            const levelMatch = activeLevelFilters[`h${heading.level}`];
            // Check context filter
            const contextMatch = includeHeaderFooter || heading.context === 'content';
            return levelMatch && contextMatch;
        });
    }, [allHeadings, activeLevelFilters, includeHeaderFooter]);


    // Check for heading structure issues (using all headings before context filtering)
    const h1Count = allHeadings.filter(h => h.level === 1).length;
    // Removed duplicate: const h1Count = headingsInDocumentOrder.filter(h => h.level === 1).length;
    
    // Detect if there are any LOWER LEVEL headings before the first H1 (using all headings)
    const hasLowerHeadingsBeforeH1 = (() => {
        if (allHeadings.length === 0) return false;
        
        // Find the index of the first H1
        const firstH1Index = allHeadings.findIndex(h => h.level === 1);
        
        // If there's no H1, then we can't have lower headings before H1
        if (firstH1Index === -1) return false;
        
        // Check if there are any lower level headings (level > 1) before the first H1
        for (let i = 0; i < firstH1Index; i++) {
            // If we find any heading with level > 1 before the first H1, that's an issue
            if (allHeadings[i].level > 1) {
                return true;
            }
        }
        
        // No lower level headings found before the first H1
        return false;
    })();
    
    // Helper to check if heading levels are skipped (using all headings)
    const checkForSkippedHeadingLevels = (headings) => {
        let skippedInfo = { skipped: false, details: [] };
        let currentLevel = 0; // Start at 0 to check if first heading is > H1
        
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            
            // Check if the first heading is not H1 (or if H1 is missing)
            if (i === 0 && heading.level > 1 && h1Count === 0) {
                 skippedInfo.skipped = true;
                 skippedInfo.details.push({
                     from: 0, // Indicate skipping from document start
                     to: heading.level,
                     text: heading.text,
                     position: i
                 });
                 currentLevel = heading.level; // Set current level for next checks
                 continue; // Move to next heading
            } else if (i === 0) {
                 currentLevel = heading.level; // Set initial level if it's H1 or H1 exists later
                 continue;
            }

            // Check for skips between subsequent headings
            if (heading.level > currentLevel) {
                if (heading.level > currentLevel + 1) {
                    // Found a skip - e.g., from H2 to H4 (skipping H3)
                    skippedInfo.skipped = true;
                    skippedInfo.details.push({
                        from: currentLevel,
                        to: heading.level,
                        text: heading.text,
                        position: i
                    });
                }
            } 
            // Update currentLevel regardless of whether it increased or decreased
            currentLevel = heading.level; 
        }
        
        return skippedInfo;
    };
    
    const skippedLevelsInfo = checkForSkippedHeadingLevels(allHeadings); // Check on all headings
    const hasSkippedLevels = skippedLevelsInfo.skipped;
    // Show issues based on analysis of all headings
    const showHeadingIssues = h1Count !== 1 || hasLowerHeadingsBeforeH1 || hasSkippedLevels; 

    // Render the level filter controls
    const renderFilterControls = () => {
        return React.createElement('div', { 
            style: { 
                display: 'flex', 
                gap: '8px',
                marginBottom: '12px',
                flexWrap: 'wrap'
            } 
        },
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(level => // Include H6 button
                React.createElement('button', {
                    key: level,
                    onClick: () => toggleLevelFilter(level), // Use updated handler
                    style: {
                        backgroundColor: activeLevelFilters[level] ? '#3b82f6' : '#475569', // Use updated state
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s'
                    }
                },
                    // Checkbox icon
                    React.createElement('span', {
                        style: {
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            border: '1px solid white',
                            backgroundColor: activeLevelFilters[level] ? 'white' : 'transparent', // Use updated state
                            position: 'relative'
                        }
                    },
                        activeLevelFilters[level] && React.createElement('span', { // Use updated state
                            style: {
                                position: 'absolute',
                                top: '1px',
                                left: '3px',
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#3b82f6'
                            }
                        })
                    ),
                    level.toUpperCase()
                )
            )
        );
    };

    // Render content with headings
    return React.createElement('div', null, 
        // Container for Title, Level Filters, and Context Toggle
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'} }, 
             React.createElement('div', null, // Left side: Title and Level Filters
                React.createElement('div', { style: { fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' } }, 'Heading Structure'), // Lighter title color for dark mode
                renderFilterControls() 
             ),
             // Right side: Context Toggle Switch
             React.createElement('div', { style: { paddingTop: '4px' } }, 
                React.createElement(ToggleSwitch, {
                    isOn: includeHeaderFooter,
                    handleToggle: toggleHeaderFooter,
                    labelOn: 'All headings', 
                    labelOff: 'Content only', 
                    id: 'heading-location-toggle',
                    labelStyle: { color: '#FFFFFF' } // Apply white color explicitly
                })
             )
        ),
        
        // Heading list
        filteredHeadings.length === 0
            ? React.createElement('div', { 
                style: { 
                    padding: '16px', 
                    textAlign: 'center', 
                    color: '#94a3b8', // Lighter text for empty state on dark bg
                    fontSize: '0.8rem', 
                    backgroundColor: '#1e293b', // Darker background for empty state
                    borderRadius: '4px',
                    marginTop: '8px'
                } 
            }, 'No headings match the current filters.')
            // Keep dark background for the list, adjust text colors
            : React.createElement('div', { style: { maxHeight: '600px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '4px', padding: '12px', backgroundColor: '#1e293b' } }, 
                filteredHeadings.map((heading, index) =>
                    React.createElement('div', { 
                        key: `${heading.position}-${index}`, 
                        style: { 
                            marginBottom: '8px', 
                            paddingLeft: `${(heading.level - 1) * 16}px`, 
                            borderLeft: heading.level === 1 ? '3px solid #60a5fa' : 'none', // Brighter blue for H1 border
                            paddingTop: '3px', 
                            paddingBottom: '3px' 
                        } 
                    },
                        React.createElement('span', { 
                            style: { 
                                fontWeight: '600', 
                                color: '#94a3b8', // Lighter gray for level tag
                                marginRight: '8px', 
                                fontSize: '0.75rem',
                                display: 'inline-block', 
                                minWidth: '25px' 
                            } 
                        }, `H${heading.level}`),
                        React.createElement('span', { 
                            style: { 
                                fontSize: '0.85rem', 
                                fontWeight: heading.level <= 2 ? '500' : '400', 
                                color: heading.level === 1 ? '#93c5fd' : '#e2e8f0', // Brighter blue for H1, lighter gray for others
                                lineHeight: '1.4' 
                            } 
                        }, heading.text)
                    )
                )
            ),
        
        // Toggle Switch removed from here (moved to top)

        // Heading structure issues
        showHeadingIssues && React.createElement('div', { 
            style: { 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#fffbeb', // Lighter yellow background
                borderRadius: '6px', 
                borderLeft: '3px solid #f59e0b' 
            } 
        },
            React.createElement('div', { 
                style: { 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    marginBottom: '8px', 
                    color: '#facc15' // Using Tailwind yellow-400, should be visible
                } 
            }, 'Heading Structure Issues:'),
            React.createElement('ul', { 
                style: { 
                    marginLeft: '16px', 
                    marginBottom: '0', 
                    fontSize: '0.8rem', 
                    color: '#d1d5db' // Lighter gray for issues list text
                } 
            },
                h1Count === 0 && React.createElement('li', { 
                    style: { marginBottom: '4px' } 
                }, 'No H1 heading found.'),
                h1Count > 1 && React.createElement('li', { 
                    style: { marginBottom: '4px' } 
                }, `Found ${h1Count} H1 headings. Use only one.`),
                hasLowerHeadingsBeforeH1 && React.createElement('li', { 
                    style: { marginBottom: '4px' } 
                }, 'Lower-level headings (H2-H6) found before the first H1. For better SEO structure, H1 should appear before any lower level headings.'),
                hasSkippedLevels && React.createElement('li', { 
                    style: { marginBottom: '4px' } 
                }, 
                    React.createElement(React.Fragment, null,
                        'Heading levels skipped: ',
                        skippedLevelsInfo.details.length > 0 && 
                            React.createElement('ul', { style: { marginTop: '4px', marginLeft: '16px' } },
                                skippedLevelsInfo.details.slice(0, 3).map((detail, idx) => 
                                    React.createElement('li', { key: idx, style: { fontSize: '0.75rem' } },
                                        `From H${detail.from} to H${detail.to} (skipping ${Array.from({length: detail.to - detail.from - 1}, (_, i) => `H${detail.from + i + 1}`).join(', ')}) at "${detail.text.substring(0, 30)}${detail.text.length > 30 ? '...' : ''}"`
                                    )
                                ),
                                skippedLevelsInfo.details.length > 3 && 
                                    React.createElement('li', { style: { fontSize: '0.75rem' } },
                                        `...and ${skippedLevelsInfo.details.length - 3} more instances`
                                    )
                            )
                    )
                )
            )
        )
    );
};
