'use strict';

// Import dependencies
import { createElement } from '../utils.js'; // Adjust path as needed

// Fallback renderer for tab modules that might be missing or under development
export function fallbackRenderer(tabName) {
  return function(data) {
    return createElement('div', {
      padding: '20px',
      textAlign: 'center'
    }, `Tab ${tabName} đang được phát triển...`);
  };
}

// Note: The original logic ensured all tab namespaces existed.
// With ES Modules, imports handle this. If a module is missing,
// the import in popup.js will fail, which is a clearer indication.
// This file might be used later to re-export all tab renderers
// for cleaner imports in popup.js, but for now, we just export the fallback.
