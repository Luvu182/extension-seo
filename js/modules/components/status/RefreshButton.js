'use strict';

import React from 'react';

/**
 * Reusable button component for refreshing the page
 * 
 * @param {Object} props Component props
 * @param {string} props.text Button text, defaults to 'Làm mới trang'
 * @param {Object} props.customStyle Additional styles to apply
 * @returns {React.Element} The refresh button component
 */
export const RefreshButton = ({ text = 'Làm mới trang', customStyle = {} }) => {
  // Default button style
  const defaultStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-block',
    cursor: 'pointer',
    display: 'inline-block'
    // Removed textAlign: 'center' as button text aligns center by default
  };

  /**
   * Handles click on the refresh button
   * Reloads the current active tab and closes the popup
   */
  const handleRefreshClick = () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        // Use chrome.tabs.reload to refresh the current tab
        chrome.tabs.reload(tabs[0].id, () => {
            // Optional: Add error handling for reload failure
            if (chrome.runtime.lastError) {
                console.error("Error reloading tab:", chrome.runtime.lastError.message);
            }
            // Close popup after attempting reload
            window.close(); 
        });
      } else {
         console.error("Could not get current tab ID to reload.");
         // Optionally close popup even if reload fails to start
         window.close();
      }
    });
  };

  // Render as a button again
  return React.createElement('button', {
    onClick: handleRefreshClick,
    style: { ...defaultStyle, ...customStyle }
  }, text);
};
