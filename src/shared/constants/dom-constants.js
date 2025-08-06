'use strict';

/**
 * Constants for DOM manipulation and comparison
 */

// Threshold for significant DOM changes
export const CHANGE_THRESHOLD = 3;

// DOM update threshold - process after only 2 significant DOM updates
export const DOM_UPDATE_THRESHOLD = 2;

// Debounce time for navigation events (in milliseconds)
export const NAVIGATION_DEBOUNCE_TIME = 800;

// Interval times for checking (in milliseconds)
export const FORCE_REFRESH_INTERVAL = 5000;
export const URL_WATCH_INTERVAL = 1000;
