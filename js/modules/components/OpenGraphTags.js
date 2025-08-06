'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component for displaying Open Graph tags
 * @param {Object} data - The page data containing Open Graph information
 * @returns {React.Element} - The Open Graph tags component
 */
export const OpenGraphTags = ({ data }) => {
    // Extract Open Graph data
    const ogData = data.openGraph || {};
    const hasOgData = Object.keys(ogData).length > 0;

    // Helper function to render a tag item
    const renderTagItem = (label, value) => {
        if (!value) return null;
        
        return React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' } },
            React.createElement('div', { style: { color: '#94a3b8', flex: '1' } }, label),
            React.createElement('div', { style: { color: '#e2e8f0', fontWeight: '500', flex: '2', wordBreak: 'break-word' } }, value)
        );
    };

    // Render the Open Graph tags section
    return React.createElement('div', { style: styles.cardSection },
        React.createElement('div', { style: styles.cardTitle }, 'Open Graph Tags'),
        hasOgData ? (
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
                renderTagItem('og:title', ogData.title),
                renderTagItem('og:description', ogData.description),
                renderTagItem('og:image', ogData.image),
                renderTagItem('og:url', ogData.url),
                renderTagItem('og:type', ogData.type),
                renderTagItem('og:site_name', ogData.siteName)
            )
        ) : (
            React.createElement('div', { style: { padding: '12px 0', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' } },
                'No Open Graph tags detected on this page.'
            )
        )
    );
};
