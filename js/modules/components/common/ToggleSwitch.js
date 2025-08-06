'use strict';

import React from 'react';

import { styles } from '../../styles.js';

/**
 * ToggleSwitch - A reusable toggle switch component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOn - Whether the switch is currently on
 * @param {Function} props.handleToggle - Function to call when the switch is toggled
 * @param {string} props.labelOn - Text label when the switch is on
 * @param {string} props.labelOff - Text label when the switch is off
 * @param {string} [props.id] - Optional ID for accessibility
 * @param {Object} [props.labelStyle] - Optional style object for the label
 * @returns {React.Element} Rendered component
 */
export const ToggleSwitch = React.memo(({ isOn, handleToggle, labelOn, labelOff, id, labelStyle: customLabelStyle }) => {
    const switchId = id || `toggle-switch-${React.useId()}`;

    const switchStyle = {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        marginBottom: '12px', // Add some margin below
    };

    const trackStyle = {
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        backgroundColor: isOn ? '#3b82f6' : '#cbd5e1', // Blue when on, gray when off
        position: 'relative',
        transition: 'background-color 0.2s ease-in-out',
        marginRight: '8px',
    };

    const thumbStyle = {
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: 'white',
        position: 'absolute',
        top: '2px',
        left: isOn ? '18px' : '2px', // Move thumb based on state
        transition: 'left 0.2s ease-in-out',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    };

    const labelStyle = {
        fontSize: '0.8rem',
        color: '#475569',
        userSelect: 'none', // Prevent text selection on click
    };

    // Merge default label style with custom style if provided
    const finalLabelStyle = { ...labelStyle, ...customLabelStyle };

    return React.createElement('div', { 
        style: switchStyle, 
        onClick: handleToggle,
        role: 'switch',
        'aria-checked': isOn,
        'aria-labelledby': `${switchId}-label`,
        tabIndex: 0, // Make it focusable
        onKeyDown: (e) => { if (e.key === ' ' || e.key === 'Enter') handleToggle(); } // Allow toggle with space/enter
    },
        React.createElement('div', { style: trackStyle },
            React.createElement('div', { style: thumbStyle })
        ),
        // Apply the final merged style to the label span
        React.createElement('span', { id: `${switchId}-label`, style: finalLabelStyle }, isOn ? labelOn : labelOff)
    );
});
