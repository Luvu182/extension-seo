'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component to display a SERP (Search Engine Results Page) preview
 * for the current page, including title, URL, and description with validation
 * 
 * @param {Object} props Component props
 * @param {Object} props.pageData Data about the current page
 * @param {boolean} props.isLoading Loading state indicator
 * @returns {React.Element} The SERP preview component
 */
export const SerpPreview = ({ pageData, isLoading }) => {
  const data = pageData || {}; // Start with empty object if no data
  
  // Display loading placeholders or actual data
  const url = isLoading ? 'Loading URL...' : (data.url || 'No URL found');
  const title = isLoading ? 'Loading Title...' : (data.title || 'No Title found');
  const description = isLoading ? 'Loading Description...' : (data.description || 'No Meta Description found');

  /**
   * Estimates the pixel width of text based on font size
   * This is a rough estimation for SERP preview truncation
   * 
   * @param {string} text Text to estimate width for
   * @param {number} fontSize Font size in pixels
   * @returns {number} Estimated width in pixels
   */
  const estimatePixelWidth = (text, fontSize) => text.length * fontSize * 0.6;
  
  // Constants for SERP display limits
  const MAX_TITLE_PIXELS = 512;
  const MAX_META_PIXELS = 1287;
  
  // Arrays to collect warnings
  const warnings = [];
  
  // Variables for potentially truncated display text
  let displayedTitle = title;
  let displayedDesc = description;

  // Title validation and truncation (only if not loading and title exists)
  if (!isLoading && title && title !== 'No Title found') {
    const titlePixels = Math.floor(estimatePixelWidth(title, 16));
    if (titlePixels > MAX_TITLE_PIXELS) {
      // Truncate title for display
      while (estimatePixelWidth(displayedTitle, 16) > MAX_TITLE_PIXELS && displayedTitle.length > 3) {
        displayedTitle = displayedTitle.substring(0, displayedTitle.length - 4) + '...';
      }
      
      // Add warning about title length
      warnings.push(React.createElement('div', 
        { key: 'title-warn', style: styles.serpWarning },
        React.createElement('span', null, '⚠️ '), 
        `Title too long (~${title.length} chars)`
      ));
    }
  }

  // Description validation and truncation (only if not loading)
  if (!isLoading) {
    if (description === 'No Meta Description found') {
      // Add warning about missing description
      warnings.push(React.createElement('div', 
        { key: 'desc-warn-missing', style: styles.serpWarning },
        React.createElement('span', null, '⚠️ '), 
        'Meta description not found.'
      ));
    } else if (description) {
      const descPixels = Math.floor(estimatePixelWidth(description, 13));
      if (descPixels > MAX_META_PIXELS) {
        // Truncate description for display
        while (estimatePixelWidth(displayedDesc, 13) > MAX_META_PIXELS && displayedDesc.length > 3) {
          displayedDesc = displayedDesc.substring(0, displayedDesc.length - 4) + '...';
        }
        
        // Add warning about description length
        warnings.push(React.createElement('div', 
          { key: 'desc-warn-long', style: styles.serpWarning },
          React.createElement('span', null, '⚠️ '), 
          `Meta description too long (~${description.length} chars)`
        ));
      }
    }
  }

  // Render the SERP preview
  return React.createElement('div', 
    { style: styles.serpPreview },
    // Title (as link)
    React.createElement('a', 
      { 
        style: styles.serpTitle, 
        href: '#', 
        onClick: (e) => e.preventDefault() 
      }, 
      displayedTitle
    ),
    // URL display
    React.createElement('div', 
      { style: styles.serpUrl }, 
      url
    ),
    // Description display
    React.createElement('div', 
      { style: styles.serpDescription }, 
      displayedDesc
    ),
    // Any warnings
    warnings
  );
};