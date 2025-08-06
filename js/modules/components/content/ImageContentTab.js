'use strict';

import React from 'react';

import { styles } from '../../styles.js';
import { StatItem } from '../common/StatItem.js';
import { ImageAnalysisService } from '../../tabs/content-tab.js';
import { ImageIssueCard } from '../content/ImageIssueCard.js';
import { ImageTable } from '../content/ImageTable.js';
import { ToggleSwitch } from '../common/ToggleSwitch.js'; // Import ToggleSwitch
// Corrected import path for messaging again
import { messaging } from '../../../../src/shared/utils/messaging.js'; 
import { store } from '../../store.js'; // Import store to get current URL

/**
 * ImageContentTab - Displays image content analysis
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Page data to analyze
 * @param {boolean} props.includeHeaderFooter - Whether to include header/footer images
 * @param {Function} props.toggleHeaderFooter - Function to toggle header/footer inclusion
 * @returns {React.Element} Rendered component
 */
export const ImageContentTab = React.memo(({ data, includeHeaderFooter, toggleHeaderFooter }) => {
    // Get the appropriate image data based on includeHeaderFooter state
    let images;
    let imageStats;
    
    if (includeHeaderFooter) {
        images = Array.isArray(data.images) ? data.images : [];
        imageStats = data.imageStats || {
            total: images.length,
            withAlt: 0,
            withoutAlt: 0,
            nonOptimizedFilenames: 0
        };
    } else {
        images = Array.isArray(data.contentOnlyImages) ? data.contentOnlyImages : [];
        imageStats = (data.imageStats && data.imageStats.contentOnly) || {
            total: images.length,
            withAlt: 0,
            withoutAlt: 0
        };
    }
    
    // Removed duplicate declarations below
    // const hasImages = images.length > 0;
    // const missingAltTextCount = imageStats.withoutAlt || 0;
    // const nonOptimizedFilenamesCount = imageStats.nonOptimizedFilenames || 
    //     (hasImages ? images.filter(img => img.hasNonOptimizedFilename).length : 0);
    // const missingAltTextImages = hasImages ? images.filter(img => !img.alt && !img.hasAlt) : [];
    // const nonOptimizedFilenameImages = hasImages ? images.filter(img => img.hasNonOptimizedFilename) : [];

    // Get ALL images from data (assuming dom-utils provides them with context)
    const allImages = data?.images || []; 

    // Filter images based on the toggle state *within* this component
    const imagesToDisplay = React.useMemo(() => {
        if (includeHeaderFooter) {
            return allImages; // Show all if toggle is on
        } else {
            // Filter for images with context 'content' if toggle is off
            return allImages.filter(img => img.context === 'content');
        }
    }, [allImages, includeHeaderFooter]);

    // Recalculate stats based on the *currently displayed* images
    const displayedImageStats = React.useMemo(() => {
        const total = imagesToDisplay.length;
        const withAlt = imagesToDisplay.filter(img => img.hasAlt).length;
        const withoutAlt = total - withAlt;
        const nonOptimizedFilenames = imagesToDisplay.filter(img => img.hasNonOptimizedFilename).length;
        return { total, withAlt, withoutAlt, nonOptimizedFilenames };
    }, [imagesToDisplay]);

    // Use the recalculated stats and examples based on imagesToDisplay
    const hasImages = imagesToDisplay.length > 0; // Use recalculated hasImages
    const missingAltTextCount = displayedImageStats.withoutAlt; // Use recalculated count
    const nonOptimizedFilenamesCount = displayedImageStats.nonOptimizedFilenames; // Use recalculated count
    const missingAltTextImages = imagesToDisplay.filter(img => !img.alt && !img.hasAlt); // Use examples from displayed images
    const nonOptimizedFilenameImages = imagesToDisplay.filter(img => img.hasNonOptimizedFilename); // Use examples from displayed images
    
    // State for tracking image size checking progress
    const [isCheckingSizes, setIsCheckingSizes] = React.useState(false);
    const [checkedCount, setCheckedCount] = React.useState(0);
    const [totalToCheck, setTotalToCheck] = React.useState(0);

    // Function to handle the "Check Image Sizes" button click
    const handleCheckImageSizes = React.useCallback(async () => {
        const imagesToCheck = allImages.filter(img => img.src && img.fileSize === null);
        if (imagesToCheck.length === 0) {
            console.log('[ImageContentTab] No images need size checking.');
            return;
        }

        // Get current tab ID first
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0 || !tabs[0].id) {
            console.error('[ImageContentTab] Could not get active tab ID.');
            setIsCheckingSizes(false);
            return;
        }
        const currentTabId = tabs[0].id;

        setIsCheckingSizes(true);
        setCheckedCount(0);
        setTotalToCheck(imagesToCheck.length);
        console.log(`[ImageContentTab] Starting size check for ${imagesToCheck.length} images on tab ${currentTabId}.`);

        const BATCH_SIZE = 10;
        const DELAY_BETWEEN_BATCHES = 500; // ms delay between sending batches
        const currentUrl = store.getStateSlice('pageData')?.url; // Get current URL for context

        if (!currentUrl) {
             console.error('[ImageContentTab] Cannot get current URL from store.');
             setIsCheckingSizes(false);
             return;
        }

        for (let i = 0; i < imagesToCheck.length; i += BATCH_SIZE) {
            const batch = imagesToCheck.slice(i, i + BATCH_SIZE);
            console.log(`[ImageContentTab] Sending batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} images)`);
            
            try {
                // Send batch to background, including tabId
                await messaging.sendToBackground({
                    action: 'process_images_for_size',
                    images: batch.map(img => ({ src: img.src })), // Send only src
                    originalUrl: currentUrl,
                    tabId: currentTabId // Explicitly send tabId
                });
                // Note: We don't directly update checkedCount here.
                // The UI relies on the store listener detecting storage changes.
                // We could potentially add a progress update message from background if needed.
            } catch (error) {
                console.error(`[ImageContentTab] Error sending batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
            }

            // Wait before sending the next batch (if any)
            if (i + BATCH_SIZE < imagesToCheck.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }

        // Optionally set checking state back to false after a delay, 
        // assuming background processing takes time. Or rely on UI updates.
        // setTimeout(() => setIsCheckingSizes(false), 2000); // Example delay
        console.log(`[ImageContentTab] Finished sending all batches.`);
        // Keep isCheckingSizes true until UI reflects completion? Or set false?
        // Let's set it false after a short delay to allow background processing to start
        setTimeout(() => setIsCheckingSizes(false), 1000); 

    }, [allImages]); // Dependency on allImages

    // Removed duplicate declarations below
    // const hasImages = imagesToDisplay.length > 0;
    // const missingAltTextCount = displayedImageStats.withoutAlt;
    // const nonOptimizedFilenamesCount = displayedImageStats.nonOptimizedFilenames;
    // const missingAltTextImages = imagesToDisplay.filter(img => !img.alt && !img.hasAlt);
    // const nonOptimizedFilenameImages = imagesToDisplay.filter(img => img.hasNonOptimizedFilename);


    return React.createElement(React.Fragment, null,
        // Image Analysis Section
        React.createElement('div', { style: styles.cardSection },
             // Title only container (Toggle Switch removed again)
             React.createElement('div', { 
                style: { 
                    marginBottom: '16px' 
                } 
            },
                    React.createElement('div', { style: styles.cardTitle }, 'Image Analysis')
                    // Button removed from here, will be passed to ImageTable
            ),

            // Image Stats (using recalculated stats)
            React.createElement('div', { style: { ...styles.gridStats, marginBottom: '16px' } },
                React.createElement(StatItem, { 
                    label: 'Total Images', 
                    // Use stats based on displayed images
                    value: hasImages ? displayedImageStats.total.toString() : '0' 
                }),
                React.createElement(StatItem, { 
                    label: 'Missing Alt Text', 
                    // Use stats based on displayed images
                    value: `${missingAltTextCount} (${hasImages ? Math.round((missingAltTextCount / displayedImageStats.total) * 100) : 0}%)`, 
                    indicatorColor: missingAltTextCount > 0 ? '#ef4444' : '#10b981'
                }),
                React.createElement(StatItem, { 
                    label: 'Non-Optimized Filenames', 
                    // Use stats based on displayed images
                    value: `${nonOptimizedFilenamesCount} (${hasImages ? Math.round((nonOptimizedFilenamesCount / displayedImageStats.total) * 100) : 0}%)`, 
                    indicatorColor: nonOptimizedFilenamesCount > 0 ? '#f59e0b' : '#10b981'
                })
            ),
            
            // Image Issues (using recalculated issue counts and examples)
            (missingAltTextCount > 0 || nonOptimizedFilenamesCount > 0) && 
            React.createElement('div', { style: { marginTop: '16px' } },
                // Missing Alt Text Issues
                missingAltTextCount > 0 && React.createElement(ImageIssueCard, {
                    issueType: 'missing-alt',
                    count: missingAltTextCount, // Use recalculated count
                    images: missingAltTextImages.slice(0, 3), // Use examples from displayed images
                    totalCount: missingAltTextImages.length // Use total from displayed images
                }),

                // Non-Optimized Filename Issues
                nonOptimizedFilenamesCount > 0 && React.createElement(ImageIssueCard, {
                    issueType: 'non-optimized-filename',
                    count: nonOptimizedFilenamesCount, // Use recalculated count
                    images: nonOptimizedFilenameImages.slice(0, 3), // Use examples from displayed images
                    totalCount: nonOptimizedFilenameImages.length // Use total from displayed images
                })
            ),
            
            // All Images Table or Empty State (passing ALL images and toggle props)
            hasImages 
                ? React.createElement(ImageTable, { 
                    images: allImages, 
                    includeHeaderFooter: includeHeaderFooter, 
                    toggleHeaderFooter: toggleHeaderFooter,
                    // Pass down props needed for the button
                    onCheckSizes: handleCheckImageSizes, 
                    isCheckingSizes: isCheckingSizes,
                    hasUncheckedImages: allImages.some(img => img.fileSize === null) // Pass flag if check is needed
                  }) 
                : React.createElement('div', { 
                    style: { 
                        backgroundColor: '#f8fafc', 
                        borderRadius: '6px', 
                        padding: '24px', 
                        textAlign: 'center',
                        marginTop: '16px'
                    } 
                },
                    React.createElement('div', { 
                        style: { 
                            fontSize: '0.9rem', 
                            color: '#64748b', 
                            marginBottom: '8px' 
                        } 
                    }, includeHeaderFooter ? 'No images found on this page.' : 'No images found in the main content area.'), // Adjusted empty state message
                    React.createElement('div', { 
                        style: { 
                            fontSize: '0.8rem', 
                            color: '#94a3b8' 
                        } 
                    }, 'Images are important for user engagement and SEO.')
                )
            // Toggle Switch removed from here (it's back at the top)
        )
    );
});
