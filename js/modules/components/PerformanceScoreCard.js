'use strict';

import React from 'react';

// Import dependencies
import { styles } from '../styles.js';

/**
 * Component to display performance score summary
 * @param {Object} props - Component properties
 * @param {number} props.score - Performance score
 * @param {string} props.category - Performance category
 * @param {string} props.description - Performance description
 * @param {string} props.color - Score color
 * @returns {React.Element} - The PerformanceScoreCard component
 */
export const PerformanceScoreCard = ({ score, category, description, color }) => {
    // Handle numeric and non-numeric scores differently
    const isNumericScore = !isNaN(parseInt(score));
    
    return React.createElement('div', { style: { 
        backgroundColor: '#0f172a', 
        padding: '16px', 
        borderRadius: '8px', 
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    } },
        React.createElement('div', { style: { 
            width: '100px', 
            height: '100px', 
            position: 'relative',
            flexShrink: 0
        } },
            // Circle background - only show progress for numeric scores
            React.createElement('div', { style: {
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: isNumericScore 
                    ? `conic-gradient(${color} ${score}%, #1e293b ${score}%)`
                    : '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            } },
                // Inner circle (white space)
                React.createElement('div', { style: {
                    width: '80%',
                    height: '80%',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                } },
                    React.createElement('span', { style: {
                        fontSize: isNumericScore ? '1.75rem' : '1.5rem',
                        fontWeight: '700',
                        color: color
                    } }, score),
                    React.createElement('span', { style: {
                        fontSize: '0.6rem',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        marginTop: '-4px'
                    } }, isNumericScore ? 'score' : '')
                )
            )
        ),
        React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: color 
            } }, `Performance: ${category}`),
            React.createElement('div', { style: { 
                fontSize: '0.85rem', 
                lineHeight: '1.4', 
                color: '#e2e8f0' 
            } }, description)
        )
    );
};
