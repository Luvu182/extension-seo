'use strict';

/**
 * Enhanced logging utility for the extension
 * Provides consistent logging with module prefixes and optional severity levels
 */
export const logger = {
  /**
   * Log an informational message
   * @param {string} module - The module name
   * @param {string} message - The message to log
   * @param {*} data - Optional data to log
   */
  info(module, message, data) {
    const formattedMessage = `[${module}] ${message}`;
    if (data !== undefined) {
      console.log(formattedMessage, data);
    } else {
      console.log(formattedMessage);
    }
  },

  /**
   * Log a warning message
   * @param {string} module - The module name
   * @param {string} message - The message to log
   * @param {*} data - Optional data to log
   */
  warn(module, message, data) {
    const formattedMessage = `[${module}] WARNING: ${message}`;
    if (data !== undefined) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  },

  /**
   * Log an error message
   * @param {string} module - The module name
   * @param {string} message - The message to log
   * @param {*} error - Optional error to log
   */
  error(module, message, error) {
    const formattedMessage = `[${module}] ERROR: ${message}`;
    if (error !== undefined) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  },

  /**
   * Log a debug message (only in development)
   * @param {string} module - The module name
   * @param {string} message - The message to log
   * @param {*} data - Optional data to log
   */
  debug(module, message, data) {
    // Only log in development mode
    if (process.env.NODE_ENV !== 'production') {
      const formattedMessage = `[${module}] DEBUG: ${message}`;
      if (data !== undefined) {
        console.debug(formattedMessage, data);
      } else {
        console.debug(formattedMessage);
      }
    }
  }
};
