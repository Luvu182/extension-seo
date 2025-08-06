'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Navigation tabs component to switch between different sections
 * 
 * @param {Object} props Component props
 * @param {string} props.activeTab Currently active tab id
 * @param {Function} props.onSwitchTab Handler for tab click
 * @returns {React.Element} The navigation tabs component
 */
export const NavTabs = ({ activeTab, onSwitchTab }) => {
  // Tab configuration - icon, label, and id for each tab
  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'structured', icon: '🔧', label: 'Schema' },
    { id: 'links', icon: '🔗', label: 'Links' },
    { id: 'performance', icon: '⚡', label: 'Speed' },
    { id: 'content', icon: '📝', label: 'Content' },
    { id: 'issues', icon: '🔍', label: 'Issues' },
    { id: 'ai', icon: '🧠', label: 'AI' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return React.createElement('div', 
    { style: styles.navTabs },
    // Map each tab configuration to a button element
    tabs.map(tab => {
      // Determine style based on active state
      const tabStyle = tab.id === activeTab
        ? { ...styles.navTab, ...styles.navTabActive }
        : styles.navTab;
      
      return React.createElement('button', 
        {
          key: tab.id,
          style: tabStyle,
          onClick: () => onSwitchTab(tab.id) 
        },
        // Tab icon
        React.createElement('span', 
          { style: styles.tabIcon }, 
          tab.icon
        ),
        // Tab label
        React.createElement('span', 
          null, 
          tab.label
        )
      );
    })
  );
};