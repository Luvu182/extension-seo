'use strict';

import { styles } from '../../styles.js';

/**
 * Component to display link count cards
 * @param {Object} props - Component props
 * @param {Object} props.counts - Object containing link counts
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Function to call when tab changes
 * @returns {React.Element} Rendered component
 */
export const LinkCountCards = ({ counts, activeTab, onTabChange }) => {
    // Render link count card helper
    const renderLinkCountCard = (label, value, isActive = false) => {
        const cardStyle = {
            ...styles.cardSection,
            ...(isActive ? { borderLeft: '3px solid #60a5fa' } : {})
        };
        
        return React.createElement('div', { 
            key: label, 
            style: cardStyle,
            onClick: () => onTabChange(label.toLowerCase()),
            onMouseEnter: (e) => {
                e.currentTarget.style.cursor = 'pointer';
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            },
            onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            }
        },
            React.createElement('div', { style: { fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' } }, label),
            React.createElement('div', { style: { fontSize: '1.125rem', fontWeight: 'bold', color: 'white' } }, value.toString())
        );
    };

    return React.createElement('div', { 
        style: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
            gap: '8px' 
        } 
    },
        renderLinkCountCard('All', counts.all, activeTab === 'all'),
        renderLinkCountCard('Internal', counts.internal, activeTab === 'internal'),
        renderLinkCountCard('External', counts.external, activeTab === 'external'),
        renderLinkCountCard('Nofollow', counts.nofollow, activeTab === 'nofollow')
    );
};
