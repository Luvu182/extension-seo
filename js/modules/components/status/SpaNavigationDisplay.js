'use strict';

import React from 'react';

// Import dependencies
import { RefreshButton } from './RefreshButton.js';
import { styles } from '../../styles.js';

/**
 * Component to display SPA navigation notifications
 * Shows different icons and messages based on the navigation state
 * 
 * @param {Object} props Component props
 * @param {Function} props.onRefresh Handler for refresh action
 * @param {Object} props.pageData Data about the current page with SPA flags
 * @returns {React.Element} The SPA navigation display component
 */
export const SpaNavigationDisplay = ({ onRefresh, pageData }) => {
  // Determine the current state
  const isFreshNavigation = pageData && pageData.freshSpaNavigation;
  const isUrlChanged = pageData && pageData.urlChanged;
  const isPartialData = pageData && pageData.partialData;
  const hasCompleteData = pageData && pageData.url && !pageData.error && 
    !isPartialData && !isFreshNavigation && !isUrlChanged;
  const hasError = pageData && pageData.error && !isUrlChanged;

  // Get navigation source information if available
  const spaSource = pageData?.navigationSource || '';

  // Create a user-friendly source description
  let sourceDescription = '';
  if (spaSource.includes('url_watcher')) {
    sourceDescription = 'URL change';
  } else if (spaSource.includes('mutation')) {
    sourceDescription = 'content change';
  } else if (spaSource.includes('popstate') || spaSource.includes('pushstate') || 
             spaSource.includes('replacestate')) {
    sourceDescription = 'navigation event';
  } else if (spaSource.includes('visibility_change')) {
    sourceDescription = 'tab visibility change';
  }

  // Determine background color based on state
  let bgColor = styles.colors.info; // Default
  if (isUrlChanged) {
    bgColor = styles.colors.warning;
  } else if (isFreshNavigation) {
    bgColor = styles.colors.warning;
  } else if (hasError) {
    bgColor = styles.colors.error;
  } else if (hasCompleteData) {
    bgColor = styles.colors.success;
  }

  // Container styles for centered display
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '250px',
    textAlign: 'center',
    padding: '0 20px'
  };

  // Icon styles
  const iconStyle = {
    fontSize: '48px',
    marginBottom: '20px'
  };

  // Message styles
  const messageStyle = {
    fontSize: '16px',
    color: 'white',
    marginBottom: '20px'
  };

  // Determine which icon to display based on the navigation state
  const icon = isUrlChanged ? '🔄' : 
               isFreshNavigation ? '⏳' : 
               isPartialData ? '🔄' : 
               hasError ? '⚠️' : 
               '✓';

  return React.createElement('div',
    { style: containerStyle },
    // Status icon
    React.createElement('div',
      { style: iconStyle },
      icon
    ),
    // Explanation text
    React.createElement('p',
      { style: messageStyle },
      'Dữ liệu đã thay đổi, cần làm mới để có dữ liệu chính xác'
    ),
    // Refresh button
    React.createElement(RefreshButton),
    // Simple spacer
    React.createElement('div', { style: { height: '10px' } }),
    // Skip button - allows user to continue with current data
    React.createElement('button', 
      { 
        style: {
          backgroundColor: 'transparent',
          border: '1px solid #64748b',
          color: '#64748b',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          marginTop: '8px'
        },
        onClick: () => {
          // Fire event to bypass SPA navigation warning
          document.dispatchEvent(new CustomEvent('spaNavigationComplete'));
          console.log('SPA navigation skipped by user');
        }
      },
      'Tiếp tục xem với dữ liệu hiện tại'
    )
  );
};