'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component for displaying content overview
 * @param {Object} data - The page data containing content information
 * @returns {React.Element} - The content overview component
 */
export const ContentOverview = ({ data }) => {
    // Extract content data
    const h1Count = data.headings?.h1?.length || 0;
    const h2Count = data.headings?.h2?.length || 0;
    const h3Count = data.headings?.h3?.length || 0;
    const h4PlusCount = (data.headings?.h4?.length || 0) + 
                        (data.headings?.h5?.length || 0) + 
                        (data.headings?.h6?.length || 0);
    const totalImages = data.images?.total || 0;
    const imagesWithoutAlt = data.images?.withoutAlt || 0;

    // Helper function to create a content item
    const createContentItem = (label, value) => {
        return React.createElement('div', { key: label, style: styles.statItem },
            React.createElement('div', { style: styles.statLabel }, label),
            React.createElement('div', { style: styles.statValue }, value.toString())
        );
    };

    // Render the content overview section
    return React.createElement('div', { style: styles.cardSection },
        React.createElement('div', { style: styles.cardTitle }, 'Content Overview'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' } },
            createContentItem('H1 Count', h1Count),
            createContentItem('H2 Count', h2Count),
            createContentItem('H3 Count', h3Count),
            createContentItem('H4+ Count', h4PlusCount),
            createContentItem('Total Images', totalImages),
            createContentItem('Images Missing Alt', imagesWithoutAlt)
        )
    );
};
