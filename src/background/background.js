'use strict';

import { StorageService } from './services/storage-service.js';
import { WebRequestController } from './controllers/web-request-controller.js';
import { NavigationController } from './controllers/navigation-controller.js';
import { MessageController } from './controllers/message-controller.js';
import { CleanupService } from './services/cleanup-service.js';
import { logger } from '../shared/utils/logger.js';

// Import all controller classes so they can be initialized properly
import { SeoDataController } from './controllers/seo-data-controller.js';
import { SpaNavigationController } from './controllers/spa-navigation-controller.js';
import { WebVitalsController } from './controllers/web-vitals-controller.js';
import { ServerInfoController } from './controllers/server-info-controller.js';
import { LinkCheckerController } from './controllers/link-checker-controller.js';
import { TabController } from './controllers/tab-controller.js';

/**
 * Global error handler for unhandled promise rejections
 */
function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  self.addEventListener('unhandledrejection', (event) => {
    logger.error('background', 'Unhandled Promise Rejection:', event.reason);
    // Prevent the error from showing in console
    event.preventDefault();
  });

  // Handle global errors
  self.addEventListener('error', (event) => {
    logger.error('background', 'Global Error:', event.error || event.message);
    // Prevent the error from showing in console
    event.preventDefault();
  });

  logger.info('background', 'Global error handlers set up');
}

/**
 * Background entry point - initializes all services and controllers
 */
async function initialize() {
  logger.info('background', 'Initializing background script...');

  try {
    // Set up global error handlers first
    setupGlobalErrorHandlers();

    // Initialize core services
    await StorageService.initialize();

    // Then initialize controllers
    WebRequestController.initialize();
    NavigationController.initialize();
    MessageController.initialize();

    // Note: Other controllers are initialized by MessageController

    // Setup periodic cleanup
    CleanupService.startPeriodicCleanup();

    logger.info('background', 'Background initialization complete');
  } catch (error) {
    logger.error('background', 'Error during initialization', error);
  }
}

// Start initialization immediately
initialize();
