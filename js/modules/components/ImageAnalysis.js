'use strict';

import React from 'react';

/**
 * ImageAnalysis Component - Displays image analysis for a webpage
 * @param {Object} props - Component props
 * @param {Object} props.pageData - The page data containing image information
 * @param {Function} props.renderStatItem - Helper function to render stat items consistently
 * @returns {React.Element} Rendered component
 */
export const ImageAnalysis = ({ pageData, renderStatItem }) => {
    // Get image data
    const images = pageData.images || [];
    const hasImages = images.length > 0;
    const missingAltTextCount = images.filter(img => !img.alt).length;
    const missingAltTextImages = images.filter(img => !img.alt);

    // Render helper for image file name
    const getImageFileName = (src) => {
        if (!src) return 'Unknown';
        const parts = src.split('/');
        return parts[parts.length - 1] || src;
    };

    return React.createElement('div', { style: { marginTop: '12px' } },
        // Image Stats
        React.createElement('div', { style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '8px',
            marginBottom: '16px'
        }},
            renderStatItem('Total Images', hasImages ? images.length.toString() : '0'),
            renderStatItem('Missing Alt Text', hasImages ? missingAltTextCount.toString() : '0', 
                missingAltTextCount > 0 ? '#ef4444' : '#10b981')
        ),
        
        // Image Content
        hasImages 
            ? React.createElement(React.Fragment, null,
                // Missing Alt Text Section
                missingAltTextCount > 0 && React.createElement('div', { 
                    style: { 
                        backgroundColor: '#fff1f2', 
                        borderRadius: '6px', 
                        padding: '12px', 
                        marginBottom: '16px',
                        borderLeft: '3px solid #ef4444'
                    } 
                },
                    React.createElement('div', { 
                        style: { 
                            fontSize: '0.85rem', 
                            fontWeight: '600', 
                            marginBottom: '8px', 
                            color: '#dc2626' 
                        } 
                    }, 'Images Missing Alt Text:'),
                    React.createElement('ul', { 
                        style: { 
                            margin: 0, 
                            paddingLeft: '16px',
                            listStyleType: 'disc'
                        } 
                    },
                        missingAltTextImages.map((img, index) => 
                            React.createElement('li', { 
                                key: index, 
                                style: { 
                                    fontSize: '0.8rem', 
                                    color: '#4b5563', 
                                    marginBottom: index < missingAltTextImages.length - 1 ? '4px' : 0 
                                } 
                            },
                                React.createElement('a', { 
                                    href: img.src, 
                                    target: '_blank', 
                                    style: { color: '#2563eb', textDecoration: 'none' } 
                                }, getImageFileName(img.src))
                            )
                        )
                    )
                ),
                
                // All Images Table
                React.createElement('div', { 
                    style: { 
                        backgroundColor: '#f8fafc', 
                        borderRadius: '6px', 
                        padding: '12px' 
                    } 
                },
                    React.createElement('div', { 
                        style: { 
                            fontSize: '0.85rem', 
                            fontWeight: '600', 
                            marginBottom: '8px', 
                            color: '#64748b' 
                        } 
                    }, 'All Images'),
                    React.createElement('div', { 
                        style: { 
                            maxHeight: '300px', 
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
                                    backgroundColor: '#f8fafc' 
                                } 
                            },
                                React.createElement('tr', null,
                                    React.createElement('th', { 
                                        style: { 
                                            textAlign: 'left', 
                                            padding: '6px', 
                                            borderBottom: '1px solid #cbd5e1', 
                                            color: '#475569' 
                                        } 
                                    }, 'Image'),
                                    React.createElement('th', { 
                                        style: { 
                                            textAlign: 'left', 
                                            padding: '6px', 
                                            borderBottom: '1px solid #cbd5e1', 
                                            color: '#475569' 
                                        } 
                                    }, 'Alt Text'),
                                    React.createElement('th', { 
                                        style: { 
                                            textAlign: 'left', 
                                            padding: '6px', 
                                            borderBottom: '1px solid #cbd5e1', 
                                            color: '#475569' 
                                        } 
                                    }, 'Size')
                                )
                            ),
                            React.createElement('tbody', null,
                                images.map((img, index) => 
                                    React.createElement('tr', { key: index },
                                        React.createElement('td', { 
                                            style: { 
                                                padding: '6px', 
                                                borderBottom: '1px solid #e2e8f0', 
                                                color: '#4b5563' 
                                            } 
                                        },
                                            React.createElement('a', { 
                                                href: img.src, 
                                                target: '_blank', 
                                                style: { color: '#2563eb', textDecoration: 'none' } 
                                            }, getImageFileName(img.src))
                                        ),
                                        React.createElement('td', { 
                                            style: { 
                                                padding: '6px', 
                                                borderBottom: '1px solid #e2e8f0', 
                                                color: img.alt ? '#4b5563' : '#ef4444',
                                                fontStyle: img.alt ? 'normal' : 'italic'
                                            } 
                                        }, img.alt || 'Missing alt text'),
                                        React.createElement('td', { 
                                            style: { 
                                                padding: '6px', 
                                                borderBottom: '1px solid #e2e8f0', 
                                                color: '#4b5563' 
                                            } 
                                        }, 
                                            img.width && img.height ? `${img.width}×${img.height}` : 'Unknown'
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
            : React.createElement('div', { 
                style: { 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '6px', 
                    padding: '24px', 
                    textAlign: 'center' 
                } 
            },
                React.createElement('div', { 
                    style: { 
                        fontSize: '0.9rem', 
                        color: '#64748b', 
                        marginBottom: '8px' 
                    } 
                }, 'No images found on this page.'),
                React.createElement('div', { 
                    style: { 
                        fontSize: '0.8rem', 
                        color: '#94a3b8' 
                    } 
                }, 'Images are important for user engagement and SEO.')
            )
    );
};
