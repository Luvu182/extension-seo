'use strict';

import React from 'react';

// Import dependencies
import { RefreshButton } from './RefreshButton.js';

/**
 * Component to display network error notification
 * 
 * @param {Object} props Component props
 * @param {string} props.message Custom error message
 * @returns {React.Element} The network error display component
 */
export const NetworkErrorDisplay = ({ message = 'Dữ liệu đã thay đổi, cần làm mới để có dữ liệu chính xác' }) => {
  // Container styles for centered error display
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '250px',
    textAlign: 'center',
    padding: '0 20px'
  };

  // Icon styles with animation
  const iconStyle = {
    fontSize: '48px',
    marginBottom: '20px',
    animation: 'fadeIn 0.5s ease-out'
  };

  // Text styles
  const textStyle = {
    fontSize: '16px',
    color: 'white',
    marginBottom: '20px'
  };

  return React.createElement('div',
    { style: containerStyle },
    // Warning icon
    React.createElement('div',
      { style: iconStyle },
      '⚠️'
    ),
    // Error message
    React.createElement('p',
      { style: textStyle },
      message
    ),
    // Refresh button
    React.createElement(RefreshButton)
  );
};