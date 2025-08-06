'use strict';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './modules/components/App.js';
import { logger } from '../src/shared/utils/logger.js';

/**
 * Add animation styles from external CSS file
 */
function addAnimationStyles() {
  // Check if styles already exist to avoid duplicates
  if (!document.querySelector('link#animation-styles')) {
    // Create a link to an external stylesheet
    const linkElement = document.createElement('link');
    linkElement.id = 'animation-styles';
    linkElement.rel = 'stylesheet';
    linkElement.href = 'css/animations.css'; // Load from external file
    document.head.appendChild(linkElement);
    logger.info('popup', 'Added animations stylesheet link');
  }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    // Add animation styles before rendering React
    addAnimationStyles();
    
    // Render the main React app using React 18 API
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(App));
    logger.info('popup', 'Rendered main App component');
  } else {
    logger.error('popup', 'Root element not found for React rendering');
  }
});
