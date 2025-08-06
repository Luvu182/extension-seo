'use strict';

import React from 'react';

import { styles } from '../../styles.js';

/**
 * StatItem - Displays a statistic with optional color indicator
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the stat
 * @param {string} props.value - Value to display
 * @param {string} [props.indicatorColor] - Optional color for value
 * @returns {React.Element} Rendered component
 */
export const StatItem = React.memo(({ label, value, indicatorColor = null }) => {
    return React.createElement('div', { style: styles.statItem },
        React.createElement('div', { style: styles.statLabel }, label),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
            indicatorColor && React.createElement('div', { 
                style: { 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: indicatorColor, 
                    marginRight: '6px' 
                } 
            }),
            React.createElement('div', { 
                style: { 
                    ...styles.statValue, 
                    color: indicatorColor || 'white' 
                } 
            }, value)
        )
    );
});