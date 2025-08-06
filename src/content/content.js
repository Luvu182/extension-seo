'use strict';

import { ContentController } from './content-controller.js';
import { logger } from '../shared/utils/logger.js';

/**
 * Main entry point for content script
 */
(function() {
  logger.info('content', 'Content script starting...');
  
  // Initialize controller
  const contentController = new ContentController();
  
  // Make controller available globally for debugging
  window.__seoAIAssistant = {
    contentController
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      contentController.initialize();
    });
  } else {
    // DOM already loaded
    contentController.initialize();
  }
  
  logger.info('content', 'Content script loaded');
})();
