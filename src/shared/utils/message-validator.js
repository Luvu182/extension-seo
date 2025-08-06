'use strict';

import { MESSAGE_TYPES } from '../constants.js';

/**
 * Message validation utility for secure message passing
 */
export class MessageValidator {
  /**
   * Validate message structure and sender
   * @param {Object} message - The message to validate
   * @param {Object} sender - The sender information
   * @param {Object} options - Validation options
   * @returns {Object} - Validation result { valid: boolean, error?: string }
   */
  static validate(message, sender, options = {}) {
    // Check message exists and has action
    if (!message || typeof message !== 'object') {
      return { valid: false, error: 'Invalid message format' };
    }

    if (!message.action || typeof message.action !== 'string') {
      return { valid: false, error: 'Missing or invalid action' };
    }

    // Validate sender
    if (!sender || typeof sender !== 'object') {
      return { valid: false, error: 'Invalid sender' };
    }

    // Check sender is from our extension
    if (sender.id !== chrome.runtime.id) {
      return { valid: false, error: 'Unauthorized sender' };
    }

    // For tab-based messages, validate tab info
    if (options.requireTab && (!sender.tab || !sender.tab.id || typeof sender.tab.id !== 'number')) {
      return { valid: false, error: 'Invalid or missing tab information' };
    }

    // Validate specific message types
    switch (message.action) {
      case MESSAGE_TYPES.GET_SEO_DATA:
        return this.validateGetSeoData(message);
      
      case MESSAGE_TYPES.FETCH_SERVER:
        return this.validateFetchServer(message);
      
      case MESSAGE_TYPES.CHECK_LINK:
        return this.validateCheckLink(message);
      
      case MESSAGE_TYPES.CHECK_MULTIPLE_LINKS:
        return this.validateCheckMultipleLinks(message);
      
      case MESSAGE_TYPES.CONTENT_UPDATE:
        return this.validateContentUpdate(message);
      
      case MESSAGE_TYPES.WEB_VITALS_RESULT:
        return this.validateWebVitalsResult(message);
        
      case MESSAGE_TYPES.CLEAR_SPA_DATA:
        return this.validateClearSpaData(message);
        
      default:
        // For other message types, just ensure basic structure
        return { valid: true };
    }
  }

  /**
   * Validate GET_SEO_DATA message
   */
  static validateGetSeoData(message) {
    if (message.tabId && typeof message.tabId !== 'number') {
      return { valid: false, error: 'Invalid tabId' };
    }
    
    if (message.url && typeof message.url !== 'string') {
      return { valid: false, error: 'Invalid url' };
    }

    return { valid: true };
  }

  /**
   * Validate FETCH_SERVER message
   */
  static validateFetchServer(message) {
    if (!message.url || typeof message.url !== 'string') {
      return { valid: false, error: 'Missing or invalid url' };
    }

    // Basic URL validation
    try {
      new URL(message.url);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }

    return { valid: true };
  }

  /**
   * Validate CHECK_LINK message
   */
  static validateCheckLink(message) {
    if (!message.url || typeof message.url !== 'string') {
      return { valid: false, error: 'Missing or invalid url' };
    }

    if (message.timeout && typeof message.timeout !== 'number') {
      return { valid: false, error: 'Invalid timeout' };
    }

    return { valid: true };
  }

  /**
   * Validate CHECK_MULTIPLE_LINKS message
   */
  static validateCheckMultipleLinks(message) {
    if (!message.urls || !Array.isArray(message.urls)) {
      return { valid: false, error: 'Missing or invalid urls array' };
    }

    if (message.urls.length === 0) {
      return { valid: false, error: 'Empty urls array' };
    }

    // Validate each URL
    for (const url of message.urls) {
      if (typeof url !== 'string') {
        return { valid: false, error: 'Invalid URL in array' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate CONTENT_UPDATE message
   */
  static validateContentUpdate(message) {
    if (!message.data || typeof message.data !== 'object') {
      return { valid: false, error: 'Missing or invalid data' };
    }

    if (!message.data.url || typeof message.data.url !== 'string') {
      return { valid: false, error: 'Missing or invalid url in data' };
    }

    if (message.timestamp && typeof message.timestamp !== 'number') {
      return { valid: false, error: 'Invalid timestamp' };
    }

    return { valid: true };
  }

  /**
   * Validate WEB_VITALS_RESULT message
   */
  static validateWebVitalsResult(message) {
    if (!message.data || typeof message.data !== 'object') {
      return { valid: false, error: 'Missing or invalid data' };
    }

    const { name, value } = message.data;
    
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Missing or invalid metric name' };
    }

    if (typeof value !== 'number' || value < 0) {
      return { valid: false, error: 'Invalid metric value' };
    }

    const validMetrics = ['lcp', 'fid', 'cls', 'ttfb', 'fcp'];
    if (!validMetrics.includes(name)) {
      return { valid: false, error: 'Unknown metric name' };
    }

    return { valid: true };
  }

  /**
   * Validate CLEAR_SPA_DATA message  
   */
  static validateClearSpaData(message) {
    if (!message.tabId || typeof message.tabId !== 'number') {
      return { valid: false, error: 'Missing or invalid tabId' };
    }

    return { valid: true };
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitize(input) {
    if (typeof input !== 'string') return input;
    
    // Remove dangerous characters and scripts
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }
}