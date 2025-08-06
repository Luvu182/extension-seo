'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Footer component for the extension popup
 * Displays credits and branding information
 * 
 * @returns {React.Element} The footer component
 */
export const Footer = () => {
  return React.createElement('div', 
    { style: styles.footer },
    React.createElement('div', 
      { style: styles.footerText }, 
      'SEO Assistant • Powered by SEO ON TOP'
    )
  );
};