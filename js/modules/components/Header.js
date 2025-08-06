'use strict';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Header component for the extension popup
 * Displays logo, title, and action buttons
 * 
 * @param {Object} props Component props
 * @param {Function} props.onRefresh Handler for refresh button click
 * @param {Function} props.onSwitchTab Handler for settings button click
 * @param {boolean} props.isLoading Loading state indicator
 * @returns {React.Element} The header component
 */
export const Header = ({ onRefresh, onSwitchTab, isLoading }) => {
  // Logo SVG element
  const logoSvg = React.createElement('svg', 
    { 
      viewBox: '0 0 24 24', 
      width: '20', 
      height: '20', 
      fill: 'currentColor' 
    },
    React.createElement('path', 
      { 
        d: 'M13 10H7a1 1 0 000 2h6a1 1 0 100-2zm4-4H7a1 1 0 100 2h10a1 1 0 100-2zm0 8H7a1 1 0 000 2h10a1 1 0 000-2zm2-12H5a3 3 0 00-3 3v14a3 3 0 003 3h14a3 3 0 003-3V5a3 3 0 00-3-3zm1 17a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h14a1 1 0 011 1v14z' 
      }
    )
  );

  // Refresh button styles that change based on loading state
  const refreshButtonStyle = { 
    background: 'transparent', 
    border: 'none', 
    color: 'white', 
    cursor: isLoading ? 'default' : 'pointer', 
    padding: '4px', 
    marginRight: '8px', 
    opacity: isLoading ? 0.5 : 1 
  };

  // Settings button styles
  const settingsButtonStyle = { 
    background: 'transparent', 
    border: 'none', 
    color: 'white', 
    cursor: 'pointer', 
    padding: '4px' 
  };

  return React.createElement('div', 
    { style: styles.header },
    React.createElement('div', 
      { style: styles.headerFlex },
      // Logo and title
      React.createElement('div', 
        { style: styles.logoContainer },
        React.createElement('div', { style: styles.logoIcon }, logoSvg),
        React.createElement('div', { style: styles.headerTitle }, 'SEO AI Assistant')
      ),
      // Action buttons
      React.createElement('div', 
        null, 
        // Refresh button
        React.createElement('button', 
          {
            style: refreshButtonStyle, 
            title: 'Refresh Data',
            onClick: onRefresh,
            disabled: isLoading 
          }, 
          isLoading ? '⏳' : '🔄'
        ), 
        // Settings button
        React.createElement('button', 
          {
            style: settingsButtonStyle,
            title: 'Settings',
            onClick: () => onSwitchTab('settings')
          }, 
          '⚙️'
        )
      )
    )
  );
};