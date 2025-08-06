'use strict';

import { ImageStatusFilter } from './ImageStatusFilter.js'; 
import { ToggleSwitch } from '../common/ToggleSwitch.js'; // Import ToggleSwitch

/**
 * ImageTable - Displays a table of images with details, including filtering and context toggle
 * 
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of ALL image objects (unfiltered) with context
 * @param {boolean} props.includeHeaderFooter - State for context toggle
 * @param {Function} props.toggleHeaderFooter - Handler for context toggle
 * @param {Function} props.onCheckSizes - Handler for the check sizes button
 * @param {boolean} props.isCheckingSizes - State indicating if checking is in progress
 * @param {boolean} props.hasUncheckedImages - Flag indicating if there are images to check
 * @returns {React.Element} Rendered component
 */
export const ImageTable = React.memo(({ 
    images, 
    includeHeaderFooter, 
    toggleHeaderFooter,
    onCheckSizes,
    isCheckingSizes,
    hasUncheckedImages 
}) => {
    // State for the active image issue filter
    const [activeIssueFilter, setActiveIssueFilter] = React.useState('all');

    // Filter images by context first
    const contextFilteredImages = React.useMemo(() => {
        return includeHeaderFooter 
            ? images 
            : images.filter(img => img.context === 'content');
    }, [images, includeHeaderFooter]);

    // Filter images further based on the active issue filter
    const filteredImages = React.useMemo(() => {
        // Start with context-filtered images
        const baseImages = contextFilteredImages; 

        // Apply issue filter
        if (activeIssueFilter === 'all') {
            return baseImages;
        }
        if (activeIssueFilter === 'missingAlt') {
            return baseImages.filter(img => !img.alt && !img.hasAlt);
        }
        if (activeIssueFilter === 'nonOptimizedFilename') {
            return baseImages.filter(img => img.hasNonOptimizedFilename);
        }
        return baseImages; // Default fallback
    }, [contextFilteredImages, activeIssueFilter]); // Depend on context-filtered images

    // Handler for issue filter change
    const handleIssueFilterChange = React.useCallback((newFilter) => {
        setActiveIssueFilter(newFilter);
    }, []);

    // Helper function to get size text
    const getSizeText = (width, height) => {
        if (width && height) {
            return `${width}×${height}`;
        }
        return 'Unknown';
    };
    
    // Helper function to get file size text
    const getFileSizeText = (fileSize) => {
        if (fileSize === null || fileSize === undefined) return 'Unknown';
        if (fileSize < 1024) {
            return `${fileSize} KB`;
        } else {
            return `${(fileSize / 1024).toFixed(1)} MB`;
        }
    };
    
    // Create a thumbnail style for image previews
    const thumbnailStyle = {
        maxWidth: '50px',
        maxHeight: '50px',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        objectFit: 'contain',
        backgroundColor: '#f8fafc'
    };
    
    return React.createElement('div', { 
        style: { 
            backgroundColor: '#f8fafc', 
            borderRadius: '6px', 
            padding: '12px',
            marginTop: '16px'
        } 
    },
        // Container for Title/Toggle and Filter/Button rows (No flex here)
        React.createElement('div', { 
            style: { 
                // Removed display: flex and related properties
                marginBottom: '12px' 
            } 
        },
            // Title Row
            React.createElement('div', { 
                style: { 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '8px' // Add space below title row
                } 
            },
                React.createElement('div', { 
                    style: { 
                        fontSize: '0.85rem', 
                        fontWeight: '600', 
                        color: '#64748b' 
                    } 
                }, 'All Images'),
                // Context Toggle Switch
                React.createElement(ToggleSwitch, {
                    isOn: includeHeaderFooter,
                    handleToggle: toggleHeaderFooter,
                    labelOn: 'All images', 
                    labelOff: 'Content only', 
                    id: 'image-table-location-toggle'
                })
            ),
            // Filter and Button Row (New Row)
            React.createElement('div', { 
                style: { 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '12px' // Add margin below this row
                } 
            },
                 // Image Status Filter
                 React.createElement(ImageStatusFilter, {
                    images: contextFilteredImages, 
                    activeFilter: activeIssueFilter,
                    onFilterChange: handleIssueFilterChange
                }),
                // Check Image Sizes Button
                React.createElement('button', {
                    onClick: onCheckSizes,
                    disabled: isCheckingSizes || !hasUncheckedImages, // Use passed props
                    style: {
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        backgroundColor: isCheckingSizes ? '#d1d5db' : '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isCheckingSizes ? 'not-allowed' : 'pointer',
                        // No marginLeft needed as justify-content handles spacing
                    }
                }, isCheckingSizes ? `Checking...` : 'Check Image Sizes')
            )
        ),

        // Table container
        React.createElement('div', { 
            style: { 
                maxHeight: '400px', 
                overflowY: 'auto' 
            } 
        },
            React.createElement('table', { 
                style: { 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: '0.8rem' 
                } 
            },
                React.createElement('thead', { 
                    style: { 
                        position: 'sticky', 
                        top: 0, 
                        backgroundColor: '#f8fafc',
                        zIndex: 1
                    } 
                },
                    React.createElement('tr', null,
                        React.createElement('th', { 
                            style: { 
                                textAlign: 'center', 
                                padding: '6px', 
                                borderBottom: '1px solid #cbd5e1', 
                                color: '#475569',
                                width: '60px'
                            } 
                        }, 'Preview'),
                        React.createElement('th', { 
                            style: { 
                                textAlign: 'left', 
                                padding: '6px', 
                                borderBottom: '1px solid #cbd5e1', 
                                color: '#475569',
                                width: '30%'
                            } 
                        }, 'Filename'),
                        React.createElement('th', { 
                            style: { 
                                textAlign: 'left', 
                                padding: '6px', 
                                borderBottom: '1px solid #cbd5e1', 
                                color: '#475569',
                                width: '30%'
                            } 
                        }, 'Alt Text'),
                        React.createElement('th', { 
                            style: { 
                                textAlign: 'left', 
                                padding: '6px', 
                                borderBottom: '1px solid #cbd5e1', 
                                color: '#475569',
                                width: '15%'
                            } 
                        }, 'Dimensions'),
                        React.createElement('th', { 
                            style: { 
                                textAlign: 'left', 
                                padding: '6px', 
                                borderBottom: '1px solid #cbd5e1', 
                                color: '#475569',
                                width: '15%'
                            } 
                        }, 'File Size')
                    )
                ),
                
                React.createElement('tbody', null,
                    // Use filteredImages for rendering the table rows
                    filteredImages.length > 0 
                        ? filteredImages.map((img, index) => {
                            const filename = img.filename || (img.src ? img.src.split('/').pop() : 'Unknown');
                            const altText = img.alt || 'Missing alt text';
                            const dimensions = getSizeText(img.width, img.height);
                            const fileSize = getFileSizeText(img.fileSize);
                            
                            return React.createElement('tr', { key: index },
                                // Column 1: Preview Image
                                React.createElement('td', { 
                                    style: { 
                                        padding: '6px', 
                                        borderBottom: '1px solid #e2e8f0',
                                        textAlign: 'center'
                                    } 
                                },
                                    React.createElement('img', {
                                        src: img.src,
                                        alt: 'Preview',
                                        style: thumbnailStyle,
                                        onError: (e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23CBD5E1" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                                        }
                                    })
                                ),
                                // Column 2: Filename (with truncate & tooltip)
                                React.createElement('td', { 
                                    style: { 
                                        padding: '6px', 
                                        borderBottom: '1px solid #e2e8f0', 
                                        color: img.hasNonOptimizedFilename ? '#f59e0b' : '#4b5563',
                                        maxWidth: '0', // Needed for text-overflow to work with flexbox
                                        overflow: 'hidden'
                                    },
                                    title: filename
                                },
                                    React.createElement('div', {
                                        style: {
                                            maxHeight: '3.6em', // Approx 3 lines
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical'
                                        }
                                    }, filename)
                                ),
                                // Column 3: Alt Text (with truncate & tooltip)
                                React.createElement('td', { 
                                    style: { 
                                        padding: '6px', 
                                        borderBottom: '1px solid #e2e8f0', 
                                        color: img.alt ? '#4b5563' : '#ef4444',
                                        fontStyle: img.alt ? 'normal' : 'italic',
                                        maxWidth: '0', // Needed for text-overflow to work with flexbox
                                        overflow: 'hidden'
                                    },
                                    title: altText
                                },
                                    React.createElement('div', {
                                        style: {
                                            maxHeight: '3.6em', // Approx 3 lines
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical'
                                        }
                                    }, altText)
                                ),
                                // Column 4: Dimensions
                                React.createElement('td', { 
                                    style: { 
                                        padding: '6px', 
                                        borderBottom: '1px solid #e2e8f0', 
                                        color: '#4b5563' 
                                    } 
                                }, dimensions),
                                // Column 5: File Size
                                React.createElement('td', {
                                    style: {
                                        padding: '6px',
                                        borderBottom: '1px solid #e2e8f0',
                                        color: img.fileSize === null ? '#9ca3af' : '#4b5563', // Grey out if null (fetching)
                                        fontStyle: img.fileSize === null ? 'italic' : 'normal'
                                    }
                                    // Display "Not Checked" if fileSize is null, "Error"/"Invalid"/"Missing" if API failed, otherwise format the size
                                }, img.fileSize === null ? 'Not Checked' : 
                                   (typeof img.fileSize === 'string' ? img.fileSize : getFileSizeText(img.fileSize))) 
                            );
                        })
                        // Display a message if no images match the filter
                        : React.createElement('tr', null, 
                            React.createElement('td', { 
                                colSpan: 5, 
                                style: { 
                                    textAlign: 'center', 
                                    padding: '16px', 
                                    color: '#64748b', 
                                    fontStyle: 'italic' 
                                } 
                            }, 'No images match the current filter.')
                        )
                )
            )
        )
    );
});
